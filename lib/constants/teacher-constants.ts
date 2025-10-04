/**
 * Teacher Management Constants
 */

export const TEACHER_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Validation limits
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_NATIONALITY_LENGTH: 100,
  MAX_WAGE: 999999.99,

  // Assignment limits
  MAX_STUDENTS_PER_ASSIGNMENT: 100,
} as const;

export const TEACHER_MESSAGES = {
  // Success messages
  CREATED_SUCCESS: 'Teacher created successfully',
  UPDATED_SUCCESS: 'Teacher updated successfully',
  DELETED_SUCCESS: 'Teacher deactivated successfully',
  STUDENTS_ASSIGNED_SUCCESS: (count: number) => `${count} student${count !== 1 ? 's' : ''} assigned successfully`,
  ASSIGNMENT_REMOVED_SUCCESS: 'Student assignment removed successfully',

  // Error messages
  NOT_FOUND: 'Teacher not found',
  ALREADY_EXISTS: 'A teacher with this email already exists',
  INVALID_TEACHER_ID: 'Invalid teacher ID format',
  INVALID_STUDENT_ID: 'Invalid student ID format',
  STUDENTS_NOT_FOUND: 'Some students not found in school',
  NO_STUDENTS_SELECTED: 'At least one student must be selected',
  ASSIGNMENT_NOT_FOUND: 'Assignment not found',
  UNAUTHORIZED: 'You do not have permission to manage teachers',

  // Validation messages
  NAME_REQUIRED: 'Name is required',
  EMAIL_REQUIRED: 'Email is required',
  INVALID_EMAIL: 'Invalid email format',
  WAGE_INVALID: 'Wage must be a positive number',
  NATIONALITY_TOO_LONG: 'Nationality must be less than 100 characters',
} as const;

export const TEACHER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type TeacherStatus = typeof TEACHER_STATUS[keyof typeof TEACHER_STATUS];
