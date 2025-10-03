/**
 * Progress Card CRUD Service
 *
 * Handles creation, updates, and deletion of lesson progress cards
 */

import { db } from '@/lib/db/drizzle';
import { lessonProgress } from '@/lib/db/schema/lesson-progress';
import { lessons } from '@/lib/db/schema/lessons';
import { children } from '@/lib/db/schema';
import { eq, and, max, sql } from 'drizzle-orm';

/**
 * Create Card Input
 */
export interface CreateCardInput {
  lesson_id: string;
  student_id?: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
}

/**
 * Update Card Input
 */
export interface UpdateCardInput {
  student_id?: string | null;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  position?: number;
}

/**
 * Create a new progress card
 */
export async function createProgressCard(
  input: CreateCardInput,
  schoolId: number,
  teacherId: number,
  userId: number
) {
  // Verify lesson exists and belongs to this school
  const lesson = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.id, input.lesson_id),
        eq(lessons.schoolId, schoolId)
      )
    )
    .limit(1);

  if (lesson.length === 0) {
    throw new Error('Lesson not found');
  }

  // If student_id provided, verify student exists and belongs to this school
  if (input.student_id) {
    const student = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.id, input.student_id),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    // Check for duplicate lesson-student assignment in the same status
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.lessonId, input.lesson_id),
          eq(lessonProgress.studentId, input.student_id),
          eq(lessonProgress.schoolId, schoolId),
          eq(lessonProgress.status, input.status) // Only check within same status
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('This lesson is already assigned to this student in this status');
    }
  }

  // Get next position for this status column
  const maxPositionResult = await db
    .select({ maxPos: max(lessonProgress.position) })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId),
        eq(lessonProgress.status, input.status)
      )
    );

  const nextPosition = (maxPositionResult[0]?.maxPos ?? -1) + 1;

  // Create the progress card
  const result = await db
    .insert(lessonProgress)
    .values({
      schoolId,
      teacherId,
      lessonId: input.lesson_id,
      studentId: input.student_id || null,
      status: input.status,
      position: nextPosition,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return result[0];
}

/**
 * Update a progress card
 */
export async function updateProgressCard(
  cardId: string,
  schoolId: number,
  input: UpdateCardInput,
  userId: number
) {
  // Verify card exists and belongs to this school
  const card = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    throw new Error('Card not found');
  }

  const currentCard = card[0];

  // If student_id is being updated, verify student exists
  if (input.student_id !== undefined && input.student_id !== null) {
    const student = await db
      .select()
      .from(children)
      .where(
        and(
          eq(children.id, input.student_id),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    // Check for duplicate lesson-student assignment (only if assigning to a student)
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.lessonId, currentCard.lessonId),
          eq(lessonProgress.studentId, input.student_id),
          eq(lessonProgress.schoolId, schoolId),
          sql`${lessonProgress.id} != ${cardId}` // Exclude current card
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Lesson already assigned to this student');
    }
  }

  // Build update data
  const updateData: any = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  // Add student_id to update if provided (null is valid for unassigning)
  if (input.student_id !== undefined) {
    updateData.studentId = input.student_id;
  }

  console.log('Update data:', updateData);
  console.log('Updating card:', cardId);

  // If status is changing, reposition card
  if (input.status && input.status !== currentCard.status) {
    // Get max position in new status column
    const maxPositionResult = await db
      .select({ maxPos: max(lessonProgress.position) })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.schoolId, schoolId),
          eq(lessonProgress.teacherId, currentCard.teacherId),
          eq(lessonProgress.status, input.status)
        )
      );

    const newPosition = (maxPositionResult[0]?.maxPos ?? -1) + 1;

    updateData.status = input.status;
    updateData.position = input.position !== undefined ? input.position : newPosition;

    // Update card
    const result = await db
      .update(lessonProgress)
      .set(updateData)
      .where(eq(lessonProgress.id, cardId))
      .returning();

    // Rebalance positions in old column
    await rebalancePositions(
      schoolId,
      currentCard.teacherId,
      currentCard.status,
      currentCard.position
    );

    return result[0];
  }

  // Update without status change
  if (input.position !== undefined) {
    updateData.position = input.position;
  }

  const result = await db
    .update(lessonProgress)
    .set(updateData)
    .where(eq(lessonProgress.id, cardId))
    .returning();

  return result[0];
}

/**
 * Delete a progress card
 */
export async function deleteProgressCard(
  cardId: string,
  schoolId: number,
  teacherId: number
) {
  // Get card to rebalance positions after deletion
  const card = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    throw new Error('Card not found');
  }

  const currentCard = card[0];

  // Delete the card
  await db
    .delete(lessonProgress)
    .where(eq(lessonProgress.id, cardId));

  // Rebalance positions in the column
  await rebalancePositions(
    schoolId,
    teacherId,
    currentCard.status,
    currentCard.position
  );

  return { success: true };
}

/**
 * Move a card to a different position/status
 */
export async function moveProgressCard(
  cardId: string,
  newStatus: string,
  newPosition: number,
  schoolId: number,
  teacherId: number,
  userId: number
) {
  // Verify card exists
  const card = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId)
      )
    )
    .limit(1);

  if (card.length === 0) {
    throw new Error('Card not found');
  }

  const currentCard = card[0];

  // Update card with new status and position
  const result = await db
    .update(lessonProgress)
    .set({
      status: newStatus as any,
      position: newPosition,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(lessonProgress.id, cardId))
    .returning();

  // If status changed, rebalance old column
  if (newStatus !== currentCard.status) {
    await rebalancePositions(
      schoolId,
      teacherId,
      currentCard.status,
      currentCard.position
    );
  }

  return result[0];
}

/**
 * Rebalance positions in a column after card removal/move
 */
async function rebalancePositions(
  schoolId: number,
  teacherId: number,
  status: string,
  removedPosition: number
) {
  // Decrement positions greater than the removed position
  await db
    .update(lessonProgress)
    .set({
      position: sql`${lessonProgress.position} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId),
        eq(lessonProgress.status, status as any),
        sql`${lessonProgress.position} > ${removedPosition}`
      )
    );
}
