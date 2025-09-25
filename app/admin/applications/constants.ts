export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  TRANSFERRED = 'transferred',
}

export enum ChildGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Application validation constants
export const APPLICATION_VALIDATION = {
  PARENT_NAME_MAX_LENGTH: 255,
  PARENT_EMAIL_MAX_LENGTH: 255,
  PARENT_PHONE_MAX_LENGTH: 20,
  CHILD_NAME_MAX_LENGTH: 255,
  PROGRAM_REQUESTED_MAX_LENGTH: 100,
  REJECTION_REASON_MAX_LENGTH: 1000,
  NOTES_MAX_LENGTH: 1000,
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Sort options for applications table
export const SORT_OPTIONS = {
  CREATED_AT: 'createdAt',
  PARENT_NAME: 'parentName',
  CHILD_NAME: 'childName',
} as const;

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// Default form values
export const DEFAULT_VALUES = {
  PAGE: 1,
  SORT_BY: SORT_OPTIONS.CREATED_AT,
  SORT_ORDER: SORT_ORDERS.DESC,
  SEND_WELCOME_EMAIL: true,
  NOTIFY_PARENT: true,
  ENROLLMENT_STATUS: EnrollmentStatus.ACTIVE,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  INSUFFICIENT_PERMISSIONS: 'Admin role required to access applications',
  APPLICATION_NOT_FOUND: 'Application not found or not accessible',
  APPLICATION_ALREADY_PROCESSED: 'Application has already been approved or rejected',
  PARENT_EMAIL_EXISTS: 'Parent email already exists in the system',
  VALIDATION_ERROR: 'Invalid request data',
  INTERNAL_ERROR: 'An unexpected error occurred',
  TRANSACTION_FAILED: 'Failed to process application. Changes have been rolled back.',
  CHILD_ALREADY_EXISTS: 'Child with this name and date of birth already exists for this parent',
  CROSS_TENANT_ACCESS: 'Cannot create child for parent from different school',
  PARENT_NOT_FOUND: 'Parent user not found or not accessible',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  INVALID_ROLE_FOR_OPERATION: 'Only parent role can be created through application approval process',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  APPLICATION_APPROVED: 'Application approved successfully. Parent account and child record created.',
  APPLICATION_REJECTED: 'Application rejected successfully.',
  CHILD_CREATED: 'Child record created successfully',
  PARENT_CREATED: 'Parent user created successfully',
} as const;

// Performance thresholds
export const PERFORMANCE = {
  MAX_RESPONSE_TIME_MS: 300,
  CACHE_DURATION_MINUTES: 5,
  RATE_LIMIT_PER_MINUTE: 100,
  BURST_LIMIT_PER_10_SECONDS: 20,
} as const;

// Multi-tenant security
export const SECURITY = {
  REQUIRE_SCHOOL_ID: true,
  LOG_ALL_ACTIONS: true,
  PREVENT_CROSS_TENANT_ACCESS: true,
} as const;

export type ApplicationStatusType = keyof typeof ApplicationStatus;
export type EnrollmentStatusType = keyof typeof EnrollmentStatus;
export type ChildGenderType = keyof typeof ChildGender;
export type UserRoleType = keyof typeof UserRole;
export type SortOptionType = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];
export type SortOrderType = typeof SORT_ORDERS[keyof typeof SORT_ORDERS];