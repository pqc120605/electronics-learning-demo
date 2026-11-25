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
  assert.match(config, /@moderationQueue\s*\{\s*method GET\s*path \/community\/moderation\/reports\s*\}/)
  assert.match(config, /@moderationWrite\s*\{\s*method PATCH\s*path_regexp reportPath/)
  assert.match(config, /rewrite \* \/api\{uri\}/)
  assert.match(config, /header_up Host mach-mo\.vercel\.app/)
  assert.doesNotMatch(config, /path \/\*(?:\s|$)/)
})

test('bare deployments preserve compiler and AI routing independently', async () => {
  const { readProductionEdgeFeatures, renderProductionEdge } = await import('../server/api/production-edge.mjs')
  for (const aiEnabled of [false, true]) for (const compilerEnabled of [false, true]) {
    const expected = { aiEnabled, compilerEnabled }
    assert.deepEqual(readProductionEdgeFeatures(renderProductionEdge(expected)), expected)
  }
  assert.throws(() => readProductionEdgeFeatures('custom edge'), /indisponible|recognize|incomplete/i)
  assert.throws(() => readProductionEdgeFeatures(renderProductionEdge({ compilerEnabled: true }).replace(' /tools/arduino/compile', '')), /incomplete/i)
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

test('Vercel middleware overwrites a caller claim and forwards an authenticated client identity', async t => {
  const { default: middleware } = await import('../middleware.ts')
  const { EDGE_CLIENT_HEADER, readEdgeClientProof } = await import('../server/api/edge-client-proof.mjs')
  const key = '49'.repeat(32)
  const previous = { env: process.env.VERCEL_ENV, key: process.env.MACHMO_EDGE_PROXY_HMAC }
  t.after(() => {
    if (previous.env === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = previous.env
    if (previous.key === undefined) delete process.env.MACHMO_EDGE_PROXY_HMAC
    else process.env.MACHMO_EDGE_PROXY_HMAC = previous.key
  })
  process.env.VERCEL_ENV = 'production'
  process.env.MACHMO_EDGE_PROXY_HMAC = key
  const path = '/api/health'
  const request = new Request('https://mach-mo.example' + path, { headers: {
    [EDGE_CLIENT_HEADER]: 'caller claim', 'x-vercel-forwarded-for': '192.0.2.48',
  } })
  const response = middleware(request)
  const proof = response.headers.get('x-middleware-request-' + EDGE_CLIENT_HEADER)
  assert.ok(readEdgeClientProof(key, proof, 'GET', path))
  assert.equal(response.headers.get(EDGE_CLIENT_HEADER), null)
})
