// Pre-publish lint — surfaces the structural + content rules the AI self-checks, so
// a moderator sees problems before publishing. Pure: derives issues from a ContentDoc,
// no side effects, safe to import anywhere (including the editor + tests).
//
// This does NOT drop or change anything (unlike parseContentDoc); it only reports.
// Every issue says what's wrong AND how to fix it (`fix`), and names the block/item.
import i18n from '../../lib/i18n';
import type { ContentBlock, ContentDoc } from './types';
import { REGISTRY, fieldLabel, type FieldDef } from './registry';

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
  const label = def
    ? i18n.t(`editor.blocks.${block.type}.label`)
    : (block.type ? String(block.type) : i18n.t('editor.lintIssues.blockName.fallback'));
  const b = block as any;
  const title = typeof b.heading === 'string' && b.heading.trim()
    ? b.heading
    : Array.isArray(b.titleParts) ? b.titleParts.map((p: any) => p?.text ?? '').join('').trim() : '';
  if (title) return i18n.t('editor.lintIssues.blockName.titled', { label, title: clip(title) });
  return index !== undefined ? i18n.t('editor.lintIssues.blockName.section', { label, num: index + 1 }) : label;
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
    .map((f) => `“${fieldLabel(b.type, f)}”`);
  if (blockHits.length) {
    out.push({
      level: 'warning',
      message: i18n.t('editor.lintIssues.placeholderBlock', { name, fields: blockHits.join(', ') }),
      fix: i18n.t('editor.lintIssues.placeholderBlockFix'),
      blockId: b.id,
    });
  }

  const item = def.editor.item;
  if (item) {
    const itemDefaults = item.make();
    const noun = i18n.t(`editor.nouns.${item.noun}`);
    ((a[item.arrayKey] ?? []) as any[]).forEach((it, i) => {
      const hits = item.fields
        .filter((f) => isTextField(f) && typeof it?.[f.key] === 'string' && it[f.key] && it[f.key] === itemDefaults[f.key])
        .map((f) => `“${fieldLabel(b.type, f)}”`);
      if (!hits.length) return;
      const label = itemDisplayName(it);
      out.push({
        level: 'warning',
        message: i18n.t('editor.lintIssues.placeholderItem', { name, noun, num: i + 1, label: label ? ` ${label}` : '', fields: hits.join(', ') }),
        fix: i18n.t('editor.lintIssues.placeholderItemFix', { noun, num: i + 1 }),
        blockId: b.id,
      });
    });
  }
  return out;
}

const longFix = () => i18n.t('editor.lintIssues.longFix');

/**
 * Structural + content checks mirroring the AI self-check rules (exactly one hero
 * first, one recommendations last, length guidance, missing alt) plus common "not
 * ready to publish" gaps (placeholder text, empty media URLs, empty resource/link targets).
 */
export function lintDoc(doc: ContentDoc): LintIssue[] {
  const issues: LintIssue[] = [];
  const blocks = doc.blocks;

  if (!doc.title.trim()) {
    issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.noTitle'), fix: i18n.t('editor.lintIssues.noTitleFix') });
  }

  if (!doc.audience?.roles?.length) {
    issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.noAudience'), fix: i18n.t('editor.lintIssues.noAudienceFix') });
  }

  // hero: exactly one, first
  const heroes = blocks.filter((b) => b.type === 'hero');
  if (heroes.length === 0) {
    issues.push({ level: 'error', message: i18n.t('editor.lintIssues.noHero'), fix: i18n.t('editor.lintIssues.noHeroFix') });
  } else if (heroes.length > 1) {
    issues.push({ level: 'error', message: i18n.t('editor.lintIssues.multiHero', { count: heroes.length }), fix: i18n.t('editor.lintIssues.multiHeroFix'), blockId: heroes[1].id });
  }
  if (heroes.length >= 1 && blocks[0]?.type !== 'hero') {
    issues.push({ level: 'error', message: i18n.t('editor.lintIssues.heroNotFirst'), fix: i18n.t('editor.lintIssues.heroNotFirstFix'), blockId: heroes[0].id });
  }
  for (const h of heroes) {
    const titleText = ((h as any).titleParts ?? []).map((p: any) => p.text).join('').trim();
    if (!titleText) issues.push({ level: 'error', message: i18n.t('editor.lintIssues.heroEmpty'), fix: i18n.t('editor.lintIssues.heroEmptyFix'), blockId: h.id });
  }

  // recommendations: at most one, last
  const recs = blocks.filter((b) => b.type === 'recommendations');
  if (recs.length === 0) {
    issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.noRecs'), fix: i18n.t('editor.lintIssues.noRecsFix') });
  } else if (recs.length > 1) {
    issues.push({ level: 'error', message: i18n.t('editor.lintIssues.multiRecs', { count: recs.length }), fix: i18n.t('editor.lintIssues.multiRecsFix'), blockId: recs[1].id });
  }
  if (recs.length >= 1 && blocks[blocks.length - 1]?.type !== 'recommendations') {
    issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.recsNotLast'), fix: i18n.t('editor.lintIssues.recsNotLastFix'), blockId: recs[0].id });
  }

  // per-block content checks (placeholders, length guidance, missing media/targets)
  blocks.forEach((b, index) => {
    const a = b as any;
    const name = blockDisplayName(b, index);
    issues.push(...placeholderIssues(b, index));
    switch (b.type) {
      case 'callout': {
        const n = words(a.text);
        if (n > 60) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.calloutLong', { name, count: n }), fix: longFix(), blockId: b.id });
        break;
      }
      case 'accordion':
        for (const it of a.items ?? []) {
          const s = words(it.summary), d = words(it.body);
          if (s > 20) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.accordionSummaryLong', { name, title: clip(it.title), count: s }), fix: i18n.t('editor.lintIssues.accordionSummaryLongFix'), blockId: b.id });
          if (d > 60) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.accordionDetailsLong', { name, title: clip(it.title), count: d }), fix: longFix(), blockId: b.id });
        }
        break;
      case 'cardGrid':
        for (const it of a.items ?? []) {
          const n = words(it.body);
          if (n > 45) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.cardLong', { name, title: clip(it.title), count: n }), fix: longFix(), blockId: b.id });
        }
        break;
      case 'stepper':
        for (const it of a.steps ?? []) {
          const paras = String(it.detail ?? '').split(/\n\n+/).filter((p: string) => p.trim()).length;
          if (paras > 3 || words(it.detail) > 150) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.stepLong', { name, title: clip(it.title), count: paras }), fix: longFix(), blockId: b.id });
        }
        break;
      case 'image':
        if (!a.url) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.imageNoUrl', { name }), fix: i18n.t('editor.lintIssues.imageNoUrlFix'), blockId: b.id });
        if (a.url && !String(a.alt ?? '').trim()) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.imageNoAlt', { name }), fix: i18n.t('editor.lintIssues.imageNoAltFix'), blockId: b.id });
        break;
      case 'gallery':
        (a.items ?? []).forEach((it: any, i: number) => {
          if (!it.url) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.galleryNoUrl', { name, num: i + 1 }), fix: i18n.t('editor.lintIssues.galleryNoUrlFix'), blockId: b.id });
          else if (!String(it.alt ?? '').trim()) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.galleryNoAlt', { name, num: i + 1 }), fix: i18n.t('editor.lintIssues.galleryNoAltFix'), blockId: b.id });
        });
        break;
      case 'video':
        if (!a.url) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.videoNoUrl', { name }), fix: i18n.t('editor.lintIssues.videoNoUrlFix'), blockId: b.id });
        break;
      case 'linkList':
        for (const it of a.items ?? []) {
          if (!it.url || it.url === 'https://') issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.linkNoUrl', { name, title: clip(it.name ?? '') }), fix: i18n.t('editor.lintIssues.linkNoUrlFix'), blockId: b.id });
        }
        break;
      case 'resourceRefList':
        if ((a.resourceIds ?? []).length === 0) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.resourceEmpty', { name }), fix: i18n.t('editor.lintIssues.resourceEmptyFix'), blockId: b.id });
        break;
      case 'references':
        (a.items ?? []).forEach((it: any, i: number) => {
          if (!String(it.label ?? '').trim()) issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.referenceNoName', { name, num: i + 1 }), fix: i18n.t('editor.lintIssues.referenceNoNameFix'), blockId: b.id });
        });
        break;
      case 'comparisonTable':
        (a.rows ?? []).forEach((r: any, i: number) => {
          if ((r.cells ?? []).every((c: string) => !String(c ?? '').trim())) {
            issues.push({ level: 'warning', message: i18n.t('editor.lintIssues.tableRowEmpty', { name, num: i + 1 }), fix: i18n.t('editor.lintIssues.tableRowEmptyFix'), blockId: b.id });
          }
        });
        break;
    }
  });

  // errors first, then warnings (stable within level)
  return issues.sort((x, y) => (x.level === y.level ? 0 : x.level === 'error' ? -1 : 1));
}
