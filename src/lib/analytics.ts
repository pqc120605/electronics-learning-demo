import { isSupabaseConfigured, supabase } from './supabase'
import localAnalyticsPaths from '../../server/analytics/paths.json'

export type AnalyticsEventName = 'page_view' | 'lesson_open' | 'component_select' | 'code_copy' | 'builder_run'

export const localAnalyticsEnabled = import.meta.env.VITE_MACHMO_LOCAL_ANALYTICS === 'true'
export const analyticsConfigured = localAnalyticsEnabled || isSupabaseConfigured
export function isLocalAnalyticsAdmin() {
  return localAnalyticsEnabled && typeof window !== 'undefined' && window.location.origin === 'http://127.0.0.1:8081'
}

const allowedComponentIds = new Set(['esp32', 'breadboard', 'led', 'resistor', 'jumper'])
const allowedLocalPaths = new Set(localAnalyticsPaths)
const lastPageEvents = new Map<'page_view' | 'lesson_open', { path: string; at: number }>()

function createSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function getSessionId(): string | null {
  try {
    const stored = window.sessionStorage.getItem('mach-mo-session')
    if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored

    const created = createSessionId()
    window.sessionStorage.setItem('mach-mo-session', created)
    return created
  } catch {
    return null
  }
}

export function trackEvent(eventName: AnalyticsEventName, componentId?: string): void {
  if (typeof window === 'undefined' || isLocalAnalyticsAdmin()) return
  if (!localAnalyticsEnabled && (!isSupabaseConfigured || !supabase)) return
  if (eventName === 'component_select' && (!componentId || !allowedComponentIds.has(componentId))) return

  const sessionId = getSessionId()
  if (!sessionId) return

  let path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path.length > 200 || !/^\/[A-Za-z0-9/_-]*$/.test(path) || path.startsWith('/admin') || path === '/auth/callback') return
  if (localAnalyticsEnabled && /^(?:\/app)?\/learn\/(?!esp32-led$)[^/]+$/.test(path)) path = path.replace(/[^/]+$/, 'lesson')
  if (localAnalyticsEnabled && /^(?:\/app)?\/community\/(?!new$)[^/]+$/.test(path)) path = path.replace(/[^/]+$/, 'post')
  if (localAnalyticsEnabled && !allowedLocalPaths.has(path)) return

  const payload = { session_id: sessionId, event_name: eventName, path, component_id: eventName === 'component_select' ? componentId : null }
  if (localAnalyticsEnabled) {
    void fetch('/api/analytics/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      keepalive: true, body: JSON.stringify(payload),
    }).catch(() => undefined)
    return
  }
  if (!supabase) return
  const eventWrite = supabase.from('analytics_events').insert(payload)
  void Promise.resolve(eventWrite).catch(() => undefined)
}

export function trackPageView(eventName: 'page_view' | 'lesson_open', source: 'view' | 'router' = 'view'): void {
  if (typeof window === 'undefined') return
  if (localAnalyticsEnabled && eventName === 'page_view' && source !== 'router') return
  const path = window.location.pathname
  const now = Date.now()
  const previous = lastPageEvents.get(eventName)
  if (previous?.path === path && now - previous.at < 1000) return
  lastPageEvents.set(eventName, { path, at: now })
  trackEvent(eventName)
}
