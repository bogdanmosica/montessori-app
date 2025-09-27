export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  APPLICATIONS: '/admin/applications',
  ENROLLMENTS: '/admin/enrollments',
  PAYMENTS: '/admin/payments',
  REPORTS: '/admin/reports'
} as const;

export const NAVIGATION_LABELS = {
  DASHBOARD: 'Dashboard',
  APPLICATIONS: 'Applications',
  ENROLLMENTS: 'Enrollments',
  PAYMENTS: 'Payments',
  REPORTS: 'Reports'
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type NavigationLabel = typeof NAVIGATION_LABELS[keyof typeof NAVIGATION_LABELS];