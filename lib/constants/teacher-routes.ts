export const TEACHER_ROUTES = {
  DASHBOARD: '/teacher/dashboard',
  STUDENTS: '/teacher/students',
  LESSONS: '/teacher/lessons',
  PROGRESS_BOARD: '/teacher/progress-board',
  ATTENDANCE: '/teacher/attendance'
} as const;

export const TEACHER_NAVIGATION_LABELS = {
  DASHBOARD: 'Dashboard',
  STUDENTS: 'My Students',
  LESSONS: 'Lessons',
  PROGRESS_BOARD: 'Progress Board',
  ATTENDANCE: 'Attendance'
} as const;

export type TeacherRoute = typeof TEACHER_ROUTES[keyof typeof TEACHER_ROUTES];
export type TeacherNavigationLabel = typeof TEACHER_NAVIGATION_LABELS[keyof typeof TEACHER_NAVIGATION_LABELS];
