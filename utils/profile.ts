import type { UserRole, SchoolStatus } from '../contexts/OnboardingContext';

export function getRoleDisplayName(role: UserRole | null, fallback = 'Not set'): string {
  switch (role) {
    case 'student-k8':
      return 'Student (Middle School)';
    case 'student-hs':
      return 'Student (High School and up)';
    case 'parent':
      return 'Parent/Caregiver';
    case 'staff':
      return 'School Staff';
    default:
      return fallback;
  }
}

export function getSchoolStatusText(statuses: SchoolStatus[]): string {
  if (statuses.length === 0) return 'Not set';
  const labels: Record<string, string> = {
    'current-treatment': 'Currently in school',
    'returning-after-treatment': 'Taking a break from school',
    'supporting-student': 'Planning to return to school soon',
    'special-needs': 'Home Hospital Education',
  };
  return statuses.map((s) => labels[s] ?? s.replace(/-/g, ' ')).join(', ');
}
