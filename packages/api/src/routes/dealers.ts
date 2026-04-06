import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb, dealers } from '@roostdealer/db'

const db = createDb()

const app = new Hono()

// GET /api/dealers — list all dealers
app.get('/', async (c) => {
  const result = await db.select().from(dealers).orderBy(dealers.name)
  return c.json(result)
})

// GET /api/dealers/:slug — single dealer by slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const [dealer] = await db.select().from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)
  return c.json(dealer)
})

export default app
