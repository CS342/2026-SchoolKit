// Validate raw AI output before it touches the doc. Pure — unit tested.
import type { ContentDoc, Op } from '../types';
import { parseContentDoc, validateOps, ParseResult } from '../validate';

/** Generate mode: the raw object should be a ContentDoc. Bad blocks are dropped. */
export function parseGenerateResult(raw: unknown): ParseResult {
  return parseContentDoc(raw);
}

export interface EditResult {
  summary: string;
  ops: Op[];
  errors: string[]; // non-empty → do not apply
}

/** Edit mode: the raw object should be { summary, ops[] }, valid against `doc`. */
export function parseEditResult(raw: unknown, doc: ContentDoc): EditResult {
  if (typeof raw !== 'object' || raw === null) {
    return { summary: '', ops: [], errors: ['The AI response was not an object.'] };
  }
  const r = raw as { summary?: unknown; ops?: unknown };
  const summary = typeof r.summary === 'string' ? r.summary : '';
  if (!Array.isArray(r.ops)) {
    return { summary, ops: [], errors: ['The AI response had no ops array.'] };
  }
  const ops = r.ops as Op[];
  const errors = validateOps(doc, ops);
  return { summary, ops, errors };
}
