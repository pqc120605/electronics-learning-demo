import type { AuthUser } from './authUser'

const sessionPath = '/api/session'
export const selfHostedSessionChanged = 'machmo:session-changed'

async function sessionRequest(path: string, payload?: Record<string, string>) {
  return fetch(sessionPath + path, {
    signal: AbortSignal.timeout(8000),
    credentials: 'same-origin',
    cache: 'no-store',
    ...(payload && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  })
}

async function extractUser(response: Response): Promise<AuthUser | null> {
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Không đọc được phiên đăng nhập.')
  }
  const { user } = await response.json()
  if (user === null) return null
  if (typeof user?.id !== 'string' || typeof user.displayName !== 'string') {
    throw new Error('Không đọc được phiên đăng nhập.')
  }
  return { id: user.id, displayName: user.displayName, avatarUrl: null, provider: 'other' }
}

let pendingRead: Promise<AuthUser | null> | undefined
export function readSelfHostedUser() {
  if (!pendingRead) {
    const request = sessionRequest('').then(extractUser).finally(() => {
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
  const response = await sessionRequest('/logout', {})
  if (response.status !== 204) throw new Error('Không đăng xuất được. Hãy thử lại khi có kết nối.')
  notifyChange()
}
