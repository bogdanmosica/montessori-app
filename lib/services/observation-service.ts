import { db } from '@/lib/db/drizzle';
import { observations } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { OBSERVATION_CONSTANTS } from '@/lib/constants/observations';

export interface CreateObservationInput {
  studentId: string;
  teacherId: number;
  note: string;
}

export interface UpdateObservationInput {
  note: string;
}

/**
 * Create a new observation for a student
 */
export async function createObservation(input: CreateObservationInput) {
  const [observation] = await db
    .insert(observations)
    .values({
      studentId: input.studentId,
      teacherId: input.teacherId,
      note: input.note,
    })
    .returning();

  return observation;
}

/**
 * Get a single observation by ID
 */
export async function getObservationById(observationId: string) {
  const [observation] = await db
    .select()
    .from(observations)
    .where(eq(observations.id, observationId))
    .limit(1);

  return observation || null;
}

/**
 * Update an existing observation
 */
export async function updateObservation(
  observationId: string,
  input: UpdateObservationInput
) {
  const [updatedObservation] = await db
    .update(observations)
    .set({
      note: input.note,
      updatedAt: new Date(),
    })
    .where(eq(observations.id, observationId))
    .returning();

  return updatedObservation || null;
}

/**
 * Get observations for a specific student (paginated)
 */
export async function getObservationsByStudentId(
  studentId: string,
  options: {
    page?: number;
    limit?: number;
  } = {}
) {
  const page = options.page || 1;
  const limit = Math.min(
    options.limit || OBSERVATION_CONSTANTS.DEFAULT_PAGE_SIZE,
    OBSERVATION_CONSTANTS.MAX_PAGE_SIZE
  );
  const offset = (page - 1) * limit;

  const observationsList = await db
    .select()
    .from(observations)
    .where(eq(observations.studentId, studentId))
    .orderBy(desc(observations.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(observations)
    .where(eq(observations.studentId, studentId));

  const totalCount = Number(countResult[0]?.count) || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    observations: observationsList,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  };
}

/**
 * Get recent observations for a student (limited, for profile preview)
 */
export async function getRecentObservations(studentId: string, limit?: number) {
  const observationLimit = limit || OBSERVATION_CONSTANTS.RECENT_OBSERVATIONS_LIMIT;

  const recentObservations = await db
    .select()
    .from(observations)
    .where(eq(observations.studentId, studentId))
    .orderBy(desc(observations.createdAt))
    .limit(observationLimit);

  return recentObservations;
}

/**
 * Get observation count for a student
 */
export async function getObservationCount(studentId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(observations)
      .where(eq(observations.studentId, studentId));

    return Number(result[0]?.count) || 0;
  } catch (error) {
    console.error('Error getting observation count:', error);
    return 0;
  }
}

/**
 * Check if a teacher has access to an observation (helper for permissions)
 */
export async function isTeacherObservationOwner(
  observationId: string,
  teacherId: number
): Promise<boolean> {
  const [observation] = await db
    .select()
    .from(observations)
    .where(
      and(
        eq(observations.id, observationId),
        eq(observations.teacherId, teacherId)
      )
    )
    .limit(1);

  return !!observation;
}
