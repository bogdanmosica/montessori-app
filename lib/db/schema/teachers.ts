import {
  pgTable,
  uuid,
  integer,
  timestamp,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../schema';
import { teams } from '../schema';
import { children } from '../schema';

// Teacher table
export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Teacher-Student Assignment table
export const teacherStudentAssignments = pgTable('teacher_student_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => teachers.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => children.id),
  classGroup: varchar('class_group', { length: 100 }),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  school: one(teams, {
    fields: [teachers.schoolId],
    references: [teams.id],
  }),
  studentAssignments: many(teacherStudentAssignments),
}));

export const teacherStudentAssignmentsRelations = relations(
  teacherStudentAssignments,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherStudentAssignments.teacherId],
      references: [teachers.id],
    }),
    student: one(children, {
      fields: [teacherStudentAssignments.studentId],
      references: [children.id],
    }),
  })
);

// Types
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type TeacherStudentAssignment = typeof teacherStudentAssignments.$inferSelect;
export type NewTeacherStudentAssignment = typeof teacherStudentAssignments.$inferInsert;
