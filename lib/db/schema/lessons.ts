import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { teams } from '../schema';
import { users } from '../schema';
import { relations } from 'drizzle-orm';

/**
 * Difficulty Level Enum
 */
export const difficultyLevelEnum = pgEnum('difficulty_level', [
  'beginner',
  'intermediate',
  'advanced',
]);

/**
 * Lessons Table
 * Core lesson data with progress tracking enhancements
 */
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: integer('school_id')
      .notNull()
      .references(() => teams.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    estimatedDuration: integer('estimated_duration'), // in minutes
    difficultyLevel: difficultyLevelEnum('difficulty_level').notNull(),
    isTemplate: boolean('is_template').notNull().default(false),
    templateParentId: uuid('template_parent_id').references((): any => lessons.id),
    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),
    updatedBy: integer('updated_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index for school-scoped queries
    schoolIdx: index('lessons_school_idx').on(table.schoolId),
    // Index for category filtering
    categoryIdx: index('lessons_category_idx').on(table.category),
    // Index for template hierarchy
    templateIdx: index('lessons_template_idx').on(
      table.isTemplate,
      table.templateParentId
    ),
    // Index for difficulty filtering
    difficultyIdx: index('lessons_difficulty_idx').on(table.difficultyLevel),
  })
);

/**
 * Lessons Relations
 */
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  school: one(teams, {
    fields: [lessons.schoolId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [lessons.createdBy],
    references: [users.id],
  }),
  updater: one(users, {
    fields: [lessons.updatedBy],
    references: [users.id],
  }),
  templateParent: one(lessons, {
    fields: [lessons.templateParentId],
    references: [lessons.id],
  }),
  templateChildren: many(lessons),
  lessonProgress: many(lessonProgress),
}));

// Import for relations
import { lessonProgress } from './lesson-progress';
