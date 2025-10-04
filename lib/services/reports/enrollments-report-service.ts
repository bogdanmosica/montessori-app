import { db } from '@/lib/db';
import { enrollments, children, users, schools, parentChildRelationships, parentProfiles } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray, desc, isNull } from 'drizzle-orm';
import { EnrollmentReportRow, ReportMetadata } from '@/lib/types/report-types';
import { REPORT_LIMITS } from '@/lib/constants/report-constants';

// Use the actual database enum values for enrollment management
type EnrollmentManagementStatus = 'active' | 'inactive' | 'withdrawn' | 'archived';

interface EnrollmentsReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: EnrollmentManagementStatus[];
}

export class EnrollmentsReportService {
  static async generateReport(
    tenantId: string,
    requestedBy: string,
    filters: EnrollmentsReportFilters
  ): Promise<{ data: EnrollmentReportRow[]; metadata: ReportMetadata }> {
    const startTime = Date.now();

    // Build query conditions
    const conditions = [
      eq(enrollments.schoolId, parseInt(tenantId))
    ];

    // Add date range filter
    if (filters.dateRange) {
      conditions.push(gte(enrollments.enrollmentDate, filters.dateRange.startDate));
      conditions.push(lte(enrollments.enrollmentDate, filters.dateRange.endDate));
    }

    // Add status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(enrollments.status, filters.status));
    }

    // Execute complex query with multiple joins
    const results = await db
      .select({
        enrollmentId: enrollments.id,
        enrollmentDate: enrollments.enrollmentDate,
        enrollmentStatus: enrollments.status,
        withdrawalDate: enrollments.withdrawalDate,
        childId: children.id,
        childFirstName: children.firstName,
        childLastName: children.lastName,
        childDateOfBirth: children.dateOfBirth,
        monthlyFee: children.monthlyFee,
        startDate: children.startDate,
        // We'll get parent data from the first parent relationship
        parentFirstName: parentProfiles.firstName,
        parentLastName: parentProfiles.lastName,
        parentEmail: parentProfiles.email,
        parentPhone: parentProfiles.phone,
        parentAddress: parentProfiles.address
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(parentChildRelationships, eq(children.id, parentChildRelationships.childId))
      .leftJoin(parentProfiles, eq(parentChildRelationships.parentId, parentProfiles.id))
      .where(and(...conditions))
      .orderBy(desc(enrollments.enrollmentDate))
      .limit(REPORT_LIMITS.MAX_RECORDS);

    // Group by enrollment to handle multiple parent relationships
    const enrollmentMap = new Map<string, EnrollmentReportRow>();

    results.forEach(row => {
      if (!enrollmentMap.has(row.enrollmentId)) {
        enrollmentMap.set(row.enrollmentId, {
          enrollmentId: row.enrollmentId,
          childName: `${row.childFirstName} ${row.childLastName}`,
          childDateOfBirth: row.childDateOfBirth,
          parentName: row.parentFirstName && row.parentLastName ? `${row.parentFirstName} ${row.parentLastName}` : 'Unknown',
          parentEmail: row.parentEmail || '',
          parentPhone: row.parentPhone || '',
          parentAddress: row.parentAddress || '',
          enrollmentDate: row.enrollmentDate,
          enrollmentStatus: row.enrollmentStatus,
          programType: 'Standard Program', // TODO: Add program type to schema
          monthlyFee: row.monthlyFee / 100, // Convert from cents to dollars
          startDate: row.startDate,
          endDate: row.withdrawalDate || undefined
        });
      }
    });

    const reportData = Array.from(enrollmentMap.values());

    // Build metadata
    const metadata: ReportMetadata = {
      totalRows: reportData.length,
      generatedAt: new Date(),
      filters,
      tenantId,
      requestedBy
    };

    const endTime = Date.now();
    console.log(`Enrollments report generated in ${endTime - startTime}ms`);

    return { data: reportData, metadata };
  }

  static async validateFilters(filters: EnrollmentsReportFilters): Promise<string[]> {
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

    // Validate status values
    if (filters.status) {
      const validStatuses: EnrollmentManagementStatus[] = ['active', 'inactive', 'withdrawn', 'archived'];
      const invalidStatuses = filters.status.filter(status => !validStatuses.includes(status));

      if (invalidStatuses.length > 0) {
        errors.push(`Invalid status values: ${invalidStatuses.join(', ')}`);
      }
    }

    return errors;
  }

  static async getEnrollmentStats(tenantId: string): Promise<{
    totalActive: number;
    totalInactive: number;
    totalWithdrawn: number;
    monthlyRevenue: number;
  }> {
    // Get enrollment statistics for the school
    const activeEnrollments = await db
      .select({
        count: children.monthlyFee
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(and(
        eq(enrollments.schoolId, parseInt(tenantId)),
        eq(enrollments.status, 'active')
      ));

    const totalActive = activeEnrollments.length;
    const monthlyRevenue = activeEnrollments.reduce((sum, row) => sum + (row.count / 100), 0);

    // TODO: Get actual counts for other statuses
    return {
      totalActive,
      totalInactive: 0,
      totalWithdrawn: 0,
      monthlyRevenue
    };
  }
}