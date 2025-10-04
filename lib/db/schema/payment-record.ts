import {
  pgTable,
  uuid,
  integer,
  text,
  decimal,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { schools, parentProfiles, children } from '../schema';

// Payment related enums
export const paymentMethodEnum = pgEnum('payment_method', [
  'stripe_card',
  'stripe_bank',
  'bank_transfer',
  'ach'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
  'refunded'
]);

export const paymentRecords = pgTable('payment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => schools.id),
  parentId: uuid('parent_id')
    .notNull()
    .references(() => parentProfiles.id),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id),
  stripePaymentId: text('stripe_payment_id'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  paymentDate: timestamp('payment_date').notNull(),
  completedDate: timestamp('completed_date'),
  failureReason: text('failure_reason'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  school: one(schools, {
    fields: [paymentRecords.schoolId],
    references: [schools.id],
  }),
  parent: one(parentProfiles, {
    fields: [paymentRecords.parentId],
    references: [parentProfiles.id],
  }),
  child: one(children, {
    fields: [paymentRecords.childId],
    references: [children.id],
  }),
}));

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type NewPaymentRecord = typeof paymentRecords.$inferInsert;
