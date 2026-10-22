// Tests for topic versions. Run with `npm test` (jest + ts-jest, node env).
import { describe, it, expect } from '@jest/globals';
import {
  pickVersion, rankVersions, fallbackVersion, resolveTopics, audienceLabel, coverage, VIEWER_CELLS, guessAudienceFromFilename, tieNotices,
} from './versions';
import type { Audience } from './audience';

const v = (id: string, audience?: Audience) => ({ id, audience });

const everyone = v('everyone');
const parents = v('parents', { roles: ['parent'] });
const parentsElem = v('parents-elem', { roles: ['parent'], ageBands: ['elementary'] });
const hs = v('hs', { roles: ['student-hs'] });

describe('pickVersion', () => {
  it('gives the most specific matching version', () => {
    const versions = [everyone, parents, parentsElem];
    expect(pickVersion(versions, { role: 'parent', gradeLevel: 'elementary' })?.id).toBe('parents-elem');
    expect(pickVersion(versions, { role: 'parent', gradeLevel: 'high-school' })?.id).toBe('parents');
    expect(pickVersion(versions, { role: 'student-hs', gradeLevel: '10' })?.id).toBe('everyone');
  });

  it("ignores grade bands for students — their role already says their level", () => {
    const mixed = v('mixed', { roles: ['student-hs', 'parent'], ageBands: ['elementary'] });
    expect(pickVersion([everyone, mixed], { role: 'student-hs', gradeLevel: 'college' })?.id).toBe('mixed');
    expect(pickVersion([everyone, mixed], { role: 'parent', gradeLevel: 'high-school' })?.id).toBe('everyone');
  });

  it('gives a viewer we know nothing about the universal version', () => {
    expect(pickVersion([parents, everyone, hs], { role: null, gradeLevel: '' })?.id).toBe('everyone');
  });

  it('falls back to creation order on a full tie', () => {
    const a = v('a', { roles: ['parent'] });
    const b = v('b', { roles: ['parent', 'staff'] });
    expect(pickVersion([a, b], { role: 'parent', gradeLevel: 'elementary' })?.id).toBe('a');
    expect(pickVersion([b, a], { role: 'parent', gradeLevel: 'elementary' })?.id).toBe('b');
  });

  it('returns null when no version is meant for the viewer', () => {
    expect(pickVersion([parents, hs], { role: 'student-k8', gradeLevel: '7' })).toBeNull();
    expect(pickVersion([], { role: 'parent', gradeLevel: '' })).toBeNull();
  });

  it('ranks only visible versions', () => {
    expect(rankVersions([hs, everyone, parents], { role: 'parent', gradeLevel: 'middle-school' }).map((x) => x.id))
      .toEqual(['parents', 'everyone']);
  });
});

describe('resolveTopics', () => {
  it('groups by topic and picks per viewer, with a fallback for hidden topics', () => {
    const rows = [
      { id: 'a1', topic_id: 'A' }, { id: 'a2', topic_id: 'A', audience: { roles: ['parent'] } as Audience },
      { id: 'b1', topic_id: 'B', audience: { roles: ['staff'] } as Audience },
    ];
    const groups = resolveTopics(rows, { role: 'parent', gradeLevel: 'elementary' });
    const A = groups.find((g) => g.topicId === 'A')!;
    const B = groups.find((g) => g.topicId === 'B')!;
    expect(A.versions.map((x) => x.id)).toEqual(['a1', 'a2']);
    expect(A.chosen?.id).toBe('a2');
    expect(B.chosen).toBeNull();
    expect(B.shown.id).toBe('b1');
  });
});

describe('fallbackVersion', () => {
  it('prefers the universal version, else the least targeted', () => {
    expect(fallbackVersion([parentsElem, everyone, hs])?.id).toBe('everyone');
    expect(fallbackVersion([parentsElem, hs])?.id).toBe('hs');
    expect(fallbackVersion([])).toBeNull();
  });
});

describe('audienceLabel', () => {
  it('labels audiences', () => {
    expect(audienceLabel(undefined)).toBe('Everyone');
    expect(audienceLabel({ roles: ['parent'], ageBands: ['elementary'] })).toBe('Parents · Elementary');
    expect(audienceLabel({ roles: ['student-hs'] })).toBe('High school students');
    expect(audienceLabel({ roles: ['parent'], ageBands: ['high', 'middle'] })).toBe('Parents · Middle + High');
    expect(audienceLabel({ roles: ['student-k8', 'parent'], ageBands: ['elementary'] })).toBe('Middle school students + Parents · Elementary');
    expect(audienceLabel({ ageBands: ['high'] })).toBe('Everyone'); // bands mean nothing without parents/staff
    expect(audienceLabel({ roles: ['staff', 'parent'] })).toBe('Parents + School staff');
  });

  it('treats "every option" on a dimension as everyone', () => {
    expect(audienceLabel({ roles: ['student-elementary', 'student-k8', 'student-hs', 'parent', 'staff'] })).toBe('Everyone');
    expect(audienceLabel({ roles: ['parent'], ageBands: ['elementary', 'middle', 'high', 'beyond'] })).toBe('Parents');
  });
});

describe('coverage', () => {
  it('has one row per real viewer', () => {
    expect(VIEWER_CELLS).toHaveLength(11);
    expect(coverage([everyone]).every((r) => r.version?.id === 'everyone' && !r.tie)).toBe(true);
  });

  it('shows hidden viewers and the version each viewer gets', () => {
    const rows = coverage([parents, hs]);
    const by = (key: string) => rows.find((r) => r.cell.key === key)!;
    expect(by('k8').version).toBeNull();
    expect(by('hs').version?.id).toBe('hs');
    expect(by('parent-beyond').version?.id).toBe('parents');
    expect(by('staff-middle').version).toBeNull();
  });

  it('flags ties', () => {
    const rows = coverage([v('a', { roles: ['parent'] }), v('b', { roles: ['parent', 'staff'] })]);
    expect(rows.find((r) => r.cell.key === 'parent-high')!.tie).toBe(true);
    expect(rows.find((r) => r.cell.key === 'staff-high')!.tie).toBe(false);
  });
});

describe('tieNotices', () => {
  it('reports each competing pair once, listing the readers involved', () => {
    const notices = tieNotices([v('a', { roles: ['parent'] }), v('b', { roles: ['parent', 'staff'] }), everyone]);
    expect(notices).toHaveLength(1);
    expect(notices[0].message).toContain('Parents · Elementary');
    expect(notices[0].message).toContain('“Parents”');
    expect(notices[0].message).toContain('“Parents + School staff”');
  });

  it('is quiet when every reader has one best match', () => {
    expect(tieNotices([everyone, parents, parentsElem, hs])).toEqual([]);
  });
});

describe('guessAudienceFromFilename', () => {
  it.each([
    ['cancer-basics-everyone.docx', undefined],
    ['Cancer Basics.pdf', undefined],
    ['cancer-basics-parents-elementary.pdf', { roles: ['parent'], ageBands: ['elementary'] }],
    ['basics_for_teachers.docx', { roles: ['staff'] }],
    ['basics-hs.docx', { roles: ['student-hs'] }],
    ['basics-middle-school-students.pdf', { roles: ['student-k8'] }],
    ['basics for teens.txt', { roles: ['student-hs'] }],
    ['basics-students.md', { roles: ['student-elementary', 'student-k8', 'student-hs'] }],
    ['basics-elementary-students.pdf', { roles: ['student-elementary'] }],
    ['caregivers-pre-k.pdf', { roles: ['parent'], ageBands: ['elementary'] }],
    ['parents-high-school.docx', { roles: ['parent'], ageBands: ['high'] }],
    ['staff 6-8.pdf', { roles: ['staff'], ageBands: ['middle'] }],
  ])('%s', (name, expected) => {
    const got = guessAudienceFromFilename(name);
    if (!expected) { expect(got).toBeUndefined(); return; }
    expect(new Set(got?.roles ?? [])).toEqual(new Set(expected.roles ?? []));
    expect(new Set(got?.ageBands ?? [])).toEqual(new Set((expected as Audience).ageBands ?? []));
  });
});
