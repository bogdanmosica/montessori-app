/**
 * PATCH /api/teacher/progress-board/cards/[id]
 * DELETE /api/teacher/progress-board/cards/[id]
 *
 * Update or delete a lesson progress card
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteProgressCard, updateProgressCard } from '@/lib/services/progress-card-service';
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
    const body = await request.json();

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

    // Check if card is locked by another user
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

    // Update the card
    const updatedCard = await updateProgressCard(
      cardId,
      teacher.schoolId,
      body,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: updatedCard,
    });
  } catch (error) {
    console.error('Error updating progress card:', error);

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
          message: 'Failed to update card',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if card is locked by another user
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

    // Delete the card
    await deleteProgressCard(
      cardId,
      teacher.schoolId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        deleted_id: cardId,
      },
    });
  } catch (error) {
    console.error('Error deleting progress card:', error);

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
          message: 'Failed to delete card',
        },
      },
      { status: 500 }
    );
  }
}
