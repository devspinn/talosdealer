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
  socialLinks?: { facebook?: string; instagram?: string; youtube?: string; tiktok?: string }
  financingUrl?: string
  aboutContent?: string
  serviceContent?: string
  partsContent?: string
  heroSlides?: Array<{ image: string; video?: string; title: string; subtitle: string; ctaText?: string; ctaLink?: string }>
  chatWidgetCode?: string
  chatEnabled?: boolean
  chatAgentName?: string | null
  // Server-computed from chatAgentName (if set) or the dealer's dominant inventory vertical.
  // Populated on GET /api/dealers/:slug. Absent on the list endpoint.
  agentName?: string
}

export interface EnrichedData {
  dealer: DealerInfo
  units: Unit[]
}

export interface Testimonial {
  id: string
  reviewerName: string
  rating: number
  text: string
  source?: string
  createdAt: string
}

export interface Promotion {
  id: string
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  displayType?: string
  startsAt?: string
  endsAt?: string
  active: boolean
  createdAt: string
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
