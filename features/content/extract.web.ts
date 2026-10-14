// Web-only document → text extraction for the content AI. Everything here is
// statically imported (Metro's dynamic import() doesn't resolve in Expo's static web
// output) and kept in a `.web.ts` module so these browser-only libs never enter the
// native bundle. The native sibling (extract.ts) is a no-op — the editor is web only.
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// pdfjs needs a worker; load it from a CDN pinned to the installed version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const clamp = (s: string, maxChars: number) => s.slice(0, maxChars).trim();

/** PDF → text. Returns '' for scanned/image-only PDFs (no text layer). */
export async function extractPdfText(file: File, maxChars: number): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts: string[] = [];
  let total = 0;
  for (let p = 1; p <= pdf.numPages && total < maxChars; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    parts.push(text);
    total += text.length;
  }
  return clamp(parts.join('\n\n'), maxChars);
}

/** Word .docx → plain text via mammoth's browser build. */
export async function extractDocxText(file: File, maxChars: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return clamp(result.value ?? '', maxChars);
}

/** Excel .xlsx → CSV text, one labelled block per sheet. */
export async function extractXlsxText(file: File, maxChars: number): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const wb = XLSX.read(data, { type: 'array' });
  const parts = wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    return `# Sheet: ${name}\n${csv}`;
  });
  return clamp(parts.join('\n\n'), maxChars);
}

/** OpenDocument (.odp/.odt/.ods) → text. These are zips; read content.xml and strip tags. */
export async function extractOpenDocumentText(file: File, maxChars: number): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file('content.xml');
  if (!entry) return '';
  const xml = await entry.async('string');
  const text = xml
    // paragraph / heading / line-break / slide boundaries → newlines
    .replace(/<\/text:(p|h)>/g, '\n')
    .replace(/<text:line-break\s*\/>/g, '\n')
    .replace(/<\/draw:page>/g, '\n\n')
    .replace(/<[^>]+>/g, '') // strip remaining tags
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return clamp(text, maxChars);
}
