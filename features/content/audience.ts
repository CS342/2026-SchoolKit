// Audience targeting — who a page is for. Pure: no React Native imports, safe to use
// from the app, the editor and tests.
//
// An audience has two dimensions: roles, and age bands for the CHILD that parents and
// school staff are supporting. A student's role already says their school level, so
// bands never apply to students — only to parent/staff viewers, and only alongside a
// parent or staff role. An empty or missing dimension means "everyone", so nothing is
// hidden until an author targets it on purpose. A viewer dimension we don't know yet
// (no role, no grade) is not filtered — targeting fails open.
import type { UserRole } from '../../lib/database.types';

export type AgeBand = 'elementary' | 'middle' | 'high' | 'beyond';

export interface Audience {
  roles?: UserRole[];
  ageBands?: AgeBand[];
}

export interface AudienceViewer {
  role: UserRole | null;
  /** A grade value from the onboarding grade lists; '' when not chosen yet. */
  gradeLevel: string;
  /** The reader's language. Missing = English. Language is a preference, not a filter:
   *  see rankVersions in ./versions. */
  language?: ContentLanguage;
}

/** The language a page version is written in. A version without one is English. */
export type ContentLanguage = 'en' | 'es';

export const CONTENT_LANGUAGES: ContentLanguage[] = ['en', 'es'];

/** Clean untrusted input (doc JSONB): a known language, else undefined (= English). */
export function parseLanguage(input: unknown): ContentLanguage | undefined {
  return input === 'en' || input === 'es' ? input : undefined;
}

/** The app's stored language preference ('english' | 'spanish') as a content language. */
export function toContentLanguage(preference: string | null | undefined): ContentLanguage {
  return preference === 'spanish' || preference === 'es' ? 'es' : 'en';
}

export const AUDIENCE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'student-elementary', label: 'Elementary school student' },
  { value: 'student-k8', label: 'Middle school student' },
  { value: 'student-hs', label: 'High school student' },
  { value: 'parent', label: 'Parent / caregiver' },
  { value: 'staff', label: 'School staff' },
];

export const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: 'elementary', label: 'Elementary (Pre-K–5)' },
  { value: 'middle', label: 'Middle (6–8)' },
  { value: 'high', label: 'High (9–12)' },
  { value: 'beyond', label: 'Beyond high school' },
];

// Every grade value offered by the onboarding / edit-grade-level lists. Students pick
// their own grade; parents and staff pick their child's.
const GRADE_BANDS: Record<string, AgeBand> = {
  'pre-k': 'elementary', elementary: 'elementary',
  '1': 'elementary', '2': 'elementary', '3': 'elementary', '4': 'elementary', '5': 'elementary',
  '6': 'middle', '7': 'middle', '8': 'middle', 'middle-school': 'middle',
  '9': 'high', '10': 'high', '11': 'high', '12': 'high', 'high-school': 'high',
  college: 'beyond', 'high-school-up': 'beyond',
};

export function gradeToAgeBand(grade: string): AgeBand | null {
  return GRADE_BANDS[grade] ?? null;
}

/** Roles that support a child, and so are matched by that child's grade band. */
export const ADULT_ROLES: UserRole[] = ['parent', 'staff'];

/** Whether grade bands apply to this viewer: parents and staff (and an unknown role,
 *  which fails open anyway) — never students, whose role already implies their level. */
export function bandsApplyTo(role: UserRole | null): boolean {
  return role === null || ADULT_ROLES.includes(role);
}

export function isVisibleTo(audience: Audience | undefined, viewer: AudienceViewer): boolean {
  const roles = audience?.roles ?? [];
  const bands = audience?.ageBands ?? [];
  const roleOk = roles.length === 0 || viewer.role === null || roles.includes(viewer.role);
  const band = gradeToAgeBand(viewer.gradeLevel);
  const bandOk = !bandsApplyTo(viewer.role) || bands.length === 0 || band === null || bands.includes(band);
  return roleOk && bandOk;
}

const ROLE_VALUES = new Set<string>(AUDIENCE_ROLES.map((r) => r.value));
const BAND_VALUES = new Set<string>(AGE_BANDS.map((b) => b.value));

/** Clean untrusted input (doc JSONB, DB rows): keep known values, drop empty dimensions,
 *  and drop grade bands unless a parent or staff role is targeted (they'd mean nothing). */
export function parseAudience(input: unknown): Audience | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const pick = (v: unknown, allowed: Set<string>) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.has(x)))] : [];
  const roles = pick(raw.roles, ROLE_VALUES) as UserRole[];
  const ageBands = roles.some((r) => ADULT_ROLES.includes(r)) ? (pick(raw.ageBands, BAND_VALUES) as AgeBand[]) : [];
  if (roles.length === 0 && ageBands.length === 0) return undefined;
  return {
    ...(roles.length ? { roles } : {}),
    ...(ageBands.length ? { ageBands } : {}),
  };
}
