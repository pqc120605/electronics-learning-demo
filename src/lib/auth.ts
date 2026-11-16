import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'
import { toAuthUser, type AuthUser, type OAuthProviderId } from './authUser'

export type AuthState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AuthUser }
  | { status: 'error'; message: string }

export const isAuthConfigured = isSupabaseConfigured

/** Đường dẫn callback OAuth; phải được thêm vào Redirect URLs trong Supabase dashboard. */
export function oauthRedirectUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}

/** Mở trang đăng nhập của Google/GitHub qua Supabase Auth. Không giả lập khi chưa cấu hình. */
export async function signInWithProvider(provider: OAuthProviderId, next: string): Promise<void> {
  if (!supabase) throw new Error('Đăng nhập chưa được kết nối.')
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: oauthRedirectUrl(next) },
  })
  if (error) throw error
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function readCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session ? toAuthUser(data.session.user) : null
}

/** Trạng thái đăng nhập dùng chung cho header, topbar, cộng đồng. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => (isSupabaseConfigured ? { status: 'loading' } : { status: 'unconfigured' }))

  useEffect(() => {
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
