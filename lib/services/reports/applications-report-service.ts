import { db } from '@/lib/db';
import { applications, users, teams } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray, asc, desc } from 'drizzle-orm';
import { ApplicationReportRow, ReportMetadata } from '@/lib/types/report-types';
import { ApplicationStatus } from '@/lib/constants/application-status';
import { REPORT_LIMITS } from '@/lib/constants/report-constants';

interface ApplicationsReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: ApplicationStatus[];
}

export class ApplicationsReportService {
  static async generateReport(
    tenantId: string,
    requestedBy: string,
    filters: ApplicationsReportFilters
  ): Promise<{ data: ApplicationReportRow[]; metadata: ReportMetadata }> {
    const startTime = Date.now();

    // Build query conditions
    const conditions = [
      eq(applications.schoolId, parseInt(tenantId))
    ];

    // Add date range filter
    if (filters.dateRange) {
      conditions.push(gte(applications.createdAt, filters.dateRange.startDate));
      conditions.push(lte(applications.createdAt, filters.dateRange.endDate));
    }

    // Add status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(applications.status, filters.status));
    }

    // Execute query with joins for related data
    const results = await db
      .select({
        id: applications.id,
        createdAt: applications.createdAt,
        submittedAt: applications.submittedAt,
        status: applications.status,
        childFirstName: applications.childFirstName,
        childLastName: applications.childLastName,
        childDateOfBirth: applications.childDateOfBirth,
        parent1FirstName: applications.parent1FirstName,
        parent1LastName: applications.parent1LastName,
        parent1Email: applications.parent1Email,
        parent1Phone: applications.parent1Phone,
        homeAddress: applications.homeAddress,
        processedByAdminId: applications.processedByAdminId,
        processedAt: applications.processedAt,
        adminNotes: applications.adminNotes,
        reviewerName: users.name
      })
      .from(applications)
      .leftJoin(users, eq(applications.processedByAdminId, users.id))
      .where(and(...conditions))
      .orderBy(desc(applications.createdAt))
      .limit(REPORT_LIMITS.MAX_RECORDS);

    // Transform to report format
    const reportData: ApplicationReportRow[] = results.map(row => ({
      applicationId: row.id,
      applicationDate: row.createdAt,
      childName: `${row.childFirstName} ${row.childLastName}`,
      childDateOfBirth: row.childDateOfBirth,
      parentName: `${row.parent1FirstName} ${row.parent1LastName}`,
      parentEmail: row.parent1Email,
      parentPhone: row.parent1Phone || '',
      parentAddress: row.homeAddress || '',
      applicationStatus: row.status,
      submissionDate: row.submittedAt || row.createdAt,
      reviewedBy: row.reviewerName || undefined,
      reviewedAt: row.processedAt || undefined,
      notes: row.adminNotes || undefined
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
    console.log(`Applications report generated in ${endTime - startTime}ms`);

    return { data: reportData, metadata };
  }

  static async validateFilters(filters: ApplicationsReportFilters): Promise<string[]> {
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
      const validStatuses = Object.values(ApplicationStatus);
      const invalidStatuses = filters.status.filter(status => !validStatuses.includes(status));

      if (invalidStatuses.length > 0) {
        errors.push(`Invalid status values: ${invalidStatuses.join(', ')}`);
      }
    }

    return errors;
  }

  static async getAvailableStatuses(): Promise<{ value: ApplicationStatus; label: string; count: number }[]> {
    // This would typically query the database to get counts by status
    // For now, return the enum values
    return Object.values(ApplicationStatus).map(status => ({
      value: status,
      label: status.replace('_', ' ').toUpperCase(),
      count: 0 // TODO: Implement actual count query
    }));
  }
}