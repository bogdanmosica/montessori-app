/**
 * Teacher API Response Types
 * Following OpenAPI specification from contracts/api-spec.yaml
 */

/**
 * Student Summary (for list views)
 */
export interface TeacherStudentSummaryResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  observationCount: number;
}

/**
 * Students List Response
 */
export interface TeacherStudentsResponse {
  students: TeacherStudentSummaryResponse[];
}

/**
 * Enrollment Details
 */
export interface TeacherEnrollmentDetails {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  enrollmentDate: string; // ISO date string
  program?: string;
}

/**
 * Observation (detailed)
 */
export interface TeacherObservationResponse {
  id: string;
  studentId: string;
  teacherId: number;
  teacherName: string;
  note: string;
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}

/**
 * Student Profile (detailed)
 */
export interface TeacherStudentProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  age: number;
  enrollment: TeacherEnrollmentDetails;
  recentObservations?: TeacherObservationResponse[];
}

/**
 * Pagination Metadata
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Observations List Response
 */
export interface TeacherObservationsResponse {
  observations: TeacherObservationResponse[];
  pagination: PaginationResponse;
}

/**
 * Create Observation Request
 */
export interface CreateObservationRequest {
  note: string;
}

/**
 * Update Observation Request
 */
export interface UpdateObservationRequest {
  note: string;
}

/**
 * Error Response
 */
export interface TeacherAPIErrorResponse {
  error: string;
  message: string;
  code?: string;
}

/**
 * Standard API Response Wrapper
 */
export interface TeacherAPIResponse<T = unknown> {
  data?: T;
  error?: TeacherAPIErrorResponse;
  success: boolean;
}

/**
 * Query Parameters for Observations
 */
export interface ObservationQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
}
