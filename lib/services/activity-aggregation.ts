import { db } from '@/lib/db';
import {
  applications,
  enrollments,
  paymentActivities,
  staffActivities,
  events,
  applicationStatusEnum,
} from '@/lib/db/schema';
import { and, eq, gte, lte, count, sql, sum } from 'drizzle-orm';
import type { TrendActivityType } from '@/lib/constants/activity-types';
import { formatISODate, generateDateArray } from '@/lib/utils/date-range';

export interface DailyMetric {
  date: string; // ISO date (YYYY-MM-DD)
  applications: {
    count: number;
    breakdown: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  enrollments: {
    count: number;
    breakdown: {
      active: number;
      inactive: number;
      waitlisted: number;
    };
  };
  payments: {
    count: number;
    total_amount: number;
    breakdown: {
      tuition: number;
      registration: number;
      materials: number;
      other: number;
    };
  };
  staff_activities: {
    count: number;
    breakdown: {
      hire: number;
      promotion: number;
      training: number;
      evaluation: number;
      departure: number;
    };
  };
  events: {
    count: number;
    breakdown: {
      meeting: number;
      ceremony: number;
      training: number;
      social: number;
      academic: number;
    };
  };
}

export interface ActivityMetricsSummary {
  total_applications: number;
  total_enrollments: number;
  total_payments: number;
  total_payment_amount: number;
  total_staff_activities: number;
  total_events: number;
}

/**
 * Activity Aggregation Service
 * Handles server-side data aggregation for trend analysis
 */
export class ActivityAggregationService {
  /**
   * Get daily metrics for a date range
   */
  static async getDailyMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    activityTypes?: TrendActivityType[]
  ): Promise<DailyMetric[]> {
    // Generate all dates in range
    const dates = generateDateArray(startDate, endDate);

    // Query all activity types in parallel
    const [
      applicationsData,
      enrollmentsData,
      paymentsData,
      staffActivitiesData,
      eventsData
    ] = await Promise.all([
      activityTypes?.includes('applications') !== false
        ? this.getApplicationsMetrics(tenantId, startDate, endDate)
        : [],
      activityTypes?.includes('enrollments') !== false
        ? this.getEnrollmentsMetrics(tenantId, startDate, endDate)
        : [],
      activityTypes?.includes('payments') !== false
        ? this.getPaymentMetrics(tenantId, startDate, endDate)
        : [],
      activityTypes?.includes('staff_activities') !== false
        ? this.getStaffActivitiesMetrics(tenantId, startDate, endDate)
        : [],
      activityTypes?.includes('events') !== false
        ? this.getEventsMetrics(tenantId, startDate, endDate)
        : [],
    ]);

    // Build map of daily metrics
    const metricsMap = new Map<string, DailyMetric>();

    dates.forEach(date => {
      const dateStr = formatISODate(date);
      metricsMap.set(dateStr, {
        date: dateStr,
        applications: {
          count: 0,
          breakdown: { pending: 0, approved: 0, rejected: 0 }
        },
        enrollments: {
          count: 0,
          breakdown: { active: 0, inactive: 0, waitlisted: 0 }
        },
        payments: {
          count: 0,
          total_amount: 0,
          breakdown: { tuition: 0, registration: 0, materials: 0, other: 0 }
        },
        staff_activities: {
          count: 0,
          breakdown: { hire: 0, promotion: 0, training: 0, evaluation: 0, departure: 0 }
        },
        events: {
          count: 0,
          breakdown: { meeting: 0, ceremony: 0, training: 0, social: 0, academic: 0 }
        }
      });
    });

    // Populate applications data
    applicationsData.forEach(item => {
      const metric = metricsMap.get(item.date);
      if (metric) {
        metric.applications.count += item.count;
        if (item.status === 'PENDING') metric.applications.breakdown.pending += item.count;
        else if (item.status === 'APPROVED') metric.applications.breakdown.approved += item.count;
        else if (item.status === 'REJECTED') metric.applications.breakdown.rejected += item.count;
      }
    });

    // Populate enrollments data
    enrollmentsData.forEach(item => {
      const metric = metricsMap.get(item.date);
      if (metric) {
        metric.enrollments.count += item.count;
        if (item.status === 'active') metric.enrollments.breakdown.active += item.count;
        else if (item.status === 'inactive') metric.enrollments.breakdown.inactive += item.count;
        else if (item.status === 'waitlisted') metric.enrollments.breakdown.waitlisted += item.count;
      }
    });

    // Populate payments data
    paymentsData.forEach(item => {
      const metric = metricsMap.get(item.date);
      if (metric) {
        metric.payments.count += item.count;
        metric.payments.total_amount += item.totalAmount;
        if (item.activityType === 'tuition') metric.payments.breakdown.tuition += item.count;
        else if (item.activityType === 'registration') metric.payments.breakdown.registration += item.count;
        else if (item.activityType === 'materials') metric.payments.breakdown.materials += item.count;
        else if (item.activityType === 'other') metric.payments.breakdown.other += item.count;
      }
    });

    // Populate staff activities data
    staffActivitiesData.forEach(item => {
      const metric = metricsMap.get(item.date);
      if (metric) {
        metric.staff_activities.count += item.count;
        if (item.activityType === 'hire') metric.staff_activities.breakdown.hire += item.count;
        else if (item.activityType === 'promotion') metric.staff_activities.breakdown.promotion += item.count;
        else if (item.activityType === 'training') metric.staff_activities.breakdown.training += item.count;
        else if (item.activityType === 'evaluation') metric.staff_activities.breakdown.evaluation += item.count;
        else if (item.activityType === 'departure') metric.staff_activities.breakdown.departure += item.count;
      }
    });

    // Populate events data
    eventsData.forEach(item => {
      const metric = metricsMap.get(item.date);
      if (metric) {
        metric.events.count += item.count;
        if (item.eventType === 'meeting') metric.events.breakdown.meeting += item.count;
        else if (item.eventType === 'ceremony') metric.events.breakdown.ceremony += item.count;
        else if (item.eventType === 'training') metric.events.breakdown.training += item.count;
        else if (item.eventType === 'social') metric.events.breakdown.social += item.count;
        else if (item.eventType === 'academic') metric.events.breakdown.academic += item.count;
      }
    });

    return Array.from(metricsMap.values());
  }

  /**
   * Get summary metrics for a date range
   */
  static async getSummaryMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ActivityMetricsSummary> {
    const [
      applicationsCount,
      enrollmentsCount,
      paymentsResult,
      staffActivitiesCount,
      eventsCount
    ] = await Promise.all([
      db.select({ count: count() })
        .from(applications)
        .where(
          and(
            eq(applications.schoolId, tenantId),
            gte(applications.submittedAt, startDate),
            lte(applications.submittedAt, endDate)
          )
        ),
      db.select({ count: count() })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.schoolId, tenantId),
            gte(enrollments.enrollmentDate, startDate),
            lte(enrollments.enrollmentDate, endDate)
          )
        ),
      db.select({
        count: count(),
        totalAmount: sum(paymentActivities.amount)
      })
        .from(paymentActivities)
        .where(
          and(
            eq(paymentActivities.tenantId, tenantId),
            gte(paymentActivities.paymentDate, startDate),
            lte(paymentActivities.paymentDate, endDate)
          )
        ),
      db.select({ count: count() })
        .from(staffActivities)
        .where(
          and(
            eq(staffActivities.tenantId, tenantId),
            gte(staffActivities.activityDate, startDate),
            lte(staffActivities.activityDate, endDate)
          )
        ),
      db.select({ count: count() })
        .from(events)
        .where(
          and(
            eq(events.tenantId, tenantId),
            gte(events.eventDate, startDate),
            lte(events.eventDate, endDate)
          )
        ),
    ]);

    return {
      total_applications: applicationsCount[0]?.count || 0,
      total_enrollments: enrollmentsCount[0]?.count || 0,
      total_payments: paymentsResult[0]?.count || 0,
      total_payment_amount: Number(paymentsResult[0]?.totalAmount || 0),
      total_staff_activities: staffActivitiesCount[0]?.count || 0,
      total_events: eventsCount[0]?.count || 0,
    };
  }

  /**
   * Get applications metrics grouped by date
   */
  private static async getApplicationsMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; status: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${applications.submittedAt})`,
        status: applications.status,
        count: count()
      })
      .from(applications)
      .where(
        and(
          eq(applications.schoolId, tenantId),
          gte(applications.submittedAt, startDate),
          lte(applications.submittedAt, endDate)
        )
      )
      .groupBy(sql`DATE(${applications.submittedAt})`, applications.status);

    return result.map(r => ({
      date: r.date,
      status: r.status,
      count: r.count
    }));
  }

  /**
   * Get enrollments metrics grouped by date
   */
  private static async getEnrollmentsMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; status: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${enrollments.enrollmentDate})`,
        status: enrollments.status,
        count: count()
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.schoolId, tenantId),
          gte(enrollments.enrollmentDate, startDate),
          lte(enrollments.enrollmentDate, endDate)
        )
      )
      .groupBy(sql`DATE(${enrollments.enrollmentDate})`, enrollments.status);

    return result.map(r => ({
      date: r.date,
      status: r.status,
      count: r.count
    }));
  }

  /**
   * Get payment metrics grouped by date
   */
  private static async getPaymentMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; activityType: string; count: number; totalAmount: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${paymentActivities.paymentDate})`,
        activityType: paymentActivities.activityType,
        count: count(),
        totalAmount: sum(paymentActivities.amount)
      })
      .from(paymentActivities)
      .where(
        and(
          eq(paymentActivities.tenantId, tenantId),
          eq(paymentActivities.status, 'completed'),
          gte(paymentActivities.paymentDate, startDate),
          lte(paymentActivities.paymentDate, endDate)
        )
      )
      .groupBy(sql`DATE(${paymentActivities.paymentDate})`, paymentActivities.activityType);

    return result.map(r => ({
      date: r.date,
      activityType: r.activityType,
      count: r.count,
      totalAmount: Number(r.totalAmount || 0)
    }));
  }

  /**
   * Get staff activities metrics grouped by date
   */
  private static async getStaffActivitiesMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; activityType: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${staffActivities.activityDate})`,
        activityType: staffActivities.activityType,
        count: count()
      })
      .from(staffActivities)
      .where(
        and(
          eq(staffActivities.tenantId, tenantId),
          gte(staffActivities.activityDate, startDate),
          lte(staffActivities.activityDate, endDate)
        )
      )
      .groupBy(sql`DATE(${staffActivities.activityDate})`, staffActivities.activityType);

    return result.map(r => ({
      date: r.date,
      activityType: r.activityType,
      count: r.count
    }));
  }

  /**
   * Get events metrics grouped by date
   */
  private static async getEventsMetrics(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; eventType: string; count: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${events.eventDate})`,
        eventType: events.eventType,
        count: count()
      })
      .from(events)
      .where(
        and(
          eq(events.tenantId, tenantId),
          gte(events.eventDate, startDate),
          lte(events.eventDate, endDate)
        )
      )
      .groupBy(sql`DATE(${events.eventDate})`, events.eventType);

    return result.map(r => ({
      date: r.date,
      eventType: r.eventType,
      count: r.count
    }));
  }
}
