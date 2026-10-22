// Tests for translated versions. Run with `npm test`.
import { describe, it, expect } from '@jest/globals';
import type { ContentDoc } from './types';
import { FIXTURE_DOCS } from './fixtures';
import { parseContentDoc } from './validate';
import {
  textSlots, applySlots, textHash, translationSource, staleTexts,
  buildAlignMessages, parseAlignResult, checkAlignment, alignmentIsClean,
} from './translate';

const doc: ContentDoc = {
  schemaVersion: 1,
  slug: 'coping',
  title: 'Coping with Fatigue',
  accent: 'teal',
  tags: ['health'],
  category: 'Health',
  blocks: [
    { id: 'h', type: 'hero', eyebrowIcon: 'leaf-outline', eyebrowColor: 'teal', titleParts: [{ text: 'Coping with ' }, { text: 'Fatigue', accent: true }], subtitle: 'Feeling tired is normal.' },
    { id: 'c', type: 'callout', icon: 'information-circle-outline', tone: 'teal', text: 'Rest is part of treatment. See [this guide](https://example.org/rest).' },
    { id: 'a', type: 'accordion', heading: 'Tips', items: [
      { id: 'i1', title: 'Sleep', icon: 'bed-outline', color: 'sky', summary: 'Keep a routine.', body: '- Go to bed early\n- Nap briefly' },
    ] },
  ],
} as ContentDoc;

describe('textSlots', () => {
  it('lists reader-visible text in page order and skips settings', () => {
    const slots = textSlots(doc);
    expect(slots.map((s) => s.text)).toEqual([
      'Coping with Fatigue', 'Coping with ', 'Fatigue', 'Feeling tired is normal.',
      'Rest is part of treatment. See [this guide](https://example.org/rest).',
      'Tips', 'Sleep', 'Keep a routine.', '- Go to bed early\n- Nap briefly',
    ]);
    // icons, colors, tones, ids and slugs are never text
    expect(slots.some((s) => /outline|teal|sky/.test(s.text))).toBe(false);
  });

  it('keys texts by block and item id, so keys survive blocks moving', () => {
    const keys = textSlots(doc).map((s) => s.key);
    expect(keys).toContain('a.items[i1].summary');
    const moved = { ...doc, blocks: [doc.blocks[2], doc.blocks[0], doc.blocks[1]] } as ContentDoc;
    expect(new Set(textSlots(moved).map((s) => s.key))).toEqual(new Set(keys));
  });

  it('marks the highlighted hero title part for the model', () => {
    const accent = textSlots(doc).find((s) => s.text === 'Fatigue')!;
    expect(accent.hint).toMatch(/highlighted/);
  });

  it('covers every fixture page without touching non-text fields', () => {
    for (const fixture of Object.values(FIXTURE_DOCS)) {
      const slots = textSlots(fixture);
      expect(slots.length).toBeGreaterThan(5);
      // Replacing every text keeps the doc valid with the same structure.
      const values = Object.fromEntries(slots.map((s) => [s.id, `ES ${s.text}`]));
      const out = applySlots(fixture, slots, values);
      const parsed = parseContentDoc(out);
      expect(parsed.errors).toEqual([]);
      expect(parsed.doc!.blocks.map((b) => b.id)).toEqual(fixture.blocks.map((b) => b.id));
      expect(parsed.doc!.blocks.map((b) => b.type)).toEqual(fixture.blocks.map((b) => b.type));
    }
  });
});

describe('applySlots', () => {
  it('replaces text at each slot and leaves the original untouched', () => {
    const slots = textSlots(doc);
    const values = { s1: 'Cómo sobrellevar la fatiga', s2: 'Cómo sobrellevar la ', s3: 'fatiga', s7: null };
    const out = applySlots(doc, slots, values) as any;
    expect(out.title).toBe('Cómo sobrellevar la fatiga');
    expect(out.blocks[0].titleParts).toEqual([{ text: 'Cómo sobrellevar la ' }, { text: 'fatiga', accent: true }]);
    expect(out.blocks[0].eyebrowIcon).toBe('leaf-outline');
    expect(out.blocks[2].items[0].title).toBe('Sleep'); // null keeps the source text
    expect((doc as any).blocks[0].titleParts[0].text).toBe('Coping with ');
  });
});

describe('change tracking', () => {
  it('hashes stably and differently', () => {
    expect(textHash('abc')).toBe(textHash('abc'));
    expect(textHash('abc')).not.toBe(textHash('abd'));
    expect(textHash('')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('reports texts changed, added and removed since translation', () => {
    const source = translationSource('page-en', doc);
    expect(staleTexts(source, doc)).toEqual({ changed: [], removed: 0 });

    const edited = JSON.parse(JSON.stringify(doc));
    edited.blocks[0].subtitle = 'Feeling tired is very normal.';
    edited.blocks[2].items = [];
    const stale = staleTexts(source, edited);
    expect(stale.changed.map((s) => s.text)).toEqual(['Feeling tired is very normal.']);
    expect(stale.removed).toBe(3); // the removed item's title, summary and body
  });
});

describe('alignment request and checks', () => {
  const slots = textSlots(doc);
  const translation = [
    'Cómo sobrellevar la fatiga',
    'Sentirse cansado es normal.',
    'El descanso es parte del tratamiento. Consulta esta guía.',
    'Consejos',
    'Dormir',
    'Mantén una rutina.',
    '- Acuéstate temprano',
    '- Toma siestas cortas',
  ].join('\n');

  it('sends every text with its id and hint, plus the translation', () => {
    const [system, user] = buildAlignMessages(slots, translation, 'es');
    expect(system.content).toMatch(/Spanish/);
    expect(system.content).toMatch(/EXACTLY/);
    expect(user.content).toContain('s4 [hero.subtitle]: "Feeling tired is normal."');
    expect(user.content).toContain(translation);
  });

  it('parses answers, treating missing or blank ones as null', () => {
    expect(parseAlignResult({ texts: { s1: 'Hola', s2: '  ' } }, slots.slice(0, 3))).toEqual({ s1: 'Hola', s2: null, s3: null });
    expect(parseAlignResult('nonsense', slots.slice(0, 1))).toEqual({ s1: null });
  });

  const good: Record<string, string | null> = {
    s1: 'Cómo sobrellevar la fatiga', s2: 'Cómo sobrellevar la ', s3: 'fatiga', s4: 'Sentirse cansado es normal.',
    s5: 'El descanso es parte del tratamiento. Consulta [esta guía](https://example.org/rest).',
    s6: 'Consejos', s7: 'Dormir', s8: 'Mantén una rutina.', s9: '- Acuéstate temprano\n- Toma siestas cortas',
  };

  it('passes a faithful alignment', () => {
    const report = checkAlignment(slots, good, applySlots(doc, slots, good), translation);
    expect(report).toEqual({ untranslated: [], notInFile: [], lostLinks: [], unused: [] });
    expect(alignmentIsClean(report)).toBe(true);
  });

  it('flags text the model wrote itself, lost links, gaps and leftover translation', () => {
    const bad = { ...good, s4: 'Estar cansado es muy normal.', s5: 'El descanso es parte del tratamiento. Consulta esta guía.', s8: null };
    const report = checkAlignment(slots, bad, applySlots(doc, slots, bad), translation);
    expect(report.notInFile.map((x) => x.slot.id)).toEqual(['s4']);
    expect(report.lostLinks.map((s) => s.id)).toEqual(['s5']);
    expect(report.untranslated.map((s) => s.id)).toEqual(['s8']);
    // "Mantén una rutina." is too short to check on its own; the gap shows as untranslated.
    expect(report.unused).toEqual(['Sentirse cansado es normal.']);
  });

  it("doesn't count numbers and symbols the translation repeats as untranslated", () => {
    const stat = { ...doc, blocks: [{ id: 'st', type: 'statGrid', items: [{ id: 'x', value: '100%', label: 'Covered', color: 'teal' }] }] } as ContentDoc;
    const s = textSlots(stat);
    const report = checkAlignment(s, { s1: 'Cómo sobrellevar la fatiga', s2: null, s3: 'Cubierto' }, stat, 'Cómo sobrellevar la fatiga\nCubierto');
    expect(report.untranslated).toEqual([]);
  });
});
