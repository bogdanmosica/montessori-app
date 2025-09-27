import type { EnrollmentStatus, EnrollmentSortBy, EnrollmentSortOrder } from './constants';

export interface Enrollment {
  id: string;
  childId: string;
  schoolId: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  withdrawalDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Child {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  isActive: boolean;
}

export interface EnrollmentWithChild {
  id: string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  withdrawalDate?: string;
  notes?: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    parentName: string;
    parentEmail?: string;
    parentPhone?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface GetEnrollmentsQuery {
  status?: EnrollmentStatus | EnrollmentStatus[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: EnrollmentSortBy;
  sortOrder?: EnrollmentSortOrder;
}

export interface GetEnrollmentsResponse {
  data: EnrollmentWithChild[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateEnrollmentRequest {
  enrollment: {
    enrollmentDate: string;
    notes?: string;
  };
  child: {
    existingChildId?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
  };
}

export interface CreateEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
}

export interface UpdateEnrollmentRequest {
  enrollment: {
    status?: EnrollmentStatus;
    enrollmentDate?: string;
    withdrawalDate?: string;
    notes?: string;
  };
  child?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
  };
}

export interface UpdateEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
}

export interface WithdrawEnrollmentRequest {
  withdrawalDate?: string;
  notes?: string;
}

export interface WithdrawEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
  archivedRecords?: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path: string;
}