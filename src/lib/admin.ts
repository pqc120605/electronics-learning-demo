import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

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
