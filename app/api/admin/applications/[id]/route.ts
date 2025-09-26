import { NextRequest, NextResponse } from 'next/server';
import { getApplicationDetail } from '@/lib/services/application-queries';
import { logAdminAction } from '@/lib/services/access-logging';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    // Get school ID from session (multi-tenant scoping)
    const schoolId = session.user.schoolId || session.user.teamId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School association required' },
        { status: 403 }
      );
    }

    const applicationId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid application ID format' },
        { status: 400 }
      );
    }

    // Fetch application detail
    const application = await getApplicationDetail(applicationId, parseInt(schoolId));

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Log the view action for audit trail
    try {
      await logAdminAction({
        schoolId: parseInt(schoolId),
        adminUserId: parseInt(session.user.id),
        actionType: 'APPLICATION_VIEWED',
        targetType: 'APPLICATION',
        targetId: applicationId,
        details: {
          viewed_at: new Date().toISOString(),
        },
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    } catch (logError) {
      // Log error but don't fail the request
      console.error('Failed to log application view:', logError);
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error fetching application detail:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}