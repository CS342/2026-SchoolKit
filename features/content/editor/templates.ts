// Editor-facing block catalogs, all DERIVED from the central manifest
// (features/content/registry.ts). Adding a block type never touches this file —
// it flows through automatically from the manifest entry. The field-config types
// are re-exported from the registry so existing imports keep working.
import type { BlockType, ContentBlock, ContentDoc } from '../types';
import { REGISTRY } from '../registry';

export type { FieldKind, FieldDef, ItemConfig, BlockConfig, BlockMeta } from '../registry';

const DEFS = Object.values(REGISTRY);

// ─── palette metadata (add-block menu) — manually-addable types, in curated order ─
export const BLOCK_PALETTE = DEFS
  .filter((d) => d.palette.manuallyAddable)
  .sort((a, b) => a.palette.order - b.palette.order)
  .map((d) => ({ type: d.type, label: d.palette.label, icon: d.palette.icon, blurb: d.palette.blurb }));

/** Human label for any block type (used on block cards). */
export const BLOCK_LABEL = Object.fromEntries(DEFS.map((d) => [d.type, d.palette.label])) as Record<BlockType, string>;
export const BLOCK_ICON = Object.fromEntries(DEFS.map((d) => [d.type, d.palette.icon])) as Record<BlockType, string>;

/** Declarative field-config that drives the generic block editor. */
export const BLOCK_CONFIG = Object.fromEntries(DEFS.map((d) => [d.type, d.editor])) as Record<BlockType, (typeof REGISTRY)[BlockType]['editor']>;

// ─── new-block templates ──────────────────────────────────────────────────────
export function newBlock(type: BlockType): ContentBlock {
  return REGISTRY[type].make();
}

/** A starter doc for a brand-new page: title + reassurance + auto recommendations. */
export function newPageDoc(): ContentDoc {
  return {
    schemaVersion: 1,
    slug: '',
    title: 'Untitled Page',
    accent: 'primary',
    category: '',
    tags: [],
    blocks: [newBlock('hero'), newBlock('callout'), newBlock('recommendations')],
  };
}
