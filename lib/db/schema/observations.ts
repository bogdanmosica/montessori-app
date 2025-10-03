import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';
import { children } from '../schema';

// Observations table for teacher notes about student progress
export const observations = pgTable('observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => children.id),
  teacherId: integer('teacher_id')
    .notNull()
    .references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const observationsRelations = relations(observations, ({ one }) => ({
  student: one(children, {
    fields: [observations.studentId],
    references: [children.id],
  }),
  teacher: one(users, {
    fields: [observations.teacherId],
    references: [users.id],
  }),
}));

// Types
export type Observation = typeof observations.$inferSelect;
export type NewObservation = typeof observations.$inferInsert;
