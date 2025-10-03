/**
 * Progress Audit Service
 *
 * Tracks timestamp changes for lesson progress status updates
 */

import { db } from '@/lib/db/drizzle';
import { adminAccessLogs } from '@/lib/db/schema/access-log';

/**
 * Log progress status change
 */
export async function logProgressStatusChange(
  cardId: string,
  oldStatus: string,
  newStatus: string,
  userId: number,
  schoolId: number
) {
  try {
    await db.insert(adminAccessLogs).values({
      schoolId,
      adminUserId: userId,
      actionType: 'LESSON_PROGRESS_MOVED',
      targetType: 'APPLICATION', // Reusing existing enum
      targetId: cardId,
      details: JSON.stringify({
        old_status: oldStatus,
        new_status: newStatus,
        timestamp: new Date().toISOString(),
      }),
      ipAddress: undefined,
      userAgent: undefined,
    });
  } catch (error) {
    console.error('Error logging progress status change:', error);
    // Don't throw - logging errors shouldn't break the main flow
  }
}

/**
 * Log card creation
 */
export async function logCardCreation(
  cardId: string,
  userId: number,
  schoolId: number,
  details: { lesson_id: string; student_id?: string; status: string }
) {
  try {
    await db.insert(adminAccessLogs).values({
      schoolId,
      adminUserId: userId,
      actionType: 'LESSON_PROGRESS_CREATED',
      targetType: 'APPLICATION',
      targetId: cardId,
      details: JSON.stringify(details),
      ipAddress: undefined,
      userAgent: undefined,
    });
  } catch (error) {
    console.error('Error logging card creation:', error);
  }
}

/**
 * Log card deletion
 */
export async function logCardDeletion(
  cardId: string,
  userId: number,
  schoolId: number
) {
  try {
    await db.insert(adminAccessLogs).values({
      schoolId,
      adminUserId: userId,
      actionType: 'LESSON_PROGRESS_DELETED',
      targetType: 'APPLICATION',
      targetId: cardId,
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
      ipAddress: undefined,
      userAgent: undefined,
    });
  } catch (error) {
    console.error('Error logging card deletion:', error);
  }
}

/**
 * Log card lock/unlock
 */
export async function logCardLockChange(
  cardId: string,
  action: 'LOCKED' | 'UNLOCKED',
  userId: number,
  schoolId: number
) {
  try {
    await db.insert(adminAccessLogs).values({
      schoolId,
      adminUserId: userId,
      actionType: action === 'LOCKED' ? 'LESSON_PROGRESS_LOCKED' : 'LESSON_PROGRESS_UNLOCKED',
      targetType: 'APPLICATION',
      targetId: cardId,
      details: JSON.stringify({ timestamp: new Date().toISOString() }),
      ipAddress: undefined,
      userAgent: undefined,
    });
  } catch (error) {
    console.error('Error logging card lock change:', error);
  }
}

/**
 * Get audit trail for a card
 */
export async function getCardAuditTrail(cardId: string, schoolId: number) {
  try {
    const logs = await db
      .select()
      .from(adminAccessLogs)
      .where((log) => log.targetId === cardId && log.schoolId === schoolId)
      .orderBy(adminAccessLogs.timestamp);

    return logs;
  } catch (error) {
    console.error('Error fetching card audit trail:', error);
    return [];
  }
}
