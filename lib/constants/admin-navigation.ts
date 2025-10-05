export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  APPLICATIONS: '/admin/applications',
  PAYMENTS: '/admin/payments',
  TEACHERS: '/admin/teachers',
  IMPORT: '/admin/import',
  REPORTS: '/admin/reports'
} as const;

export const NAVIGATION_LABELS = {
  DASHBOARD: 'Dashboard',
  APPLICATIONS: 'Students',
  PAYMENTS: 'Payments',
  TEACHERS: 'Teachers',
  IMPORT: 'Import',
  REPORTS: 'Reports'
} as const;

export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];
export type NavigationLabel = typeof NAVIGATION_LABELS[keyof typeof NAVIGATION_LABELS];