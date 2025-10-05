/**
 * Lesson Management Constants
 * Used for lesson categories, visibility, and validation
 */

/**
 * Montessori Lesson Categories
 */
export const LESSON_CATEGORIES = {
  PRACTICAL_LIFE: 'Practical Life',
  SENSORIAL: 'Sensorial',
  LANGUAGE: 'Language',
  MATHEMATICS: 'Mathematics',
  CULTURAL: 'Cultural Studies',
  CREATIVE_ARTS: 'Creative Arts',
} as const;

export type LessonCategory = typeof LESSON_CATEGORIES[keyof typeof LESSON_CATEGORIES];

/**
 * Lesson Visibility Options
 */
export const LESSON_VISIBILITY = {
  ADMIN_GLOBAL: 'admin_global',
  TEACHER_PRIVATE: 'teacher_private',
} as const;

export type LessonVisibility = typeof LESSON_VISIBILITY[keyof typeof LESSON_VISIBILITY];

/**
 * Difficulty Levels
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];

/**
 * Lesson Validation Rules
 */
export const LESSON_VALIDATION = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  MIN_DURATION: 5, // minutes
  MAX_DURATION: 300, // minutes (5 hours)
} as const;

/**
 * Access Log Actions for Lessons
 */
export const LESSON_LOG_ACTIONS = {
  LESSON_CREATED: 'LESSON_CREATED',
  LESSON_UPDATED: 'LESSON_UPDATED',
  LESSON_DELETED: 'LESSON_DELETED',
  LESSON_CLONED: 'LESSON_CLONED',
  LESSON_VIEWED: 'LESSON_VIEWED',
} as const;

export type LessonLogAction = typeof LESSON_LOG_ACTIONS[keyof typeof LESSON_LOG_ACTIONS];

/**
 * Error Messages for Lessons
 */
export const LESSON_ERROR_MESSAGES = {
  UNAUTHORIZED: 'You do not have permission to perform this action',
  NOT_FOUND: 'Lesson not found',
  INVALID_CATEGORY: 'Invalid lesson category',
  INVALID_VISIBILITY: 'Invalid visibility option',
  TITLE_TOO_LONG: `Title must be ${LESSON_VALIDATION.TITLE_MAX_LENGTH} characters or less`,
  DESCRIPTION_TOO_LONG: `Description must be ${LESSON_VALIDATION.DESCRIPTION_MAX_LENGTH} characters or less`,
  INVALID_DURATION: `Duration must be between ${LESSON_VALIDATION.MIN_DURATION} and ${LESSON_VALIDATION.MAX_DURATION} minutes`,
  CREATION_FAILED: 'Failed to create lesson',
  UPDATE_FAILED: 'Failed to update lesson',
  DELETE_FAILED: 'Failed to delete lesson',
} as const;
