import { NextRequest, NextResponse } from 'next/server';
import { getApplicationsList } from '@/lib/services/application-queries';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    const search = searchParams.get('search');

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate status parameter
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
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

    // Fetch applications
    const result = await getApplicationsList({
      schoolId: parseInt(schoolId),
      page,
      limit,
      status: status || undefined,
      search: search || undefined,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching applications:', error);

    if (error instanceof Error) {
      // Handle known validation errors
      if (error.message.includes('Page must be') || error.message.includes('Limit must be')) {
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