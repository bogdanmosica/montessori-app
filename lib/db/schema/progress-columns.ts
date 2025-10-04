import {
  pgTable,
  uuid,
  integer,
  varchar,
  timestamp,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { schools } from '../schema';
import { relations } from 'drizzle-orm';

/**
 * Progress Columns Table
 * Admin-configured column templates for progress boards
 */
export const progressColumns = pgTable(
  'progress_columns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: integer('school_id')
      .notNull()
      .references(() => schools.id),
    name: varchar('name', { length: 100 }).notNull(),
    statusValue: varchar('status_value', { length: 50 }).notNull(),
    position: integer('position').notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#6B7280'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index for column ordering
    schoolPositionIdx: index('progress_columns_school_position_idx').on(
      table.schoolId,
      table.position
    ),
    // Index for status mapping
    statusIdx: index('progress_columns_status_idx').on(table.statusValue),
    // Unique constraint on school-status pair
    uniqueSchoolStatus: unique('progress_columns_school_status_unique').on(
      table.schoolId,
      table.statusValue
    ),
    // Unique constraint on school-position pair (for active columns)
    uniqueSchoolPosition: unique('progress_columns_school_position_unique').on(
      table.schoolId,
      table.position
    ),
  })
);

/**
 * Progress Columns Relations
 */
export const progressColumnsRelations = relations(progressColumns, ({ one }) => ({
  school: one(schools, {
    fields: [progressColumns.schoolId],
    references: [schools.id],
  }),
}));
