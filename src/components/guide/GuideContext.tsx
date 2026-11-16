import {createContext,useCallback,useContext,useId,useMemo,useState,useEffect,type ReactNode} from 'react'
import type {GuideSnapshot} from '../../lib/guideKnowledge'

const SnapshotContext=createContext<GuideSnapshot|undefined>(undefined)
const PublishContext=createContext<((id:string,snapshot:GuideSnapshot|null)=>void)|null>(null)
export const GUIDE_OPEN_EVENT='mm:open-guide'
export function requestGuideOpen(){window.dispatchEvent(new Event(GUIDE_OPEN_EVENT))}

/** Only allowlisted teaching metadata; never code, files, serial text or learner identity. */
export function GuideProvider({children}:{children:ReactNode}){
  const [snapshots,setSnapshots]=useState<Record<string,GuideSnapshot>>({})
  const publish=useCallback((id:string,snapshot:GuideSnapshot|null)=>setSnapshots(current=>{
    if(snapshot)return {...current,[id]:snapshot}
    if(!(id in current))return current
    const next={...current};delete next[id];return next
  }),[])
  const current=useMemo(()=>Object.values(snapshots).sort((a,b)=>(b.priority??0)-(a.priority??0))[0],[snapshots])
  return <PublishContext.Provider value={publish}><SnapshotContext.Provider value={current}>{children}</SnapshotContext.Provider></PublishContext.Provider>
}
export function GuideContextBridge({snapshot}:{snapshot:GuideSnapshot}){
  const publish=useContext(PublishContext),id=useId(),encoded=JSON.stringify(snapshot)
  useEffect(()=>{publish?.(id,JSON.parse(encoded) as GuideSnapshot);return()=>publish?.(id,null)},[publish,id,encoded])
  return null
}
export function useGuideSnapshot(){return useContext(SnapshotContext)}
