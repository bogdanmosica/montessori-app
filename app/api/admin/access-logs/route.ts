import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { AccessLogService } from '@/lib/services/access-log-service';
import { UserRole } from '@/lib/constants/user-roles';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      );
    }

    // Get user's team for multi-tenant isolation
    const userWithTeam = await getUserWithTeam(currentUser.id);
    const teamId = userWithTeam?.teamId;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a team', code: 'NO_TEAM' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined;
    const successParam = searchParams.get('success');
    const success = successParam ? successParam === 'true' : undefined;

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { success: false, error: 'Page must be >= 1', code: 'INVALID_PAGE' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 200) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 200', code: 'INVALID_LIMIT' },
        { status: 400 }
      );
    }

    // Get access logs
    const result = await AccessLogService.getAccessLogs({
      teamId,
      page,
      limit,
      userId,
      success,
    });

    // Format logs with user names for display
    const formattedLogs = result.logs.map(log => ({
      id: log.id,
      userId: log.userId?.toString() || null,
      userName: 'Unknown User', // TODO: Join with users table for names
      route: log.route,
      success: log.success,
      timestamp: log.timestamp.toISOString(),
      userAgent: log.userAgent,
      ipAddress: log.ipAddress,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: result.pagination,
      },
    });

  } catch (error) {
    console.error('Error fetching access logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}