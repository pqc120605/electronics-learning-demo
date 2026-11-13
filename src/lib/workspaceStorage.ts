const MAIN_WORKSPACE_KEYS = ['machmo-builder-session', 'machmo-builder-session-v5', 'machmo-lesson-drafts', 'machmo-branch-session']
const GUIDED_PREFIX = 'machmo-guided-'
const RECOVERY_MARKER = '-recovery-'

/** In-memory fallback for browsers that refuse storage access; data lasts for the page only. */
function createVolatileStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => { data.delete(key) },
    setItem: (key, value) => { data.set(key, String(value)) },
  }
}

const volatileStores: Partial<Record<'localStorage' | 'sessionStorage', Storage>> = {}

export function isVolatileStorage(storage: Storage): boolean {
  return Object.values(volatileStores).includes(storage)
}

type LibraryWorkspaceMetadata = { libraryEntryId?: unknown; libraryEntryName?: unknown }

/** Remove local library links at the portable document boundary. */
export function withoutLibraryWorkspaceMetadata<T extends object>(workspace: T): T {
  const { libraryEntryId, libraryEntryName, ...document } = workspace as T & LibraryWorkspaceMetadata
  return document as T
}

export function getBrowserStorage(kind: 'localStorage' | 'sessionStorage'): Storage {
  try {
    return window[kind]
  } catch {
    return volatileStores[kind] ??= createVolatileStorage()
  }
}

function storageKeys(storage: Storage): string[] {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null)
}

function quarantineEntries(storage: Storage, keys: string[], stamp: number) {
  return keys.flatMap((key) => {
    const value = storage.getItem(key)
    return value === null ? [] : [{ storage, key, backupKey: `${key}${RECOVERY_MARKER}${stamp}`, value }]
  })
}

/** Keeps one copy per damaged value, because a failing render can load the same data repeatedly. */
export function backupDamagedValue(storage: Storage, key: string, value: string, stamp = Date.now()): void {
  const prefix = `${key}${RECOVERY_MARKER}`
  if (storageKeys(storage).some((candidate) => candidate.startsWith(prefix) && storage.getItem(candidate) === value)) return
  storage.setItem(`${prefix}${stamp}`, value)
}

/**
 * Moves the lab's working data aside so a damaged workspace can reopen. Every backup
 * is written before any original is removed, and saved projects are never touched.
 */
export function quarantineWorkspaceData(local: Storage, session: Storage, stamp = Date.now()): void {
  const entries = [
    ...quarantineEntries(local, MAIN_WORKSPACE_KEYS, stamp),
    ...quarantineEntries(session, storageKeys(session).filter((key) => key.startsWith(GUIDED_PREFIX) && !key.includes(RECOVERY_MARKER)), stamp),
  ]
  try {
    for (const entry of entries) entry.storage.setItem(entry.backupKey, entry.value)
  } catch {
    throw new Error('Không sao lưu được dữ liệu workspace vì bộ nhớ trình duyệt đã đầy hoặc bị chặn; dữ liệu gốc được giữ nguyên.')
  }
  for (const entry of entries) entry.storage.removeItem(entry.key)
}

export function listWorkspaceRecoveryEntries(...stores: Storage[]): Array<{ key: string; value: string }> {
  return stores.flatMap((storage) => storageKeys(storage)
    .filter((key) => key.startsWith('machmo-') && (key.includes(RECOVERY_MARKER) || key.includes('-damaged-')))
    .map((key) => ({ key, value: storage.getItem(key) ?? '' })))
}
