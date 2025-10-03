import {
  pgTable,
  uuid,
  integer,
  timestamp,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { teams } from '../schema';
import { users } from '../schema';
import { relations } from 'drizzle-orm';

/**
 * Lesson Progress Status Enum
 * Defines valid progress states for lesson tracking
 */
export const lessonProgressStatusEnum = pgEnum('lesson_progress_status', [
  'not_started',
  'in_progress',
  'completed',
  'on_hold',
]);

/**
 * Lesson Progress Table
 * Tracks student progress through lessons with drag-and-drop Kanban board
 */
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: integer('school_id')
      .notNull()
      .references(() => teams.id),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => users.id),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id),
    studentId: uuid('student_id').references(() => children.id),
    status: lessonProgressStatusEnum('status').notNull(),
    position: integer('position').notNull(),
    lockedBy: integer('locked_by').references(() => users.id),
    lockedAt: timestamp('locked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: integer('updated_by')
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    // Index for board queries (school + teacher + status + position)
    schoolTeacherStatusIdx: index('lesson_progress_school_teacher_status_idx').on(
      table.schoolId,
      table.teacherId,
      table.status,
      table.position
    ),
    // Index for student filtering
    schoolStudentIdx: index('lesson_progress_school_student_idx').on(
      table.schoolId,
      table.studentId
    ),
    // Index for lock management
    lockIdx: index('lesson_progress_lock_idx').on(table.lockedBy, table.lockedAt),
    // Index for lesson cascading
    lessonIdx: index('lesson_progress_lesson_idx').on(table.lessonId),
    // Index for change tracking
    updatedAtIdx: index('lesson_progress_updated_at_idx').on(table.updatedAt),
    // Unique constraint on lesson-student pair (where student is assigned)
    uniqueLessonStudent: unique('lesson_progress_lesson_student_unique').on(
      table.lessonId,
      table.studentId
    ),
  })
);

/**
 * Lesson Progress Relations
 */
export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  school: one(teams, {
    fields: [lessonProgress.schoolId],
    references: [teams.id],
  }),
  teacher: one(users, {
    fields: [lessonProgress.teacherId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
  student: one(children, {
    fields: [lessonProgress.studentId],
    references: [children.id],
  }),
  locker: one(users, {
    fields: [lessonProgress.lockedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [lessonProgress.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [lessonProgress.updatedBy],
    references: [users.id],
  }),
}));

// Import references (to be defined in other schema files)
import { lessons } from './lessons';
import { children } from '../schema';
