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
  const isSuper = userRole === 'SUPER_ADMIN';
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
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];

  if (!allowedRoles.includes(userRole)) {
    throw new Error('Admin permissions required');
  }
}

export function requireSuperAdminPermissions(userRole: string): void {
  if (userRole !== 'SUPER_ADMIN') {
    throw new Error('Super Admin permissions required');
  }
}

export function canAccessSchoolData(userRole: string, userSchoolId: string, targetSchoolId: string): boolean {
  // Super Admin can access any school's data (aggregated)
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Admin can only access their own school's data
  if (userRole === 'ADMIN') {
    return userSchoolId === targetSchoolId;
  }

  return false;
}

export function shouldShowAggregatedView(userRole: string): boolean {
  return userRole === 'SUPER_ADMIN';
}

export function getMetricsCacheKey(userRole: string, schoolId?: string): string {
  if (userRole === 'SUPER_ADMIN') {
    return 'dashboard:metrics:super-admin';
  }

  return `dashboard:metrics:school:${schoolId}`;
}

export function getRateLimitKey(userId: string, userRole: string): string {
  const rolePrefix = userRole === 'SUPER_ADMIN' ? 'super-admin' : 'admin';
  return `rate-limit:dashboard:${rolePrefix}:${userId}`;
}