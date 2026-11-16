/**
 * Hàm thuần cho đăng nhập OAuth (không import Supabase) để test được trong Node.
 */

export type OAuthProviderId = 'google' | 'github'

export type AuthUser = {
  id: string
  displayName: string
  avatarUrl: string | null
  provider: OAuthProviderId | 'other'
}

export const OAUTH_PROVIDERS: ReadonlyArray<{ id: OAuthProviderId; label: string }> = [
  { id: 'google', label: 'Google (Gmail)' },
  { id: 'github', label: 'GitHub' },
]

type UserLike = {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown> | null
  user_metadata?: Record<string, unknown> | null
}

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

/** Chuyển user Supabase thành dữ liệu hiển thị tối thiểu: tên + avatar, không hiện email. */
export function toAuthUser(user: UserLike): AuthUser {
  const meta = user.user_metadata ?? {}
  const providerRaw = text(user.app_metadata?.provider)
  const provider: AuthUser['provider'] = providerRaw === 'google' || providerRaw === 'github' ? providerRaw : 'other'
  const emailName = text(user.email).split('@')[0] ?? ''
  const displayName = (text(meta.full_name) || text(meta.name) || text(meta.user_name) || text(meta.preferred_username) || emailName || 'Thành viên').slice(0, 60)
  return {
    id: user.id,
    displayName,
    avatarUrl: safeAvatarUrl(meta.avatar_url) ?? safeAvatarUrl(meta.picture),
    provider,
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

/** Đọc lỗi OAuth trả về trong query hoặc hash của URL callback. */
export function readOAuthError(search: string, hash: string): string | null {
  for (const source of [search, hash.replace(/^#/, '?')]) {
    const params = new URLSearchParams(source)
    const message = params.get('error_description') ?? params.get('error')
    if (message) return message.slice(0, 200)
  }
  return null
}
