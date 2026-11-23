import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { toAuthUser, type AuthUser, type OAuthProviderId } from './authUser'
import { endSelfHostedSession, readSelfHostedUser, selfHostedOAuthEnabled, selfHostedSessionChanged, startSelfHostedOAuth } from './selfHostedAuth'
import { ApiError } from './api'

export type AuthState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AuthUser }
  | { status: 'error'; message: string }

export const isAuthConfigured = selfHostedOAuthEnabled || isSupabaseConfigured

/** Đường dẫn callback OAuth; phải được thêm vào Redirect URLs trong Supabase dashboard. */
export function oauthRedirectUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}

/** Chuyển tới nhà cung cấp thông qua backend xác thực đang dùng. */
export async function signInWithProvider(provider: OAuthProviderId, next: string): Promise<void> {
  if (selfHostedOAuthEnabled) return startSelfHostedOAuth(provider, next)
  if (!supabase) throw new Error('Đăng nhập chưa được kết nối.')
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: oauthRedirectUrl(next) },
  })
  if (error) throw error
}

export async function signOutUser(): Promise<void> {
  if (selfHostedOAuthEnabled) return endSelfHostedSession()
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function readCurrentUser(): Promise<AuthUser | null> {
  if (selfHostedOAuthEnabled) return readSelfHostedUser()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session ? toAuthUser(data.session.user) : null
}

/** Trạng thái đăng nhập dùng chung cho header, topbar, cộng đồng. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => (isAuthConfigured ? { status: 'loading' } : { status: 'unconfigured' }))

  useEffect(() => {
    if (selfHostedOAuthEnabled) {
      let version = 0
      function refresh() {
        const request = ++version
        readSelfHostedUser()
          .then(user => { if (request === version) setState(user ? { status: 'signed-in', user } : { status: 'signed-out' }) })
          .catch(error => {
            if (request === version) setState({ status: 'error', message: error instanceof ApiError ? error.message : 'Không đọc được phiên đăng nhập.' })
          })
      }
      refresh()
      const refreshTimer = window.setInterval(refresh, 60_000)
      window.addEventListener('focus', refresh)
      window.addEventListener(selfHostedSessionChanged, refresh)
      return () => {
        version++
        window.clearInterval(refreshTimer)
        window.removeEventListener('focus', refresh)
        window.removeEventListener(selfHostedSessionChanged, refresh)
      }
    }
    if (!supabase) return
    let active = true
    readCurrentUser()
      .then(user => { if (active) setState(user ? { status: 'signed-in', user } : { status: 'signed-out' }) })
      .catch(() => { if (active) setState({ status: 'error', message: 'Không đọc được phiên đăng nhập.' }) })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setState(session ? { status: 'signed-in', user: toAuthUser(session.user) } : { status: 'signed-out' })
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}
