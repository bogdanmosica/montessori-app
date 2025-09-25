import {
  pgTable,
  timestamp,
  integer,
  pgEnum,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import existing tables for references
import { users, teams, children } from '../schema';
import { applicationsNew } from './applications';

// Enrollment status enum
export const enrollmentStatusEnum = pgEnum('enrollment_status_new', [
  'active',
  'inactive',
  'graduated',
  'transferred'
]);

// Enrollments table - links applications to parent/child/school relationships
export const enrollments = pgTable('enrollments', {
  // Primary identification
  id: uuid('id').primaryKey().defaultRandom(),

  // Multi-tenant scoping
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),

  // Application link (originating application)
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applicationsNew.id),

  // Parent and child relationships
  parentId: integer('parent_id')
    .notNull()
    .references(() => users.id),

  childId: uuid('child_id')
    .notNull()
    .references(() => children.id),

  // Program enrollment (if applicable - may reference programs table later)
  programId: uuid('program_id'), // Nullable for now, can reference programs table later

  // Enrollment status and dates
  status: enrollmentStatusEnum('status').notNull().default('active'),
  startDate: date('start_date'),
  endDate: date('end_date'), // nullable, set when enrollment ends

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations for the enrollments table
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  school: one(teams, {
    fields: [enrollments.schoolId],
    references: [teams.id],
  }),
  application: one(applicationsNew, {
    fields: [enrollments.applicationId],
    references: [applicationsNew.id],
  }),
  parent: one(users, {
    fields: [enrollments.parentId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [enrollments.childId],
    references: [children.id],
  }),
  // program: one(programs, { // When programs table exists
  //   fields: [enrollments.programId],
  //   references: [programs.id],
  // }),
}));

// Type exports for the enrollments table
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

// Enrollment with relations type
export type EnrollmentWithRelations = Enrollment & {
  school?: {
    id: number;
    name: string;
  };
  application?: {
    id: string;
    parentName: string;
    childName: string;
    status: string;
  };
  parent?: {
    id: number;
    name: string;
    email: string;
  };
  child?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
  // program?: {
  //   id: string;
  //   name: string;
  // };
};

// Enrollment creation request type (used during application approval)
export interface CreateEnrollmentRequest {
  schoolId: number;
  applicationId: string;
  parentId: number;
  childId: string;
  programId?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  startDate?: string;
}

// Enrollment update request type
export interface UpdateEnrollmentRequest {
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  startDate?: string;
  endDate?: string;
  programId?: string;
}

// Enrollment query filters
export interface EnrollmentFilters {
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  parentId?: number;
  childId?: string;
  applicationId?: string;
  programId?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

// Enrollment list response type
export interface EnrollmentListResponse {
  enrollments: EnrollmentWithRelations[];
  totalItems: number;
}

// Validation constraints
export const ENROLLMENT_VALIDATION = {
  STATUS_REQUIRED: true,
  START_DATE_FUTURE_ALLOWED: true,
  END_DATE_AFTER_START: true,
  SCHOOL_SCOPING_REQUIRED: true,
} as const;

// Business logic constants
export const ENROLLMENT_BUSINESS_RULES = {
  DEFAULT_STATUS: 'active' as const,
  AUTO_CREATE_ON_APPROVAL: true,
  REQUIRE_PARENT_CHILD_SAME_SCHOOL: true,
  TRACK_STATUS_CHANGES: true,
} as const;