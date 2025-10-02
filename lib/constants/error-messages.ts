/**
 * Centralized error messages for consistent error handling
 */

export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Authentication required',
  INSUFFICIENT_PERMISSIONS: 'Admin role required',
  SESSION_EXPIRED: 'Session has expired',

  // Validation errors
  VALIDATION_ERROR: 'Validation error',
  INVALID_DATE_FORMAT: 'Invalid date format. Use YYYY-MM-DD',
  INVALID_DATE_RANGE: 'Invalid date range',
  DATE_RANGE_TOO_LARGE: 'Date range cannot exceed 365 days',
  START_DATE_AFTER_END: 'Start date must be before end date',
  FUTURE_DATE_NOT_ALLOWED: 'Future dates are not allowed',

  // Tenant context errors
  TENANT_CONTEXT_MISSING: 'Unable to load data',
  TENANT_NOT_FOUND: 'School not found',
  INVALID_TENANT: 'Invalid school context',

  // Trends specific errors
  TRENDS_FETCH_FAILED: 'Unable to load trend data',
  TRENDS_CACHE_ERROR: 'Cache operation failed',
  INVALID_ACTIVITY_TYPE: 'Invalid activity type',
  INVALID_TREND_PERIOD: 'Invalid trend period',

  // Database errors
  DATABASE_ERROR: 'Unable to load data',
  QUERY_TIMEOUT: 'Request timed out',
  CONNECTION_ERROR: 'Database connection failed',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'Unable to load data',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TENANT_CONTEXT_MISSING: 'TENANT_CONTEXT_MISSING',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
