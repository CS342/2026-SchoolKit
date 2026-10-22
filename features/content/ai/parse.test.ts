// Tests for AI-output validation (pure). Run with `npm test`.
import { describe, it, test, expect } from '@jest/globals';
import type { ContentDoc } from '../types';
import { parseGenerateResult, parseEditResult } from './parse';

const doc = (): ContentDoc => ({
  schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [],
  blocks: [
    { id: 'hero', type: 'hero', titleParts: [{ text: 'Hi' }] },
    { id: 'acc', type: 'accordion', heading: 'H', items: [{ id: 'i1', title: 'A', icon: 'x', color: 'teal', summary: 's', body: 'b' }] },
    { id: 'recs', type: 'recommendations' },
  ],
});

describe('parseGenerateResult', () => {
  it('accepts a valid ContentDoc and drops bad blocks', () => {
    const res = parseGenerateResult({
      schemaVersion: 1, slug: 'x', title: 'X', accent: 'teal', tags: ['a'],
      blocks: [
        { id: 'h', type: 'hero', titleParts: [{ text: 'Yo' }] },
        { id: 'bad', type: 'callout' },        // missing icon/text → dropped
        { id: 'r', type: 'recommendations' },
      ],
    });
    expect(res.doc).toBeTruthy();
    expect(res.doc!.blocks.map((b) => b.id)).toEqual(['h', 'r']);
    expect(res.warnings.length).toBe(1);
  });
  it('rejects a non-doc', () => {
    expect(parseGenerateResult({ nope: true }).doc).toBeNull();
  });
});

describe('parseEditResult', () => {
  it('accepts valid ops', () => {
    const r = parseEditResult({ summary: 'Warmed it up', ops: [{ op: 'updateBlock', id: 'acc', patch: { heading: 'New' } }] }, doc());
    expect(r.errors).toHaveLength(0);
    expect(r.summary).toBe('Warmed it up');
    expect(r.ops).toHaveLength(1);
  });
  it('flags ops referencing unknown ids', () => {
    const r = parseEditResult({ summary: 'x', ops: [{ op: 'removeBlock', id: 'ghost' }] }, doc());
    expect(r.errors.length).toBeGreaterThanOrEqual(1);
  });
  it('handles a missing ops array', () => {
    const r = parseEditResult({ summary: 'x' }, doc());
    expect(r.errors.length).toBeGreaterThanOrEqual(1);
    expect(r.ops).toHaveLength(0);
  });
  it('handles a non-object response', () => {
    expect(parseEditResult('nope', doc()).errors.length).toBeGreaterThanOrEqual(1);
  });
});

describe('parseGenerateResult — new block types', () => {
  it('keeps valid new blocks and drops a malformed one', () => {
    const res = parseGenerateResult({
      schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [],
      blocks: [
        { id: 'd', type: 'divider', variant: 'dots' },
        { id: 'ref', type: 'references', items: [{ id: 'r1', label: 'Source' }] },
        { id: 'chk', type: 'checklist', items: [{ id: 'c1', text: 'Pack bag' }] },
        { id: 'stat', type: 'statGrid', items: [{ id: 's1', value: '1 in 5', label: 'kids', color: 'teal' }] },
        { id: 'gal', type: 'gallery', items: [{ id: 'g1', url: 'https://x/y.png', alt: 'pic' }] },
        { id: 'tst', type: 'testimonials', items: [{ id: 't1', text: 'It helped.' }] },
        { id: 'badstat', type: 'statGrid', items: [{ id: 'b1', label: 'no value', color: 'teal' }] }, // item missing value → dropped
      ],
    });
    expect(res.doc).toBeTruthy();
    expect(res.doc!.blocks.map((b) => b.id)).toEqual(['d', 'ref', 'chk', 'stat', 'gal', 'tst']);
    expect(res.warnings).toHaveLength(1);
  });
  it('round-trips columns, tabs, flipCard, comparisonTable, video; drops a url-less video', () => {
    const res = parseGenerateResult({
      schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [],
      blocks: [
        { id: 'col', type: 'columns', left: 'L', right: 'R' },
        { id: 'tab', type: 'tabs', items: [{ id: 't1', label: 'One', markdown: 'hi' }] },
        { id: 'flip', type: 'flipCard', items: [{ id: 'f1', front: 'Q', back: 'A', color: 'teal' }] },
        { id: 'cmp', type: 'comparisonTable', columns: ['A', 'B'], rows: [{ id: 'r1', cells: ['x', 'y'] }] },
        { id: 'vid', type: 'video', provider: 'youtube', url: 'https://youtu.be/abcdef' },
        { id: 'badvid', type: 'video', provider: 'mp4' }, // missing url → dropped
      ],
    });
    expect(res.doc!.blocks.map((b) => b.id)).toEqual(['col', 'tab', 'flip', 'cmp', 'vid']);
    expect(res.warnings).toHaveLength(1);
  });
});

describe('parseGenerateResult — repair instead of dropping', () => {
  const gen = (blocks: unknown[]) => parseGenerateResult({ schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [], blocks });

  it('keeps a flipCard block whose items have bad/missing colors, ids, and numeric text', () => {
    const res = gen([
      { id: 'h', type: 'hero', titleParts: [{ text: 'Myths' }] },
      { type: 'flipCard', heading: 'Common Myths', items: [ // block id missing
        { id: 'f1', front: 'Myth: Cancer is contagious', back: 'Cancer is not contagious!', color: 'red' },
        { front: 'Myth: Same as adult cancer', back: 'Childhood cancers are different.' },   // no id, no color
        { id: 'f3', front: 'Survival rate', back: 85, color: 'teal', icon: null },            // number + null
      ] },
      { id: 'r', type: 'recommendations' },
    ]);
    expect(res.notices).toHaveLength(0);
    const fc = res.doc!.blocks[1] as any;
    expect(fc.type).toBe('flipCard');
    expect(fc.id).toBeTruthy();
    expect(fc.items).toHaveLength(3);
    // verbatim text untouched
    expect(fc.items[0].back).toBe('Cancer is not contagious!');
    expect(fc.items[1].front).toBe('Myth: Same as adult cancer');
    expect(fc.items[2].back).toBe('85');
    expect(fc.items.every((i: any) => ['primary', 'teal', 'coral', 'amber', 'indigo', 'sky'].includes(i.color) && i.id)).toBe(true);
  });

  it('fills a missing required text field with a placeholder (flagged later by lint), keeping the rest', () => {
    const res = gen([{ id: 'fc', type: 'flipCard', items: [{ id: 'f1', front: 'Myth: X', color: 'teal' }] }]);
    const item = (res.doc!.blocks[0] as any).items[0];
    expect(item.front).toBe('Myth: X');
    expect(item.back).toBe('The answer or detail on the back.');
  });

  it('leaves out only the broken item, with a notice naming the block and item', () => {
    const res = gen([{ id: 'st', type: 'statGrid', heading: 'By the numbers', items: [
      { id: 's1', value: '1 in 285', label: 'children diagnosed', color: 'teal' },
      { id: 's2', label: 'no number given', color: 'teal' }, // stat values are never invented
    ] }]);
    expect((res.doc!.blocks[0] as any).items).toHaveLength(1);
    expect(res.notices).toHaveLength(1);
    expect(res.notices[0].blockId).toBe('st');
    expect(res.notices[0].message).toMatch(/“By the numbers”.*“no number given”.*left out/);
    expect(res.notices[0].fix).toBeTruthy();
  });

  it('explains a dropped block with its content and a fix', () => {
    const res = gen([{ id: 'x', type: 'mythBuster', heading: 'Myths', items: [{ text: 'Cancer is not contagious at all.' }] }]);
    expect(res.doc!.blocks).toHaveLength(0);
    expect(res.notices[0].message).toMatch(/“mythBuster”.*Cancer is not contagious/);
    expect(res.notices[0].fix).toBeTruthy();
  });
});

describe('parseEditResult — repairs inserted blocks/items', () => {
  it('repairs an inserted block and an inserted item instead of rejecting the batch', () => {
    const r = parseEditResult({ summary: 's', ops: [
      { op: 'insertBlock', at: 1, block: { type: 'flipCard', items: [{ front: 'A', back: 'B', color: 'purple' }] } },
      { op: 'insertItem', block: 'acc', at: 0, item: { title: 'New', summary: 'sum', body: 'Body text', color: 'magenta' } },
    ] }, doc());
    expect(r.errors).toHaveLength(0);
    expect((r.ops[0] as any).block.items[0].color).not.toBe('purple');
    expect((r.ops[1] as any).item.icon).toBe('ellipse-outline');
  });
});
