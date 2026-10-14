// Tests for applyOps + validation. Run with `npm test` (jest + ts-jest, node env).
import { describe, it, test, expect, beforeEach, jest } from '@jest/globals';
import type { ContentDoc } from './types';
import { applyOps, ContentOpError } from './ops';
import { parseContentDoc, validateOps } from './validate';

// deterministic id factory for stable assertions
let n = 0;
const genId = () => `gen${++n}`;
beforeEach(() => { n = 0; });

const baseDoc = (): ContentDoc => ({
  schemaVersion: 1,
  slug: 'test',
  title: 'Test',
  accent: 'primary',
  tags: [],
  blocks: [
    { id: 'hero', type: 'hero', titleParts: [{ text: 'Hi' }] },
    {
      id: 'acc', type: 'accordion', heading: 'H',
      items: [
        { id: 'i1', title: 'A', icon: 'x', color: 'teal', summary: 's', body: 'b' },
        { id: 'i2', title: 'B', icon: 'x', color: 'coral', summary: 's', body: 'b' },
      ],
    },
    { id: 'recs', type: 'recommendations' },
  ],
});

const ids = (d: ContentDoc) => d.blocks.map((b) => b.id);
const acc = (d: ContentDoc) => d.blocks.find((b) => b.id === 'acc') as any;

describe('applyOps — block ops', () => {
  it('insertBlock at index', () => {
    const d = applyOps(baseDoc(), [{ op: 'insertBlock', at: 1, block: { id: 'q', type: 'quote', text: 'yo' } }], genId);
    expect(ids(d)).toEqual(['hero', 'q', 'acc', 'recs']);
  });
  it('insertBlock after id', () => {
    const d = applyOps(baseDoc(), [{ op: 'insertBlock', at: { after: 'hero' }, block: { id: 'q', type: 'quote', text: 'yo' } }], genId);
    expect(ids(d)).toEqual(['hero', 'q', 'acc', 'recs']);
  });
  it('insertBlock before id', () => {
    const d = applyOps(baseDoc(), [{ op: 'insertBlock', at: { before: 'recs' }, block: { id: 'q', type: 'quote', text: 'yo' } }], genId);
    expect(ids(d)).toEqual(['hero', 'acc', 'q', 'recs']);
  });
  it('insertBlock mints id when missing', () => {
    const d = applyOps(baseDoc(), [{ op: 'insertBlock', at: 99, block: { type: 'quote', text: 'yo' } as any }], genId);
    expect(d.blocks[d.blocks.length - 1].id).toBe('gen1');
  });
  it('updateBlock shallow-merges, never id/type', () => {
    const d = applyOps(baseDoc(), [{ op: 'updateBlock', id: 'acc', patch: { heading: 'New', id: 'HACK', type: 'quote' } }], genId);
    expect(acc(d).heading).toBe('New');
    expect(acc(d).id).toBe('acc');
    expect(acc(d).type).toBe('accordion');
  });
  it('removeBlock', () => {
    const d = applyOps(baseDoc(), [{ op: 'removeBlock', id: 'acc' }], genId);
    expect(ids(d)).toEqual(['hero', 'recs']);
  });
  it('moveBlock to end via after', () => {
    const d = applyOps(baseDoc(), [{ op: 'moveBlock', id: 'hero', to: { after: 'recs' } }], genId);
    expect(ids(d)).toEqual(['acc', 'recs', 'hero']);
  });
});

describe('applyOps — item ops', () => {
  it('updateItem color', () => {
    const d = applyOps(baseDoc(), [{ op: 'updateItem', block: 'acc', item: 'i2', patch: { color: 'sky' } }], genId);
    expect(acc(d).items[1].color).toBe('sky');
  });
  it('moveItem reorders within block', () => {
    const d = applyOps(baseDoc(), [{ op: 'moveItem', block: 'acc', item: 'i2', to: 0 }], genId);
    expect(acc(d).items.map((i: any) => i.id)).toEqual(['i2', 'i1']);
  });
  it('insertItem + removeItem', () => {
    let d = applyOps(baseDoc(), [{ op: 'insertItem', block: 'acc', at: { after: 'i1' }, item: { title: 'C', icon: 'x', color: 'amber', summary: 's', body: 'b' } }], genId);
    expect(acc(d).items.map((i: any) => i.id)).toEqual(['i1', 'gen1', 'i2']);
    d = applyOps(d, [{ op: 'removeItem', block: 'acc', item: 'gen1' }], genId);
    expect(acc(d).items.map((i: any) => i.id)).toEqual(['i1', 'i2']);
  });
});

describe('applyOps — purity & validation', () => {
  it('does not mutate the input doc', () => {
    const d0 = baseDoc();
    const snapshot = JSON.stringify(d0);
    applyOps(d0, [{ op: 'removeBlock', id: 'acc' }], genId);
    expect(JSON.stringify(d0)).toBe(snapshot);
  });
  it('invalid op aborts whole batch (no partial apply)', () => {
    expect(() =>
      applyOps(baseDoc(), [{ op: 'removeBlock', id: 'acc' }, { op: 'removeBlock', id: 'nope' }], genId),
    ).toThrow(ContentOpError);
  });
  it('validateOps flags unknown ids and missing item arrays', () => {
    const d0 = baseDoc();
    expect(validateOps(d0, [{ op: 'updateBlock', id: 'ghost', patch: {} }])).toHaveLength(1);
    expect(validateOps(d0, [{ op: 'updateItem', block: 'hero', item: 'x', patch: {} }]).length).toBeGreaterThanOrEqual(1);
  });
});

describe('parseContentDoc (zod)', () => {
  it('drops malformed blocks, keeps good ones', () => {
    const res = parseContentDoc({
      schemaVersion: 1, slug: 's', title: 'T', accent: 'teal', tags: [],
      blocks: [
        { id: 'ok', type: 'quote', text: 'hi' },
        { id: 'bad', type: 'quote' },            // missing text
        { id: 'weird', type: 'nonexistent' },    // unknown type
      ],
    });
    expect(res.doc).toBeTruthy();
    expect(res.doc!.blocks.map((b) => b.id)).toEqual(['ok']);
    expect(res.warnings).toHaveLength(2);
  });
  it('rejects a doc with a bad accent token', () => {
    const res = parseContentDoc({ schemaVersion: 1, slug: 's', title: 'T', accent: 'chartreuse', tags: [], blocks: [] });
    expect(res.doc).toBeNull();
    expect(res.errors.length).toBeGreaterThanOrEqual(1);
  });
});
