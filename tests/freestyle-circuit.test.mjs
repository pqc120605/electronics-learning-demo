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

test('ESP32 pin picker distinguishes output, input and system pins without changing saved drafts', () => {
  const output = fs.availablePins('esp32-devkit', 'ledOut')
  const input = fs.availablePins('esp32-devkit', 'input')
  assert.ok(output.includes(23))
  assert.ok(input.includes(34))
  for (const pin of [0, 1, 3, 34, 35, 36, 39]) assert.ok(!output.includes(pin), String(pin))
  const draft = fs.defaultFreestyleWorkspace('esp32-devkit')
  draft.pinMap.ledOut = 34
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify(draft)).pinMap.ledOut, 34)
})

test('ESP32 R1 digital presets use bidirectional GPIO19 while analog presets and old drafts preserve GPIO34', () => {
  for (const sample of ['button-led', 'keypad-five', 'dht-demo']) {
    const {pinMap} = fs.buildSampleCircuit(sample, 'esp32-devkit')
    assert.equal(pinMap.input, 19, sample)
  }
  for (const sample of ['pot-dimmer', 'night-light']) assert.equal(fs.buildSampleCircuit(sample, 'esp32-devkit').pinMap.input, 34)
  const draft = fs.defaultFreestyleWorkspace('esp32-devkit', 'button-led')
  draft.pinMap.input = 34
  draft.code = fs.sampleCode('button-led', draft.boardId, draft.language, draft.pinMap)
  assert.deepEqual(fs.parseFreestyleWorkspace(JSON.stringify(draft)),draft)
})

test('automatic placement can use remaining columns and leaves each existing leg in place', () => {
  const doc = fs.createEmptyFreestyleDoc()
  for (let col = 3; col <= 29; col += 1) for (const row of [0, 5]) {
    doc.parts.push({ id: `j${row}-${col}`, type: 'led', mount: {kind:'breadboard', board:'bb1', col, row, rotation:0} })
  }
  const placed = fs.placePart(doc, 'led')
  assert.ok(placed.partId, placed.error)
  assert.deepEqual(placed.doc.parts.slice(0,-1), doc.parts)
})

test('a crowded breadboard accepts the full parts library without silently seating incompatible shapes', () => {
  let doc = fs.createEmptyFreestyleDoc()
  for (const entry of fs.placeableParts) {
    const placed = fs.placePart(doc, entry.id)
    assert.ok(placed.partId, `${entry.id}: ${placed.error}`)
    doc = placed.doc
  }
  assert.equal(doc.parts.find(part => part.type === 'tb6612').mount.kind, 'bench')
  const errors = docV2.validateCircuitDoc(doc).filter(issue => ['G2','G4'].includes(issue.code) && issue.severity === 'error')
  assert.deepEqual(errors, [])
})

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
        } else if (language === 'micropython') assert.match(code, /from machine import/)
      }
    }
  }
})

test('DHT22, HC-SR04 and servo use input and output from their actual circuit connections', () => {
  const board = 'esp32-devkit'
  const load = id => {
    const workspace = fs.defaultFreestyleWorkspace(board, id)
    const result = sketch.compileSketch(workspace.code, fs.sketchBoardFor(board))
    assert.equal(result.ok, true)
    const evaluate = (pins, controls = {}, doc = workspace.doc) => fs.evaluateFreestyleCircuit(doc, workspace.pinMap, pins, controls, board)
    return { workspace, run: result.run, evaluate }
  }
  const dht = load('dht-demo')
  const dhtPart = dht.workspace.doc.parts.find(part => part.type === 'dht22-bare')
  dht.run.setPeripherals(dht.evaluate(undefined, { [dhtPart.id + ':temperature']: -5, [dhtPart.id + ':humidity']: 73 }).peripherals)
  assert.match(dht.run.advance(20).serial, /-5\.00 C, 73\.00 %RH/)
  dht.run.setPeripherals(dht.evaluate(undefined, {}, { ...dht.workspace.doc, wires: [] }).peripherals)
  assert.match(dht.run.advance(2550).serial, /nan/i)

  const sonar = load('ultrasonic')
  const sonarPart = sonar.workspace.doc.parts.find(part => part.type === 'ultrasonic')
  sonar.run.setPeripherals(sonar.evaluate(undefined, { [sonarPart.id + ':distance']: 42 }).peripherals)
  assert.match(sonar.run.advance(100).serial, /42\.00/)
  assert.deepEqual(sonar.evaluate(undefined, {}, { ...sonar.workspace.doc, wires: [] }).peripherals, [])

  const servo = load('servo-pulse')
  const frame = servo.run.advance(70)
  assert.equal(servo.evaluate(frame.pins).outputs.find(part => part.kind === 'servo').angle, 90)
  assert.equal(servo.evaluate(frame.pins, {}, { ...servo.workspace.doc, wires: [] }).outputs.find(part => part.kind === 'servo').angle, undefined)
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
  assert.equal(workspace.language, 'cpp')
  const parsed = fs.parseFreestyleWorkspace(JSON.stringify(workspace))
  assert.equal(parsed.boardId, 'raspberry-pi-pico')
  assert.equal(parsed.doc.parts.length, workspace.doc.parts.length)
  assert.equal(fs.parseFreestyleWorkspace('{bad json'), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, doc: { ...workspace.doc, parts: [{ id: 'x', type: 'nope' }] } })), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, version: 2 })), null)
  assert.equal(fs.parseFreestyleWorkspace(JSON.stringify({ ...workspace, language: 'rust' })).language, 'cpp')
})

test('pin labels follow each board naming', () => {
  assert.equal(fs.pinDisplayName('arduino-uno-r3', 14), 'A0')
  assert.equal(fs.pinDisplayName('arduino-uno-r3', 13), 'D13')
  assert.equal(fs.pinDisplayName('raspberry-pi-pico', 15), 'GP15')
  assert.equal(fs.pinDisplayName('stm32-blue-pill-f103', 45), 'PC13')
  assert.equal(fs.pinCodeName('stm32-blue-pill-f103', 5), 'PA5')
  assert.equal(fs.pinDisplayName('esp32-devkit', 23), 'GPIO 23')
})


test('Pico samples run as Arduino C++ on the static web and existing Python drafts retain their code', () => {
  const sample = fs.defaultFreestyleWorkspace('raspberry-pi-pico', 'blink')
  assert.equal(sample.language, 'cpp')
  assert.match(sample.code, /void setup/)
  const savedPython = { ...sample, language: 'micropython', code: 'print("giữ bản nháp")' }
  assert.deepEqual(fs.parseFreestyleWorkspace(JSON.stringify(savedPython)), savedPython)
})
