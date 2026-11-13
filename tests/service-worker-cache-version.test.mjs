import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const serviceWorkerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')

function createCacheStorage(initialNames = []) {
  const stores = new Map(initialNames.map((name) => [name, new Map()]))
  return {
    stores,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const entries = stores.get(name)
      return {
        async add(url) { entries.set(url, { url }) },
        async put(key, value) { entries.set(key, value) },
        async match(key) { return entries.get(key) },
      }
    },
    async keys() { return [...stores.keys()] },
    async delete(name) { return stores.delete(name) },
  }
}

function loadWorker(version, cacheStorage) {
  const listeners = new Map()
  const self = {
    location: { href: `https://example.test/sw.js?v=${version}`, origin: 'https://example.test' },
    clients: { async claim() {} },
    addEventListener(type, listener) { listeners.set(type, listener) },
    async skipWaiting() {},
  }
  const context = {
    self,
    caches: cacheStorage,
    URL,
    Response,
    fetch: async () => ({
      ok: true,
      async text() { return '<script type="module" src="/assets/index-abc123.js"></script>' },
      clone() { return this },
    }),
    Promise,
  }
  vm.runInNewContext(serviceWorkerSource, context, { filename: 'public/sw.js' })
  return listeners
}

async function dispatch(lifecycleListener) {
  let pending
  lifecycleListener({ waitUntil(value) { pending = value } })
  await pending
}

test('service worker cache is versioned and activation removes the previous app cache', async () => {
  const cacheStorage = createCacheStorage([
    'mach-mo-shell-old-version',
    'mach-mo-user-data-v1',
    'unrelated-cache',
  ])

  const firstWorker = loadWorker('index-old123.js', cacheStorage)
  await dispatch(firstWorker.get('install'))
  assert.ok(cacheStorage.stores.has('mach-mo-shell-index-old123.js'))

  const nextWorker = loadWorker('index-new456.js', cacheStorage)
  await dispatch(nextWorker.get('install'))
  assert.ok(cacheStorage.stores.has('mach-mo-shell-index-new456.js'))
  await dispatch(nextWorker.get('activate'))

  assert.deepEqual([...cacheStorage.stores.keys()].sort(), [
    'mach-mo-shell-index-new456.js',
    'mach-mo-user-data-v1',
    'unrelated-cache',
  ])
})

test('registration derives its worker version from the fingerprinted production module URL', async () => {
  const registrationSource = await readFile(new URL('../src/lib/registerServiceWorker.ts', import.meta.url), 'utf8')
  assert.match(registrationSource, /new URL\(import\.meta\.url\)/)
  assert.match(registrationSource, /searchParams\.set\(['"]v['"]\s*,/)
  assert.match(registrationSource, /serviceWorker\.register\(workerUrl/)
})
