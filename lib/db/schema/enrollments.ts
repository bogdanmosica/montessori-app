import { pgTable, uuid, text, timestamp, pgEnum, integer, unique, index } from 'drizzle-orm/pg-core';
import { users, schools, children } from '../schema';
import { relations, eq } from 'drizzle-orm';

// Create a new enrollment status enum for enrollment management
// This is separate from the existing child_enrollment_status enum
export const enrollmentManagementStatusEnum = pgEnum('enrollment_management_status', ['active', 'inactive', 'withdrawn', 'archived']);

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    childId: uuid('child_id').notNull().references(() => children.id),
    schoolId: integer('school_id').notNull().references(() => schools.id),
    status: enrollmentManagementStatusEnum('status').notNull().default('active'),
    enrollmentDate: timestamp('enrollment_date').notNull(),
    withdrawalDate: timestamp('withdrawal_date'),
    monthlyFeeOverride: integer('monthly_fee_override'), // Override fee in cents, null means use child default
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdBy: integer('created_by').notNull().references(() => users.id),
    updatedBy: integer('updated_by').notNull().references(() => users.id),
  },
  (table) => ({
    // Unique constraint: only one active enrollment per child per school
    // Note: This constraint is enforced at application level in the service layer
    uniqueEnrollmentPerChild: unique('unique_enrollment_per_child')
      .on(table.childId, table.schoolId),

    // Indexes for efficient querying
    schoolStatusDateIdx: index('enrollments_school_status_date_idx')
      .on(table.schoolId, table.status, table.enrollmentDate),

    childIdIdx: index('enrollments_child_id_idx')
      .on(table.childId),

    createdByIdx: index('enrollments_created_by_idx')
      .on(table.createdBy),

    statusIdx: index('enrollments_status_idx')
      .on(table.status),
  })
);

// Relations
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  child: one(children, {
    fields: [enrollments.childId],
    references: [children.id],
  }),
  school: one(schools, {
    fields: [enrollments.schoolId],
    references: [schools.id],
  }),
  createdBy: one(users, {
    fields: [enrollments.createdBy],
    references: [users.id],
    relationName: 'enrollmentCreator',
  }),
  updatedBy: one(users, {
    fields: [enrollments.updatedBy],
    references: [users.id],
    relationName: 'enrollmentUpdater',
  }),
}));

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;