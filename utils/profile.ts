import type { UserRole } from '../contexts/OnboardingContext';

// Role/school-status display text is now rendered via i18n keys at the call sites
// (profile.tsx, edit screens): t('profile.roleOptions.*'), t('profile.statusOptions.*').
// This module keeps only the non-text role helper.

/** Students skip the grade step and see student-facing copy; parents/staff don't. */
export function isStudentRole(role: UserRole | null | undefined): boolean {
  return role === 'student-elementary' || role === 'student-k8' || role === 'student-hs';
}
