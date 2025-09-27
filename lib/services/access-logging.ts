import { db } from '../db/drizzle';
import { adminAccessLogs } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { NewAdminAccessLog, AdminAccessLog } from '../db/schema';
import type { ACCESS_LOG_ACTION, ACCESS_LOG_TARGET_TYPE } from '../constants/access-log-actions';

export interface LogAdminActionData {
  schoolId: number;
  adminUserId: number;
  actionType: keyof typeof ACCESS_LOG_ACTION;
  targetType: keyof typeof ACCESS_LOG_TARGET_TYPE;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action for audit trail
 */
export async function logAdminAction(
  data: LogAdminActionData,
  tx?: any
): Promise<AdminAccessLog> {
  const dbInstance = tx || db;

  const logData: NewAdminAccessLog = {
    schoolId: data.schoolId,
    adminUserId: data.adminUserId,
    actionType: data.actionType as any, // Type assertion for enum compatibility
    targetType: data.targetType as any, // Type assertion for enum compatibility
    targetId: data.targetId,
    details: data.details ? JSON.stringify(data.details) : null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  };

  const results = await dbInstance
    .insert(adminAccessLogs)
    .values(logData)
    .returning();

  return results[0];
}

/**
 * Get access logs for a specific target
 */
export async function getAccessLogsForTarget(
  targetType: keyof typeof ACCESS_LOG_TARGET_TYPE,
  targetId: string,
  schoolId: number,
  limit: number = 50
): Promise<AdminAccessLog[]> {
  const results = await db
    .select()
    .from(adminAccessLogs)
    .where(
      and(
        eq(adminAccessLogs.targetType, targetType as any),
        eq(adminAccessLogs.targetId, targetId),
        eq(adminAccessLogs.schoolId, schoolId)
      )
    )
    .orderBy(desc(adminAccessLogs.timestamp))
    .limit(limit);

  return results;
}

/**
 * Get access logs for a specific admin user
 */
export async function getAccessLogsForAdmin(
  adminUserId: number,
  schoolId: number,
  limit: number = 100
): Promise<AdminAccessLog[]> {
  const results = await db
    .select()
    .from(adminAccessLogs)
    .where(
      and(
        eq(adminAccessLogs.adminUserId, adminUserId),
        eq(adminAccessLogs.schoolId, schoolId)
      )
    )
    .orderBy(desc(adminAccessLogs.timestamp))
    .limit(limit);

  return results;
}

/**
 * Get recent admin activity across the school
 */
export async function getRecentAdminActivity(
  schoolId: number,
  limit: number = 50
): Promise<(AdminAccessLog & { adminName?: string })[]> {
  // This would require joining with users table to get admin names
  // For now, return basic log data
  const results = await db
    .select()
    .from(adminAccessLogs)
    .where(eq(adminAccessLogs.schoolId, schoolId))
    .orderBy(desc(adminAccessLogs.timestamp))
    .limit(limit);

  return results;
}

/**
 * Validate log data before insertion
 */
export function validateLogData(data: Partial<LogAdminActionData>): string[] {
  const errors: string[] = [];

  if (!data.schoolId) {
    errors.push('School ID is required');
  }

  if (!data.adminUserId) {
    errors.push('Admin user ID is required');
  }

  if (!data.actionType) {
    errors.push('Action type is required');
  }

  if (!data.targetType) {
    errors.push('Target type is required');
  }

  if (!data.targetId || data.targetId.trim().length === 0) {
    errors.push('Target ID is required');
  }

  return errors;
}