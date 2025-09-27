import { db } from '../db/drizzle';
import { children, enrollments } from '../db/schema';
import type { NewChild, Child } from '../db/schema';

export interface CreateChildData {
  schoolId: number;
  applicationId?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string | null;
  startDate: Date;
  specialNeeds?: string | null;
  medicalConditions?: string | null;
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
  createdByAdminId: number;
}

/**
 * Create a new child profile with corresponding enrollment record
 */
export async function createChildProfile(data: CreateChildData, tx?: any): Promise<Child> {
  const dbInstance = tx || db;

  const childData: NewChild = {
    schoolId: data.schoolId,
    applicationId: data.applicationId,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    enrollmentStatus: data.enrollmentStatus,
    startDate: data.startDate,
    specialNeeds: data.specialNeeds,
    medicalConditions: data.medicalConditions,
    createdByAdminId: data.createdByAdminId,
  };

  // Create the child profile first
  const childResults = await dbInstance
    .insert(children)
    .values(childData)
    .returning();

  const child = childResults[0];

  // If child is ACTIVE, also create an enrollment record
  if (data.enrollmentStatus === 'ACTIVE') {
    await dbInstance
      .insert(enrollments)
      .values({
        childId: child.id,
        schoolId: data.schoolId,
        status: 'active',
        enrollmentDate: data.startDate,
        createdBy: data.createdByAdminId,
        updatedBy: data.createdByAdminId,
        notes: data.applicationId ? 
          `Created from application ${data.applicationId}` : 
          'Created directly by admin',
      });
  }

  return child;
}

/**
 * Validate child data before creation
 */
export function validateChildData(data: Partial<CreateChildData>): string[] {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    
    // Calculate age more accurately
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check if child is appropriate age for Montessori (0-6 years)
    if (age < 0 || age > 6) {
      errors.push('Child must be between 0 and 6 years old');
    }
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  } else {
    const startDate = new Date(data.startDate);
    const today = new Date();
    
    // Set time to midnight for both dates to compare only dates, not time
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Start date cannot be in the past (allow same day)
    if (startDate < today) {
      errors.push('Start date cannot be in the past');
    }
  }

  if (!data.schoolId) {
    errors.push('School ID is required');
  }

  if (!data.createdByAdminId) {
    errors.push('Admin user ID is required');
  }

  if (!data.enrollmentStatus || !['ACTIVE', 'INACTIVE', 'WAITLISTED'].includes(data.enrollmentStatus)) {
    errors.push('Valid enrollment status is required');
  }

  return errors;
}