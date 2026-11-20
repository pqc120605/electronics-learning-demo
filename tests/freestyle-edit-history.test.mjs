import assert from 'node:assert/strict'
import {after,before,test} from 'node:test'
import {createServer} from 'vite'

let vite, edit, circuit
before(async()=>{
  vite=await createServer({logLevel:'silent',server:{middlewareMode:true,hmr:false}})
  ;[edit,circuit]=await Promise.all(['freestyleEditHistory','freestyleCircuit'].map(id=>vite.ssrLoadModule(`/src/lib/freestyle/${id}.ts`)))
})
after(async()=>{await vite?.close()})

test('group duplication is atomic and uses new part ids without copying wires',()=>{
  const {doc}=circuit.defaultFreestyleWorkspace('arduino-uno-r3','blink')
  const selected=doc.parts.filter(part=>part.type!=='board').map(part=>part.id)
  const added=edit.editParts(doc,selected,'duplicate')
  assert.equal(added.ids.length,2)
  assert.ok(added.ids.every(id=>!selected.includes(id)))
  assert.equal(added.doc.parts.length,doc.parts.length+2)
  assert.deepEqual(added.doc.wires,doc.wires)
  const rejected=edit.editParts(doc,selected,{column:-99,row:0})
  assert.ok(rejected.error)
  assert.equal(rejected.doc,doc)
})

test('undo/redo preserves snapshots and a new edit discards only future operations',()=>{
  const original=circuit.defaultFreestyleWorkspace('arduino-uno-r3','blink')
  let history=edit.emptyCircuitHistory()
  for(let i=0;i<34;i++) history=edit.recordCircuitEdit(history,original)
  assert.equal(history.past.length,30)
  const next={...original,doc:edit.editParts(original.doc,['led1'],'remove').doc}
  const undone=edit.takeCircuitHistory(history,next,'undo')
  assert.equal(undone.entry.doc,original.doc)
  const redone=edit.takeCircuitHistory(undone.history,original,'redo')
  assert.equal(redone.entry.doc,next.doc)
  assert.equal(edit.recordCircuitEdit(undone.history,original).future.length,0)
  assert.ok(!Object.hasOwn(undone.entry,'code'))
})
