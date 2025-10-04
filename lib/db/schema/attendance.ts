import { pgTable, uuid, text, timestamp, pgEnum, integer, date, unique, index } from 'drizzle-orm/pg-core';
import { users, schools, children } from '../schema';
import { relations } from 'drizzle-orm';

/**
 * Attendance Status Enum
 *
 * Supports single teacher and co-teaching consensus workflows:
 * - Single teacher: Uses 'present' or 'absent' directly
 * - Co-teaching: Uses 'pending_*' states until all teachers agree, then 'confirmed_*'
 */
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'pending_present',
  'pending_absent',
  'confirmed_present',
  'confirmed_absent',
]);

/**
 * Attendance Table
 *
 * Stores daily attendance records with teacher attribution and multi-tenant scoping.
 * Each record represents one teacher's attendance entry for one student on one date.
 */
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
    teacherId: integer('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    status: attendanceStatusEnum('status').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    tenantId: integer('tenant_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    // Unique constraint: one attendance record per student per teacher per date
    uniqueStudentTeacherDate: unique('unique_student_teacher_date')
      .on(table.studentId, table.teacherId, table.date),

    // Performance indexes for common query patterns

    // Most common: Teacher viewing their daily roster
    teacherDateIdx: index('idx_attendance_teacher_date')
      .on(table.teacherId, table.date),

    // Student attendance history
    studentDateIdx: index('idx_attendance_student_date')
      .on(table.studentId, table.date),

    // Multi-tenant isolation (security critical)
    tenantIdx: index('idx_attendance_tenant')
      .on(table.tenantId),

    // Date range queries
    dateIdx: index('idx_attendance_date')
      .on(table.date),
  })
);

/**
 * Attendance Relations
 *
 * Defines relationships to students (children), teachers (users), and schools (schools).
 */
export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(children, {
    fields: [attendance.studentId],
    references: [children.id],
  }),
  teacher: one(users, {
    fields: [attendance.teacherId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [attendance.tenantId],
    references: [schools.id],
  }),
}));

/**
 * Type Exports
 *
 * Inferred TypeScript types from Drizzle schema for use throughout the application.
 */
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
