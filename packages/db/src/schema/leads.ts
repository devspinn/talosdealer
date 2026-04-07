import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { dealers } from './dealers'
import { units } from './units'
import { leadStatusEnum } from './enums'

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'set null' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  interest: text('interest'),
  message: text('message'),
  status: leadStatusEnum('status').notNull().default('new'),
  source: text('source').notNull().default('contact_form'),
  metadata: jsonb('metadata').$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
