import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
let server, models, cad, explorer, boards
before(async()=>{
 server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}})
 ;[{arduinoBoardModels:models},{arduinoBoardCadComponents:cad},explorer,{boards}]=await Promise.all([
 server.ssrLoadModule('/src/data/arduinoBoardModels.ts'),server.ssrLoadModule('/src/data/arduinoBoardCadComponents.ts'),server.ssrLoadModule('/src/components/board/BoardPinoutExplorer.tsx'),server.ssrLoadModule('/src/data/boards.ts')])
})
after(async()=>{await server?.close()})
test('catalog identity maps exact representations and rejects ceramic and unknown IDs',async()=>{
 assert.ok(existsSync('src/lib/catalogPracticeLinks.ts'),'shared catalog identity boundary must exist')
 const {getFreestylePartId:part,getFreestyleBoardId:board}=await server.ssrLoadModule('/src/lib/catalogPracticeLinks.ts')
 assert.equal(part('capacitor'),undefined)
 for(const [id,want] of [['electrolytic','capacitor'],['ntc','thermistor'],['hc-sr04','ultrasonic'],['ir-obstacle','ir-sensor'],['transistor-bjt','transistor'],['dc-supply','battery'],['buck','buck-converter'],['boost','boost-converter'],['motor-driver','tb6612'],['h-bridge-l298n','h-bridge'],['led','led']]) assert.equal(part(id),want,id)
 for(const [id,want] of [['arduino-nano-classic','arduino-nano'],['arduino-mega-2560-r3','arduino-mega-2560'],['stm32-nucleo','stm32-nucleo-f401re'],['arduino-uno-r3','arduino-uno-r3']]) assert.equal(board(id),want,id)
 assert.equal(part('not-a-part'),undefined);assert.equal(board('not-a-board'),undefined)
})
test('Arduino model enables coordinate picking with a documented CAD pad for every listed pin',()=>{
 for(const m of models){
 assert.equal(m.pinPicking,true)
 assert.ok(m.pins.every(pin=>pin.anchor&&pin.headerReference&&pin.padNumber))
 const html=renderToStaticMarkup(createElement(explorer.BoardPinoutExplorer,{pins:m.pins,selectedPinId:m.pins[0].id,onSelectPin:()=>{},coordinatePicking:m.pinPicking}))
 assert.match(html,/bấm vào đúng vị trí trên mô hình 3D/)
 assert.ok([...new Set(m.pins.map(pin=>pin.headerReference))].every(ref=>html.includes(`Chọn nhóm chân ${ref}`)))
 }
})
test('Mega functions expose exact PWM range, UART channels, ADC and documented source',()=>{
 const m=models.find(m=>m.id==='arduino-mega-2560-r3');const pin=n=>m.pins.find(p=>p.label.split('/')[0]===n)
 for(let n=0;n<=53;n++) assert.equal(pin(`D${n}`).functions.includes('PWM'),(n>=2&&n<=13)||(n>=44&&n<=46),`D${n}`)
 for(const [n,channel] of [[14,'TX3'],[15,'RX3'],[16,'TX2'],[17,'RX2'],[18,'TX1'],[19,'RX1']]) assert.ok(pin(`D${n}`).functions.some(f=>f.includes(channel)),`D${n} ${channel}`)
 for(let n=0;n<16;n++) assert.ok(pin(`A${n}`).functions.includes('ADC analog input'))
 assert.equal(m.pinoutEvidence?.sourceUrl,'https://docs.arduino.cc/resources/pinouts/A000067-full-pinout.pdf')
})
test('Arduino provenance matches actual GLB bytes and footprint-only references',()=>{
 const lock=JSON.parse(readFileSync('src/data/board-asset-lock.json','utf8'))
 for(const [id,d] of Object.entries(cad)){
 const path=`public/models/${id}.glb`;const hash=createHash('sha256').update(readFileSync(path)).digest('hex')
 assert.equal(d.sourceRefs.find(s=>s.path===path).sha256,hash,id)
 assert.equal(hash,lock[`/models/${id}.glb`].sha256)
 assert.deepEqual(d.unverifiedReferences,d.components.filter(c=>!c.has3dBody).map(c=>c.reference))
 assert.ok(d.auditNotes.includes(`${d.components.length} CAD footprints; ${d.components.filter(c=>c.has3dBody).length} have a matching named GLB mesh. Footprint-only references remain in the picker with no 3D body.`))
 }
})
test('STM32 profiles acknowledge available reconstruction while keeping physical limits',()=>{
 for(const id of ['stm32-nucleo','stm32-blue-pill-f103']){
 const b=boards.find(b=>b.id===id);assert.match(b.modelNote,/reconstruction/i);assert.doesNotMatch(b.modelNote,/chưa sẵn sàng|đã gỡ/);assert.match(b.modelNote,/vật lý|board thật/)
 }
})
test('catalog launch links preserve catalog part identity and board aliases in rendered pages',async()=>{
 const {MemoryRouter}=await import('react-router-dom')
 const {ComponentsPage}=await server.ssrLoadModule('/src/pages/ComponentsPage.tsx')
 const render=(Page,url)=>renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:[url]},createElement(Page)))
 assert.doesNotMatch(render(ComponentsPage,'/components?component=capacitor'),/class="component-freestyle-link"/)
 assert.match(render(ComponentsPage,'/components?component=electrolytic'),/class="component-freestyle-link" href="\/build\/freestyle\?part=capacitor"/)
 const {BoardCatalogPage}=await server.ssrLoadModule('/src/pages/BoardCatalogPage.tsx')
 for (const [catalogId, builderId] of [['arduino-mega-2560-r3', 'arduino-mega-2560'], ['arduino-nano-classic', 'arduino-nano'], ['stm32-nucleo', 'stm32-nucleo-f401re']]) {
   const boardPage = render(BoardCatalogPage, '/boards?board=' + catalogId)
   const actions = boardPage.slice(boardPage.indexOf('class="board-cad-viewer-actions"'), boardPage.indexOf('class="board-profile"'))
   assert.ok(actions.includes('class="board-freestyle-link" href="/build/freestyle?board=' + builderId + '"'), catalogId)
 }
})
test('Arduino body flags reflect mesh-bearing nodes in the current GLB, never invented physical verification',()=>{
 for(const [id,d] of Object.entries(cad)){
 const bytes=readFileSync(`public/models/${id}.glb`);const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString())
 const meshes=new Set(json.nodes.filter(n=>n.mesh!==undefined).map(n=>n.name))
 for(const c of d.components) assert.equal(c.has3dBody,meshes.has(c.reference),`${id}:${c.reference}`)
 assert.ok(d.auditNotes.some(note=>note.includes('does not establish a clone BOM')))
 }
})
