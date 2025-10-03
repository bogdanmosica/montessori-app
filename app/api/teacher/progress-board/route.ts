/**
 * GET /api/teacher/progress-board
 *
 * Retrieve all lesson progress cards for the authenticated teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProgressBoardData, getFilterOptions } from '@/lib/services/progress-board-service';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Verify teacher role
    if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Teacher role required',
          },
        },
        { status: 403 }
      );
    }

    // Get teacher record to find correct schoolId
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, session.user.id),
    });

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Teacher record not found',
          },
        },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const filters = {
      student_id,
      category,
      status,
    };

    // Get progress board data
    const columns = await getProgressBoardData(
      teacher.schoolId,
      session.user.id,
      filters
    );

    // Get filter options
    const filterOptions = await getFilterOptions(
      teacher.schoolId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        columns,
        filters: filterOptions,
      },
    });
  } catch (error) {
    console.error('Error fetching progress board:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch progress board data',
        },
      },
      { status: 500 }
    );
  }
}
