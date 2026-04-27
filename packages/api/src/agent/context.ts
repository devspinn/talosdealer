import { eq, sql } from 'drizzle-orm'
import type { Database, Dealer, UnitType } from '@talosdealer/db'
import { units } from '@talosdealer/db'
import { loadSkills, type SkillDomain } from './skills/_loader'
import { SYSTEM_BASE } from './prompts/system-base'

export type PageContext = {
  path?: string
  unitId?: string
}

export type InventorySummary = {
  total: number
  byCondition: Record<string, number>
  byType: Record<string, number>
  topMakes: Array<{ make: string; count: number }>
  priceRange: { min: number | null; max: number | null }
  sampleUnits: Array<{
    id: string
    year: number | null
    make: string
    model: string
    type: string
    condition: string
    price: number | null
    stockNumber: string | null
  }>
}

export async function fetchInventorySummary(db: Database, dealerId: string): Promise<InventorySummary> {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      minPrice: sql<number | null>`min(${units.price})`,
      maxPrice: sql<number | null>`max(${units.price})`,
    })
    .from(units)
    .where(eq(units.dealerId, dealerId))

  const byConditionRows = await db
    .select({
      condition: units.condition,
      count: sql<number>`count(*)::int`,
    })
    .from(units)
    .where(eq(units.dealerId, dealerId))
    .groupBy(units.condition)

  const byTypeRows = await db
    .select({
      type: units.type,
      count: sql<number>`count(*)::int`,
    })
    .from(units)
    .where(eq(units.dealerId, dealerId))
    .groupBy(units.type)

  const topMakeRows = await db
    .select({
      make: units.make,
      count: sql<number>`count(*)::int`,
    })
    .from(units)
    .where(eq(units.dealerId, dealerId))
    .groupBy(units.make)
    .orderBy(sql`count(*) desc`)
    .limit(8)

  const sample = await db
    .select({
      id: units.id,
      year: units.year,
      make: units.make,
      model: units.model,
      type: units.type,
      condition: units.condition,
      price: units.price,
      stockNumber: units.stockNumber,
    })
    .from(units)
    .where(eq(units.dealerId, dealerId))
    .orderBy(sql`random()`)
    .limit(30)

  return {
    total: counts?.total ?? 0,
    byCondition: Object.fromEntries(byConditionRows.map((r) => [r.condition, r.count])),
    byType: Object.fromEntries(byTypeRows.map((r) => [r.type, r.count])),
    topMakes: topMakeRows,
    priceRange: { min: counts?.minPrice ?? null, max: counts?.maxPrice ?? null },
    sampleUnits: sample,
  }
}

/**
 * Pick domain by dominant inventory type:
 * - boat/pwc/trailer → marine
 * - motorcycle/atv/utv/snowmobile → powersports
 * Ties and 'other'-heavy dealers default to powersports.
 */
export function pickDomain(summary: InventorySummary): SkillDomain {
  const marineTypes: UnitType[] = ['boat', 'pwc', 'trailer']
  const powersportsTypes: UnitType[] = ['motorcycle', 'atv', 'utv', 'snowmobile']
  let marine = 0
  let powersports = 0
  for (const [t, n] of Object.entries(summary.byType)) {
    if (marineTypes.includes(t as UnitType)) marine += n
    if (powersportsTypes.includes(t as UnitType)) powersports += n
  }
  return marine > powersports ? 'marine' : 'powersports'
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US')
}

function formatDealerProfile(dealer: Dealer, vertical: string): string {
  const location = [dealer.city, dealer.state].filter(Boolean).join(', ')
  const parts: string[] = []
  parts.push(`# Dealer profile`)
  parts.push(`- Name: ${dealer.name}`)
  if (location) parts.push(`- Location: ${location}`)
  if (dealer.address) parts.push(`- Address: ${dealer.address}`)
  if (dealer.phone) parts.push(`- Phone: ${dealer.phone}`)
  if (dealer.email) parts.push(`- Email: ${dealer.email}`)
  if (dealer.hours) parts.push(`- Hours: ${dealer.hours}`)
  if (dealer.financingUrl) parts.push(`- Financing page: ${dealer.financingUrl}`)
  parts.push(`- Vertical: ${vertical}`)

  if (dealer.heroTitle || dealer.heroSubtitle) {
    parts.push('')
    parts.push(`## Hero messaging`)
    if (dealer.heroTitle) parts.push(`- Title: ${dealer.heroTitle}`)
    if (dealer.heroSubtitle) parts.push(`- Subtitle: ${dealer.heroSubtitle}`)
  }

  if (dealer.aboutContent) {
    parts.push('')
    parts.push(`## About`)
    parts.push(dealer.aboutContent)
  }

  if (dealer.serviceContent) {
    parts.push('')
    parts.push(`## Service`)
    parts.push(dealer.serviceContent)
  }

  return parts.join('\n')
}

function formatInventorySummary(summary: InventorySummary): string {
  const parts: string[] = []
  parts.push(`# Inventory summary`)
  parts.push(`- Total units in system: ${summary.total}`)
  const condPairs = Object.entries(summary.byCondition)
  if (condPairs.length) {
    parts.push(`- Condition: ${condPairs.map(([k, v]) => `${v} ${k}`).join(', ')}`)
  }
  const typePairs = Object.entries(summary.byType).sort((a, b) => b[1] - a[1])
  if (typePairs.length) {
    parts.push(`- By type: ${typePairs.map(([k, v]) => `${v} ${k}`).join(', ')}`)
  }
  if (summary.topMakes.length) {
    parts.push(`- Top makes: ${summary.topMakes.map((m) => `${m.make} (${m.count})`).join(', ')}`)
  }
  if (summary.priceRange.min != null && summary.priceRange.max != null) {
    parts.push(`- Price range: ${formatMoney(summary.priceRange.min)} – ${formatMoney(summary.priceRange.max)}`)
  }

  if (summary.sampleUnits.length) {
    parts.push('')
    parts.push(`## Sample of current inventory (random ${summary.sampleUnits.length})`)
    parts.push(`Use these as concrete examples when answering — these units ARE in stock.`)
    for (const u of summary.sampleUnits) {
      const year = u.year ?? '—'
      const stock = u.stockNumber ? ` [stock ${u.stockNumber}]` : ''
      parts.push(`- ${year} ${u.make} ${u.model} · ${u.type} · ${u.condition} · ${formatMoney(u.price)}${stock} (id: ${u.id})`)
    }
  }

  return parts.join('\n')
}

function formatPageContext(pageContext?: PageContext): string {
  if (!pageContext?.path) return ''
  const parts = [`# Page context`, `- Customer is currently on: ${pageContext.path}`]
  if (pageContext.unitId) {
    parts.push(`- They are looking at unit id: ${pageContext.unitId}`)
  }
  return parts.join('\n')
}

function formatSkills(domain: SkillDomain): string {
  const skills = loadSkills({ domain })
  if (skills.length === 0) return ''
  const parts: string[] = []
  parts.push(`# Skills`)
  parts.push(`You have the following skills available. Read and apply them.`)
  for (const s of skills) {
    parts.push('')
    parts.push(`## Skill: ${s.name}`)
    parts.push(`_${s.description}_`)
    parts.push('')
    parts.push(s.body)
  }
  return parts.join('\n')
}

export type BuildSystemPromptArgs = {
  dealer: Dealer
  inventorySummary: InventorySummary
  pageContext?: PageContext
  agentName: string
}

export function buildSystemPrompt(args: BuildSystemPromptArgs): string {
  const { dealer, inventorySummary, pageContext, agentName } = args
  const domain = pickDomain(inventorySummary)
  const vertical = domain === 'marine' ? 'marine' : 'powersports'

  const base = SYSTEM_BASE.replace('{agentName}', agentName)
    .replace('{dealerName}', dealer.name)
    .replace('{vertical}', vertical)
    .replace('{city}', dealer.city ?? '')
    .replace('{state}', dealer.state ?? '')

  const sections = [
    base,
    formatDealerProfile(dealer, vertical),
    formatInventorySummary(inventorySummary),
    formatPageContext(pageContext),
    formatSkills(domain),
  ].filter(Boolean)

  return sections.join('\n\n')
}

export function resolveAgentName(dealer: Dealer, domain: SkillDomain): string {
  if (dealer.chatAgentName && dealer.chatAgentName.trim()) return dealer.chatAgentName.trim()
  if (domain === 'marine') return 'Marina'
  return 'Max'
}
