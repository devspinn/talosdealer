import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import authRoutes from './routes/auth'
import dealerRoutes from './routes/dealers'
import unitRoutes from './routes/units'

const app = new Hono()

app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
)

app.route('/api/auth', authRoutes)
app.route('/api/dealers', dealerRoutes)
app.route('/api/dealers', unitRoutes)

app.get('/', (c) => c.json({ name: 'RoostDealer API', version: '0.1.0' }))

const port = parseInt(process.env.PORT || '3000')
serve({ fetch: app.fetch, port }, () => {
  console.log(`RoostDealer API running on http://localhost:${port}`)
})
