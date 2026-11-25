import { useEffect, useState } from 'react'
import type { AuthUser, OAuthProviderId } from './authUser'
import { endSelfHostedSession, readSelfHostedUser, selfHostedOAuthEnabled, selfHostedSessionChanged, startSelfHostedOAuth } from './selfHostedAuth'
import { ApiError } from './api'

export type AuthState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AuthUser }
  | { status: 'error'; message: string }

export async function signInWithProvider(provider: OAuthProviderId, next: string): Promise<void> {
  if (!selfHostedOAuthEnabled) throw new Error('Đăng nhập chưa được kết nối.')
  return startSelfHostedOAuth(provider, next)
}

export async function signOutUser(): Promise<void> {
  if (selfHostedOAuthEnabled) return endSelfHostedSession()
}

/** Trạng thái đăng nhập dùng chung cho header, topbar, cộng đồng. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => (selfHostedOAuthEnabled ? { status: 'loading' } : { status: 'unconfigured' }))

  useEffect(() => {
    if (!selfHostedOAuthEnabled) return
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
  }, [])

  return state
}
