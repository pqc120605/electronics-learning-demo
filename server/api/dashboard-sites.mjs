import { createHash, timingSafeEqual } from 'node:crypto'
import { siteFeedbackInput } from './site-feedback.mjs'

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const token = /^Bearer ([A-Za-z0-9_-]{43})$/
const statusValues = new Set(['healthy', 'degraded', 'down', 'unknown'])
const counters = ['accounts', 'newAccounts', 'sessions', 'pageViews']
const dailyFields = new Set(['day', 'revision', 'status', ...counters])
export const dashboardIngestPath = /^\/api\/site-metrics\/([a-z0-9-]{1,48})\/(daily|feedback)$/

function exactHttpsOrigin(value) {
  const url = typeof value === 'string' && URL.parse(value)
  return url && url.protocol === 'https:' && url.origin === value
}

function snapshotInput(value, now) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !dailyFields.has(key))
    || typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day)
    || !Number.isInteger(value.revision) || value.revision < 1 || value.revision > 2147483647
    || !statusValues.has(value.status)) return null
  const day = Date.parse(value.day)
  const today = new Date(now + 25_200_000).toISOString().slice(0, 10)
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value.day
    || value.day > today || day < Date.parse(today) - 365 * 86_400_000) return null
  const counts = Object.fromEntries(counters.map(key => [key, value[key] ?? null]))
  if (Object.values(counts).some(count => count !== null
    && (!Number.isSafeInteger(count) || count < 0 || count > 2147483647))) return null
  return { day: value.day, revision: value.revision, status: value.status, ...counts }
}

export function createDashboardSites(config, store, now = Date.now) {
  const list = JSON.parse(config ?? '[]')
  if (!Array.isArray(list) || list.length > 50) throw new TypeError('Invalid dashboard site registry')
  const sites = new Map()
  const digests = new Set()
  for (const site of list) {
    if (!site || typeof site.id !== 'string' || site.id.length > 48 || !slug.test(site.id)
      || site.id === 'mach-mo' || sites.has(site.id) || typeof site.name !== 'string'
      || !site.name.trim() || site.name.length > 80 || !exactHttpsOrigin(site.origin)
      || typeof site.keyDigest !== 'string' || !/^[a-f0-9]{64}$/.test(site.keyDigest)
      || digests.has(site.keyDigest)) throw new TypeError('Invalid dashboard site entry')
    const { id, name, origin, keyDigest } = site
    sites.set(id, { id, name: name.trim(), origin, keyDigest: Buffer.from(keyDigest, 'hex') })
    digests.add(keyDigest)
  }
  const info = ({ id, name, origin }) => ({ id, name, origin })
  return {
    async list() {
      const latest = new Map((sites.size ? await store.latest([...sites.keys()]) : []).map(row => [row.siteId, row]))
      return [{ id: 'mach-mo', name: 'Mạch Mở', origin: null, native: true, latest: null },
        ...[...sites.values()].map(site => ({ ...info(site), native: false, latest: latest.get(site.id) ?? null }))]
    },
    async report(siteId, start, end) {
      const site = sites.get(siteId)
      if (!site) return null
      const [daily, feedback] = await Promise.all([store.daily(siteId, start, end), store.feedback(siteId, start, end)])
      return { site: info(site), daily, feedback }
    },
    async ingest(siteId, kind, request, readBody) {
      if (request.headers.origin !== undefined || request.headers['sec-fetch-site'] !== undefined) return 403
      const site = sites.get(siteId)
      if (!site) return 404
      const key = token.exec(request.headers.authorization ?? '')?.[1]
      if (!key || !timingSafeEqual(createHash('sha256').update(key).digest(), site.keyDigest)) return 403
      const body = await readBody()
      if (kind === 'daily') {
        const input = snapshotInput(body, now())
        if (!input) return 400
        await store.saveSnapshot(site.id, input)
      } else {
        const input = siteFeedbackInput(body)
        if (!input) return 400
        await store.saveFeedback(site.id, input)
      }
      return 204
    },
  }
}

const dailyColumns = 'day::text AS day, status, accounts, new_accounts AS "newAccounts", sessions, page_views AS "pageViews", received_at AS "receivedAt"'

export function createDashboardSiteStore(pool, siteFeedback) {
  return {
    async latest(ids) {
      const { rows } = await pool.query(
        'SELECT DISTINCT ON (site_id) site_id AS "siteId", ' + dailyColumns +
        ' FROM machmo_community.dashboard_daily WHERE site_id = ANY($1::text[]) ORDER BY site_id,day DESC', [ids])
      return rows
    },
    async daily(site, start, end) {
      const { rows } = await pool.query(
        'SELECT ' + dailyColumns + ' FROM machmo_community.dashboard_daily WHERE site_id=$1' +
        " AND day >= ($2::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::date" +
        " AND day < ($3::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ORDER BY day DESC", [site, start, end])
      return rows
    },
    async saveSnapshot(site, item) {
      const { day, revision, status, accounts, newAccounts, sessions, pageViews } = item
      await pool.query(`
        INSERT INTO machmo_community.dashboard_daily AS current (site_id,day,revision,status,accounts,new_accounts,sessions,page_views)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (site_id,day) DO UPDATE SET revision=excluded.revision,status=excluded.status,
          accounts=excluded.accounts,new_accounts=excluded.new_accounts,sessions=excluded.sessions,page_views=excluded.page_views,
          received_at=now() WHERE current.revision < excluded.revision
      `, [site, day, revision, status, accounts, newAccounts, sessions, pageViews])
    },
    saveFeedback: (site, item) => siteFeedback.save(item, site),
    feedback: (site, start, end) => siteFeedback.report(start, end, site),
    async expire() {
      await pool.query('SELECT machmo_community.expire_dashboard_data()')
    },
  }
}
