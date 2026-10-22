// Validate raw AI output before it touches the doc. Pure — unit tested.
// AI blocks/items are first run through repair.ts, so a small slip (bad color, missing
// id or icon) is fixed instead of costing the author a whole block of their text.
import type { ContentDoc, Op } from '../types';
import { parseContentDoc, validateOps, ParseResult } from '../validate';
import { repairBlock, repairItem } from '../repair';
import type { Notice } from '../lint';

export interface GenerateResult extends ParseResult {
  /** Readable, actionable notes about anything left out (also mirrored in `warnings`). */
  notices: Notice[];
}

/** Generate mode: the raw object should be a ContentDoc. Blocks are repaired where
 *  possible; anything that still can't be used is left out with a notice. */
export function parseGenerateResult(raw: unknown): GenerateResult {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as any).blocks)) {
    return { ...parseContentDoc(raw), notices: [] };
  }
  const notices: Notice[] = [];
  const blocks: unknown[] = [];
  ((raw as any).blocks as unknown[]).forEach((b, i) => {
    const r = repairBlock(b, i);
    notices.push(...r.notices);
    if (r.block) blocks.push(r.block);
  });
  const parsed = parseContentDoc({ ...(raw as object), blocks });
  // parseContentDoc should find nothing left to drop; keep any stragglers readable.
  const extra = parsed.warnings.map((w) => ({ message: `A section was left out: ${w}`, fix: 'Ask AI to add that section again.' }));
  const all = [...notices, ...extra];
  return { ...parsed, warnings: all.map((n) => n.message), notices: all };
}

export interface EditResult {
  summary: string;
  ops: Op[];
  errors: string[]; // non-empty → do not apply
}

/** Edit mode: the raw object should be { summary, ops[] }, valid against `doc`.
 *  Inserted blocks/items are repaired first. */
export function parseEditResult(raw: unknown, doc: ContentDoc): EditResult {
  if (typeof raw !== 'object' || raw === null) {
    return { summary: '', ops: [], errors: ['The AI response was not an object.'] };
  }
  const r = raw as { summary?: unknown; ops?: unknown };
  const summary = typeof r.summary === 'string' ? r.summary : '';
  if (!Array.isArray(r.ops)) {
    return { summary, ops: [], errors: ['The AI response had no ops array.'] };
  }
  const repairErrors: string[] = [];
  const ops = (r.ops as Op[]).map((op): Op => {
    if (op?.op === 'insertBlock') {
      const res = repairBlock(op.block, doc.blocks.length);
      if (!res.block) { repairErrors.push(...res.notices.map((n) => n.message)); return op; }
      return { ...op, block: res.block };
    }
    if (op?.op === 'insertItem') {
      const target = doc.blocks.find((b) => b.id === op.block);
      if (!target) return op; // validateOps reports the unknown block
      const res = repairItem(target, op.item, doc.blocks.indexOf(target));
      if (res.item === null) { repairErrors.push(...res.notices.map((n) => n.message)); return op; }
      return { ...op, item: res.item as Record<string, unknown> };
    }
    return op;
  });
  const errors = [...repairErrors, ...validateOps(doc, ops)];
  return { summary, ops, errors };
}
