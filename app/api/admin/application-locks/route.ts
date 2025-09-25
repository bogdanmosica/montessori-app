import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { getMultipleApplicationLockStatus } from '../../../../lib/utils/application-locks';
import { ERROR_MESSAGES } from '../../../admin/applications/constants';

interface ApplicationLockApiResponse {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  action?: 'approve' | 'reject';
  isOwnLock?: boolean;
}

/**
 * POST /api/admin/application-locks
 * Check lock status for multiple applications
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
        },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
          },
        },
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    const { applicationIds } = requestBody;

    // Validate request
    if (!applicationIds || !Array.isArray(applicationIds)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'applicationIds must be an array',
            details: [
              {
                field: 'applicationIds',
                message: 'Application IDs array is required',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    if (applicationIds.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Too many application IDs requested',
            details: [
              {
                field: 'applicationIds',
                message: 'Maximum 100 applications can be checked at once',
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // Get lock statuses
    const lockStatuses = getMultipleApplicationLockStatus(applicationIds);

    // Transform lock statuses for client consumption
    const responseData: Record<string, ApplicationLockApiResponse> = {};

    Object.entries(lockStatuses).forEach(([applicationId, status]) => {
      responseData[applicationId] = {
        isLocked: status.locked,
        lockedBy: status.lock?.userName,
        lockedAt: status.lock?.lockedAt,
        action: status.lock?.action,
        isOwnLock: status.lock?.userId === parseInt(session.user.id),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking application locks:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/application-locks
 * Get all current locks (for monitoring/debugging)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user (super admin only for this endpoint)
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
        },
        { status: 401 }
      );
    }

    // Only super admins can view all locks
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Super admin access required',
          },
        },
        { status: 403 }
      );
    }

    const { getAllProcessingLocks } = await import('../../../../lib/utils/application-locks');
    const allLocks = getAllProcessingLocks();

    return NextResponse.json(
      {
        success: true,
        data: {
          locks: allLocks,
          count: allLocks.length,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error getting all application locks:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/application-locks
 * Force release locks (super admin only, for emergency situations)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate and authorize user (super admin only)
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
        },
        { status: 401 }
      );
    }

    // Only super admins can force release locks
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Super admin access required',
          },
        },
        { status: 403 }
      );
    }

    const requestBody = await request.json().catch(() => ({}));
    const { userId, applicationId } = requestBody;

    const { releaseAllUserLocks, releaseProcessingLock } = await import('../../../../lib/utils/application-locks');

    let releasedCount = 0;

    if (applicationId && userId) {
      // Release specific application lock for specific user
      const result = releaseProcessingLock(applicationId, userId);
      releasedCount = result.success ? 1 : 0;
    } else if (userId) {
      // Release all locks for specific user
      releasedCount = releaseAllUserLocks(userId);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required, optionally with applicationId for specific lock',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          releasedCount,
          message: `Released ${releasedCount} processing lock(s)`,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error force releasing application locks:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
      },
      { status: 500 }
    );
  }
}