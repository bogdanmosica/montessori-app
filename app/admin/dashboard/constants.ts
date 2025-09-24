// Dashboard constants and enums
export const DASHBOARD_CACHE_TTL = {
  METRICS: 5 * 60 * 1000, // 5 minutes
  SECURITY_ALERTS: 1 * 60 * 1000, // 1 minute
  SUPER_ADMIN_METRICS: 15 * 60 * 1000, // 15 minutes
  TRENDS: 60 * 60 * 1000, // 1 hour
} as const;

export const DASHBOARD_REFRESH_INTERVALS = {
  REAL_TIME: 60 * 1000, // 1 minute for security alerts
  NEAR_REAL_TIME: 5 * 60 * 1000, // 5 minutes for applications/enrollments
  BATCH_UPDATE: 60 * 60 * 1000, // 1 hour for trends
} as const;

export const PERFORMANCE_THRESHOLDS = {
  DASHBOARD_TTFB: 500, // milliseconds
  API_RESPONSE_TIME: 300, // milliseconds
  CHART_RENDER_TIME: 200, // milliseconds
} as const;

export const RATE_LIMITS = {
  ADMIN_REQUESTS_PER_MINUTE: 60,
  SUPER_ADMIN_REQUESTS_PER_MINUTE: 120,
  BURST_ALLOWANCE: 10,
} as const;

export const CAPACITY_UTILIZATION_THRESHOLDS = {
  LOW: 50, // percentage
  MEDIUM: 75, // percentage
  HIGH: 90, // percentage
  CRITICAL: 95, // percentage
} as const;

export const DEFAULT_AGE_GROUPS = [
  {
    name: 'Toddler',
    displayName: 'Toddler (18-36 months)',
    minAge: 18, // months
    maxAge: 36, // months
  },
  {
    name: 'Primary',
    displayName: 'Primary (3-6 years)',
    minAge: 37, // months
    maxAge: 72, // months
  },
  {
    name: 'Elementary',
    displayName: 'Elementary (6-12 years)',
    minAge: 73, // months
    maxAge: 144, // months
  },
] as const;

export const EMPTY_STATE_MESSAGES = {
  NO_APPLICATIONS: 'No pending applications at this time',
  NO_ENROLLMENTS: 'No active enrollments yet',
  NO_TRENDS_DATA: 'Not enough data for trends analysis',
  NO_SECURITY_ALERTS: 'No security alerts - system is secure',
  NO_FAMILIES: 'No families enrolled yet',
} as const;

export const CHART_COLORS = {
  PRIMARY: '#3B82F6', // blue-500
  SUCCESS: '#10B981', // emerald-500
  WARNING: '#F59E0B', // amber-500
  DANGER: '#EF4444', // red-500
  INFO: '#8B5CF6', // violet-500
  MUTED: '#6B7280', // gray-500
} as const;

export const METRIC_CARD_VARIANTS = {
  DEFAULT: 'default',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
} as const;

export const TREND_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
} as const;