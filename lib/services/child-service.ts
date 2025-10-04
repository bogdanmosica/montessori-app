import { db } from '@/lib/db/drizzle';
import { children, users } from '@/lib/db/schema';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import type { Child, NewChild } from '@/lib/db/schema';
import type { CreateEnrollmentRequest } from '@/app/admin/enrollments/types';
import { ronToCents, centsToRon, formatFeeDisplay, isValidFeeAmount } from '@/lib/constants/currency';
import type { CreateChildRequest, UpdateChildRequest } from '@/lib/validations/child-validation';

export class ChildService {
  /**
   * Get child by ID (scoped to school)
   */
  static async getChildById(
    childId: string,
    schoolId: number
  ): Promise<Child | null> {
    const result = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Search children by name for enrollment linking
   */
  static async searchChildren(
    searchTerm: string,
    schoolId: number,
    limit: number = 10
  ): Promise<Child[]> {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;

    const result = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.schoolId, schoolId),
          eq(children.enrollmentStatus, 'ACTIVE'),
          or(
            ilike(children.firstName, searchPattern),
            ilike(children.lastName, searchPattern),
          )
        )
      )
      .orderBy(asc(children.firstName), asc(children.lastName))
      .limit(limit);

    return result;
  }

  /**
   * Get all children for a school (with pagination)
   */
  static async getChildren(
    schoolId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Child[]; total: number }> {
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.schoolId, schoolId),
          eq(children.enrollmentStatus, 'ACTIVE')
        )
      )
      .orderBy(asc(children.firstName), asc(children.lastName))
      .limit(limit)
      .offset(offset);

    // Get total count (simplified for now)
    const total = result.length; // In a real app, you'd do a separate count query

    return { data: result, total };
  }

  /**
   * Create new child from enrollment request
   */
  static async createChildFromEnrollment(
    childData: CreateEnrollmentRequest['child'],
    schoolId: number,
    adminUserId: number
  ): Promise<Child> {
    if (!childData.firstName || !childData.lastName || !childData.dateOfBirth || !childData.parentName) {
      throw new Error('Missing required child information');
    }

    // Get default monthly fee from schools table
    const { schools } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    let monthlyFee = 0;

    // Get school settings from schools table
    const school = await db
      .select({
        baseFeePerChild: schools.baseFeePerChild,
      })
        .from(schools)
        .where(eq(schools.id, schoolId))
        .limit(1);

    if (school[0]?.baseFeePerChild) {
      monthlyFee = school[0].baseFeePerChild;
    } else {
      // Ultimate fallback: 650 RON = 65000 cents
      monthlyFee = 65000;
    }

    const newChild: NewChild = {
      schoolId,
      firstName: childData.firstName,
      lastName: childData.lastName,
      dateOfBirth: new Date(childData.dateOfBirth),
      // Map parent info to existing schema fields
      // In a more complex setup, this would create parent_profiles
      specialNeeds: null,
      medicalConditions: null,
      monthlyFee: monthlyFee, // Use school default fee
      gender: null,
      startDate: new Date(), // Default to today
      createdByAdminId: adminUserId,
    };

    const [createdChild] = await db
      .insert(children)
      .values(newChild)
      .returning();

    return createdChild;
  }

  /**
   * Create new child with fee support
   */
  static async createChild(
    childData: CreateChildRequest,
    schoolId: number,
    adminUserId: number
  ): Promise<Child> {
    // Convert fee from RON to cents for storage
    const monthlyFeeCents = childData.monthlyFee ? ronToCents(childData.monthlyFee) : 0;

    // Validate fee amount
    if (!isValidFeeAmount(monthlyFeeCents)) {
      throw new Error('Invalid fee amount');
    }

    const newChild: NewChild = {
      schoolId,
      firstName: childData.firstName,
      lastName: childData.lastName,
      dateOfBirth: new Date(childData.dateOfBirth),
      monthlyFee: monthlyFeeCents,
      gender: childData.gender || null,
      startDate: new Date(childData.startDate),
      specialNeeds: childData.specialNeeds || null,
      medicalConditions: childData.medicalConditions || null,
      createdByAdminId: adminUserId,
    };

    const [createdChild] = await db
      .insert(children)
      .values(newChild)
      .returning();

    return createdChild;
  }

  /**
   * Update child with fee support
   */
  static async updateChild(
    childId: string,
    childData: UpdateChildRequest,
    schoolId: number
  ): Promise<Child> {
    // Build update object
    const updateData: Partial<NewChild> = {};

    if (childData.firstName !== undefined) updateData.firstName = childData.firstName;
    if (childData.lastName !== undefined) updateData.lastName = childData.lastName;
    if (childData.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(childData.dateOfBirth);
    if (childData.gender !== undefined) updateData.gender = childData.gender || null;
    if (childData.startDate !== undefined) updateData.startDate = new Date(childData.startDate);
    if (childData.specialNeeds !== undefined) updateData.specialNeeds = childData.specialNeeds || null;
    if (childData.medicalConditions !== undefined) updateData.medicalConditions = childData.medicalConditions || null;

    // Handle fee update
    if (childData.monthlyFee !== undefined) {
      const monthlyFeeCents = childData.monthlyFee ? ronToCents(childData.monthlyFee) : 0;
      if (!isValidFeeAmount(monthlyFeeCents)) {
        throw new Error('Invalid fee amount');
      }
      updateData.monthlyFee = monthlyFeeCents;
    }

    if (Object.keys(updateData).length === 0) {
      // No updates needed, return existing child
      const existing = await ChildService.getChildById(childId, schoolId);
      if (!existing) {
        throw new Error('Child not found');
      }
      return existing;
    }

    updateData.updatedAt = new Date();

    await db
      .update(children)
      .set(updateData)
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      );

    const updated = await ChildService.getChildById(childId, schoolId);
    if (!updated) {
      throw new Error('Failed to retrieve updated child');
    }

    return updated;
  }

  /**
   * Update only the child's monthly fee
   */
  static async updateChildFee(
    childId: string,
    feeInRon: number,
    schoolId: number
  ): Promise<Child> {
    const monthlyFeeCents = ronToCents(feeInRon);

    if (!isValidFeeAmount(monthlyFeeCents)) {
      throw new Error('Invalid fee amount');
    }

    await db
      .update(children)
      .set({
        monthlyFee: monthlyFeeCents,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      );

    const updated = await ChildService.getChildById(childId, schoolId);
    if (!updated) {
      throw new Error('Failed to retrieve updated child');
    }

    return updated;
  }

  /**
   * Get child with formatted fee display
   */
  static async getChildWithFeeDisplay(childId: string, schoolId: number): Promise<(Child & { monthlyFeeDisplay: string }) | null> {
    const child = await ChildService.getChildById(childId, schoolId);
    
    if (!child) {
      return null;
    }

    return {
      ...child,
      monthlyFeeDisplay: formatFeeDisplay(child.monthlyFee),
    };
  }

  /**
   * Get all children with formatted fee displays
   */
  static async getChildrenWithFeeDisplay(
    schoolId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: (Child & { monthlyFeeDisplay: string })[]; total: number }> {
    const { data, total } = await ChildService.getChildren(schoolId, page, limit);

    const dataWithFeeDisplay = data.map(child => ({
      ...child,
      monthlyFeeDisplay: formatFeeDisplay(child.monthlyFee),
    }));

    return { data: dataWithFeeDisplay, total };
  }

  /**
   * Update child details from enrollment form
   */
  static async updateChildDetails(
    childId: string,
    childData: NonNullable<CreateEnrollmentRequest['child']>,
    schoolId: number
  ): Promise<Child> {
    // Build update object with only provided fields
    const updateData: Partial<NewChild> = {};

    if (childData.firstName) updateData.firstName = childData.firstName;
    if (childData.lastName) updateData.lastName = childData.lastName;
    if (childData.dateOfBirth) updateData.dateOfBirth = new Date(childData.dateOfBirth);
    // Parent info would go to parent_profiles in a more complex setup

    if (Object.keys(updateData).length === 0) {
      // No updates needed, return existing child
      const existing = await ChildService.getChildById(childId, schoolId);
      if (!existing) {
        throw new Error('Child not found');
      }
      return existing;
    }

    await db
      .update(children)
      .set(updateData)
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      );

    const updated = await ChildService.getChildById(childId, schoolId);
    if (!updated) {
      throw new Error('Failed to retrieve updated child');
    }

    return updated;
  }

  /**
   * Validate child data for enrollment
   */
  static validateChildData(childData: CreateEnrollmentRequest['child']): void {
    // Check for either existing child ID or new child data
    if (!childData.existingChildId && !childData.firstName) {
      throw new Error('Either existing child ID or new child information is required');
    }

    // If creating new child, validate required fields
    if (!childData.existingChildId) {
      if (!childData.firstName || !childData.lastName || !childData.dateOfBirth || !childData.parentName) {
        throw new Error('First name, last name, date of birth, and parent name are required for new children');
      }

      // Validate date of birth
      const birthDate = new Date(childData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 0 || age > 18) {
        throw new Error('Child age must be between 0 and 18 years');
      }

      // Validate email format if provided
      if (childData.parentEmail && !isValidEmail(childData.parentEmail)) {
        throw new Error('Invalid parent email format');
      }

      // Validate phone format if provided
      if (childData.parentPhone && !isValidPhone(childData.parentPhone)) {
        throw new Error('Invalid parent phone format');
      }
    }
  }

  /**
   * Check if child can be enrolled (no active enrollment)
   */
  static async canEnrollChild(
    childId: string,
    schoolId: number
  ): Promise<{ canEnroll: boolean; reason?: string }> {
    const child = await ChildService.getChildById(childId, schoolId);

    if (!child) {
      return { canEnroll: false, reason: 'Child not found' };
    }

    if (child.enrollmentStatus !== 'ACTIVE') {
      return { canEnroll: false, reason: 'Child profile is inactive' };
    }

    // Check for active enrollments (this would typically use EnrollmentService)
    // For now, we'll assume this is handled by the EnrollmentService
    return { canEnroll: true };
  }

  /**
   * Get children without active enrollments
   */
  static async getUnenrolledChildren(
    schoolId: number,
    limit: number = 20
  ): Promise<Child[]> {
    // This would typically involve a LEFT JOIN with enrollments
    // For now, return all active children
    const { data } = await ChildService.getChildren(schoolId, 1, limit);
    return data;
  }
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Simple phone validation - accepts various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
}