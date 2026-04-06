import { pgEnum } from 'drizzle-orm/pg-core'

export const unitTypeEnum = pgEnum('unit_type', [
  'boat',
  'motorcycle',
  'atv',
  'utv',
  'snowmobile',
  'pwc',
  'trailer',
  'other',
])

export const conditionEnum = pgEnum('condition', ['new', 'used'])
