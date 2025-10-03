import { AttendanceStatus } from '@/lib/constants/attendance-status';

/**
 * Attendance Record with Student Details
 *
 * Full attendance record including populated student information.
 * Used for API responses and UI display.
 */
export interface AttendanceRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // ISO date format (YYYY-MM-DD)
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  student: StudentInfo;
}

/**
 * Student Information
 *
 * Subset of student data included with attendance records.
 */
export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date format
}

/**
 * Create Attendance Request
 *
 * Payload for creating new attendance records via API.
 */
export interface CreateAttendanceRequest {
  studentId: string;
  date: string; // ISO date format (YYYY-MM-DD)
  status: AttendanceStatus;
  notes?: string;
}

/**
 * Update Attendance Request
 *
 * Payload for updating existing attendance records via API.
 */
export interface UpdateAttendanceRequest {
  status?: AttendanceStatus;
  notes?: string | null; // null to clear notes
}

/**
 * Attendance List Response
 *
 * API response for GET /api/teacher/attendance endpoint.
 * Includes both recorded attendance and students without attendance.
 */
export interface AttendanceListResponse {
  date: string;
  attendanceRecords: AttendanceRecord[];
  studentsWithoutAttendance: StudentInfo[];
  metadata: AttendanceMetadata;
}

/**
 * Attendance Metadata
 *
 * Summary statistics for attendance on a given date.
 */
export interface AttendanceMetadata {
  totalStudents: number;
  recordedAttendance: number;
  pendingConsensus: number;
}

/**
 * Attendance Error Response
 *
 * Standard error format for attendance API endpoints.
 */
export interface AttendanceErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
