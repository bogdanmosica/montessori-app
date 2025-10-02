import { and, eq, gte, lte, SQL } from 'drizzle-orm';
import {
  applications,
  enrollments,
  paymentActivities,
  staffActivities,
  events
} from './schema';

/**
 * Tenant-scoped query helpers for activity tracking
 * Ensures all queries include tenant_id filter for multi-tenant security
 */

/**
 * Create tenant-scoped condition for applications
 */
export function tenantApplicationsWhere(tenantId: number, additionalConditions?: SQL): SQL {
  const baseCondition = eq(applications.schoolId, tenantId);
  return additionalConditions ? and(baseCondition, additionalConditions)! : baseCondition;
}

/**
 * Create tenant-scoped condition for enrollments
 */
export function tenantEnrollmentsWhere(tenantId: number, additionalConditions?: SQL): SQL {
  const baseCondition = eq(enrollments.schoolId, tenantId);
  return additionalConditions ? and(baseCondition, additionalConditions)! : baseCondition;
}

/**
 * Create tenant-scoped condition for payment activities
 */
export function tenantPaymentActivitiesWhere(tenantId: number, additionalConditions?: SQL): SQL {
  const baseCondition = eq(paymentActivities.tenantId, tenantId);
  return additionalConditions ? and(baseCondition, additionalConditions)! : baseCondition;
}

/**
 * Create tenant-scoped condition for staff activities
 */
export function tenantStaffActivitiesWhere(tenantId: number, additionalConditions?: SQL): SQL {
  const baseCondition = eq(staffActivities.tenantId, tenantId);
  return additionalConditions ? and(baseCondition, additionalConditions)! : baseCondition;
}

/**
 * Create tenant-scoped condition for events
 */
export function tenantEventsWhere(tenantId: number, additionalConditions?: SQL): SQL {
  const baseCondition = eq(events.tenantId, tenantId);
  return additionalConditions ? and(baseCondition, additionalConditions)! : baseCondition;
}

/**
 * Create date range condition
 */
export function dateRangeCondition(
  dateColumn: any,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    gte(dateColumn, startDate),
    lte(dateColumn, endDate)
  )!;
}

/**
 * Create tenant-scoped date range condition for applications
 */
export function tenantApplicationsDateRange(
  tenantId: number,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    eq(applications.schoolId, tenantId),
    gte(applications.submittedAt, startDate),
    lte(applications.submittedAt, endDate)
  )!;
}

/**
 * Create tenant-scoped date range condition for enrollments
 */
export function tenantEnrollmentsDateRange(
  tenantId: number,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    eq(enrollments.schoolId, tenantId),
    gte(enrollments.enrollmentDate, startDate),
    lte(enrollments.enrollmentDate, endDate)
  )!;
}

/**
 * Create tenant-scoped date range condition for payment activities
 */
export function tenantPaymentActivitiesDateRange(
  tenantId: number,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    eq(paymentActivities.tenantId, tenantId),
    gte(paymentActivities.paymentDate, startDate),
    lte(paymentActivities.paymentDate, endDate)
  )!;
}

/**
 * Create tenant-scoped date range condition for staff activities
 */
export function tenantStaffActivitiesDateRange(
  tenantId: number,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    eq(staffActivities.tenantId, tenantId),
    gte(staffActivities.activityDate, startDate),
    lte(staffActivities.activityDate, endDate)
  )!;
}

/**
 * Create tenant-scoped date range condition for events
 */
export function tenantEventsDateRange(
  tenantId: number,
  startDate: Date,
  endDate: Date
): SQL {
  return and(
    eq(events.tenantId, tenantId),
    gte(events.eventDate, startDate),
    lte(events.eventDate, endDate)
  )!;
}
