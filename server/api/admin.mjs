import { readdir, statfs } from 'node:fs/promises'
import { freemem, homedir, totalmem } from 'node:os'
import { join } from 'node:path'
import { sessionDigest } from '../community/session-http.mjs'
import { sessionToken } from './oauth.mjs'
import { checkGuideStatus } from '../guide-ai/handler.mjs'

const ranges = new Set(['7', '30', '90'])
const DAY = 86_400_000
const vnOffset = 7 * 60 * 60 * 1000
export const adminPath = /^\/api\/admin\/(summary|ai|community|system|feedback|sites)(?:\/([a-z0-9-]{1,48}))?$/

export function vietnamRange(days, now) {
  const today = Math.floor((now + vnOffset) / DAY) * DAY - vnOffset
  return [new Date(today - (Number(days) - 1) * DAY).toISOString(), new Date(today + DAY).toISOString()]
}

// Column names come from this fixed list, never from URL parameters.
const dimensions = { byLesson: 'lesson_id', byBoard: 'board_id', byDevice: 'device', bySource: 'referrer_host' }
const floorTime = "created_at >= $1 AND created_at < $2"

export function createAdminReports({ pool, analytics, siteFeedback, databaseReady, guideEnv, commit, dailyCap, price, dataRoot = homedir() }) {
  return {
    async summary(start, end) {
      const totals = await analytics.summarize(start, end)
      const result = await Promise.all(Object.values(dimensions).map(column => pool.query(
        'SELECT ' + column + ' AS label, count(*)::int AS count FROM machmo_analytics.events WHERE ' + floorTime +
        ' AND ' + column + ' IS NOT NULL GROUP BY 1 ORDER BY count DESC,label LIMIT 10', [start, end])))
      const funnel = await pool.query(
        'WITH filtered AS (SELECT session_id,event_name,created_at FROM machmo_analytics.events WHERE ' + floorTime + '),' +
        " opened AS (SELECT session_id, min(created_at) AS at FROM filtered WHERE event_name='lesson_open' GROUP BY 1)," +
        " ran AS (SELECT o.session_id,min(f.created_at) AS at FROM opened o JOIN filtered f USING(session_id) WHERE f.event_name='builder_run' AND f.created_at>=o.at GROUP BY 1)," +
        " done AS (SELECT DISTINCT r.session_id FROM ran r JOIN filtered f USING(session_id) WHERE f.event_name='lesson_complete' AND f.created_at>=r.at)" +
        ' SELECT (SELECT count(*)::int FROM opened) AS opened, (SELECT count(*)::int FROM ran) AS ran, (SELECT count(*)::int FROM done) AS completed',
        [start, end])
      return { ...totals, funnel: funnel.rows[0], ...Object.fromEntries(Object.keys(dimensions).map((key, i) => [key, result[i].rows])) }
    },
    async ai(start, end) {
      const { rows } = await pool.query("SELECT provider,model,count(*)::int AS requests, " +
        "count(*) FILTER (WHERE status='insufficient')::int AS insufficient, count(*) FILTER (WHERE status='error')::int AS errors," +
        "count(*) FILTER (WHERE cache_hit)::int AS \"cacheHits\", " +
        "round(percentile_cont(.5) WITHIN GROUP (ORDER BY elapsed_ms))::int AS \"p50Ms\", " +
        "round(percentile_cont(.95) WITHIN GROUP (ORDER BY elapsed_ms))::int AS \"p95Ms\", " +
        "coalesce(sum(input_tokens),0)::float8 AS \"inputTokens\", coalesce(sum(output_tokens),0)::float8 AS \"outputTokens\", " +
        "count(*) FILTER (WHERE helpful IS TRUE)::int AS helpful, count(*) FILTER (WHERE helpful IS FALSE)::int AS unhelpful " +
        'FROM machmo_guide_ai.guide_ai_requests WHERE ' + floorTime + ' GROUP BY provider,model ORDER BY provider,model', [start, end])
      const quota = await pool.query("SELECT used FROM machmo_guide_ai.daily_total WHERE day=(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date")
      const used = quota.rows[0]?.used ?? 0
      return {
        models: rows.map(row => ({ ...row, estimatedUsd: price && row.provider === 'openai' && row.model === price.model
          ? (row.inputTokens * price.input + row.outputTokens * price.output) / 1_000_000 : null })),
        used, limit: dailyCap ?? null, nearLimit: Boolean(dailyCap && used >= 0.8 * dailyCap),
      }
    },
    async community(start, end) {
      const { rows } = await pool.query('SELECT ' +
        '(SELECT count(*)::int FROM machmo_community.community_posts WHERE ' + floorTime + ') AS posts,' +
        '(SELECT count(*)::int FROM machmo_community.community_comments WHERE ' + floorTime + ') AS comments,' +
        '(SELECT count(*)::int FROM machmo_community.accounts WHERE revoked_at IS NULL) AS "totalAccounts",' +
        '(SELECT count(*)::int FROM machmo_community.community_reports WHERE resolved_at IS NULL) AS "pendingReports",' +
        '(SELECT coalesce(jsonb_agg(row_to_json(x)),\'[]\'::jsonb) FROM (' +
        ' SELECT i.provider,count(*)::int AS count FROM machmo_community.accounts a JOIN machmo_community.oauth_identities i ON i.account_id=a.id ' +
        ' WHERE a.revoked_at IS NULL AND a.created_at>=$1 AND a.created_at<$2 GROUP BY i.provider ORDER BY i.provider) x) AS "newAccounts"', [start, end])
      return rows[0]
    },
    async feedback(start, end) {
      return siteFeedback.report(start, end)
    },
    async system() {
      const backupFolder = join(dataRoot, '.local', 'share', 'mach-mo', 'api-staging', 'backups')
      const [ready, disk, files] = await Promise.all([
        Promise.resolve().then(databaseReady).catch(() => false),
        statfs(dataRoot).catch(() => null),
        readdir(backupFolder, { withFileTypes: true }).catch(() => []),
      ])
      const latestBackup = files.filter(file => file.isFile() && /^machmo_api_staging-\d{8}T\d{6}Z\.dump$/.test(file.name))
        .map(file => file.name.slice(19, 35)).sort().at(-1) ?? null
      const guide = await checkGuideStatus(guideEnv)
      return { commit, api: 'ready', database: ready ? 'ready' : 'unavailable', ai: guide.state === 'ready' ? guide.provider : 'unavailable',
        ramFreeBytes: freemem(), ramTotalBytes: totalmem(), diskFreeBytes: disk ? disk.bavail * disk.bsize : null, latestBackup }
    },
  }
}

export function createAdminHttp({ reports, dashboardSites, origin, authStore, now = Date.now }) {
  const host = new URL(origin).host
  return async (section, request, params, siteId) => {
    if (request.headers.host !== host || request.headers['sec-fetch-site'] === 'cross-site'
      || (request.headers.origin && request.headers.origin !== origin)) return { status: 403 }
    const token = sessionToken(request.headers.cookie)
    const actor = token ? await authStore.read(sessionDigest(token)) : null
    if (!actor) return { status: 401 }
    if (actor.dashboardAccess !== true) return { status: 403 }
    const days = params.get('days') ?? '7'
    if (!ranges.has(days)) return { status: 400 }
    const range = vietnamRange(days, now())
    if (section === 'sites' && dashboardSites) {
      const body = siteId ? await dashboardSites.report(siteId, ...range) : await dashboardSites.list()
      return body ? { status: 200, body } : { status: 404 }
    }
    if (siteId || !Object.hasOwn(reports, section)) return { status: 404 }
    return { status: 200, body: await reports[section](...range) }
  }
}
