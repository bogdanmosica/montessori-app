import { z } from 'zod';
import { LESSON_CATEGORIES, LESSON_VISIBILITY, DIFFICULTY_LEVELS, LESSON_VALIDATION } from '@/lib/constants/lessons';

/**
 * Lesson Creation Schema
 */
export const createLessonSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(LESSON_VALIDATION.TITLE_MAX_LENGTH, `Title must be ${LESSON_VALIDATION.TITLE_MAX_LENGTH} characters or less`),
  description: z.string()
    .max(LESSON_VALIDATION.DESCRIPTION_MAX_LENGTH, `Description must be ${LESSON_VALIDATION.DESCRIPTION_MAX_LENGTH} characters or less`)
    .optional(),
  category: z.string()
    .refine(
      (val) => Object.values(LESSON_CATEGORIES).includes(val as any),
      'Invalid lesson category'
    ),
  visibility: z.enum(['admin_global', 'teacher_private']),
  estimatedDuration: z.number()
    .min(LESSON_VALIDATION.MIN_DURATION, `Duration must be at least ${LESSON_VALIDATION.MIN_DURATION} minutes`)
    .max(LESSON_VALIDATION.MAX_DURATION, `Duration must be at most ${LESSON_VALIDATION.MAX_DURATION} minutes`)
    .optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
});

/**
 * Lesson Update Schema
 */
export const updateLessonSchema = createLessonSchema.partial();

/**
 * Lesson Query Schema
 */
export const lessonQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  visibility: z.enum(['admin_global', 'teacher_private']).optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type LessonQuery = z.infer<typeof lessonQuerySchema>;
