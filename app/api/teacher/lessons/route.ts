/**
 * GET /api/teacher/lessons
 *
 * Retrieve all lessons available for the authenticated teacher's school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { lessons } from '@/lib/db/schema/lessons';
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

    // Get lessons for the school
    const schoolLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        category: lessons.category,
        estimatedDuration: lessons.estimatedDuration,
        difficultyLevel: lessons.difficultyLevel,
        isTemplate: lessons.isTemplate,
      })
      .from(lessons)
      .where(eq(lessons.schoolId, teacher.schoolId))
      .orderBy(lessons.category, lessons.title);

    return NextResponse.json({
      success: true,
      data: schoolLessons,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch lessons',
        },
      },
      { status: 500 }
    );
  }
}