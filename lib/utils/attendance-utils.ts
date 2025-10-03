import { AttendanceStatus, ATTENDANCE_STATUS, isPendingStatus, isConfirmedStatus } from '@/lib/constants/attendance-status';
import { AttendanceRecord } from '@/lib/types/attendance';

/**
 * Attendance Utilities
 *
 * Helper functions for attendance calculations and analysis.
 */

/**
 * Calculate attendance rate for a set of records
 */
export function calculateAttendanceRate(attendanceRecords: AttendanceRecord[]): number {
  if (attendanceRecords.length === 0) return 0;

  const presentCount = attendanceRecords.filter(
    (record) =>
      record.status === ATTENDANCE_STATUS.PRESENT ||
      record.status === ATTENDANCE_STATUS.CONFIRMED_PRESENT
  ).length;

  return Math.round((presentCount / attendanceRecords.length) * 100);
}

/**
 * Group attendance records by status
 */
export function groupByStatus(attendanceRecords: AttendanceRecord[]): Record<string, AttendanceRecord[]> {
  return attendanceRecords.reduce((groups, record) => {
    const status = record.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(record);
    return groups;
  }, {} as Record<string, AttendanceRecord[]>);
}

/**
 * Count students by attendance status
 */
export function countByStatus(attendanceRecords: AttendanceRecord[]): Record<AttendanceStatus, number> {
  const counts = {
    [ATTENDANCE_STATUS.PRESENT]: 0,
    [ATTENDANCE_STATUS.ABSENT]: 0,
    [ATTENDANCE_STATUS.PENDING_PRESENT]: 0,
    [ATTENDANCE_STATUS.PENDING_ABSENT]: 0,
    [ATTENDANCE_STATUS.CONFIRMED_PRESENT]: 0,
    [ATTENDANCE_STATUS.CONFIRMED_ABSENT]: 0,
  };

  attendanceRecords.forEach((record) => {
    counts[record.status as AttendanceStatus]++;
  });

  return counts as Record<AttendanceStatus, number>;
}

/**
 * Get students with pending consensus
 */
export function getPendingConsensus(attendanceRecords: AttendanceRecord[]): AttendanceRecord[] {
  return attendanceRecords.filter((record) => isPendingStatus(record.status as AttendanceStatus));
}

/**
 * Check if all students have recorded attendance
 */
export function isAttendanceComplete(totalStudents: number, recordedAttendance: number): boolean {
  return totalStudents > 0 && recordedAttendance === totalStudents;
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(totalStudents: number, recordedAttendance: number): number {
  if (totalStudents === 0) return 0;
  return Math.round((recordedAttendance / totalStudents) * 100);
}

/**
 * Filter students with notes
 */
export function getStudentsWithNotes(attendanceRecords: AttendanceRecord[]): AttendanceRecord[] {
  return attendanceRecords.filter((record) => record.notes && record.notes.trim().length > 0);
}

/**
 * Filter students by status type
 */
export function filterByStatusType(
  attendanceRecords: AttendanceRecord[],
  type: 'present' | 'absent' | 'pending'
): AttendanceRecord[] {
  if (type === 'present') {
    return attendanceRecords.filter(
      (record) =>
        record.status === ATTENDANCE_STATUS.PRESENT ||
        record.status === ATTENDANCE_STATUS.CONFIRMED_PRESENT
    );
  }

  if (type === 'absent') {
    return attendanceRecords.filter(
      (record) =>
        record.status === ATTENDANCE_STATUS.ABSENT ||
        record.status === ATTENDANCE_STATUS.CONFIRMED_ABSENT
    );
  }

  if (type === 'pending') {
    return attendanceRecords.filter((record) => isPendingStatus(record.status as AttendanceStatus));
  }

  return [];
}

/**
 * Get attendance summary statistics
 */
export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  pending: number;
  attendanceRate: number;
  completionRate: number;
  withNotes: number;
}

export function getAttendanceSummary(
  totalStudents: number,
  attendanceRecords: AttendanceRecord[]
): AttendanceSummary {
  const present = filterByStatusType(attendanceRecords, 'present').length;
  const absent = filterByStatusType(attendanceRecords, 'absent').length;
  const pending = filterByStatusType(attendanceRecords, 'pending').length;
  const withNotes = getStudentsWithNotes(attendanceRecords).length;

  return {
    total: totalStudents,
    present,
    absent,
    pending,
    attendanceRate: calculateAttendanceRate(attendanceRecords),
    completionRate: getCompletionPercentage(totalStudents, attendanceRecords.length),
    withNotes,
  };
}

/**
 * Sort attendance records by student name
 */
export function sortByStudentName(attendanceRecords: AttendanceRecord[]): AttendanceRecord[] {
  return [...attendanceRecords].sort((a, b) => {
    const nameA = `${a.student.firstName} ${a.student.lastName}`.toLowerCase();
    const nameB = `${b.student.firstName} ${b.student.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort attendance records by status
 */
export function sortByStatus(attendanceRecords: AttendanceRecord[]): AttendanceRecord[] {
  const statusOrder = {
    [ATTENDANCE_STATUS.PENDING_PRESENT]: 0,
    [ATTENDANCE_STATUS.PENDING_ABSENT]: 1,
    [ATTENDANCE_STATUS.PRESENT]: 2,
    [ATTENDANCE_STATUS.CONFIRMED_PRESENT]: 3,
    [ATTENDANCE_STATUS.ABSENT]: 4,
    [ATTENDANCE_STATUS.CONFIRMED_ABSENT]: 5,
  };

  return [...attendanceRecords].sort((a, b) => {
    const orderA = statusOrder[a.status as AttendanceStatus] ?? 999;
    const orderB = statusOrder[b.status as AttendanceStatus] ?? 999;
    return orderA - orderB;
  });
}
