export const TEACHER_ROUTES = {
  DASHBOARD: '/teacher/dashboard',
  STUDENTS: '/teacher/students',
  PROGRESS_BOARD: '/teacher/progress-board'
} as const;

export const TEACHER_NAVIGATION_LABELS = {
  DASHBOARD: 'Dashboard',
  STUDENTS: 'My Students',
  PROGRESS_BOARD: 'Progress Board'
} as const;

export type TeacherRoute = typeof TEACHER_ROUTES[keyof typeof TEACHER_ROUTES];
export type TeacherNavigationLabel = typeof TEACHER_NAVIGATION_LABELS[keyof typeof TEACHER_NAVIGATION_LABELS];
