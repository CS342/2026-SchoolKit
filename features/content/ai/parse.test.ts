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
