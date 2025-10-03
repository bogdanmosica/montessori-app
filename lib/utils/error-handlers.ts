import { ZodError } from 'zod';
import { AttendanceErrorResponse } from '@/lib/types/attendance';

/**
 * Error Handler Utilities
 *
 * Standard error handling functions for consistent API responses.
 */

/**
 * Error codes for attendance operations
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Format Zod validation errors
 */
export function formatZodError(error: ZodError): AttendanceErrorResponse {
  const fieldErrors = error.flatten().fieldErrors;
  const formattedErrors: Record<string, string> = {};

  Object.entries(fieldErrors).forEach(([field, messages]) => {
    if (messages && messages.length > 0) {
      formattedErrors[field] = messages[0];
    }
  });

  return {
    error: {
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      details: formattedErrors,
    },
  };
}

/**
 * Create standard error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AttendanceErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Handle database constraint violations
 */
export function handleDatabaseError(error: any): AttendanceErrorResponse {
  // Unique constraint violation
  if (error?.code === '23505') {
    return createErrorResponse(
      ErrorCodes.CONFLICT,
      'A record with these values already exists'
    );
  }

  // Foreign key violation
  if (error?.code === '23503') {
    return createErrorResponse(
      ErrorCodes.BAD_REQUEST,
      'Referenced record does not exist'
    );
  }

  // Not null violation
  if (error?.code === '23502') {
    return createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Required field is missing'
    );
  }

  // Generic database error
  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'Database operation failed'
  );
}

/**
 * Handle authentication errors
 */
export function createUnauthorizedError(message: string = 'Authentication required'): AttendanceErrorResponse {
  return createErrorResponse(ErrorCodes.UNAUTHORIZED, message);
}

/**
 * Handle authorization/permission errors
 */
export function createForbiddenError(message: string = 'Insufficient permissions'): AttendanceErrorResponse {
  return createErrorResponse(ErrorCodes.FORBIDDEN, message);
}

/**
 * Handle not found errors
 */
export function createNotFoundError(resource: string = 'Resource'): AttendanceErrorResponse {
  return createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`);
}

/**
 * Handle rate limit errors
 */
export function createRateLimitError(retryAfter?: number): AttendanceErrorResponse {
  return createErrorResponse(
    ErrorCodes.RATE_LIMIT,
    'Too many requests. Please try again later.',
    retryAfter ? { retryAfter } : undefined
  );
}

/**
 * Log error with context
 */
export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  console.error('Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a known type
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export function isDatabaseError(error: any): boolean {
  return error && typeof error.code === 'string' && error.code.startsWith('23');
}
