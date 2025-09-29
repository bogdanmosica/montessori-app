import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams, parentProfiles, users } from '../schema';
import { paymentRecords } from './payment-record';

export const alertTypeEnum = pgEnum('alert_type', [
  'failed_payment',
  'overdue_payment',
  'expired_card',
  'webhook_failure'
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const paymentAlerts = pgTable('payment_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  parentId: uuid('parent_id')
    .references(() => parentProfiles.id),
  paymentId: uuid('payment_id')
    .references(() => paymentRecords.id),
  alertType: alertTypeEnum('alert_type').notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedBy: integer('resolved_by')
    .references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentAlertsRelations = relations(paymentAlerts, ({ one }) => ({
  school: one(teams, {
    fields: [paymentAlerts.schoolId],
    references: [teams.id],
  }),
  parent: one(parentProfiles, {
    fields: [paymentAlerts.parentId],
    references: [parentProfiles.id],
  }),
  payment: one(paymentRecords, {
    fields: [paymentAlerts.paymentId],
    references: [paymentRecords.id],
  }),
  resolvedByUser: one(users, {
    fields: [paymentAlerts.resolvedBy],
    references: [users.id],
  }),
}));

export type PaymentAlert = typeof paymentAlerts.$inferSelect;
export type NewPaymentAlert = typeof paymentAlerts.$inferInsert;