import { CAPSTONE_STORAGE_KEY, decodeCapstone, encodeCapstone, newCapstoneId, type CapstoneReport } from './localCapstone'

export const CAPSTONE_LIBRARY_KEY = 'machmo-local-capstone-library-v1'
export const CAPSTONE_LIBRARY_RECOVERY_KEY = `${CAPSTONE_LIBRARY_KEY}:recovery`
export const CAPSTONE_LIBRARY_LIMIT = 30
export type CapstoneSnapshot = { id: string; name: string; savedAt: string; report: CapstoneReport }
export type CapstoneLibraryState = { kind: 'ready' | 'protected' | 'unavailable'; raw: string | null; entries: CapstoneSnapshot[]; message: string }
type LibraryStorage = Pick<Storage, 'getItem' | 'setItem'>

export function readCapstoneLibrary(storage: Pick<Storage, 'getItem'>): CapstoneLibraryState {
  let raw: string | null
  try { raw = storage.getItem(CAPSTONE_LIBRARY_KEY) }
  catch { return { kind: 'unavailable', raw: null, entries: [], message: 'Không đọc được bộ nhớ trình duyệt. Hãy tải hồ sơ JSON để giữ công việc.' } }
  if (raw === null) return { kind: 'ready', raw, entries: [], message: '' }
  try {
    if (raw.length > 4 * 1024 * 1024) throw Error()
    const value = JSON.parse(raw)
    if (value?.version !== 1 || !Array.isArray(value.entries) || value.entries.length > CAPSTONE_LIBRARY_LIMIT) throw Error()
    const ids = new Set<string>()
    const entries: CapstoneSnapshot[] = value.entries.map((entry: Record<string, unknown>) => {
      if (!entry || typeof entry.id !== 'string' || !/^[a-f0-9]{32}$/.test(entry.id) || ids.has(entry.id) || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 80 || typeof entry.savedAt !== 'string' || !Number.isFinite(Date.parse(entry.savedAt)) || typeof entry.report !== 'string') throw Error()
      ids.add(entry.id)
      const decoded = decodeCapstone(entry.report)
      if (!decoded.ok) throw Error()
      return { id: entry.id, name: entry.name, savedAt: entry.savedAt, report: decoded.report }
    })
    return { kind: 'ready', raw, entries, message: '' }
  } catch {
    return { kind: 'protected', raw, entries: [], message: 'Thư viện chưa đọc được hoặc thuộc phiên bản khác. Bản gốc được giữ nguyên; tải bản gốc để phục hồi.' }
  }
}

function currentLibrary(storage: LibraryStorage, expectedRaw: string | null) {
  const state = readCapstoneLibrary(storage)
  if (state.kind !== 'ready') throw Error(state.message)
  if (state.raw !== expectedRaw) throw Error('Thư viện đã đổi ở tab khác. Làm mới thư viện trước khi thử lại.')
  return state.entries
}

function writeLibrary(storage: LibraryStorage, expectedRaw: string | null, entries: CapstoneSnapshot[]): CapstoneLibraryState {
  const raw = JSON.stringify({ version: 1, entries: entries.map(entry => ({ ...entry, report: encodeCapstone(entry.report) })) })
  try {
    if (storage.getItem(CAPSTONE_LIBRARY_KEY) !== expectedRaw) throw Error('conflict')
    storage.setItem(CAPSTONE_LIBRARY_KEY, raw)
  } catch (error) {
    if (error instanceof Error && error.message === 'conflict') throw Error('Thư viện đã đổi ở tab khác. Làm mới thư viện trước khi thử lại.')
    throw Error('Không ghi được thư viện: bộ nhớ đầy hoặc bị chặn. Tải hồ sơ JSON trước khi đóng tab.')
  }
  return { kind: 'ready', raw, entries, message: '' }
}

export function saveCapstoneSnapshot(storage: LibraryStorage, expectedRaw: string | null, name: string, report: CapstoneReport): CapstoneLibraryState {
  const entries = currentLibrary(storage, expectedRaw)
  const title = name.trim()
  if (!title || title.length > 80) throw Error('Nhập tên hồ sơ từ 1 đến 80 ký tự.')
  if (entries.length >= CAPSTONE_LIBRARY_LIMIT) throw Error('Thư viện đã đầy (30 bản). Tải và xóa một bản đã lưu để có chỗ.')
  const decoded = decodeCapstone(encodeCapstone(report))
  if (!decoded.ok) throw Error(decoded.error)
  return writeLibrary(storage, expectedRaw, [{ id: newCapstoneId(), name: title, savedAt: new Date().toISOString(), report: decoded.report }, ...entries])
}

export function copyCapstoneSnapshot(storage: LibraryStorage, expectedRaw: string | null, id: string): CapstoneLibraryState {
  const entry = currentLibrary(storage, expectedRaw).find(item => item.id === id)
  if (!entry) throw Error('Không tìm thấy hồ sơ. Làm mới thư viện rồi thử lại.')
  return saveCapstoneSnapshot(storage, expectedRaw, `${entry.name.slice(0, 69)} · bản sao`, { ...entry.report, projectId: newCapstoneId() })
}

export function removeCapstoneSnapshot(storage: LibraryStorage, expectedRaw: string | null, id: string): CapstoneLibraryState {
  const entries = currentLibrary(storage, expectedRaw)
  if (!entries.some(item => item.id === id)) throw Error('Không tìm thấy hồ sơ. Làm mới thư viện rồi thử lại.')
  return writeLibrary(storage, expectedRaw, entries.filter(item => item.id !== id))
}

export function recoverCapstoneLibrary(storage: LibraryStorage, expectedRaw: string) {
  const state = readCapstoneLibrary(storage)
  if (state.kind !== 'protected' || state.raw !== expectedRaw) throw Error('Thư viện đã đổi. Làm mới và kiểm tra trước khi khôi phục.')
  const previous = storage.getItem(CAPSTONE_LIBRARY_RECOVERY_KEY)
  if (previous !== null && previous !== expectedRaw) throw Error('Đã có một bản gốc được bảo vệ. Tải thư viện đang lỗi để giữ riêng.')
  try {
    if (previous === null) storage.setItem(CAPSTONE_LIBRARY_RECOVERY_KEY, expectedRaw)
    if (storage.getItem(CAPSTONE_LIBRARY_RECOVERY_KEY) !== expectedRaw) throw Error()
  } catch {
    throw Error('Chưa lưu được bản gốc. Thư viện đang lỗi vẫn được giữ.')
  }
  return writeLibrary(storage, expectedRaw, [])
}

export function replaceActiveCapstone(storage: LibraryStorage, expectedRaw: string | null, report: CapstoneReport): string {
  const current = storage.getItem(CAPSTONE_STORAGE_KEY)
  if (current !== expectedRaw) throw Error('Hồ sơ đang làm đã đổi ở tab khác. Tải công việc hiện tại và mở lại trang trước khi thay hồ sơ.')
  if (current !== null && !decodeCapstone(current).ok) throw Error('Bản lưu gốc chưa đọc được. Hãy tải bản gốc để phục hồi; không thay thế dữ liệu này.')
  const decoded = decodeCapstone(encodeCapstone(report))
  if (!decoded.ok) throw Error(decoded.error)
  const encoded = encodeCapstone(decoded.report)
  try { storage.setItem(CAPSTONE_STORAGE_KEY, encoded) }
  catch { throw Error('Không ghi được hồ sơ: bộ nhớ đầy hoặc bị chặn. Hồ sơ trong thư viện vẫn được giữ.') }
  return encoded
}
