import { db } from '@/lib/db';
import { extendedAccessLogs, users } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray, desc, isNotNull } from 'drizzle-orm';
import { ActivityReportRow, ReportMetadata } from '@/lib/types/report-types';
import { ActivityType } from '@/lib/constants/activity-types';
import { REPORT_LIMITS } from '@/lib/constants/report-constants';

interface ActivityReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  activityType?: ActivityType[];
}

export class ActivityReportService {
  static async generateReport(
    tenantId: string,
    requestedBy: string,
    filters: ActivityReportFilters
  ): Promise<{ data: ActivityReportRow[]; metadata: ReportMetadata }> {
    const startTime = Date.now();

    // Build query conditions
    const conditions = [
      eq(extendedAccessLogs.teamId, parseInt(tenantId)),
      isNotNull(extendedAccessLogs.userId) // Only logged-in user activities
    ];

    // Add date range filter
    if (filters.dateRange) {
      conditions.push(gte(extendedAccessLogs.timestamp, filters.dateRange.startDate));
      conditions.push(lte(extendedAccessLogs.timestamp, filters.dateRange.endDate));
    }

    // Add activity type filter - we'll map routes to activity types
    if (filters.activityType && filters.activityType.length > 0) {
      // For now, we'll use route patterns to match activity types
      const routePatterns = filters.activityType.map(type => this.getRoutePatternForActivity(type));
      // This would need a more sophisticated filtering approach in a real implementation
    }

    // Execute query with user join
    const results = await db
      .select({
        id: extendedAccessLogs.id,
        route: extendedAccessLogs.route,
        success: extendedAccessLogs.success,
        timestamp: extendedAccessLogs.timestamp,
        userAgent: extendedAccessLogs.userAgent,
        ipAddress: extendedAccessLogs.ipAddress,
        paymentAction: extendedAccessLogs.paymentAction,
        amountAffected: extendedAccessLogs.amountAffected,
        userName: users.name,
        userRole: users.role
      })
      .from(extendedAccessLogs)
      .leftJoin(users, eq(extendedAccessLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(extendedAccessLogs.timestamp))
      .limit(REPORT_LIMITS.MAX_RECORDS);

    // Transform to report format
    const reportData: ActivityReportRow[] = results.map(row => ({
      activityId: row.id,
      activityType: this.mapRouteToActivityType(row.route, row.paymentAction),
      performedBy: row.userName || 'Unknown User',
      performedByRole: row.userRole || 'unknown',
      targetEntity: this.extractTargetEntity(row.route),
      targetId: this.extractTargetId(row.route),
      description: this.generateDescription(row.route, row.paymentAction, row.success),
      timestamp: row.timestamp,
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined
    }));

    // Build metadata
    const metadata: ReportMetadata = {
      totalRows: reportData.length,
      generatedAt: new Date(),
      filters,
      tenantId,
      requestedBy
    };

    const endTime = Date.now();
    console.log(`Activity report generated in ${endTime - startTime}ms`);

    return { data: reportData, metadata };
  }

  private static mapRouteToActivityType(route: string, paymentAction?: string): string {
    // Map route patterns to activity types
    if (route.includes('/auth/signin')) return 'login';
    if (route.includes('/auth/signout')) return 'logout';
    if (route.includes('/applications') && route.includes('POST')) return 'application_create';
    if (route.includes('/applications') && route.includes('approve')) return 'application_approve';
    if (route.includes('/applications') && route.includes('reject')) return 'application_reject';
    if (route.includes('/enrollments') && route.includes('POST')) return 'enrollment_create';
    if (route.includes('/enrollments') && route.includes('PUT')) return 'enrollment_update';
    if (route.includes('/reports')) return 'report_generate';
    if (paymentAction) return 'payment_process';

    return 'unknown_activity';
  }

  private static extractTargetEntity(route: string): string {
    if (route.includes('/applications')) return 'application';
    if (route.includes('/enrollments')) return 'enrollment';
    if (route.includes('/payments')) return 'payment';
    if (route.includes('/reports')) return 'report';
    if (route.includes('/users')) return 'user';

    return 'system';
  }

  private static extractTargetId(route: string): string {
    // Extract ID from route patterns like /api/applications/[id]
    const matches = route.match(/\/([a-f0-9\-]{36}|\d+)(?:\/|$)/);
    return matches ? matches[1] : 'n/a';
  }

  private static generateDescription(route: string, paymentAction?: string, success?: boolean): string {
    const action = success ? 'successfully' : 'failed to';

    if (route.includes('/auth/signin')) return `User ${action} signed in`;
    if (route.includes('/auth/signout')) return `User ${action} signed out`;
    if (route.includes('/applications')) return `User ${action} accessed applications`;
    if (route.includes('/enrollments')) return `User ${action} accessed enrollments`;
    if (route.includes('/reports')) return `User ${action} generated report`;
    if (paymentAction) return `User ${action} processed payment action: ${paymentAction}`;

    return `User ${action} accessed: ${route}`;
  }

  private static getRoutePatternForActivity(activityType: ActivityType): string {
    const patterns: Record<ActivityType, string> = {
      [ActivityType.LOGIN]: '/auth/signin',
      [ActivityType.LOGOUT]: '/auth/signout',
      [ActivityType.APPLICATION_CREATE]: '/applications',
      [ActivityType.APPLICATION_APPROVE]: '/applications/approve',
      [ActivityType.APPLICATION_REJECT]: '/applications/reject',
      [ActivityType.ENROLLMENT_CREATE]: '/enrollments',
      [ActivityType.ENROLLMENT_UPDATE]: '/enrollments',
      [ActivityType.PAYMENT_PROCESS]: '/payments',
      [ActivityType.REPORT_GENERATE]: '/reports'
    };

    return patterns[activityType] || '';
  }

  static async validateFilters(filters: ActivityReportFilters): Promise<string[]> {
    const errors: string[] = [];

    // Validate date range
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;

      if (startDate > endDate) {
        errors.push('Start date must be before or equal to end date');
      }

      const yearsDiff = (endDate.getFullYear() - startDate.getFullYear());
      if (yearsDiff > REPORT_LIMITS.MAX_DATE_RANGE_YEARS) {
        errors.push(`Date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_YEARS} years`);
      }
    }

    // Validate activity types
    if (filters.activityType) {
      const validTypes = Object.values(ActivityType);
      const invalidTypes = filters.activityType.filter(type => !validTypes.includes(type));

      if (invalidTypes.length > 0) {
        errors.push(`Invalid activity types: ${invalidTypes.join(', ')}`);
      }
    }

    return errors;
  }

  static async getActivitySummary(tenantId: string, filters?: ActivityReportFilters): Promise<{
    totalActivities: number;
    uniqueUsers: number;
    mostActiveUser: string;
    topActivity: string;
    failureRate: number;
  }> {
    const conditions = [eq(extendedAccessLogs.teamId, parseInt(tenantId))];

    if (filters?.dateRange) {
      conditions.push(gte(extendedAccessLogs.timestamp, filters.dateRange.startDate));
      conditions.push(lte(extendedAccessLogs.timestamp, filters.dateRange.endDate));
    }

    const results = await db
      .select({
        userId: extendedAccessLogs.userId,
        route: extendedAccessLogs.route,
        success: extendedAccessLogs.success,
        userName: users.name
      })
      .from(extendedAccessLogs)
      .leftJoin(users, eq(extendedAccessLogs.userId, users.id))
      .where(and(...conditions));

    const totalActivities = results.length;
    const uniqueUsers = new Set(results.map(r => r.userId).filter(Boolean)).size;
    const failedActivities = results.filter(r => !r.success).length;
    const failureRate = totalActivities > 0 ? (failedActivities / totalActivities) * 100 : 0;

    // Calculate most active user
    const userActivityCounts = new Map<string, number>();
    results.forEach(r => {
      if (r.userName) {
        userActivityCounts.set(r.userName, (userActivityCounts.get(r.userName) || 0) + 1);
      }
    });

    const mostActiveUser = Array.from(userActivityCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No activity';

    // Calculate top activity
    const activityCounts = new Map<string, number>();
    results.forEach(r => {
      const activity = this.mapRouteToActivityType(r.route);
      activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
    });

    const topActivity = Array.from(activityCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No activity';

    return {
      totalActivities,
      uniqueUsers,
      mostActiveUser,
      topActivity,
      failureRate: Math.round(failureRate * 100) / 100
    };
  }
}