// Repair AI-emitted blocks before validation, so one small slip (a missing id, a
// color outside the token set, a number where text belongs) doesn't make
// parseContentDoc throw away a whole block — and with it the author's verbatim text.
//
// Policy:
//  - Silent structural fixes: mint missing ids, map bad/missing colors onto the token
//    palette, default missing icons, stringify numbers/booleans, drop `null` optionals.
//  - Missing required TEXT is filled with the registry's placeholder copy — but only
//    when the block/item has real content of its own (otherwise it's junk → dropped).
//    The checks panel flags placeholders (lint.ts), so nothing ships unnoticed.
//  - Facts/targets are never fabricated (urls, stat values, resource ids, table cells):
//    an item missing one is left out; a block missing one is dropped.
//  - Anything that still can't be fixed: an item is left out (block kept), a block is
//    dropped — each with a Notice naming the block and saying how to recover.
//
// Pure (zod + registry only) — safe for tests and the node env.
import { nanoid } from 'nanoid/non-secure';
import { REGISTRY, BLOCK_SCHEMAS, ColorTokenSchema } from './registry';
import type { BlockType, ContentBlock } from './types';
import { blockDisplayName, itemDisplayName, type Notice } from './lint';

const COLOR_KEYS = new Set(['color', 'tone', 'eyebrowColor']);
const ICON_KEYS = new Set(['icon', 'eyebrowIcon']);
/** Fields we must never invent a value for. */
const NEVER_FILL = new Set(['url', 'value', 'resourceIds', 'cells', 'columns', 'titleParts', 'items', 'steps', 'rows']);
const META_KEYS = new Set(['id', 'type', 'icon', 'eyebrowIcon', 'color', 'tone', 'eyebrowColor', 'accent', 'variant', 'provider']);
const PALETTE = ColorTokenSchema.options;
const MAX_PASSES = 100;

/** True if the object carries any author-facing text (directly or in an item array). */
function hasContent(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(obj).some(([k, v]) => {
    if (META_KEYS.has(k)) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.some((x) => (typeof x === 'string' ? x.trim().length > 0 : hasContent(x)));
    return false;
  });
}

/** First readable text in a block, for "which content was this?" in messages. */
function contentPreview(obj: any): string {
  const seen: string[] = [];
  const walk = (v: any) => {
    if (seen.length) return;
    if (typeof v === 'string' && v.trim().length > 12) { seen.push(v.trim()); return; }
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!META_KEYS.has(k)) walk(x);
  };
  walk(obj);
  const s = seen[0]?.replace(/\s+/g, ' ') ?? '';
  return s ? `“${s.length > 60 ? s.slice(0, 59).trimEnd() + '…' : s}”` : '';
}

function fieldLabel(type: BlockType, key: string, inItem: boolean): string {
  const ed = REGISTRY[type].editor;
  const fields = inItem ? ed.item?.fields ?? [] : ed.fields;
  return fields.find((f) => f.key === key)?.label ?? key;
}

export interface RepairResult {
  /** The repaired block, or null if it had to be dropped. */
  block: ContentBlock | null;
  /** Things the author should know (items left out, block dropped) — with fixes. */
  notices: Notice[];
}

/**
 * Repair one AI-emitted block. `index` is its position on the page (for messages).
 * Never mutates `raw`.
 */
export function repairBlock(raw: unknown, index: number): RepairResult {
  const section = `Section ${index + 1}`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { block: null, notices: [{ message: `${section} from the AI wasn’t a valid block and was left out.`, fix: 'Ask AI to add that section again.' }] };
  }
  const type = (raw as any).type as BlockType;
  const schema = BLOCK_SCHEMAS[type];
  if (!schema) {
    return {
      block: null,
      notices: [{
        message: `${section}: the AI used a block type (“${String(type)}”) this editor doesn’t have, so it was left out${contentPreview(raw) ? ` — it started ${contentPreview(raw)}` : ''}.`,
        fix: 'Ask AI to add that content again using a supported block, or add a block and paste the text in.',
      }],
    };
  }

  const def = REGISTRY[type];
  const arrayKey = def.itemArrayKey;
  const b: any = JSON.parse(JSON.stringify(raw));
  if (typeof b.id !== 'string' || !b.id.trim()) b.id = nanoid(8);

  let blockDefaults: any = {};
  try { blockDefaults = def.make() ?? {}; } catch { /* none */ }
  const itemDefaults: any = def.editor.item?.make() ?? {};
  const originalItemCount = arrayKey && Array.isArray(b[arrayKey]) ? b[arrayKey].length : 0;
  const removed: { label: string; field: string }[] = [];
  const attempts = new Map<string, number>();
  let colorIdx = 0;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const res = schema.safeParse(b);
    if (res.success) break;
    const issue = res.error.issues[0];
    const path = issue.path as (string | number)[];
    const inItem = !!arrayKey && path[0] === arrayKey && typeof path[1] === 'number';

    const pathKey = path.join('.');
    const tries = (attempts.get(pathKey) ?? 0) + 1;
    attempts.set(pathKey, tries);

    const key = path[path.length - 1];
    let parent: any = b;
    for (const p of path.slice(0, -1)) parent = parent?.[p as any];
    const value = parent && typeof parent === 'object' ? parent[key as any] : undefined;

    let fixed = false;
    if (tries <= 2 && parent && typeof parent === 'object' && typeof key === 'string') {
      const defaults = inItem && path.length === 3 ? itemDefaults : !inItem && path.length === 1 ? blockDefaults : {};
      if (key === 'id') { parent.id = nanoid(8); fixed = true; }
      else if (COLOR_KEYS.has(key)) { parent[key] = PALETTE[colorIdx++ % PALETTE.length]; fixed = true; }
      else if (ICON_KEYS.has(key)) { parent[key] = 'ellipse-outline'; fixed = true; }
      else if (value === null) { delete parent[key]; fixed = true; }
      else if (typeof value === 'number' || typeof value === 'boolean') { parent[key] = String(value); fixed = true; }
      else if ((value === undefined || value === '') && !NEVER_FILL.has(key)
        && typeof defaults[key] === 'string' && defaults[key] && hasContent(parent)) {
        parent[key] = defaults[key]; // placeholder copy → flagged by lint until replaced
        fixed = true;
      }
    }
    if (fixed) continue;

    // Unfixable: leave the item out (keep the block) — or drop the whole block.
    if (inItem && Array.isArray(b[arrayKey!])) {
      const idx = path[1] as number;
      const item = b[arrayKey!][idx];
      const field = path.length > 2 ? fieldLabel(type, String(path[2]), true) : '';
      removed.push({ label: itemDisplayName(item) || `#${idx + 1}`, field });
      b[arrayKey!].splice(idx, 1);
      attempts.clear();
      continue;
    }
    const field = typeof key === 'string' ? fieldLabel(type, key, false) : '';
    const preview = contentPreview(raw);
    return {
      block: null,
      notices: [{
        message: `${blockDisplayName(raw as any, index)} couldn’t be added${field ? ` — its “${field}” was missing or invalid` : ''}${preview ? `. It started ${preview}` : ''}.`,
        fix: `Ask AI to “add the ${def.palette.label.toLowerCase()} section back”, or add a ${def.palette.label} block and paste the text in.`,
      }],
    };
  }

  const final = schema.safeParse(b);
  if (!final.success) {
    return { block: null, notices: [{ message: `${blockDisplayName(raw as any, index)} couldn’t be repaired and was left out.`, fix: 'Ask AI to add that section again.' }] };
  }

  const noun = def.editor.item?.noun ?? 'item';
  const name = blockDisplayName(b, index);
  if (originalItemCount > 0 && removed.length === originalItemCount) {
    return {
      block: null,
      notices: [{
        message: `${name} couldn’t be added — none of its ${noun}s were complete${removed[0].field ? ` (e.g. missing “${removed[0].field}”)` : ''}${contentPreview(raw) ? `. It started ${contentPreview(raw)}` : ''}.`,
        fix: `Ask AI to “add the ${def.palette.label.toLowerCase()} section back”, or add a ${def.palette.label} block and fill it in.`,
      }],
    };
  }
  const notices: Notice[] = removed.map((r) => ({
    message: `${name}: the ${noun} ${r.label} was left out${r.field ? ` because its “${r.field}” was missing` : ' because it was incomplete'}.`,
    fix: `Select the block and add the ${noun} back with ＋, or ask AI to add it.`,
    blockId: b.id,
  }));
  return { block: final.data as ContentBlock, notices };
}

/** Repair one item about to be inserted into an existing block (AI insertItem op). */
export function repairItem(block: ContentBlock, item: unknown, index: number): { item: unknown | null; notices: Notice[] } {
  const key = REGISTRY[block.type]?.itemArrayKey;
  if (!key) return { item, notices: [] };
  const res = repairBlock({ ...block, [key]: [item] }, index);
  const arr = (res.block as any)?.[key];
  if (Array.isArray(arr) && arr.length === 1) return { item: arr[0], notices: [] };
  return { item: null, notices: res.notices };
}
