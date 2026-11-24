import { FREESTYLE_STORAGE_KEY, parseFreestyleWorkspace, type FreestyleWorkspace } from './freestyleCircuit'
type DraftStorage = Pick<Storage,'getItem'|'setItem'|'length'|'key'>
const archivePrefix = FREESTYLE_STORAGE_KEY + ':previous:'

export type SavedFreestyleDraft = {key:string;raw:string;workspace:FreestyleWorkspace|null}
export function archiveFreestyle(storage: Pick<DraftStorage,'getItem'|'setItem'>,raw:string):{ok:true;key:string}|{ok:false} {
  try {
    const key=`${archivePrefix}${Date.now()}-${crypto.randomUUID()}`
    storage.setItem(key,raw)
    return storage.getItem(key)===raw?{ok:true,key}:{ok:false}
  }catch{return {ok:false}}
}
function comparableDraft(raw: string) {
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return raw
  const { updatedAt: _, ...snapshot } = value as Record<string, unknown>
  return JSON.stringify(snapshot)
}

/** Reuse an identical archive when switching between the same sample or draft. */
export function archiveFreestyleReplacement(storage: DraftStorage, raw: string) {
  try {
    const snapshot = comparableDraft(raw)
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key?.startsWith(archivePrefix)) continue
      const saved = storage.getItem(key)
      if (!saved) continue
      try {
        if (comparableDraft(saved) === snapshot) return { ok: true as const, key }
      } catch { /* unreadable archives remain available to export */ }
    }
  } catch { /* fall back to preserving the exact input */ }
  return archiveFreestyle(storage, raw)
}

/** No deletion or migration: even unreadable originals remain available for a raw download. */
export function listFreestyleDrafts(storage:DraftStorage):SavedFreestyleDraft[] {
  const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((key):key is string=>Boolean(key&&(key===FREESTYLE_STORAGE_KEY||key.startsWith(archivePrefix)))).sort().reverse()
  return keys.flatMap(key=>{const raw=storage.getItem(key);return raw?[{key,raw,workspace:parseFreestyleWorkspace(raw)}]:[]})
}
