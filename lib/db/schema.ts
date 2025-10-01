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
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Import enrollments schema
export * from './schema/enrollments';

// Import payment schemas
export * from './schema/payment-record';
export * from './schema/payment-method';
export * from './schema/invoice';
export * from './schema/invoice-line-item';
export * from './schema/payment-alert';
export * from './schema/access-log';

export const userRoleEnum = pgEnum('user_role', ['parent', 'teacher', 'admin']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['enrolled', 'pending', 'waitlisted', 'withdrawn']);
export const paymentStatusEnum = pgEnum('payment_status', ['current', 'pending', 'overdue', 'partial']);
export const alertSeverityEnum = pgEnum('alert_severity', ['low', 'medium', 'high', 'critical']);
export const alertTypeEnum = pgEnum('alert_type', ['failed_logins', 'suspicious_ip', 'expired_sessions', 'data_breach_attempt', 'unusual_activity']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['basic', 'premium', 'enterprise']);
export const subscriptionStateEnum = pgEnum('subscription_state', ['active', 'past_due', 'canceled', 'trial']);
export const applicationStatusEnum = pgEnum('application_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER']);
export const childEnrollmentStatusEnum = pgEnum('child_enrollment_status', ['ACTIVE', 'INACTIVE', 'WAITLISTED']);
export const accessLogActionEnum = pgEnum('access_log_action', ['APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'CHILD_CREATED', 'APPLICATION_VIEWED']);
export const accessLogTargetEnum = pgEnum('access_log_target', ['APPLICATION', 'CHILD', 'PARENT']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('parent'),
  sessionVersion: integer('session_version').notNull().default(1),
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
  // Admin Settings for school defaults
  defaultMonthlyFeeRon: decimal('default_monthly_fee_ron', { precision: 10, scale: 2 }).default('0.00'),
  freeEnrollmentCount: integer('free_enrollment_count').default(0),
  maximumCapacity: integer('maximum_capacity').default(100),
  settingsUpdatedAt: timestamp('settings_updated_at'),
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
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  applicationId: uuid('application_id').references(() => applications.id), // nullable for direct creation
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  monthlyFee: integer('monthly_fee').notNull().default(0), // cents
  gender: varchar('gender', { length: 50 }),
  enrollmentStatus: childEnrollmentStatusEnum('enrollment_status').notNull().default('ACTIVE'),
  startDate: timestamp('start_date').notNull(),
  specialNeeds: text('special_needs'),
  medicalConditions: text('medical_conditions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdByAdminId: integer('created_by_admin_id')
    .notNull()
    .references(() => users.id),
});

export const parentProfiles = pgTable('parent_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  emergencyContact: boolean('emergency_contact').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const parentChildRelationships = pgTable('parent_child_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  parentId: uuid('parent_id')
    .notNull()
    .references(() => parentProfiles.id),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  primaryContact: boolean('primary_contact').notNull().default(false),
  pickupAuthorized: boolean('pickup_authorized').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  status: applicationStatusEnum('status').notNull().default('PENDING'),
  childFirstName: varchar('child_first_name', { length: 100 }).notNull(),
  childLastName: varchar('child_last_name', { length: 100 }).notNull(),
  childDateOfBirth: timestamp('child_date_of_birth').notNull(),
  childGender: varchar('child_gender', { length: 50 }),
  preferredStartDate: timestamp('preferred_start_date').notNull(),
  specialNeeds: text('special_needs'),
  medicalConditions: text('medical_conditions'),
  parent1FirstName: varchar('parent1_first_name', { length: 100 }).notNull(),
  parent1LastName: varchar('parent1_last_name', { length: 100 }).notNull(),
  parent1Email: varchar('parent1_email', { length: 255 }).notNull(),
  parent1Phone: varchar('parent1_phone', { length: 20 }),
  parent1Relationship: relationshipTypeEnum('parent1_relationship').notNull(),
  parent2FirstName: varchar('parent2_first_name', { length: 100 }),
  parent2LastName: varchar('parent2_last_name', { length: 100 }),
  parent2Email: varchar('parent2_email', { length: 255 }),
  parent2Phone: varchar('parent2_phone', { length: 20 }),
  parent2Relationship: relationshipTypeEnum('parent2_relationship'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
  processedByAdminId: integer('processed_by_admin_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const adminAccessLogs = pgTable('admin_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  adminUserId: integer('admin_user_id')
    .notNull()
    .references(() => users.id),
  actionType: accessLogActionEnum('action_type').notNull(),
  targetType: accessLogTargetEnum('target_type').notNull(),
  targetId: varchar('target_id', { length: 255 }).notNull(),
  details: text('details'), // JSON string
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
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
  school: one(teams, {
    fields: [children.schoolId],
    references: [teams.id],
  }),
  application: one(applications, {
    fields: [children.applicationId],
    references: [applications.id],
  }),
  createdByAdmin: one(users, {
    fields: [children.createdByAdminId],
    references: [users.id],
  }),
  parentRelationships: many(parentChildRelationships),
  enrollments: many('enrollments'),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  school: one(teams, {
    fields: [applications.schoolId],
    references: [teams.id],
  }),
  processedByAdmin: one(users, {
    fields: [applications.processedByAdminId],
    references: [users.id],
  }),
  childProfiles: many(children), // children created from this application
}));

export const parentProfilesRelations = relations(parentProfiles, ({ one, many }) => ({
  school: one(teams, {
    fields: [parentProfiles.schoolId],
    references: [teams.id],
  }),
  childRelationships: many(parentChildRelationships),
}));

export const parentChildRelationshipsRelations = relations(parentChildRelationships, ({ one }) => ({
  school: one(teams, {
    fields: [parentChildRelationships.schoolId],
    references: [teams.id],
  }),
  parent: one(parentProfiles, {
    fields: [parentChildRelationships.parentId],
    references: [parentProfiles.id],
  }),
  child: one(children, {
    fields: [parentChildRelationships.childId],
    references: [children.id],
  }),
}));

export const adminAccessLogsRelations = relations(adminAccessLogs, ({ one }) => ({
  school: one(teams, {
    fields: [adminAccessLogs.schoolId],
    references: [teams.id],
  }),
  adminUser: one(users, {
    fields: [adminAccessLogs.adminUserId],
    references: [users.id],
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
export type ParentProfile = typeof parentProfiles.$inferSelect;
export type NewParentProfile = typeof parentProfiles.$inferInsert;
export type ParentChildRelationship = typeof parentChildRelationships.$inferSelect;
export type NewParentChildRelationship = typeof parentChildRelationships.$inferInsert;
export type AdminAccessLog = typeof adminAccessLogs.$inferSelect;
export type NewAdminAccessLog = typeof adminAccessLogs.$inferInsert;

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
