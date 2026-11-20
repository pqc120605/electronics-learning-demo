import assert from 'node:assert/strict'
import {after, before, test} from 'node:test'
import {createServer} from 'vite'

let vite, circuits, validator, sketch, share, library
before(async () => {
  vite=await createServer({logLevel:'silent',server:{middlewareMode:true,hmr:false}})
  ;[circuits,validator,sketch,share,library]=await Promise.all([
    'lib/freestyle/freestyleCircuit','lib/circuitDocV2','lib/sketchInterpreter','lib/freestyle/freestyleShare','lib/freestyle/freestyleSampleLibrary',
  ].map(id=>vite.ssrLoadModule(`/src/${id}.ts`)))
})
after(async()=>{await vite?.close()})

test('twelve sample recipes preserve stable connectivity and match board runtime limits', () => {
  assert.equal(library.freestyleSamples.length,12)
  for (const item of library.freestyleSamples) for (const board of circuits.freestyleBoards) {
    const workspace=circuits.defaultFreestyleWorkspace(board.id,item.id)
    assert.ok(item.summary&&item.challenge&&workspace.code&&workspace.doc.wires.length>1,item.id)
    assert.deepEqual(validator.validateCircuitDoc(workspace.doc).filter(issue=>issue.severity==='error'),[],`${item.id} · ${board.id}`)
    assert.equal(circuits.parseFreestyleWorkspace(JSON.stringify(workspace)).sampleId,item.id)
    if(item.mode==='run'&&workspace.language==='cpp') {
      const result=sketch.compileSketch(workspace.code,circuits.sketchBoardFor(board.id))
      assert.equal(result.ok,true,`${item.id} @ ${board.id}: ${result.error?.message??''}`)
    }
  }
})

test('all sample categories are shareable and ultrasonic divider tracks the board', async () => {
  for(const sample of library.freestyleSamples) {
    const workspace=circuits.defaultFreestyleWorkspace('arduino-uno-r3',sample.id)
    const roundTrip=await share.readFreestyleShare(await share.encodeFreestyleShare(workspace))
    assert.equal(roundTrip.sampleId,sample.id)
    assert.deepEqual(roundTrip.doc.wires,workspace.doc.wires)
  }
  const uno=circuits.defaultFreestyleWorkspace('arduino-uno-r3','ultrasonic')
  assert.equal(uno.doc.parts.filter(part=>part.type==='resistor').length,0)
  const esp32=circuits.workspaceWithFreestyleBoard(uno,'esp32-devkit')
  assert.deepEqual(esp32.doc.parts.filter(part=>part.type==='resistor').map(part=>part.value.ohm),[2200,3300])
})
