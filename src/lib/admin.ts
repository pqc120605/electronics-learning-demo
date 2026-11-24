import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
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

export type AdminAccess = {
  session: Session
  user: User
  isAdmin: boolean
}

export async function getAdminAccess(): Promise<AdminAccess | null> {
  if (!supabase) return null

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData.session
  if (!session) return null

  const { data: adminRecord, error: roleError } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (roleError) throw roleError
  return { session, user: session.user, isAdmin: Boolean(adminRecord) }
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getAnalyticsSummary(startAt: string, endAt: string): Promise<AnalyticsSummary> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  const { data, error } = await supabase.rpc('get_analytics_summary', {
    p_start_at: startAt,
    p_end_at: endAt,
  })

  if (error) throw error
  return data as AnalyticsSummary
}

export async function getLocalAnalyticsSummary(start: string, end: string): Promise<AnalyticsSummary> {
  const query = new URLSearchParams({ start, end })
  return readApiJson<AnalyticsSummary>(await apiRequest('/api/analytics/admin/summary?' + query))
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
