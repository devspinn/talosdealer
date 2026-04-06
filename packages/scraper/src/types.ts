export type UnitType =
  | 'boat'
  | 'motorcycle'
  | 'atv'
  | 'utv'
  | 'snowmobile'
  | 'pwc'
  | 'trailer'
  | 'other'

export type Condition = 'new' | 'used'

export interface Unit {
  id: string
  year: number | null
  make: string
  model: string
  trim?: string
  type: UnitType
  condition: Condition
  price: number | null
  specs: Record<string, string>
  originalDescription?: string
  aiDescription: string
  photos: string[]
  stockNumber?: string
  url?: string
}

export interface RawListing {
  url: string
  title: string
  price?: string
  photos: string[]
  specs: Record<string, string>
  description?: string
  rawHtml: string
}

export interface DealerInfo {
  name: string
  slug: string
  logo?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  hours?: string
  heroImage?: string
  heroTitle?: string
  heroSubtitle?: string
  sourceUrl: string
}

export interface ScrapedData {
  dealer: DealerInfo
  listings: RawListing[]
}

export interface EnrichedData {
  dealer: DealerInfo
  units: Unit[]
}
