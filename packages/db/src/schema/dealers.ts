import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

export const dealers = pgTable('dealers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  hours: text('hours'),
  heroImage: text('hero_image'),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  categoryImages: jsonb('category_images').$type<Record<string, string>>(),
  sourceUrl: text('source_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
