// Tests for the pre-publish lint (pure). Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import type { ContentDoc, ContentBlock } from './types';
import { lintDoc } from './lint';

const doc = (blocks: ContentBlock[], title = 'T'): ContentDoc => ({
  schemaVersion: 1, slug: 's', title, accent: 'primary', tags: [], blocks,
});
const hero = (id = 'h'): ContentBlock => ({ id, type: 'hero', titleParts: [{ text: 'Hi' }] });
const recs = (id = 'r'): ContentBlock => ({ id, type: 'recommendations' });
const errs = (d: ContentDoc) => lintDoc(d).filter((i) => i.level === 'error');
const warns = (d: ContentDoc) => lintDoc(d).filter((i) => i.level === 'warning');

describe('lintDoc', () => {
  it('a well-formed page has no errors', () => {
    expect(errs(doc([hero(), { id: 'c', type: 'callout', icon: 'x', text: 'Short note' }, recs()]))).toHaveLength(0);
  });

  it('flags a missing hero', () => {
    expect(errs(doc([recs()])).some((i) => /title block/i.test(i.message))).toBe(true);
  });

  it('flags two heroes and a hero that is not first', () => {
    const d = doc([{ id: 'c', type: 'callout', icon: 'x', text: 'hi' }, hero('h1'), hero('h2'), recs()]);
    const e = errs(d);
    expect(e.some((i) => /keep exactly one/i.test(i.message))).toBe(true);
    expect(e.some((i) => /should be the first/i.test(i.message))).toBe(true);
  });

  it('warns when recommendations is missing or not last', () => {
    expect(warns(doc([hero()])).some((i) => /no recommendations/i.test(i.message))).toBe(true);
    expect(warns(doc([hero(), recs('r'), { id: 'c', type: 'callout', icon: 'x', text: 'hi' }])).some((i) => /should be the last/i.test(i.message))).toBe(true);
  });

  it('warns on missing alt text and an over-long callout', () => {
    const longText = Array.from({ length: 70 }, () => 'word').join(' ');
    const d = doc([
      hero(),
      { id: 'img', type: 'image', url: 'https://x/y.png', alt: '' },
      { id: 'c', type: 'callout', icon: 'x', text: longText },
      recs(),
    ]);
    const w = warns(d);
    expect(w.some((i) => /alt text/i.test(i.message) && i.blockId === 'img')).toBe(true);
    expect(w.some((i) => /callout is long/i.test(i.message) && i.blockId === 'c')).toBe(true);
  });

  it('warns on an empty resourceRefList and a placeholder external link', () => {
    const d = doc([
      hero(),
      { id: 'ref', type: 'resourceRefList', heading: 'H', resourceIds: [] },
      { id: 'll', type: 'linkList', heading: 'H', items: [{ id: 'l1', name: 'Org', icon: 'x', color: 'teal', blurb: 'b', url: 'https://', display: 'd' }] },
      recs(),
    ]);
    const w = warns(d);
    expect(w.some((i) => /no guides selected/i.test(i.message))).toBe(true);
    expect(w.some((i) => /has no URL yet/i.test(i.message))).toBe(true);
  });
});
