export type UnitType = 'boat' | 'motorcycle' | 'atv' | 'utv' | 'snowmobile' | 'pwc' | 'trailer' | 'other'
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
  categoryImages?: Record<string, string>
  sourceUrl?: string
}

export interface EnrichedData {
  dealer: DealerInfo
  units: Unit[]
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed'

export interface Lead {
  id: string
  dealerId: string
  unitId?: string | null
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  interest?: string | null
  message?: string | null
  status: LeadStatus
  source: string
  createdAt: string
  updatedAt: string
  unitYear?: number | null
  unitMake?: string | null
  unitModel?: string | null
}
