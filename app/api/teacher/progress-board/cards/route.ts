/**
 * POST /api/teacher/progress-board/cards
 *
 * Create a new lesson progress card
 */

import { NextRequest, NextResponse } from 'next/server';
import { createProgressCard } from '@/lib/services/progress-card-service';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Parse request body
    const body = await request.json();
    const { lesson_id, student_ids, status } = body;

    // Validate required fields
    if (!lesson_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: lesson_id and status',
          },
        },
        { status: 400 }
      );
    }

    // Handle multiple students
    const studentIdsArray = Array.isArray(student_ids) ? student_ids : (student_ids ? [student_ids] : []);

    // If no students, create one unassigned card
    if (studentIdsArray.length === 0) {
      const card = await createProgressCard(
        {
          lesson_id,
          student_id: null,
          status,
        },
        teacher.schoolId,
        session.user.id,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: {
          id: card.id,
          lesson_id: card.lessonId,
          student_id: card.studentId,
          status: card.status,
          position: card.position,
          locked_by: card.lockedBy,
          locked_at: card.lockedAt,
          created_at: card.createdAt,
          updated_at: card.updatedAt,
        },
      }, { status: 201 });
    }

    // Create a card for each student
    const cards = await Promise.all(
      studentIdsArray.map(student_id =>
        createProgressCard(
          {
            lesson_id,
            student_id,
            status,
          },
          teacher.schoolId,
          session.user.id,
          session.user.id
        )
      )
    );

    // Return data for all created cards
    return NextResponse.json({
      success: true,
      data: cards.map(card => ({
        id: card.id,
        lesson_id: card.lessonId,
        student_id: card.studentId,
        status: card.status,
        position: card.position,
        locked_by: card.lockedBy,
        locked_at: card.lockedAt,
        created_at: card.createdAt,
        updated_at: card.updatedAt,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating progress card:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (errorMessage.includes('Lesson already assigned')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ASSIGNMENT',
            message: errorMessage,
          },
        },
        { status: 409 }
      );
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: errorMessage,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create progress card',
        },
      },
      { status: 500 }
    );
  }
}
