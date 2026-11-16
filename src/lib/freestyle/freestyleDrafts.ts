import { FREESTYLE_STORAGE_KEY, parseFreestyleWorkspace, type FreestyleWorkspace } from './freestyleCircuit'
type DraftStorage = Pick<Storage,'getItem'|'setItem'|'length'|'key'>
export type SavedFreestyleDraft = {key:string;raw:string;workspace:FreestyleWorkspace|null}
export function archiveFreestyle(storage: Pick<DraftStorage,'getItem'|'setItem'>,raw:string):{ok:true;key:string}|{ok:false} {
  try {
    const key=`${FREESTYLE_STORAGE_KEY}:previous:${Date.now()}-${crypto.randomUUID()}`
    storage.setItem(key,raw)
    return storage.getItem(key)===raw?{ok:true,key}:{ok:false}
  }catch{return {ok:false}}
}
/** No deletion or migration: even unreadable originals remain available for a raw download. */
export function listFreestyleDrafts(storage:DraftStorage):SavedFreestyleDraft[] {
  const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((key):key is string=>Boolean(key&&(key===FREESTYLE_STORAGE_KEY||key.startsWith(FREESTYLE_STORAGE_KEY+':previous:')))).sort().reverse()
  return keys.flatMap(key=>{const raw=storage.getItem(key);return raw?[{key,raw,workspace:parseFreestyleWorkspace(raw)}]:[]})
}
