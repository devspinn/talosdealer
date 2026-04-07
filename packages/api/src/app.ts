import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createDb, type Database } from '@roostdealer/db'
import { createAuth } from './auth'
import dealerRoutes from './routes/dealers'
import unitRoutes from './routes/units'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import leadRoutes from './routes/leads'

export type Env = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  RESEND_API_KEY: string
}

type Variables = {
  db: Database
  user: { id: string; name: string; email: string; dealerId?: string | null }
  session: { id: string; expiresAt: Date; userId: string }
}

export type AppEnv = { Bindings: Env; Variables: Variables }

/**
 * Create the Hono app. Pass getEnv for Node.js (process.env bridge).
 * Workers populates c.env automatically from bindings, so no getEnv needed.
 */
export function createApp(getEnv?: () => Env) {
  const app = new Hono<AppEnv>()

  // Node.js: bridge process.env into c.env (must run before db middleware)
  if (getEnv) {
    app.use('*', async (c, next) => {
      c.env = getEnv()
      await next()
    })
  }

  app.use('*', logger())

  app.use(
    '/api/*',
    cors({
      origin: (origin) => {
        const allowed = [
          'http://localhost:5173',
          'https://roostdealer.com',
          'https://www.roostdealer.com',
          'https://staging.roostdealer.com',
          'https://roostdealer-web.pages.dev',
        ]
        return allowed.includes(origin) ? origin : ''
      },
      credentials: true,
    })
  )

  // Inject db into context for all /api routes
  app.use('/api/*', async (c, next) => {
    const db = createDb(c.env.DATABASE_URL)
    c.set('db', db)
    await next()
  })

  app.route('/api/auth', authRoutes)
  app.route('/api/dashboard', dashboardRoutes)
  app.route('/api/dealers', dealerRoutes)
  app.route('/api/dealers', unitRoutes)
  app.route('/api/dealers', leadRoutes)

  app.get('/', (c) => c.json({ name: 'RoostDealer API', version: '0.1.0' }))

  return app
}
