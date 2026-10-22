// Tests for audience targeting. Run with `npm test` (jest + ts-jest, node env).
import { describe, it, expect } from '@jest/globals';
import { gradeToAgeBand, isVisibleTo, parseAudience, type AgeBand } from './audience';
import { parseContentDoc } from './validate';

describe('gradeToAgeBand', () => {
  // Every value offered by app/edit-grade-level.tsx's three grade lists.
  const cases: [string, AgeBand][] = [
    ['pre-k', 'elementary'], ['elementary', 'elementary'],
    ['6', 'middle'], ['7', 'middle'], ['8', 'middle'], ['middle-school', 'middle'],
    ['9', 'high'], ['10', 'high'], ['11', 'high'], ['12', 'high'], ['high-school', 'high'],
    ['college', 'beyond'], ['high-school-up', 'beyond'],
  ];
  it.each(cases)('%s → %s', (grade, band) => expect(gradeToAgeBand(grade)).toBe(band));

  it('returns null for unknown or empty grades', () => {
    expect(gradeToAgeBand('')).toBeNull();
    expect(gradeToAgeBand('kindergarten')).toBeNull();
  });
});

describe('isVisibleTo', () => {
  const parentOfElementary = { role: 'parent' as const, gradeLevel: 'elementary' };
  const hsStudent = { role: 'student-hs' as const, gradeLevel: '10' };

  it('shows untargeted content to everyone', () => {
    expect(isVisibleTo(undefined, hsStudent)).toBe(true);
    expect(isVisibleTo({}, hsStudent)).toBe(true);
    expect(isVisibleTo({ roles: [], ageBands: [] }, hsStudent)).toBe(true);
  });

  it('filters by role only', () => {
    const a = { roles: ['parent' as const] };
    expect(isVisibleTo(a, parentOfElementary)).toBe(true);
    expect(isVisibleTo(a, hsStudent)).toBe(false);
  });

  it('keeps middle and high school students separate', () => {
    const a = { roles: ['student-k8' as const] };
    expect(isVisibleTo(a, { role: 'student-k8', gradeLevel: '7' })).toBe(true);
    expect(isVisibleTo(a, hsStudent)).toBe(false);
  });

  it("applies grade bands to parents and staff only, never to students", () => {
    const a = { roles: ['student-hs' as const, 'parent' as const], ageBands: ['elementary' as const] };
    expect(isVisibleTo(a, hsStudent)).toBe(true);
    expect(isVisibleTo(a, { role: 'student-hs', gradeLevel: 'college' })).toBe(true);
    expect(isVisibleTo(a, parentOfElementary)).toBe(true);
    expect(isVisibleTo(a, { role: 'parent', gradeLevel: 'high-school' })).toBe(false);
  });

  it('requires both role and age band when both are set', () => {
    const a = { roles: ['parent' as const], ageBands: ['elementary' as const] };
    expect(isVisibleTo(a, parentOfElementary)).toBe(true);
    expect(isVisibleTo(a, { role: 'parent', gradeLevel: 'high-school' })).toBe(false);
    expect(isVisibleTo(a, { role: 'staff', gradeLevel: 'elementary' })).toBe(false);
  });

  it('fails open on dimensions the viewer has not chosen yet', () => {
    const a = { roles: ['parent' as const], ageBands: ['elementary' as const] };
    expect(isVisibleTo(a, { role: null, gradeLevel: '' })).toBe(true);
    expect(isVisibleTo(a, { role: 'parent', gradeLevel: '' })).toBe(true);
    expect(isVisibleTo(a, { role: 'student-hs', gradeLevel: '' })).toBe(false);
  });
});

describe('parseAudience', () => {
  it('keeps known values and de-duplicates', () => {
    expect(parseAudience({ roles: ['parent', 'parent', 'staff'], ageBands: ['middle'] }))
      .toEqual({ roles: ['parent', 'staff'], ageBands: ['middle'] });
  });

  it('drops unknown values and empty dimensions', () => {
    expect(parseAudience({ roles: ['admin', 3, 'staff'], ageBands: ['high'] })).toEqual({ roles: ['staff'], ageBands: ['high'] });
    expect(parseAudience({ roles: ['admin'], ageBands: [] })).toBeUndefined();
  });

  it('drops grade bands unless parents or staff are targeted', () => {
    expect(parseAudience({ ageBands: ['high'] })).toBeUndefined();
    expect(parseAudience({ roles: ['student-k8'], ageBands: ['middle'] })).toEqual({ roles: ['student-k8'] });
    expect(parseAudience({ roles: ['student-k8', 'staff'], ageBands: ['middle'] })).toEqual({ roles: ['student-k8', 'staff'], ageBands: ['middle'] });
  });

  it('returns undefined for non-objects', () => {
    expect(parseAudience(undefined)).toBeUndefined();
    expect(parseAudience('parent')).toBeUndefined();
    expect(parseAudience(null)).toBeUndefined();
  });
});

describe('parseContentDoc keeps audience', () => {
  const base = { schemaVersion: 1, slug: 's', title: 'T', accent: 'primary', tags: [], blocks: [] };

  it('round-trips a valid audience', () => {
    const res = parseContentDoc({ ...base, audience: { roles: ['parent'], ageBands: ['elementary'] } });
    expect(res.doc?.audience).toEqual({ roles: ['parent'], ageBands: ['elementary'] });
  });

  it('leaves audience undefined when missing or invalid', () => {
    expect(parseContentDoc(base).doc?.audience).toBeUndefined();
    expect(parseContentDoc({ ...base, audience: { roles: ['nobody'] } }).doc?.audience).toBeUndefined();
  });
});
