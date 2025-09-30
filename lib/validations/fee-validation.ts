import { z } from 'zod';
import { FEE_LIMITS } from '@/lib/constants/currency';

/**
 * Base fee validation schema for RON amounts
 * Validates fee amounts in RON (not cents) for user input
 */
export const feeAmountSchema = z.number()
  .min(FEE_LIMITS.MIN_FEE_RON, 'Fee cannot be negative')
  .max(FEE_LIMITS.MAX_FEE_RON, `Fee cannot exceed ${FEE_LIMITS.MAX_FEE_RON.toLocaleString()} RON`)
  .refine(
    (value) => Number.isFinite(value) && value >= 0,
    { message: 'Fee must be a valid positive number' }
  );

/**
 * Optional fee amount schema for cases where fee is not required
 */
export const optionalFeeAmountSchema = feeAmountSchema.optional();

/**
 * Nullable fee amount schema for enrollment overrides
 */
export const nullableFeeAmountSchema = feeAmountSchema.nullable().optional();

/**
 * Fee amount in cents schema for database storage validation
 */
export const feeAmountCentsSchema = z.number()
  .int('Fee in cents must be an integer')
  .min(FEE_LIMITS.MIN_FEE_CENTS, 'Fee cannot be negative')
  .max(FEE_LIMITS.MAX_FEE_CENTS, `Fee cannot exceed ${FEE_LIMITS.MAX_FEE_CENTS} cents`);

/**
 * Optional fee amount in cents schema
 */
export const optionalFeeAmountCentsSchema = feeAmountCentsSchema.optional();

/**
 * Nullable fee amount in cents schema for enrollment overrides
 */
export const nullableFeeAmountCentsSchema = feeAmountCentsSchema.nullable().optional();

/**
 * Child fee validation schema
 * For creating/updating child default fees
 */
export const childFeeSchema = z.object({
  monthlyFee: optionalFeeAmountSchema,
});

/**
 * Child fee update schema
 * For updating existing child fees
 */
export const childFeeUpdateSchema = z.object({
  monthlyFee: optionalFeeAmountSchema,
});

/**
 * Enrollment fee override schema
 * For creating/updating enrollment-specific fee overrides
 */
export const enrollmentFeeSchema = z.object({
  monthlyFeeOverride: nullableFeeAmountSchema,
});

/**
 * Enrollment fee override update schema
 */
export const enrollmentFeeUpdateSchema = z.object({
  monthlyFeeOverride: nullableFeeAmountSchema,
});

/**
 * Complete child creation schema with fee
 * Extends basic child data with optional fee
 */
export const childWithFeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  monthlyFee: optionalFeeAmountSchema,
  gender: z.string().max(50).optional(),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  specialNeeds: z.string().optional(),
  medicalConditions: z.string().optional(),
});

/**
 * Complete enrollment creation schema with fee override
 */
export const enrollmentWithFeeSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
  enrollmentDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  monthlyFeeOverride: nullableFeeAmountSchema,
  notes: z.string().optional(),
});

/**
 * Fee input validation for forms
 * Validates user input before conversion to cents
 */
export const feeInputSchema = z.string()
  .transform((val) => {
    // Remove currency symbols and whitespace
    const cleaned = val.replace(/[^\d.,]/g, '');
    if (!cleaned) return null;
    
    // Handle Romanian decimal format (comma as decimal separator)
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    
    return isNaN(parsed) ? null : parsed;
  })
  .refine(
    (val) => val === null || (val >= FEE_LIMITS.MIN_FEE_RON && val <= FEE_LIMITS.MAX_FEE_RON),
    { message: `Fee must be between ${FEE_LIMITS.MIN_FEE_RON} and ${FEE_LIMITS.MAX_FEE_RON.toLocaleString()} RON` }
  )
  .nullable();

/**
 * API request schema for child creation with fee
 */
export const createChildWithFeeRequestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  monthlyFee: optionalFeeAmountSchema,
  gender: z.string().max(50).optional(),
  startDate: z.string().datetime(),
  specialNeeds: z.string().optional(),
  medicalConditions: z.string().optional(),
});

/**
 * API request schema for child fee update
 */
export const updateChildFeeRequestSchema = z.object({
  monthlyFee: optionalFeeAmountSchema,
});

/**
 * API request schema for enrollment creation with fee override
 */
export const createEnrollmentWithFeeRequestSchema = z.object({
  childId: z.string().uuid(),
  enrollmentDate: z.string().datetime(),
  monthlyFeeOverride: nullableFeeAmountSchema,
  notes: z.string().optional(),
});

/**
 * API request schema for enrollment fee override update
 */
export const updateEnrollmentFeeRequestSchema = z.object({
  monthlyFeeOverride: nullableFeeAmountSchema,
});

/**
 * API response schema for child with fee display
 */
export const childWithFeeResponseSchema = z.object({
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
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * API response schema for enrollment with effective fee
 */
export const enrollmentWithFeeResponseSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  enrollmentDate: z.string(),
  monthlyFeeOverride: z.number().int().nullable(), // In cents
  effectiveFee: z.number().int(), // Resolved fee in cents
  effectiveFeeDisplay: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Fee details response schema
 */
export const feeDetailsResponseSchema = z.object({
  childId: z.string().uuid(),
  defaultFee: z.number().int(), // In cents
  defaultFeeDisplay: z.string(),
  enrollments: z.array(z.object({
    id: z.string().uuid(),
    monthlyFeeOverride: z.number().int().nullable(),
    effectiveFee: z.number().int(),
    effectiveFeeDisplay: z.string(),
  })),
});

/**
 * Validation helper functions
 */

/**
 * Validate fee amount and return validation result
 */
export function validateFeeAmount(amount: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: 'Fee must be a valid number' };
  }
  
  if (amount < FEE_LIMITS.MIN_FEE_RON) {
    return { valid: false, error: 'Fee cannot be negative' };
  }
  
  if (amount > FEE_LIMITS.MAX_FEE_RON) {
    return { valid: false, error: `Fee cannot exceed ${FEE_LIMITS.MAX_FEE_RON.toLocaleString()} RON` };
  }
  
  return { valid: true };
}

/**
 * Validate fee override logic
 */
export function validateFeeOverride(
  childDefaultFee: number,
  enrollmentOverride: number | null
): { valid: boolean; error?: string } {
  // Child default fee validation
  const childFeeValidation = validateFeeAmount(childDefaultFee);
  if (!childFeeValidation.valid) {
    return { valid: false, error: `Child default fee: ${childFeeValidation.error}` };
  }
  
  // Enrollment override validation (if provided)
  if (enrollmentOverride !== null) {
    const overrideValidation = validateFeeAmount(enrollmentOverride);
    if (!overrideValidation.valid) {
      return { valid: false, error: `Enrollment override: ${overrideValidation.error}` };
    }
  }
  
  return { valid: true };
}

// Type exports
export type ChildFee = z.infer<typeof childFeeSchema>;
export type EnrollmentFee = z.infer<typeof enrollmentFeeSchema>;
export type ChildWithFee = z.infer<typeof childWithFeeSchema>;
export type EnrollmentWithFee = z.infer<typeof enrollmentWithFeeSchema>;
export type CreateChildWithFeeRequest = z.infer<typeof createChildWithFeeRequestSchema>;
export type UpdateChildFeeRequest = z.infer<typeof updateChildFeeRequestSchema>;
export type CreateEnrollmentWithFeeRequest = z.infer<typeof createEnrollmentWithFeeRequestSchema>;
export type UpdateEnrollmentFeeRequest = z.infer<typeof updateEnrollmentFeeRequestSchema>;
export type ChildWithFeeResponse = z.infer<typeof childWithFeeResponseSchema>;
export type EnrollmentWithFeeResponse = z.infer<typeof enrollmentWithFeeResponseSchema>;
export type FeeDetailsResponse = z.infer<typeof feeDetailsResponseSchema>;