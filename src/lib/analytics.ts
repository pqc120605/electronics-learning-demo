import { isSupabaseConfigured, supabase } from './supabase'

export type AnalyticsEventName = 'page_view' | 'lesson_open' | 'component_select' | 'code_copy' | 'builder_run'

const allowedComponentIds = new Set(['esp32', 'breadboard', 'led', 'resistor', 'jumper'])
let lastPageEvent = ''
let lastPageEventAt = 0

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
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') return
  if (eventName === 'component_select' && (!componentId || !allowedComponentIds.has(componentId))) return

  const sessionId = getSessionId()
  if (!sessionId) return

  const path = window.location.pathname
  if (path.length > 200 || !/^\/[A-Za-z0-9/_-]*$/.test(path) || path.startsWith('/admin')) return

  const eventWrite = supabase.from('analytics_events').insert({
      session_id: sessionId,
      event_name: eventName,
      path,
      component_id: eventName === 'component_select' ? componentId! : null,
    })
  void Promise.resolve(eventWrite).catch(() => undefined)
}

export function trackPageView(eventName: 'page_view' | 'lesson_open'): void {
  if (typeof window === 'undefined') return
  const key = `${eventName}:${window.location.pathname}`
  const now = Date.now()
  if (lastPageEvent === key && now - lastPageEventAt < 1000) return
  lastPageEvent = key
  lastPageEventAt = now
  trackEvent(eventName)
}
