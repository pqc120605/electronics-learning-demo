import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, fs, docV2, sketch
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  fs = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  docV2 = await server.ssrLoadModule('/src/lib/circuitDocV2.ts')
  sketch = await server.ssrLoadModule('/src/lib/sketchInterpreter.ts')
})
after(async () => { await server?.close() })

const out = (level, pwm) => ({ mode: 'output', level, ...(pwm === undefined ? {} : { pwm }) })

test('fresh freestyle workspace has no default board, breadboard, circuit or code and round-trips', () => {
  const blank = fs.blankFreestyleWorkspace()
  assert.equal(blank.boardId, '')
  assert.deepEqual(blank.doc.parts, [])
  assert.deepEqual(blank.doc.breadboards, [])
  assert.deepEqual(blank.doc.wires, [])
  assert.equal(blank.code, '')
  assert.equal(blank.sampleId, undefined)
  assert.deepEqual(fs.parseFreestyleWorkspace(JSON.stringify(blank)), blank)
})

test('old explicit sample drafts keep exact endpoint IDs, code and custom mappings', () => {
  const draft = fs.defaultFreestyleWorkspace('arduino-nano')
  draft.code = '// my custom code\nvoid setup() {}\nvoid loop() {}'
  draft.pinMap.ledOut = 7
  assert.deepEqual(fs.parseFreestyleWorkspace(JSON.stringify(draft)), draft)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...draft, boardId: 'unavailable-board' })), null)
})

test('every sample circuit builds a structurally valid CircuitDocV2 on every board', () => {
  for (const board of fs.freestyleBoards) {
    for (const sample of fs.freestyleSamples) {
      const { doc, pinMap } = fs.buildSampleCircuit(sample.id, board.id)
      const errors = docV2.validateCircuitDoc(doc).filter(issue => issue.severity === 'error' && issue.code !== 'G3')
      assert.deepEqual(errors, [], `${board.id}/${sample.id}`)
      assert.ok(doc.wires.length >= 4)
      for (const pin of Object.values(pinMap)) assert.ok(fs.availablePins(board.id).includes(pin), `${board.id}: chân ${pin} không có trên board`)
      for (const language of board.languages) {
        const code = fs.sampleCode(sample.id, board.id, language, pinMap)
        if (language === 'cpp' && sample.mode === 'run') {
          assert.equal(sketch.compileSketch(code, fs.sketchBoardFor(board.id)).ok, true, `${board.id}/${sample.id} C++ mẫu phải chạy được bằng trình thông dịch`)
        } else if (language === 'cpp' && sample.id === 'dht-demo') {
          assert.match(code, /#include <DHT\.h>/)
          assert.equal(sketch.compileSketch(code, fs.sketchBoardFor(board.id)).ok, false, 'Trình thông dịch không chạy thư viện DHT của Arduino')
        } else if (language === 'micropython') assert.match(code, /from machine import/)
      }
    }
  }
})

test('blink: LED lights only while the mapped GPIO is HIGH and the active wires follow', () => {
  const { doc, pinMap } = fs.buildSampleCircuit('blink', 'arduino-uno-r3')
  const high = fs.evaluateFreestyleCircuit(doc, pinMap, { 13: out(true) }, {})
  const led = high.outputs.find(item => item.kind === 'led')
  assert.equal(led.on, true)
  assert.equal(led.missingResistor, false)
  assert.equal(high.litPartIds.size, 1)
  assert.ok(high.activeWireIds.size >= 2)
  const low = fs.evaluateFreestyleCircuit(doc, pinMap, { 13: out(false) }, {})
  assert.equal(low.outputs.find(item => item.kind === 'led').on, false)
  assert.equal(low.activeWireIds.size, 0)
  const pwm = fs.evaluateFreestyleCircuit(doc, pinMap, { 13: out(true, 0.25) }, {})
  assert.equal(pwm.outputs.find(item => item.kind === 'led').brightness, 0.25)
  const remapped = fs.evaluateFreestyleCircuit(doc, { ...pinMap, ledOut: 12 }, { 13: out(true) }, {})
  assert.equal(remapped.outputs.find(item => item.kind === 'led').on, false, 'đổi chân GPIO LED thì D13 không còn nối LED')
})

test('button and potentiometer drive the firmware inputs', () => {
  const button = fs.buildSampleCircuit('button-led', 'raspberry-pi-pico')
  const buttonId = button.doc.parts.find(part => part.type === 'button').id
  const pullup = { 14: { mode: 'input_pullup', level: true } }
  assert.deepEqual(fs.evaluateFreestyleCircuit(button.doc, button.pinMap, pullup, {}).inputs.find(item => item.pin === 14).digital, true)
  assert.deepEqual(fs.evaluateFreestyleCircuit(button.doc, button.pinMap, pullup, { [buttonId]: true }).inputs.find(item => item.pin === 14).digital, false)
  const pot = fs.buildSampleCircuit('pot-dimmer', 'arduino-uno-r3')
  const potId = pot.doc.parts.find(part => part.type === 'potentiometer').id
  const drive = fs.evaluateFreestyleCircuit(pot.doc, pot.pinMap, {}, { [potId]: 0.3 }).inputs.find(item => item.pin === 14)
  assert.equal(drive.analog, 0.3)
  assert.equal(drive.source, potId)
})

test('motor turns through the NPN transistor only when the base is driven HIGH', () => {
  const { doc, pinMap } = fs.buildSampleCircuit('motor', 'esp32-devkit')
  assert.equal(fs.evaluateFreestyleCircuit(doc, pinMap, { 23: out(true) }, {}).outputs.find(item => item.kind === 'motor').direction, 1)
  assert.equal(fs.evaluateFreestyleCircuit(doc, pinMap, { 23: out(false) }, {}).outputs.find(item => item.kind === 'motor').direction, 0)
})

test('an LED wired straight from GPIO to GND warns about the missing resistor', () => {
  let doc = fs.createEmptyFreestyleDoc()
  const placed = fs.placePart(doc, 'led')
  doc = placed.doc
  doc = fs.addFreestyleWire(doc, { kind: 'pin', partId: 'board', pinId: 'ledOut' }, { kind: 'pin', partId: placed.partId, pinId: 'anode' })
  doc = fs.addFreestyleWire(doc, { kind: 'pin', partId: placed.partId, pinId: 'cathode' }, { kind: 'pin', partId: 'board', pinId: 'gnd' })
  const result = fs.evaluateFreestyleCircuit(doc, fs.getFreestyleBoard('arduino-uno-r3').defaultPins, { 13: out(true) }, {})
  assert.equal(result.outputs[0].missingResistor, true)
  assert.match(result.warnings.join('\n'), /thiếu điện trở/)
})

test('placing, moving and removing parts keeps the document consistent', () => {
  let doc = fs.createEmptyFreestyleDoc()
  const first = fs.placePart(doc, 'resistor')
  assert.ok(first.partId)
  doc = first.doc
  const blocked = fs.placePart(doc, 'led', { col: first.doc.parts.at(-1).mount.col, row: first.doc.parts.at(-1).mount.row })
  assert.ok(blocked.error, 'không được cắm chồng lên chân linh kiện khác')
  const moved = fs.movePart(doc, first.partId, { col: 20, row: 7 })
  assert.equal(moved.error, undefined)
  doc = fs.addFreestyleWire(moved.doc, { kind: 'pin', partId: 'board', pinId: 'ledOut' }, { kind: 'pin', partId: first.partId, pinId: 'a' })
  const removed = fs.removePartAndWires(doc, first.partId)
  assert.equal(removed.parts.length, 1)
  assert.equal(removed.wires.length, 0)
  assert.equal(fs.removePartAndWires(removed, 'board').parts.length, 1, 'không xóa board')
  const bench = fs.placePart(removed, 'servo')
  assert.equal(bench.doc.parts.at(-1).mount.kind, 'bench')
})

test('workspace storage round-trips and rejects damaged data', () => {
  const workspace = fs.defaultFreestyleWorkspace('raspberry-pi-pico', 'blink')
  assert.equal(workspace.language, 'micropython')
  const parsed = fs.parseFreestyleWorkspace(JSON.stringify(workspace))
  assert.equal(parsed.boardId, 'raspberry-pi-pico')
  assert.equal(parsed.doc.parts.length, workspace.doc.parts.length)
  assert.equal(fs.parseFreestyleWorkspace('{bad json'), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, doc: { ...workspace.doc, parts: [{ id: 'x', type: 'nope' }] } })), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, version: 2 })), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, language: 'rust' })).language, 'micropython')
})

test('pin labels follow each board naming', () => {
  assert.equal(fs.pinDisplayName('arduino-uno-r3', 14), 'A0')
  assert.equal(fs.pinDisplayName('arduino-uno-r3', 13), 'D13')
  assert.equal(fs.pinDisplayName('raspberry-pi-pico', 15), 'GP15')
  assert.equal(fs.pinDisplayName('stm32-blue-pill-f103', 45), 'PC13')
  assert.equal(fs.pinCodeName('stm32-blue-pill-f103', 5), 'PA5')
  assert.equal(fs.pinDisplayName('esp32-devkit', 23), 'GPIO 23')
})
