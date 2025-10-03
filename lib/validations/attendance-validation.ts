import { z } from 'zod';
import { ATTENDANCE_STATUS } from '@/lib/constants/attendance-status';

/**
 * Attendance Validation Schemas
 *
 * Zod schemas for validating attendance API requests and responses.
 */

// Constants for validation
export const ATTENDANCE_VALIDATION = {
  NOTES_MAX_LENGTH: 10000,
  DATE_MIN_YEAR: 2020, // Reasonable minimum for school records
  DATE_MAX_FUTURE_DAYS: 0, // No future dates allowed initially
} as const;

// Base schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateStringSchema = z.string().refine(
  (date) => {
    const parsed = Date.parse(date);
    if (isNaN(parsed)) return false;

    const parsedDate = new Date(parsed);
    const minDate = new Date(ATTENDANCE_VALIDATION.DATE_MIN_YEAR, 0, 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + ATTENDANCE_VALIDATION.DATE_MAX_FUTURE_DAYS);

    return parsedDate >= minDate && parsedDate <= maxDate;
  },
  {
    message: `Date must be valid ISO format and between ${ATTENDANCE_VALIDATION.DATE_MIN_YEAR} and today`,
  }
);

export const attendanceStatusSchema = z.enum([
  ATTENDANCE_STATUS.PRESENT,
  ATTENDANCE_STATUS.ABSENT,
  ATTENDANCE_STATUS.PENDING_PRESENT,
  ATTENDANCE_STATUS.PENDING_ABSENT,
  ATTENDANCE_STATUS.CONFIRMED_PRESENT,
  ATTENDANCE_STATUS.CONFIRMED_ABSENT,
] as const);

export const notesSchema = z
  .string()
  .max(
    ATTENDANCE_VALIDATION.NOTES_MAX_LENGTH,
    `Notes must be ${ATTENDANCE_VALIDATION.NOTES_MAX_LENGTH} characters or less`
  )
  .optional();

// Request schemas
export const createAttendanceRequestSchema = z.object({
  studentId: uuidSchema,
  date: dateStringSchema,
  status: attendanceStatusSchema,
  notes: notesSchema,
});

export const updateAttendanceRequestSchema = z.object({
  status: attendanceStatusSchema.optional(),
  notes: z.union([notesSchema, z.null()]).optional(),
}).refine(
  (data) => data.status !== undefined || data.notes !== undefined,
  {
    message: 'At least one field (status or notes) must be provided',
  }
);

// Query parameter schemas
export const getAttendanceQuerySchema = z.object({
  date: dateStringSchema,
});

// Response schemas
export const studentInfoSchema = z.object({
  id: uuidSchema,
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
});

export const attendanceRecordSchema = z.object({
  id: uuidSchema,
  studentId: uuidSchema,
  teacherId: z.string(),
  date: z.string(),
  status: attendanceStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  student: studentInfoSchema,
});

export const attendanceMetadataSchema = z.object({
  totalStudents: z.number().int().min(0),
  recordedAttendance: z.number().int().min(0),
  pendingConsensus: z.number().int().min(0),
});

export const attendanceListResponseSchema = z.object({
  date: z.string(),
  attendanceRecords: z.array(attendanceRecordSchema),
  studentsWithoutAttendance: z.array(studentInfoSchema),
  metadata: attendanceMetadataSchema,
});

// Error response schema
export const attendanceErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

// Type exports
export type CreateAttendanceRequest = z.infer<typeof createAttendanceRequestSchema>;
export type UpdateAttendanceRequest = z.infer<typeof updateAttendanceRequestSchema>;
export type GetAttendanceQuery = z.infer<typeof getAttendanceQuerySchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type StudentInfo = z.infer<typeof studentInfoSchema>;
export type AttendanceListResponse = z.infer<typeof attendanceListResponseSchema>;
export type AttendanceErrorResponse = z.infer<typeof attendanceErrorResponseSchema>;

/**
 * Validation helper functions
 */

/**
 * Validate that a date is not in the future
 */
export function validateDateNotFuture(date: string): { valid: boolean; error?: string } {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  if (dateObj > today) {
    return {
      valid: false,
      error: 'Date cannot be in the future',
    };
  }

  return { valid: true };
}

/**
 * Validate that notes are within length limits
 */
export function validateNotes(notes: string | null | undefined): { valid: boolean; error?: string } {
  if (!notes) {
    return { valid: true };
  }

  if (notes.length > ATTENDANCE_VALIDATION.NOTES_MAX_LENGTH) {
    return {
      valid: false,
      error: `Notes must be ${ATTENDANCE_VALIDATION.NOTES_MAX_LENGTH} characters or less`,
    };
  }

  return { valid: true };
}

/**
 * Validate attendance status transition
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  // Allow any transition for now
  // TODO: Add stricter validation based on consensus workflow
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  return { valid: true };
}
