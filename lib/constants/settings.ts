/**
 * Settings Constants and Enums
 * Centralized configuration values for school settings feature
 */

/**
 * Settings field limits and boundaries
 */
export const SETTINGS_LIMITS = {
  // Fee limits in RON (Romanian Lei)
  MIN_FEE_RON: 0,
  MAX_FEE_RON: 99999.99,
  FEE_DECIMAL_PLACES: 2,

  // Enrollment count limits
  MIN_ENROLLMENT_COUNT: 0,
  MAX_ENROLLMENT_COUNT: 9999,

  // Capacity limits
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 9999,
} as const;

/**
 * Default values for settings
 */
export const SETTINGS_DEFAULTS = {
  DEFAULT_MONTHLY_FEE_RON: 0.00,
  FREE_ENROLLMENT_COUNT: 0,
  MAXIMUM_CAPACITY: 100,
} as const;

/**
 * Settings error codes
 */
export enum SettingsErrorCode {
  // Authentication/Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  ADMIN_ROLE_REQUIRED = 'ADMIN_ROLE_REQUIRED',
  SCHOOL_REQUIRED = 'SCHOOL_REQUIRED',
  SCHOOL_NOT_FOUND = 'SCHOOL_NOT_FOUND',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_USER_ID = 'INVALID_USER_ID',

  // Business Logic
  FEE_NEGATIVE = 'FEE_NEGATIVE',
  FEE_LIMIT_EXCEEDED = 'FEE_LIMIT_EXCEEDED',
  FEE_INVALID_PRECISION = 'FEE_INVALID_PRECISION',
  ENROLLMENT_COUNT_NOT_INTEGER = 'ENROLLMENT_COUNT_NOT_INTEGER',
  ENROLLMENT_COUNT_NEGATIVE = 'ENROLLMENT_COUNT_NEGATIVE',
  ENROLLMENT_COUNT_LIMIT_EXCEEDED = 'ENROLLMENT_COUNT_LIMIT_EXCEEDED',

  // Database/System
  DATABASE_ERROR = 'DATABASE_ERROR',
  UPDATE_FAILED = 'UPDATE_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Settings action types for audit logging
 */
export enum SettingsActionType {
  SETTINGS_VIEW = 'SETTINGS_VIEW',
  SETTINGS_UPDATE_FEE = 'SETTINGS_UPDATE_FEE',
  SETTINGS_UPDATE_ENROLLMENTS = 'SETTINGS_UPDATE_ENROLLMENTS',
  SETTINGS_UPDATE_ALL = 'SETTINGS_UPDATE_ALL',
}

/**
 * Settings field names for form validation
 */
export const SETTINGS_FIELD_NAMES = {
  DEFAULT_MONTHLY_FEE: 'default_monthly_fee_ron',
  FREE_ENROLLMENT_COUNT: 'free_enrollment_count',
  MAXIMUM_CAPACITY: 'maximum_capacity',
  SETTINGS_UPDATED_AT: 'settings_updated_at',
} as const;

/**
 * Settings validation messages
 */
export const SETTINGS_VALIDATION_MESSAGES = {
  FEE_REQUIRED: 'Default monthly fee is required',
  FEE_MUST_BE_NUMBER: 'Default fee must be a valid number',
  FEE_MUST_BE_POSITIVE: 'Default fee must be non-negative',
  FEE_MUST_BE_WITHIN_LIMIT: `Default fee must be between ${SETTINGS_LIMITS.MIN_FEE_RON} and ${SETTINGS_LIMITS.MAX_FEE_RON.toLocaleString()} RON`,
  FEE_INVALID_DECIMAL: `Default fee must have at most ${SETTINGS_LIMITS.FEE_DECIMAL_PLACES} decimal places`,

  COUNT_REQUIRED: 'Free enrollment count is required',
  COUNT_MUST_BE_NUMBER: 'Enrollment count must be a valid number',
  COUNT_MUST_BE_INTEGER: 'Enrollment count must be an integer',
  COUNT_MUST_BE_POSITIVE: 'Enrollment count must be non-negative',
  COUNT_MUST_BE_WITHIN_LIMIT: `Enrollment count must be between ${SETTINGS_LIMITS.MIN_ENROLLMENT_COUNT} and ${SETTINGS_LIMITS.MAX_ENROLLMENT_COUNT.toLocaleString()}`,
} as const;

/**
 * Settings API endpoints
 */
export const SETTINGS_API_ENDPOINTS = {
  GET_SETTINGS: '/api/admin/settings',
  UPDATE_SETTINGS: '/api/admin/settings',
} as const;

/**
 * Settings page routes
 */
export const SETTINGS_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  SETTINGS: '/admin/dashboard/settings',
} as const;

/**
 * Type exports for type safety
 */
export type SettingsErrorCodeType = typeof SettingsErrorCode[keyof typeof SettingsErrorCode];
export type SettingsActionTypeType = typeof SettingsActionType[keyof typeof SettingsActionType];
export type SettingsFieldName = typeof SETTINGS_FIELD_NAMES[keyof typeof SETTINGS_FIELD_NAMES];