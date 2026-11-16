import type { CommunityCategoryId } from './community'
import { isCategoryId } from './community'
const KEY = 'mach-mo-community-compose-v1'
export type CommunityDraft = { title: string; body: string; category: CommunityCategoryId | ''; tagText: string }
export function readCommunityDraft(): CommunityDraft | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return value && typeof value.title === 'string' && typeof value.body === 'string' && typeof value.tagText === 'string' && (value.category === '' || isCategoryId(value.category)) ? value : null
  } catch { return null }
}
export function writeCommunityDraft(draft: CommunityDraft): string | null {
  try { localStorage.setItem(KEY, JSON.stringify(draft)); return null } catch { return 'Không lưu được nháp chữ; biểu mẫu hiện chỉ ở bộ nhớ. Sao chép nội dung trước khi rời trang.' }
}
export function clearCommunityDraft(): void { try { localStorage.removeItem(KEY) } catch { /* published data is unaffected */ } }
