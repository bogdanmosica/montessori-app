import { and, eq, ilike, or, desc, asc, count, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { applicationsNew, teams, users } from '../schema';
import {
  ApplicationWithRelations,
  ApplicationFilters,
  ApplicationPagination,
  ApplicationListResponse
} from '../schema/applications';
import {
  PAGINATION,
  SORT_OPTIONS,
  SORT_ORDERS,
  ApplicationStatus
} from '../../../app/admin/applications/constants';

/**
 * Get paginated list of applications with filtering and search
 * Optimized for performance with proper indexing
 */
export async function getApplicationsList(
  schoolId: number,
  filters: ApplicationFilters = {},
  pagination: ApplicationPagination
): Promise<ApplicationListResponse> {
  const { page, limit, offset } = pagination;
  const { status, search, programRequested, sortBy = SORT_OPTIONS.CREATED_AT, sortOrder = SORT_ORDERS.DESC } = filters;

  // Build where conditions
  const whereConditions = [eq(applicationsNew.schoolId, schoolId)];

  // Status filter
  if (status) {
    whereConditions.push(eq(applicationsNew.status, status));
  }

  // Search filter (parent name, child name, or parent email)
  if (search) {
    const searchTerm = `%${search.toLowerCase()}%`;
    whereConditions.push(
      or(
        ilike(applicationsNew.parentName, searchTerm),
        ilike(applicationsNew.childName, searchTerm),
        ilike(applicationsNew.parentEmail, searchTerm)
      )!
    );
  }

  // Program filter
  if (programRequested) {
    whereConditions.push(eq(applicationsNew.programRequested, programRequested));
  }

  // Sort column determination
  let sortColumn;
  switch (sortBy) {
    case SORT_OPTIONS.PARENT_NAME:
      sortColumn = applicationsNew.parentName;
      break;
    case SORT_OPTIONS.CHILD_NAME:
      sortColumn = applicationsNew.childName;
      break;
    default:
      sortColumn = applicationsNew.createdAt;
  }

  const whereClause = and(...whereConditions);

  // Execute queries in parallel for performance
  const [applicationsResult, countResult] = await Promise.all([
    // Get applications with relations
    db
      .select({
        id: applicationsNew.id,
        schoolId: applicationsNew.schoolId,
        parentName: applicationsNew.parentName,
        parentEmail: applicationsNew.parentEmail,
        parentPhone: applicationsNew.parentPhone,
        childName: applicationsNew.childName,
        childDateOfBirth: applicationsNew.childDateOfBirth,
        childGender: applicationsNew.childGender,
        programRequested: applicationsNew.programRequested,
        preferredStartDate: applicationsNew.preferredStartDate,
        status: applicationsNew.status,
        notes: applicationsNew.notes,
        approvedAt: applicationsNew.approvedAt,
        approvedBy: applicationsNew.approvedBy,
        rejectedAt: applicationsNew.rejectedAt,
        rejectedBy: applicationsNew.rejectedBy,
        rejectionReason: applicationsNew.rejectionReason,
        createdAt: applicationsNew.createdAt,
        updatedAt: applicationsNew.updatedAt,
        // School relation
        schoolName: teams.name,
      })
      .from(applicationsNew)
      .leftJoin(teams, eq(applicationsNew.schoolId, teams.id))
      .where(whereClause)
      .orderBy(sortOrder === SORT_ORDERS.ASC ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset),

    // Get total count for pagination
    db
      .select({ count: count() })
      .from(applicationsNew)
      .where(whereClause)
      .then(result => result[0]?.count || 0)
  ]);

  // Transform results to include relations
  const applications: ApplicationWithRelations[] = applicationsResult.map(row => ({
    id: row.id,
    schoolId: row.schoolId,
    parentName: row.parentName,
    parentEmail: row.parentEmail,
    parentPhone: row.parentPhone,
    childName: row.childName,
    childDateOfBirth: row.childDateOfBirth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    childGender: row.childGender as 'male' | 'female' | 'other' | null,
    programRequested: row.programRequested,
    preferredStartDate: row.preferredStartDate ? row.preferredStartDate.toISOString().split('T')[0] : null,
    status: row.status as 'pending' | 'approved' | 'rejected',
    notes: row.notes,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
    rejectedAt: row.rejectedAt,
    rejectedBy: row.rejectedBy,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    school: row.schoolName ? {
      id: row.schoolId,
      name: row.schoolName,
    } : undefined,
  }));

  // Calculate pagination metadata
  const totalItems = countResult;
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    applications,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage,
      hasPrevPage,
    },
    filters,
  };
}

/**
 * Get applications statistics for dashboard
 */
export async function getApplicationsStats(schoolId: number): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  const [results] = await db
    .select({
      status: applicationsNew.status,
      count: count(),
    })
    .from(applicationsNew)
    .where(eq(applicationsNew.schoolId, schoolId))
    .groupBy(applicationsNew.status);

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };

  // Get individual counts
  const statusResults = await db
    .select({
      status: applicationsNew.status,
      count: count(),
    })
    .from(applicationsNew)
    .where(eq(applicationsNew.schoolId, schoolId))
    .groupBy(applicationsNew.status);

  statusResults.forEach(result => {
    const statusCount = Number(result.count);
    stats.total += statusCount;
    
    if (result.status === 'pending') stats.pending = statusCount;
    else if (result.status === 'approved') stats.approved = statusCount;
    else if (result.status === 'rejected') stats.rejected = statusCount;
  });

  return stats;
}

/**
 * Get a single application by ID with relations
 */
export async function getApplicationById(
  applicationId: string,
  schoolId: number
): Promise<ApplicationWithRelations | null> {
  const [result] = await db
    .select({
      id: applicationsNew.id,
      schoolId: applicationsNew.schoolId,
      parentName: applicationsNew.parentName,
      parentEmail: applicationsNew.parentEmail,
      parentPhone: applicationsNew.parentPhone,
      childName: applicationsNew.childName,
      childDateOfBirth: applicationsNew.childDateOfBirth,
      childGender: applicationsNew.childGender,
      programRequested: applicationsNew.programRequested,
      preferredStartDate: applicationsNew.preferredStartDate,
      status: applicationsNew.status,
      notes: applicationsNew.notes,
      approvedAt: applicationsNew.approvedAt,
      approvedBy: applicationsNew.approvedBy,
      rejectedAt: applicationsNew.rejectedAt,
      rejectedBy: applicationsNew.rejectedBy,
      rejectionReason: applicationsNew.rejectionReason,
      createdAt: applicationsNew.createdAt,
      updatedAt: applicationsNew.updatedAt,
      schoolName: teams.name,
    })
    .from(applicationsNew)
    .leftJoin(teams, eq(applicationsNew.schoolId, teams.id))
    .where(and(
      eq(applicationsNew.id, applicationId),
      eq(applicationsNew.schoolId, schoolId)
    ));

  if (!result) return null;

  return {
    id: result.id,
    schoolId: result.schoolId,
    parentName: result.parentName,
    parentEmail: result.parentEmail,
    parentPhone: result.parentPhone,
    childName: result.childName,
    childDateOfBirth: result.childDateOfBirth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    childGender: result.childGender as 'male' | 'female' | 'other' | null,
    programRequested: result.programRequested,
    preferredStartDate: result.preferredStartDate ? result.preferredStartDate.toISOString().split('T')[0] : null,
    status: result.status as 'pending' | 'approved' | 'rejected',
    notes: result.notes,
    approvedAt: result.approvedAt,
    approvedBy: result.approvedBy,
    rejectedAt: result.rejectedAt,
    rejectedBy: result.rejectedBy,
    rejectionReason: result.rejectionReason,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    school: result.schoolName ? {
      id: result.schoolId,
      name: result.schoolName,
    } : undefined,
  };
}

/**
 * Get recent applications for dashboard widgets
 */
export async function getRecentApplications(
  schoolId: number,
  limit: number = 5
): Promise<ApplicationWithRelations[]> {
  const results = await db
    .select({
      id: applicationsNew.id,
      schoolId: applicationsNew.schoolId,
      parentName: applicationsNew.parentName,
      parentEmail: applicationsNew.parentEmail,
      parentPhone: applicationsNew.parentPhone,
      childName: applicationsNew.childName,
      childDateOfBirth: applicationsNew.childDateOfBirth,
      childGender: applicationsNew.childGender,
      programRequested: applicationsNew.programRequested,
      preferredStartDate: applicationsNew.preferredStartDate,
      status: applicationsNew.status,
      notes: applicationsNew.notes,
      approvedAt: applicationsNew.approvedAt,
      approvedBy: applicationsNew.approvedBy,
      rejectedAt: applicationsNew.rejectedAt,
      rejectedBy: applicationsNew.rejectedBy,
      rejectionReason: applicationsNew.rejectionReason,
      createdAt: applicationsNew.createdAt,
      updatedAt: applicationsNew.updatedAt,
      schoolName: teams.name,
    })
    .from(applicationsNew)
    .leftJoin(teams, eq(applicationsNew.schoolId, teams.id))
    .where(eq(applicationsNew.schoolId, schoolId))
    .orderBy(desc(applicationsNew.createdAt))
    .limit(limit);

  return results.map(row => ({
    id: row.id,
    schoolId: row.schoolId,
    parentName: row.parentName,
    parentEmail: row.parentEmail,
    parentPhone: row.parentPhone,
    childName: row.childName,
    childDateOfBirth: row.childDateOfBirth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    childGender: row.childGender as 'male' | 'female' | 'other' | null,
    programRequested: row.programRequested,
    preferredStartDate: row.preferredStartDate ? row.preferredStartDate.toISOString().split('T')[0] : null,
    status: row.status as 'pending' | 'approved' | 'rejected',
    notes: row.notes,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
    rejectedAt: row.rejectedAt,
    rejectedBy: row.rejectedBy,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    school: row.schoolName ? {
      id: row.schoolId,
      name: row.schoolName,
    } : undefined,
  }));
}

/**
 * Helper functions for pagination and filtering
 */
export function buildPagination(
  pageParam: string | null,
  limitParam: string | null
): ApplicationPagination {
  const page = Math.max(1, parseInt(pageParam || '1', 10));
  const limit = Math.min(PAGINATION.MAX_PAGE_SIZE, Math.max(PAGINATION.MIN_PAGE_SIZE, parseInt(limitParam || '10', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildFilters(searchParams: URLSearchParams): ApplicationFilters {
  const filters: ApplicationFilters = {};

  const status = searchParams.get('status');
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status as 'pending' | 'approved' | 'rejected';
  }

  const search = searchParams.get('search');
  if (search) {
    filters.search = search.trim();
  }

  const programRequested = searchParams.get('programRequested');
  if (programRequested) {
    filters.programRequested = programRequested.trim();
  }

  const sortBy = searchParams.get('sortBy');
  if (sortBy && Object.values(SORT_OPTIONS).includes(sortBy as any)) {
    filters.sortBy = sortBy as any;
  }

  const sortOrder = searchParams.get('sortOrder');
  if (sortOrder && Object.values(SORT_ORDERS).includes(sortOrder as any)) {
    filters.sortOrder = sortOrder as any;
  }

  return filters;
}

/**
 * Validate application for processing (approval/rejection)
 */
export async function validateApplicationForProcessing(
  applicationId: string,
  schoolId: number
): Promise<{ valid: boolean; error?: string; application?: ApplicationWithRelations }> {
  try {
    const application = await getApplicationById(applicationId, schoolId);
    
    if (!application) {
      return {
        valid: false,
        error: 'Application not found or not accessible',
      };
    }

    if (application.status !== 'pending') {
      return {
        valid: false,
        error: 'Application has already been processed',
      };
    }

    return {
      valid: true,
      application,
    };
  } catch (error) {
    console.error('Error validating application for processing:', error);
    return {
      valid: false,
      error: 'Failed to validate application',
    };
  }
}

/**
 * Update application status (for approval/rejection workflow)
 */
export async function updateApplicationStatus(
  applicationId: string,
  schoolId: number,
  status: 'approved' | 'rejected',
  adminUserId: string,
  rejectionReason?: string,
  notes?: string
): Promise<ApplicationWithRelations | null> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      notes,
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = parseInt(adminUserId);
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = parseInt(adminUserId);
      updateData.rejectionReason = rejectionReason;
    }

    const [updatedApp] = await db
      .update(applicationsNew)
      .set(updateData)
      .where(and(
        eq(applicationsNew.id, applicationId),
        eq(applicationsNew.schoolId, schoolId)
      ))
      .returning();

    if (!updatedApp) {
      return null;
    }

    // Return the updated application with relations
    return await getApplicationById(applicationId, schoolId);
  } catch (error) {
    console.error('Error updating application status:', error);
    return null;
  }
}