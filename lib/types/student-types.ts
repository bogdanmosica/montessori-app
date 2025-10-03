import type { Child } from '@/lib/db/schema';

/**
 * Student profile with calculated fields
 */
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  enrollmentStatus: string;
  startDate: Date;
  gender: string | null;
  specialNeeds: string | null;
  medicalConditions: string | null;
  monthlyFee: number;
  schoolId: number;
}

/**
 * Student summary for list views
 */
export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  enrollmentStatus: string;
  observationCount: number;
  classGroup?: string | null;
}

/**
 * Student with assignment details for teachers
 */
export interface StudentWithAssignment extends Child {
  classGroup: string | null;
  assignedAt: Date;
  observationCount: number;
}

/**
 * Enrollment details for student profile
 */
export interface EnrollmentDetails {
  id: string;
  status: string;
  enrollmentDate: Date;
  program: string | null;
}

/**
 * Extended student profile with enrollment
 */
export interface StudentProfileWithEnrollment {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  enrollment: EnrollmentDetails;
  recentObservations: ObservationSummary[];
}

/**
 * Observation summary for student profile
 */
export interface ObservationSummary {
  id: string;
  studentId: string;
  teacherId: number;
  teacherName: string | null;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student filter options
 */
export interface StudentFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'WAITLISTED' | 'ALL';
  classGroup?: string;
  searchTerm?: string;
}

/**
 * Student list response
 */
export interface StudentListResponse {
  students: StudentSummary[];
  totalCount: number;
  classGroups: string[];
}
