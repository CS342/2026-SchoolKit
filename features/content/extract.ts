// Native fallback for document → text extraction. The content editor is web/admin
// only, so these are never reached; Metro resolves extract.web.ts on web. Kept as
// no-ops so the browser-only extraction libs stay out of the native bundle.
export async function extractPdfText(_file: File, _maxChars: number): Promise<string> {
  return '';
}
export async function extractDocxText(_file: File, _maxChars: number): Promise<string> {
  return '';
}
export async function extractXlsxText(_file: File, _maxChars: number): Promise<string> {
  return '';
}
export async function extractOpenDocumentText(_file: File, _maxChars: number): Promise<string> {
  return '';
}
