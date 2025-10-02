import {
  pgTable,
  uuid,
  integer,
  varchar,
  pgEnum,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from '../schema';

export const eventTypeEnum = pgEnum('event_type', [
  'meeting',
  'ceremony',
  'training',
  'social',
  'academic',
]);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  eventDate: timestamp('event_date').notNull(),
  participantCount: integer('participant_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  tenant: one(teams, {
    fields: [events.tenantId],
    references: [teams.id],
  }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
