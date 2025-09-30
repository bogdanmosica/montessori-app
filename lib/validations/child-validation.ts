import { z } from 'zod';
import { FEE_LIMITS } from '@/lib/constants/currency';

/**
 * Child validation schemas
 */

export const childNameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .regex(/^[a-zA-ZăâîșțĂÂÎȘȚ\s\-']+$/u, 'Name contains invalid characters');

export const childDateOfBirthSchema = z.string()
  .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' })
  .refine((dateStr) => {
    const birthDate = new Date(dateStr);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      actualAge = age - 1;
    }

    return actualAge >= 2 && actualAge <= 7; // Montessori age range
  }, { message: 'Child must be between 2 and 7 years old' });

export const childGenderSchema = z.string()
  .max(50, 'Gender must be 50 characters or less')
  .optional();

export const childStartDateSchema = z.string()
  .refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid date format' });

export const childMonthlyFeeSchema = z.number()
  .min(FEE_LIMITS.MIN_FEE_RON, 'Fee cannot be negative')
  .max(FEE_LIMITS.MAX_FEE_RON, `Fee cannot exceed ${FEE_LIMITS.MAX_FEE_RON.toLocaleString()} RON`)
  .optional();

export const childSpecialNeedsSchema = z.string()
  .max(1000, 'Special needs description must be 1000 characters or less')
  .optional();

export const childMedicalConditionsSchema = z.string()
  .max(1000, 'Medical conditions description must be 1000 characters or less')
  .optional();

/**
 * Base child creation schema
 */
export const createChildSchema = z.object({
  firstName: childNameSchema,
  lastName: childNameSchema,
  dateOfBirth: childDateOfBirthSchema,
  monthlyFee: childMonthlyFeeSchema,
  gender: childGenderSchema,
  startDate: childStartDateSchema,
  specialNeeds: childSpecialNeedsSchema,
  medicalConditions: childMedicalConditionsSchema,
});

/**
 * Child update schema
 */
export const updateChildSchema = z.object({
  firstName: childNameSchema.optional(),
  lastName: childNameSchema.optional(),
  dateOfBirth: childDateOfBirthSchema.optional(),
  monthlyFee: childMonthlyFeeSchema,
  gender: childGenderSchema,
  startDate: childStartDateSchema.optional(),
  specialNeeds: childSpecialNeedsSchema,
  medicalConditions: childMedicalConditionsSchema,
});

/**
 * Child fee-only update schema
 */
export const updateChildFeeSchema = z.object({
  monthlyFee: childMonthlyFeeSchema,
});

/**
 * API request schemas
 */
export const createChildRequestSchema = z.object({
  firstName: childNameSchema,
  lastName: childNameSchema,
  dateOfBirth: z.string().datetime(),
  monthlyFee: childMonthlyFeeSchema,
  gender: childGenderSchema,
  startDate: z.string().datetime(),
  specialNeeds: childSpecialNeedsSchema,
  medicalConditions: childMedicalConditionsSchema,
});

export const updateChildRequestSchema = z.object({
  firstName: childNameSchema.optional(),
  lastName: childNameSchema.optional(),
  dateOfBirth: z.string().datetime().optional(),
  monthlyFee: childMonthlyFeeSchema,
  gender: childGenderSchema,
  startDate: z.string().datetime().optional(),
  specialNeeds: childSpecialNeedsSchema,
  medicalConditions: childMedicalConditionsSchema,
});

/**
 * Child response schemas
 */
export const childResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  monthlyFee: z.number().int(), // In cents
  monthlyFeeDisplay: z.string(),
  gender: z.string().optional(),
  startDate: z.string(),
  specialNeeds: z.string().optional(),
  medicalConditions: z.string().optional(),
  enrollmentStatus: z.string(),
  schoolId: z.number(),
  applicationId: z.string().uuid().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdByAdminId: z.number(),
});

/**
 * Child list response schema
 */
export const childrenListResponseSchema = z.object({
  data: z.array(childResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

/**
 * Child query parameters schema
 */
export const getChildrenQuerySchema = z.object({
  search: z.string().min(1).optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['firstName', 'lastName', 'dateOfBirth', 'startDate', 'createdAt']).default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Validation helper functions
 */
export function validateChildAge(dateOfBirth: string): { valid: boolean; error?: string } {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  let actualAge = age;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    actualAge = age - 1;
  }

  if (actualAge < 2 || actualAge > 7) {
    return {
      valid: false,
      error: 'Child must be between 2 and 7 years old for Montessori enrollment',
    };
  }

  return { valid: true };
}

export function validateChildFee(fee: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(fee)) {
    return { valid: false, error: 'Fee must be a valid number' };
  }

  if (fee < FEE_LIMITS.MIN_FEE_RON) {
    return { valid: false, error: 'Fee cannot be negative' };
  }

  if (fee > FEE_LIMITS.MAX_FEE_RON) {
    return { valid: false, error: `Fee cannot exceed ${FEE_LIMITS.MAX_FEE_RON.toLocaleString()} RON` };
  }

  return { valid: true };
}

/**
 * Type exports
 */
export type CreateChildRequest = z.infer<typeof createChildRequestSchema>;
export type UpdateChildRequest = z.infer<typeof updateChildRequestSchema>;
export type UpdateChildFeeRequest = z.infer<typeof updateChildFeeSchema>;
export type ChildResponse = z.infer<typeof childResponseSchema>;
export type ChildrenListResponse = z.infer<typeof childrenListResponseSchema>;
export type GetChildrenQuery = z.infer<typeof getChildrenQuerySchema>;