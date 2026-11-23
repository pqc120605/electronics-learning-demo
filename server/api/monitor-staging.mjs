import { createStagingPool, STAGING_APP } from './database.mjs'

const event = (name, fields = {}) => console.log(JSON.stringify({ event: name, ...fields }))
let pool
try {
  const port = Number(process.env.MACHMO_API_PORT ?? '8281')
  const expected = process.env.MACHMO_API_COMMIT
  if (!Number.isInteger(port) || port < 1024 || port > 65_535 || !/^[a-f0-9]{40}$/.test(expected ?? '')) throw new Error('configuration')
  const response = await fetch('http://127.0.0.1:' + port + '/api/health', {
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('health')
  const value = await response.json()
  if (value.commit !== expected || value.version !== 1 || value.db !== 'ready') throw new Error('release')
  event('staging_health_ok', { commit: expected, db: value.db, ai: value.ai })

  const limit = Number(process.env.GUIDE_AI_DAILY_REQUEST_CAP)
  if (Number.isInteger(limit) && limit > 0 && value.ai !== 'unavailable') {
    pool = createStagingPool(process.env.DATABASE_URL, STAGING_APP)
    const { rows } = await pool.query("SELECT used FROM machmo_guide_ai.daily_total WHERE day=(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date")
    const used = rows[0]?.used ?? 0
    if (used >= 0.8 * limit) event('staging_ai_quota_near_limit', { used, limit })
  }
} catch {
  event('staging_health_failed')
  process.exitCode = 1
} finally {
  if (pool) await pool.end()
}
