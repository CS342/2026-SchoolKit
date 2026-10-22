// Pre-publish lint — surfaces the structural + content rules the AI self-checks, so
// a moderator sees problems before publishing. Pure: derives issues from a ContentDoc,
// no side effects, safe to import anywhere (including the editor + tests).
//
// This does NOT drop or change anything (unlike parseContentDoc); it only reports.
// Every issue says what's wrong AND how to fix it (`fix`), and names the block/item.
import type { ContentBlock, ContentDoc } from './types';
import { REGISTRY, type FieldDef } from './registry';

/** A message for the checks panel: what's wrong, how to fix it, and (optionally) the
 *  block it's about so the panel can jump to it. Also used for generate-time notices. */
export interface Notice {
  message: string;
  /** One short, concrete instruction for resolving it. */
  fix?: string;
  /** The offending block, so the panel can jump/select it. Omitted for page-level issues. */
  blockId?: string;
}

export interface LintIssue extends Notice {
  level: 'error' | 'warning';
}

const words = (s: string | undefined): number => (s && s.trim() ? s.trim().split(/\s+/).length : 0);
const clip = (s: string, n = 40) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Human name for a block in messages: its palette label plus its heading/title, e.g.
 *  `Flip cards “Common Myths”`, or `Flip cards (section 3)` when it has no heading. */
export function blockDisplayName(block: Partial<ContentBlock> & { type?: string }, index?: number): string {
  const def = REGISTRY[block.type as ContentBlock['type']];
  const label = def?.palette.label ?? String(block.type ?? 'Block');
  const b = block as any;
  const title = typeof b.heading === 'string' && b.heading.trim()
    ? b.heading
    : Array.isArray(b.titleParts) ? b.titleParts.map((p: any) => p?.text ?? '').join('').trim() : '';
  if (title) return `${label} “${clip(title)}”`;
  return index !== undefined ? `${label} (section ${index + 1})` : label;
}

/** A short identifying label for an item inside a block (its title/front/name/…). */
export function itemDisplayName(item: any): string {
  const t = item?.title ?? item?.front ?? item?.name ?? item?.label ?? item?.text ?? item?.value;
  return typeof t === 'string' && t.trim() ? `“${clip(t.trim(), 32)}”` : '';
}

const isTextField = (f: FieldDef) => f.kind === 'text' || f.kind === 'textarea';

/** Fields still holding the registry's default placeholder copy ("Describe this card.",
 *  "Section title", …) — left by a freshly-added block, or filled in by the AI-output
 *  repair step when the AI omitted a required field. */
function placeholderIssues(b: ContentBlock, index: number): LintIssue[] {
  const def = REGISTRY[b.type];
  if (!def) return [];
  const out: LintIssue[] = [];
  const a = b as any;
  const name = blockDisplayName(b, index);

  let blockDefaults: any = null;
  try { blockDefaults = def.make(); } catch { /* no defaults */ }
  const blockHits = def.editor.fields
    .filter((f) => isTextField(f) && typeof a[f.key] === 'string' && a[f.key] && a[f.key] === blockDefaults?.[f.key])
    .map((f) => `“${f.label}”`);
  if (blockHits.length) {
    out.push({
      level: 'warning',
      message: `${name} still has placeholder text in ${blockHits.join(', ')}.`,
      fix: 'Select the block and type the real text, or clear the field if it’s optional.',
      blockId: b.id,
    });
  }

  const item = def.editor.item;
  if (item) {
    const itemDefaults = item.make();
    ((a[item.arrayKey] ?? []) as any[]).forEach((it, i) => {
      const hits = item.fields
        .filter((f) => isTextField(f) && typeof it?.[f.key] === 'string' && it[f.key] && it[f.key] === itemDefaults[f.key])
        .map((f) => `“${f.label}”`);
      if (!hits.length) return;
      const label = itemDisplayName(it);
      out.push({
        level: 'warning',
        message: `${name}: ${item.noun} ${i + 1}${label ? ` ${label}` : ''} still has placeholder text in ${hits.join(', ')}.`,
        fix: `Select the block, open ${item.noun} ${i + 1}, and replace it with the real text — or remove that ${item.noun}.`,
        blockId: b.id,
      });
    });
  }
  return out;
}

const LONG_FIX = 'Fine if this is the source’s exact wording. Otherwise shorten it, or move long passages into a Text block.';

/**
 * Structural + content checks mirroring the AI self-check rules (exactly one hero
 * first, one recommendations last, length guidance, missing alt) plus common "not
 * ready to publish" gaps (placeholder text, empty media URLs, empty resource/link targets).
 */
export function lintDoc(doc: ContentDoc): LintIssue[] {
  const issues: LintIssue[] = [];
  const blocks = doc.blocks;

  if (!doc.title.trim()) {
    issues.push({ level: 'warning', message: 'The page has no title.', fix: 'Open Page settings and enter a title.' });
  }

  if (!doc.audience?.roles?.length) {
    issues.push({ level: 'warning', message: 'No audience is set, so every role (students, parents and school staff) will see this page.', fix: 'Open Page settings → “Who is this for?” and pick the roles this page is written for.' });
  }

  // hero: exactly one, first
  const heroes = blocks.filter((b) => b.type === 'hero');
  if (heroes.length === 0) {
    issues.push({ level: 'error', message: 'The page has no Title block.', fix: 'Add block → Title, then move it to the top.' });
  } else if (heroes.length > 1) {
    issues.push({ level: 'error', message: `There are ${heroes.length} Title blocks — a page has exactly one.`, fix: 'Delete the extra Title block (this one).', blockId: heroes[1].id });
  }
  if (heroes.length >= 1 && blocks[0]?.type !== 'hero') {
    issues.push({ level: 'error', message: 'The Title block isn’t first.', fix: 'Use the ↑ arrow to move it to the top of the page.', blockId: heroes[0].id });
  }
  for (const h of heroes) {
    const titleText = ((h as any).titleParts ?? []).map((p: any) => p.text).join('').trim();
    if (!titleText) issues.push({ level: 'error', message: 'The Title block is empty.', fix: 'Select it and type the page title.', blockId: h.id });
  }

  // recommendations: at most one, last
  const recs = blocks.filter((b) => b.type === 'recommendations');
  if (recs.length === 0) {
    issues.push({ level: 'warning', message: 'The page doesn’t end with Recommendations.', fix: 'Add block → Recommendations. It fills itself in from the page’s tags.' });
  } else if (recs.length > 1) {
    issues.push({ level: 'error', message: `There are ${recs.length} Recommendations blocks — keep one.`, fix: 'Delete the extra one (this one).', blockId: recs[1].id });
  }
  if (recs.length >= 1 && blocks[blocks.length - 1]?.type !== 'recommendations') {
    issues.push({ level: 'warning', message: 'Recommendations isn’t the last block.', fix: 'Use the ↓ arrow to move it to the bottom.', blockId: recs[0].id });
  }

  // per-block content checks (placeholders, length guidance, missing media/targets)
  blocks.forEach((b, index) => {
    const a = b as any;
    const name = blockDisplayName(b, index);
    issues.push(...placeholderIssues(b, index));
    switch (b.type) {
      case 'callout': {
        const n = words(a.text);
        if (n > 60) issues.push({ level: 'warning', message: `${name} is long for a callout (${n} words; callouts read best under 60).`, fix: LONG_FIX, blockId: b.id });
        break;
      }
      case 'accordion':
        for (const it of a.items ?? []) {
          const s = words(it.summary), d = words(it.body);
          if (s > 20) issues.push({ level: 'warning', message: `${name}: the summary of “${clip(it.title)}” is long (${s} words; aim for under 20 — it shows before the card is opened).`, fix: 'Shorten the summary — the full text belongs in Details.', blockId: b.id });
          if (d > 60) issues.push({ level: 'warning', message: `${name}: the details of “${clip(it.title)}” are long (${d} words; aim for under 60).`, fix: LONG_FIX, blockId: b.id });
        }
        break;
      case 'cardGrid':
        for (const it of a.items ?? []) {
          const n = words(it.body);
          if (n > 45) issues.push({ level: 'warning', message: `${name}: card “${clip(it.title)}” is long (${n} words; cards read best under 45).`, fix: LONG_FIX, blockId: b.id });
        }
        break;
      case 'stepper':
        for (const it of a.steps ?? []) {
          const paras = String(it.detail ?? '').split(/\n\n+/).filter((p: string) => p.trim()).length;
          if (paras > 3 || words(it.detail) > 150) issues.push({ level: 'warning', message: `${name}: step “${clip(it.title)}” is long (${paras} paragraphs).`, fix: LONG_FIX, blockId: b.id });
        }
        break;
      case 'image':
        if (!a.url) issues.push({ level: 'warning', message: `${name} has no image yet.`, fix: 'Select the block and upload an image or paste its URL.', blockId: b.id });
        if (a.url && !String(a.alt ?? '').trim()) issues.push({ level: 'warning', message: `${name} has no alt text, so screen-reader users won’t know what it shows.`, fix: 'Select the block and describe the image in “Alt text” (or use the AI suggestion).', blockId: b.id });
        break;
      case 'gallery':
        (a.items ?? []).forEach((it: any, i: number) => {
          if (!it.url) issues.push({ level: 'warning', message: `${name}: image ${i + 1} has no file yet.`, fix: 'Select the block and upload the image, or remove that slot.', blockId: b.id });
          else if (!String(it.alt ?? '').trim()) issues.push({ level: 'warning', message: `${name}: image ${i + 1} has no alt text.`, fix: 'Select the block and describe the image in its alt text field.', blockId: b.id });
        });
        break;
      case 'video':
        if (!a.url) issues.push({ level: 'warning', message: `${name} has no video link yet.`, fix: 'Select the block and paste a YouTube, Vimeo, or .mp4 link.', blockId: b.id });
        break;
      case 'linkList':
        for (const it of a.items ?? []) {
          if (!it.url || it.url === 'https://') issues.push({ level: 'warning', message: `${name}: the link “${clip(it.name ?? '')}” has no web address.`, fix: 'Select the block and paste the organization’s URL, or remove the link.', blockId: b.id });
        }
        break;
      case 'resourceRefList':
        if ((a.resourceIds ?? []).length === 0) issues.push({ level: 'warning', message: `${name} has no guides selected.`, fix: 'Select the block and pick the SchoolKit guides to show, or delete it.', blockId: b.id });
        break;
      case 'references':
        (a.items ?? []).forEach((it: any, i: number) => {
          if (!String(it.label ?? '').trim()) issues.push({ level: 'warning', message: `${name}: source ${i + 1} has no name.`, fix: 'Select the block and enter the source’s title, or remove it.', blockId: b.id });
        });
        break;
      case 'comparisonTable':
        (a.rows ?? []).forEach((r: any, i: number) => {
          if ((r.cells ?? []).every((c: string) => !String(c ?? '').trim())) {
            issues.push({ level: 'warning', message: `${name}: row ${i + 1} is empty.`, fix: 'Select the block and fill in the row, or remove it.', blockId: b.id });
          }
        });
        break;
    }
  });

  // errors first, then warnings (stable within level)
  return issues.sort((x, y) => (x.level === y.level ? 0 : x.level === 'error' ? -1 : 1));
}
