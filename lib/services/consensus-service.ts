import { db } from '@/lib/db/drizzle';
import { attendance } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ATTENDANCE_STATUS, AttendanceStatus, isPendingStatus } from '@/lib/constants/attendance-status';

/**
 * Consensus Service
 *
 * Handles co-teaching consensus workflow logic for attendance.
 * Determines when multiple teachers need to agree on attendance status.
 */

/**
 * Check if a student has multiple teachers (co-teaching scenario)
 */
export async function isCoTeachingScenario(
  studentId: string,
  tenantId: number
): Promise<boolean> {
  // TODO: Implement when teacher-student assignment table exists
  // For now, assume single teacher (no co-teaching)
  return false;
}

/**
 * Get all teachers assigned to a student
 */
export async function getStudentTeachers(
  studentId: string,
  tenantId: number
): Promise<number[]> {
  // TODO: Implement when teacher-student assignment table exists
  // For now, return empty array
  return [];
}

/**
 * Determine initial status for new attendance record
 *
 * If co-teaching: Use pending_* status
 * If single teacher: Use final status (present/absent)
 */
export async function determineInitialStatus(
  studentId: string,
  tenantId: number,
  requestedStatus: AttendanceStatus
): Promise<AttendanceStatus> {
  const isCoTeaching = await isCoTeachingScenario(studentId, tenantId);

  if (!isCoTeaching) {
    // Single teacher: Use final status directly
    return requestedStatus;
  }

  // Co-teaching: Convert to pending status
  if (requestedStatus === ATTENDANCE_STATUS.PRESENT) {
    return ATTENDANCE_STATUS.PENDING_PRESENT;
  }
  if (requestedStatus === ATTENDANCE_STATUS.ABSENT) {
    return ATTENDANCE_STATUS.PENDING_ABSENT;
  }

  return requestedStatus;
}

/**
 * Process consensus when a teacher updates attendance
 *
 * Returns the final status after consensus logic is applied.
 */
export async function processConsensus(
  studentId: string,
  date: string,
  tenantId: number,
  teacherId: number,
  newStatus: AttendanceStatus
): Promise<AttendanceStatus> {
  const isCoTeaching = await isCoTeachingScenario(studentId, tenantId);

  if (!isCoTeaching) {
    // Single teacher: Use status directly
    return newStatus;
  }

  // Get all attendance records for this student on this date
  const allRecords = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.date, date),
        eq(attendance.tenantId, tenantId)
      )
    );

  // Get all assigned teachers
  const assignedTeachers = await getStudentTeachers(studentId, tenantId);

  // Check if all teachers have recorded attendance
  const recordedTeachers = new Set(allRecords.map((r) => r.teacherId));
  const allTeachersRecorded = assignedTeachers.every((tid) => recordedTeachers.has(tid));

  if (!allTeachersRecorded) {
    // Not all teachers have recorded yet, use pending status
    if (newStatus === ATTENDANCE_STATUS.PRESENT || newStatus === ATTENDANCE_STATUS.PENDING_PRESENT) {
      return ATTENDANCE_STATUS.PENDING_PRESENT;
    }
    if (newStatus === ATTENDANCE_STATUS.ABSENT || newStatus === ATTENDANCE_STATUS.PENDING_ABSENT) {
      return ATTENDANCE_STATUS.PENDING_ABSENT;
    }
  }

  // All teachers have recorded, check for consensus
  const statusCounts = new Map<AttendanceStatus, number>();
  for (const record of allRecords) {
    const status = record.status as AttendanceStatus;
    const baseStatus = normalizeStatus(status);
    statusCounts.set(baseStatus, (statusCounts.get(baseStatus) || 0) + 1);
  }

  // Include the new status from current teacher
  const baseNewStatus = normalizeStatus(newStatus);
  statusCounts.set(baseNewStatus, (statusCounts.get(baseNewStatus) || 0) + 1);

  // Check if all agree
  const totalTeachers = assignedTeachers.length;
  const presentCount = statusCounts.get(ATTENDANCE_STATUS.PRESENT) || 0;
  const absentCount = statusCounts.get(ATTENDANCE_STATUS.ABSENT) || 0;

  if (presentCount === totalTeachers) {
    return ATTENDANCE_STATUS.CONFIRMED_PRESENT;
  }
  if (absentCount === totalTeachers) {
    return ATTENDANCE_STATUS.CONFIRMED_ABSENT;
  }

  // No consensus yet, remain in pending
  return baseNewStatus === ATTENDANCE_STATUS.PRESENT
    ? ATTENDANCE_STATUS.PENDING_PRESENT
    : ATTENDANCE_STATUS.PENDING_ABSENT;
}

/**
 * Normalize status to base present/absent
 */
function normalizeStatus(status: AttendanceStatus): AttendanceStatus {
  if (
    status === ATTENDANCE_STATUS.PRESENT ||
    status === ATTENDANCE_STATUS.PENDING_PRESENT ||
    status === ATTENDANCE_STATUS.CONFIRMED_PRESENT
  ) {
    return ATTENDANCE_STATUS.PRESENT;
  }
  if (
    status === ATTENDANCE_STATUS.ABSENT ||
    status === ATTENDANCE_STATUS.PENDING_ABSENT ||
    status === ATTENDANCE_STATUS.CONFIRMED_ABSENT
  ) {
    return ATTENDANCE_STATUS.ABSENT;
  }
  return status;
}

/**
 * Check if consensus has been reached for a student on a date
 */
export async function hasConsensus(
  studentId: string,
  date: string,
  tenantId: number
): Promise<boolean> {
  const allRecords = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.date, date),
        eq(attendance.tenantId, tenantId)
      )
    );

  // Check if any record has confirmed status
  return allRecords.some((record) =>
    record.status === ATTENDANCE_STATUS.CONFIRMED_PRESENT ||
    record.status === ATTENDANCE_STATUS.CONFIRMED_ABSENT
  );
}
