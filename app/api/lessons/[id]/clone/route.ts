import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { cloneLesson } from '@/lib/services/lesson-service';
import { logLessonAction } from '@/lib/utils/lesson-logger';
import { ACCESS_LOG_ACTION } from '@/lib/constants/access-log-actions';
import { LESSON_ERROR_MESSAGES } from '@/lib/constants/lessons';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/lessons/[id]/clone
 * Clone a global lesson to create a private copy (Teacher only)
 */
export async function POST(
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

    // Clone the lesson
    const clonedLesson = await cloneLesson(id, user.teamId, user.id);

    if (!clonedLesson) {
      return NextResponse.json(
        { error: 'Lesson not found or not available for cloning' },
        { status: 404 }
      );
    }

    // Log the action
    await logLessonAction(
      ACCESS_LOG_ACTION.LESSON_CLONED,
      user.id,
      user.teamId,
      `/api/lessons/${id}/clone`,
      true,
      request.headers.get('user-agent')
    );

    return NextResponse.json(
      {
        success: true,
        data: clonedLesson,
        message: 'Lesson cloned successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error cloning lesson:', error);
    return NextResponse.json(
      { error: 'Failed to clone lesson' },
      { status: 500 }
    );
  }
}
