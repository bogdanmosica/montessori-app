/**
 * Import Error Logging Schema
 */

import { pgTable, uuid, integer, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { schools } from '../schema';

export const importErrorLogs = pgTable('import_error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => schools.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  rowNumber: integer('row_number').notNull(),
  field: varchar('field', { length: 100 }).notNull(),
  errorMessage: text('error_message').notNull(),
  rowData: text('row_data').notNull(), // JSON string
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const importErrorLogsRelations = relations(importErrorLogs, ({ one }) => ({
  school: one(schools, {
    fields: [importErrorLogs.schoolId],
    references: [schools.id],
  }),
}));

export type ImportErrorLog = typeof importErrorLogs.$inferSelect;
export type NewImportErrorLog = typeof importErrorLogs.$inferInsert;
