import { isSupabaseConfigured, supabase } from './supabase'
import localAnalyticsPaths from '../../server/analytics/paths.json'
import analyticsDimensions from '../../server/analytics/dimensions.json'
import { selfHostedOAuthEnabled } from './selfHostedAuth'

export type AnalyticsEventName = 'page_view' | 'lesson_open' | 'component_select' | 'code_copy' | 'builder_run' | 'lesson_complete'

export const localAnalyticsEnabled = import.meta.env.VITE_MACHMO_LOCAL_ANALYTICS === 'true'
export const selfHostedAnalyticsEnabled = selfHostedOAuthEnabled && import.meta.env.VITE_MACHMO_SELF_HOSTED_ANALYTICS === 'true'
export const analyticsConfigured = localAnalyticsEnabled || selfHostedAnalyticsEnabled || isSupabaseConfigured
const useLocalCollector = localAnalyticsEnabled || selfHostedAnalyticsEnabled
export function isLocalAnalyticsAdmin() {
  return !selfHostedOAuthEnabled && localAnalyticsEnabled && typeof window !== 'undefined' && window.location.origin === 'http://127.0.0.1:8081'
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

export function trackEvent(eventName: AnalyticsEventName, componentId?: string, context: { lessonId?: string; boardId?: string } = {}): void {
  if (typeof window === 'undefined' || isLocalAnalyticsAdmin()) return
  if (!analyticsConfigured || (eventName === 'lesson_complete' && !selfHostedAnalyticsEnabled)) return
  if (eventName === 'component_select' && (!componentId || !allowedComponentIds.has(componentId))) return

  const sessionId = getSessionId()
  if (!sessionId) return

  let path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path.length > 200 || !/^\/[A-Za-z0-9/_-]*$/.test(path) || path.startsWith('/admin') || path === '/auth/callback') return
  if (useLocalCollector && /^(?:\/app)?\/learn\/(?!esp32-led$)[^/]+$/.test(path)) path = path.replace(/[^/]+$/, 'lesson')
  if (useLocalCollector && /^(?:\/app)?\/community\/(?!new$)[^/]+$/.test(path)) path = path.replace(/[^/]+$/, 'post')
  if (useLocalCollector && !allowedLocalPaths.has(path)) return

  const payload = { session_id: sessionId, event_name: eventName, path, component_id: eventName === 'component_select' ? componentId : null }
  if (useLocalCollector) {
    const params = new URLSearchParams(window.location.search)
    const lessonId = context.lessonId ?? params.get('lesson') ?? window.location.pathname.split('/').at(-1) ?? ''
    const boardId = context.boardId ?? params.get('board') ?? ''
    const referrer = selfHostedAnalyticsEnabled ? URL.parse(document.referrer) : null
    const host = referrer && ['http:', 'https:'].includes(referrer.protocol) && referrer.origin !== window.location.origin
      && /^(?:[a-z0-9-]+\.)+[a-z][a-z0-9-]*$/.test(referrer.hostname) ? referrer.hostname : null
    void fetch('/api/analytics/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
      keepalive: true, body: JSON.stringify(selfHostedAnalyticsEnabled ? { ...payload,
        device: window.innerWidth < 600 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        referrer_host: host,
        lesson_id: analyticsDimensions.lessons.includes(lessonId) ? lessonId : null,
        board_id: analyticsDimensions.boards.includes(boardId) ? boardId : null,
      } : payload),
    }).catch(() => undefined)
    return
  }
  if (!supabase) return
  const eventWrite = supabase.from('analytics_events').insert(payload)
  void Promise.resolve(eventWrite).catch(() => undefined)
}

export function trackPageView(eventName: 'page_view' | 'lesson_open', source: 'view' | 'router' = 'view'): void {
  if (typeof window === 'undefined') return
  if (useLocalCollector && eventName === 'page_view' && source !== 'router') return
  const path = window.location.pathname
  const now = Date.now()
  const previous = lastPageEvents.get(eventName)
  if (previous?.path === path && now - previous.at < 1000) return
  lastPageEvents.set(eventName, { path, at: now })
  trackEvent(eventName)
}
