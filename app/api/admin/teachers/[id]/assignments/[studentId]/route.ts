import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherService } from '@/lib/services/teacher-service';
import { TEACHER_MESSAGES } from '@/lib/constants/teacher-constants';

/**
 * DELETE /api/admin/teachers/[id]/assignments/[studentId]
 * Remove student assignment from teacher
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const { id, studentId } = await params;

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

    // Remove assignment
    await TeacherService.removeAssignment(
      id,
      studentId,
      parseInt(schoolId)
    );

    return NextResponse.json({
      message: TEACHER_MESSAGES.ASSIGNMENT_REMOVED_SUCCESS,
    });

  } catch (error) {
    console.error('Error removing assignment:', error);

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
