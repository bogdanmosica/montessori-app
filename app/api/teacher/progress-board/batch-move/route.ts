/**
 * POST /api/teacher/progress-board/batch-move
 *
 * Move multiple cards in a single transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeBatchMove, validateBatchMoves } from '@/lib/services/batch-move-service';
import { getSession } from '@/lib/auth/session';

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

    // Parse request body
    const body = await request.json();
    const { moves } = body;

    // Validate moves array
    if (!moves || !Array.isArray(moves)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid moves array',
          },
        },
        { status: 400 }
      );
    }

    // Validate batch moves
    const validation = validateBatchMoves(moves);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Batch move validation failed',
            details: {
              errors: validation.errors,
            },
          },
        },
        { status: 400 }
      );
    }

    // Execute batch move
    const result = await executeBatchMove(
      moves,
      session.user.teamId!,
      session.user.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error executing batch move:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to execute batch move',
        },
      },
      { status: 500 }
    );
  }
}
