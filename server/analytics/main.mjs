import pg from 'pg'
import { createAnalyticsServer } from './http.mjs'
import { createPostgresStore } from './store.mjs'

const connectionString = process.env.MACHMO_ANALYTICS_DATABASE_URL
if (!connectionString) throw new Error('MACHMO_ANALYTICS_DATABASE_URL is required')
const database = new URL(connectionString)
if (!['postgres:', 'postgresql:'].includes(database.protocol) || database.hostname !== '127.0.0.1') {
  throw new Error('Analytics database must use the IPv4 loopback address')
}
const origins = (process.env.MACHMO_ANALYTICS_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean)
if (!origins.length || origins.some(value => new URL(value).origin !== value || !value.startsWith('https://'))) {
  throw new Error('Configure one or more exact HTTPS origins')
}
const pool = new pg.Pool({ connectionString, max: 4, connectionTimeoutMillis: 2500, idleTimeoutMillis: 10_000, statement_timeout: 3000 })
pool.on('error', () => console.error('Analytics idle database connection failed'))
const store = createPostgresStore(pool)
await store.expire()

const listeners = [
  [createAnalyticsServer({ mode: 'public', store, origins }), 8787],
  [createAnalyticsServer({ mode: 'private', store }), 8788],
]
for (const [server, port] of listeners) server.listen(port, '127.0.0.1')
const expiration = setInterval(() => {
  store.expire().catch(() => console.error('Analytics retention job failed'))
}, 60 * 60 * 1000)
expiration.unref()

function shutdown() {
  clearInterval(expiration)
  for (const [server] of listeners) server.close()
  void pool.end()
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
