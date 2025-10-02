// Dashboard context and permissions helper
import { auth } from '@/lib/auth/config';
import type { DashboardContextValue } from '@/lib/types/dashboard';
import { UserRole } from '@/lib/constants/user-roles';

export async function getDashboardContext(): Promise<DashboardContextValue> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const userRole = session.user.role;
  const isSuper = false; // SUPER_ADMIN role removed
  const schoolId = isSuper ? undefined : session.user.schoolId;

  if (!isSuper && !schoolId) {
    throw new Error('School affiliation required for admin users');
  }

  return {
    isSuper,
    schoolId,
    refreshMetrics: async () => {
      // This will be implemented as a client-side function
      // when needed for real-time updates
    },
  };
}

export function requireAdminPermissions(userRole: string): void {
  if (userRole !== UserRole.ADMIN) {
    throw new Error('Admin permissions required');
  }
}

export function requireSuperAdminPermissions(userRole: string): void {
  // SUPER_ADMIN role removed - no users can access this
  throw new Error('Super Admin permissions not available');
}

export function canAccessSchoolData(userRole: string, userSchoolId: string, targetSchoolId: string): boolean {
  // Admin can only access their own school's data
  if (userRole === UserRole.ADMIN) {
    return userSchoolId === targetSchoolId;
  }

  return false;
}

export function shouldShowAggregatedView(userRole: string): boolean {
  return false; // No aggregated view without SUPER_ADMIN
}

export function getMetricsCacheKey(userRole: string, schoolId?: string): string {
  return `dashboard:metrics:school:${schoolId}`;
}

export function getRateLimitKey(userId: string, userRole: string): string {
  const rolePrefix = userRole === UserRole.ADMIN ? 'admin' : 'user';
  return `rate-limit:dashboard:${rolePrefix}:${userId}`;
}

/**
 * Log trend data access for audit trail
 * This tracks when admins access trend data for compliance and security
 */
export async function logTrendDataAccess(
  userId: string,
  schoolId: string,
  params: {
    trend: 'weekly' | 'custom';
    start_date?: string;
    end_date?: string;
    activity_types?: string[];
  }
): Promise<void> {
  try {
    // In production, this would write to adminAccessLogs table or audit service
    console.log('[AUDIT] Trend Data Access:', {
      timestamp: new Date().toISOString(),
      userId,
      schoolId,
      action: 'TREND_DATA_ACCESS',
      params: {
        trend: params.trend,
        dateRange: params.start_date && params.end_date
          ? `${params.start_date} to ${params.end_date}`
          : 'weekly',
        activityTypes: params.activity_types?.join(',') || 'all',
      },
    });

    // TODO: Implement actual database logging
    // const { db } = await import('@/lib/db');
    // const { adminAccessLogs } = await import('@/lib/db/schema');
    // await db.insert(adminAccessLogs).values({
    //   schoolId: parseInt(schoolId),
    //   adminUserId: parseInt(userId),
    //   actionType: 'TREND_DATA_ACCESS',
    //   targetType: 'TRENDS',
    //   targetId: `${params.trend}:${params.start_date || 'weekly'}`,
    //   details: JSON.stringify(params),
    // });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log trend data access:', error);
  }
}

/**
 * Check if user has permission to access trend data for specific school
 */
export function canAccessTrendData(
  userRole: string,
  userSchoolId: string,
  targetSchoolId: string
): boolean {
  // Same as general school data access
  return canAccessSchoolData(userRole, userSchoolId, targetSchoolId);
}