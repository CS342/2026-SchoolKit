// Tests for the generate prompt's topic-version context. Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import type { ContentDoc } from '../types';
import { buildGenerateMessages, buildEditMessages, layoutOutline, SYSTEM_PROMPT } from './prompt';

const sibling: ContentDoc = {
  schemaVersion: 1,
  slug: 's',
  title: 'What Cancer Is',
  accent: 'primary',
  tags: [],
  blocks: [
    { id: 'h', type: 'hero', titleParts: [{ text: 'Secret hero wording' }] },
    {
      id: 'a', type: 'accordion', heading: 'Secret accordion heading',
      items: [
        { id: 'i1', title: 'Secret item', icon: 'x', color: 'teal', summary: 'secret summary', body: 'secret body' },
        { id: 'i2', title: 'Secret item 2', icon: 'x', color: 'teal', summary: 'secret summary', body: 'secret body' },
      ],
    },
    { id: 'r', type: 'recommendations' },
  ],
} as ContentDoc;

const userText = (msgs: ReturnType<typeof buildGenerateMessages>) => {
  const c = msgs[1].content;
  return typeof c === 'string' ? c : c.map((p) => ('text' in p ? p.text : '')).join('');
};

describe('layoutOutline', () => {
  it('lists block types in order, without any wording or item counts', () => {
    const outline = layoutOutline(sibling);
    expect(outline).toBe('1. hero\n2. accordion\n3. recommendations');
    expect(outline.toLowerCase()).not.toContain('secret');
  });
});

describe('buildGenerateMessages — version options', () => {
  it('adds nothing without options', () => {
    const text = userText(buildGenerateMessages('A guide', []));
    expect(text).not.toContain('AUDIENCE:');
    expect(text).not.toContain('LAYOUT REFERENCE');
  });

  it('includes the audience and the sibling layout, but not its copy', () => {
    const text = userText(buildGenerateMessages('A guide', [], [], [], {
      audience: { roles: ['parent'], ageBands: ['elementary'] },
      layoutFrom: sibling,
    }));
    expect(text).toContain('AUDIENCE:');
    expect(text).toContain('Parents · Elementary');
    expect(text).toContain('LAYOUT REFERENCE');
    expect(text).toContain('2. accordion');
    expect(text).toContain('never shorten');
    expect(text.toLowerCase()).not.toContain('secret');
  });

  it('turns on source-only rules when files are attached', () => {
    const withFile = userText(buildGenerateMessages('', [], [], [{ kind: 'text', id: 'a', name: 'parents.docx', text: 'Some text.', links: [] }]));
    expect(withFile).toContain('SOURCE-ONLY');
    expect(userText(buildGenerateMessages('A guide', []))).not.toContain('SOURCE-ONLY');
  });
});

describe('icons and language', () => {
  it('offers the curated icons, including the specific mci: ones', () => {
    expect(SYSTEM_PROMPT).toContain('mci:home-heart');
    expect(SYSTEM_PROMPT).toContain('mci:forum');
    expect(SYSTEM_PROMPT).toContain('heart-outline');
    expect(SYSTEM_PROMPT).not.toContain('Icons are Ionicons outline names');
  });

  it('tells generation which language the page is in', () => {
    expect(userText(buildGenerateMessages('Make a page', [], [], [], { language: 'es' }))).toMatch(/LANGUAGE: This page is in Spanish/);
    expect(userText(buildGenerateMessages('Make a page', []))).not.toMatch(/LANGUAGE: This page is in/);
  });
});

describe('edit messages', () => {
  const spanish = { ...sibling, language: 'es', translatedFrom: { pageId: 'p-en', textHashes: { 'h.titleParts[0].text': 'deadbeef' } } } as ContentDoc;
  const editText = (doc: ContentDoc) => userText(buildEditMessages(doc, 'Add a section', []));

  it('leaves translation bookkeeping out of the page the AI sees', () => {
    expect(editText(spanish)).not.toContain('textHashes');
    expect(editText(spanish)).not.toContain('deadbeef');
    expect(editText(spanish)).toContain('Secret hero wording');
  });

  it('forbids new wording on translated versions only', () => {
    expect(editText(spanish)).toMatch(/TRANSLATED VERSION: This page is the Spanish version/);
    expect(editText(sibling)).not.toMatch(/TRANSLATED VERSION/);
  });
});
