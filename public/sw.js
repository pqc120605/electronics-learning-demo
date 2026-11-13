const requestedVersion = new URL(self.location.href).searchParams.get('v') ?? 'unversioned'
const cacheVersion = requestedVersion.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 128) || 'unversioned'
const CACHE_NAME = `mach-mo-shell-${cacheVersion}`
const SHELL_URLS = ['/', '/offline.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    const shell = await fetch('/', { cache: 'reload' })
    if (shell.ok) {
      await cache.put('/', shell.clone())
      const html = await shell.text()
      const initialAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1])
      await Promise.allSettled([...SHELL_URLS.filter((url) => url !== '/').map((url) => cache.add(url)), ...initialAssets.map((url) => cache.add(url))])
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith('mach-mo-shell-') && name !== CACHE_NAME).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put('/', response.clone())
        }
        return response
      } catch {
        return await caches.match('/') ?? await caches.match('/offline.html') ?? Response.error()
      }
    })())
    return
  }

  // Cache only same-origin, fingerprinted application JS/CSS. Large models,
  // user files, Supabase/API requests, and arbitrary responses stay uncached.
  if (url.pathname.startsWith('/assets/') && /\.(?:js|css)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone())
      return response
    })())
  }
})
