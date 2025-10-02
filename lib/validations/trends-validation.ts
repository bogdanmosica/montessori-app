import { z } from 'zod';
import { TREND_ACTIVITY_TYPES } from '@/lib/constants/activity-types';

/**
 * Validation schemas for trends API parameters
 */

export const trendTypeSchema = z.enum(['weekly', 'custom']);

export const activityTypeSchema = z.enum([
  'applications',
  'enrollments',
  'payments',
  'staff_activities',
  'events'
]);

export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

export const trendsQuerySchema = z.object({
  trend: trendTypeSchema.nullable().optional().transform(val => val ?? 'weekly'),
  start_date: isoDateSchema.nullable().optional(),
  end_date: isoDateSchema.nullable().optional(),
  activity_types: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return TREND_ACTIVITY_TYPES;
      return val.split(',').filter(type =>
        TREND_ACTIVITY_TYPES.includes(type as any)
      );
    }),
  group_by: z.enum(['day', 'week']).nullable().optional().transform(val => val ?? 'day')
}).refine(
  (data) => {
    // If trend is 'custom', both start_date and end_date are required
    if (data.trend === 'custom') {
      return !!data.start_date && !!data.end_date;
    }
    return true;
  },
  {
    message: 'start_date and end_date are required for custom trend',
    path: ['trend']
  }
).refine(
  (data) => {
    // Validate start_date is before end_date
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'start_date must be before or equal to end_date',
    path: ['start_date']
  }
).refine(
  (data) => {
    // Validate end_date is not in the future
    if (data.end_date) {
      const endDate = new Date(data.end_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return endDate <= today;
    }
    return true;
  },
  {
    message: 'end_date cannot be in the future',
    path: ['end_date']
  }
).refine(
  (data) => {
    // Validate date range does not exceed 365 days
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 365;
    }
    return true;
  },
  {
    message: 'Date range cannot exceed 365 days',
    path: ['end_date']
  }
);

export type TrendsQuery = z.infer<typeof trendsQuerySchema>;

/**
 * Validate trends query parameters
 */
export function validateTrendsQuery(params: unknown): {
  success: boolean;
  data?: TrendsQuery;
  error?: {
    field: string;
    issue: string;
  }[];
} {
  const result = trendsQuerySchema.safeParse(params);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  return {
    success: false,
    error: result.error.errors.map(err => ({
      field: err.path.join('.'),
      issue: err.message
    }))
  };
}
