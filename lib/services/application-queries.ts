import { db } from '../db/drizzle';
import { applications, schools, users } from '../db/schema';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import type { Application } from '../db/schema';

export interface ApplicationsListParams {
  schoolId: number;
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  search?: string;
}

export interface ApplicationListItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  preferred_start_date: string;
  parent1_first_name: string;
  parent1_last_name: string;
  parent1_email: string;
  submitted_at: string;
  processed_at: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApplicationsListResult {
  applications: ApplicationListItem[];
  pagination: PaginationMeta;
}

export interface ApplicationDetail extends ApplicationListItem {
  child_gender: string | null;
  special_needs: string | null;
  medical_conditions: string | null;
  parent1_phone: string | null;
  parent1_relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';
  parent2_first_name: string | null;
  parent2_last_name: string | null;
  parent2_email: string | null;
  parent2_phone: string | null;
  parent2_relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER' | null;
  processed_by_admin_id: string | null;
}

/**
 * Get applications list with filtering and pagination
 */
export async function getApplicationsList(params: ApplicationsListParams): Promise<ApplicationsListResult> {
  const {
    schoolId,
    page = 1,
    limit = 20,
    status,
    search,
  } = params;

  // Validate pagination parameters
  if (page < 1) throw new Error('Page must be >= 1');
  if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(applications.schoolId, schoolId);

  if (status) {
    whereConditions = and(whereConditions, eq(applications.status, status));
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
    whereConditions = and(whereConditions, searchCondition);
  }

  // Get total count for pagination
  const totalResult = await db
    .select({ count: applications.id })
    .from(applications)
    .where(whereConditions);

  const totalItems = totalResult.length;
  const totalPages = Math.ceil(totalItems / limit);

  // Get applications with pagination
  const results = await db
    .select({
      id: applications.id,
      status: applications.status,
      child_first_name: applications.childFirstName,
      child_last_name: applications.childLastName,
      child_date_of_birth: applications.childDateOfBirth,
      preferred_start_date: applications.preferredStartDate,
      parent1_first_name: applications.parent1FirstName,
      parent1_last_name: applications.parent1LastName,
      parent1_email: applications.parent1Email,
      submitted_at: applications.submittedAt,
      processed_at: applications.processedAt,
    })
    .from(applications)
    .where(whereConditions)
    .orderBy(desc(applications.submittedAt))
    .limit(limit)
    .offset(offset);

  // Transform dates to ISO strings
  const applicationsList: ApplicationListItem[] = results.map(app => ({
    ...app,
    child_date_of_birth: app.child_date_of_birth.toISOString().split('T')[0],
    preferred_start_date: app.preferred_start_date.toISOString().split('T')[0],
    submitted_at: app.submitted_at.toISOString(),
    processed_at: app.processed_at?.toISOString() || null,
  }));

  const pagination: PaginationMeta = {
    page,
    limit,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };

  return {
    applications: applicationsList,
    pagination,
  };
}

/**
 * Get application detail by ID
 */
export async function getApplicationDetail(applicationId: string, schoolId: number): Promise<ApplicationDetail | null> {
  const results = await db
    .select()
    .from(applications)
    .where(and(
      eq(applications.id, applicationId),
      eq(applications.schoolId, schoolId)
    ))
    .limit(1);

  const application = results[0];
  if (!application) return null;

  // Transform to API format
  return {
    id: application.id,
    status: application.status,
    child_first_name: application.childFirstName,
    child_last_name: application.childLastName,
    child_date_of_birth: application.childDateOfBirth.toISOString().split('T')[0],
    child_gender: application.childGender,
    preferred_start_date: application.preferredStartDate.toISOString().split('T')[0],
    special_needs: application.specialNeeds,
    medical_conditions: application.medicalConditions,
    parent1_first_name: application.parent1FirstName,
    parent1_last_name: application.parent1LastName,
    parent1_email: application.parent1Email,
    parent1_phone: application.parent1Phone,
    parent1_relationship: application.parent1Relationship,
    parent2_first_name: application.parent2FirstName,
    parent2_last_name: application.parent2LastName,
    parent2_email: application.parent2Email,
    parent2_phone: application.parent2Phone,
    parent2_relationship: application.parent2Relationship,
    submitted_at: application.submittedAt.toISOString(),
    processed_at: application.processedAt?.toISOString() || null,
    processed_by_admin_id: application.processedByAdminId?.toString() || null,
  };
}

/**
 * Check if application can be processed (not already approved/rejected)
 */
export async function canProcessApplication(applicationId: string, schoolId: number): Promise<boolean> {
  const results = await db
    .select({ status: applications.status })
    .from(applications)
    .where(and(
      eq(applications.id, applicationId),
      eq(applications.schoolId, schoolId)
    ))
    .limit(1);

  const application = results[0];
  return application ? application.status === 'PENDING' : false;
}