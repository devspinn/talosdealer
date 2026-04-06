import { pgTable, text, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { unitTypeEnum, conditionEnum } from './enums'
import { dealers } from './dealers'

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealerId: uuid('dealer_id').notNull().references(() => dealers.id, { onDelete: 'cascade' }),
  externalId: text('external_id'),
  year: integer('year'),
  make: text('make').notNull(),
  model: text('model').notNull(),
  trim: text('trim'),
  type: unitTypeEnum('type').notNull().default('other'),
  condition: conditionEnum('condition').notNull().default('new'),
  price: integer('price'),
  specs: jsonb('specs').$type<Record<string, string>>().notNull().default({}),
  originalDescription: text('original_description'),
  aiDescription: text('ai_description').notNull(),
  photos: text('photos').array().notNull().default([]),
  stockNumber: text('stock_number'),
  url: text('url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
