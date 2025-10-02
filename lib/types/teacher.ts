import { UserRole } from '@/lib/constants/user-roles';

/**
 * Teacher entity type
 */
export interface Teacher {
  id: string;
  userId: number;
  schoolId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Teacher-Student assignment type
 */
export interface TeacherStudentAssignment {
  id: string;
  teacherId: string;
  studentId: string;
  classGroup?: string;
  assignedAt: Date;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Student enrollment status enum
 */
export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  WITHDRAWN = 'WITHDRAWN'
}

/**
 * Student type with enrollment status
 */
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentStatus: EnrollmentStatus;
  statusUpdatedAt: Date;
  schoolId: number;
}

/**
 * Teacher dashboard metrics
 */
export interface TeacherDashboardMetrics {
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  lastUpdated: Date;
}

/**
 * Student roster item with assignment info
 */
export interface StudentRosterItem extends Student {
  classGroup?: string;
  assignedAt: Date;
  isAssignmentActive: boolean;
}

/**
 * Teacher session user type
 */
export interface TeacherUser {
  id: number;
  email: string;
  name: string;
  role: UserRole.TEACHER;
  teamId: number | null;
  sessionVersion: number;
}

/**
 * Teacher route params
 */
export interface TeacherRouteParams {
  teacherId?: string;
  studentId?: string;
}

/**
 * Student roster filters
 */
export interface StudentRosterFilters {
  status?: EnrollmentStatus | 'ALL';
  classGroup?: string;
}
