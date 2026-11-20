import { createPostgresStore } from '../analytics/store.mjs'
import { createSessionStore } from '../community/session-store.mjs'
import { createStagingPool, STAGING_APP, verifyStagingDatabase } from './database.mjs'
import { createApiServer } from './server.mjs'
import { createS2 } from './s2.mjs'
import { createOAuthStore } from './oauth-store.mjs'
import { createCommunityStore } from './community-store.mjs'

const event = (name, fields = {}) => console.log(JSON.stringify({ event: name, ...fields }))
let pool
let server
let retention
let closing = false

async function shutdown() {
  if (closing) return
  closing = true
  clearInterval(retention)
  if (server?.listening) await new Promise(resolve => server.close(resolve))
  if (pool) await pool.end()
}

try {
  const port = Number(process.env.MACHMO_API_PORT ?? '8281')
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid API port')
  const guideProvider = process.env.GUIDE_AI_PROVIDER
  if (guideProvider && guideProvider !== 'mock') throw new Error('Staging supports the mock guide')
  const origins = [process.env.PUBLIC_ORIGIN, ...(process.env.STAGING_ORIGINS ?? '').split(',').filter(Boolean)]
  const trustedProxyIps = (process.env.MACHMO_API_TRUSTED_PROXIES ?? '').split(',').filter(Boolean)
  pool = createStagingPool(process.env.DATABASE_URL, STAGING_APP)
  const sessionStore = createSessionStore(pool)
  const analyticsStore = createPostgresStore(pool)
  const oauthOrigin = process.env.MACHMO_S2_ORIGIN
  if (oauthOrigin && !origins.includes(oauthOrigin)) throw new Error('Unknown S2 origin')
  const authStore = oauthOrigin && createOAuthStore(pool, process.env.ADMIN_ACCOUNTS)
  const s2 = authStore && createS2({ origin: oauthOrigin, env: process.env, authStore, community: createCommunityStore(pool) })
  server = createApiServer({
    origins, commit: process.env.MACHMO_API_COMMIT, trustedProxyIps, s2,
    sessionStore, analyticsStore, checkDatabase: () => verifyStagingDatabase(pool),
    guideEnv: guideProvider ? { GUIDE_AI_PROVIDER: guideProvider } : {},
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  retention = setInterval(() => {
    Promise.all([sessionStore.expire(), analyticsStore.expire(), authStore && authStore.expire()]).catch(() => event('staging_retention_failed'))
  }, 60 * 60 * 1000)
  retention.unref()
  event('staging_api_started', { port })
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
} catch {
  await shutdown()
  event('staging_api_start_failed')
  process.exitCode = 1
}
