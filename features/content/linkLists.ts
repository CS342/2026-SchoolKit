// Lists of outside links always become an External links (linkList) block. The AI is
// told to do this but sometimes leaves them as markdown links inside a Text block, so
// versions of one topic came out with different structures. Pure; keeps every word —
// the list's intro line becomes the block heading, and any text around the list stays
// in Text blocks before and after it.
import type { ContentDoc, ContentBlock, ColorToken, LinkItem } from './types';
import { hostnameOf } from './links';

/** "- [Name](https://…)" optionally followed by " — description" (or "-" / ":"). */
const LINK_LINE = /^\s*(?:[-*•]|\d+[.)])\s+\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*(?:[-–—:]\s*(.+))?$/;
const MIN_LINKS = 2;
const COLORS: ColorToken[] = ['teal', 'sky', 'coral', 'amber', 'indigo', 'primary'];
const FALLBACK_HEADING = 'Learn more';

const stripHeading = (line: string) =>
  line.trim().replace(/^#{1,6}\s+/, '').replace(/^\*\*(.+)\*\*$/, '$1').replace(/^__(.+)__$/, '$1').trim();

/** A short line that introduces what follows: a markdown heading, a bold line, or a
 *  line ending in ":" ("Want to learn more? Check out these great resources:"). */
function isIntroLine(line: string): boolean {
  const t = stripHeading(line);
  if (!t || t.split(/\s+/).length > 20) return false;
  return /^#{1,6}\s/.test(line.trim()) || /^(\*\*|__).+(\*\*|__)$/.test(line.trim()) || t.endsWith(':');
}

/** The first run of MIN_LINKS+ link-only list lines (blank lines allowed between). */
function findLinkRun(lines: string[]): { start: number; end: number } | null {
  for (let i = 0; i < lines.length; i++) {
    if (!LINK_LINE.test(lines[i])) continue;
    let count = 0;
    let last = i;
    let j = i;
    for (; j < lines.length && (LINK_LINE.test(lines[j]) || !lines[j].trim()); j++) {
      if (LINK_LINE.test(lines[j])) { count++; last = j; }
    }
    if (count >= MIN_LINKS) return { start: i, end: last };
    i = j;
  }
  return null;
}

export function linkListsFromText(doc: ContentDoc): ContentDoc {
  const ids = new Set(doc.blocks.map((b) => b.id));
  const uid = (base: string) => {
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    return id;
  };

  const split = (b: ContentBlock): ContentBlock[] => {
    if (b.type !== 'richText') return [b];
    const rich = b as Extract<ContentBlock, { type: 'richText' }>;
    const lines = rich.markdown.split('\n');
    const run = findLinkRun(lines);
    if (!run) return [b];

    // The nearest non-empty line above the list introduces it when it reads like one.
    let p = run.start - 1;
    while (p >= 0 && !lines[p].trim()) p--;
    const intro = p >= 0 && isIntroLine(lines[p]) ? stripHeading(lines[p]) : undefined;
    const before = lines.slice(0, intro !== undefined ? p : run.start).join('\n').trim();
    const after = lines.slice(run.end + 1).join('\n').trim();

    // With no text left above the list, the Text block's own heading moves onto the list
    // (and an intro line, if any, becomes its subheading) so neither is lost.
    const ownHeading = !before && rich.heading ? rich.heading : undefined;
    const heading = ownHeading ?? intro ?? FALLBACK_HEADING;
    const subheading = ownHeading && intro ? intro : undefined;

    const listId = uid(`${b.id}-links`);
    const items: LinkItem[] = lines.slice(run.start, run.end + 1).flatMap((line) => {
      const m = LINK_LINE.exec(line);
      if (!m) return [];
      const blurb = m[3]?.trim();
      return [{
        id: `${listId}-${0}`, name: m[1].trim(), url: m[2], icon: 'link-outline', color: 'teal' as ColorToken,
        display: hostnameOf(m[2]), ...(blurb ? { blurb } : {}),
      }];
    }).map((item, k) => ({ ...item, id: `${listId}-${k + 1}`, color: COLORS[k % COLORS.length] }));

    const out: ContentBlock[] = [];
    if (before) out.push({ ...rich, markdown: before });
    out.push({ id: listId, type: 'linkList', heading, ...(subheading ? { subheading } : {}), items } as ContentBlock);
    if (after) out.push(...split({ id: uid(`${b.id}-more`), type: 'richText', markdown: after } as ContentBlock));
    return out;
  };

  let changed = false;
  const blocks = doc.blocks.flatMap((b) => {
    const out = split(b);
    if (out.length !== 1 || out[0] !== b) changed = true;
    return out;
  });
  return changed ? { ...doc, blocks } : doc;
}
