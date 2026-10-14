// File attachments for the content AI (web/admin only — the editor is web-gated).
//
// Flow: the user attaches images / PDFs / text files. Images are downscaled in the
// browser and sent to gpt-4o as base64 vision input so it can *see* them; PDFs and
// text files are extracted to text and sent as context. Nothing is stored yet.
//
// Storage is deferred: after the AI responds, `resolveUploadedImages` scans the
// output for an image's placeholder token and uploads to the `content-images`
// bucket ONLY the images the AI actually placed on the page (swapping the token for
// the real public URL). Reference-only images are never persisted.
import { nanoid } from 'nanoid/non-secure';
import { supabase } from '../../lib/supabase';
import { extractPdfText, extractDocxText, extractXlsxText, extractOpenDocumentText } from './extract';

/** The `accept` list for the file picker — single source of truth for both call sites. */
export const UPLOAD_ACCEPT =
  'image/*,.pdf,.docx,.xlsx,.odp,.odt,.ods,' +
  '.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.yaml,.yml,.log,' +
  '.js,.jsx,.ts,.tsx,.py,.java,.c,.h,.cpp,.cs,.go,.rb,.rs,.sh,.css';

/** An image the user attached but we haven't stored. `file` is the original (used if
 *  placed); `dataUrl` is a downscaled JPEG for vision; `token` is what the AI echoes. */
export interface ImageAttachment {
  kind: 'image';
  id: string;
  token: string;
  name: string;
  dataUrl: string;
  file: File;
}

/** Text extracted from a PDF or text file, sent to the AI as reference context. */
export interface TextAttachment {
  kind: 'text';
  id: string;
  name: string;
  text: string;
}

export type Attachment = ImageAttachment | TextAttachment;

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw cap
const MAX_TEXT_CHARS = 40_000; // per-document cap, keeps us under the edge fn char limit
const IMAGE_MAX_DIM = 1024; // downscale target for vision
const IMAGE_QUALITY = 0.72;

const isWeb = typeof document !== 'undefined';

/** Open the OS file picker and resolve the chosen files. Web only. */
export function pickFiles(accept: string, multiple = true): Promise<File[]> {
  if (!isWeb) return Promise.resolve([]);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = 'none';
    let settled = false;
    const done = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.onchange = () => done(input.files ? Array.from(input.files) : []);
    // If the dialog is cancelled there is no reliable event; resolve empty on next focus.
    window.addEventListener('focus', () => setTimeout(() => done([]), 300), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Downscale an image file to a base64 JPEG data URL for vision input. */
async function downscaleToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, IMAGE_MAX_DIM / Math.max(img.width, img.height || 1));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const ext = (file: File) => (file.name.split('.').pop() || '').toLowerCase();

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}
function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || ext(file) === 'pdf';
}
function isDocx(file: File): boolean {
  return ext(file) === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
function isXlsx(file: File): boolean {
  return ext(file) === 'xlsx' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}
function isOpenDocument(file: File): boolean {
  return ['odp', 'odt', 'ods'].includes(ext(file)) || file.type.startsWith('application/vnd.oasis.opendocument');
}
function isText(file: File): boolean {
  return (
    file.type.startsWith('text/') ||
    /\.(txt|md|markdown|csv|tsv|json|html?|xml|ya?ml|log|jsx?|tsx?|py|java|c|h|cpp|cs|go|rb|rs|sh|css)$/i.test(file.name)
  );
}

/** Turn a picked file into an Attachment, or an error message. */
export async function processFile(file: File): Promise<Attachment | { error: string }> {
  if (file.size > MAX_FILE_BYTES) {
    return { error: `${file.name} is too large (max 15 MB).` };
  }
  try {
    if (isImage(file)) {
      const dataUrl = await downscaleToDataUrl(file);
      const id = nanoid(6);
      return { kind: 'image', id, token: `upload://${id}`, name: file.name, dataUrl, file };
    }
    if (isPdf(file)) {
      const text = await extractPdfText(file, MAX_TEXT_CHARS);
      if (!text) return { error: `Couldn't read text from ${file.name} (it may be a scanned PDF).` };
      return { kind: 'text', id: nanoid(6), name: file.name, text };
    }
    if (isDocx(file)) {
      const text = await extractDocxText(file, MAX_TEXT_CHARS);
      if (!text) return { error: `Couldn't read any text from ${file.name}.` };
      return { kind: 'text', id: nanoid(6), name: file.name, text };
    }
    if (isXlsx(file)) {
      const text = await extractXlsxText(file, MAX_TEXT_CHARS);
      if (!text) return { error: `${file.name} has no readable cells.` };
      return { kind: 'text', id: nanoid(6), name: file.name, text };
    }
    if (isOpenDocument(file)) {
      const text = await extractOpenDocumentText(file, MAX_TEXT_CHARS);
      if (!text) return { error: `Couldn't read text from ${file.name}.` };
      return { kind: 'text', id: nanoid(6), name: file.name, text };
    }
    if (isText(file)) {
      const text = (await readAsText(file)).slice(0, MAX_TEXT_CHARS).trim();
      if (!text) return { error: `${file.name} is empty.` };
      return { kind: 'text', id: nanoid(6), name: file.name, text };
    }
    return { error: `${file.name}: unsupported file type.` };
  } catch (e: any) {
    return { error: `Couldn't read ${file.name}: ${e?.message ?? 'unknown error'}` };
  }
}

/** Upload one image to the content-images bucket and return its public URL. */
export async function uploadContentImage(file: File, userId: string): Promise<{ url: string } | { error: string }> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${userId}/${Date.now()}-${nanoid(5)}.${ext}`;
  const { error } = await supabase.storage
    .from('content-images')
    .upload(path, file, { contentType: file.type || 'image/png', upsert: false });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from('content-images').getPublicUrl(path);
  return { url: data.publicUrl };
}

function deepReplaceStrings<T>(value: T, map: Record<string, string>): T {
  if (typeof value === 'string') return (map[value] ?? value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => deepReplaceStrings(v, map)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>)) {
      out[k] = deepReplaceStrings((value as Record<string, unknown>)[k], map);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Deferred storage: for each image attachment whose token the AI actually placed in
 * `output` (a ContentDoc or an Op[]), upload the original to `content-images` and swap
 * the token for the public URL. Images the AI only used as reference are never stored.
 */
export async function resolveUploadedImages<T>(
  output: T,
  attachments: Attachment[],
  userId: string,
): Promise<{ output: T; errors: string[] }> {
  const images = attachments.filter((a): a is ImageAttachment => a.kind === 'image');
  if (!images.length) return { output, errors: [] };

  const serialized = JSON.stringify(output);
  const map: Record<string, string> = {};
  const errors: string[] = [];

  for (const img of images) {
    if (!serialized.includes(img.token)) continue; // not placed → never stored
    const res = await uploadContentImage(img.file, userId);
    if ('error' in res) {
      errors.push(`Couldn't upload ${img.name}: ${res.error}`);
      continue;
    }
    map[img.token] = res.url;
  }

  if (!Object.keys(map).length) return { output, errors };
  return { output: deepReplaceStrings(output, map), errors };
}
