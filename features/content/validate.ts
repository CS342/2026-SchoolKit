// Validation via zod. Two jobs: (1) parse an untrusted doc from Supabase/AI into a
// clean ContentDoc, dropping malformed blocks rather than throwing (forward-
// compatible); (2) validate an op batch against a doc before it's applied.
// Public API is unchanged from the earlier hand-rolled version.
//
// Pure module — safe to import anywhere, including tests.

import { z } from 'zod';
import type { ContentBlock, ContentDoc, Op, BlockType } from './types';

// ─── primitives ───────────────────────────────────────────────────────────────
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmpty = (v: unknown): v is string => isStr(v) && v.trim().length > 0;
const isArr = Array.isArray;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export interface ParseResult {
  doc: ContentDoc | null;
  errors: string[];   // fatal (doc could not be produced)
  warnings: string[]; // non-fatal (e.g. dropped blocks)
}

// ─── zod schemas ────────────────────────────────────────────────────────────────
const ColorToken = z.enum(['primary', 'teal', 'coral', 'amber', 'indigo', 'sky']);
const Icon = z.string().min(1);
const Id = z.string().min(1);
const Str = z.string().min(1);

const TitlePart = z.object({ text: z.string(), accent: z.boolean().optional() });
const AccordionItem = z.object({ id: Id, title: Str, icon: Icon, color: ColorToken, summary: Str, body: Str });
const CardItem = z.object({ id: Id, title: Str, icon: Icon, color: ColorToken, body: Str, href: z.string().optional() });
const StepItem = z.object({ id: Id, title: Str, icon: Icon, color: ColorToken, detail: Str });
const LinkItem = z.object({ id: Id, name: Str, icon: Icon, color: ColorToken, blurb: Str, url: Str, display: Str });

// Block `id` is optional in the schema so an insert op (id minted on apply) validates;
// parseContentDoc enforces id presence for stored docs via `requireId`.
const idOpt = { id: z.string().optional() };

const BLOCK_SCHEMAS: Record<BlockType, z.ZodTypeAny> = {
  hero: z.object({ ...idOpt, type: z.literal('hero'), eyebrow: z.string().optional(), eyebrowIcon: z.string().optional(), eyebrowColor: ColorToken.optional(), titleParts: z.array(TitlePart).min(1), subtitle: z.string().optional() }),
  callout: z.object({ ...idOpt, type: z.literal('callout'), icon: Icon, text: Str, tone: ColorToken.optional() }),
  richText: z.object({ ...idOpt, type: z.literal('richText'), heading: z.string().optional(), markdown: Str }),
  quote: z.object({ ...idOpt, type: z.literal('quote'), text: Str, author: z.string().optional() }),
  footnote: z.object({ ...idOpt, type: z.literal('footnote'), text: Str }),
  image: z.object({ ...idOpt, type: z.literal('image'), url: Str, alt: Str, caption: z.string().optional(), aspect: z.number().optional() }),
  accordion: z.object({ ...idOpt, type: z.literal('accordion'), heading: Str, subheading: z.string().optional(), items: z.array(AccordionItem) }),
  cardGrid: z.object({ ...idOpt, type: z.literal('cardGrid'), heading: Str, subheading: z.string().optional(), items: z.array(CardItem) }),
  stepper: z.object({ ...idOpt, type: z.literal('stepper'), heading: Str, subheading: z.string().optional(), steps: z.array(StepItem) }),
  linkList: z.object({ ...idOpt, type: z.literal('linkList'), heading: Str, subheading: z.string().optional(), items: z.array(LinkItem) }),
  // resourceIds coerced to strings — models often emit them as numbers (13 not "13").
  resourceRefList: z.object({ ...idOpt, type: z.literal('resourceRefList'), heading: Str, subheading: z.string().optional(), ranked: z.boolean().optional(), resourceIds: z.array(z.coerce.string()) }),
  recommendations: z.object({ ...idOpt, type: z.literal('recommendations') }),
};

const DocMeta = z.object({ title: Str, slug: Str, accent: ColorToken });

/** Validate one block. `requireId` false for insert ops (id is minted on apply). */
export function validateBlock(block: unknown, requireId = true): string | null {
  if (!isObj(block)) return 'block is not an object';
  if (requireId && !isNonEmpty(block.id)) return 'block missing id';
  const schema = BLOCK_SCHEMAS[block.type as BlockType];
  if (!schema) return `unknown block type "${String(block.type)}"`;
  const res = schema.safeParse(block);
  if (res.success) return null;
  const issue = res.error.issues[0];
  const path = issue.path.length ? '.' + issue.path.join('.') : '';
  return `${String(block.type)}${path}: ${issue.message}`;
}

// ─── doc parse ─────────────────────────────────────────────────────────────────
export function parseContentDoc(input: unknown): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObj(input)) return { doc: null, errors: ['doc is not an object'], warnings };

  const meta = DocMeta.safeParse(input);
  if (!meta.success) for (const i of meta.error.issues) errors.push(`doc.${i.path.join('.')}: ${i.message}`);
  if (!isArr(input.blocks)) errors.push('doc: blocks must be an array');
  if (errors.length) return { doc: null, errors, warnings };

  const kept: ContentBlock[] = [];
  for (const raw of input.blocks as unknown[]) {
    if (!isObj(raw)) { warnings.push('dropped block — not an object'); continue; }
    if (!isNonEmpty(raw.id)) { warnings.push('dropped block — missing id'); continue; }
    const schema = BLOCK_SCHEMAS[raw.type as BlockType];
    if (!schema) { warnings.push(`dropped block — unknown type "${String(raw.type)}"`); continue; }
    const res = schema.safeParse(raw);
    if (!res.success) {
      const i = res.error.issues[0];
      warnings.push(`dropped block — ${String(raw.type)}${i.path.length ? '.' + i.path.join('.') : ''}: ${i.message}`);
      continue;
    }
    kept.push(res.data as ContentBlock); // cleaned: coercions applied, unknown fields stripped
  }

  const doc: ContentDoc = {
    schemaVersion: 1,
    slug: input.slug as string,
    title: input.title as string,
    accent: input.accent as ContentDoc['accent'],
    category: isStr(input.category) ? input.category : undefined,
    tags: isArr(input.tags) ? (input.tags as unknown[]).filter(isStr) : [],
    resourceId: isStr(input.resourceId) ? input.resourceId : undefined,
    shareMessage: isStr(input.shareMessage) ? input.shareMessage : undefined,
    blocks: kept,
  };
  return { doc, errors, warnings };
}

// ─── op validation (against a doc, before apply) ───────────────────────────────
export const ARRAY_KEY: Partial<Record<BlockType, 'items' | 'steps'>> = {
  accordion: 'items',
  cardGrid: 'items',
  linkList: 'items',
  stepper: 'steps',
};

export function validateOps(doc: ContentDoc, ops: Op[]): string[] {
  const errors: string[] = [];
  const blockIds = new Set(doc.blocks.map((b) => b.id));

  const posOk = (pos: unknown): boolean =>
    typeof pos === 'number' ||
    (isObj(pos) && (isNonEmpty(pos.after) || isNonEmpty(pos.before)));

  for (const op of ops) {
    switch (op.op) {
      case 'insertBlock': {
        if (!posOk(op.at)) errors.push('insertBlock: bad position');
        const blockErr = validateBlock(op.block, false); // id minted on apply
        if (blockErr) errors.push(`insertBlock: ${blockErr}`);
        break;
      }
      case 'updateBlock':
      case 'removeBlock':
        if (!blockIds.has(op.id)) errors.push(`${op.op}: unknown block "${op.id}"`);
        break;
      case 'moveBlock':
        if (!blockIds.has(op.id)) errors.push(`moveBlock: unknown block "${op.id}"`);
        if (!posOk(op.to)) errors.push('moveBlock: bad position');
        break;
      case 'insertItem':
      case 'updateItem':
      case 'removeItem':
      case 'moveItem': {
        const block = doc.blocks.find((b) => b.id === op.block);
        if (!block) { errors.push(`${op.op}: unknown block "${op.block}"`); break; }
        const key = ARRAY_KEY[block.type];
        if (!key) { errors.push(`${op.op}: block "${op.block}" has no item array`); break; }
        const arr = (block as any)[key] as { id: string }[];
        if (op.op !== 'insertItem') {
          if (!arr.some((it) => it.id === op.item)) errors.push(`${op.op}: unknown item "${op.item}"`);
        }
        if (op.op === 'insertItem' && !posOk(op.at)) errors.push('insertItem: bad position');
        if (op.op === 'moveItem' && !posOk(op.to)) errors.push('moveItem: bad position');
        break;
      }
      default:
        errors.push(`unknown op "${(op as any).op}"`);
    }
  }
  return errors;
}
