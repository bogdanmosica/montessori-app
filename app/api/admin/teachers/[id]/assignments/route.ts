import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { TeacherService } from '@/lib/services/teacher-service';
import { assignStudentsSchema } from '@/lib/validations/teacher-schemas';
import { TEACHER_MESSAGES } from '@/lib/constants/teacher-constants';

/**
 * POST /api/admin/teachers/[id]/assignments
 * Assign students to a teacher
 */
export async function POST(
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
    const { studentIds } = assignStudentsSchema.parse(body);

    // Assign students to teacher
    const assignments = await TeacherService.assignStudents(
      id,
      studentIds,
      parseInt(schoolId)
    );

    return NextResponse.json(
      {
        assignments,
        message: TEACHER_MESSAGES.STUDENTS_ASSIGNED_SUCCESS(assignments.length),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error assigning students:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    // Handle not found
    if (error instanceof Error && error.message === 'Teacher not found') {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    // Handle students not found
    if (error instanceof Error && error.message.includes('students not found')) {
      return NextResponse.json(
        { error: TEACHER_MESSAGES.STUDENTS_NOT_FOUND },
        { status: 400 }
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
