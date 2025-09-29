import { z } from 'zod';
import { ApplicationStatus } from '@/lib/constants/application-status';
import { EnrollmentStatus } from '@/lib/constants/enrollment-status';
import { PaymentStatus } from '@/lib/constants/payment-status';
import { ActivityType } from '@/lib/constants/activity-types';
import { REPORT_TYPES, EXPORT_FORMATS, REPORT_LIMITS } from '@/lib/constants/report-constants';

// Base date range validation
const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: "Start date must be before or equal to end date",
    path: ["endDate"]
  }
).refine(
  (data) => {
    const diffYears = (data.endDate.getFullYear() - data.startDate.getFullYear());
    return diffYears <= REPORT_LIMITS.MAX_DATE_RANGE_YEARS;
  },
  {
    message: `Date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_YEARS} years`,
    path: ["endDate"]
  }
);

// Common filter schema
export const baseReportFiltersSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  format: z.enum([EXPORT_FORMATS.JSON, EXPORT_FORMATS.CSV, EXPORT_FORMATS.PDF]).default(EXPORT_FORMATS.JSON)
});

// Applications report filters
export const applicationsReportFiltersSchema = baseReportFiltersSchema.extend({
  status: z.array(z.nativeEnum(ApplicationStatus)).optional()
});

// Enrollments report filters
export const enrollmentsReportFiltersSchema = baseReportFiltersSchema.extend({
  status: z.array(z.nativeEnum(EnrollmentStatus)).optional()
});

// Payments report filters
export const paymentsReportFiltersSchema = baseReportFiltersSchema.extend({
  status: z.array(z.nativeEnum(PaymentStatus)).optional()
});

// Activity report filters
export const activityReportFiltersSchema = baseReportFiltersSchema.extend({
  activityType: z.array(z.nativeEnum(ActivityType)).optional()
});

// Query string parsers (for URL search params)
export const parseCommaSeparatedArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.split(',').filter(Boolean);
};

export const parseDateFromString = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
};

// URL search params validation schemas
export const applicationsReportParamsSchema = z.object({
  startDate: z.string().optional().transform(parseDateFromString),
  endDate: z.string().optional().transform(parseDateFromString),
  status: z.string().optional().transform(parseCommaSeparatedArray),
  format: z.enum([EXPORT_FORMATS.JSON, EXPORT_FORMATS.CSV, EXPORT_FORMATS.PDF]).default(EXPORT_FORMATS.JSON)
}).transform((data) => ({
  ...data,
  dateRange: data.startDate && data.endDate ? { startDate: data.startDate, endDate: data.endDate } : undefined,
  status: data.status?.length ? data.status.filter((s): s is ApplicationStatus =>
    Object.values(ApplicationStatus).includes(s as ApplicationStatus)) : undefined
}));

export const enrollmentsReportParamsSchema = z.object({
  startDate: z.string().optional().transform(parseDateFromString),
  endDate: z.string().optional().transform(parseDateFromString),
  status: z.string().optional().transform(parseCommaSeparatedArray),
  format: z.enum([EXPORT_FORMATS.JSON, EXPORT_FORMATS.CSV, EXPORT_FORMATS.PDF]).default(EXPORT_FORMATS.JSON)
}).transform((data) => ({
  ...data,
  dateRange: data.startDate && data.endDate ? { startDate: data.startDate, endDate: data.endDate } : undefined,
  status: data.status?.length ? data.status.filter((s): s is EnrollmentStatus =>
    Object.values(EnrollmentStatus).includes(s as EnrollmentStatus)) : undefined
}));

export const paymentsReportParamsSchema = z.object({
  startDate: z.string().optional().transform(parseDateFromString),
  endDate: z.string().optional().transform(parseDateFromString),
  status: z.string().optional().transform(parseCommaSeparatedArray),
  format: z.enum([EXPORT_FORMATS.JSON, EXPORT_FORMATS.CSV, EXPORT_FORMATS.PDF]).default(EXPORT_FORMATS.JSON)
}).transform((data) => ({
  ...data,
  dateRange: data.startDate && data.endDate ? { startDate: data.startDate, endDate: data.endDate } : undefined,
  status: data.status?.length ? data.status.filter((s): s is PaymentStatus =>
    Object.values(PaymentStatus).includes(s as PaymentStatus)) : undefined
}));

export const activityReportParamsSchema = z.object({
  startDate: z.string().optional().transform(parseDateFromString),
  endDate: z.string().optional().transform(parseDateFromString),
  activityType: z.string().optional().transform(parseCommaSeparatedArray),
  format: z.enum([EXPORT_FORMATS.JSON, EXPORT_FORMATS.CSV, EXPORT_FORMATS.PDF]).default(EXPORT_FORMATS.JSON)
}).transform((data) => ({
  ...data,
  dateRange: data.startDate && data.endDate ? { startDate: data.startDate, endDate: data.endDate } : undefined,
  activityType: data.activityType?.length ? data.activityType.filter((t): t is ActivityType =>
    Object.values(ActivityType).includes(t as ActivityType)) : undefined
}));

// Type exports for the transformed schemas
export type ApplicationsReportFilters = z.infer<typeof applicationsReportFiltersSchema>;
export type EnrollmentsReportFilters = z.infer<typeof enrollmentsReportFiltersSchema>;
export type PaymentsReportFilters = z.infer<typeof paymentsReportFiltersSchema>;
export type ActivityReportFilters = z.infer<typeof activityReportFiltersSchema>;

export type ApplicationsReportParams = z.infer<typeof applicationsReportParamsSchema>;
export type EnrollmentsReportParams = z.infer<typeof enrollmentsReportParamsSchema>;
export type PaymentsReportParams = z.infer<typeof paymentsReportParamsSchema>;
export type ActivityReportParams = z.infer<typeof activityReportParamsSchema>;