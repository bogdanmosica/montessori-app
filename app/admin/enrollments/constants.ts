export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  WITHDRAWN: 'withdrawn',
  ARCHIVED: 'archived'
} as const;

export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS];

export const ENROLLMENT_STATUS_LABELS = {
  [ENROLLMENT_STATUS.ACTIVE]: 'Active',
  [ENROLLMENT_STATUS.INACTIVE]: 'Inactive',
  [ENROLLMENT_STATUS.WITHDRAWN]: 'Withdrawn',
  [ENROLLMENT_STATUS.ARCHIVED]: 'Archived'
} as const;

export const ENROLLMENT_STATUS_OPTIONS = Object.values(ENROLLMENT_STATUS).map(status => ({
  value: status,
  label: ENROLLMENT_STATUS_LABELS[status]
}));

export const ENROLLMENT_SORT_OPTIONS = {
  ENROLLMENT_DATE: 'enrollment_date',
  CHILD_NAME: 'child_name',
  CREATED_AT: 'created_at'
} as const;

export type EnrollmentSortBy = typeof ENROLLMENT_SORT_OPTIONS[keyof typeof ENROLLMENT_SORT_OPTIONS];

export const ENROLLMENT_SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type EnrollmentSortOrder = typeof ENROLLMENT_SORT_ORDER[keyof typeof ENROLLMENT_SORT_ORDER];

export const ENROLLMENT_PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

export const ENROLLMENT_VALIDATION = {
  NOTES_MAX_LENGTH: 1000,
  CHILD_NAME_MAX_LENGTH: 100,
  PARENT_NAME_MAX_LENGTH: 100,
  CHILD_MIN_AGE: 0,
  CHILD_MAX_AGE: 18
} as const;