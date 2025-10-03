/**
 * Card Locking Service
 *
 * Manages card locks to prevent concurrent modifications with TTL expiration
 */

import { db } from '@/lib/db/drizzle';
import { lessonProgress } from '@/lib/db/schema/lesson-progress';
import { eq, and, lt, or, isNull } from 'drizzle-orm';

/**
 * Lock TTL in milliseconds (5 minutes)
 */
const LOCK_TTL_MS = 5 * 60 * 1000;

/**
 * Lock result
 */
export interface LockResult {
  success: boolean;
  locked_by: number | null;
  locked_at: Date | null;
  expires_at: Date | null;
  error?: string;
}

/**
 * Lock a progress card
 */
export async function lockCard(
  cardId: string,
  userId: number,
  schoolId: number
): Promise<LockResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);
  const lockExpiration = new Date(now.getTime() - LOCK_TTL_MS);

  // Check if card exists and is owned by the school
  const card = await db
    .select({
      id: lessonProgress.id,
      locked_by: lessonProgress.lockedBy,
      locked_at: lessonProgress.lockedAt,
      school_id: lessonProgress.schoolId,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    return {
      success: false,
      locked_by: null,
      locked_at: null,
      expires_at: null,
      error: 'Card not found',
    };
  }

  const currentCard = card[0];

  // Check if already locked by this user
  if (currentCard.locked_by === userId) {
    // Refresh the lock
    await db
      .update(lessonProgress)
      .set({
        lockedAt: now,
        updatedAt: now,
      })
      .where(eq(lessonProgress.id, cardId));

    return {
      success: true,
      locked_by: userId,
      locked_at: now,
      expires_at: expiresAt,
    };
  }

  // Check if locked by another user and lock is still valid
  if (
    currentCard.locked_by !== null &&
    currentCard.locked_at !== null &&
    currentCard.locked_at > lockExpiration
  ) {
    return {
      success: false,
      locked_by: currentCard.locked_by,
      locked_at: currentCard.locked_at,
      expires_at: new Date(currentCard.locked_at.getTime() + LOCK_TTL_MS),
      error: 'Card is locked by another user',
    };
  }

  // Lock is expired or doesn't exist - acquire new lock
  await db
    .update(lessonProgress)
    .set({
      lockedBy: userId,
      lockedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(lessonProgress.id, cardId),
        // Ensure we only lock if the current lock is expired or doesn't exist
        or(
          isNull(lessonProgress.lockedBy),
          lt(lessonProgress.lockedAt, lockExpiration)
        )
      )
    );

  return {
    success: true,
    locked_by: userId,
    locked_at: now,
    expires_at: expiresAt,
  };
}

/**
 * Unlock a progress card
 */
export async function unlockCard(
  cardId: string,
  userId: number,
  schoolId: number
): Promise<{ success: boolean; error?: string }> {
  // Verify card exists and is locked by this user
  const card = await db
    .select({
      id: lessonProgress.id,
      locked_by: lessonProgress.lockedBy,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    return {
      success: false,
      error: 'Card not found',
    };
  }

  const currentCard = card[0];

  // Check if locked by this user
  if (currentCard.locked_by !== userId) {
    return {
      success: false,
      error: 'Card is not locked by this user',
    };
  }

  // Remove lock
  await db
    .update(lessonProgress)
    .set({
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(lessonProgress.id, cardId));

  return {
    success: true,
  };
}

/**
 * Check if a card is locked
 */
export async function isCardLocked(
  cardId: string,
  schoolId: number
): Promise<boolean> {
  const lockExpiration = new Date(Date.now() - LOCK_TTL_MS);

  const card = await db
    .select({
      locked_by: lessonProgress.lockedBy,
      locked_at: lessonProgress.lockedAt,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    return false;
  }

  const currentCard = card[0];

  // Card is locked if locked_by is set and lock hasn't expired
  return (
    currentCard.locked_by !== null &&
    currentCard.locked_at !== null &&
    currentCard.locked_at > lockExpiration
  );
}

/**
 * Clean up expired locks (run periodically via cron job)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const lockExpiration = new Date(Date.now() - LOCK_TTL_MS);

  const result = await db
    .update(lessonProgress)
    .set({
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        lt(lessonProgress.lockedAt, lockExpiration),
        eq(lessonProgress.lockedBy, lessonProgress.lockedBy) // Only update rows where lockedBy is not null
      )
    );

  return result.rowCount || 0;
}

/**
 * Release all locks for a user (called on session end)
 */
export async function releaseUserLocks(userId: number): Promise<number> {
  const result = await db
    .update(lessonProgress)
    .set({
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(lessonProgress.lockedBy, userId));

  return result.rowCount || 0;
}
