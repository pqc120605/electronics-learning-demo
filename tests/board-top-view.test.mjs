import assert from 'node:assert/strict'
import {before,after,test} from 'node:test'
import {createServer} from 'vite'
let server,top,presentation,diagram,freestyle
before(async()=>{
 server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}})
 ;[top,presentation,diagram,freestyle]=await Promise.all(['/src/lib/boardTopView.ts','/src/lib/freestyle/freestylePresentation.ts','/src/lib/breadboardDiagram.ts','/src/lib/freestyle/freestyleCircuit.ts'].map(path=>server.ssrLoadModule(path)))
})
after(async()=>server?.close())
test('orthographic top projection uses X/Z and never perspective or height',()=>{
 const bounds={minX:0,maxX:70,minZ:-54,maxZ:0},rect={x:10,y:20,width:700,height:540}
 assert.deepEqual(top.projectTopViewPoint(bounds,rect,[10,1,-40]),{x:110,y:160})
 assert.deepEqual(top.projectTopViewPoint(bounds,rect,[10,1000,-40]),{x:110,y:160})
 assert.equal(top.projectTopViewPoint(bounds,rect,[NaN,1,0]),null)
 assert.equal(top.projectTopViewPoint({...bounds,maxX:0},rect,[10,1,0]),null)
 assert.equal(top.projectTopViewPoint(bounds,rect,[71,1,0]),null)
})
test('all eight selectable boards have standalone true-top local assets and source hashes',()=>{
 for(const board of freestyle.freestyleBoards){
  const view=presentation.freestylePresentation(board.id,board.defaultPins),art=top.getBoardTopView(view.canonicalId)
  assert.ok(art,board.id);assert.equal(art.projection,'orthographic-xz')
  assert.match(art.image,/^\/board-reference\/topview\/.+\.png$/)
  assert.match(art.assetSha256,/^[a-f0-9]{64}$/);assert.match(art.imageSha256,/^[a-f0-9]{64}$/)
  assert.ok(art.boundsMm.maxX>art.boundsMm.minX&&art.boundsMm.maxZ>art.boundsMm.minZ)
 }
})
test('known Uno pads and jumper endpoints use the same top image projection, preserving identity',()=>{
 const board=freestyle.getFreestyleBoard('arduino-uno-r3'),view=presentation.freestylePresentation(board.id,board.defaultPins)
 const doc=freestyle.createEmptyFreestyleDoc(),d=diagram.buildBreadboardDiagram(doc,view)
 for(const role of ['ledOut','gnd','input']){
  const pin=d.boardPins.find(pin=>pin.pinId===role),anchor=presentation.freestylePinAnchor(view,board.defaultPins,role)
  assert.ok(pin&&anchor,role)
  const expected=top.projectTopViewPoint(view.topView.boundsMm,d.board,anchor)
  assert.ok(expected);assert.ok(Math.abs(pin.x-expected.x)<1e-8&&Math.abs(pin.y-expected.y)<1e-8,role)
  assert.equal(pin.key,`board:${role}`)
 }
 assert.ok(d.board.width/d.board.height>1,'board aspect follows physical top image, not a portrait card')
})
test('unknown or reconstructed pad anchors are not drawn as exact physical board pins',()=>{
 const board=freestyle.getFreestyleBoard('stm32-blue-pill-f103'),view=presentation.freestylePresentation(board.id,board.defaultPins)
 const d=diagram.buildBreadboardDiagram(freestyle.createEmptyFreestyleDoc(),view)
 assert.equal(d.boardPins.length,0)
 assert.ok(d.diagnostics.some(message=>/chưa.*tọa độ|chưa.*chân/i.test(message)))
 assert.equal(top.getBoardTopView('not-a-board'),undefined)
})
