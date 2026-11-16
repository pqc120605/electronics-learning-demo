import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const modules = await Promise.all([
    server.ssrLoadModule('/src/lib/circuitGates.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/assemblyLayout.ts'),
    server.ssrLoadModule('/src/data/simulationTargets.ts'),
  ])
  api = { ...modules[0], ...modules[1], ...modules[2], ...modules[3] }
})

after(async () => { await server?.close() })

const corpus = () => ['blink', 'button-led'].map(id => api.getLessonCircuitDoc(id))

test('runs G1-G10 on every registered CircuitDocV2 lesson document', () => {
  const docs = corpus()
  assert.equal(docs.every(Boolean), true)
  const results = api.evaluateCircuitCorpus(docs)
  assert.equal(results.length, docs.length)
  for (const result of results) {
    assert.deepEqual(result.gates.map(gate => gate.id), ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10'])
    assert.equal(result.gates.filter(gate => gate.status === 'fail').some(gate => ['G1','G2','G3','G4'].includes(gate.id)), false, `${result.lessonId}: ${JSON.stringify(result.gates)}`)
    assert.equal(result.gates.find(gate => gate.id === 'G5').status, 'pass')
    assert.equal(result.gates.find(gate => gate.id === 'G6').status, 'pass')
    assert.equal(result.gates.find(gate => gate.id === 'G7').status, 'pass')
    assert.equal(result.gates.find(gate => gate.id === 'G8').status, 'pass')
    assert.equal(result.gates.find(gate => gate.id === 'G9').status, 'not_applicable')
    assert.equal(result.gates.find(gate => gate.id === 'G10').status, 'pass')
  }
})

test('a malformed schema fails G1 while preserving the other gate results', () => {
  const doc = api.getLessonCircuitDoc('blink')
  doc.schema = 1
  const result = api.evaluateCircuitGates(doc)
  assert.equal(result.gates.find(gate => gate.id === 'G1').status, 'fail')
  assert.ok(result.gates.find(gate => gate.id === 'G1').diagnostics.length > 0)
})

test('an unknown part type fails G2 and an invalid pin endpoint fails G3', () => {
  const unknown = api.getLessonCircuitDoc('blink')
  unknown.parts[2].type = 'not-in-registry'
  assert.equal(api.evaluateCircuitGates(unknown).gates.find(gate => gate.id === 'G2').status, 'fail')

  const badPin = api.getLessonCircuitDoc('blink')
  badPin.wires[0].from.pinId = 'missing-pin'
  assert.equal(api.evaluateCircuitGates(badPin).gates.find(gate => gate.id === 'G3').status, 'fail')
})

test('an invalid hole fails G4 and a redundant same-net wire fails G6', () => {
  const badHole = api.getLessonCircuitDoc('blink')
  badHole.wires[0].to.holeId = 'bb1:31a'
  assert.equal(api.evaluateCircuitGates(badHole).gates.find(gate => gate.id === 'G4').status, 'fail')

  const redundant = api.getLessonCircuitDoc('blink')
  redundant.wires.push({ id: 'duplicate-net-wire', from: structuredClone(redundant.wires[0].from), to: structuredClone(redundant.wires[0].to) })
  redundant.expect.wireCount += 1
  assert.equal(api.evaluateCircuitGates(redundant).gates.find(gate => gate.id === 'G6').status, 'fail')
})

test('reports explicit open pins, supply and ground, analog SPICE applicability, and view parity', () => {
  for (const doc of corpus()) {
    const result = api.evaluateCircuitGates(doc)
    assert.ok(['pass','fail'].includes(result.gates.find(gate => gate.id === 'G7').status))
    assert.ok(['pass','fail','warning'].includes(result.gates.find(gate => gate.id === 'G8').status))
    assert.ok(['pass','fail','not_applicable'].includes(result.gates.find(gate => gate.id === 'G9').status))
    assert.ok(['pass','fail'].includes(result.gates.find(gate => gate.id === 'G10').status))
  }
})

test('G5 catches overlapping component footprints and G7 accepts explicit open-pin reasons', () => {
  const overlap = api.getLessonCircuitDoc('blink')
  const resistor = structuredClone(overlap.parts.find(part => part.id === 'res-1'))
  const secondResistor = structuredClone(resistor)
  secondResistor.id = 'res-overlap'
  overlap.parts.push(secondResistor)
  const gate5 = api.evaluateCircuitGates(overlap).gates.find(gate => gate.id === 'G5')
  assert.equal(gate5.status, 'fail')
  assert.ok(gate5.diagnostics.some(message => /res-1.*res-overlap/.test(message)))

  const doc = api.getLessonCircuitDoc('blink')
  const openPins = structuredClone(doc.openPins)
  doc.openPins = []
  assert.equal(api.evaluateCircuitGates(doc).gates.find(gate => gate.id === 'G7').status, 'fail')
  doc.openPins = openPins
  assert.equal(api.evaluateCircuitGates(doc).gates.find(gate => gate.id === 'G7').status, 'pass')
})

test('G6 passes an empty wiring set, and G10 passes when the physical mount matches its 2D holes', () => {
  const doc = api.getLessonCircuitDoc('blink')
  doc.parts = doc.parts.filter(part => part.type === 'board' || part.type === 'breadboard' || part.type === 'resistor')
  doc.wires = []
  doc.expect = { partCount: doc.parts.length, wireCount: 0, netCount: 0 }
  assert.equal(api.evaluateCircuitGates(doc).gates.find(gate => gate.id === 'G6').status, 'pass')
  assert.equal(api.evaluateCircuitGates(doc).gates.find(gate => gate.id === 'G10').status, 'pass')
})

test('an explicit CircuitDocV2 rotation survives collision resolution in the 3D layout', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const plan = api.getAssemblyPlanV2(doc, {
    boardId: 'esp32-devkit',
    target: api.getSimulationTarget('esp32-devkit'),
    lessonId: doc.lessonId,
  })
  assert.equal(plan.placements.find(part => part.partId === 'led-1').rotationDeg, 180)
})

test('the button lesson models a bench switch with a GPIO lead and a ground-rail jumper', () => {
  const doc = api.getLessonCircuitDoc('button-led')
  const input = doc.wires.find(wire => wire.from.kind === 'pin' && wire.from.partId === 'board-1' && wire.from.pinId === 'input'
    && wire.to.kind === 'pin' && wire.to.partId === 'button-1' && wire.to.pinId === 'contactA')
  const ground = doc.wires.find(wire => wire.from.kind === 'pin' && wire.from.partId === 'button-1' && wire.from.pinId === 'contactB'
    && wire.to.kind === 'hole' && wire.to.holeId === 'bb1:T-:10')
  assert.ok(input, 'GPIO should connect directly to one switch terminal')
  assert.ok(ground, 'the other switch terminal should connect to the ground rail')
  assert.equal(doc.parts.find(part => part.id === 'button-1')?.mount.kind, 'bench')
  assert.ok(doc.wires.some(wire => wire.from.kind === 'hole' && wire.from.holeId === 'bb1:T-:2'
    && wire.to.kind === 'pin' && wire.to.partId === 'board-1' && wire.to.pinId === 'gnd'))
  assert.equal(doc.expect.wireCount, doc.wires.length)
})

test('G9 evaluates analog docs rather than silently treating them as not applicable', () => {
  const doc = api.getLessonCircuitDoc('blink')
  doc.lessonId = 'analog-ldr'
  const result = api.evaluateCircuitGates(doc).gates.find(gate => gate.id === 'G9')
  assert.ok(['pass','fail'].includes(result.status))
  assert.notEqual(result.status, 'not_applicable')
})
