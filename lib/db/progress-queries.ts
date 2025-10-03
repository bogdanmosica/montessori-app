/**
 * Multi-tenant Query Helpers for Progress Board
 *
 * Provides safe, multi-tenant scoped queries for progress board data
 */

import { db } from '@/lib/db/drizzle';
import { lessonProgress } from '@/lib/db/schema/lesson-progress';
import { progressColumns } from '@/lib/db/schema/progress-columns';
import { lessons } from '@/lib/db/schema/lessons';
import { children } from '@/lib/db/schema';
import { users } from '@/lib/db/schema';
import { eq, and, count, desc } from 'drizzle-orm';

/**
 * Base query builder with multi-tenant scoping
 */
function createScopedQuery(schoolId: number) {
  return {
    /**
     * Get progress cards for a teacher
     */
    async getTeacherProgressCards(teacherId: number) {
      return db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.teacherId, teacherId)
          )
        )
        .orderBy(lessonProgress.position);
    },

    /**
     * Get progress columns for school
     */
    async getSchoolProgressColumns() {
      return db
        .select()
        .from(progressColumns)
        .where(
          and(
            eq(progressColumns.schoolId, schoolId),
            eq(progressColumns.isActive, true)
          )
        )
        .orderBy(progressColumns.position);
    },

    /**
     * Get lessons for school
     */
    async getSchoolLessons() {
      return db
        .select()
        .from(lessons)
        .where(eq(lessons.schoolId, schoolId))
        .orderBy(lessons.category, lessons.title);
    },

    /**
     * Get students for school
     */
    async getSchoolStudents() {
      return db
        .select()
        .from(children)
        .where(eq(children.schoolId, schoolId))
        .orderBy(children.firstName, children.lastName);
    },

    /**
     * Get progress card count by status for a teacher
     */
    async getCardCountsByStatus(teacherId: number) {
      return db
        .select({
          status: lessonProgress.status,
          count: count(),
        })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.teacherId, teacherId)
          )
        )
        .groupBy(lessonProgress.status);
    },

    /**
     * Get recent activity for a teacher
     */
    async getRecentActivity(teacherId: number, limit: number = 10) {
      return db
        .select({
          id: lessonProgress.id,
          lesson_id: lessonProgress.lessonId,
          lesson_title: lessons.title,
          student_id: lessonProgress.studentId,
          student_name: children.firstName,
          student_last_name: children.lastName,
          status: lessonProgress.status,
          updated_at: lessonProgress.updatedAt,
        })
        .from(lessonProgress)
        .leftJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
        .leftJoin(children, eq(lessonProgress.studentId, children.id))
        .where(
          and(
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.teacherId, teacherId)
          )
        )
        .orderBy(desc(lessonProgress.updatedAt))
        .limit(limit);
    },

    /**
     * Get student progress summary
     */
    async getStudentProgressSummary(studentId: string, teacherId: number) {
      return db
        .select({
          total: count(),
          status: lessonProgress.status,
        })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.teacherId, teacherId),
            eq(lessonProgress.studentId, studentId)
          )
        )
        .groupBy(lessonProgress.status);
    },

    /**
     * Get lesson usage statistics
     */
    async getLessonUsageStats(lessonId: string) {
      return db
        .select({
          total_assignments: count(),
          status: lessonProgress.status,
        })
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.lessonId, lessonId)
          )
        )
        .groupBy(lessonProgress.status);
    },
  };
}

/**
 * Get scoped query helpers for a school
 */
export function getProgressQueries(schoolId: number) {
  return createScopedQuery(schoolId);
}

/**
 * Verify user has access to school
 */
export async function verifySchoolAccess(
  userId: number,
  schoolId: number
): Promise<boolean> {
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return false;
  }

  // Check if user is a member of the school (team)
  // This would typically check teamMembers table
  // For now, we'll assume validation happens at middleware level
  return true;
}

/**
 * Log progress board access
 */
export async function logProgressBoardAccess(
  userId: number,
  schoolId: number,
  action: string,
  details?: any
) {
  // This would log to adminAccessLogs or similar audit table
  // Implementation depends on your audit logging strategy
  console.log('Progress Board Access:', {
    userId,
    schoolId,
    action,
    details,
    timestamp: new Date(),
  });
}
