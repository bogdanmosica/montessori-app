/**
 * Lesson Progress Status Constants
 * Used for the Teacher Progress Board feature
 */

export const LESSON_PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;

export type LessonProgressStatus =
  (typeof LESSON_PROGRESS_STATUS)[keyof typeof LESSON_PROGRESS_STATUS];

/**
 * Valid status transitions for lesson progress
 */
export const VALID_STATUS_TRANSITIONS: Record<
  LessonProgressStatus,
  LessonProgressStatus[]
> = {
  [LESSON_PROGRESS_STATUS.NOT_STARTED]: [
    LESSON_PROGRESS_STATUS.IN_PROGRESS,
    LESSON_PROGRESS_STATUS.ON_HOLD,
  ],
  [LESSON_PROGRESS_STATUS.IN_PROGRESS]: [
    LESSON_PROGRESS_STATUS.COMPLETED,
    LESSON_PROGRESS_STATUS.ON_HOLD,
    LESSON_PROGRESS_STATUS.NOT_STARTED,
  ],
  [LESSON_PROGRESS_STATUS.COMPLETED]: [LESSON_PROGRESS_STATUS.IN_PROGRESS],
  [LESSON_PROGRESS_STATUS.ON_HOLD]: [
    LESSON_PROGRESS_STATUS.NOT_STARTED,
    LESSON_PROGRESS_STATUS.IN_PROGRESS,
  ],
};

/**
 * Default column colors for progress board
 */
export const DEFAULT_COLUMN_COLORS: Record<LessonProgressStatus, string> = {
  [LESSON_PROGRESS_STATUS.NOT_STARTED]: '#ef4444', // red
  [LESSON_PROGRESS_STATUS.IN_PROGRESS]: '#f59e0b', // amber
  [LESSON_PROGRESS_STATUS.COMPLETED]: '#10b981', // green
  [LESSON_PROGRESS_STATUS.ON_HOLD]: '#6b7280', // gray
};

/**
 * Card lock TTL in milliseconds (5 minutes)
 */
export const CARD_LOCK_TTL = 5 * 60 * 1000;

/**
 * Maximum concurrent locks per teacher
 */
export const MAX_CONCURRENT_LOCKS = 10;

/**
 * Maximum progress entries per teacher per status
 */
export const MAX_ENTRIES_PER_STATUS = 1000;
