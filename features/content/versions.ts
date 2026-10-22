// Topic versions — a topic groups one or more pages ("versions"), each with its own
// audience. Pure: no React Native imports, safe for the app, the editor and tests.
//
// Readers get exactly one version per topic: the most specific one that matches them.
// A version with no audience is universal and acts as the fallback for everyone else.
//
// Versions also have a language (missing = English). Language is a preference, not a
// filter: a Spanish reader gets the best Spanish version meant for them, else the best
// English one. English readers never get a Spanish version.
import type { UserRole } from '../../lib/database.types';
import i18n from '../../lib/i18n';
import { ADULT_ROLES, bandsApplyTo, gradeToAgeBand, isVisibleTo, parseAudience, type AgeBand, type Audience, type AudienceViewer, type ContentLanguage } from './audience';
import type { Notice } from './lint';

export interface VersionLike {
  audience?: Audience;
  language?: ContentLanguage;
}

/** The language a version is written in (missing = English). */
export const versionLanguage = (v: VersionLike): ContentLanguage => v.language ?? 'en';

const constraintCount = (a?: Audience): number =>
  (a?.roles?.length ? 1 : 0) + (a?.ageBands?.length ? 1 : 0);

/** Dimensions the version targets that the viewer is known on and matches. */
function matchScore(a: Audience | undefined, viewer: AudienceViewer): number {
  let score = 0;
  if (a?.roles?.length && viewer.role !== null && a.roles.includes(viewer.role)) score++;
  // Bands describe a parent's or staff member's child; they never count for students.
  const band = gradeToAgeBand(viewer.gradeLevel);
  if (a?.ageBands?.length && viewer.role !== null && bandsApplyTo(viewer.role) && band !== null && a.ageBands.includes(band)) score++;
  return score;
}

/**
 * Visible versions, best first: highest match score, then fewest constraints (so a
 * viewer we know little about gets the universal version), then original order.
 * Pass versions in creation order — that order is the final tie-break.
 */
export function rankVersions<T extends VersionLike>(versions: T[], viewer: AudienceViewer): T[] {
  const ranked = (lang: ContentLanguage) => versions
    .map((v, i) => ({ v, i, score: matchScore(v.audience, viewer), c: constraintCount(v.audience) }))
    .filter(({ v }) => versionLanguage(v) === lang && isVisibleTo(v.audience, viewer))
    .sort((a, b) => b.score - a.score || a.c - b.c || a.i - b.i)
    .map(({ v }) => v);
  const lang = viewer.language ?? 'en';
  const own = ranked(lang);
  return own.length || lang === 'en' ? own : ranked('en');
}

/** The version this viewer reads, or null when no version is meant for them. */
export function pickVersion<T extends VersionLike>(versions: T[], viewer: AudienceViewer): T | null {
  return rankVersions(versions, viewer)[0] ?? null;
}

/** The least-targeted version (universal if there is one) — what a direct link opens
 *  for a viewer no version is meant for. Prefers the viewer's language, then English. */
export function fallbackVersion<T extends VersionLike>(versions: T[], language: ContentLanguage = 'en'): T | null {
  const leastTargeted = (pool: T[]) => {
    let best: T | null = null;
    for (const v of pool) if (!best || constraintCount(v.audience) < constraintCount(best.audience)) best = v;
    return best;
  };
  const inLang = (lang: ContentLanguage) => versions.filter((v) => versionLanguage(v) === lang);
  return leastTargeted(inLang(language)) ?? leastTargeted(inLang('en')) ?? leastTargeted(versions);
}

export interface TopicGroup<T> {
  topicId: string;
  /** In the order given (pass rows in creation order). */
  versions: T[];
  /** The version this viewer reads, or null when no version is meant for them. */
  chosen: T | null;
  /** What represents the topic: `chosen`, else the fallback a direct link opens. */
  shown: T;
}

/** Group version rows by topic and pick each topic's version for this viewer. */
export function resolveTopics<T extends VersionLike & { topic_id: string }>(rows: T[], viewer: AudienceViewer): TopicGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const r of rows) groups.set(r.topic_id, [...(groups.get(r.topic_id) ?? []), r]);
  return [...groups].map(([topicId, versions]) => {
    const chosen = pickVersion(versions, viewer);
    return { topicId, versions, chosen, shown: chosen ?? fallbackVersion(versions, viewer.language)! };
  });
}

// ─── Labels ──────────────────────────────────────────────────────────────────

// Display labels resolve through i18n at call time; the role/band ids below stay
// English (they are logic/storage values, never shown).
const rolePlural = (role: UserRole): string => i18n.t(`editor.audienceLabel.rolePlural.${role}`);
const bandShort = (band: AgeBand): string => i18n.t(`editor.audienceLabel.bandShort.${band}`);

const ROLE_ORDER: UserRole[] = ['student-elementary', 'student-k8', 'student-hs', 'parent', 'staff'];
const BAND_ORDER: AgeBand[] = ['elementary', 'middle', 'high', 'beyond'];

/**
 * "Everyone", "High school students", "Parents · Elementary",
 * "Middle school students + Parents · Elementary". Bands belong to the parent/staff part.
 */
export function audienceLabel(audience: Audience | undefined): string {
  const roles = ROLE_ORDER.filter((r) => audience?.roles?.includes(r));
  const bands = BAND_ORDER.filter((b) => audience?.ageBands?.includes(b));
  const bandPart = bands.length && bands.length < BAND_ORDER.length ? bands.map((b) => bandShort(b)).join(' + ') : '';
  if (roles.length === ROLE_ORDER.length && !bandPart) return i18n.t('editor.audienceLabel.everyone');
  const students = roles.filter((r) => !ADULT_ROLES.includes(r)).map((r) => rolePlural(r)).join(' + ');
  const adultRoles = roles.filter((r) => ADULT_ROLES.includes(r)).map((r) => rolePlural(r)).join(' + ');
  const adults = adultRoles && bandPart ? `${adultRoles} · ${bandPart}` : adultRoles;
  return [students, adults].filter(Boolean).join(' + ') || i18n.t('editor.audienceLabel.everyone');
}

/** A version's display label: its audience, plus its language when not English
 *  ("Parents · Elementary · Spanish"). */
export function versionLabel(v: VersionLike): string {
  const audience = audienceLabel(v.audience);
  return versionLanguage(v) === 'en' ? audience : `${audience} · ${i18n.t(`editor.language.${versionLanguage(v)}`)}`;
}

// ─── Coverage ────────────────────────────────────────────────────────────────

export interface ViewerCell {
  key: string;
  viewer: AudienceViewer;
}

/** Every kind of reader that can see different versions: the two student roles (their
 *  grade doesn't matter), and parents and staff by their child's grade band (see the
 *  grade lists in app/edit-grade-level.tsx). Each uses a representative grade value.
 *  The display label is resolved on demand via `viewerCellLabel`. */
export const VIEWER_CELLS: ViewerCell[] = [
  { key: 'elem', viewer: { role: 'student-elementary', gradeLevel: '3' } },
  { key: 'k8', viewer: { role: 'student-k8', gradeLevel: '7' } },
  { key: 'hs', viewer: { role: 'student-hs', gradeLevel: '10' } },
  ...(['parent', 'staff'] as const).flatMap((role) => ([
    ['elementary', 'elementary'], ['middle', 'middle-school'], ['high', 'high-school'], ['beyond', 'high-school-up'],
  ] as const).map(([band, grade]) => ({
    key: `${role}-${band}`,
    viewer: { role, gradeLevel: grade } as AudienceViewer,
  }))),
];

/** Localized label for a coverage cell: a student role's plural, or `Role · Band` for
 *  parents/staff (whose child's grade band is what differs). */
export function viewerCellLabel(cell: ViewerCell): string {
  const role = cell.viewer.role;
  if (!role) return '';
  const band = gradeToAgeBand(cell.viewer.gradeLevel);
  return ADULT_ROLES.includes(role) && band ? `${rolePlural(role)} · ${bandShort(band)}` : rolePlural(role);
}

export interface CoverageRow<T> {
  cell: ViewerCell;
  /** The version this viewer gets, or null when the topic is hidden from them. */
  version: T | null;
  /** True when another version matches this viewer equally well (the earlier one wins). */
  tie: boolean;
  /** That other version, when `tie`. */
  tiedWith: T | null;
}

/** The version each kind of reader gets. With `language: 'es'`, what Spanish readers
 *  get — which may be an English version they fall back to (check versionLanguage). */
export function coverage<T extends VersionLike>(versions: T[], language: ContentLanguage = 'en'): CoverageRow<T>[] {
  return VIEWER_CELLS.map((cell) => {
    const ranked = rankVersions(versions, { ...cell.viewer, language });
    const [a, b] = ranked;
    const tie = !!a && !!b
      && matchScore(a.audience, cell.viewer) === matchScore(b.audience, cell.viewer)
      && constraintCount(a.audience) === constraintCount(b.audience);
    return { cell, version: a ?? null, tie, tiedWith: tie ? b : null };
  });
}

/**
 * Checks-panel notices for versions that compete for the same readers. Unreached
 * readers aren't flagged: a page meant for one audience is a normal thing to make.
 */
export function tieNotices<T extends VersionLike & { id: string; title?: string }>(versions: T[]): Notice[] {
  const name = (x: T) => `“${versionLabel(x)}”`;
  const byPair = new Map<string, { a: T; b: T; cells: string[] }>();
  // Spanish rows count only where a Spanish version is shown — a Spanish reader falling
  // back to English hits the same English tie already reported.
  const rows = [...coverage(versions), ...coverage(versions, 'es').filter((r) => r.version && versionLanguage(r.version) === 'es')];
  for (const row of rows) {
    if (!row.tie || !row.version || !row.tiedWith) continue;
    const key = `${row.version.id}|${row.tiedWith.id}`;
    const entry = byPair.get(key) ?? { a: row.version, b: row.tiedWith, cells: [] };
    entry.cells.push(viewerCellLabel(row.cell));
    byPair.set(key, entry);
  }
  return [...byPair.values()].map(({ a, b, cells }) => ({
    message: i18n.t('editor.tieNotices.message', { cells: cells.join(', '), a: name(a), b: name(b) }),
    fix: i18n.t('editor.tieNotices.fix'),
  }));
}

// ─── Bulk import helper ──────────────────────────────────────────────────────

const ROLE_WORDS: Record<string, UserRole> = {
  parent: 'parent', parents: 'parent', caregiver: 'parent', caregivers: 'parent', guardian: 'parent', guardians: 'parent', family: 'parent', families: 'parent',
  staff: 'staff', teacher: 'staff', teachers: 'staff', educator: 'staff', educators: 'staff', nurse: 'staff', counselor: 'staff', counselors: 'staff',
};
const BAND_WORDS: Record<string, AgeBand> = {
  elementary: 'elementary', prek: 'elementary', k5: 'elementary', kindergarten: 'elementary',
  middle: 'middle', ms: 'middle', '6to8': 'middle',
  high: 'high', hs: 'high', highschool: 'high', '9to12': 'high',
  college: 'beyond', beyond: 'beyond', university: 'beyond',
};
const STUDENT_WORDS = new Set(['student', 'students', 'kid', 'kids', 'child', 'children']);
const TEEN_WORDS = new Set(['teen', 'teens', 'teenager', 'teenagers']);

/**
 * Guess a version's audience from its source file's name, e.g.
 * "basics-parents-elementary.pdf" → Parents · Elementary, "basics-hs.docx" → High school
 * students. Only a prefill for the author to confirm; undefined = everyone / no idea.
 */
export function guessAudienceFromFilename(name: string): Audience | undefined {
  const base = name.toLowerCase().replace(/\.[a-z0-9]+$/, '');
  // Join multi-part words and grade ranges ("pre-k", "6-8") before splitting on separators.
  const normalized = base
    .replace(/pre-?k/g, 'prek').replace(/k-5/g, 'k5').replace(/high[\s_-]?school/g, 'highschool')
    .replace(/(\d+)-(\d+)/g, '$1to$2');
  const tokens = new Set(normalized.split(/[^a-z0-9]+/).filter(Boolean));

  const roles = new Set<UserRole>();
  const bands = new Set<AgeBand>();
  for (const t of tokens) {
    if (ROLE_WORDS[t]) roles.add(ROLE_WORDS[t]);
    if (BAND_WORDS[t]) bands.add(BAND_WORDS[t]);
  }
  const mentionsStudents = [...tokens].some((t) => STUDENT_WORDS.has(t));
  const mentionsTeens = [...tokens].some((t) => TEEN_WORDS.has(t));
  // A student file, or an audience named only by school level ("…-hs"), means students.
  // No student-relevant level ("…-students") means both student groups; teens means high school.
  if (mentionsStudents || mentionsTeens || (roles.size === 0 && bands.size > 0)) {
    const levelNamed = bands.has('elementary') || bands.has('middle') || bands.has('high') || bands.has('beyond');
    if (mentionsTeens || bands.has('high') || bands.has('beyond') || !levelNamed) roles.add('student-hs');
    if (bands.has('middle') || (!levelNamed && !mentionsTeens)) roles.add('student-k8');
    if (bands.has('elementary') || (!levelNamed && !mentionsTeens)) roles.add('student-elementary');
  }
  // Students' own grade already implies the band; keep bands only for parents/staff.
  const onlyStudents = [...roles].every((r) => !ADULT_ROLES.includes(r));
  return parseAudience({ roles: [...roles], ageBands: onlyStudents ? [] : [...bands] });
}
