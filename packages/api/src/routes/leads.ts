import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { dealers, leads, units } from '@roostdealer/db'
import type { AppEnv } from '../app'

const app = new Hono<AppEnv>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/dealers/:slug/leads — public lead submission
app.post('/:slug/leads', async (c) => {
  const db = c.get('db')
  const slug = c.req.param('slug')

  // Resolve dealer
  const [dealer] = await db.select({ id: dealers.id }).from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)

  const body = await c.req.json()

  // Honeypot — bots fill this hidden field, real users don't
  if (body.website) {
    return c.json({ lead: { id: 'ok' } }, 200)
  }

  // Validate required fields
  const errors: string[] = []
  if (!body.firstName?.trim()) errors.push('First name is required')
  if (!body.lastName?.trim()) errors.push('Last name is required')
  if (!body.email?.trim()) errors.push('Email is required')
  else if (!EMAIL_RE.test(body.email)) errors.push('Invalid email address')
  if (errors.length) return c.json({ error: errors.join('. ') }, 400)

  // Validate unit if provided
  let unitId: string | null = null
  if (body.unitId) {
    const [unit] = await db.select({ id: units.id }).from(units)
      .where(and(eq(units.id, body.unitId), eq(units.dealerId, dealer.id)))
    if (unit) unitId = unit.id
  }

  const [lead] = await db.insert(leads).values({
    dealerId: dealer.id,
    unitId,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim() || null,
    interest: body.interest || null,
    message: body.message?.trim() || null,
    source: body.source || 'contact_form',
    metadata: body.metadata || {},
  }).returning()

  return c.json({ lead }, 201)
})

export default app
