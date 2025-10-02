import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';

/**
 * Redirect to sign-in page
 */
export function redirectToSignIn(): never {
  redirect('/sign-in');
}

/**
 * Redirect to unauthorized page
 */
export function redirectToUnauthorized(): never {
  redirect('/unauthorized');
}

/**
 * Redirect based on user role
 */
export function redirectByRole(role: UserRole): never {
  switch (role) {
    case UserRole.ADMIN:
      redirect('/admin/dashboard');
    case UserRole.TEACHER:
      redirect('/teacher/dashboard');
    case UserRole.PARENT:
      redirect('/dashboard');
    default:
      redirect('/unauthorized');
  }
}

/**
 * Validate role and redirect if unauthorized
 */
export function requireRole(
  currentRole: UserRole | undefined,
  requiredRole: UserRole
): void {
  if (!currentRole) {
    redirectToSignIn();
  }
  if (currentRole !== requiredRole) {
    redirectToUnauthorized();
  }
}

/**
 * Require Teacher role or redirect
 */
export function requireTeacherRole(currentRole: UserRole | undefined): void {
  requireRole(currentRole, UserRole.TEACHER);
}

/**
 * Require Admin role or redirect
 */
export function requireAdminRole(currentRole: UserRole | undefined): void {
  requireRole(currentRole, UserRole.ADMIN);
}
