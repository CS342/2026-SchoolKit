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
    expect(e.some((i) => /exactly one/i.test(i.message) && i.blockId === 'h2')).toBe(true);
    expect(e.some((i) => /isn’t first/i.test(i.message) && i.blockId === 'h1')).toBe(true);
  });

  it('warns when recommendations is missing or not last', () => {
    expect(warns(doc([hero()])).some((i) => /doesn’t end with Recommendations/i.test(i.message))).toBe(true);
    expect(warns(doc([hero(), recs('r'), { id: 'c', type: 'callout', icon: 'x', text: 'hi' }])).some((i) => /isn’t the last/i.test(i.message))).toBe(true);
  });

  it('gives every issue a concrete fix', () => {
    const d = doc([{ id: 'c', type: 'callout', icon: 'x', text: 'hi' }, hero('h1'), hero('h2')], '');
    const all = lintDoc(d);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((i) => typeof i.fix === 'string' && i.fix.length > 0)).toBe(true);
  });

  it('flags leftover placeholder text, naming the block, item, and field', () => {
    const d = doc([
      hero(),
      { id: 'fc', type: 'flipCard', heading: 'Common Myths', items: [
        { id: 'f1', front: 'Myth: cancer is contagious', back: 'Cancer is not contagious.', color: 'teal' },
        { id: 'f2', front: 'Myth: it’s the same as adult cancer', back: 'The answer or detail on the back.', color: 'teal' },
      ] },
      recs(),
    ]);
    const hit = warns(d).filter((i) => /placeholder/i.test(i.message));
    expect(hit).toHaveLength(1);
    expect(hit[0].blockId).toBe('fc');
    expect(hit[0].message).toMatch(/Flip cards “Common Myths”: card 2 .*“Back”/);
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
    expect(w.some((i) => /long for a callout \(70 words/i.test(i.message) && i.blockId === 'c')).toBe(true);
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
    expect(w.some((i) => /“Org” has no web address/i.test(i.message))).toBe(true);
  });
});
