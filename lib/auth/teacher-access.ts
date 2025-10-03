import { db } from '@/lib/db/drizzle';
import { teachers, teacherStudentAssignments, children } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Validate that a teacher has access to a specific student
 */
export async function validateTeacherStudentAccess(
  teacherId: number,
  studentId: string,
  schoolId: number
): Promise<boolean> {
  // First, get the teacher's UUID from the teachers table
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, teacherId),
        eq(teachers.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!teacher) {
    return false;
  }

  // Check if the student exists and belongs to the same school
  const [student] = await db
    .select()
    .from(children)
    .where(
      and(
        eq(children.id, studentId),
        eq(children.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!student) {
    return false;
  }

  // Check if there's an active assignment between teacher and student
  const [assignment] = await db
    .select()
    .from(teacherStudentAssignments)
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.studentId, studentId),
        eq(teacherStudentAssignments.isActive, true)
      )
    )
    .limit(1);

  return !!assignment;
}

/**
 * Validate that a teacher can access an observation
 * Teachers can access observations for any student they're assigned to
 */
export async function validateTeacherObservationAccess(
  teacherId: number,
  observationId: string,
  schoolId: number
): Promise<boolean> {
  // Get the teacher's UUID
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, teacherId),
        eq(teachers.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!teacher) {
    return false;
  }

  // Get the observation and verify the student is in the same school
  const [observation] = await db
    .select({
      studentId: children.id,
      schoolId: children.schoolId,
    })
    .from(children)
    .innerJoin(
      db.select().from(db.schema.observations).where(eq(db.schema.observations.id, observationId)).as('obs'),
      eq('obs.studentId', children.id)
    )
    .where(eq(children.schoolId, schoolId))
    .limit(1);

  if (!observation) {
    return false;
  }

  // Check if teacher has active assignment to the student
  const hasAccess = await validateTeacherStudentAccess(
    teacherId,
    observation.studentId,
    schoolId
  );

  return hasAccess;
}

/**
 * Get teacher's school ID
 */
export async function getTeacherSchoolId(teacherId: number): Promise<number | null> {
  const [teacher] = await db
    .select({ schoolId: teachers.schoolId })
    .from(teachers)
    .where(eq(teachers.userId, teacherId))
    .limit(1);

  return teacher?.schoolId || null;
}

/**
 * Validate teacher exists and is active
 */
export async function validateTeacherExists(
  teacherId: number,
  schoolId: number
): Promise<boolean> {
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, teacherId),
        eq(teachers.schoolId, schoolId)
      )
    )
    .limit(1);

  return !!teacher;
}

/**
 * Check if a user is a teacher (has teacher role)
 */
export function isTeacherRole(role: string): boolean {
  return role === 'teacher';
}

/**
 * Batch validate teacher access to multiple students
 */
export async function batchValidateTeacherStudentAccess(
  teacherId: number,
  studentIds: string[],
  schoolId: number
): Promise<Record<string, boolean>> {
  if (studentIds.length === 0) {
    return {};
  }

  // Get the teacher's UUID
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(
      and(
        eq(teachers.userId, teacherId),
        eq(teachers.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!teacher) {
    return Object.fromEntries(studentIds.map(id => [id, false]));
  }

  // Get all active assignments for these students
  const assignments = await db
    .select({ studentId: teacherStudentAssignments.studentId })
    .from(teacherStudentAssignments)
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.isActive, true)
      )
    );

  const accessibleStudentIds = new Set(assignments.map(a => a.studentId));

  return Object.fromEntries(
    studentIds.map(id => [id, accessibleStudentIds.has(id)])
  );
}
