import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['parent', 'teacher', 'admin', 'SUPER_ADMIN']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['enrolled', 'pending', 'waitlisted', 'withdrawn']);
export const paymentStatusEnum = pgEnum('payment_status', ['current', 'pending', 'overdue', 'partial']);
export const alertSeverityEnum = pgEnum('alert_severity', ['low', 'medium', 'high', 'critical']);
export const alertTypeEnum = pgEnum('alert_type', ['failed_logins', 'suspicious_ip', 'expired_sessions', 'data_breach_attempt', 'unusual_activity']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['basic', 'premium', 'enterprise']);
export const subscriptionStateEnum = pgEnum('subscription_state', ['active', 'past_due', 'canceled', 'trial']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('parent'),
  sessionVersion: integer('session_version').notNull().default(1),
  // Application-related fields for users created during approval process
  applicationId: uuid('application_id'), // Links back to originating application
  isFromApplication: boolean('is_from_application').notNull().default(false), // Distinguishes application-generated users
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id),
  teamId: integer('team_id').references(() => teams.id),
  route: text('route').notNull(),
  success: boolean('success').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// Dashboard-related tables
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  primaryContactId: integer('primary_contact_id')
    .notNull()
    .references(() => users.id),
  discountRate: integer('discount_rate').notNull().default(0), // percentage
  totalMonthlyFee: integer('total_monthly_fee').notNull().default(0), // cents
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('current'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  enrollmentStatus: enrollmentStatusEnum('enrollment_status').notNull().default('pending'),
  monthlyFee: integer('monthly_fee').notNull().default(0), // cents
  // Application-related field for children created during approval process
  applicationId: uuid('application_id'), // Links back to originating application
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
});

// New applications table for admin interface with detailed fields
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
  childDateOfBirth: timestamp('child_date_of_birth').notNull(),
  childGender: varchar('child_gender', { length: 10 }),

  // Program and enrollment preferences
  programRequested: varchar('program_requested', { length: 100 }).notNull(),
  preferredStartDate: timestamp('preferred_start_date'),

  // Application status and workflow
  status: varchar('status', { length: 20 }).notNull().default('pending'),
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

export const securityAlerts = pgTable('security_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id').references(() => teams.id), // null for system-wide alerts
  type: alertTypeEnum('type').notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON string
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by').references(() => users.id),
});

export const schoolSettings = pgTable('school_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  baseFeePerChild: integer('base_fee_per_child').notNull().default(65000), // cents ($650)
  totalCapacity: integer('total_capacity').notNull().default(100),
  waitlistLimit: integer('waitlist_limit').notNull().default(50),
  siblingDiscountRules: text('sibling_discount_rules'), // JSON string
  ageGroupCapacities: text('age_group_capacities'), // JSON string
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

export const teacherActivity = pgTable('teacher_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  sessionStart: timestamp('session_start').notNull(),
  sessionEnd: timestamp('session_end'),
  sessionDuration: integer('session_duration'), // minutes
  classroomUpdates: integer('classroom_updates').notNull().default(0),
  activityDate: timestamp('activity_date').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id),
  amount: integer('amount').notNull(), // cents
  discountApplied: integer('discount_applied').notNull().default(0), // cents
  paymentDate: timestamp('payment_date').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  accessLogs: many(accessLogs),
  families: many(families),
  applications: many(applications),
  securityAlerts: many(securityAlerts),
  teacherActivity: many(teacherActivity),
  schoolSettings: one(schoolSettings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  accessLogs: many(accessLogs),
  familiesAsContact: many(families),
  teacherActivity: many(teacherActivity),
  alertsResolved: many(securityAlerts, { relationName: 'resolver' }),
  applicationsReviewed: many(applications, { relationName: 'reviewer' }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [accessLogs.teamId],
    references: [teams.id],
  }),
}));

// New relations for dashboard tables
export const familiesRelations = relations(families, ({ one, many }) => ({
  school: one(teams, {
    fields: [families.schoolId],
    references: [teams.id],
  }),
  primaryContact: one(users, {
    fields: [families.primaryContactId],
    references: [users.id],
  }),
  children: many(children),
  payments: many(payments),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  family: one(families, {
    fields: [children.familyId],
    references: [families.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  school: one(teams, {
    fields: [applications.schoolId],
    references: [teams.id],
  }),
  child: one(children, {
    fields: [applications.childId],
    references: [children.id],
  }),
  reviewedBy: one(users, {
    fields: [applications.reviewedBy],
    references: [users.id],
    relationName: 'reviewer',
  }),
}));

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

export const securityAlertsRelations = relations(securityAlerts, ({ one }) => ({
  school: one(teams, {
    fields: [securityAlerts.schoolId],
    references: [teams.id],
  }),
  resolvedBy: one(users, {
    fields: [securityAlerts.resolvedBy],
    references: [users.id],
    relationName: 'resolver',
  }),
}));

export const schoolSettingsRelations = relations(schoolSettings, ({ one }) => ({
  school: one(teams, {
    fields: [schoolSettings.schoolId],
    references: [teams.id],
  }),
}));

export const teacherActivityRelations = relations(teacherActivity, ({ one }) => ({
  school: one(teams, {
    fields: [teacherActivity.schoolId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teacherActivity.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  family: one(families, {
    fields: [payments.familyId],
    references: [families.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type AccessLog = typeof accessLogs.$inferSelect;
export type NewAccessLog = typeof accessLogs.$inferInsert;

// Dashboard types
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type NewSecurityAlert = typeof securityAlerts.$inferInsert;
export type SchoolSettings = typeof schoolSettings.$inferSelect;
export type NewSchoolSettings = typeof schoolSettings.$inferInsert;
export type TeacherActivity = typeof teacherActivity.$inferSelect;
export type NewTeacherActivity = typeof teacherActivity.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type FamilyWithChildren = Family & {
  children: Child[];
  primaryContact: Pick<User, 'id' | 'name' | 'email'>;
  payments: Payment[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
