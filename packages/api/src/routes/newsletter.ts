import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { dealers, newsletterSignups } from '@roostdealer/db'
import type { AppEnv } from '../app'

const app = new Hono<AppEnv>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/dealers/:slug/newsletter — public newsletter signup
app.post('/:slug/newsletter', async (c) => {
  const db = c.get('db')
  const slug = c.req.param('slug')

  const [dealer] = await db.select({ id: dealers.id }).from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)

  const body = await c.req.json()
  const email = body.email?.trim()

  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ error: 'Valid email address is required' }, 400)
  }

  await db.insert(newsletterSignups).values({
    dealerId: dealer.id,
    email,
  })

  return c.json({ success: true }, 201)
})

export default app
