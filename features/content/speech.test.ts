// Tests for the read-aloud script. Run with `npm test` (jest + ts-jest, node env).
import { describe, it, expect } from '@jest/globals';
import { docSpeechSegments, splitForSpeech } from './speech';
import { REGISTRY, md } from './registry';
import type { ContentDoc, ContentBlock } from './types';

const doc = (blocks: ContentBlock[], title = 'Page'): ContentDoc => ({
  schemaVersion: 1, slug: 'p', title, accent: 'primary', tags: [], blocks,
});

describe('md', () => {
  it('strips markdown syntax and link targets, ending each line as a sentence', () => {
    expect(md('### Tips\n- **Rest** often\n- See [ACCO](https://acco.org)!')).toBe('Tips.\nRest often.\nSee ACCO!');
  });
});

describe('REGISTRY speech', () => {
  it('reads every block type its own default without throwing', () => {
    for (const def of Object.values(REGISTRY)) expect(typeof def.speech(def.make())).toBe('string');
  });

  it('reads both faces of flip cards', () => {
    const text = REGISTRY.flipCard.speech({
      id: 'f', type: 'flipCard', heading: 'Myths',
      items: [{ id: 'a', front: 'Cancer is contagious', back: 'It is **not** contagious.', color: 'teal' }],
    });
    expect(text).toBe('Myths.\nCancer is contagious.\nIt is not contagious.');
  });

  it('reads collapsed accordion bodies and every tab', () => {
    expect(REGISTRY.accordion.speech({
      id: 'a', type: 'accordion', heading: 'Topics',
      items: [{ id: 'i', title: 'Sleep', icon: 'x', color: 'teal', summary: 'Rest matters', body: 'Hidden detail' }],
    })).toContain('Hidden detail.');
    expect(REGISTRY.tabs.speech({
      id: 't', type: 'tabs', items: [{ id: '1', label: 'One', markdown: 'First' }, { id: '2', label: 'Two', markdown: 'Second' }],
    })).toBe('One.\nFirst.\nTwo.\nSecond.');
  });

  it('numbers stepper steps (language-neutral) and labels comparison cells by column', () => {
    expect(REGISTRY.stepper.speech({
      id: 's', type: 'stepper', heading: 'Plan', steps: [{ id: '1', title: 'Call', icon: 'x', color: 'teal', detail: 'Phone the nurse' }],
    })).toBe('Plan.\n1. Call.\nPhone the nurse.');
    expect(REGISTRY.comparisonTable.speech({
      id: 'c', type: 'comparisonTable', columns: ['Option', 'Cost'], rows: [{ id: 'r', cells: ['Tutor', 'Free'] }],
    })).toBe('Option: Tutor; Cost: Free.');
  });
});

describe('docSpeechSegments', () => {
  it('orders segments by block, skipping silent blocks', () => {
    const segs = docSpeechSegments(doc([
      { id: 'h', type: 'hero', titleParts: [{ text: 'Coping with ' }, { text: 'Fatigue', accent: true }], subtitle: 'A guide' },
      { id: 'd', type: 'divider' },
      { id: 'c', type: 'callout', icon: 'x', text: 'You are not alone' },
      { id: 'r', type: 'recommendations' },
    ], 'Coping with Fatigue'));
    expect(segs.map((s) => s.blockId)).toEqual(['h', 'c']);
    // Unheaded blocks are labeled with the page title, never an editor type name.
    expect(segs.map((s) => s.label)).toEqual(['Coping with Fatigue', 'Coping with Fatigue']);
    expect(segs[0].text).toBe('Coping with Fatigue.\nA guide.');
  });

  it('speaks the doc title when there is no hero', () => {
    expect(docSpeechSegments(doc([], 'Just a title'))[0].text).toBe('Just a title');
  });

  it('splits long blocks into keyed pieces under the limit', () => {
    const long = Array.from({ length: 80 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const segs = docSpeechSegments(doc([{ id: 'rt', type: 'richText', markdown: long }]));
    expect(segs.length).toBeGreaterThan(1);
    expect(segs.every((s) => s.text.length <= 2500)).toBe(true);
    expect(new Set(segs.map((s) => s.key)).size).toBe(segs.length);
  });
});

describe('splitForSpeech', () => {
  it('never exceeds the limit, even for one unbroken run of words', () => {
    const pieces = splitForSpeech('word '.repeat(300), 100);
    expect(pieces.every((p) => p.length <= 100)).toBe(true);
    expect(pieces.join(' ').split(/\s+/).length).toBe(300);
  });
});
