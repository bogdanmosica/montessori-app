import { TEACHER_ROUTES, TEACHER_NAVIGATION_LABELS } from '@/lib/constants/teacher-routes';

export interface TeacherMenuConfig {
  main: Array<{
    title: string;
    href: string;
    icon?: string;
    description?: string;
  }>;
}

export const teacherMenuConfig: TeacherMenuConfig = {
  main: [
    {
      title: TEACHER_NAVIGATION_LABELS.DASHBOARD,
      href: TEACHER_ROUTES.DASHBOARD,
      icon: 'LayoutDashboard',
      description: 'View your dashboard and student metrics'
    },
    {
      title: TEACHER_NAVIGATION_LABELS.STUDENTS,
      href: TEACHER_ROUTES.STUDENTS,
      icon: 'Users',
      description: 'Manage your student roster'
    }
  ]
};
