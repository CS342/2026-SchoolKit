// Source fidelity — does a page generated from the author's files contain their text,
// word for word, and nothing a reader would take for content that isn't in them?
// The model is told to preserve source text, but can't be trusted to; this checks.
// Pure: no React Native imports, safe for the editor and tests.
//
// Comparison ignores case, punctuation, emoji and markdown, so "though: kids" and
// "though, kids" match, but a dropped clause or a paraphrase doesn't.
import type { ContentBlock, ContentDoc } from './types';

export interface FidelityReport {
  /** Source sentences that aren't on the page, in source wording and order. */
  missing: string[];
  /** Page sentences that aren't in the source, with the block they're in. */
  invented: { text: string; blockId: string }[];
  /** Share of checked source sentences found on the page, 0–1. */
  coverage: number;
}

/** Sentences shorter than this (in words) aren't checked for being missing — labels
 *  like "The Facts:" are often turned into structure rather than copied. */
const MIN_SOURCE_WORDS = 4;
/** Page text shorter than this isn't flagged as invented — short headings, labels and
 *  card titles the layout needs. */
const MIN_INVENTED_WORDS = 8;

/** Block fields that are settings, not reader-visible text. */
export const NON_TEXT_KEYS = new Set([
  'id', 'type', 'icon', 'eyebrowIcon', 'eyebrowColor', 'color', 'tone', 'accent', 'url', 'href',
  'resourceIds', 'ranked', 'variant', 'layout', 'style', 'align', 'size', 'kind',
  'display', // a link's domain label ("acco.org")
]);

export function normalizeText(s: string): string {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links → their text
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ]+/g, ' ') // drop punctuation, emoji, markdown marks
    .replace(/\s+/g, ' ')
    .trim();
}

const wordCount = (s: string) => (s ? s.split(' ').length : 0);

/**
 * Source text → sentences. Headings and list items stand alone; other consecutive
 * lines are joined first (PDF extraction breaks lines mid-sentence).
 */
export function splitSentences(text: string): string[] {
  const units: string[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) units.push(para.join(' ')); para = []; };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (/^(#{1,6}\s|[-*•]\s|\d+[.)]\s|---)/.test(line)) { flush(); units.push(line.replace(/^(#{1,6}|[-*•]|\d+[.)])\s+/, '')); continue; }
    para.push(line);
  }
  flush();
  return units
    .flatMap((u) => u.replace(/([.!?])\s+(?=\S)/g, '$1\n').split('\n'))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Every reader-visible string on the page, with the block it belongs to. */
export function pageTexts(doc: ContentDoc): { blockId: string; text: string }[] {
  const out: { blockId: string; text: string }[] = [];
  const walk = (v: unknown, blockId: string, key?: string) => {
    if (key && NON_TEXT_KEYS.has(key)) return;
    if (typeof v === 'string') { if (v.trim()) out.push({ blockId, text: v }); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, blockId)); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, blockId, k);
  };
  for (const b of doc.blocks) {
    // Hero title parts read as one string ("Coping with " + "Fatigue").
    if (b.type === 'hero') {
      out.push({ blockId: b.id, text: ((b as any).titleParts ?? []).map((p: any) => p.text).join('') });
      walk({ ...b, titleParts: undefined }, b.id);
    } else {
      walk(b, b.id);
    }
  }
  return out;
}

export function checkFidelity(doc: ContentDoc, sources: string[]): FidelityReport {
  const sourceNorm = ` ${normalizeText(sources.join('\n'))} `;
  const texts = pageTexts(doc);
  const pageNorm = ` ${texts.map((t) => normalizeText(t.text)).join(' ')} `;

  const seen = new Set<string>();
  let checked = 0;
  const missing: string[] = [];
  for (const sentence of sources.flatMap(splitSentences)) {
    const n = normalizeText(sentence);
    if (wordCount(n) < MIN_SOURCE_WORDS || seen.has(n)) continue;
    seen.add(n);
    checked++;
    if (!pageNorm.includes(` ${n} `)) missing.push(sentence);
  }

  const invented: FidelityReport['invented'] = [];
  for (const t of texts) {
    for (const sentence of splitSentences(t.text)) {
      const n = normalizeText(sentence);
      if (wordCount(n) >= MIN_INVENTED_WORDS && !sourceNorm.includes(` ${n} `)) invented.push({ text: sentence, blockId: t.blockId });
    }
  }

  return { missing, invented, coverage: checked ? (checked - missing.length) / checked : 1 };
}

/**
 * On a page converted from the author's files, a SchoolKit guide list (resourceRefList)
 * keeps only guides the files name — by title — and is dropped when none are named.
 * Without this the AI adds a "Related Guides" section of its own picking.
 */
export function keepSourceNamedGuides(doc: ContentDoc, sources: string[], guideTitles: Map<string, string>): ContentDoc {
  const sourceNorm = ` ${normalizeText(sources.join('\n'))} `;
  const named = (id: string) => {
    const title = guideTitles.get(id);
    return !!title && sourceNorm.includes(` ${normalizeText(title)} `);
  };
  let changed = false;
  const blocks = doc.blocks.flatMap((b): ContentBlock[] => {
    if (b.type !== 'resourceRefList') return [b];
    const kept = b.resourceIds.filter(named);
    if (kept.length === b.resourceIds.length) return [b];
    changed = true;
    return kept.length ? [{ ...b, resourceIds: kept }] : [];
  });
  return changed ? { ...doc, blocks } : doc;
}

const quote = (s: string, max = 90) => `“${s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s}”`;

/** Checks-panel notices for what a repair pass couldn't fix. */
export function fidelityNotices(report: FidelityReport, sourceName: string): { message: string; fix: string; blockId?: string }[] {
  const notices: { message: string; fix: string; blockId?: string }[] = [];
  if (report.missing.length) {
    const shown = report.missing.slice(0, 3).map((s) => quote(s)).join(' · ');
    const more = report.missing.length > 3 ? ` (and ${report.missing.length - 3} more)` : '';
    notices.push({
      message: `${report.missing.length} sentence${report.missing.length === 1 ? '' : 's'} from ${sourceName} ${report.missing.length === 1 ? "isn't" : "aren't"} on the page: ${shown}${more}`,
      fix: 'Add them to the block for their section, or ask AI: "Add the missing text from my file, word for word."',
    });
  }
  for (const inv of report.invented.slice(0, 5)) {
    notices.push({
      message: `This text isn't in ${sourceName}: ${quote(inv.text)}`,
      fix: 'Replace it with wording from your file, or delete it.',
      blockId: inv.blockId,
    });
  }
  return notices;
}
