import { z } from 'zod';
import { ENROLLMENT_STATUS, ENROLLMENT_VALIDATION } from '@/app/admin/enrollments/constants';

// Base schemas
export const enrollmentStatusSchema = z.enum([
  ENROLLMENT_STATUS.ACTIVE,
  ENROLLMENT_STATUS.INACTIVE,
  ENROLLMENT_STATUS.WITHDRAWN,
  ENROLLMENT_STATUS.ARCHIVED,
] as const);

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateStringSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  { message: 'Invalid date format' }
);

export const emailSchema = z.string().email('Invalid email format').optional();

export const phoneSchema = z.string()
  .regex(/^[\+]?[1-9][\d\s\-\(\)]{6,20}$/, 'Invalid phone format')
  .optional();

// Child validation schemas
export const childAgeSchema = z.string()
  .refine((dateStr) => {
    const birthDate = new Date(dateStr);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= ENROLLMENT_VALIDATION.CHILD_MIN_AGE &&
             age - 1 <= ENROLLMENT_VALIDATION.CHILD_MAX_AGE;
    }

    return age >= ENROLLMENT_VALIDATION.CHILD_MIN_AGE &&
           age <= ENROLLMENT_VALIDATION.CHILD_MAX_AGE;
  }, {
    message: `Child must be between ${ENROLLMENT_VALIDATION.CHILD_MIN_AGE} and ${ENROLLMENT_VALIDATION.CHILD_MAX_AGE} years old`,
  });

export const newChildSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(ENROLLMENT_VALIDATION.CHILD_NAME_MAX_LENGTH, `First name must be ${ENROLLMENT_VALIDATION.CHILD_NAME_MAX_LENGTH} characters or less`),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(ENROLLMENT_VALIDATION.CHILD_NAME_MAX_LENGTH, `Last name must be ${ENROLLMENT_VALIDATION.CHILD_NAME_MAX_LENGTH} characters or less`),
  dateOfBirth: childAgeSchema,
  parentName: z.string()
    .min(1, 'Parent name is required')
    .max(ENROLLMENT_VALIDATION.PARENT_NAME_MAX_LENGTH, `Parent name must be ${ENROLLMENT_VALIDATION.PARENT_NAME_MAX_LENGTH} characters or less`),
  parentEmail: emailSchema,
  parentPhone: phoneSchema,
});

export const existingChildSchema = z.object({
  existingChildId: uuidSchema,
});

export const childDataSchema = z.union([
  newChildSchema,
  existingChildSchema,
]);

// Enrollment validation schemas
export const enrollmentDataSchema = z.object({
  enrollmentDate: dateStringSchema.refine(
    (date) => new Date(date) <= new Date(),
    { message: 'Enrollment date cannot be in the future' }
  ),
  notes: z.string()
    .max(ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH, `Notes must be ${ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH} characters or less`)
    .optional(),
});

export const enrollmentUpdateDataSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  enrollmentDate: dateStringSchema.optional(),
  withdrawalDate: dateStringSchema.optional(),
  notes: z.string()
    .max(ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH, `Notes must be ${ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH} characters or less`)
    .optional(),
}).refine(
  (data) => {
    // If status is withdrawn, withdrawal date is required
    if (data.status === ENROLLMENT_STATUS.WITHDRAWN && !data.withdrawalDate) {
      return false;
    }
    // Enrollment date must be before withdrawal date
    if (data.enrollmentDate && data.withdrawalDate) {
      return new Date(data.enrollmentDate) <= new Date(data.withdrawalDate);
    }
    return true;
  },
  {
    message: 'Withdrawal date is required when status is withdrawn, and must be after enrollment date',
    path: ['withdrawalDate'],
  }
);

// Request validation schemas
export const createEnrollmentRequestSchema = z.object({
  enrollment: enrollmentDataSchema,
  child: childDataSchema,
});

export const updateEnrollmentRequestSchema = z.object({
  enrollment: enrollmentUpdateDataSchema,
  child: newChildSchema.partial().optional(),
});

export const withdrawEnrollmentRequestSchema = z.object({
  withdrawalDate: dateStringSchema.optional(),
  notes: z.string()
    .max(ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH, `Notes must be ${ENROLLMENT_VALIDATION.NOTES_MAX_LENGTH} characters or less`)
    .optional(),
});

// Query parameter validation
export const getEnrollmentsQuerySchema = z.object({
  status: z.union([
    enrollmentStatusSchema,
    z.array(enrollmentStatusSchema),
  ]).optional(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['enrollment_date', 'child_name', 'created_at']).default('enrollment_date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// API response validation schemas
export const enrollmentWithChildSchema = z.object({
  id: uuidSchema,
  status: enrollmentStatusSchema,
  enrollmentDate: z.string(),
  withdrawalDate: z.string().optional(),
  notes: z.string().optional(),
  child: z.object({
    id: uuidSchema,
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    parentName: z.string(),
    parentEmail: z.string().optional(),
    parentPhone: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const getEnrollmentsResponseSchema = z.object({
  data: z.array(enrollmentWithChildSchema),
  pagination: paginationSchema,
});

// Status transition validation
export const validStatusTransitions: Record<string, string[]> = {
  [ENROLLMENT_STATUS.ACTIVE]: [ENROLLMENT_STATUS.INACTIVE, ENROLLMENT_STATUS.WITHDRAWN],
  [ENROLLMENT_STATUS.INACTIVE]: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.WITHDRAWN],
  [ENROLLMENT_STATUS.WITHDRAWN]: [ENROLLMENT_STATUS.ARCHIVED],
  [ENROLLMENT_STATUS.ARCHIVED]: [], // No transitions allowed from archived
};

export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = validStatusTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
}

// Validation helper functions
export function validateEnrollmentDates(
  enrollmentDate: string,
  withdrawalDate?: string
): { valid: boolean; error?: string } {
  const enrollment = new Date(enrollmentDate);
  const today = new Date();

  if (enrollment > today) {
    return {
      valid: false,
      error: 'Enrollment date cannot be in the future',
    };
  }

  if (withdrawalDate) {
    const withdrawal = new Date(withdrawalDate);
    if (withdrawal < enrollment) {
      return {
        valid: false,
        error: 'Withdrawal date cannot be before enrollment date',
      };
    }
  }

  return { valid: true };
}

export function validateChildAge(dateOfBirth: string): { valid: boolean; error?: string } {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    actualAge = age - 1;
  }

  if (actualAge < ENROLLMENT_VALIDATION.CHILD_MIN_AGE || actualAge > ENROLLMENT_VALIDATION.CHILD_MAX_AGE) {
    return {
      valid: false,
      error: `Child must be between ${ENROLLMENT_VALIDATION.CHILD_MIN_AGE} and ${ENROLLMENT_VALIDATION.CHILD_MAX_AGE} years old`,
    };
  }

  return { valid: true };
}

// Error response schema
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.array(z.string())).optional(),
  timestamp: z.string(),
  path: z.string(),
});

export type EnrollmentValidationError = z.ZodError;
export type CreateEnrollmentRequest = z.infer<typeof createEnrollmentRequestSchema>;
export type UpdateEnrollmentRequest = z.infer<typeof updateEnrollmentRequestSchema>;
export type WithdrawEnrollmentRequest = z.infer<typeof withdrawEnrollmentRequestSchema>;
export type GetEnrollmentsQuery = z.infer<typeof getEnrollmentsQuerySchema>;
export type GetEnrollmentsResponse = z.infer<typeof getEnrollmentsResponseSchema>;
export type EnrollmentWithChild = z.infer<typeof enrollmentWithChildSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;