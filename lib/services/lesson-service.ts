import { db } from '@/lib/db/drizzle';
import { lessons } from '@/lib/db/schema/lessons';
import { eq, and, like, or, ilike } from 'drizzle-orm';
import { CreateLessonInput, UpdateLessonInput } from '@/lib/validations/lesson-schemas';

/**
 * Get lessons for a school with optional filtering
 */
export async function getLessons(
  schoolId: number,
  userId: number,
  userRole: string,
  filters?: {
    category?: string;
    search?: string;
  }
) {
  let query = db.select().from(lessons).where(eq(lessons.schoolId, schoolId));

  const conditions: any[] = [eq(lessons.schoolId, schoolId)];

  // Role-based filtering for visibility
  if (userRole === 'teacher') {
    // Teachers can see global lessons and their own private lessons
    conditions.push(
      or(
        eq(lessons.visibility, 'admin_global'),
        and(
          eq(lessons.visibility, 'teacher_private'),
          eq(lessons.createdBy, userId)
        )
      )!
    );
  }
  // Admins can see all lessons (no additional filter needed)

  // Category filter
  if (filters?.category) {
    conditions.push(eq(lessons.category, filters.category));
  }

  // Search filter
  if (filters?.search) {
    conditions.push(
      or(
        ilike(lessons.title, `%${filters.search}%`),
        ilike(lessons.description!, `%${filters.search}%`)
      )!
    );
  }

  const result = await db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .orderBy(lessons.category, lessons.title);

  return result;
}

/**
 * Get a single lesson by ID
 */
export async function getLessonById(
  lessonId: string,
  schoolId: number,
  userId: number,
  userRole: string
) {
  const conditions: any[] = [
    eq(lessons.id, lessonId),
    eq(lessons.schoolId, schoolId),
  ];

  // Role-based visibility check
  if (userRole === 'teacher') {
    conditions.push(
      or(
        eq(lessons.visibility, 'admin_global'),
        and(
          eq(lessons.visibility, 'teacher_private'),
          eq(lessons.createdBy, userId)
        )
      )!
    );
  }

  const result = await db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new lesson
 */
export async function createLesson(
  data: CreateLessonInput,
  schoolId: number,
  userId: number
) {
  const result = await db
    .insert(lessons)
    .values({
      ...data,
      schoolId,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return result[0];
}

/**
 * Update a lesson
 */
export async function updateLesson(
  lessonId: string,
  data: UpdateLessonInput,
  schoolId: number,
  userId: number,
  userRole: string
) {
  // Build conditions: must match schoolId and either be creator or admin
  const conditions: any[] = [
    eq(lessons.id, lessonId),
    eq(lessons.schoolId, schoolId),
  ];

  if (userRole === 'teacher') {
    // Teachers can only edit their own lessons
    conditions.push(eq(lessons.createdBy, userId));
  }
  // Admins can edit any lesson (no additional condition)

  const result = await db
    .update(lessons)
    .set({
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning();

  return result[0] || null;
}

/**
 * Delete a lesson
 */
export async function deleteLesson(
  lessonId: string,
  schoolId: number,
  userId: number,
  userRole: string
) {
  const conditions: any[] = [
    eq(lessons.id, lessonId),
    eq(lessons.schoolId, schoolId),
  ];

  if (userRole === 'teacher') {
    // Teachers can only delete their own lessons
    conditions.push(eq(lessons.createdBy, userId));
  }
  // Admins can delete any lesson (no additional condition)

  const result = await db
    .delete(lessons)
    .where(and(...conditions))
    .returning();

  return result[0] || null;
}

/**
 * Clone a lesson (for teachers cloning global lessons)
 */
export async function cloneLesson(
  lessonId: string,
  schoolId: number,
  userId: number
) {
  // Get the original lesson
  const original = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.id, lessonId),
        eq(lessons.schoolId, schoolId),
        eq(lessons.visibility, 'admin_global')
      )
    )
    .limit(1);

  if (!original[0]) {
    return null;
  }

  // Create a clone with teacher_private visibility
  const cloned = await db
    .insert(lessons)
    .values({
      title: `${original[0].title} (Copy)`,
      description: original[0].description,
      category: original[0].category,
      estimatedDuration: original[0].estimatedDuration,
      difficultyLevel: original[0].difficultyLevel,
      visibility: 'teacher_private',
      isTemplate: false,
      templateParentId: lessonId,
      schoolId,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return cloned[0];
}
