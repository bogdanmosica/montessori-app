import {
  pgTable,
  uuid,
  integer,
  pgEnum,
  decimal,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { schools, children } from '../schema';

export const paymentActivityTypeEnum = pgEnum('payment_activity_type', [
  'tuition',
  'registration',
  'materials',
  'other',
]);

export const paymentActivityStatusEnum = pgEnum('payment_activity_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const paymentActivities = pgTable('payment_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => schools.id),
  childId: uuid('child_id')
    .references(() => children.id),
  activityType: paymentActivityTypeEnum('activity_type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  status: paymentActivityStatusEnum('status').notNull().default('pending'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentActivitiesRelations = relations(paymentActivities, ({ one }) => ({
  tenant: one(schools, {
    fields: [paymentActivities.tenantId],
    references: [schools.id],
  }),
  child: one(children, {
    fields: [paymentActivities.childId],
    references: [children.id],
  }),
}));

export type PaymentActivity = typeof paymentActivities.$inferSelect;
export type NewPaymentActivity = typeof paymentActivities.$inferInsert;
