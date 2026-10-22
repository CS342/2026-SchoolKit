import type { UserRole, SchoolStatus } from '../contexts/OnboardingContext';

export function getRoleDisplayName(role: UserRole | null, fallback = 'Not set'): string {
  switch (role) {
    case 'student-elementary':
      return 'Student (elementary school)';
    case 'student-k8':
      return 'Student (middle school)';
    case 'student-hs':
      return 'Student (high school and up)';
    case 'parent':
      return 'Parent / caregiver';
    case 'staff':
      return 'School staff';
    default:
      return fallback;
  }
}

/** Students skip the grade step and see student-facing copy; parents/staff don't. */
export function isStudentRole(role: UserRole | null | undefined): boolean {
  return role === 'student-elementary' || role === 'student-k8' || role === 'student-hs';
}

export function getSchoolStatusText(statuses: SchoolStatus[]): string {
  if (statuses.length === 0) return 'Not set';
  const labels: Record<string, string> = {
    'current-treatment': 'Currently in school',
    'returning-after-treatment': 'Taking a break from school',
    'supporting-student': 'Planning to return to school soon',
    'special-needs': 'Home hospital education',
  };
  return statuses.map((s) => labels[s] ?? s.replace(/-/g, ' ')).join(', ');
}
