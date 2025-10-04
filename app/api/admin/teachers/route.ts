import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherService } from '@/lib/services/teacher-service';
import { createTeacherSchema } from '@/lib/validations/teacher-schemas';
import { TEACHER_MESSAGES } from '@/lib/constants/teacher-constants';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/teachers
 * Get list of teachers for the admin's school
 */
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
        { error: TEACHER_MESSAGES.UNAUTHORIZED },
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const includeInactive = searchParams.get('includeInactive') === 'true';

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

    // Fetch teachers
    const result = await TeacherService.getTeachers(parseInt(schoolId), {
      page,
      limit,
      search,
      includeInactive,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching teachers:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher
 */
export async function POST(request: NextRequest) {
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
        { error: TEACHER_MESSAGES.UNAUTHORIZED },
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTeacherSchema.parse(body);

    // Hash the provided password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create teacher
    const teacher = await TeacherService.createTeacher(
      {
        ...validatedData,
        password: hashedPassword,
      },
      parseInt(schoolId)
    );

    return NextResponse.json(
      {
        teacher,
        message: TEACHER_MESSAGES.CREATED_SUCCESS,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating teacher:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.ALREADY_EXISTS },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
