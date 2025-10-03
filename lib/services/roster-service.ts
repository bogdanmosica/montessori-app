import { db } from '@/lib/db/drizzle';
import { children, enrollments, teachers, teacherStudentAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { StudentInfo } from '@/lib/types/attendance';

/**
 * Roster Service
 *
 * Provides student roster functions for teachers.
 * Integrates with teacher-student assignments and enrollment system.
 */

/**
 * Get all active students for a teacher's class
 *
 * Returns students assigned to the teacher with active enrollment status.
 */
export async function getTeacherRoster(
  teacherUserId: number,
  tenantId: number
): Promise<StudentInfo[]> {
  // Get teacher record
  const teacherRecord = await db.query.teachers.findFirst({
    where: eq(teachers.userId, teacherUserId),
  });

  if (!teacherRecord) {
    return [];
  }

  // Query assigned students with active enrollments
  const roster = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
    })
    .from(children)
    .innerJoin(teacherStudentAssignments, eq(children.id, teacherStudentAssignments.studentId))
    .innerJoin(enrollments, eq(children.id, enrollments.childId))
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacherRecord.id),
        eq(teacherStudentAssignments.isActive, true),
        eq(children.schoolId, tenantId),
        eq(enrollments.status, 'active')
      )
    )
    .orderBy(children.firstName, children.lastName);

  return roster.map((student) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
  }));
}

/**
 * Get student by ID (with permission check)
 */
export async function getStudentById(
  studentId: string,
  tenantId: number
): Promise<StudentInfo | null> {
  const [student] = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
    })
    .from(children)
    .where(
      and(
        eq(children.id, studentId),
        eq(children.schoolId, tenantId)
      )
    );

  if (!student) {
    return null;
  }

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
  };
}

/**
 * Check if teacher has permission to access a student
 *
 * Verifies that the student is in the teacher's roster.
 * TODO: Update when teacher-student assignment table exists.
 */
export async function canTeacherAccessStudent(
  teacherId: number,
  studentId: string,
  tenantId: number
): Promise<boolean> {
  // Check if student exists and belongs to the same school
  const student = await getStudentById(studentId, tenantId);

  // For now, allow access to all students in the same school
  // TODO: Implement proper teacher-student assignment check
  return student !== null;
}

/**
 * Get student count for teacher's roster
 */
export async function getTeacherRosterCount(
  teacherId: number,
  tenantId: number
): Promise<number> {
  const roster = await getTeacherRoster(teacherId, tenantId);
  return roster.length;
}
