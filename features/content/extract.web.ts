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

export interface Extracted { text: string; links: LinkRef[] }
const clamp = (s: string, maxChars: number) => s.slice(0, maxChars).trim();

/** PDF → text + links (from link annotations and bare URLs in the text). */
export async function extractPdfText(file: File, maxChars: number): Promise<Extracted> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts: string[] = [];
  const links: LinkRef[] = [];
  let total = 0;
  for (let p = 1; p <= pdf.numPages && total < maxChars; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    parts.push(text);
    total += text.length;
    try {
      const anns = await page.getAnnotations();
      for (const a of anns as any[]) {
        const url = a?.url || a?.unsafeUrl;
        if (a?.subtype === 'Link' && typeof url === 'string' && /^https?:\/\//i.test(url)) {
          links.push({ url, name: hostnameOf(url) });
        }
      }
    } catch { /* annotations are best-effort */ }
  }
  const text = clamp(parts.join('\n\n'), maxChars);
  return { text, links: dedupeLinks([...links, ...extractUrls(text)]) };
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
