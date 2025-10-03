/**
 * Attendance Status Constants
 *
 * Defines valid attendance statuses for the Montessori school management system.
 * Supports both single teacher and co-teaching consensus workflows.
 */

export const ATTENDANCE_STATUS = {
  // Final states for single teacher
  PRESENT: 'present',
  ABSENT: 'absent',

  // Intermediate states for co-teaching consensus
  PENDING_PRESENT: 'pending_present',
  PENDING_ABSENT: 'pending_absent',

  // Final states for co-teaching with consensus
  CONFIRMED_PRESENT: 'confirmed_present',
  CONFIRMED_ABSENT: 'confirmed_absent',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

/**
 * Helper to check if status is pending (awaiting co-teacher confirmation)
 */
export function isPendingStatus(status: AttendanceStatus): boolean {
  return status === ATTENDANCE_STATUS.PENDING_PRESENT ||
         status === ATTENDANCE_STATUS.PENDING_ABSENT;
}

/**
 * Helper to check if status is confirmed (final state)
 */
export function isConfirmedStatus(status: AttendanceStatus): boolean {
  return status === ATTENDANCE_STATUS.PRESENT ||
         status === ATTENDANCE_STATUS.ABSENT ||
         status === ATTENDANCE_STATUS.CONFIRMED_PRESENT ||
         status === ATTENDANCE_STATUS.CONFIRMED_ABSENT;
}

/**
 * Get display label for attendance status
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    [ATTENDANCE_STATUS.PRESENT]: 'Present',
    [ATTENDANCE_STATUS.ABSENT]: 'Absent',
    [ATTENDANCE_STATUS.PENDING_PRESENT]: 'Pending Present',
    [ATTENDANCE_STATUS.PENDING_ABSENT]: 'Pending Absent',
    [ATTENDANCE_STATUS.CONFIRMED_PRESENT]: 'Confirmed Present',
    [ATTENDANCE_STATUS.CONFIRMED_ABSENT]: 'Confirmed Absent',
  };

  return labels[status] || status;
}
