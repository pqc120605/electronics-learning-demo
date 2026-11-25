export type OAuthProviderId = 'google' | 'github'

export type AuthUser = {
  id: string
  displayName: string
  avatarUrl: string | null
  provider: OAuthProviderId | 'other'
  role?: 'user' | 'admin'
  dashboardAccess?: boolean
}

export const OAUTH_PROVIDERS: ReadonlyArray<{ id: OAuthProviderId; label: string }> = [
  { id: 'google', label: 'Google (Gmail)' },
  { id: 'github', label: 'GitHub' },
]

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Chỉ chấp nhận ảnh https để không nạp URL lạ (javascript:, data:, http). */
export function safeAvatarUrl(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Chữ cái đầu cho avatar dự phòng. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).map(part => part.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean)
  // Bỏ hậu tố trong ngoặc như "(mẫu)" để "Chi (mẫu)" ra "C".
  const bracket = name.indexOf('(')
  if (bracket > 0) return initialsOf(name.slice(0, bracket))
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? 'M']
  return letters.join('').toUpperCase()
}

/** Chỉ cho phép quay về đường dẫn nội bộ (chống open redirect). */
export function safeNextPath(raw: string | null | undefined, fallback = '/community'): string {
  const value = (raw ?? '').trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f]/.test(value)) return fallback
  if (value.startsWith('/login') || value.startsWith('/app/login') || value.startsWith('/auth/')) return fallback
  return value
}
