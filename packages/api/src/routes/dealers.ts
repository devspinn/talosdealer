import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { dealers, units } from '@talosdealer/db'
import type { AppEnv } from '../app'
import { pickDomainFromCounts, resolveAgentName } from '../agent/context'

const app = new Hono<AppEnv>()

// GET /api/dealers — list all dealers
// For the directory page: no per-dealer inventory query, agentName falls back
// to the stored override or 'Sales Assistant' (list is rarely chat-adjacent).
app.get('/', async (c) => {
  const db = c.get('db')
  const result = await db.select().from(dealers).orderBy(dealers.name)
  return c.json(result)
})

// GET /api/dealers/:slug — single dealer, with computed agentName + domain.
// These drive the chat widget's pill + persona before any SSE happens, so they
// need to be authoritative. Server-computed once, no client-side duplication.
app.get('/:slug', async (c) => {
  const db = c.get('db')
  const slug = c.req.param('slug')
  const [dealer] = await db.select().from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)

  const typeRows = await db
    .select({ type: units.type, count: sql<number>`count(*)::int` })
    .from(units)
    .where(eq(units.dealerId, dealer.id))
    .groupBy(units.type)

  const byType = Object.fromEntries(typeRows.map((r) => [r.type, r.count]))
  const domain = pickDomainFromCounts(byType)
  const agentName = resolveAgentName(dealer, domain)

  return c.json({ ...dealer, agentName, domain })
})

export default app
