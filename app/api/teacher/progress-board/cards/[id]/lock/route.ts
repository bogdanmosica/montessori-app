/**
 * POST /api/teacher/progress-board/cards/[id]/lock
 * DELETE /api/teacher/progress-board/cards/[id]/lock
 *
 * Lock and unlock a card for editing
 */

import { NextRequest, NextResponse } from 'next/server';
import { lockCard, unlockCard } from '@/lib/services/card-lock-service';
import { getSession } from '@/lib/auth/session';

/**
 * Lock a card
 */
export async function POST(
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

    // Attempt to lock the card
    const result = await lockCard(
      cardId,
      session.user.id,
      session.user.teamId!
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CARD_LOCKED',
            message: result.error || 'Card is already locked',
            details: {
              locked_by: result.locked_by,
              locked_at: result.locked_at,
              expires_at: result.expires_at,
            },
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cardId,
        locked_by: result.locked_by,
        locked_at: result.locked_at,
        expires_at: result.expires_at,
      },
    });
  } catch (error) {
    console.error('Error locking card:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lock card',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Unlock a card
 */
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

    // Attempt to unlock the card
    const result = await unlockCard(
      cardId,
      session.user.id,
      session.user.teamId!
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNLOCK_FAILED',
            message: result.error || 'Failed to unlock card',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cardId,
        locked_by: null,
        locked_at: null,
      },
    });
  } catch (error) {
    console.error('Error unlocking card:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unlock card',
        },
      },
      { status: 500 }
    );
  }
}
