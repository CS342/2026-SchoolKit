// Tests for source fidelity checks. Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import type { ContentDoc } from './types';
import { checkFidelity, splitSentences, normalizeText, fidelityNotices, keepSourceNamedGuides } from './fidelity';

const SOURCE = `# Cancer: Separating Fact from Fiction

You have probably heard things about cancer before from friends, family, social media, or
maybe even from your own experience. Take a few minutes to read through these common myths.

## ❌ Myth #1: Cancer is Contagious

**The Facts:**

This is one of the most common misunderstandings about cancer, and it is completely false.

Here is something important to understand, though: kids who are going through cancer treatment often have weakened immune systems.

If you are the one taking precautions, it can sometimes feel like the mask is setting you apart.`;

const doc = (blocks: any[]): ContentDoc => ({ schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [], blocks } as ContentDoc);

describe('splitSentences', () => {
  it('joins wrapped lines, keeps headings separate, splits sentences', () => {
    const s = splitSentences(SOURCE);
    expect(s).toContain('Cancer: Separating Fact from Fiction');
    expect(s).toContain('You have probably heard things about cancer before from friends, family, social media, or maybe even from your own experience.');
    expect(s).toContain('Take a few minutes to read through these common myths.');
    expect(s).toContain('❌ Myth #1: Cancer is Contagious');
  });
});

describe('normalizeText', () => {
  it('ignores case, punctuation, emoji, markdown and link targets', () => {
    expect(normalizeText('Here is **something**, though: kids [see this](https://x.org) ❌!'))
      .toBe('here is something though kids see this');
  });
});

describe('checkFidelity', () => {
  it('passes a faithful page, whatever the punctuation or layout', () => {
    const page = doc([
      { id: 'h', type: 'hero', titleParts: [{ text: 'Cancer: Separating ' }, { text: 'Fact', accent: true }, { text: ' from Fiction' }] },
      { id: 'r', type: 'richText', markdown: 'You have probably heard things about cancer before from friends, family, social media, or maybe even from your own experience. Take a few minutes to read through these common myths.' },
      { id: 'f', type: 'flipCard', items: [{ id: 'i', front: 'Myth #1: Cancer is Contagious', back: 'This is one of the most common misunderstandings about cancer, and it is completely false.\n\nHere is something important to understand, though, kids who are going through cancer treatment often have weakened immune systems.\n\nIf you are the one taking precautions, it can sometimes feel like the mask is setting you apart.', icon: 'x', color: 'teal' }] },
    ]);
    const r = checkFidelity(page, [SOURCE]);
    expect(r.missing).toEqual([]);
    expect(r.invented).toEqual([]);
    expect(r.coverage).toBe(1);
  });

  it('finds dropped and reworded sentences, and invented copy', () => {
    const page = doc([
      { id: 'h', type: 'hero', titleParts: [{ text: 'Cancer: Separating Fact from Fiction' }] },
      { id: 'c', type: 'callout', icon: 'heart-outline', text: 'Knowing the facts about cancer can help you support your friends and classmates better.' },
      { id: 'f', type: 'flipCard', items: [{ id: 'i', front: 'Myth #1: Cancer is Contagious', back: 'This is one of the most common misunderstandings about cancer, and it is completely false. Kids who are going through cancer treatment often have weakened immune systems.', icon: 'x', color: 'teal' }] },
    ]);
    const r = checkFidelity(page, [SOURCE]);
    expect(r.missing).toEqual([
      'You have probably heard things about cancer before from friends, family, social media, or maybe even from your own experience.',
      'Take a few minutes to read through these common myths.',
      'Here is something important to understand, though: kids who are going through cancer treatment often have weakened immune systems.',
      'If you are the one taking precautions, it can sometimes feel like the mask is setting you apart.',
    ]);
    // The shortened "Kids who are going through…" is still source wording, so it's not
    // invented — its full sentence is reported as missing above.
    expect(r.invented).toEqual([
      { text: 'Knowing the facts about cancer can help you support your friends and classmates better.', blockId: 'c' },
    ]);
    expect(r.coverage).toBeCloseTo(3 / 7);
  });

  it('ignores settings fields and short labels', () => {
    const page = doc([{ id: 'c', type: 'callout', icon: 'information-circle-outline-but-very-long-icon-name-here', text: 'Common myths' }]);
    expect(checkFidelity(page, [SOURCE]).invented).toEqual([]);
  });
});

describe('keepSourceNamedGuides', () => {
  const titles = new Map([['11', "Understanding What Cancer Is and Isn't"], ['13', 'The School Nurse: Your Ally at School'], ['cp_x', 'Talking to Teachers About Appointments']]);
  const refs = (ids: string[]) => doc([{ id: 'h', type: 'hero', titleParts: [{ text: 'T' }] }, { id: 'g', type: 'resourceRefList', heading: 'Related Guides', resourceIds: ids }]);

  it('drops a guide list the source never mentions', () => {
    const out = keepSourceNamedGuides(refs(['11', 'cp_x']), [SOURCE], titles);
    expect(out.blocks.map((b) => b.type)).toEqual(['hero']);
  });

  it('keeps only the guides the source names', () => {
    const source = `${SOURCE}\n\nAlso read: The School Nurse — Your Ally at School.`;
    const out = keepSourceNamedGuides(refs(['11', '13']), [source], titles);
    expect((out.blocks[1] as any).resourceIds).toEqual(['13']);
  });

  it('leaves a page with no guide lists untouched', () => {
    const d = doc([{ id: 'h', type: 'hero', titleParts: [{ text: 'T' }] }]);
    expect(keepSourceNamedGuides(d, [SOURCE], titles)).toBe(d);
  });
});

describe('fidelityNotices', () => {
  it('summarizes missing text and points at invented text', () => {
    const notices = fidelityNotices({ missing: ['a b c d', 'e f g h', 'i j k l', 'm n o p'], invented: [{ text: 'made up words that are not in the file', blockId: 'c' }], coverage: 0.5 }, 'parents.docx');
    expect(notices[0].message).toContain('4 sentences from parents.docx');
    expect(notices[0].message).toContain('(and 1 more)');
    expect(notices[1]).toMatchObject({ blockId: 'c' });
  });
});
