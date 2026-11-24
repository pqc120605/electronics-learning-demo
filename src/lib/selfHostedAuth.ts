import { safeAvatarUrl, safeNextPath, type AuthUser, type OAuthProviderId } from './authUser'
import { ApiError, apiRequest, readApiJson } from './api'

export const selfHostedSessionChanged = 'machmo:session-changed'
export { selfHostedOAuthEnabled } from './backendMode'
export const selfHostedCsrf = { 'X-Machmo-CSRF': '1' }

export function startSelfHostedOAuth(provider: OAuthProviderId, next: string) {
  window.location.assign('/api/auth/login/' + provider + '?' + new URLSearchParams({ next: safeNextPath(next) }))
}

async function extractUser(response: Response): Promise<AuthUser | null> {
  const { user } = await readApiJson<{ user: AuthUser | null }>(response)
  if (user === null) return null
  if (typeof user?.id !== 'string' || typeof user.displayName !== 'string') {
    throw new Error('Không đọc được phiên đăng nhập.')
  }
  return { id: user.id, displayName: user.displayName, avatarUrl: safeAvatarUrl(user.avatarUrl),
    provider: ['google', 'github'].includes(user.provider) ? user.provider : 'other',
    role: user.role === 'admin' ? 'admin' : 'user', ...(user.dashboardAccess === true && { dashboardAccess: true }) }
}

let pendingRead: Promise<AuthUser | null> | undefined
export function readSelfHostedUser() {
  if (!pendingRead) {
    const request = apiRequest('/api/session', { signal: AbortSignal.timeout(8000) }).then(extractUser).catch(error => {
      if (error instanceof ApiError && error.code === 'not-found') throw new ApiError('unavailable', error.status)
      throw error
    }).finally(() => {
      if (pendingRead === request) pendingRead = undefined
    })
    pendingRead = request
  }
  return pendingRead
}

function notifyChange() {
  pendingRead = undefined
  window.dispatchEvent(new Event(selfHostedSessionChanged))
}

export async function endSelfHostedSession(): Promise<void> {
  const response = await apiRequest('/api/session/logout', {
    method: 'POST', headers: selfHostedCsrf, signal: AbortSignal.timeout(8000),
  })
  if (response.status !== 204) throw new Error('Không đăng xuất được. Hãy thử lại khi có kết nối.')
  notifyChange()
}

export async function deleteSelfHostedAccount(): Promise<void> {
  const response = await apiRequest('/api/account', {
    method: 'DELETE', headers: selfHostedCsrf, signal: AbortSignal.timeout(8000),
  })
  if (response.status !== 204) throw new Error('Không xóa được tài khoản. Hãy kiểm tra phiên đăng nhập và thử lại.')
  notifyChange()
}
