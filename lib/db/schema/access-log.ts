import {
  pgTable,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams, users } from '../schema';
import { paymentRecords } from './payment-record';

// Extend existing access log enum to include payment actions
export const paymentActionEnum = pgEnum('payment_action', [
  'view_payments',
  'process_refund',
  'update_method',
  'download_invoice',
  'view_dashboard',
  'resolve_alert'
]);

export const extendedAccessLogs = pgTable('extended_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .references(() => users.id),
  teamId: integer('team_id')
    .references(() => teams.id),
  route: text('route').notNull(),
  success: boolean('success').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  // Payment-specific fields
  paymentId: uuid('payment_id')
    .references(() => paymentRecords.id),
  paymentAction: paymentActionEnum('payment_action'),
  amountAffected: decimal('amount_affected', { precision: 10, scale: 2 }),
});

export const extendedAccessLogsRelations = relations(extendedAccessLogs, ({ one }) => ({
  user: one(users, {
    fields: [extendedAccessLogs.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [extendedAccessLogs.teamId],
    references: [teams.id],
  }),
  payment: one(paymentRecords, {
    fields: [extendedAccessLogs.paymentId],
    references: [paymentRecords.id],
  }),
}));

export type ExtendedAccessLog = typeof extendedAccessLogs.$inferSelect;
export type NewExtendedAccessLog = typeof extendedAccessLogs.$inferInsert;