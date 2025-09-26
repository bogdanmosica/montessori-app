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