import { safeAvatarUrl, safeNextPath, type AuthUser, type OAuthProviderId } from './authUser'
import { ApiError, apiRequest, readApiJson } from './api'

const sessionPath = '/api/session'
export const selfHostedSessionChanged = 'machmo:session-changed'
export const selfHostedOAuthEnabled = import.meta.env.VITE_MACHMO_SELF_HOSTED_OAUTH === 'true'
export const selfHostedCsrf = { 'X-Machmo-CSRF': '1' }

export function startSelfHostedOAuth(provider: OAuthProviderId, next: string) {
  window.location.assign('/api/auth/login/' + provider + '?' + new URLSearchParams({ next: safeNextPath(next) }))
}

async function sessionRequest(path: string, payload?: Record<string, string>) {
  return apiRequest(sessionPath + path, {
    signal: AbortSignal.timeout(8000),
    ...(payload && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  }, payload ? [400, 401, 409, 429] : [])
}

async function extractUser(response: Response): Promise<AuthUser | null> {
  if (!response.ok) {
    throw new Error('Không đọc được phiên đăng nhập.')
  }
  const { user } = await readApiJson<{ user: AuthUser | null }>(response)
  if (user === null) return null
  if (typeof user?.id !== 'string' || typeof user.displayName !== 'string') {
    throw new Error('Không đọc được phiên đăng nhập.')
  }
  return { id: user.id, displayName: user.displayName, avatarUrl: safeAvatarUrl(user.avatarUrl),
    provider: ['google', 'github'].includes(user.provider) ? user.provider : 'other',
    role: user.role === 'admin' ? 'admin' : 'user' }
}

let pendingRead: Promise<AuthUser | null> | undefined
export function readSelfHostedUser() {
  if (!pendingRead) {
    const request = sessionRequest('').then(extractUser).catch(error => {
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

export async function redeemSelfHostedInvite(invite: string): Promise<void> {
  const response = await sessionRequest('/redeem', { invite })
  if (response.status === 401 || response.status === 400) throw new Error('Mã mời không hợp lệ, đã được dùng hoặc đã hết hạn.')
  if (response.status === 409) throw new Error('Bạn đang có một phiên đăng nhập. Hãy kiểm tra tài khoản hiện tại.')
  if (response.status === 429) throw new Error('Có quá nhiều lượt thử. Hãy thử lại sau một phút.')
  if (!await extractUser(response)) throw new Error('Không đọc được tài khoản trong phiên mới.')
  notifyChange()
}

export async function endSelfHostedSession(): Promise<void> {
  const response = selfHostedOAuthEnabled ? await apiRequest('/api/session/logout', {
    method: 'POST', headers: selfHostedCsrf, signal: AbortSignal.timeout(8000),
  }) : await sessionRequest('/logout', {})
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
