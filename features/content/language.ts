// Detect whether source text is English or Spanish — used to prefill a generated page's
// language from the author's file, so a Spanish page isn't saved as English. Only a
// prefill/backstop: the author can change it (dialogs, Page settings).
// Pure: no React Native imports, safe for the editor and tests.
import type { ContentLanguage } from './audience';

// Very common function words, chosen so none is a word in both languages ("a", "no",
// "me", "son" and "come" are left out).
const EN_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'is', 'you', 'that', 'it', 'for', 'are', 'on', 'with', 'as', 'be',
  'this', 'your', 'can', 'or', 'have', 'not', 'at', 'by', 'an', 'they', 'from', 'we', 'will', 'if',
  'their', 'about', 'do', 'what', 'more', 'so', 'but', 'when', 'how', 'who', 'which', 'there',
  'was', 'has', 'been', 'would', 'should', 'could', 'may', 'help', 'child', 'school', 'it\'s', 'don\'t',
]);
const ES_WORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una', 'unos', 'unas', 'es', 'por',
  'para', 'con', 'su', 'sus', 'al', 'lo', 'como', 'más', 'pero', 'le', 'les', 'ya', 'este', 'esta',
  'estos', 'estas', 'porque', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'puede', 'pueden', 'usted', 'ustedes', 'tu',
  'tus', 'qué', 'cómo', 'está', 'están', 'ser', 'hijo', 'hija', 'niño', 'niña', 'escuela', 'ayuda',
]);

/** Fewer recognized words than this and we don't guess. */
const MIN_HITS = 12;
/** The winning language needs this many times the other's hits. */
const MIN_RATIO = 2;

/** 'en' or 'es' when the text is clearly one of them, else undefined. */
export function detectLanguage(text: string): ContentLanguage | undefined {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  let en = 0;
  let es = 0;
  for (const w of words) {
    if (EN_WORDS.has(w)) en++;
    if (ES_WORDS.has(w)) es++;
  }
  // Spanish-only punctuation and letters are strong evidence.
  es += (text.match(/[¿¡ñ]/gi) ?? []).length * 2;
  if (en + es < MIN_HITS) return undefined;
  if (es >= en * MIN_RATIO) return 'es';
  if (en >= es * MIN_RATIO) return 'en';
  return undefined;
}

/** A doc stores English as "no language" so older pages stay unchanged. */
export const storedLanguage = (language: ContentLanguage | undefined): ContentLanguage | undefined =>
  language === 'en' ? undefined : language;
