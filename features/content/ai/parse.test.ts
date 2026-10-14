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
