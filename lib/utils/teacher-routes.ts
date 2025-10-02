import { TEACHER_ROUTES } from '@/lib/constants/teacher-routes';

/**
 * Check if a path is a teacher route
 */
export function isTeacherRoute(pathname: string): boolean {
  return pathname.startsWith('/teacher');
}

/**
 * Get the active teacher route from pathname
 */
export function getActiveTeacherRoute(pathname: string): string | null {
  const routes = Object.values(TEACHER_ROUTES);
  return routes.find(route => pathname === route) || null;
}

/**
 * Check if current path matches a specific teacher route
 */
export function isActiveTeacherRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

/**
 * Build student roster URL with filters
 */
export function buildStudentRosterUrl(filters?: {
  status?: string;
  classGroup?: string;
}): string {
  const url = new URL(TEACHER_ROUTES.STUDENTS, 'http://localhost');

  if (filters?.status) {
    url.searchParams.set('status', filters.status);
  }

  if (filters?.classGroup) {
    url.searchParams.set('group', filters.classGroup);
  }

  return url.pathname + url.search;
}

/**
 * Get default teacher route
 */
export function getDefaultTeacherRoute(): string {
  return TEACHER_ROUTES.DASHBOARD;
}

/**
 * Validate teacher route access
 */
export function canAccessTeacherRoute(userRole: string | undefined): boolean {
  return userRole === 'teacher';
}
