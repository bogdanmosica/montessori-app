import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { UserRole } from '@/lib/constants/user-roles';
import { ExtendedSession, ExtendedUser, SessionValidationResult } from '@/lib/types/auth';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

// Legacy type for backward compatibility
type SessionData = ExtendedSession;

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload as any) // Cast to any to satisfy JWTPayload
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: NewUser & { teamId?: number | null; name?: string }) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: {
      id: user.id!.toString(),
      email: user.email,
      name: user.name || '',
      role: (user.role as UserRole) || UserRole.PARENT,
      teamId: user.teamId || null,
      sessionVersion: user.sessionVersion || 1,
    },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

/**
 * Validate session with role-based access control
 * Returns structured validation result
 */
export async function validateSessionForRole(requiredRole?: UserRole): Promise<SessionValidationResult> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return {
        isAuthenticated: false,
        hasRequiredRole: () => false,
        isSessionVersionValid: false,
        error: 'UNAUTHENTICATED',
      };
    }

    const hasRequiredRole = (role: UserRole) => {
      if (!requiredRole) return true;
      return session.user.role === role;
    };

    // TODO: Add session version validation against database
    const isSessionVersionValid = true; // For now, assume valid

    return {
      isAuthenticated: true,
      user: session.user,
      hasRequiredRole,
      isSessionVersionValid,
    };

  } catch (error) {
    return {
      isAuthenticated: false,
      hasRequiredRole: () => false,
      isSessionVersionValid: false,
      error: 'INVALID_SESSION_VERSION',
    };
  }
}
