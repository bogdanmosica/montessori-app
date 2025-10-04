import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherService } from '@/lib/services/teacher-service';
import { updateTeacherSchema } from '@/lib/validations/teacher-schemas';
import { TEACHER_MESSAGES } from '@/lib/constants/teacher-constants';

/**
 * GET /api/admin/teachers/[id]
 * Get specific teacher details with assigned students
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Fetch teacher
    const result = await TeacherService.getTeacherById(id, parseInt(schoolId));

    if (!result) {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching teacher:', error);

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
 * PUT /api/admin/teachers/[id]
 * Update teacher information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const validatedData = updateTeacherSchema.parse(body);

    // Update teacher
    const teacher = await TeacherService.updateTeacher(
      id,
      parseInt(schoolId),
      validatedData
    );

    return NextResponse.json({
      teacher,
      message: TEACHER_MESSAGES.UPDATED_SUCCESS,
    });

  } catch (error) {
    console.error('Error updating teacher:', error);

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

    // Handle not found
    if (error instanceof Error && error.message === 'Teacher not found') {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.NOT_FOUND },
        { status: 404 }
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

/**
 * DELETE /api/admin/teachers/[id]
 * Soft delete teacher (mark as inactive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Delete teacher (soft delete)
    const result = await TeacherService.deleteTeacher(id, parseInt(schoolId));

    return NextResponse.json({
      teacher: result,
      message: TEACHER_MESSAGES.DELETED_SUCCESS,
    });

  } catch (error) {
    console.error('Error deleting teacher:', error);

    // Handle not found
    if (error instanceof Error && error.message === 'Teacher not found') {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.NOT_FOUND },
        { status: 404 }
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
