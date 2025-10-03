/**
 * Progress Board Query Service
 *
 * Handles data fetching and queries for the teacher progress board
 */

import { db } from '@/lib/db/drizzle';
import { lessonProgress } from '@/lib/db/schema/lesson-progress';
import { progressColumns } from '@/lib/db/schema/progress-columns';
import { lessons } from '@/lib/db/schema/lessons';
import { children, teachers, teacherStudentAssignments } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

/**
 * Progress Board Column with Cards
 */
export interface ProgressBoardColumn {
  id: string;
  name: string;
  status_value: string;
  position: number;
  color: string;
  cards: ProgressCard[];
}

/**
 * Progress Card Data
 */
export interface ProgressCard {
  id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_category: string;
  student_id: string | null;
  student_name: string | null;
  status: string;
  position: number;
  locked_by: number | null;
  locked_at: Date | null;
  updated_at: Date;
}

/**
 * Filter Options
 */
export interface FilterOptions {
  student_id?: string;
  category?: string;
  status?: string;
}

/**
 * Get all progress board data for a teacher
 */
export async function getProgressBoardData(
  schoolId: number,
  teacherId: number,
  filters?: FilterOptions
) {
  // Build filter conditions
  const conditions = [
    eq(lessonProgress.schoolId, schoolId),
    eq(lessonProgress.teacherId, teacherId),
  ];

  if (filters?.student_id) {
    conditions.push(eq(lessonProgress.studentId, filters.student_id));
  }

  if (filters?.status) {
    conditions.push(eq(lessonProgress.status, filters.status as any));
  }

  // Get columns for this school
  const columnsData = await db
    .select()
    .from(progressColumns)
    .where(
      and(
        eq(progressColumns.schoolId, schoolId),
        eq(progressColumns.isActive, true)
      )
    )
    .orderBy(progressColumns.position);

  // Get all progress cards with lesson and student data
  const cardsData = await db
    .select({
      id: lessonProgress.id,
      lesson_id: lessonProgress.lessonId,
      lesson_title: lessons.title,
      lesson_category: lessons.category,
      student_id: lessonProgress.studentId,
      student_name: children.firstName,
      student_last_name: children.lastName,
      status: lessonProgress.status,
      position: lessonProgress.position,
      locked_by: lessonProgress.lockedBy,
      locked_at: lessonProgress.lockedAt,
      updated_at: lessonProgress.updatedAt,
    })
    .from(lessonProgress)
    .leftJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .leftJoin(children, eq(lessonProgress.studentId, children.id))
    .where(and(...conditions))
    .orderBy(lessonProgress.position);

  // Filter by category if specified
  let filteredCards = cardsData;
  if (filters?.category) {
    filteredCards = cardsData.filter(
      (card) => card.lesson_category === filters.category
    );
  }

  // Group cards by lesson_id and status to consolidate multiple students
  const groupedCards = new Map<string, any>();

  for (const card of filteredCards) {
    const key = `${card.lesson_id}-${card.status}`;
    const studentName = card.student_name && card.student_last_name
      ? `${card.student_name} ${card.student_last_name}`
      : null;

    if (groupedCards.has(key)) {
      const existing = groupedCards.get(key);
      // Add student to the list
      if (studentName) {
        existing.student_names.push(studentName);
        existing.student_ids.push(card.student_id);
      }
      // Use the earliest updated_at for the group
      if (card.updated_at < existing.updated_at) {
        existing.updated_at = card.updated_at;
      }
    } else {
      groupedCards.set(key, {
        id: card.id, // Use first card's ID as representative
        lesson_id: card.lesson_id,
        lesson_title: card.lesson_title || 'Unknown Lesson',
        lesson_category: card.lesson_category || 'Uncategorized',
        student_id: card.student_id,
        student_ids: card.student_id ? [card.student_id] : [],
        student_names: studentName ? [studentName] : [],
        status: card.status,
        position: card.position,
        locked_by: card.locked_by,
        locked_at: card.locked_at,
        updated_at: card.updated_at,
      });
    }
  }

  // Organize cards by column
  const columns: ProgressBoardColumn[] = columnsData.map((col) => ({
    id: col.id,
    name: col.name,
    status_value: col.statusValue,
    position: col.position,
    color: col.color,
    cards: Array.from(groupedCards.values())
      .filter((card) => card.status === col.statusValue)
      .map((card) => ({
        id: card.id,
        lesson_id: card.lesson_id,
        lesson_title: card.lesson_title,
        lesson_category: card.lesson_category,
        student_id: card.student_id,
        student_name: card.student_names.length > 0
          ? JSON.stringify(card.student_names) // Store as JSON array for multiple students
          : null,
        status: card.status,
        position: card.position,
        locked_by: card.locked_by,
        locked_at: card.locked_at,
        updated_at: card.updated_at,
      })),
  }));

  return columns;
}

/**
 * Get filter options for a teacher
 */
export async function getFilterOptions(schoolId: number, teacherId: number) {
  // Find teacher record first
  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.userId, teacherId),
  });

  if (!teacher) {
    return {
      students: [],
      categories: [],
    };
  }

  // Get all students assigned to this teacher (filtered by school)
  const assignments = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
    })
    .from(teacherStudentAssignments)
    .innerJoin(children, eq(teacherStudentAssignments.studentId, children.id))
    .where(
      and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.isActive, true),
        eq(children.schoolId, schoolId)
      )
    )
    .orderBy(children.firstName);

  const students = assignments.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
  }));

  // Get unique categories from lessons
  const categoriesData = await db
    .selectDistinct({
      category: lessons.category,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(
      and(
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId)
      )
    )
    .orderBy(lessons.category);

  const categories = categoriesData.map((c) => c.category).filter(Boolean);

  return {
    students,
    categories,
  };
}

/**
 * Get single progress card by ID
 */
export async function getProgressCardById(
  cardId: string,
  schoolId: number,
  teacherId: number
) {
  const result = await db
    .select({
      id: lessonProgress.id,
      lesson_id: lessonProgress.lessonId,
      lesson_title: lessons.title,
      lesson_category: lessons.category,
      student_id: lessonProgress.studentId,
      student_name: children.firstName,
      student_last_name: children.lastName,
      status: lessonProgress.status,
      position: lessonProgress.position,
      locked_by: lessonProgress.lockedBy,
      locked_at: lessonProgress.lockedAt,
      updated_at: lessonProgress.updatedAt,
    })
    .from(lessonProgress)
    .leftJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .leftJoin(children, eq(lessonProgress.studentId, children.id))
    .where(
      and(
        eq(lessonProgress.id, cardId),
        eq(lessonProgress.schoolId, schoolId),
        eq(lessonProgress.teacherId, teacherId)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const card = result[0];
  return {
    id: card.id,
    lesson_id: card.lesson_id,
    lesson_title: card.lesson_title || 'Unknown Lesson',
    lesson_category: card.lesson_category || 'Uncategorized',
    student_id: card.student_id,
    student_name: card.student_name && card.student_last_name
      ? `${card.student_name} ${card.student_last_name}`
      : null,
    status: card.status,
    position: card.position,
    locked_by: card.locked_by,
    locked_at: card.locked_at,
    updated_at: card.updated_at,
  };
}
