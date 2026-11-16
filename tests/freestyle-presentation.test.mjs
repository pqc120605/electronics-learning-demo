import assert from 'node:assert/strict'
import { after,before,test } from 'node:test'
import { createServer } from 'vite'
let server,presentation,fs,diagram,assembly
before(async()=>{
 server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}})
 fs=await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
 presentation=await server.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
 diagram=await server.ssrLoadModule('/src/lib/breadboardDiagram.ts')
 assembly=await server.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
})
after(async()=>server?.close())
test('selected board artwork, identity and mapped pin labels agree for all eight boards',()=>{
 for(const board of fs.freestyleBoards){
   const map={...board.defaultPins,ledOut:fs.availablePins(board.id)[0]}
   const view=presentation.freestylePresentation(board.id,map)
   assert.equal(view.name,board.name)
   assert.equal(view.pinLabels.ledOut,fs.pinDisplayName(board.id,map.ledOut))
   assert.ok(view.model.assetUrl.includes(view.canonicalId==='stm32-nucleo'?'stm32-nucleo':view.canonicalId))
   const d=diagram.buildBreadboardDiagram(fs.createEmptyFreestyleDoc(),view)
   if(presentation.freestylePinAnchor(view,map,'ledOut'))assert.equal(d.boardPins.find(p=>p.pinId==='ledOut').label,view.pinLabels.ledOut)
   else {assert.equal(d.boardPins.some(p=>p.pinId==='ledOut'),false);assert.ok(d.diagnostics.some(message=>message.includes('chưa có tọa độ')))}
 }
})
test('empty doc draws neither board nor breadboard and creates no 3D ghost placements',()=>{
 const blank=fs.blankFreestyleWorkspace()
 const d=diagram.buildBreadboardDiagram(blank.doc)
 assert.equal(d.holes.length,0)
 assert.equal(d.boardPins.length,0)
 assert.equal(assembly.freestyleAssembly(blank.doc,'',blank.pinMap).placements.length,0)
})
test('3D board wires follow actual freestyle pinMap, unsupported anchors are omitted',()=>{
 const w=fs.defaultFreestyleWorkspace('arduino-uno-r3')
 const a=assembly.freestyleAssembly(w.doc,w.boardId,w.pinMap)
 assert.ok(Math.abs(a.pinPoints['board:ledOut'][0])>10,'assembly endpoint coordinates must stay in millimetres')
 const b=assembly.freestyleAssembly(w.doc,w.boardId,{...w.pinMap,ledOut:7})
 assert.notDeepEqual(a.pinPoints['board:ledOut'],b.pinPoints['board:ledOut'])
 assert.ok(Object.values(b.wireEnds).every(pair=>pair.flat().every(Number.isFinite)))
 const unknown=assembly.freestyleAssembly(w.doc,w.boardId,{...w.pinMap,ledOut:999})
 assert.equal(unknown.pinPoints['board:ledOut'],undefined)
 assert.ok(unknown.diagnostics.length>0)
})
test('estimated STM32 pad placements do not become CAD-exact wire anchors',()=>{
 for(const id of ['stm32-blue-pill-f103','stm32-nucleo-f401re']){
  const board=fs.getFreestyleBoard(id),view=presentation.freestylePresentation(id,board.defaultPins)
  assert.equal(presentation.freestylePinAnchor(view,board.defaultPins,'ledOut'),undefined)
 }
})
test('Pico power stations use its actual 3V3(OUT) and VBUS source pins',()=>{
 const board=fs.getFreestyleBoard('raspberry-pi-pico'),view=presentation.freestylePresentation(board.id,board.defaultPins)
 assert.equal(view.pinLabels.vcc,'3V3(OUT)')
 assert.equal(view.pinLabels.v5,'VBUS')
 assert.ok(presentation.freestylePinAnchor(view,board.defaultPins,'vcc'))
 assert.ok(presentation.freestylePinAnchor(view,board.defaultPins,'v5'))
})
