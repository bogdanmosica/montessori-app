import { db } from '@/lib/db';
import { enrollments, children, users, teams } from '@/lib/db/schema';
import { eq, and, or, gte, lte, count, sql, desc, asc } from 'drizzle-orm';
import type { EnrollmentWithChild } from '@/app/admin/enrollments/types';
import { ENROLLMENT_STATUS } from '@/app/admin/enrollments/constants';

/**
 * Enrollment database queries with tenant scoping
 */
export class EnrollmentQueries {
  /**
   * Get enrollment with child details by ID
   */
  static async getEnrollmentWithChild(
    enrollmentId: string,
    schoolId: number
  ): Promise<EnrollmentWithChild | null> {
    const result = await db
      .select({
        // Enrollment fields
        id: enrollments.id,
        status: enrollments.status,
        enrollmentDate: enrollments.enrollmentDate,
        withdrawalDate: enrollments.withdrawalDate,
        notes: enrollments.notes,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
        createdBy: enrollments.createdBy,
        updatedBy: enrollments.updatedBy,
        // Child fields
        childId: children.id,
        childFirstName: children.firstName,
        childLastName: children.lastName,
        childDateOfBirth: children.dateOfBirth,
        // Parent info would come from parent_profiles in a full implementation
        // For now, using placeholder values
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!result.length) return null;

    const row = result[0];
    return {
      id: row.id,
      status: row.status as any,
      enrollmentDate: row.enrollmentDate.toISOString(),
      withdrawalDate: row.withdrawalDate?.toISOString(),
      notes: row.notes || undefined,
      child: {
        id: row.childId,
        firstName: row.childFirstName,
        lastName: row.childLastName,
        dateOfBirth: row.childDateOfBirth.toISOString(),
        parentName: 'Parent Name', // Placeholder
        parentEmail: undefined,
        parentPhone: undefined,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy.toString(),
      updatedBy: row.updatedBy.toString(),
    };
  }

  /**
   * Count enrollments by status for dashboard metrics
   */
  static async getEnrollmentCounts(schoolId: number) {
    const result = await db
      .select({
        status: enrollments.status,
        count: count(enrollments.id),
      })
      .from(enrollments)
      .where(eq(enrollments.schoolId, schoolId))
      .groupBy(enrollments.status);

    return result.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get recent enrollments for dashboard
   */
  static async getRecentEnrollments(
    schoolId: number,
    limit: number = 5
  ): Promise<EnrollmentWithChild[]> {
    const result = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        enrollmentDate: enrollments.enrollmentDate,
        withdrawalDate: enrollments.withdrawalDate,
        notes: enrollments.notes,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
        createdBy: enrollments.createdBy,
        updatedBy: enrollments.updatedBy,
        childId: children.id,
        childFirstName: children.firstName,
        childLastName: children.lastName,
        childDateOfBirth: children.dateOfBirth,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(eq(enrollments.schoolId, schoolId))
      .orderBy(desc(enrollments.createdAt))
      .limit(limit);

    return result.map(row => ({
      id: row.id,
      status: row.status as any,
      enrollmentDate: row.enrollmentDate.toISOString(),
      withdrawalDate: row.withdrawalDate?.toISOString(),
      notes: row.notes || undefined,
      child: {
        id: row.childId,
        firstName: row.childFirstName,
        lastName: row.childLastName,
        dateOfBirth: row.childDateOfBirth.toISOString(),
        parentName: 'Parent Name', // Placeholder
        parentEmail: undefined,
        parentPhone: undefined,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy.toString(),
      updatedBy: row.updatedBy.toString(),
    }));
  }

  /**
   * Check for duplicate active enrollments
   */
  static async hasActiveEnrollment(
    childId: string,
    schoolId: number,
    excludeEnrollmentId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(enrollments.childId, childId),
      eq(enrollments.schoolId, schoolId),
      eq(enrollments.status, ENROLLMENT_STATUS.ACTIVE),
    ];

    if (excludeEnrollmentId) {
      conditions.push(sql`${enrollments.id} != ${excludeEnrollmentId}`);
    }

    const result = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(...conditions))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get enrollments by date range
   */
  static async getEnrollmentsByDateRange(
    schoolId: number,
    startDate: Date,
    endDate: Date
  ) {
    const result = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        enrollmentDate: enrollments.enrollmentDate,
        childFirstName: children.firstName,
        childLastName: children.lastName,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          gte(enrollments.enrollmentDate, startDate),
          lte(enrollments.enrollmentDate, endDate)
        )
      )
      .orderBy(desc(enrollments.enrollmentDate));

    return result;
  }

  /**
   * Get enrollments requiring attention (e.g., pending withdrawals)
   */
  static async getEnrollmentsRequiringAttention(schoolId: number) {
    // Example: withdrawals with future dates, incomplete profiles, etc.
    const result = await db
      .select({
        id: enrollments.id,
        status: enrollments.status,
        enrollmentDate: enrollments.enrollmentDate,
        withdrawalDate: enrollments.withdrawalDate,
        notes: enrollments.notes,
        childFirstName: children.firstName,
        childLastName: children.lastName,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          or(
            // Future withdrawal dates
            and(
              eq(enrollments.status, ENROLLMENT_STATUS.WITHDRAWN),
              gte(enrollments.withdrawalDate, new Date())
            ),
            // Long inactive periods
            and(
              eq(enrollments.status, ENROLLMENT_STATUS.INACTIVE),
              lte(enrollments.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
            )
          )
        )
      )
      .orderBy(desc(enrollments.updatedAt));

    return result;
  }

  /**
   * Get enrollment statistics for reporting
   */
  static async getEnrollmentStatistics(schoolId: number) {
    const [statusCounts, monthlyTrends] = await Promise.all([
      // Status distribution
      db
        .select({
          status: enrollments.status,
          count: count(enrollments.id),
        })
        .from(enrollments)
        .where(eq(enrollments.schoolId, schoolId))
        .groupBy(enrollments.status),

      // Monthly enrollment trends (last 12 months)
      db
        .select({
          month: sql<string>`TO_CHAR(${enrollments.enrollmentDate}, 'YYYY-MM')`,
          count: count(enrollments.id),
        })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.schoolId, schoolId),
            gte(enrollments.enrollmentDate, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // Last year
          )
        )
        .groupBy(sql`TO_CHAR(${enrollments.enrollmentDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${enrollments.enrollmentDate}, 'YYYY-MM')`),
    ]);

    return {
      statusCounts: statusCounts.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>),
      monthlyTrends: monthlyTrends.map(row => ({
        month: row.month,
        enrollments: row.count,
      })),
    };
  }

  /**
   * Bulk operations - update multiple enrollments
   */
  static async bulkUpdateStatus(
    enrollmentIds: string[],
    newStatus: string,
    schoolId: number,
    adminUserId: number
  ) {
    return await db
      .update(enrollments)
      .set({
        status: newStatus as any,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          sql`${enrollments.id} = ANY(${enrollmentIds})`,
          eq(enrollments.schoolId, schoolId)
        )
      );
  }

  /**
   * Archive old withdrawn enrollments
   */
  static async archiveOldWithdrawals(
    schoolId: number,
    daysOld: number = 365
  ) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    return await db
      .update(enrollments)
      .set({
        status: ENROLLMENT_STATUS.ARCHIVED,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          eq(enrollments.status, ENROLLMENT_STATUS.WITHDRAWN),
          lte(enrollments.withdrawalDate, cutoffDate)
        )
      );
  }
}