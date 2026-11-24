import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('production edge explicitly routes project and classroom collections and children', async () => {
  const { renderProductionEdge } = await import('../server/api/production-edge.mjs')
  const config = renderProductionEdge()
  const paths = config.match(/^\s+path (\/health[^\n]*)/m)?.[1].trim().split(/\s+/)
  for (const route of ['/health', '/session', '/projects', '/projects/*', '/classes', '/classes/*', '/admin/sites/*']) {
    assert.ok(paths?.includes(route), route)
  }
  assert.match(config, /not path \/community\/moderation\/\*/)
  assert.match(config, /rewrite \* \/api\{uri\}/)
  assert.match(config, /header_up Host mach-mo\.vercel\.app/)
  assert.doesNotMatch(config, /path \/\*(?:\s|$)/)
})

test('the public status reports unavailable until AI can be enabled with a real provider', async () => {
  const { renderProductionEdge } = await import('../server/api/production-edge.mjs')
  const disabled = renderProductionEdge()
  assert.match(disabled, /path \/guide-ai\/status/)
  assert.match(disabled, /\{"state":"unavailable","model":"lookup"\}/)
  assert.doesNotMatch(disabled, /\/guide-ai\/chat/)
  const enabled = renderProductionEdge({ aiEnabled: true })
  assert.match(enabled, /\/guide-ai\/status \/guide-ai\/chat \/guide-ai\/feedback/)
  assert.doesNotMatch(enabled, /"state":"unavailable"/)
})

test('production rewrite is external HTTPS and takes precedence over app fallbacks', async () => {
  const { getVercelRouteBlockers } = await import('../scripts/vercel-route-gate.mjs')
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(getVercelRouteBlockers(config), [])
  const [proxy, ...spa] = config.rewrites
  assert.notEqual(getVercelRouteBlockers({ rewrites: spa }).length, 0)
  assert.notEqual(getVercelRouteBlockers({ rewrites: [...spa, proxy] }).length, 0)
  assert.notEqual(getVercelRouteBlockers({ rewrites: [{ ...proxy, destination: '/index.html' }, ...spa] }).length, 0)
})
