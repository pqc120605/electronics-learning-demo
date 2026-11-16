import assert from 'node:assert/strict'
import {before,after,test} from 'node:test'
import {createServer} from 'vite'
let server,selection,view,preflight,targets,lessons,docs
before(async()=>{
 server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}})
 ;[selection,view,preflight,targets,lessons,docs]=await Promise.all(['/src/lib/lessonBoardSelection.ts','/src/lib/lessonBoardPresentation.ts','/src/lib/lessonPreflight.ts','/src/data/simulationTargets.ts','/src/data/builderLessons.ts','/src/data/lessonCircuitDocs.ts'].map(path=>server.ssrLoadModule(path)))
})
after(async()=>server?.close())
test('missing and unknown board choices never silently select ESP32',()=>{
 for(const value of [null,'','   '])assert.equal(selection.resolveLessonBoardChoice(value).kind,'unselected')
 const unknown=selection.resolveLessonBoardChoice('some-unknown-clone')
 assert.equal(unknown.kind,'unknown');assert.equal(unknown.target,undefined)
 for(const id of ['esp32-devkit','arduino-uno-r3','raspberry-pi-pico'])assert.equal(selection.resolveLessonBoardChoice(id).target.boardId,id)
 assert.equal(selection.resolveLessonBoardChoice('uno').target.boardId,'arduino-uno-r3')
})
test('legacy saved target can be inspected without fallback or draft mutation',()=>{
 assert.equal(selection.savedLessonBoard('{"board":"uno","code":"custom"}'),'arduino-uno-r3')
 assert.equal(selection.savedLessonBoard('{"boardId":"raspberry-pi-pico"}'),'raspberry-pi-pico')
 assert.equal(selection.savedLessonBoard('{"simBoard":"arduino-uno-r3","lesson":"blink","placed":[]}'),'arduino-uno-r3')
 for(const [alias,id]of [['arduino-nano','arduino-nano-classic'],['arduino-mega-2560','arduino-mega-2560-r3'],['stm32-nucleo-f401re','stm32-nucleo']])assert.equal(selection.resolveLessonBoardChoice(alias).target.boardId,id)
 for(const raw of ['bad json','{"board":"unverified-clone"}','{}',null])assert.equal(selection.savedLessonBoard(raw),undefined)
})
test('target-selected lessons share actual board labels, source top views and source anchors',()=>{
 for(const [id,pin,label]of [['esp32-devkit',23,'GPIO 23'],['arduino-uno-r3',13,'D13'],['arduino-nano-classic',13,'D13'],['raspberry-pi-pico',15,'GP15']]){
  const target=selection.resolveLessonBoardChoice(id).target,render=view.lessonBoardPresentation(target,'blink')
  assert.equal(render.id,id);assert.equal(render.name,target.name);assert.equal(render.pinLabels.ledOut,label)
  assert.ok(render.topView);assert.ok(render.pinAnchors.ledOut)
  assert.match(preflight.getLessonPreflight('blink',id).startRoute,new RegExp(`board=${id}`))
  assert.match(lessons.getBuilderLesson('blink').code(target),new RegExp(`ledPin = ${pin}`))
 }
 const canonical=docs.getLessonCircuitDoc('blink'),before=JSON.stringify(canonical)
 view.lessonBoardPresentation(selection.resolveLessonBoardChoice('arduino-uno-r3').target,'button-led')
 assert.equal(JSON.stringify(canonical),before)
})
test('unsupported ADC and seven-segment combinations stay gated instead of borrowing ESP32 data',()=>{
 const pico=selection.resolveLessonBoardChoice('raspberry-pi-pico').target
 for(const lesson of ['analog-potentiometer','seven-segment-counter'])assert.equal(preflight.getLessonPreflight(lesson,pico.boardId).support.supported,false)
 assert.equal(pico.adcFullScale,undefined)
})
