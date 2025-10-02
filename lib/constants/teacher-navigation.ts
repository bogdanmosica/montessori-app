import { TEACHER_ROUTES, TEACHER_NAVIGATION_LABELS } from './teacher-routes';

export interface TeacherMenuItem {
  label: string;
  href: string;
  icon?: string;
}

export const TEACHER_MENU_ITEMS: TeacherMenuItem[] = [
  {
    label: TEACHER_NAVIGATION_LABELS.DASHBOARD,
    href: TEACHER_ROUTES.DASHBOARD,
    icon: 'LayoutDashboard'
  },
  {
    label: TEACHER_NAVIGATION_LABELS.STUDENTS,
    href: TEACHER_ROUTES.STUDENTS,
    icon: 'Users'
  }
] as const;

export const DEFAULT_TEACHER_ROUTE = TEACHER_ROUTES.DASHBOARD;
