import { db } from '../db/drizzle';
import { applications, children, parentProfiles, parentChildRelationships } from '../db/schema';
import { eq, and, or, ilike, desc } from 'drizzle-orm';

export interface CombinedListItem {
  id: string;
  type: 'application' | 'enrolled';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  start_date: string; // preferred_start_date for applications, start_date for children
  parent1_first_name: string;
  parent1_last_name: string;
  parent1_email: string;
  submitted_at: string; // submitted_at for applications, created_at for children
  processed_at: string | null;
}

export interface CombinedListParams {
  schoolId: number;
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
  search?: string;
  type?: 'application' | 'enrolled';
}

export interface CombinedListResult {
  items: CombinedListItem[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Get combined list of applications and enrolled children
 */
export async function getCombinedApplicationsAndChildren(params: CombinedListParams): Promise<CombinedListResult> {
  const {
    schoolId,
    page = 1,
    limit = 20,
    status,
    search,
    type,
  } = params;

  // Validate pagination parameters
  if (page < 1) throw new Error('Page must be >= 1');
  if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

  const offset = (page - 1) * limit;
  let allItems: CombinedListItem[] = [];

  // Get applications - only if filtering by application statuses or no status filter
  if ((!type || type === 'application') && (!status || ['PENDING', 'REJECTED'].includes(status))) {
    let whereConditions = eq(applications.schoolId, schoolId);

    // Only show PENDING and REJECTED applications (hide APPROVED since they become enrolled children)
    if (status && ['PENDING', 'REJECTED'].includes(status)) {
      whereConditions = and(whereConditions, eq(applications.status, status as 'PENDING' | 'REJECTED'))!;
    } else {
      // If no status filter, only show PENDING and REJECTED applications
      // APPROVED applications are shown as enrolled children instead
      const statusCondition = or(
        eq(applications.status, 'PENDING'),
        eq(applications.status, 'REJECTED')
      );
      whereConditions = and(whereConditions, statusCondition)!;
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(applications.childFirstName, searchPattern),
        ilike(applications.childLastName, searchPattern),
        ilike(applications.parent1FirstName, searchPattern),
        ilike(applications.parent1LastName, searchPattern),
        ilike(applications.parent2FirstName, searchPattern),
        ilike(applications.parent2LastName, searchPattern)
      );
      whereConditions = and(whereConditions, searchCondition)!;
    }

    const applicationResults = await db
      .select({
        id: applications.id,
        status: applications.status,
        child_first_name: applications.childFirstName,
        child_last_name: applications.childLastName,
        child_date_of_birth: applications.childDateOfBirth,
        start_date: applications.preferredStartDate,
        parent1_first_name: applications.parent1FirstName,
        parent1_last_name: applications.parent1LastName,
        parent1_email: applications.parent1Email,
        submitted_at: applications.submittedAt,
        processed_at: applications.processedAt,
      })
      .from(applications)
      .where(whereConditions)
      .orderBy(desc(applications.submittedAt));

    const applicationItems: CombinedListItem[] = applicationResults.map(app => ({
      id: app.id,
      type: 'application' as const,
      status: app.status,
      child_first_name: app.child_first_name,
      child_last_name: app.child_last_name,
      child_date_of_birth: app.child_date_of_birth.toISOString().split('T')[0],
      start_date: app.start_date.toISOString().split('T')[0],
      parent1_first_name: app.parent1_first_name,
      parent1_last_name: app.parent1_last_name,
      parent1_email: app.parent1_email,
      submitted_at: app.submitted_at.toISOString(),
      processed_at: app.processed_at?.toISOString() || null,
    }));

    allItems.push(...applicationItems);
  }

  // Get enrolled children - only if filtering by enrolled child statuses or no status filter
  if ((!type || type === 'enrolled') && (!status || ['ACTIVE', 'INACTIVE', 'WAITLISTED'].includes(status))) {
    let whereConditions = eq(children.schoolId, schoolId);

    if (status && ['ACTIVE', 'INACTIVE', 'WAITLISTED'].includes(status)) {
      whereConditions = and(whereConditions, eq(children.enrollmentStatus, status as 'ACTIVE' | 'INACTIVE' | 'WAITLISTED'))!;
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(
        ilike(children.firstName, searchPattern),
        ilike(children.lastName, searchPattern)
      );
      whereConditions = and(whereConditions, searchCondition)!;
    }

    // Get children with their parent information
    const childrenResults = await db
      .select({
        id: children.id,
        enrollment_status: children.enrollmentStatus,
        first_name: children.firstName,
        last_name: children.lastName,
        date_of_birth: children.dateOfBirth,
        start_date: children.startDate,
        created_at: children.createdAt,
        // Get primary parent info
        parent_first_name: parentProfiles.firstName,
        parent_last_name: parentProfiles.lastName,
        parent_email: parentProfiles.email,
      })
      .from(children)
      .leftJoin(
        parentChildRelationships,
        and(
          eq(parentChildRelationships.childId, children.id),
          eq(parentChildRelationships.primaryContact, true)
        )
      )
      .leftJoin(parentProfiles, eq(parentProfiles.id, parentChildRelationships.parentId))
      .where(whereConditions)
      .orderBy(desc(children.createdAt));

    const childrenItems: CombinedListItem[] = childrenResults.map(child => ({
      id: child.id,
      type: 'enrolled' as const,
      status: child.enrollment_status,
      child_first_name: child.first_name,
      child_last_name: child.last_name,
      child_date_of_birth: child.date_of_birth.toISOString().split('T')[0],
      start_date: child.start_date.toISOString().split('T')[0],
      parent1_first_name: child.parent_first_name || 'Unknown',
      parent1_last_name: child.parent_last_name || 'Parent',
      parent1_email: child.parent_email || 'N/A',
      submitted_at: child.created_at.toISOString(),
      processed_at: null, // Children don't have a processed_at date
    }));

    allItems.push(...childrenItems);
  }

  // Sort all items by date (most recent first)
  allItems.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  // Apply pagination
  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedItems = allItems.slice(offset, offset + limit);

  const pagination = {
    page,
    limit,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };

  return {
    items: paginatedItems,
    pagination,
  };
}