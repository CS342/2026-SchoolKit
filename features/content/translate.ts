// Translated versions — build a version in another language from a human translation
// of an existing version. The structure (blocks, icons, colors, images, links) is copied
// exactly; only reader-visible text changes. The AI's only job is to say which passage of
// the translation corresponds to each source text — it never writes text itself, and
// everything it returns is checked against the translation file.
// Pure: no React Native imports, safe for the editor and tests.
import i18n from '../../lib/i18n';
import type { ContentDoc, TranslationSource } from './types';
import type { ContentLanguage } from './audience';
import type { Notice } from './lint';
import { NON_TEXT_KEYS, normalizeText, checkFidelity } from './fidelity';

export type SlotPath = (string | number)[];

export interface TextSlot {
  /** Short id used in the AI request ("s1", "s2", …) — positional, this run only. */
  id: string;
  /** Stable key that survives other blocks being added or moved: the block id, then
   *  field names, with list items named by their id. Used for change tracking. */
  key: string;
  /** Where the text lives in the doc. */
  path: SlotPath;
  text: string;
  /** The block it belongs to (undefined for page-level text such as the title). */
  blockId?: string;
  /** What the text is, for the AI ("hero.subtitle", "accordion.items.summary"). */
  hint: string;
}

/** Page-level fields readers see. */
const DOC_TEXT_KEYS = ['title', 'shareMessage'] as const;

/** Every reader-visible text in the doc, in page order. */
export function textSlots(doc: ContentDoc): TextSlot[] {
  const slots: TextSlot[] = [];
  const add = (path: SlotPath, key: string, text: string, hint: string, blockId?: string) => {
    if (text.trim()) slots.push({ id: `s${slots.length + 1}`, key, path, text, blockId, hint });
  };
  for (const k of DOC_TEXT_KEYS) {
    const v = doc[k];
    if (typeof v === 'string') add([k], `page.${k}`, v, `page ${k}`);
  }
  doc.blocks.forEach((block, bi) => {
    const walk = (v: unknown, path: SlotPath, key: string, hint: string, field?: string) => {
      if (field && NON_TEXT_KEYS.has(field)) return;
      if (typeof v === 'string') { add(path, key, v, hint, block.id); return; }
      if (Array.isArray(v)) {
        v.forEach((x, i) => {
          const itemId = x && typeof x === 'object' && typeof (x as any).id === 'string' ? (x as any).id : String(i);
          const accent = block.type === 'hero' && field === 'titleParts' && (x as any)?.accent ? ' (highlighted part of the title)' : '';
          walk(x, [...path, i], `${key}[${itemId}]`, `${hint}${accent}`);
        });
        return;
      }
      if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) walk(x, [...path, k], `${key}.${k}`, field === undefined && path.length === 2 ? `${block.type}.${k}` : `${hint}.${k}`, k);
      }
    };
    walk(block, ['blocks', bi], block.id, block.type);
  });
  return slots;
}

/** A copy of `doc` with the text at each slot replaced. Slots without a value keep
 *  their original text. */
export function applySlots(doc: ContentDoc, slots: TextSlot[], values: Record<string, string | null | undefined>): ContentDoc {
  const copy = JSON.parse(JSON.stringify(doc)) as ContentDoc;
  for (const slot of slots) {
    const value = values[slot.id];
    if (typeof value !== 'string') continue;
    let target: any = copy;
    for (const step of slot.path.slice(0, -1)) target = target[step];
    target[slot.path[slot.path.length - 1]] = value;
  }
  return copy;
}

// ─── Change tracking ──────────────────────────────────────────────────────────

/** Short, stable fingerprint of a text (FNV-1a, 32-bit, hex). Not cryptographic —
 *  it only has to notice that a text changed. */
export function textHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** What a translated version records about the version it was made from. */
export function translationSource(sourcePageId: string, sourceDoc: ContentDoc): TranslationSource {
  const textHashes: Record<string, string> = {};
  for (const s of textSlots(sourceDoc)) textHashes[s.key] = textHash(s.text);
  return { pageId: sourcePageId, textHashes };
}

/** Source texts that are new or changed since the translation was made, and how many
 *  texts were removed. Empty when the translation is up to date. */
export function staleTexts(source: TranslationSource, currentSourceDoc: ContentDoc): { changed: TextSlot[]; removed: number } {
  const current = textSlots(currentSourceDoc);
  const changed = current.filter((s) => source.textHashes[s.key] !== textHash(s.text));
  const keys = new Set(current.map((s) => s.key));
  const removed = Object.keys(source.textHashes).filter((k) => !keys.has(k)).length;
  return { changed, removed };
}

// ─── Alignment (AI request + checks) ──────────────────────────────────────────

const LANGUAGE_NAMES: Record<ContentLanguage, string> = { en: 'English', es: 'Spanish' };

/** At most this many texts go into one alignment request. */
export const MAX_SLOTS_PER_REQUEST = 90;

/** Messages asking the model to align `slots` (English) with `translation`. */
export function buildAlignMessages(slots: TextSlot[], translation: string, language: ContentLanguage): { role: 'system' | 'user'; content: string }[] {
  const lang = LANGUAGE_NAMES[language];
  const system = [
    `You align a professional ${lang} translation with the English web page it translates.`,
    `You get TEXTS — numbered strings from the English page, in page order, each with a hint saying what it is — and TRANSLATION, the translator's full ${lang} text of the page.`,
    `For every text id, return the passage of TRANSLATION that translates that text.`,
    'Rules:',
    `- Copy the translation's words EXACTLY. Never translate, correct, rephrase, shorten or add words yourself — the translator's wording is final.`,
    '- Keep the English text\'s markdown: where it has **bold**, *italic*, list markers ("- ", "1. "), headings ("## ") or links [text](url), put the same marks on the corresponding translated words, keep each URL unchanged, and keep the same line breaks between list items.',
    '- TRANSLATION usually follows page order. Headings, labels and short card titles are translated too — find them even when they are short.',
    '- Consecutive "hero.titleParts" texts are pieces of one title. Split the translated title across them in order; the piece marked "highlighted" gets the words that correspond to it.',
    '- Names, numbers, URLs and email addresses the translation leaves as they are: copy them as they appear in TRANSLATION.',
    '- If TRANSLATION has no passage for a text, return null for it. Do not invent one.',
    'Return ONLY a JSON object: {"texts": {"s1": "…", "s2": null, …}} with every id given.',
  ].join('\n');
  const list = slots.map((s) => `${s.id} [${s.hint}]: ${JSON.stringify(s.text)}`).join('\n');
  const user = `TEXTS:\n${list}\n\nTRANSLATION:\n"""\n${translation}\n"""`;
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}

/** The model's answer as id → text (null when it found no passage). Ids it skipped are null. */
export function parseAlignResult(result: unknown, slots: TextSlot[]): Record<string, string | null> {
  const texts = result && typeof result === 'object' ? (result as any).texts : undefined;
  const out: Record<string, string | null> = {};
  for (const s of slots) {
    const v = texts && typeof texts === 'object' ? texts[s.id] : undefined;
    out[s.id] = typeof v === 'string' && v.trim() ? v : null;
  }
  return out;
}

const URL_IN_MARKDOWN = /\]\(([^)\s]+)\)/g;
const urlsIn = (s: string) => [...s.matchAll(URL_IN_MARKDOWN)].map((m) => m[1]);
/** Text with letters in it (not just "100%", "504", an emoji). */
const hasWords = (s: string) => /\p{L}{2,}/u.test(s);

export interface AlignmentReport {
  /** Texts with no passage in the translation — they keep the source text. */
  untranslated: TextSlot[];
  /** Texts whose returned passage isn't in the translation file word for word. */
  notInFile: { slot: TextSlot; text: string }[];
  /** Texts that lost a link URL the source text has. */
  lostLinks: TextSlot[];
  /** Sentences of the translation that aren't anywhere on the new page. */
  unused: string[];
}

/**
 * Check an alignment against the translation file: every returned passage must be in the
 * file (so nothing the model wrote itself gets through), links must survive, and every
 * sentence of the file should land somewhere on the page.
 */
export function checkAlignment(slots: TextSlot[], values: Record<string, string | null>, translatedDoc: ContentDoc, translation: string): AlignmentReport {
  const fileNorm = ` ${normalizeText(translation)} `;
  const report: AlignmentReport = { untranslated: [], notInFile: [], lostLinks: [], unused: [] };
  for (const slot of slots) {
    const value = values[slot.id];
    if (value === null || value === undefined) {
      // A number or symbol the translation simply repeats isn't missing anything.
      if (hasWords(slot.text)) report.untranslated.push(slot);
      continue;
    }
    const n = normalizeText(value);
    if (n && !fileNorm.includes(` ${n} `)) report.notInFile.push({ slot, text: value });
    const valueUrls = new Set(urlsIn(value));
    if (urlsIn(slot.text).some((u) => !valueUrls.has(u))) report.lostLinks.push(slot);
  }
  // Each line of a translation file stands alone (headings, list items, paragraphs) —
  // don't join consecutive lines the way PDF text is joined, or a short heading gets
  // glued to the paragraph after it.
  report.unused = checkFidelity(translatedDoc, [translation.split('\n').join('\n\n')]).missing;
  return report;
}

/** True when the report found nothing to review. */
export const alignmentIsClean = (r: AlignmentReport) =>
  !r.untranslated.length && !r.notInFile.length && !r.lostLinks.length && !r.unused.length;

// ─── Checks-panel notices ─────────────────────────────────────────────────────

const quote = (s: string, max = 80) => {
  const flat = s.replace(/\s+/g, ' ').trim();
  return `“${flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat}”`;
};

/** What to review on a freshly made translated version, for the editor's checks panel. */
export function alignmentNotices(report: AlignmentReport, fileName: string): Notice[] {
  const t = (key: string, opts?: Record<string, unknown>) => i18n.t(`editor.translate.notices.${key}`, opts);
  const notices: Notice[] = [];
  for (const slot of report.untranslated.slice(0, 8)) {
    notices.push({ message: t('untranslated', { text: quote(slot.text), file: fileName }), fix: t('untranslatedFix'), blockId: slot.blockId });
  }
  if (report.untranslated.length > 8) notices.push({ message: t('untranslatedMore', { count: report.untranslated.length - 8 }), fix: t('untranslatedFix') });
  for (const { slot, text } of report.notInFile.slice(0, 8)) {
    notices.push({ message: t('notInFile', { text: quote(text), file: fileName }), fix: t('notInFileFix'), blockId: slot.blockId });
  }
  for (const slot of report.lostLinks.slice(0, 5)) {
    notices.push({ message: t('lostLink', { text: quote(slot.text) }), fix: t('lostLinkFix'), blockId: slot.blockId });
  }
  if (report.unused.length) {
    const shown = report.unused.slice(0, 3).map((s) => quote(s)).join(' · ');
    const more = report.unused.length > 3 ? t('andMore', { count: report.unused.length - 3 }) : '';
    notices.push({ message: t('unused', { count: report.unused.length, file: fileName, shown, more }), fix: t('unusedFix') });
  }
  return notices;
}

/** Notices for a translation whose source changed since it was made. */
export function staleNotices(stale: { changed: TextSlot[]; removed: number }): Notice[] {
  const t = (key: string, opts?: Record<string, unknown>) => i18n.t(`editor.translate.stale.${key}`, opts);
  const notices: Notice[] = stale.changed.slice(0, 6).map((slot) => ({
    message: t('changed', { text: quote(slot.text) }),
    fix: t('changedFix'),
  }));
  if (stale.changed.length > 6) notices.push({ message: t('changedMore', { count: stale.changed.length - 6 }), fix: t('changedFix') });
  if (stale.removed) notices.push({ message: t('removed', { count: stale.removed }), fix: t('removedFix') });
  return notices;
}
