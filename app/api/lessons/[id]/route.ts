import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getLessonById,
  updateLesson,
  deleteLesson,
} from '@/lib/services/lesson-service';
import { updateLessonSchema } from '@/lib/validations/lesson-schemas';
import { logLessonAction } from '@/lib/utils/lesson-logger';
import { ACCESS_LOG_ACTION } from '@/lib/constants/access-log-actions';
import { LESSON_ERROR_MESSAGES } from '@/lib/constants/lessons';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/lessons/[id]
 * Get a single lesson by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { user } = session;
    const { id } = await params;

    if (!user.teamId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
      );
    }

    const lesson = await getLessonById(id, user.teamId, user.id, user.role);

    if (!lesson) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    // Log the view action
    await logLessonAction(
      ACCESS_LOG_ACTION.LESSON_VIEWED,
      user.id,
      user.teamId,
      `/api/lessons/${id}`,
      true,
      request.headers.get('user-agent')
    );

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lessons/[id]
 * Update a lesson (Admin/Teacher creator only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { user } = session;
    const { id } = await params;

    // Verify user is Admin or Teacher
    if (user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 403 }
      );
    }

    if (!user.teamId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateLessonSchema.parse(body);

    // Teachers can't change visibility to admin_global
    if (
      user.role === 'teacher' &&
      validatedData.visibility === 'admin_global'
    ) {
      return NextResponse.json(
        { error: 'Teachers cannot create global lessons' },
        { status: 403 }
      );
    }

    // Update lesson (RBAC enforced in service)
    const updatedLesson = await updateLesson(
      id,
      validatedData,
      user.teamId,
      user.id,
      user.role
    );

    if (!updatedLesson) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    // Log the action
    await logLessonAction(
      ACCESS_LOG_ACTION.LESSON_UPDATED,
      user.id,
      user.teamId,
      `/api/lessons/${id}`,
      true,
      request.headers.get('user-agent')
    );

    return NextResponse.json({
      success: true,
      data: updatedLesson,
    });
  } catch (error) {
    console.error('Error updating lesson:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: LESSON_ERROR_MESSAGES.UPDATE_FAILED },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lessons/[id]
 * Delete a lesson (Admin/Teacher creator only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { user } = session;
    const { id } = await params;

    // Verify user is Admin or Teacher
    if (user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 403 }
      );
    }

    if (!user.teamId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
      );
    }

    // Delete lesson (RBAC enforced in service)
    const deletedLesson = await deleteLesson(
      id,
      user.teamId,
      user.id,
      user.role
    );

    if (!deletedLesson) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    // Log the action
    await logLessonAction(
      ACCESS_LOG_ACTION.LESSON_DELETED,
      user.id,
      user.teamId,
      `/api/lessons/${id}`,
      true,
      request.headers.get('user-agent')
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: LESSON_ERROR_MESSAGES.DELETE_FAILED },
      { status: 500 }
    );
  }
}
