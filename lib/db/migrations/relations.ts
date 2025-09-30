import { relations } from "drizzle-orm/relations";
import { teams, activityLogs, users, invitations, teamMembers, accessLogs, families, payments, schoolSettings, securityAlerts, teacherActivity, applications, adminAccessLogs, parentChildRelationships, parentProfiles, children, enrollments } from "./schema";

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	accessLogs: many(accessLogs),
	families: many(families),
	schoolSettings: many(schoolSettings),
	securityAlerts: many(securityAlerts),
	teacherActivities: many(teacherActivity),
	applications: many(applications),
	adminAccessLogs: many(adminAccessLogs),
	parentChildRelationships: many(parentChildRelationships),
	parentProfiles: many(parentProfiles),
	children: many(children),
	enrollments: many(enrollments),
}));

export const usersRelations = relations(users, ({many}) => ({
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	accessLogs: many(accessLogs),
	families: many(families),
	securityAlerts: many(securityAlerts),
	teacherActivities: many(teacherActivity),
	applications: many(applications),
	adminAccessLogs: many(adminAccessLogs),
	children: many(children),
	enrollments_createdBy: many(enrollments, {
		relationName: "enrollments_createdBy_users_id"
	}),
	enrollments_updatedBy: many(enrollments, {
		relationName: "enrollments_updatedBy_users_id"
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
}));

export const accessLogsRelations = relations(accessLogs, ({one}) => ({
	user: one(users, {
		fields: [accessLogs.userId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [accessLogs.teamId],
		references: [teams.id]
	}),
}));

export const familiesRelations = relations(families, ({one, many}) => ({
	team: one(teams, {
		fields: [families.schoolId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [families.primaryContactId],
		references: [users.id]
	}),
	payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	family: one(families, {
		fields: [payments.familyId],
		references: [families.id]
	}),
}));

export const schoolSettingsRelations = relations(schoolSettings, ({one}) => ({
	team: one(teams, {
		fields: [schoolSettings.schoolId],
		references: [teams.id]
	}),
}));

export const securityAlertsRelations = relations(securityAlerts, ({one}) => ({
	team: one(teams, {
		fields: [securityAlerts.schoolId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [securityAlerts.resolvedBy],
		references: [users.id]
	}),
}));

export const teacherActivityRelations = relations(teacherActivity, ({one}) => ({
	team: one(teams, {
		fields: [teacherActivity.schoolId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teacherActivity.userId],
		references: [users.id]
	}),
}));

export const applicationsRelations = relations(applications, ({one, many}) => ({
	team: one(teams, {
		fields: [applications.schoolId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [applications.processedByAdminId],
		references: [users.id]
	}),
	children: many(children),
}));

export const adminAccessLogsRelations = relations(adminAccessLogs, ({one}) => ({
	team: one(teams, {
		fields: [adminAccessLogs.schoolId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [adminAccessLogs.adminUserId],
		references: [users.id]
	}),
}));

export const parentChildRelationshipsRelations = relations(parentChildRelationships, ({one}) => ({
	team: one(teams, {
		fields: [parentChildRelationships.schoolId],
		references: [teams.id]
	}),
	parentProfile: one(parentProfiles, {
		fields: [parentChildRelationships.parentId],
		references: [parentProfiles.id]
	}),
	child: one(children, {
		fields: [parentChildRelationships.childId],
		references: [children.id]
	}),
}));

export const parentProfilesRelations = relations(parentProfiles, ({one, many}) => ({
	parentChildRelationships: many(parentChildRelationships),
	team: one(teams, {
		fields: [parentProfiles.schoolId],
		references: [teams.id]
	}),
}));

export const childrenRelations = relations(children, ({one, many}) => ({
	parentChildRelationships: many(parentChildRelationships),
	team: one(teams, {
		fields: [children.schoolId],
		references: [teams.id]
	}),
	application: one(applications, {
		fields: [children.applicationId],
		references: [applications.id]
	}),
	user: one(users, {
		fields: [children.createdByAdminId],
		references: [users.id]
	}),
	enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({one}) => ({
	child: one(children, {
		fields: [enrollments.childId],
		references: [children.id]
	}),
	team: one(teams, {
		fields: [enrollments.schoolId],
		references: [teams.id]
	}),
	user_createdBy: one(users, {
		fields: [enrollments.createdBy],
		references: [users.id],
		relationName: "enrollments_createdBy_users_id"
	}),
	user_updatedBy: one(users, {
		fields: [enrollments.updatedBy],
		references: [users.id],
		relationName: "enrollments_updatedBy_users_id"
	}),
}));