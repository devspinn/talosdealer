import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { dealers, testimonials } from '@roostdealer/db'
import type { AppEnv } from '../app'

const app = new Hono<AppEnv>()

// GET /api/dealers/:slug/testimonials — public testimonials for a dealer
app.get('/:slug/testimonials', async (c) => {
  const db = c.get('db')
  const slug = c.req.param('slug')

  const [dealer] = await db.select({ id: dealers.id }).from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)

  const result = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.dealerId, dealer.id))
    .orderBy(desc(testimonials.createdAt))

  return c.json(result)
})

export default app
