// Pure URL helpers shared by the document extractors, the upload pipeline, and the AI
// client. No deps — safe to import anywhere (web, native, node tests).

export interface LinkRef {
  url: string;
  /** Display name — the markdown/anchor label when known, else the hostname. */
  name: string;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL = /\bhttps?:\/\/[^\s)<>"'\]]+/g;

/** Find links in free text: markdown `[label](url)` (keeps the label) and bare URLs.
 *  De-duped by URL; trailing sentence punctuation is trimmed off bare URLs. */
export function extractUrls(text: string): LinkRef[] {
  if (!text) return [];
  const out: LinkRef[] = [];
  const seen = new Set<string>();
  const add = (rawUrl: string, label?: string) => {
    const url = rawUrl.replace(/[.,;:!?)\]]+$/, '');
    if (!/^https?:\/\/\S+\.\S+/i.test(url) || seen.has(url)) return;
    seen.add(url);
    out.push({ url, name: (label && label.trim()) || hostnameOf(url) });
  };
  let m: RegExpExecArray | null;
  MD_LINK.lastIndex = 0;
  while ((m = MD_LINK.exec(text))) add(m[2], m[1]); // markdown first → keeps labels
  BARE_URL.lastIndex = 0;
  while ((m = BARE_URL.exec(text))) add(m[0]); // bare URLs (dupes of the above are skipped)
  return out;
}

/** De-duplicate a link list by URL, preserving first-seen order and filling missing names. */
export function dedupeLinks(links: LinkRef[]): LinkRef[] {
  const seen = new Set<string>();
  const out: LinkRef[] = [];
  for (const l of links) {
    if (!l?.url || seen.has(l.url)) continue;
    seen.add(l.url);
    out.push({ url: l.url, name: l.name || hostnameOf(l.url) });
  }
  return out;
}
