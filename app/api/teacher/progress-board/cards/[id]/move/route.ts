/**
 * PATCH /api/teacher/progress-board/cards/[id]/move
 *
 * Move a card to a different status column
 */

import { NextRequest, NextResponse } from 'next/server';
import { moveProgressCard } from '@/lib/services/progress-card-service';
import { isCardLocked } from '@/lib/services/card-lock-service';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;

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
    const { new_status, new_position, version } = body;

    // Validate required fields
    if (!new_status || new_position === undefined || !version) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: new_status, new_position, version',
          },
        },
        { status: 400 }
      );
    }

    // Check if card is locked
    const locked = await isCardLocked(cardId, teacher.schoolId);
    if (locked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CARD_LOCKED',
            message: 'Card is locked by another user',
          },
        },
        { status: 409 }
      );
    }

    // Move the card
    const updatedCard = await moveProgressCard(
      cardId,
      new_status,
      new_position,
      teacher.schoolId,
      session.user.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCard.id,
        lesson_id: updatedCard.lessonId,
        student_id: updatedCard.studentId,
        status: updatedCard.status,
        position: updatedCard.position,
        locked_by: updatedCard.lockedBy,
        locked_at: updatedCard.lockedAt,
        updated_at: updatedCard.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error moving progress card:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CARD_NOT_FOUND',
            message: 'Card not found',
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
          message: 'Failed to move card',
        },
      },
      { status: 500 }
    );
  }
}
