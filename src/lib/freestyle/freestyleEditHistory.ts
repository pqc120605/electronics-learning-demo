import { movePart, placePart, removePartAndWires, rotatePart, type FreestyleWorkspace } from './freestyleCircuit'
import type { CircuitDocV2 } from '../circuitDocV2'

type Snapshot = Pick<FreestyleWorkspace, 'doc' | 'wireLayout' | 'sampleId'>
export type CircuitHistory = { past: Snapshot[]; future: Snapshot[] }
export const emptyCircuitHistory = (): CircuitHistory => ({past:[],future:[]})
const snapshot = ({doc,wireLayout,sampleId}: Snapshot): Snapshot => ({doc,wireLayout,sampleId})

export function recordCircuitEdit(history: CircuitHistory, current: Snapshot): CircuitHistory {
  return {past:[...history.past.slice(-29),snapshot(current)],future:[]}
}

export function takeCircuitHistory(history: CircuitHistory, current: Snapshot, direction: 'undo' | 'redo') {
  const entry = direction === 'undo' ? history.past.at(-1) : history.future.at(-1)
  if (!entry) return null
  return { entry, history: direction === 'undo'
    ? {past:history.past.slice(0,-1),future:[...history.future,snapshot(current)]}
    : {past:[...history.past,snapshot(current)],future:history.future.slice(0,-1)} }
}

type SelectionAction = 'duplicate' | 'remove' | 'rotate' | { column: number; row: number }

export function editParts(doc: CircuitDocV2, ids: readonly string[], action: SelectionAction): { doc: CircuitDocV2; ids: string[]; error?: string } {
  const selected = doc.parts.filter(part => ids.includes(part.id) && !['board','breadboard'].includes(part.type))
  if (!selected.length) return {doc,ids:[]}
  const selection = selected.map(part => part.id)
  let next = doc
  if (action === 'remove') {
    for (const id of selection) next=removePartAndWires(next,id)
    return {doc:next,ids:[]}
  }
  if (action === 'duplicate') {
    const copies: string[]=[]
    for (const part of selected) {
      const result=placePart(next,part.type)
      if (!result.partId) return {doc,ids:selection,error:result.error}
      next={...result.doc,parts:result.doc.parts.map(item=>item.id===result.partId?{...item,value:part.value}:item)}
      copies.push(result.partId)
    }
    return {doc:next,ids:copies}
  }

  const order = typeof action === 'object' ? [...selected].sort((a,b)=>{
    if (a.mount.kind!=='breadboard'||b.mount.kind!=='breadboard') return 0
    return action.column*(b.mount.col-a.mount.col)+action.row*(b.mount.row-a.mount.row)
  }) : selected
  for (const part of order) {
    if (part.mount.kind!=='breadboard') return {doc,ids:selection,error:'Chọn linh kiện đang cắm breadboard để xoay hoặc di chuyển theo lỗ.'}
    const result=action==='rotate' ? rotatePart(next,part.id)
      : movePart(next,part.id,{col:part.mount.col+action.column,row:part.mount.row+action.row})
    if (result.error) return {doc,ids:selection,error:result.error}
    next=result.doc
  }
  return {doc:next,ids:selection}
}
