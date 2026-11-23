import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError, apiRequest, readApiJson } from '../src/lib/api/index.ts'

test('uses cookie credentials and only sends same-origin API requests', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/api/session')
    assert.equal(options.credentials, 'include')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    return Response.json({ user: null })
  })
  assert.deepEqual(await readApiJson(await apiRequest('/api/session', { credentials: 'omit' })), { user: null })
  for (const path of ['https://example.test/api/session', '//example.test/api/session', '/api/../assets/board.glb']) {
    await assert.rejects(apiRequest(path), TypeError)
  }
  assert.equal(fetch.mock.callCount(), 1)
})

test('classifies expired sessions, denied access, quotas and upstream failures', async t => {
  const errors = [[401, 'sign-in-required'], [403, 'forbidden'], [429, 'rate-limited'], [503, 'unavailable']]
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: errors[0][0] }))
  for (const [status, code] of errors) {
    fetch.mock.mockImplementationOnce(async () => new Response(null, { status }))
    await assert.rejects(apiRequest('/api/session'), error => error instanceof ApiError && error.status === status && error.code === code)
  }
  fetch.mock.mockImplementationOnce(async () => new Response(null, { status: 404 }))
  assert.equal((await apiRequest('/api/community/posts/missing', {}, [404])).status, 404)
})

test('distinguishes missing service from cancellation and rejects SPA HTML as API data', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network offline') })
  await assert.rejects(apiRequest('/api/session'), { code: 'unavailable' })
  fetch.mock.mockImplementationOnce(async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }))
  await assert.rejects(readApiJson(await apiRequest('/api/session')), { code: 'unavailable' })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(apiRequest('/api/session', { signal: controller.signal }), { name: 'AbortError' })
})
