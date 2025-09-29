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
import { teams, parentProfiles } from '../schema';

export const paymentTypeEnum = pgEnum('payment_type', [
  'card',
  'bank_account',
  'ach'
]);

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => teams.id),
  parentId: uuid('parent_id')
    .notNull()
    .references(() => parentProfiles.id),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  lastFour: text('last_four').notNull(),
  brand: text('brand').notNull(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  school: one(teams, {
    fields: [paymentMethods.schoolId],
    references: [teams.id],
  }),
  parent: one(parentProfiles, {
    fields: [paymentMethods.parentId],
    references: [parentProfiles.id],
  }),
}));

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;