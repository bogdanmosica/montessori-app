import {
  pgTable,
  uuid,
  integer,
  pgEnum,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams, users } from '../schema';

export const staffActivityTypeEnum = pgEnum('staff_activity_type', [
  'hire',
  'promotion',
  'training',
  'evaluation',
  'departure',
]);

export const staffActivities = pgTable('staff_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => teams.id),
  staffId: integer('staff_id')
    .notNull()
    .references(() => users.id),
  activityType: staffActivityTypeEnum('activity_type').notNull(),
  activityDate: timestamp('activity_date').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const staffActivitiesRelations = relations(staffActivities, ({ one }) => ({
  tenant: one(teams, {
    fields: [staffActivities.tenantId],
    references: [teams.id],
  }),
  staff: one(users, {
    fields: [staffActivities.staffId],
    references: [users.id],
  }),
}));

export type StaffActivity = typeof staffActivities.$inferSelect;
export type NewStaffActivity = typeof staffActivities.$inferInsert;
