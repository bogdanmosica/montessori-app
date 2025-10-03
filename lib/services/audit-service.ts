import { db } from '@/lib/db/drizzle';
import { accessLogs } from '@/lib/db/schema';
import { AccessLogService } from './access-log-service';

/**
 * Audit Service
 *
 * Handles access logging for attendance-related actions.
 * Integrates with existing access log system.
 */

/**
 * Log attendance creation
 */
export async function logAttendanceCreate(params: {
  userId: number;
  tenantId: number;
  studentId: string;
  date: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await AccessLogService.logAccess({
      userId: params.userId,
      teamId: params.tenantId,
      route: '/api/teacher/attendance',
      success: true,
      metadata: {
        action: 'ATTENDANCE_CREATED',
        studentId: params.studentId,
        date: params.date,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log attendance creation:', error);
    // Don't throw - logging errors should not break the main flow
  }
}

/**
 * Log attendance update
 */
export async function logAttendanceUpdate(params: {
  userId: number;
  tenantId: number;
  attendanceId: string;
  changes: { status?: string; notes?: string | null };
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await AccessLogService.logAccess({
      userId: params.userId,
      teamId: params.tenantId,
      route: `/api/teacher/attendance/${params.attendanceId}`,
      success: true,
      metadata: {
        action: 'ATTENDANCE_UPDATED',
        attendanceId: params.attendanceId,
        changes: params.changes,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log attendance update:', error);
  }
}

/**
 * Log attendance deletion
 */
export async function logAttendanceDelete(params: {
  userId: number;
  tenantId: number;
  attendanceId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await AccessLogService.logAccess({
      userId: params.userId,
      teamId: params.tenantId,
      route: `/api/teacher/attendance/${params.attendanceId}`,
      success: true,
      metadata: {
        action: 'ATTENDANCE_DELETED',
        attendanceId: params.attendanceId,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log attendance deletion:', error);
  }
}

/**
 * Log attendance view/access
 */
export async function logAttendanceView(params: {
  userId: number;
  tenantId: number;
  date: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await AccessLogService.logAccess({
      userId: params.userId,
      teamId: params.tenantId,
      route: '/api/teacher/attendance',
      success: true,
      metadata: {
        action: 'ATTENDANCE_VIEWED',
        date: params.date,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error('Failed to log attendance view:', error);
  }
}
