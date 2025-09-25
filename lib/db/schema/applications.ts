import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import existing tables for references
import { users, teams } from '../schema';

// Application status enum
export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'approved',
  'rejected'
]);

// Child gender enum for applications
export const childGenderEnum = pgEnum('child_gender', [
  'male',
  'female',
  'other'
]);

// Applications table - new design for admin applications management
export const applicationsNew = pgTable('applications_new', {
  // Primary identification
  id: uuid('id').primaryKey().defaultRandom(),

  // Multi-tenant scoping
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),

  // Parent information
  parentName: varchar('parent_name', { length: 255 }).notNull(),
  parentEmail: varchar('parent_email', { length: 255 }).notNull(),
  parentPhone: varchar('parent_phone', { length: 20 }),

  // Child information
  childName: varchar('child_name', { length: 255 }).notNull(),
  childDateOfBirth: date('child_date_of_birth').notNull(),
  childGender: childGenderEnum('child_gender'),

  // Program and enrollment preferences
  programRequested: varchar('program_requested', { length: 100 }).notNull(),
  preferredStartDate: date('preferred_start_date'),

  // Application status and workflow
  status: applicationStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),

  // Approval workflow fields
  approvedAt: timestamp('approved_at'),
  approvedBy: integer('approved_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: integer('rejected_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations for the new applications table
export const applicationsNewRelations = relations(applicationsNew, ({ one }) => ({
  school: one(teams, {
    fields: [applicationsNew.schoolId],
    references: [teams.id],
  }),
  approvedByUser: one(users, {
    fields: [applicationsNew.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
  rejectedByUser: one(users, {
    fields: [applicationsNew.rejectedBy],
    references: [users.id],
    relationName: 'rejecter',
  }),
}));

// Type exports for the new applications table
export type ApplicationNew = typeof applicationsNew.$inferSelect;
export type NewApplicationNew = typeof applicationsNew.$inferInsert;

// Application with relations type
export type ApplicationWithRelations = ApplicationNew & {
  school?: {
    id: number;
    name: string;
  };
  approvedByUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejectedByUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

// Search and filtering types
export interface ApplicationFilters {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  programRequested?: string;
  sortBy?: 'createdAt' | 'parentName' | 'childName';
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface ApplicationListResponse {
  applications: ApplicationWithRelations[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ApplicationFilters;
}

// Approval/Rejection request types
export interface ApprovalRequest {
  applicationId: string;
  action: 'approve';
  parentData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    sendWelcomeEmail?: boolean;
  };
  childData: {
    name: string;
    dateOfBirth: string;
    gender?: 'male' | 'female' | 'other';
    programId?: string;
    startDate?: string;
  };
  enrollmentData: {
    programId?: string;
    status?: 'active';
    startDate?: string;
  };
  notes?: string;
}

export interface RejectionRequest {
  applicationId: string;
  action: 'reject';
  rejectionReason: string;
  notifyParent?: boolean;
  notes?: string;
}

export type ProcessApplicationRequest = ApprovalRequest | RejectionRequest;