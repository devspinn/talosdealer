import { Hono } from 'hono'
import { eq, and, ilike, sql } from 'drizzle-orm'
import { createDb, dealers, units } from '@roostdealer/db'

const db = createDb()

const app = new Hono()

// GET /api/dealers/:slug/inventory — list units with optional filters
app.get('/:slug/inventory', async (c) => {
  const slug = c.req.param('slug')
  const type = c.req.query('type')
  const condition = c.req.query('condition')
  const make = c.req.query('make')
  const search = c.req.query('search')

  // Resolve dealer
  const [dealer] = await db.select({ id: dealers.id }).from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)

  const conditions = [eq(units.dealerId, dealer.id)]
  if (type) conditions.push(eq(units.type, type as any))
  if (condition) conditions.push(eq(units.condition, condition as any))
  if (make) conditions.push(ilike(units.make, make))
  if (search) {
    conditions.push(
      sql`(${ilike(units.make, `%${search}%`)} OR ${ilike(units.model, `%${search}%`)})`
    )
  }

  const result = await db
    .select()
    .from(units)
    .where(and(...conditions))
    .orderBy(units.year)

  return c.json(result)
})

// GET /api/dealers/:slug/inventory/:id — single unit
app.get('/:slug/inventory/:id', async (c) => {
  const id = c.req.param('id')
  const [unit] = await db.select().from(units).where(eq(units.id, id))
  if (!unit) return c.json({ error: 'Unit not found' }, 404)
  return c.json(unit)
})

export default app
