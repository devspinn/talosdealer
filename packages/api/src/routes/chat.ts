import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { dealers } from '@talosdealer/db'
import type { AppEnv } from '../app'
import { runAgent } from '../agent'
import type { ClaudeMessage } from '../agent/client'

const app = new Hono<AppEnv>()

const MAX_MESSAGES = 40

// POST /api/dealers/:slug/chat
// Body: { messages: [{role, content}], pageContext?: { path, unitId } }
app.post('/:slug/chat', async (c) => {
  const db = c.get('db')
  const slug = c.req.param('slug')

  const [dealer] = await db.select().from(dealers).where(eq(dealers.slug, slug))
  if (!dealer) return c.json({ error: 'Dealer not found' }, 404)
  if (!dealer.chatEnabled) return c.json({ error: 'Chat disabled for this dealer' }, 403)

  const body = await c.req.json().catch(() => null)
  if (!body || !Array.isArray(body.messages)) {
    return c.json({ error: 'Expected { messages: [...] }' }, 400)
  }

  const rawMessages = body.messages as Array<{ role?: string; content?: string }>
  if (rawMessages.length === 0) {
    return c.json({ error: 'messages is empty' }, 400)
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return c.json({ error: `Too many messages (max ${MAX_MESSAGES})` }, 400)
  }

  const messages: ClaudeMessage[] = []
  for (const m of rawMessages) {
    if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return c.json({ error: 'Invalid message shape' }, 400)
    }
    messages.push({ role: m.role, content: m.content })
  }

  const pageContext = body.pageContext && typeof body.pageContext === 'object'
    ? {
        path: typeof body.pageContext.path === 'string' ? body.pageContext.path : undefined,
        unitId: typeof body.pageContext.unitId === 'string' ? body.pageContext.unitId : undefined,
      }
    : undefined

  if (!c.env.AWS_BEARER_TOKEN_BEDROCK) {
    return c.json({ error: 'Chat not configured: missing AWS_BEARER_TOKEN_BEDROCK' }, 500)
  }

  try {
    const result = await runAgent({
      db,
      dealer,
      messages,
      pageContext,
      env: {
        AWS_BEARER_TOKEN_BEDROCK: c.env.AWS_BEARER_TOKEN_BEDROCK,
        AWS_REGION: c.env.AWS_REGION,
        ANTHROPIC_SMALL_FAST_MODEL: c.env.ANTHROPIC_SMALL_FAST_MODEL,
      },
    })
    return c.json({ message: { role: 'assistant', content: result.text }, agentName: result.agentName })
  } catch (err) {
    console.error('[chat] agent error', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: `Agent error: ${message}` }, 500)
  }
})

export default app
