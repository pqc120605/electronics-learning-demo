/** Register the bounded app-shell cache only in a production build. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  // Vite fingerprints production modules; using this module's asset name makes
  // the registration URL change when the app bundle changes, without build config.
  const moduleAsset = new URL(import.meta.url).pathname.split('/').pop() ?? 'app'
  const appVersion = moduleAsset.replace(/[^a-zA-Z0-9._-]/g, '-')
  const workerUrl = new URL('/sw.js', window.location.origin)
  workerUrl.searchParams.set('v', appVersion)

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(workerUrl.href, { scope: '/' }).catch((error: unknown) => {
      console.warn('Mạch Mở could not enable its offline app shell.', error)
    })
  }, { once: true })
}
