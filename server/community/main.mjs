import pg from 'pg'
import { createSessionServer } from './session-http.mjs'
import { createSessionStore } from './session-store.mjs'

const origin = process.env.MACHMO_COMMUNITY_ORIGIN
const port = Number(process.env.MACHMO_COMMUNITY_PORT ?? '8191')
if (!origin || !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Set MACHMO_COMMUNITY_ORIGIN to the HTTPS URL and use a valid loopback port')
}
if (!process.env.PGHOST?.startsWith('/') || !process.env.PGDATABASE || !process.env.PGUSER) {
  throw new Error('Set PGHOST to a private Unix socket and provide PGDATABASE and PGUSER')
}
const pool = new pg.Pool({ max: 4, connectionTimeoutMillis: 3000, statement_timeout: 5000, idleTimeoutMillis: 30_000 })
pool.on('error', () => console.error('Community database connection closed unexpectedly'))
const server = createSessionServer({ origin, store: createSessionStore(pool) })
let closing = false
async function shutdown() {
  if (closing) return
  closing = true
  await new Promise(resolve => server.close(resolve))
  await pool.end()
}
try {
  await pool.query('SELECT 1 FROM machmo_community.sessions LIMIT 0')
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
} catch {
  await shutdown()
  console.error('Failed to start the community session service. Check the socket, migration and loopback port.')
  process.exitCode = 1
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
