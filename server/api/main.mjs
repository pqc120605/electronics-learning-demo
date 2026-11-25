import { createPostgresStore } from '../analytics/store.mjs'
import { createSessionStore } from '../community/session-store.mjs'
import { createStagingPool, STAGING_APP, verifyStagingDatabase } from './database.mjs'
import { createApiServer } from './server.mjs'
import { createS2 } from './s2.mjs'
import { createOAuthStore } from './oauth-store.mjs'
import { createCommunityStore } from './community-store.mjs'
import { createGuideStore } from './guide-store.mjs'
import { createGuideHttp, createGuideService } from './guide-service.mjs'
import { createAdminHttp, createAdminReports } from './admin.mjs'
import { createProjectHttp, createProjectStore } from './projects.mjs'
import { createClassroomHttp, createClassroomStore } from './classrooms.mjs'
import { createSiteFeedbackStore } from './site-feedback.mjs'
import { createDashboardSites, createDashboardSiteStore } from './dashboard-sites.mjs'

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
  if (guideProvider && !['mock', 'openai', 'ollama'].includes(guideProvider)) throw new Error('Unknown guide provider')
  const origins = [process.env.PUBLIC_ORIGIN, ...(process.env.STAGING_ORIGINS ?? '').split(',').filter(Boolean)]
  const trustedProxyIps = (process.env.MACHMO_API_TRUSTED_PROXIES ?? '').split(',').filter(Boolean)
  pool = createStagingPool(process.env.DATABASE_URL, STAGING_APP)
  const sessionStore = createSessionStore(pool)
  const databaseReady = () => verifyStagingDatabase(pool)
  const oauthOrigin = process.env.MACHMO_S2_ORIGIN
  if (oauthOrigin && !origins.includes(oauthOrigin)) throw new Error('Unknown S2 origin')
  const authStore = oauthOrigin && createOAuthStore(pool, process.env.ADMIN_ACCOUNTS,
    process.env.MACHMO_DASHBOARD_EMAILS, process.env.SESSION_SECRET)
  const analyticsStore = createPostgresStore(pool, Boolean(authStore))
  const siteFeedback = createSiteFeedbackStore(pool)
  const dashboardStore = createDashboardSiteStore(pool, siteFeedback)
  const dashboardSites = authStore && createDashboardSites(process.env.MACHMO_DASHBOARD_SITES, dashboardStore)
  const s2 = authStore && createS2({ origin: oauthOrigin, env: process.env, authStore, community: createCommunityStore(pool) })
  if (['openai', 'ollama'].includes(guideProvider) && !authStore) throw new Error('AI needs the signed-in origin')
  const guideEnv = guideProvider ? {
    GUIDE_AI_PROVIDER: guideProvider, OPENAI_MODEL: process.env.OPENAI_MODEL, OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_REASONING_EFFORT: process.env.OPENAI_REASONING_EFFORT,
    OLLAMA_URL: process.env.OLLAMA_URL, OLLAMA_MODEL: process.env.OLLAMA_MODEL, OLLAMA_CONTEXT: process.env.OLLAMA_CONTEXT,
  } : {}
  const guideStore = authStore && guideProvider && createGuideStore(pool)
  const dailyLimit = Number(process.env.GUIDE_AI_DAILY_REQUEST_CAP ?? (guideProvider === 'mock' ? 200 : 0))
  const guide = guideStore && createGuideHttp({
    origin: oauthOrigin, authStore, service: createGuideService({
      env: guideEnv, store: guideStore, secret: process.env.SESSION_SECRET,
      dailyLimit,
    }),
  })
  const rates = [process.env.GUIDE_AI_INPUT_USD_PER_MILLION, process.env.GUIDE_AI_OUTPUT_USD_PER_MILLION]
  const price = guideEnv.OPENAI_MODEL && rates.every(value => value?.trim() && Number.isFinite(Number(value)) && Number(value) >= 0)
    ? { model: guideEnv.OPENAI_MODEL, input: Number(rates[0]), output: Number(rates[1]) } : null
  const admin = authStore && createAdminHttp({
    origin: oauthOrigin, authStore, dashboardSites, reports: createAdminReports({
      pool, analytics: analyticsStore, siteFeedback, databaseReady, guideEnv, commit: process.env.MACHMO_API_COMMIT,
      dailyCap: guideStore ? dailyLimit : null, price,
    }),
  })
  const projects = authStore && createProjectHttp({ origin: oauthOrigin, authStore, store: createProjectStore(pool) })
  const classrooms = authStore && createClassroomHttp({ origin: oauthOrigin, authStore, store: createClassroomStore(pool) })
  server = createApiServer({
    origins, commit: process.env.MACHMO_API_COMMIT, trustedProxyIps, s2, guide, guideEnv, admin, projects, classrooms,
    feedback: oauthOrigin ? { origin: oauthOrigin, save: siteFeedback.save } : undefined,
    dashboardSites,
    sessionStore, analyticsStore, checkDatabase: databaseReady,
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  retention = setInterval(() => {
    Promise.all([sessionStore.expire(), analyticsStore.expire(), siteFeedback.expire(), dashboardStore.expire(), authStore && authStore.expire(), guideStore && guideStore.expire()])
      .catch(() => event('staging_retention_failed'))
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
