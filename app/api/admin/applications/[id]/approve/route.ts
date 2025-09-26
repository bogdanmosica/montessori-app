import { NextRequest, NextResponse } from 'next/server';
import { approveApplication } from '@/lib/services/application-processing';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';

export async function POST(
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

    // Approve the application
    const result = await approveApplication(
      applicationId,
      parseInt(session.user.id),
      parseInt(schoolId)
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error approving application:', error);

    if (error instanceof Error) {
      // Handle known business logic errors
      if (error.message === 'Application not found') {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      if (error.message === 'Application already processed') {
        return NextResponse.json(
          {
            error: 'Application already processed',
            message: 'This application has already been approved or rejected and cannot be processed again.'
          },
          { status: 409 }
        );
      }

      // Handle validation errors
      if (error.message.includes('required') || error.message.includes('invalid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}