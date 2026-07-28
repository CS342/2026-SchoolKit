// applyOps — the single pure reducer that BOTH the manual editor and the AI emit
// into (spec §3). Deterministic and immutable: it deep-clones the doc (plain JSON
// data), validates the whole batch first, then applies. An invalid batch throws —
// no partial writes.

import { nanoid } from 'nanoid/non-secure';
import type { ContentDoc, Op, Position } from './types';
import { ARRAY_KEY, validateOps } from './validate';

export class ContentOpError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(`Invalid op batch:\n- ${errors.join('\n- ')}`);
    this.name = 'ContentOpError';
    this.errors = errors;
  }
}

/** Default id factory (nanoid/non-secure — no RN crypto polyfill needed). Pass your
 *  own (e.g. a deterministic counter) in tests. Ids only need per-doc uniqueness. */
export function defaultGenId(): string {
  return `b_${nanoid(10)}`;
}

type WithId = { id?: string };

function ensureId(obj: WithId, genId: () => string): WithId {
  if (!obj.id) obj.id = genId();
  return obj;
}

/** Resolve an insert/move Position to an index in `arr` (array of {id}). */
function resolvePos(arr: { id: string }[], pos: Position): number {
  if (typeof pos === 'number') return Math.max(0, Math.min(arr.length, pos));
  if ('after' in pos) {
    const i = arr.findIndex((x) => x.id === pos.after);
    return i < 0 ? arr.length : i + 1;
  }
  const i = arr.findIndex((x) => x.id === pos.before);
  return i < 0 ? arr.length : i;
}

function itemArray(doc: ContentDoc, blockId: string): { id: string }[] | null {
  const block = doc.blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const key = ARRAY_KEY[block.type];
  if (!key) return null;
  return (block as any)[key] as { id: string }[];
}

const stripKeys = (patch: Record<string, unknown>, keys: string[]) => {
  const out = { ...patch };
  for (const k of keys) delete out[k];
  return out;
};

function applyOne(doc: ContentDoc, op: Op, genId: () => string): void {
  switch (op.op) {
    case 'insertBlock': {
      const block = ensureId({ ...op.block }, genId) as ContentDoc['blocks'][number];
      doc.blocks.splice(resolvePos(doc.blocks, op.at), 0, block);
      break;
    }
    case 'updateBlock': {
      const block = doc.blocks.find((b) => b.id === op.id)!;
      // id/type are structural — never overwritten by a patch.
      Object.assign(block, stripKeys(op.patch, ['id', 'type']));
      break;
    }
    case 'removeBlock': {
      doc.blocks = doc.blocks.filter((b) => b.id !== op.id);
      break;
    }
    case 'moveBlock': {
      const from = doc.blocks.findIndex((b) => b.id === op.id);
      const [block] = doc.blocks.splice(from, 1);
      doc.blocks.splice(resolvePos(doc.blocks, op.to), 0, block);
      break;
    }
    case 'insertItem': {
      const arr = itemArray(doc, op.block)!;
      const item = ensureId({ ...op.item }, genId) as { id: string };
      arr.splice(resolvePos(arr, op.at), 0, item);
      break;
    }
    case 'updateItem': {
      const arr = itemArray(doc, op.block)!;
      const item = arr.find((it) => it.id === op.item)!;
      Object.assign(item, stripKeys(op.patch, ['id']));
      break;
    }
    case 'removeItem': {
      const block = doc.blocks.find((b) => b.id === op.block)!;
      const key = ARRAY_KEY[block.type]!;
      (block as any)[key] = ((block as any)[key] as { id: string }[]).filter((it) => it.id !== op.item);
      break;
    }
    case 'moveItem': {
      const arr = itemArray(doc, op.block)!;
      const from = arr.findIndex((it) => it.id === op.item);
      const [item] = arr.splice(from, 1);
      arr.splice(resolvePos(arr, op.to), 0, item);
      break;
    }
  }
}

/**
 * Apply an op batch to a doc, returning a new doc. Validates the whole batch
 * against `doc` first; throws ContentOpError on any invalid op (no partial apply).
 */
export function applyOps(doc: ContentDoc, ops: Op[], genId: () => string = defaultGenId): ContentDoc {
  const errors = validateOps(doc, ops);
  if (errors.length) throw new ContentOpError(errors);
  const next: ContentDoc = JSON.parse(JSON.stringify(doc));
  for (const op of ops) applyOne(next, op, genId);
  return next;
}
