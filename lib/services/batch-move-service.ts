/**
 * Batch Move Service
 *
 * Handles batch operations for moving multiple cards simultaneously
 */

import { db } from '@/lib/db/drizzle';
import { lessonProgress } from '@/lib/db/schema/lesson-progress';
import { eq, and } from 'drizzle-orm';
import { isCardLocked } from './card-lock-service';

/**
 * Batch Move Input
 */
export interface BatchMoveInput {
  card_id: string;
  new_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  new_position: number;
  version: string; // timestamp for optimistic locking
}

/**
 * Batch Move Result
 */
export interface BatchMoveResult {
  updated_cards: Array<{
    id: string;
    status: string;
    position: number;
    updated_at: Date;
  }>;
  failed_moves: Array<{
    card_id: string;
    error: string;
    code: string;
  }>;
}

/**
 * Execute batch move operation
 */
export async function executeBatchMove(
  moves: BatchMoveInput[],
  schoolId: number,
  teacherId: number,
  userId: number
): Promise<BatchMoveResult> {
  const updated_cards: Array<{
    id: string;
    status: string;
    position: number;
    updated_at: Date;
  }> = [];

  const failed_moves: Array<{
    card_id: string;
    error: string;
    code: string;
  }> = [];

  // Process each move
  for (const move of moves) {
    try {
      // Verify card exists and belongs to this teacher
      const card = await db
        .select()
        .from(lessonProgress)
        .where(
          and(
            eq(lessonProgress.id, move.card_id),
            eq(lessonProgress.schoolId, schoolId),
            eq(lessonProgress.teacherId, teacherId)
          )
        )
        .limit(1);

      if (card.length === 0) {
        failed_moves.push({
          card_id: move.card_id,
          error: 'Card not found',
          code: 'CARD_NOT_FOUND',
        });
        continue;
      }

      const currentCard = card[0];

      // Check for optimistic locking conflict
      const versionDate = new Date(move.version);
      if (currentCard.updatedAt > versionDate) {
        failed_moves.push({
          card_id: move.card_id,
          error: 'Card has been modified by another user',
          code: 'VERSION_CONFLICT',
        });
        continue;
      }

      // Check if card is locked by another user
      const locked = await isCardLocked(move.card_id, schoolId);
      if (locked && currentCard.lockedBy !== userId && currentCard.lockedBy !== null) {
        failed_moves.push({
          card_id: move.card_id,
          error: 'Card is locked by another user',
          code: 'CARD_LOCKED',
        });
        continue;
      }

      // Update the card
      const result = await db
        .update(lessonProgress)
        .set({
          status: move.new_status,
          position: move.new_position,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(lessonProgress.id, move.card_id))
        .returning();

      if (result.length > 0) {
        updated_cards.push({
          id: result[0].id,
          status: result[0].status,
          position: result[0].position,
          updated_at: result[0].updatedAt,
        });
      }
    } catch (error) {
      failed_moves.push({
        card_id: move.card_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  return {
    updated_cards,
    failed_moves,
  };
}

/**
 * Reorder cards within same column
 */
export async function reorderCardsInColumn(
  cardIds: string[],
  status: string,
  schoolId: number,
  teacherId: number,
  userId: number
): Promise<{ success: boolean; updated_count: number }> {
  let updated_count = 0;

  // Update each card with new position
  for (let i = 0; i < cardIds.length; i++) {
    const cardId = cardIds[i];

    const result = await db
      .update(lessonProgress)
      .set({
        position: i,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessonProgress.id, cardId),
          eq(lessonProgress.schoolId, schoolId),
          eq(lessonProgress.teacherId, teacherId),
          eq(lessonProgress.status, status as any)
        )
      );

    if (result.rowCount && result.rowCount > 0) {
      updated_count++;
    }
  }

  return {
    success: updated_count === cardIds.length,
    updated_count,
  };
}

/**
 * Validate batch move operations before execution
 */
export function validateBatchMoves(moves: BatchMoveInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for duplicates
  const cardIds = moves.map((m) => m.card_id);
  const uniqueIds = new Set(cardIds);
  if (cardIds.length !== uniqueIds.size) {
    errors.push('Duplicate card IDs in batch move');
  }

  // Validate each move
  for (const move of moves) {
    if (!move.card_id) {
      errors.push('Missing card_id');
    }

    if (!move.new_status) {
      errors.push(`Missing new_status for card ${move.card_id}`);
    }

    if (move.new_position < 0) {
      errors.push(`Invalid position for card ${move.card_id}`);
    }

    if (!move.version) {
      errors.push(`Missing version for card ${move.card_id}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
