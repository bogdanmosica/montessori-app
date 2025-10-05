import { db } from '@/lib/db/drizzle';
import { accessLogs } from '@/lib/db/schema';
import { ACCESS_LOG_ACTION } from '@/lib/constants/access-log-actions';

/**
 * Log lesson action to access logs
 */
export async function logLessonAction(
  action: typeof ACCESS_LOG_ACTION[keyof typeof ACCESS_LOG_ACTION],
  userId: number,
  schoolId: number,
  route: string,
  success: boolean = true,
  userAgent?: string | null
) {
  try {
    await db.insert(accessLogs).values({
      userId,
      teamId: schoolId,
      route,
      success,
      userAgent: userAgent || undefined,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log lesson action:', error);
    // Don't throw - logging should not break the main flow
  }
}
