import { db } from '@/lib/db';
import { enrollments, children, users } from '@/lib/db/schema';
import { Enrollment, NewEnrollment } from '@/lib/db/schema/enrollments';
import { eq, and, or, ilike, desc, asc, count, sql } from 'drizzle-orm';
import type {
  EnrollmentWithChild,
  GetEnrollmentsQuery,
  GetEnrollmentsResponse,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest
} from '@/app/admin/enrollments/types';
import { ENROLLMENT_STATUS, ENROLLMENT_PAGINATION } from '@/app/admin/enrollments/constants';
import { ronToCents, centsToRon, formatFeeDisplay, isValidFeeAmount } from '@/lib/constants/currency';
import type { CreateEnrollmentWithFeeRequest, UpdateEnrollmentFeeRequest } from '@/lib/validations/fee-validation';

export class EnrollmentService {
  /**
   * Get paginated list of enrollments with child details
   */
  static async getEnrollments(
    schoolId: number,
    query: GetEnrollmentsQuery = {}
  ): Promise<GetEnrollmentsResponse> {
    const {
      status,
      search,
      page = ENROLLMENT_PAGINATION.DEFAULT_PAGE,
      limit = ENROLLMENT_PAGINATION.DEFAULT_LIMIT,
      sortBy = 'enrollment_date',
      sortOrder = 'desc'
    } = query;

    // Build where conditions
    const whereConditions = [eq(enrollments.schoolId, schoolId)];

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        whereConditions.push(sql`${enrollments.status} = ANY(${status})`);
      } else {
        whereConditions.push(eq(enrollments.status, status));
      }
    }

    // Search filter (child name or parent name)
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      whereConditions.push(
        or(
          ilike(children.firstName, searchPattern),
          ilike(children.lastName, searchPattern),
          sql`LOWER(CONCAT(${children.firstName}, ' ', ${children.lastName})) LIKE ${searchPattern}`
        )!
      );
    }

    // Build sort order
    const orderBy = [];
    if (sortBy === 'child_name') {
      orderBy.push(
        sortOrder === 'asc'
          ? asc(sql`CONCAT(${children.firstName}, ' ', ${children.lastName})`)
          : desc(sql`CONCAT(${children.firstName}, ' ', ${children.lastName})`)
      );
    } else if (sortBy === 'enrollment_date') {
      orderBy.push(sortOrder === 'asc' ? asc(enrollments.enrollmentDate) : desc(enrollments.enrollmentDate));
    } else if (sortBy === 'created_at') {
      orderBy.push(sortOrder === 'asc' ? asc(enrollments.createdAt) : desc(enrollments.createdAt));
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(and(...whereConditions));

    const total = totalResult?.count || 0;

    // Get paginated data
    const enrollmentData = await db
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
        child: {
          id: children.id,
          firstName: children.firstName,
          lastName: children.lastName,
          dateOfBirth: children.dateOfBirth,
          // For parent info, we'll use the existing child schema fields
          // In a more complex setup, we'd join with parent_profiles
          parentName: sql<string>`CONCAT(${children.firstName}, ' Parent')`, // Placeholder
          parentEmail: sql<string | null>`NULL`, // Placeholder
          parentPhone: sql<string | null>`NULL`, // Placeholder
        }
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(and(...whereConditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // Transform to EnrollmentWithChild format
    const data: EnrollmentWithChild[] = enrollmentData.map(row => ({
      id: row.id,
      status: row.status as any,
      enrollmentDate: row.enrollmentDate.toISOString(),
      withdrawalDate: row.withdrawalDate?.toISOString(),
      notes: row.notes || undefined,
      child: {
        id: row.child.id,
        firstName: row.child.firstName,
        lastName: row.child.lastName,
        dateOfBirth: row.child.dateOfBirth.toISOString(),
        parentName: row.child.parentName,
        parentEmail: row.child.parentEmail || undefined,
        parentPhone: row.child.parentPhone || undefined,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy.toString(),
      updatedBy: row.updatedBy.toString(),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Get single enrollment by ID with child details
   */
  static async getEnrollmentById(
    enrollmentId: string,
    schoolId: number
  ): Promise<EnrollmentWithChild | null> {
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
        child: {
          id: children.id,
          firstName: children.firstName,
          lastName: children.lastName,
          dateOfBirth: children.dateOfBirth,
          parentName: sql<string>`'Parent'`, // Placeholder
          parentEmail: sql<string | null>`NULL`,
          parentPhone: sql<string | null>`NULL`,
        }
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
        id: row.child.id,
        firstName: row.child.firstName,
        lastName: row.child.lastName,
        dateOfBirth: row.child.dateOfBirth.toISOString(),
        parentName: row.child.parentName,
        parentEmail: row.child.parentEmail || undefined,
        parentPhone: row.child.parentPhone || undefined,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy.toString(),
      updatedBy: row.updatedBy.toString(),
    };
  }

  /**
   * Create new enrollment (with existing child)
   */
  static async createEnrollment(
    request: CreateEnrollmentRequest,
    schoolId: number,
    adminUserId: number
  ): Promise<EnrollmentWithChild> {
    const { enrollment: enrollmentData, child: childData } = request;

    if (!childData.existingChildId) {
      throw new Error('Child ID is required for enrollment creation');
    }

    // Check if child exists and belongs to this school
    const existingChild = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.id, childData.existingChildId),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!existingChild.length) {
      throw new Error('Child not found or does not belong to this school');
    }

    // Check for existing active enrollment
    const activeEnrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.childId, childData.existingChildId),
          eq(enrollments.schoolId, schoolId),
          eq(enrollments.status, ENROLLMENT_STATUS.ACTIVE)
        )
      )
      .limit(1);

    if (activeEnrollment.length > 0) {
      throw new Error('Child already has an active enrollment');
    }

    // Create enrollment
    const newEnrollment: NewEnrollment = {
      childId: childData.existingChildId,
      schoolId,
      status: ENROLLMENT_STATUS.ACTIVE,
      enrollmentDate: new Date(enrollmentData.enrollmentDate),
      notes: enrollmentData.notes,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };

    const [createdEnrollment] = await db
      .insert(enrollments)
      .values(newEnrollment)
      .returning();

    // Return the enrollment with child details
    const result = await EnrollmentService.getEnrollmentById(
      createdEnrollment.id,
      schoolId
    );

    if (!result) {
      throw new Error('Failed to retrieve created enrollment');
    }

    return result;
  }

  /**
   * Update existing enrollment
   */
  static async updateEnrollment(
    enrollmentId: string,
    request: UpdateEnrollmentRequest,
    schoolId: number,
    adminUserId: number
  ): Promise<EnrollmentWithChild> {
    const { enrollment: enrollmentData } = request;

    // Check if enrollment exists and belongs to this school
    const existingEnrollment = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!existingEnrollment.length) {
      throw new Error('Enrollment not found');
    }

    // Validate status transitions
    const current = existingEnrollment[0];
    if (enrollmentData.status && current.status === ENROLLMENT_STATUS.ARCHIVED) {
      throw new Error('Cannot modify archived enrollments');
    }

    // Build update data
    const updateData: Partial<NewEnrollment> = {
      updatedBy: adminUserId,
    };

    if (enrollmentData.status) updateData.status = enrollmentData.status;
    if (enrollmentData.enrollmentDate) updateData.enrollmentDate = new Date(enrollmentData.enrollmentDate);
    if (enrollmentData.withdrawalDate) updateData.withdrawalDate = new Date(enrollmentData.withdrawalDate);
    if (enrollmentData.notes !== undefined) updateData.notes = enrollmentData.notes;

    // Update enrollment
    await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, enrollmentId));

    // Return updated enrollment
    const result = await EnrollmentService.getEnrollmentById(enrollmentId, schoolId);
    if (!result) {
      throw new Error('Failed to retrieve updated enrollment');
    }

    return result;
  }

  /**
   * Withdraw enrollment (soft delete)
   */
  static async withdrawEnrollment(
    enrollmentId: string,
    schoolId: number,
    adminUserId: number,
    withdrawalDate?: string,
    notes?: string
  ): Promise<EnrollmentWithChild> {
    const withdrawal = withdrawalDate ? new Date(withdrawalDate) : new Date();

    await db
      .update(enrollments)
      .set({
        status: ENROLLMENT_STATUS.WITHDRAWN,
        withdrawalDate: withdrawal,
        notes: notes || null,
        updatedBy: adminUserId,
      })
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      );

    // Return updated enrollment
    const result = await EnrollmentService.getEnrollmentById(enrollmentId, schoolId);
    if (!result) {
      throw new Error('Failed to retrieve withdrawn enrollment');
    }

    return result;
  }

  /**
   * Check if child has active enrollment
   */
  static async hasActiveEnrollment(
    childId: string,
    schoolId: number
  ): Promise<boolean> {
    const result = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.childId, childId),
          eq(enrollments.schoolId, schoolId),
          eq(enrollments.status, ENROLLMENT_STATUS.ACTIVE)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Create enrollment with fee override support
   */
  static async createEnrollmentWithFee(
    request: CreateEnrollmentWithFeeRequest,
    schoolId: number,
    adminUserId: number
  ): Promise<Enrollment> {
    const { childId, enrollmentDate, monthlyFeeOverride, notes } = request;

    // Verify child exists and belongs to this school
    const child = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!child.length) {
      throw new Error('Child not found or does not belong to this school');
    }

    // Check for existing active enrollment
    const hasActive = await EnrollmentService.hasActiveEnrollment(childId, schoolId);
    if (hasActive) {
      throw new Error('Child already has an active enrollment');
    }

    // Convert fee override from RON to cents if provided
    let feeOverrideCents: number | null = null;
    if (monthlyFeeOverride !== undefined && monthlyFeeOverride !== null) {
      feeOverrideCents = ronToCents(monthlyFeeOverride);
      if (!isValidFeeAmount(feeOverrideCents)) {
        throw new Error('Invalid fee override amount');
      }
    }

    const newEnrollment: NewEnrollment = {
      childId,
      schoolId,
      status: ENROLLMENT_STATUS.ACTIVE,
      enrollmentDate: new Date(enrollmentDate),
      monthlyFeeOverride: feeOverrideCents,
      notes: notes || null,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    };

    const [createdEnrollment] = await db
      .insert(enrollments)
      .values(newEnrollment)
      .returning();

    return createdEnrollment;
  }

  /**
   * Update enrollment fee override
   */
  static async updateEnrollmentFee(
    enrollmentId: string,
    feeData: UpdateEnrollmentFeeRequest,
    schoolId: number,
    adminUserId: number
  ): Promise<Enrollment> {
    // Verify enrollment exists and belongs to this school
    const existing = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!existing.length) {
      throw new Error('Enrollment not found');
    }

    // Convert fee override from RON to cents if provided
    let feeOverrideCents: number | null = null;
    if (feeData.monthlyFeeOverride !== undefined) {
      if (feeData.monthlyFeeOverride !== null) {
        feeOverrideCents = ronToCents(feeData.monthlyFeeOverride);
        if (!isValidFeeAmount(feeOverrideCents)) {
          throw new Error('Invalid fee override amount');
        }
      }
      // If monthlyFeeOverride is explicitly null, we keep it as null
    }

    await db
      .update(enrollments)
      .set({
        monthlyFeeOverride: feeOverrideCents,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId));

    // Return updated enrollment
    const [updated] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);

    if (!updated) {
      throw new Error('Failed to retrieve updated enrollment');
    }

    return updated;
  }

  /**
   * Get enrollment with effective fee (resolved from child default or override)
   */
  static async getEnrollmentWithEffectiveFee(
    enrollmentId: string,
    schoolId: number
  ): Promise<{ 
    enrollment: Enrollment; 
    child: { id: string; firstName: string; lastName: string; monthlyFee: number }; 
    effectiveFee: number; 
    effectiveFeeDisplay: string;
    feeSource: 'child_default' | 'enrollment_override';
  } | null> {
    const result = await db
      .select({
        enrollment: enrollments,
        child: {
          id: children.id,
          firstName: children.firstName,
          lastName: children.lastName,
          monthlyFee: children.monthlyFee,
        }
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

    if (!result.length) {
      return null;
    }

    const { enrollment, child } = result[0];

    // Resolve effective fee
    const effectiveFee = enrollment.monthlyFeeOverride !== null 
      ? enrollment.monthlyFeeOverride 
      : child.monthlyFee;

    const feeSource = enrollment.monthlyFeeOverride !== null 
      ? 'enrollment_override' as const
      : 'child_default' as const;

    return {
      enrollment,
      child,
      effectiveFee,
      effectiveFeeDisplay: formatFeeDisplay(effectiveFee),
      feeSource,
    };
  }

  /**
   * Get all enrollments for a child with effective fees
   */
  static async getChildEnrollmentsWithFees(
    childId: string,
    schoolId: number
  ): Promise<Array<{
    enrollment: Enrollment;
    effectiveFee: number;
    effectiveFeeDisplay: string;
    feeSource: 'child_default' | 'enrollment_override';
  }>> {
    const result = await db
      .select({
        enrollment: enrollments,
        childFee: children.monthlyFee,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.childId, childId),
          eq(enrollments.schoolId, schoolId)
        )
      )
      .orderBy(desc(enrollments.enrollmentDate));

    return result.map(({ enrollment, childFee }) => {
      const effectiveFee = enrollment.monthlyFeeOverride !== null 
        ? enrollment.monthlyFeeOverride 
        : childFee;

      const feeSource = enrollment.monthlyFeeOverride !== null 
        ? 'enrollment_override' as const
        : 'child_default' as const;

      return {
        enrollment,
        effectiveFee,
        effectiveFeeDisplay: formatFeeDisplay(effectiveFee),
        feeSource,
      };
    });
  }

  /**
   * Remove fee override (revert to child default)
   */
  static async removeEnrollmentFeeOverride(
    enrollmentId: string,
    schoolId: number,
    adminUserId: number
  ): Promise<Enrollment> {
    await db
      .update(enrollments)
      .set({
        monthlyFeeOverride: null,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      );

    const [updated] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);

    if (!updated) {
      throw new Error('Failed to retrieve updated enrollment');
    }

    return updated;
  }
}