// T015: Create teacher activity metrics helpers
import { db } from '@/lib/db/drizzle';
import { teacherActivity, teamMembers, users } from '@/lib/db/schema';
import { eq, and, gte, count, sum, avg, desc } from 'drizzle-orm';
import type { TeacherActivitySnapshot } from '@/lib/types/dashboard';

export async function getTeacherActivityMetrics(schoolId: string): Promise<TeacherActivitySnapshot> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get total teachers in the school
    const totalTeachersQuery = await db
      .select({ count: count() })
      .from(teamMembers)
      .leftJoin(users, eq(users.id, teamMembers.userId))
      .where(and(
        eq(teamMembers.teamId, parseInt(schoolId)),
        eq(users.role, 'teacher')
      ));

    const totalTeachers = totalTeachersQuery[0]?.count || 0;

    // Get teachers who were active in the last week
    const activeTeachersQuery = await db
      .select({ count: count() })
      .from(teacherActivity)
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.activityDate, oneWeekAgo)
      ));

    const activeTeachers = activeTeachersQuery[0]?.count || 0;

    // Get login count for the last week
    const lastWeekLoginsQuery = await db
      .select({ count: count() })
      .from(teacherActivity)
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.sessionStart, oneWeekAgo)
      ));

    const lastWeekLogins = lastWeekLoginsQuery[0]?.count || 0;

    // Get average session duration
    const avgSessionDurationQuery = await db
      .select({ avgDuration: avg(teacherActivity.sessionDuration) })
      .from(teacherActivity)
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.activityDate, oneWeekAgo)
      ));

    const avgSessionDuration = avgSessionDurationQuery[0]?.avgDuration || 0;

    // Get classroom updates count for the last week
    const classroomUpdatesQuery = await db
      .select({ totalUpdates: sum(teacherActivity.classroomUpdates) })
      .from(teacherActivity)
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.activityDate, oneWeekAgo)
      ));

    const classroomUpdates = classroomUpdatesQuery[0]?.totalUpdates || 0;

    return {
      activeTeachers: Math.min(activeTeachers, totalTeachers),
      totalTeachers,
      lastWeekLogins,
      avgSessionDuration: Math.round(Number(avgSessionDuration)),
      classroomUpdates: Number(classroomUpdates),
    };
  } catch (error) {
    console.error('Error calculating teacher activity metrics:', error);
    throw new Error('Failed to calculate teacher activity metrics');
  }
}

export async function recordTeacherActivity(activityData: {
  schoolId: string;
  userId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  classroomUpdates?: number;
}) {
  try {
    const sessionDuration = activityData.sessionEnd
      ? Math.round((activityData.sessionEnd.getTime() - activityData.sessionStart.getTime()) / (1000 * 60))
      : null;

    const activity = await db
      .insert(teacherActivity)
      .values({
        schoolId: parseInt(activityData.schoolId),
        userId: parseInt(activityData.userId),
        sessionStart: activityData.sessionStart,
        sessionEnd: activityData.sessionEnd,
        sessionDuration,
        classroomUpdates: activityData.classroomUpdates || 0,
        activityDate: activityData.sessionStart,
      })
      .returning();

    return activity[0];
  } catch (error) {
    console.error('Error recording teacher activity:', error);
    throw new Error('Failed to record teacher activity');
  }
}

export async function updateTeacherSession(
  sessionId: string,
  updateData: {
    sessionEnd: Date;
    classroomUpdates?: number;
  }
) {
  try {
    // Get the session to calculate duration
    const session = await db
      .select()
      .from(teacherActivity)
      .where(eq(teacherActivity.id, sessionId))
      .limit(1);

    if (!session[0]) {
      throw new Error('Session not found');
    }

    const sessionDuration = Math.round(
      (updateData.sessionEnd.getTime() - session[0].sessionStart.getTime()) / (1000 * 60)
    );

    const updatedSession = await db
      .update(teacherActivity)
      .set({
        sessionEnd: updateData.sessionEnd,
        sessionDuration,
        classroomUpdates: updateData.classroomUpdates !== undefined
          ? updateData.classroomUpdates
          : session[0].classroomUpdates,
      })
      .where(eq(teacherActivity.id, sessionId))
      .returning();

    return updatedSession[0];
  } catch (error) {
    console.error('Error updating teacher session:', error);
    throw new Error('Failed to update teacher session');
  }
}

export async function getTopActiveTeachers(
  schoolId: string,
  limit: number = 5,
  period: 'week' | 'month' = 'week'
) {
  try {
    const periodDate = new Date();
    if (period === 'week') {
      periodDate.setDate(periodDate.getDate() - 7);
    } else {
      periodDate.setDate(periodDate.getDate() - 30);
    }

    const topTeachers = await db
      .select({
        userId: teacherActivity.userId,
        userName: users.name,
        userEmail: users.email,
        totalSessions: count(teacherActivity.id),
        totalDuration: sum(teacherActivity.sessionDuration),
        totalUpdates: sum(teacherActivity.classroomUpdates),
      })
      .from(teacherActivity)
      .leftJoin(users, eq(users.id, teacherActivity.userId))
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.activityDate, periodDate)
      ))
      .groupBy(teacherActivity.userId, users.name, users.email)
      .orderBy(desc(count(teacherActivity.id)))
      .limit(limit);

    return topTeachers.map(teacher => ({
      userId: teacher.userId,
      name: teacher.userName || 'Unknown Teacher',
      email: teacher.userEmail || '',
      totalSessions: teacher.totalSessions,
      totalDuration: Number(teacher.totalDuration) || 0,
      totalUpdates: Number(teacher.totalUpdates) || 0,
      averageSessionDuration: teacher.totalSessions > 0
        ? Math.round((Number(teacher.totalDuration) || 0) / teacher.totalSessions)
        : 0,
    }));
  } catch (error) {
    console.error('Error getting top active teachers:', error);
    throw new Error('Failed to get top active teachers');
  }
}

export async function getTeacherEngagementTrends(
  schoolId: string,
  days: number = 30
) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await db
      .select({
        activityDate: teacherActivity.activityDate,
        totalSessions: count(teacherActivity.id),
        uniqueTeachers: count(teacherActivity.userId), // This is an approximation
        totalUpdates: sum(teacherActivity.classroomUpdates),
      })
      .from(teacherActivity)
      .where(and(
        eq(teacherActivity.schoolId, parseInt(schoolId)),
        gte(teacherActivity.activityDate, startDate)
      ))
      .groupBy(teacherActivity.activityDate)
      .orderBy(teacherActivity.activityDate);

    return trends.map(trend => ({
      date: trend.activityDate,
      sessions: trend.totalSessions,
      uniqueTeachers: trend.uniqueTeachers,
      classroomUpdates: Number(trend.totalUpdates) || 0,
    }));
  } catch (error) {
    console.error('Error getting teacher engagement trends:', error);
    throw new Error('Failed to get teacher engagement trends');
  }
}

export async function calculateTeacherEngagementScore(schoolId: string): Promise<number> {
  try {
    const metrics = await getTeacherActivityMetrics(schoolId);

    if (metrics.totalTeachers === 0) {
      return 0;
    }

    // Calculate engagement score based on multiple factors
    const activeTeacherRatio = metrics.activeTeachers / metrics.totalTeachers;
    const avgLoginsPerTeacher = metrics.totalTeachers > 0 ? metrics.lastWeekLogins / metrics.totalTeachers : 0;
    const sessionQuality = Math.min(metrics.avgSessionDuration / 30, 1); // Cap at 30 minutes = 100%
    const contentCreation = Math.min(metrics.classroomUpdates / (metrics.totalTeachers * 5), 1); // 5 updates per teacher per week = 100%

    // Weighted engagement score
    const engagementScore = (
      activeTeacherRatio * 0.4 +
      Math.min(avgLoginsPerTeacher / 3, 1) * 0.3 + // 3 logins per week = 100%
      sessionQuality * 0.2 +
      contentCreation * 0.1
    ) * 100;

    return Math.round(engagementScore);
  } catch (error) {
    console.error('Error calculating teacher engagement score:', error);
    return 0;
  }
}