import { communitySeed } from '../data/communitySeed'
import { createPreviewRepository, type CommunityRepository } from './community'
import { createSelfHostedCommunityRepository } from './communitySelfHostedRepository'
import { selfHostedOAuthEnabled } from './selfHostedAuth'

let repository: CommunityRepository | null = null

/** Community publication requires native persistence; a RAM substitute is not a saved post. */
function nativeLocalStorage(): Storage | null {
  try { return window.localStorage } catch { return null }
}

/** Configured backend defaults online; explicit preview mode preserves legacy local posts. */
export function getCommunityRepository(): CommunityRepository {
  if (!repository) {
    const storage = nativeLocalStorage()
    let localOnly = false
    try { localOnly = storage?.getItem('mach-mo-community-source') === 'preview' } catch { /* backend remains explicit */ }
    if (!localOnly && selfHostedOAuthEnabled) repository = createSelfHostedCommunityRepository()
    else repository = createPreviewRepository(communitySeed, storage)
  }
  return repository
}

export function setCommunitySource(mode: 'preview' | 'remote'): void {
  const storage = nativeLocalStorage()
  if (!storage) throw new Error('Không lưu được lựa chọn nguồn cộng đồng.')
  storage.setItem('mach-mo-community-source', mode)
  window.location.reload()
}
export const canUseOnlineCommunity = selfHostedOAuthEnabled

/** Gốc đường dẫn theo bề mặt: website công khai hay workspace /app. */
export function communityBase(pathname: string): string {
  return pathname.startsWith('/app') ? '/app/community' : '/community'
}

export function loginPath(pathname: string, next?: string): string {
  const base = pathname.startsWith('/app') ? '/app/login' : '/login'
  return next ? `${base}?next=${encodeURIComponent(next)}` : base
}
