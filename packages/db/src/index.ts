export { createDb, type Database } from './client'
export * from './schema'

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { dealers } from './schema/dealers'
import { units } from './schema/units'
import { leads } from './schema/leads'
import { user } from './schema/auth'

export type Dealer = InferSelectModel<typeof dealers>
export type NewDealer = InferInsertModel<typeof dealers>
export type Unit = InferSelectModel<typeof units>
export type NewUnit = InferInsertModel<typeof units>

export type User = InferSelectModel<typeof user>
export type NewUser = InferInsertModel<typeof user>

export type Lead = InferSelectModel<typeof leads>
export type NewLead = InferInsertModel<typeof leads>

export type UnitType = 'boat' | 'motorcycle' | 'atv' | 'utv' | 'snowmobile' | 'pwc' | 'trailer' | 'other'
export type Condition = 'new' | 'used'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed'
