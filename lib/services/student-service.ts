import { db } from '@/lib/db/drizzle';
import { children, teacherStudentAssignments, teachers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Get all students assigned to a teacher
 */
export async function getStudentsByTeacherId(teacherId: number, schoolId: number) {
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
    return [];
  }

  // Get assigned students through the assignments table
  const students = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
      enrollmentStatus: children.enrollmentStatus,
      startDate: children.startDate,
      specialNeeds: children.specialNeeds,
      medicalConditions: children.medicalConditions,
      createdAt: children.createdAt,
      schoolId: children.schoolId,
    })
    .from(children)
    .innerJoin(
      teacherStudentAssignments,
      and(
        eq(teacherStudentAssignments.studentId, children.id),
        eq(teacherStudentAssignments.isActive, true)
      )
    )
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(children.schoolId, schoolId)
      )
    );

  return students;
}

/**
 * Get a single student by ID with multi-tenant scoping
 */
export async function getStudentById(studentId: string, schoolId: number) {
  const [student] = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
      enrollmentStatus: children.enrollmentStatus,
      startDate: children.startDate,
      specialNeeds: children.specialNeeds,
      medicalConditions: children.medicalConditions,
      schoolId: children.schoolId,
      gender: children.gender,
      monthlyFee: children.monthlyFee,
      createdAt: children.createdAt,
      updatedAt: children.updatedAt,
    })
    .from(children)
    .where(
      and(
        eq(children.id, studentId),
        eq(children.schoolId, schoolId)
      )
    )
    .limit(1);

  return student || null;
}

/**
 * Check if a teacher has access to a student
 */
export async function hasTeacherAccessToStudent(
  teacherId: number,
  studentId: string,
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

  // Check if there's an active assignment
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
 * Get student count for a teacher
 */
export async function getTeacherStudentCount(
  teacherId: number,
  schoolId: number
): Promise<number> {
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
    return 0;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teacherStudentAssignments)
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.isActive, true)
      )
    );

  return Number(count) || 0;
}

/**
 * Calculate student age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
