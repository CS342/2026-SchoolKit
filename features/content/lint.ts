// Pre-publish lint — surfaces the structural + content rules the AI self-checks, so
// a moderator sees problems before publishing. Pure: derives issues from a ContentDoc,
// no side effects, safe to import anywhere (including the editor + tests).
//
// This does NOT drop or change anything (unlike parseContentDoc); it only reports.
import type { ContentDoc } from './types';

export interface LintIssue {
  level: 'error' | 'warning';
  message: string;
  /** The offending block, so the panel can jump/select it. Omitted for page-level issues. */
  blockId?: string;
}

const words = (s: string | undefined): number => (s && s.trim() ? s.trim().split(/\s+/).length : 0);

/**
 * Structural + content checks mirroring the AI self-check rules (exactly one hero
 * first, one recommendations last, length caps, missing alt) plus common "not ready
 * to publish" gaps (empty media URLs, empty resource/link targets).
 */
export function lintDoc(doc: ContentDoc): LintIssue[] {
  const issues: LintIssue[] = [];
  const blocks = doc.blocks;

  if (!doc.title.trim()) issues.push({ level: 'warning', message: 'The page has no title.' });

  // hero: exactly one, first
  const heroes = blocks.filter((b) => b.type === 'hero');
  if (heroes.length === 0) {
    issues.push({ level: 'error', message: 'No title block — every page needs exactly one hero, first.' });
  } else if (heroes.length > 1) {
    issues.push({ level: 'error', message: `There are ${heroes.length} title blocks — keep exactly one.`, blockId: heroes[1].id });
  }
  if (heroes.length >= 1 && blocks[0]?.type !== 'hero') {
    issues.push({ level: 'error', message: 'The title block should be the first block on the page.', blockId: heroes[0].id });
  }
  for (const h of heroes) {
    const titleText = ((h as any).titleParts ?? []).map((p: any) => p.text).join('').trim();
    if (!titleText) issues.push({ level: 'error', message: 'The title block has no text.', blockId: h.id });
  }

  // recommendations: at most one, last
  const recs = blocks.filter((b) => b.type === 'recommendations');
  if (recs.length === 0) {
    issues.push({ level: 'warning', message: 'No recommendations block — pages usually end with one.' });
  } else if (recs.length > 1) {
    issues.push({ level: 'error', message: `There are ${recs.length} recommendations blocks — keep one.`, blockId: recs[1].id });
  }
  if (recs.length >= 1 && blocks[blocks.length - 1]?.type !== 'recommendations') {
    issues.push({ level: 'warning', message: 'The recommendations block should be the last block.', blockId: recs[0].id });
  }

  // per-block content checks (length caps + missing media/targets)
  for (const b of blocks) {
    const a = b as any;
    switch (b.type) {
      case 'callout':
        if (words(a.text) > 60) issues.push({ level: 'warning', message: 'Callout is long — aim for ≤ 60 words.', blockId: b.id });
        break;
      case 'accordion':
        for (const it of a.items ?? []) {
          if (words(it.summary) > 20) issues.push({ level: 'warning', message: `Accordion summary "${it.title}" is long (≤ 20 words).`, blockId: b.id });
          if (words(it.body) > 60) issues.push({ level: 'warning', message: `Accordion details for "${it.title}" are long (≤ 60 words).`, blockId: b.id });
        }
        break;
      case 'cardGrid':
        for (const it of a.items ?? []) {
          if (words(it.body) > 45) issues.push({ level: 'warning', message: `Card "${it.title}" body is long (≤ 45 words).`, blockId: b.id });
        }
        break;
      case 'stepper':
        for (const it of a.steps ?? []) {
          const paras = String(it.detail ?? '').split(/\n\n+/).filter((p: string) => p.trim()).length;
          if (paras > 3 || words(it.detail) > 150) issues.push({ level: 'warning', message: `Step "${it.title}" is long — keep it to 1–3 short paragraphs.`, blockId: b.id });
        }
        break;
      case 'image':
        if (!a.url) issues.push({ level: 'warning', message: 'Image has no URL yet.', blockId: b.id });
        if (a.url && !String(a.alt ?? '').trim()) issues.push({ level: 'warning', message: 'Image is missing alt text (for screen readers).', blockId: b.id });
        break;
      case 'gallery':
        for (const it of a.items ?? []) {
          if (!it.url) issues.push({ level: 'warning', message: 'A gallery image has no URL yet.', blockId: b.id });
          else if (!String(it.alt ?? '').trim()) issues.push({ level: 'warning', message: 'A gallery image is missing alt text.', blockId: b.id });
        }
        break;
      case 'video':
        if (!a.url) issues.push({ level: 'warning', message: 'Video has no URL yet.', blockId: b.id });
        break;
      case 'linkList':
        for (const it of a.items ?? []) {
          if (!it.url || it.url === 'https://') issues.push({ level: 'warning', message: `External link "${it.name}" has no URL yet.`, blockId: b.id });
        }
        break;
      case 'resourceRefList':
        if ((a.resourceIds ?? []).length === 0) issues.push({ level: 'warning', message: 'Resource list has no guides selected.', blockId: b.id });
        break;
      case 'references':
        for (const it of a.items ?? []) {
          if (!String(it.label ?? '').trim()) issues.push({ level: 'warning', message: 'A reference has no label.', blockId: b.id });
        }
        break;
      case 'comparisonTable':
        for (const r of a.rows ?? []) {
          if ((r.cells ?? []).every((c: string) => !String(c ?? '').trim())) {
            issues.push({ level: 'warning', message: 'A comparison-table row is empty.', blockId: b.id });
          }
        }
        break;
    }
  }

  // errors first, then warnings (stable within level)
  return issues.sort((x, y) => (x.level === y.level ? 0 : x.level === 'error' ? -1 : 1));
}
