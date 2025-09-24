import { relations } from "drizzle-orm/relations";
import { teams, activityLogs, users, invitations, teamMembers, accessLogs } from "./schema";

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
}));

export const usersRelations = relations(users, ({many}) => ({
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	accessLogs: many(accessLogs),
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