import { apiRequest, readApiJson } from './api'

export type DailyAnalytics = {
  day: string
  sessions: number
  events: number
}

export type EventAnalytics = {
  eventName: string
  events: number
}

export type PathAnalytics = {
  path: string
  events: number
}

export type AnalyticsSummary = {
  sessionCount: number
  eventCount: number
  daily: DailyAnalytics[]
  byEvent: EventAnalytics[]
  byPath: PathAnalytics[]
}

export async function getAdminReport<T>(section: 'summary' | 'ai' | 'community' | 'system' | 'feedback', days: 7 | 30 | 90, signal: AbortSignal): Promise<T> {
  return readApiJson<T>(await apiRequest('/api/admin/' + section + '?days=' + days, { signal }))
}

export type DashboardSnapshot = {
  day: string
  receivedAt: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  accounts: number | null
  newAccounts: number | null
  sessions: number | null
  pageViews: number | null
}

export type DashboardSite = {
  id: string; name: string; origin: string | null; native: boolean; latest: DashboardSnapshot | null
}

export async function getDashboardSites(signal: AbortSignal): Promise<DashboardSite[]> {
  const response = await apiRequest('/api/admin/sites', { signal }, [404])
  if (response.status === 404) return []
  return readApiJson<DashboardSite[]>(response)
}

export async function getDashboardSiteReport<Feedback>(id: string, days: 7 | 30 | 90, signal: AbortSignal) {
  const query = new URLSearchParams({ days: String(days) })
  return readApiJson<{ daily: DashboardSnapshot[]; feedback: Feedback }>(
    await apiRequest('/api/admin/sites/' + encodeURIComponent(id) + '?' + query, { signal }),
  )
}
