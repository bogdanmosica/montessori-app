/**
 * Import Feature Constants
 */

export const IMPORT_CONSTANTS = {
  // File validation
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.xlsx', '.xls'],
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],

  // Batch limits
  MAX_ROWS_PER_IMPORT: 1000,
  BATCH_SIZE: 100,

  // Validation limits
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
} as const;

export const IMPORT_MESSAGES = {
  // Success messages
  UPLOAD_SUCCESS: 'File uploaded successfully',
  VALIDATION_SUCCESS: (validCount: number) =>
    `${validCount} row${validCount !== 1 ? 's' : ''} validated successfully`,
  IMPORT_SUCCESS: (importedCount: number) =>
    `${importedCount} record${importedCount !== 1 ? 's' : ''} imported successfully`,

  // Error messages
  FILE_REQUIRED: 'Please select a file to upload',
  INVALID_FILE_TYPE: 'Only Excel files (.xlsx, .xls) are allowed',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  NO_DATA_FOUND: 'No data found in the uploaded file',
  TOO_MANY_ROWS: 'Maximum 1000 rows allowed per import',
  PARSE_ERROR: 'Failed to parse Excel file',
  VALIDATION_FAILED: 'Validation failed. Please fix errors and try again',
  IMPORT_FAILED: 'Failed to import records',
  DUPLICATE_EMAIL: 'Email already exists',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_DATE: 'Invalid date format',
  INVALID_FEE: 'Invalid fee amount',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  PARENT_NOT_FOUND: 'Parent with this email not found',

  // Validation messages
  EMAIL_REQUIRED: 'Email is required',
  NAME_REQUIRED: 'Name is required',
  DOB_REQUIRED: 'Date of birth is required',
  PARENT_EMAIL_REQUIRED: 'Parent email is required',
  MONTHLY_FEE_REQUIRED: 'Monthly fee is required',
  INVALID_ENROLLMENT_STATUS: 'Invalid enrollment status',
  FUTURE_DATE_NOT_ALLOWED: 'Date cannot be in the future',
} as const;

export const ENTITY_TYPES = {
  TEACHER: 'teacher',
  PARENT: 'parent',
  CHILD: 'child',
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

export const IMPORT_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

export type ImportStatus = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS];
