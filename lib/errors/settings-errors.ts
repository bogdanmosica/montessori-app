/**
 * Settings-specific error classes and error handling utilities
 */

/**
 * Base error class for settings operations
 */
export class SettingsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

/**
 * Error for authentication failures
 */
export class UnauthorizedError extends SettingsError {
  constructor(message: string = 'Admin role required') {
    super(message, 'ADMIN_ROLE_REQUIRED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error for school not found
 */
export class SchoolNotFoundError extends SettingsError {
  constructor(message: string = 'School settings not found') {
    super(message, 'SCHOOL_NOT_FOUND', 404);
    this.name = 'SchoolNotFoundError';
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends SettingsError {
  constructor(
    message: string = 'Validation failed',
    public details?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Error for business logic violations
 */
export class BusinessLogicError extends SettingsError {
  constructor(
    message: string,
    code: string = 'BUSINESS_LOGIC_ERROR'
  ) {
    super(message, code, 422);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Error for database operations
 */
export class DatabaseError extends SettingsError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Error for update failures
 */
export class UpdateFailedError extends SettingsError {
  constructor(message: string = 'Failed to update settings') {
    super(message, 'UPDATE_FAILED', 500);
    this.name = 'UpdateFailedError';
  }
}

/**
 * Error response format for API
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  details?: Record<string, string[]>;
}

/**
 * Create a formatted error response
 */
export function createErrorResponse(
  error: Error | SettingsError,
  includeDetails: boolean = true
): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof SettingsError) {
    const response: ErrorResponse = {
      error: error.name.replace('Error', ''),
      message: error.message,
      code: error.code,
      timestamp,
    };

    if (includeDetails && error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    return response;
  }

  // Generic error fallback
  return {
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp,
  };
}

/**
 * Handle settings API errors and return appropriate response
 */
export function handleSettingsError(error: unknown): {
  response: ErrorResponse;
  statusCode: number;
} {
  console.error('Settings API error:', error);

  if (error instanceof SettingsError) {
    return {
      response: createErrorResponse(error),
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      response: createErrorResponse(error, false),
      statusCode: 500,
    };
  }

  // Unknown error type
  return {
    response: {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
    statusCode: 500,
  };
}

/**
 * Validate fee amount business rules
 */
export function validateFeeBusinessRules(fee: number): void {
  if (fee < 0) {
    throw new BusinessLogicError(
      'Monthly fee cannot be negative',
      'FEE_NEGATIVE'
    );
  }

  if (fee > 99999.99) {
    throw new BusinessLogicError(
      'Monthly fee exceeds maximum allowed',
      'FEE_LIMIT_EXCEEDED'
    );
  }

  // Check decimal places
  const decimals = fee.toString().split('.')[1];
  if (decimals && decimals.length > 2) {
    throw new BusinessLogicError(
      'Monthly fee must have at most 2 decimal places',
      'FEE_INVALID_PRECISION'
    );
  }
}

/**
 * Validate enrollment count business rules
 */
export function validateEnrollmentCountBusinessRules(count: number): void {
  if (!Number.isInteger(count)) {
    throw new BusinessLogicError(
      'Free enrollment count must be an integer',
      'ENROLLMENT_COUNT_NOT_INTEGER'
    );
  }

  if (count < 0) {
    throw new BusinessLogicError(
      'Free enrollment count cannot be negative',
      'ENROLLMENT_COUNT_NEGATIVE'
    );
  }

  if (count > 9999) {
    throw new BusinessLogicError(
      'Free enrollment count exceeds maximum allowed',
      'ENROLLMENT_COUNT_LIMIT_EXCEEDED'
    );
  }
}

/**
 * Validate capacity business rules
 */
export function validateCapacityBusinessRules(capacity: number): void {
  if (!Number.isInteger(capacity)) {
    throw new BusinessLogicError(
      'Maximum capacity must be an integer',
      'CAPACITY_NOT_INTEGER'
    );
  }

  if (capacity < 1) {
    throw new BusinessLogicError(
      'Maximum capacity must be at least 1',
      'CAPACITY_TOO_LOW'
    );
  }

  if (capacity > 9999) {
    throw new BusinessLogicError(
      'Maximum capacity exceeds maximum allowed',
      'CAPACITY_LIMIT_EXCEEDED'
    );
  }
}