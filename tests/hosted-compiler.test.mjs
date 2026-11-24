import assert from 'node:assert/strict'
import { test } from 'node:test'
import { request as httpRequest } from 'node:http'
import { createCompilerServer, podmanCompileArgs } from '../server/compiler/service.mjs'
import { renderProductionEdge } from '../server/api/production-edge.mjs'

const origin = 'https://mach-mo.vercel.app'
const host = new URL(origin).host
const api = '/api/tools/arduino'
const sketch = { board: 'arduino-uno-r3', source: 'void setup(){} void loop(){}' }

async function fixture(t, compile, now) {
  const server = createCompilerServer({ compile, now })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = 'http://127.0.0.1:' + server.address().port + api
  const request = (path, init = {}) => new Promise((resolve, reject) => {
    const req = httpRequest(base + path, { method: init.method, headers: { Host: host, ...init.headers } }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })))
    })
    req.on('error', reject)
    req.end(init.body)
  })
  const post = (body, headers = {}) => request('/compile', {
    method: 'POST', body: JSON.stringify(body),
    headers: { Origin: origin, 'X-Machmo-CSRF': '1', 'Content-Type': 'application/json', ...headers },
  })
  return { request, post }
}

test('hosted compiler only exposes the three supported boards and requires same-origin intent', async t => {
  let calls = 0
  const { request, post } = await fixture(t, async (fqbn, source) => {
    calls++
    assert.equal(fqbn, 'arduino:avr:uno')
    assert.equal(source, sketch.source)
    return { status: 200, hex: ':00000001FF\n' }
  })
  const status = await request('/status')
  assert.deepEqual(await status.json(), { ok: true, boards: ['arduino-uno-r3', 'arduino-nano', 'arduino-mega-2560'] })
  assert.equal(status.headers.get('cache-control'), 'no-store')
  assert.equal((await request('/status', { headers: { Host: 'localhost' } })).status, 403)
  assert.equal((await post(sketch, { Origin: 'https://example.org' })).status, 403)
  assert.equal((await post(sketch, { 'X-Machmo-CSRF': '0' })).status, 403)
  assert.equal((await post(sketch, { 'Sec-Fetch-Site': 'cross-site' })).status, 403)
  assert.equal((await post({ ...sketch, board: 'esp32-devkit' })).status, 400)
  assert.equal((await post({ ...sketch, source: 'x'.repeat(33 * 1024) })).status, 413)
  assert.equal(calls, 0)
  assert.equal((await post(sketch)).status, 200)
  assert.equal(calls, 1)
})

test('hosted compiler returns diagnostics and rate limits before allocating work', async t => {
  let time = 100_000
  let release
  let started
  const didStart = new Promise(resolve => { started = resolve })
  const gate = new Promise(resolve => { release = resolve })
  let hold = true
  const { post } = await fixture(t, async () => {
    if (hold) { started(); await gate; hold = false }
    return { status: 422, log: '<sketch>/sketch.ino:1: error: test diagnostic' }
  }, () => time)
  const pending = post(sketch)
  await Promise.race([didStart, pending.then(response => { throw new Error('Compile finished before it started: ' + response.status) })])
  try { assert.equal((await post(sketch)).status, 429) }
  finally { release() }
  const failure = await pending
  assert.equal(failure.status, 422)
  assert.match((await failure.json()).log, /<sketch>/)
  for (let n = 0; n < 7; n++) assert.equal((await post(sketch)).status, 422)
  const limited = await post(sketch)
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '60')
  time += 60_001
  assert.equal((await post(sketch)).status, 422)
})

test('rootless job has bounded resources and the edge routes are separately enabled', () => {
  const image = 'sha256:' + 'a'.repeat(64)
  const name = 'machmo-avr-00000000-0000-4000-8000-000000000000'
  const args = podmanCompileArgs(image, name, 'arduino:avr:uno')
  for (const flag of ['--network=none', '--read-only', '--user=65532:65532', '--memory=384m', '--pids-limit=64', '--timeout=45', '--pull=never']) {
    assert.ok(args.includes(flag), flag)
  }
  assert.ok(!args.includes('--privileged') && !args.includes('--volume') && !args.includes('--mount'))
  assert.throws(() => podmanCompileArgs(image, name, 'example:unknown'))
  assert.throws(() => podmanCompileArgs('latest', name, 'arduino:avr:uno'))
  assert.doesNotMatch(renderProductionEdge(), /\/tools\/arduino/)
  assert.match(renderProductionEdge({ compilerEnabled: true }), /\/tools\/arduino\/status \/tools\/arduino\/compile/)
})
