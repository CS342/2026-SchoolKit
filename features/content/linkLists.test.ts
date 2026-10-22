// Tests for turning link lists in Text blocks into External links blocks. Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import type { ContentDoc } from './types';
import { linkListsFromText } from './linkLists';
import { checkFidelity } from './fidelity';

const doc = (blocks: any[]): ContentDoc => ({ schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [], blocks } as ContentDoc);

const BOTTOM_LINE = 'These are just a few of the most common myths about childhood cancer, but they cover some of the most important ones.';
const LIST = [
  'Want to learn more? Check out these great resources:',
  '',
  "- [Alex's Lemonade Stand: Six Childhood Cancer Myths](https://www.alexslemonade.org/myths)",
  '- [Myths and Misconceptions About Childhood Cancer](https://example.org/myths)',
  '- [Childhood Cancer Fact Library](https://facts.example.org/library) — Facts and figures.',
].join('\n');

describe('linkListsFromText', () => {
  it('splits a trailing link list out of a Text block, keeping the prose and the intro line', () => {
    const out = linkListsFromText(doc([{ id: 'b', type: 'richText', heading: 'The Bottom Line', markdown: `${BOTTOM_LINE}\n\n${LIST}` }]));
    expect(out.blocks).toHaveLength(2);
    expect(out.blocks[0]).toEqual({ id: 'b', type: 'richText', heading: 'The Bottom Line', markdown: BOTTOM_LINE });
    const list = out.blocks[1] as any;
    expect(list).toMatchObject({ id: 'b-links', type: 'linkList', heading: 'Want to learn more? Check out these great resources:' });
    expect(list.items.map((i: any) => [i.name, i.url, i.display, i.blurb])).toEqual([
      ["Alex's Lemonade Stand: Six Childhood Cancer Myths", 'https://www.alexslemonade.org/myths', 'alexslemonade.org', undefined],
      ['Myths and Misconceptions About Childhood Cancer', 'https://example.org/myths', 'example.org', undefined],
      ['Childhood Cancer Fact Library', 'https://facts.example.org/library', 'facts.example.org', 'Facts and figures.'],
    ]);
    expect(new Set(list.items.map((i: any) => i.id)).size).toBe(3);
  });

  it('loses no words (fidelity still passes)', () => {
    const before = doc([{ id: 'b', type: 'richText', heading: 'The Bottom Line', markdown: `${BOTTOM_LINE}\n\n${LIST}` }]);
    const source = `The Bottom Line\n\n${BOTTOM_LINE}\n\n${LIST}`;
    expect(checkFidelity(linkListsFromText(before), [source])).toMatchObject({ missing: [], invented: [] });
  });

  it('moves a list-only Text block wholesale, keeping its heading', () => {
    const out = linkListsFromText(doc([{ id: 'b', type: 'richText', heading: 'Resources', markdown: LIST }]));
    expect(out.blocks).toHaveLength(1);
    expect(out.blocks[0]).toMatchObject({ type: 'linkList', heading: 'Resources', subheading: 'Want to learn more? Check out these great resources:' });
  });

  it('keeps text after the list in its own Text block', () => {
    const out = linkListsFromText(doc([{ id: 'b', type: 'richText', markdown: `${LIST}\n\nThanks for reading these resources today.` }]));
    expect(out.blocks.map((b) => b.type)).toEqual(['linkList', 'richText']);
    expect((out.blocks[1] as any).markdown).toBe('Thanks for reading these resources today.');
  });

  it('leaves prose with inline links, and single links, alone', () => {
    const d = doc([
      { id: 'a', type: 'richText', markdown: 'See [this guide](https://x.org) and [that one](https://y.org) for more.' },
      { id: 'c', type: 'richText', markdown: '- [Only one](https://z.org)' },
    ]);
    expect(linkListsFromText(d)).toBe(d);
  });
});
