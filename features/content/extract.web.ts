// Web-only document → { text, links } extraction for the content AI. Everything here is
// statically imported (Metro's dynamic import() doesn't resolve in Expo's static web
// output) and kept in a `.web.ts` module so these browser-only libs never enter the
// native bundle. The native sibling (extract.ts) is a no-op — the editor is web only.
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { extractUrls, dedupeLinks, hostnameOf, LinkRef } from './links';

// pdfjs needs a worker; load it from a CDN pinned to the installed version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/** `pageImages` (PDF only): downscaled JPEG data URLs of the first few pages, sent to
 *  the vision model so it can see the document's layout — never placed on the page. */
export interface Extracted { text: string; links: LinkRef[]; pageImages?: string[] }
const clamp = (s: string, maxChars: number) => s.slice(0, maxChars).trim();

// Page snapshots: enough for the model to read layout, small enough to stay well under
// the edge function's prompt-size cap (~60–100 KB of base64 per page at these settings).
const PDF_SNAPSHOT_PAGES = 4;
const PDF_SNAPSHOT_MAX_DIM = 900;
const PDF_SNAPSHOT_QUALITY = 0.6;

interface PdfLine { text: string; size: number; y: number }

/** Rebuild visual lines from pdf.js text items (which are arbitrary fragments): a new
 *  line starts on a baseline change or an explicit EOL; a space is inserted between
 *  fragments only when there's a horizontal gap (pdf.js often splits mid-word). */
function pdfLines(items: any[]): PdfLine[] {
  const lines: PdfLine[] = [];
  let cur: (PdfLine & { endX: number }) | null = null;
  for (const it of items) {
    if (!('str' in it)) continue;
    const [a, b, c, d, x, y] = it.transform as number[];
    const size = Math.hypot(c, d) || Math.hypot(a, b) || it.height || 0;
    if (cur && Math.abs(y - cur.y) > Math.max(2, size * 0.5)) { lines.push(cur); cur = null; }
    if (it.str) {
      if (!cur) cur = { text: '', size, y, endX: x };
      const gap = x - cur.endX;
      if (cur.text && gap > size * 0.15 && !cur.text.endsWith(' ') && !it.str.startsWith(' ')) cur.text += ' ';
      cur.text += it.str;
      cur.size = Math.max(cur.size, size);
      cur.endX = x + (it.width ?? 0);
    }
    if (it.hasEOL && cur) { lines.push(cur); cur = null; }
  }
  if (cur) lines.push(cur);
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text);
}

/** The dominant (body) font size — the size covering the most characters. */
function bodySize(lines: PdfLine[]): number {
  const weight = new Map<number, number>();
  for (const l of lines) {
    const k = Math.round(l.size * 2) / 2;
    weight.set(k, (weight.get(k) ?? 0) + l.text.length);
  }
  let best = 0, bestW = -1;
  for (const [k, w] of weight) if (w > bestW) { best = k; bestW = w; }
  return best || 12;
}

/** Lines → markdown-ish text: noticeably larger short lines become # headings (level
 *  by size), a large vertical gap starts a new paragraph, other lines keep their breaks. */
function pdfLinesToText(lines: PdfLine[], body: number): string {
  const out: string[] = [];
  let prev: PdfLine | null = null;
  for (const l of lines) {
    const ratio = l.size / body;
    const isHeading = ratio >= 1.15 && l.text.length <= 120;
    const gap = prev ? prev.y - l.y : 0; // PDF y grows upward
    const newPara = !prev || isHeading || gap > Math.max(l.size, prev.size) * 1.7 || gap < 0;
    if (newPara && out.length) out.push('');
    out.push(isHeading ? `${ratio >= 1.6 ? '#' : ratio >= 1.35 ? '##' : '###'} ${l.text}` : l.text);
    if (isHeading) out.push('');
    prev = l;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

async function renderPdfPage(page: any): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(2, PDF_SNAPSHOT_MAX_DIM / Math.max(base.width, base.height || 1));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/jpeg', PDF_SNAPSHOT_QUALITY);
}

/** PDF → structured text (lines, paragraphs, size-inferred # headings) + links (link
 *  annotations and bare URLs) + snapshots of the first pages for the vision model. */
export async function extractPdfText(file: File, maxChars: number): Promise<Extracted> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: PdfLine[][] = [];
  const links: LinkRef[] = [];
  const pageImages: string[] = [];
  let total = 0;
  for (let p = 1; p <= pdf.numPages && total < maxChars; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = pdfLines(content.items as any[]);
    pages.push(lines);
    total += lines.reduce((n, l) => n + l.text.length + 1, 0);
    try {
      const anns = await page.getAnnotations();
      for (const a of anns as any[]) {
        const url = a?.url || a?.unsafeUrl;
        if (a?.subtype === 'Link' && typeof url === 'string' && /^https?:\/\//i.test(url)) {
          links.push({ url, name: hostnameOf(url) });
        }
      }
    } catch { /* annotations are best-effort */ }
    if (p <= PDF_SNAPSHOT_PAGES) {
      try {
        const img = await renderPdfPage(page);
        if (img) pageImages.push(img);
      } catch { /* snapshots are best-effort; the text still carries the content */ }
    }
  }
  // Body size is computed over the whole document so headings are judged consistently.
  const body = bodySize(pages.flat());
  const text = clamp(pages.map((lines) => pdfLinesToText(lines, body)).join('\n\n'), maxChars);
  return { text, links: dedupeLinks([...links, ...extractUrls(text)]), pageImages };
}

/** Word .docx → markdown text (keeps links inline as [label](url)) + the extracted links. */
export async function extractDocxText(file: File, maxChars: number): Promise<Extracted> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToMarkdown({ arrayBuffer });
  const text = clamp(result.value ?? '', maxChars);
  return { text, links: extractUrls(text) };
}

/** Excel .xlsx → CSV text, one labelled block per sheet, + any URLs in cells. */
export async function extractXlsxText(file: File, maxChars: number): Promise<Extracted> {
  const data = new Uint8Array(await file.arrayBuffer());
  const wb = XLSX.read(data, { type: 'array' });
  const parts = wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    return `# Sheet: ${name}\n${csv}`;
  });
  const text = clamp(parts.join('\n\n'), maxChars);
  return { text, links: extractUrls(text) };
}

/** OpenDocument (.odp/.odt/.ods) → text + links (xlink:href attrs + bare URLs). */
export async function extractOpenDocumentText(file: File, maxChars: number): Promise<Extracted> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file('content.xml');
  if (!entry) return { text: '', links: [] };
  const xml = await entry.async('string');
  const hrefLinks: LinkRef[] = [];
  for (const m of xml.matchAll(/xlink:href="(https?:\/\/[^"]+)"/g)) hrefLinks.push({ url: m[1], name: hostnameOf(m[1]) });
  const text = clamp(
    xml
      // paragraph / heading / line-break / slide boundaries → newlines
      .replace(/<\/text:(p|h)>/g, '\n')
      .replace(/<text:line-break\s*\/>/g, '\n')
      .replace(/<\/draw:page>/g, '\n\n')
      .replace(/<[^>]+>/g, '') // strip remaining tags
      .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
    maxChars,
  );
  return { text, links: dedupeLinks([...hrefLinks, ...extractUrls(text)]) };
}
