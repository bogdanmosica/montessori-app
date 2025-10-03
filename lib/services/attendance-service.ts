import { db } from '@/lib/db/drizzle';
import { attendance, children, users } from '@/lib/db/schema';
import { Attendance, NewAttendance } from '@/lib/db/schema/attendance';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { AttendanceRecord, StudentInfo, AttendanceListResponse } from '@/lib/types/attendance';
import { ATTENDANCE_STATUS, AttendanceStatus, isPendingStatus } from '@/lib/constants/attendance-status';

/**
 * Attendance Service
 *
 * Micro functions for attendance CRUD operations.
 * All operations are tenant-scoped for multi-tenant security.
 */

/**
 * Get attendance records for a teacher on a specific date
 */
export async function getAttendanceForDate(
  teacherId: number,
  tenantId: number,
  date: string
): Promise<AttendanceListResponse> {
  // Query attendance records with student details
  const attendanceRecords = await db
    .select({
      id: attendance.id,
      studentId: attendance.studentId,
      teacherId: attendance.teacherId,
      date: attendance.date,
      status: attendance.status,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      student: {
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        dateOfBirth: children.dateOfBirth,
      },
    })
    .from(attendance)
    .innerJoin(children, eq(attendance.studentId, children.id))
    .where(
      and(
        eq(attendance.teacherId, teacherId),
        eq(attendance.tenantId, tenantId),
        eq(attendance.date, date)
      )
    )
    .orderBy(children.firstName, children.lastName);

  // Get all students assigned to this teacher
  // TODO: Update when teacher-student assignment table exists
  // For now, get all students from the same school
  const allStudents = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
    })
    .from(children)
    .where(eq(children.schoolId, tenantId))
    .orderBy(children.firstName, children.lastName);

  // Filter students without attendance
  const attendedStudentIds = new Set(attendanceRecords.map((r) => r.studentId));
  const studentsWithoutAttendance = allStudents.filter(
    (student) => !attendedStudentIds.has(student.id)
  );

  // Calculate metadata
  const pendingCount = attendanceRecords.filter((r) => isPendingStatus(r.status as AttendanceStatus)).length;

  return {
    date,
    attendanceRecords: attendanceRecords.map(formatAttendanceRecord),
    studentsWithoutAttendance: studentsWithoutAttendance.map(formatStudentInfo),
    metadata: {
      totalStudents: allStudents.length,
      recordedAttendance: attendanceRecords.length,
      pendingConsensus: pendingCount,
    },
  };
}

/**
 * Create new attendance record
 */
export async function createAttendance(
  teacherId: number,
  tenantId: number,
  studentId: string,
  date: string,
  status: AttendanceStatus,
  notes?: string
): Promise<Attendance> {
  const [record] = await db
    .insert(attendance)
    .values({
      studentId,
      teacherId,
      date,
      status,
      notes: notes || null,
      tenantId,
    })
    .returning();

  return record;
}

/**
 * Update existing attendance record
 */
export async function updateAttendance(
  attendanceId: string,
  teacherId: number,
  tenantId: number,
  updates: { status?: AttendanceStatus; notes?: string | null }
): Promise<Attendance | null> {
  const [record] = await db
    .update(attendance)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(attendance.id, attendanceId),
        eq(attendance.teacherId, teacherId),
        eq(attendance.tenantId, tenantId)
      )
    )
    .returning();

  return record || null;
}

/**
 * Delete attendance record (for corrections)
 */
export async function deleteAttendance(
  attendanceId: string,
  teacherId: number,
  tenantId: number
): Promise<boolean> {
  const result = await db
    .delete(attendance)
    .where(
      and(
        eq(attendance.id, attendanceId),
        eq(attendance.teacherId, teacherId),
        eq(attendance.tenantId, tenantId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Get single attendance record by ID
 */
export async function getAttendanceById(
  attendanceId: string,
  teacherId: number,
  tenantId: number
): Promise<Attendance | null> {
  const [record] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.id, attendanceId),
        eq(attendance.teacherId, teacherId),
        eq(attendance.tenantId, tenantId)
      )
    );

  return record || null;
}

/**
 * Get student attendance history
 */
export async function getStudentAttendanceHistory(
  studentId: string,
  tenantId: number,
  limit: number = 30
): Promise<Attendance[]> {
  return await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.tenantId, tenantId)
      )
    )
    .orderBy(desc(attendance.date))
    .limit(limit);
}

/**
 * Format helpers
 */
function formatAttendanceRecord(record: any): AttendanceRecord {
  return {
    id: record.id,
    studentId: record.studentId,
    teacherId: record.teacherId.toString(),
    date: record.date,
    status: record.status,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    student: formatStudentInfo(record.student),
  };
}

function formatStudentInfo(student: any): StudentInfo {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
  };
}
