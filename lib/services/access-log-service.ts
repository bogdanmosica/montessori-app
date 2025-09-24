import { db } from '@/lib/db/drizzle';
import { accessLogs, NewAccessLog } from '@/lib/db/schema';
import { UserRole } from '@/lib/constants/user-roles';
import { eq, count, desc, lt, and } from 'drizzle-orm';

export interface AccessLogEntry {
  userId?: number;
  teamId?: number;
  route: string;
  success: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export class AccessLogService {
  /**
   * Log an access attempt asynchronously to prevent blocking requests
   * Following Monte SMS Constitution: micro functions, async operations
   */
  static async logAccess(entry: AccessLogEntry): Promise<void> {
    try {
      // Async logging - don't await to prevent blocking the request
      setImmediate(async () => {
        await this.createLogEntry(entry);
      });
    } catch (error) {
      // Log error but don't throw to prevent blocking requests
      console.error('Failed to log access attempt:', error);
    }
  }

  /**
   * Create access log entry in database
   * Multi-tenant scoped by teamId
   */
  private static async createLogEntry(entry: AccessLogEntry): Promise<void> {
    const logData: NewAccessLog = {
      userId: entry.userId || null,
      teamId: entry.teamId || null,
      route: entry.route,
      success: entry.success,
      userAgent: entry.userAgent || null,
      ipAddress: entry.ipAddress || null,
    };

    await db.insert(accessLogs).values(logData);
  }

  /**
   * Get access logs with pagination (admin only)
   * Tenant-scoped for multi-tenant isolation
   */
  static async getAccessLogs(params: {
    teamId: number;
    page?: number;
    limit?: number;
    userId?: number;
    success?: boolean;
  }) {
    const { teamId, page = 1, limit = 50, userId, success } = params;
    const offset = (page - 1) * Math.min(limit, 200); // Enforce max limit of 200

    // Build where conditions
    const conditions = [eq(accessLogs.teamId, teamId)];

    if (userId) {
      conditions.push(eq(accessLogs.userId, userId));
    }
    if (success !== undefined) {
      conditions.push(eq(accessLogs.success, success));
    }

    const query = db
      .select({
        id: accessLogs.id,
        userId: accessLogs.userId,
        route: accessLogs.route,
        success: accessLogs.success,
        timestamp: accessLogs.timestamp,
        userAgent: accessLogs.userAgent,
        ipAddress: accessLogs.ipAddress,
      })
      .from(accessLogs)
      .where(and(...conditions));

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(...conditions));

    const [logs, totalResult] = await Promise.all([
      query
        .orderBy(desc(accessLogs.timestamp))
        .limit(Math.min(limit, 200))
        .offset(offset),
      totalQuery
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Clean up old access logs (for maintenance)
   * Keep last 90 days by default
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .delete(accessLogs)
      .where(lt(accessLogs.timestamp, cutoffDate));

    return result.length || 0;
  }
}