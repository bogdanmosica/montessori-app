import { db } from '@/lib/db/drizzle';
import { observations, children, users } from '@/lib/db/schema';
import { eq, and, desc, like, sql } from 'drizzle-orm';

export interface ObservationWithDetails {
  id: string;
  studentId: string;
  teacherId: number;
  teacherName: string | null;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get observations for a student with teacher details (multi-tenant scoped)
 */
export async function getObservationsWithTeacherDetails(
  studentId: string,
  schoolId: number,
  options: {
    page?: number;
    limit?: number;
    searchTerm?: string;
  } = {}
): Promise<{
  observations: ObservationWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  // Build the base query with joins
  let query = db
    .select({
      id: observations.id,
      studentId: observations.studentId,
      teacherId: observations.teacherId,
      teacherName: users.name,
      note: observations.note,
      createdAt: observations.createdAt,
      updatedAt: observations.updatedAt,
    })
    .from(observations)
    .innerJoin(children, eq(observations.studentId, children.id))
    .innerJoin(users, eq(observations.teacherId, users.id))
    .where(
      and(
        eq(observations.studentId, studentId),
        eq(children.schoolId, schoolId)
      )
    )
    .$dynamic();

  // Add search filter if provided
  if (options.searchTerm) {
    query = query.where(like(observations.note, `%${options.searchTerm}%`));
  }

  // Execute query with pagination
  const observationsList = await query
    .orderBy(desc(observations.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(observations)
    .innerJoin(children, eq(observations.studentId, children.id))
    .where(
      and(
        eq(observations.studentId, studentId),
        eq(children.schoolId, schoolId)
      )
    );

  const [{ count }] = await countQuery;
  const totalCount = Number(count) || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    observations: observationsList.map(obs => ({
      ...obs,
      createdAt: new Date(obs.createdAt),
      updatedAt: new Date(obs.updatedAt),
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  };
}

/**
 * Get a single observation with multi-tenant validation
 */
export async function getObservationWithValidation(
  observationId: string,
  schoolId: number
): Promise<ObservationWithDetails | null> {
  const [observation] = await db
    .select({
      id: observations.id,
      studentId: observations.studentId,
      teacherId: observations.teacherId,
      teacherName: users.name,
      note: observations.note,
      createdAt: observations.createdAt,
      updatedAt: observations.updatedAt,
    })
    .from(observations)
    .innerJoin(children, eq(observations.studentId, children.id))
    .innerJoin(users, eq(observations.teacherId, users.id))
    .where(
      and(
        eq(observations.id, observationId),
        eq(children.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!observation) {
    return null;
  }

  return {
    ...observation,
    createdAt: new Date(observation.createdAt),
    updatedAt: new Date(observation.updatedAt),
  };
}

/**
 * Get observation count by teacher for analytics
 */
export async function getObservationCountByTeacher(
  teacherId: number,
  schoolId: number
): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(observations)
    .innerJoin(children, eq(observations.studentId, children.id))
    .where(
      and(
        eq(observations.teacherId, teacherId),
        eq(children.schoolId, schoolId)
      )
    );

  return Number(count) || 0;
}

/**
 * Get recent observations across all students for a teacher
 */
export async function getRecentObservationsByTeacher(
  teacherId: number,
  schoolId: number,
  limit: number = 10
): Promise<ObservationWithDetails[]> {
  const recentObservations = await db
    .select({
      id: observations.id,
      studentId: observations.studentId,
      teacherId: observations.teacherId,
      teacherName: users.name,
      note: observations.note,
      createdAt: observations.createdAt,
      updatedAt: observations.updatedAt,
    })
    .from(observations)
    .innerJoin(children, eq(observations.studentId, children.id))
    .innerJoin(users, eq(observations.teacherId, users.id))
    .where(
      and(
        eq(observations.teacherId, teacherId),
        eq(children.schoolId, schoolId)
      )
    )
    .orderBy(desc(observations.createdAt))
    .limit(limit);

  return recentObservations.map(obs => ({
    ...obs,
    createdAt: new Date(obs.createdAt),
    updatedAt: new Date(obs.updatedAt),
  }));
}
