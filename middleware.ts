import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { UserRole } from '@/lib/constants/user-roles';
import { AccessLogService } from '@/lib/services/access-log-service';

const protectedRoutes = '/dashboard';
const adminRoutes = '/admin';
const teacherRoutes = '/teacher';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isAdminRoute = pathname.startsWith(adminRoutes);
  const isTeacherRoute = pathname.startsWith(teacherRoutes);

  // Handle admin route protection first
  if (isAdminRoute) {
    try {
      if (!sessionCookie) {
        // Unauthenticated user trying to access admin route
        await logAccessAttempt({
          request,
          userId: null,
          teamId: null,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      const session = await verifyToken(sessionCookie.value);

      if (!session?.user) {
        // Invalid session
        await logAccessAttempt({
          request,
          userId: null,
          teamId: null,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      const { user } = session;

      // Check if user has admin role
      if (user.role !== UserRole.ADMIN) {
        // Non-admin user trying to access admin route
        await logAccessAttempt({
          request,
          userId: user.id,
          teamId: user.teamId,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Admin user accessing admin route - log successful access
      await logAccessAttempt({
        request,
        userId: user.id,
        teamId: user.teamId,
        route: pathname,
        success: true,
      });

      // Continue with session refresh logic below
    } catch (error) {
      console.error('Admin route middleware error:', error);

      await logAccessAttempt({
        request,
        userId: null,
        teamId: null,
        route: pathname,
        success: false,
      });

      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Handle teacher route protection
  if (isTeacherRoute) {
    try {
      if (!sessionCookie) {
        // Unauthenticated user trying to access teacher route
        await logAccessAttempt({
          request,
          userId: null,
          teamId: null,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      const session = await verifyToken(sessionCookie.value);

      if (!session?.user) {
        // Invalid session
        await logAccessAttempt({
          request,
          userId: null,
          teamId: null,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      const { user } = session;

      // Check if user has teacher role (admins can also access for testing/management)
      if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
        // Non-teacher/non-admin user trying to access teacher route
        await logAccessAttempt({
          request,
          userId: user.id,
          teamId: user.teamId,
          route: pathname,
          success: false,
        });

        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Teacher/Admin user accessing teacher route - log successful access
      await logAccessAttempt({
        request,
        userId: user.id,
        teamId: user.teamId,
        route: pathname,
        success: true,
      });

      // Continue with session refresh logic below
    } catch (error) {
      console.error('Teacher route middleware error:', error);

      await logAccessAttempt({
        request,
        userId: null,
        teamId: null,
        route: pathname,
        success: false,
      });

      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // Handle general protected routes
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  // Session refresh logic
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute || isAdminRoute || isTeacherRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

async function logAccessAttempt({
  request,
  userId,
  teamId,
  route,
  success,
}: {
  request: NextRequest;
  userId: number | null;
  teamId: number | null;
  route: string;
  success: boolean;
}) {
  try {
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = getClientIP(request);

    await AccessLogService.logAccess({
      userId: userId || undefined,
      teamId: teamId || undefined,
      route,
      success,
      userAgent,
      ipAddress,
    });
  } catch (error) {
    // Don't let logging errors break the middleware
    console.error('Failed to log access attempt:', error);
  }
}

function getClientIP(request: NextRequest): string | undefined {
  // Try various headers to get real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // No fallback IP available in edge runtime
  return undefined;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
