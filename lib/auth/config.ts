// Basic auth config for dashboard implementation
import type { ExtendedSession } from '@/lib/types/auth';
import { UserRole } from '@/lib/constants/user-roles';

// Mock auth function for development/demo purposes
// In production, this would integrate with NextAuth.js or similar
export async function auth(): Promise<{ user: ExtendedSession['user'] } | null> {
  // For demo purposes, return a mock admin user
  // In production, this would validate actual session tokens
  return {
    user: {
      id: '1',
      email: 'admin@testschool.edu',
      name: 'Admin User',
      role: UserRole.ADMIN,
      teamId: 1,
      schoolId: '1',
      sessionVersion: 1,
    }
  };
}

// SUPER_ADMIN role has been removed from the system