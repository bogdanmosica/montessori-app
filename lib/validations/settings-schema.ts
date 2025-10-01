import { z } from 'zod';

/**
 * Settings validation constants
 */
export const SETTINGS_LIMITS = {
  MIN_FEE_RON: 0,
  MAX_FEE_RON: 99999.99,
  MIN_ENROLLMENT_COUNT: 0,
  MAX_ENROLLMENT_COUNT: 9999,
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 9999,
} as const;

/**
 * Default monthly fee validation schema (in RON)
 */
export const defaultMonthlyFeeSchema = z.number()
  .min(SETTINGS_LIMITS.MIN_FEE_RON, 'Default fee cannot be negative')
  .max(SETTINGS_LIMITS.MAX_FEE_RON, `Default fee cannot exceed ${SETTINGS_LIMITS.MAX_FEE_RON.toLocaleString()} RON`)
  .refine(
    (value) => Number.isFinite(value) && value >= 0,
    { message: 'Default fee must be a valid positive number' }
  )
  .refine(
    (value) => {
      // Ensure at most 2 decimal places
      const decimals = value.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    },
    { message: 'Default fee must have at most 2 decimal places' }
  );

/**
 * Free enrollment count validation schema
 */
export const freeEnrollmentCountSchema = z.number()
  .int('Free enrollment count must be an integer')
  .min(SETTINGS_LIMITS.MIN_ENROLLMENT_COUNT, 'Free enrollment count cannot be negative')
  .max(SETTINGS_LIMITS.MAX_ENROLLMENT_COUNT, `Free enrollment count cannot exceed ${SETTINGS_LIMITS.MAX_ENROLLMENT_COUNT}`);

/**
 * Maximum capacity validation schema
 */
export const maximumCapacitySchema = z.number()
  .int('Maximum capacity must be an integer')
  .min(SETTINGS_LIMITS.MIN_CAPACITY, 'Maximum capacity must be at least 1')
  .max(SETTINGS_LIMITS.MAX_CAPACITY, `Maximum capacity cannot exceed ${SETTINGS_LIMITS.MAX_CAPACITY}`);

/**
 * Age group capacity validation schema
 */
export const ageGroupCapacitySchema = z.object({
  ageGroup: z.string().min(1, 'Age group name is required'),
  minAge: z.number().int().min(0, 'Minimum age must be at least 0'),
  maxAge: z.number().int().min(0, 'Maximum age must be at least 0'),
  capacity: z.number().int().min(0, 'Capacity must be at least 0'),
}).refine(
  (data) => data.minAge <= data.maxAge,
  { message: 'Minimum age must be less than or equal to maximum age', path: ['minAge'] }
);

/**
 * Settings update request schema
 * For PUT /api/admin/settings
 */
export const settingsUpdateRequestSchema = z.object({
  default_monthly_fee_ron: defaultMonthlyFeeSchema,
  free_enrollment_count: freeEnrollmentCountSchema,
  maximum_capacity: maximumCapacitySchema,
  age_group_capacities: z.array(ageGroupCapacitySchema).optional(),
});

/**
 * Settings response schema
 * For GET /api/admin/settings
 */
export const settingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    school_id: z.string(),
    default_monthly_fee_ron: z.number(),
    free_enrollment_count: z.number().int(),
    maximum_capacity: z.number().int(),
    age_group_capacities: z.array(ageGroupCapacitySchema).optional(),
    settings_updated_at: z.string().datetime().nullable(),
    updated_by_admin: z.string().nullable(),
  }),
});

/**
 * Settings update response schema
 * For PUT /api/admin/settings success response
 */
export const settingsUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    school_id: z.string(),
    default_monthly_fee_ron: z.number(),
    free_enrollment_count: z.number().int(),
    maximum_capacity: z.number().int(),
    age_group_capacities: z.array(ageGroupCapacitySchema).optional(),
    settings_updated_at: z.string().datetime(),
    updated_by_admin: z.string(),
  }),
  message: z.string(),
});

/**
 * Error response schema
 * For API error responses
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string(),
  timestamp: z.string().datetime(),
  details: z.record(z.array(z.string())).optional(),
});

/**
 * Validation helper functions
 */

/**
 * Validate default fee amount
 */
export function validateDefaultFee(amount: number): { valid: boolean; error?: string } {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: 'Default fee must be a valid number' };
  }

  if (amount < SETTINGS_LIMITS.MIN_FEE_RON) {
    return { valid: false, error: 'Default fee cannot be negative' };
  }

  if (amount > SETTINGS_LIMITS.MAX_FEE_RON) {
    return { valid: false, error: `Default fee cannot exceed ${SETTINGS_LIMITS.MAX_FEE_RON.toLocaleString()} RON` };
  }

  // Check decimal places
  const decimals = amount.toString().split('.')[1];
  if (decimals && decimals.length > 2) {
    return { valid: false, error: 'Default fee must have at most 2 decimal places' };
  }

  return { valid: true };
}

/**
 * Validate free enrollment count
 */
export function validateEnrollmentCount(count: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(count)) {
    return { valid: false, error: 'Free enrollment count must be an integer' };
  }

  if (count < SETTINGS_LIMITS.MIN_ENROLLMENT_COUNT) {
    return { valid: false, error: 'Free enrollment count cannot be negative' };
  }

  if (count > SETTINGS_LIMITS.MAX_ENROLLMENT_COUNT) {
    return { valid: false, error: `Free enrollment count cannot exceed ${SETTINGS_LIMITS.MAX_ENROLLMENT_COUNT}` };
  }

  return { valid: true };
}

/**
 * Validate maximum capacity
 */
export function validateMaximumCapacity(capacity: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(capacity)) {
    return { valid: false, error: 'Maximum capacity must be an integer' };
  }

  if (capacity < SETTINGS_LIMITS.MIN_CAPACITY) {
    return { valid: false, error: 'Maximum capacity must be at least 1' };
  }

  if (capacity > SETTINGS_LIMITS.MAX_CAPACITY) {
    return { valid: false, error: `Maximum capacity cannot exceed ${SETTINGS_LIMITS.MAX_CAPACITY}` };
  }

  return { valid: true };
}

/**
 * Validate age group capacities
 */
export function validateAgeGroupCapacities(
  capacities: Array<{ ageGroup: string; minAge: number; maxAge: number; capacity: number }>,
  totalCapacity: number
): { valid: boolean; error?: string } {
  if (!capacities || capacities.length === 0) {
    return { valid: true }; // Optional field
  }

  // Check for overlapping age ranges
  for (let i = 0; i < capacities.length - 1; i++) {
    for (let j = i + 1; j < capacities.length; j++) {
      const cap1 = capacities[i];
      const cap2 = capacities[j];
      
      // Check if ranges overlap
      if (cap1.minAge <= cap2.maxAge && cap2.minAge <= cap1.maxAge) {
        return { 
          valid: false, 
          error: `Age ranges overlap between "${cap1.ageGroup}" and "${cap2.ageGroup}"` 
        };
      }
    }
  }

  // Check if total of age group capacities matches total capacity
  const sumCapacities = capacities.reduce((sum, cap) => sum + cap.capacity, 0);
  if (sumCapacities !== totalCapacity) {
    return { 
      valid: false, 
      error: `Sum of age group capacities (${sumCapacities}) must equal total capacity (${totalCapacity})` 
    };
  }

  return { valid: true };
}

/**
 * Validate complete settings update request
 */
export function validateSettingsUpdate(data: unknown): { valid: boolean; errors?: Record<string, string[]> } {
  const result = settingsUpdateRequestSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });
    return { valid: false, errors };
  }

  // Additional validation for age group capacities
  if (result.data.age_group_capacities) {
    const ageGroupValidation = validateAgeGroupCapacities(
      result.data.age_group_capacities,
      result.data.maximum_capacity
    );
    
    if (!ageGroupValidation.valid) {
      return { 
        valid: false, 
        errors: { 'age_group_capacities': [ageGroupValidation.error!] }
      };
    }
  }

  return { valid: true };
}

// Type exports
export type AgeGroupCapacity = z.infer<typeof ageGroupCapacitySchema>;
export type SettingsUpdateRequest = z.infer<typeof settingsUpdateRequestSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type SettingsUpdateResponse = z.infer<typeof settingsUpdateResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;