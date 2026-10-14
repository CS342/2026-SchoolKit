// Native fallback for document → { text, links } extraction. The content editor is
// web/admin only, so these are never reached; Metro resolves extract.web.ts on web.
// Kept as no-ops so the browser-only extraction libs stay out of the native bundle.
import type { LinkRef } from './links';

export interface Extracted { text: string; links: LinkRef[] }
const EMPTY: Extracted = { text: '', links: [] };

export async function extractPdfText(_file: File, _maxChars: number): Promise<Extracted> { return EMPTY; }
export async function extractDocxText(_file: File, _maxChars: number): Promise<Extracted> { return EMPTY; }
export async function extractXlsxText(_file: File, _maxChars: number): Promise<Extracted> { return EMPTY; }
export async function extractOpenDocumentText(_file: File, _maxChars: number): Promise<Extracted> { return EMPTY; }
