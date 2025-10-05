import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getLessons, createLesson } from '@/lib/services/lesson-service';
import { createLessonSchema, lessonQuerySchema } from '@/lib/validations/lesson-schemas';
import { logLessonAction } from '@/lib/utils/lesson-logger';
import { ACCESS_LOG_ACTION } from '@/lib/constants/access-log-actions';
import { LESSON_ERROR_MESSAGES } from '@/lib/constants/lessons';

/**
 * GET /api/lessons
 * List lessons with role-based filtering and optional search/category filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;

    // Verify user has a school/team
    if (!user.teamId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Validate query
    const validatedQuery = lessonQuerySchema.parse(queryData);

    // Get lessons with role-based filtering
    const lessonsList = await getLessons(
      user.teamId,
      user.id,
      user.role,
      validatedQuery
    );

    return NextResponse.json({
      success: true,
      data: lessonsList,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lessons',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lessons
 * Create a new lesson (Admin/Teacher only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { user } = session;

    // Verify user is Admin or Teacher
    if (user.role !== 'admin' && user.role !== 'teacher') {
      return NextResponse.json(
        { error: LESSON_ERROR_MESSAGES.UNAUTHORIZED },
        { status: 403 }
      );
    }

    // Verify user has a school/team
    if (!user.teamId) {
      return NextResponse.json(
        { error: 'No school associated with user' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createLessonSchema.parse(body);

    // Teachers can only create private lessons, admins can create any visibility
    if (user.role === 'teacher' && validatedData.visibility === 'admin_global') {
      return NextResponse.json(
        { error: 'Teachers can only create private lessons' },
        { status: 403 }
      );
    }

    // Create lesson
    const newLesson = await createLesson(validatedData, user.teamId, user.id);

    // Log the action
    await logLessonAction(
      ACCESS_LOG_ACTION.LESSON_CREATED,
      user.id,
      user.teamId,
      '/api/lessons',
      true,
      request.headers.get('user-agent')
    );

    return NextResponse.json(
      {
        success: true,
        data: newLesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lesson:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: LESSON_ERROR_MESSAGES.CREATION_FAILED,
      },
      { status: 500 }
    );
  }
}
