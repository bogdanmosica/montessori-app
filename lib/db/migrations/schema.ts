import { pgTable, unique, serial, varchar, timestamp, text, foreignKey, integer, uuid, boolean, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accessLogAction = pgEnum("access_log_action", ['APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'CHILD_CREATED', 'APPLICATION_VIEWED'])
export const accessLogTarget = pgEnum("access_log_target", ['APPLICATION', 'CHILD', 'PARENT'])
export const alertSeverity = pgEnum("alert_severity", ['low', 'medium', 'high', 'critical'])
export const alertType = pgEnum("alert_type", ['failed_logins', 'suspicious_ip', 'expired_sessions', 'data_breach_attempt', 'unusual_activity'])
export const applicationStatus = pgEnum("application_status", ['PENDING', 'APPROVED', 'REJECTED'])
export const childEnrollmentStatus = pgEnum("child_enrollment_status", ['ACTIVE', 'INACTIVE', 'WAITLISTED'])
export const enrollmentManagementStatus = pgEnum("enrollment_management_status", ['active', 'inactive', 'withdrawn', 'archived'])
export const enrollmentStatus = pgEnum("enrollment_status", ['enrolled', 'pending', 'waitlisted', 'withdrawn'])
export const paymentStatus = pgEnum("payment_status", ['current', 'pending', 'overdue', 'partial'])
export const relationshipType = pgEnum("relationship_type", ['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER'])
export const subscriptionState = pgEnum("subscription_state", ['active', 'past_due', 'canceled', 'trial'])
export const subscriptionTier = pgEnum("subscription_tier", ['basic', 'premium', 'enterprise'])
export const userRole = pgEnum("user_role", ['parent', 'teacher', 'admin', 'SUPER_ADMIN'])


export const teams = pgTable("teams", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
}, (table) => [
	unique("teams_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("teams_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	teamId: integer("team_id").notNull(),
	userId: integer("user_id"),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "activity_logs_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	teamId: integer("team_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	invitedBy: integer("invited_by").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invitations_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
]);

export const teamMembers = pgTable("team_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	teamId: integer("team_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_members_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_teams_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: userRole().default('parent').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	sessionVersion: integer("session_version").default(1).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const accessLogs = pgTable("access_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: integer("user_id"),
	teamId: integer("team_id"),
	route: text().notNull(),
	success: boolean().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	userAgent: text("user_agent"),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "access_logs_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "access_logs_team_id_teams_id_fk"
		}),
]);

export const families = pgTable("families", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	primaryContactId: integer("primary_contact_id").notNull(),
	discountRate: integer("discount_rate").default(0).notNull(),
	totalMonthlyFee: integer("total_monthly_fee").default(0).notNull(),
	paymentStatus: paymentStatus("payment_status").default('current').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "families_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.primaryContactId],
			foreignColumns: [users.id],
			name: "families_primary_contact_id_users_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	familyId: uuid("family_id").notNull(),
	amount: integer().notNull(),
	discountApplied: integer("discount_applied").default(0).notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }).notNull(),
	stripePaymentIntentId: text("stripe_payment_intent_id"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.familyId],
			foreignColumns: [families.id],
			name: "payments_family_id_families_id_fk"
		}),
]);

export const schoolSettings = pgTable("school_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	baseFeePerChild: integer("base_fee_per_child").default(65000).notNull(),
	totalCapacity: integer("total_capacity").default(100).notNull(),
	waitlistLimit: integer("waitlist_limit").default(50).notNull(),
	siblingDiscountRules: text("sibling_discount_rules"),
	ageGroupCapacities: text("age_group_capacities"),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "school_settings_school_id_teams_id_fk"
		}),
]);

export const securityAlerts = pgTable("security_alerts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id"),
	type: alertType().notNull(),
	severity: alertSeverity().notNull(),
	message: text().notNull(),
	metadata: text(),
	resolved: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: integer("resolved_by"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "security_alerts_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.id],
			name: "security_alerts_resolved_by_users_id_fk"
		}),
]);

export const teacherActivity = pgTable("teacher_activity", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	userId: integer("user_id").notNull(),
	sessionStart: timestamp("session_start", { mode: 'string' }).notNull(),
	sessionEnd: timestamp("session_end", { mode: 'string' }),
	sessionDuration: integer("session_duration"),
	classroomUpdates: integer("classroom_updates").default(0).notNull(),
	activityDate: timestamp("activity_date", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "teacher_activity_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "teacher_activity_user_id_users_id_fk"
		}),
]);

export const applications = pgTable("applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	status: applicationStatus().default('PENDING').notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedByAdminId: integer("processed_by_admin_id"),
	childFirstName: varchar("child_first_name", { length: 100 }).notNull(),
	childLastName: varchar("child_last_name", { length: 100 }).notNull(),
	childDateOfBirth: timestamp("child_date_of_birth", { mode: 'string' }).notNull(),
	childGender: varchar("child_gender", { length: 50 }),
	preferredStartDate: timestamp("preferred_start_date", { mode: 'string' }).notNull(),
	specialNeeds: text("special_needs"),
	medicalConditions: text("medical_conditions"),
	parent1FirstName: varchar("parent1_first_name", { length: 100 }).notNull(),
	parent1LastName: varchar("parent1_last_name", { length: 100 }).notNull(),
	parent1Email: varchar("parent1_email", { length: 255 }).notNull(),
	parent1Phone: varchar("parent1_phone", { length: 20 }),
	parent1Relationship: relationshipType("parent1_relationship").notNull(),
	parent2FirstName: varchar("parent2_first_name", { length: 100 }),
	parent2LastName: varchar("parent2_last_name", { length: 100 }),
	parent2Email: varchar("parent2_email", { length: 255 }),
	parent2Phone: varchar("parent2_phone", { length: 20 }),
	parent2Relationship: relationshipType("parent2_relationship"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "applications_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.processedByAdminId],
			foreignColumns: [users.id],
			name: "applications_processed_by_admin_id_users_id_fk"
		}),
]);

export const adminAccessLogs = pgTable("admin_access_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	adminUserId: integer("admin_user_id").notNull(),
	actionType: accessLogAction("action_type").notNull(),
	targetType: accessLogTarget("target_type").notNull(),
	targetId: uuid("target_id").notNull(),
	details: text(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "admin_access_logs_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.adminUserId],
			foreignColumns: [users.id],
			name: "admin_access_logs_admin_user_id_users_id_fk"
		}),
]);

export const parentChildRelationships = pgTable("parent_child_relationships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	parentId: uuid("parent_id").notNull(),
	childId: uuid("child_id").notNull(),
	relationshipType: relationshipType("relationship_type").notNull(),
	primaryContact: boolean("primary_contact").default(false).notNull(),
	pickupAuthorized: boolean("pickup_authorized").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "parent_child_relationships_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [parentProfiles.id],
			name: "parent_child_relationships_parent_id_parent_profiles_id_fk"
		}),
	foreignKey({
			columns: [table.childId],
			foreignColumns: [children.id],
			name: "parent_child_relationships_child_id_children_id_fk"
		}),
]);

export const parentProfiles = pgTable("parent_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: integer("school_id").notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	address: text(),
	emergencyContact: boolean("emergency_contact").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "parent_profiles_school_id_teams_id_fk"
		}),
]);

export const children = pgTable("children", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }).notNull(),
	enrollmentStatus: childEnrollmentStatus("enrollment_status").default('ACTIVE').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	schoolId: integer("school_id").notNull(),
	applicationId: uuid("application_id"),
	gender: varchar({ length: 50 }),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	specialNeeds: text("special_needs"),
	medicalConditions: text("medical_conditions"),
	createdByAdminId: integer("created_by_admin_id").notNull(),
	monthlyFee: integer("monthly_fee").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "children_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applications.id],
			name: "children_application_id_applications_id_fk"
		}),
	foreignKey({
			columns: [table.createdByAdminId],
			foreignColumns: [users.id],
			name: "children_created_by_admin_id_users_id_fk"
		}),
]);

export const enrollments = pgTable("enrollments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	childId: uuid("child_id").notNull(),
	schoolId: integer("school_id").notNull(),
	status: enrollmentManagementStatus().default('active').notNull(),
	enrollmentDate: timestamp("enrollment_date", { mode: 'string' }).notNull(),
	withdrawalDate: timestamp("withdrawal_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: integer("created_by").notNull(),
	updatedBy: integer("updated_by").notNull(),
}, (table) => [
	index("enrollments_child_id_idx").using("btree", table.childId.asc().nullsLast().op("uuid_ops")),
	index("enrollments_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("int4_ops")),
	index("enrollments_school_status_date_idx").using("btree", table.schoolId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops"), table.enrollmentDate.asc().nullsLast().op("timestamp_ops")),
	index("enrollments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.childId],
			foreignColumns: [children.id],
			name: "enrollments_child_id_children_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [teams.id],
			name: "enrollments_school_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "enrollments_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "enrollments_updated_by_users_id_fk"
		}),
]);
