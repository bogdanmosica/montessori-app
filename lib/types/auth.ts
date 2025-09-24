import { UserRole } from '@/lib/constants/user-roles';

/**
 * Extended session interface with role-based access control
 * Follows Monte SMS Constitution: typed interfaces, no hardcoding
 */

export interface ExtendedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  teamId: number | null;
  sessionVersion: number;
}

export interface ExtendedSession {
  user: ExtendedUser;
  expires: string;
}

export interface ExtendedJWT {
  sub: string; // user ID
  email: string;
  name: string;
  role: UserRole;
  teamId: number | null;
  sessionVersion: number;
  exp?: number;
  iat?: number;
}

/**
 * Session validation result for middleware
 */
export interface SessionValidationResult {
  isAuthenticated: boolean;
  user?: ExtendedUser;
  hasRequiredRole: (requiredRole: UserRole) => boolean;
  isSessionVersionValid: boolean;
  error?: 'UNAUTHENTICATED' | 'SESSION_EXPIRED' | 'INVALID_SESSION_VERSION' | 'INSUFFICIENT_PERMISSIONS';
}

/**
 * Role permission matrix
 */
export interface RolePermissions {
  canAccessAdminRoutes: boolean;
  canAssignRoles: boolean;
  canViewAccessLogs: boolean;
  canManageTeamMembers: boolean;
}

/**
 * Route protection configuration
 */
export interface RouteProtectionConfig {
  pattern: string;
  requiredRole: UserRole;
  redirectOnFail: string;
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  user: ExtendedUser;
  expiresIn?: string; // e.g., '1 day', '7 days'
  rememberMe?: boolean;
}

/**
 * Access log context for session tracking
 */
export interface SessionAccessContext {
  userId: number;
  teamId: number;
  sessionVersion: number;
  route: string;
  userAgent?: string;
  ipAddress?: string;
}