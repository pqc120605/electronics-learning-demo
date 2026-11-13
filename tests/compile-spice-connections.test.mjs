import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let compileSpiceConnections
let createNetIndexV2
let createNetIndex
let compileWorkspaceSpice

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ compileSpiceConnections } = await server.ssrLoadModule('/src/lib/compileSpiceConnections.ts'))
  ;({ createNetIndexV2 } = await server.ssrLoadModule('/src/lib/circuitNetsV2.ts'))
  ;({ createNetIndex } = await server.ssrLoadModule('/src/lib/circuitNets.ts'))
  ;({ compileWorkspaceSpice } = await server.ssrLoadModule('/src/lib/workspaceSpice.ts'))
})

after(async () => { await server?.close() })

const wire = (id, fromPart, fromPin, toPart, toPin) => ({ id, from: { kind: 'pin', partId: fromPart, pinId: fromPin }, to: { kind: 'pin', partId: toPart, pinId: toPin } })
const benchDoc = lessonId => ({
  schema: 2,
  lessonId,
  breadboards: [],
  parts: [
    { id: 'src', type: 'battery', value: { label: '5 V' }, mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'res', type: 'resistor', value: { label: '1 kΩ' }, mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'led', type: 'led', mount: { kind: 'bench', lane: 'right', order: 1 } },
  ],
  wires: [wire('a', 'src', 'positive', 'res', 'a'), wire('b', 'res', 'b', 'led', 'anode'), wire('c', 'led', 'cathode', 'src', 'negative')],
  expect: { partCount: 3, wireCount: 3, netCount: 3 },
})

const analogPotentiometerDoc = () => ({
  schema: 2,
  lessonId: 'analog-potentiometer',
  breadboards: [],
  parts: [
    { id: 'src', type: 'battery', value: { label: '3.3 V' }, mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'pot-1', type: 'potentiometer', mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'res-1', type: 'resistor', value: { label: '220 Ω' }, mount: { kind: 'bench', lane: 'right', order: 1 } },
  ],
  wires: [
    wire('a', 'src', 'positive', 'pot-1', 'vcc'),
    wire('b', 'pot-1', 'wiper', 'res-1', 'a'),
    wire('c', 'res-1', 'b', 'src', 'negative'),
    wire('d', 'pot-1', 'gnd', 'src', 'negative'),
  ],
  expect: { partCount: 3, wireCount: 4, netCount: 3 },
})

const blinkDoc = () => ({
  schema: 2,
  lessonId: 'blink',
  breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
  parts: [
    { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'bb-1', type: 'breadboard', mount: { kind: 'bench', lane: 'bottom', order: 0 } },
    { id: 'res-1', type: 'resistor', mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    { id: 'led-1', type: 'led', mount: { kind: 'breadboard', board: 'bb1', col: 15, row: 3, rotation: 180 } },
  ],
  wires: [
    { id: 'gpio', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'hole', holeId: 'bb1:10a' } },
    { id: 'return', from: { kind: 'hole', holeId: 'bb1:15a' }, to: { kind: 'hole', holeId: 'bb1:T-:1' } },
    { id: 'ground', from: { kind: 'hole', holeId: 'bb1:T-:2' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' } },
  ],
  expect: { partCount: 4, wireCount: 3, netCount: 0 },
})

function samePartition(keys, left, right) {
  const sameNet = (index, a, b) => index.sameNet ? index.sameNet(a, b) : index.netOf(a) === index.netOf(b)
  for (const a of keys) for (const b of keys) assert.equal(sameNet(left, a, b), sameNet(right, a, b), `${a} ~ ${b}`)
}

test('compiles the breadboard blink net into the expected pin-to-pin partition', () => {
  const doc = blinkDoc()
  const connections = compileSpiceConnections(doc)
  const v2 = createNetIndexV2(doc)
  const v1 = createNetIndex(connections)
  samePartition(['board-1:ledOut', 'res-1:a', 'res-1:b', 'led-1:anode', 'led-1:cathode', 'board-1:gnd'], v2, v1)
  assert.equal(v2.netOf('board-1:ledOut'), v2.netOf('res-1:a'))
  assert.equal(v2.netOf('res-1:b'), v2.netOf('led-1:anode'))
  assert.equal(v2.netOf('led-1:cathode'), v2.netOf('board-1:gnd'))
})

test('pin-only v2 documents retain the legacy net partition and deterministic output', () => {
  for (const doc of [benchDoc('blink'), analogPotentiometerDoc()]) {
    const first = compileSpiceConnections(doc)
    const second = compileSpiceConnections(doc)
    assert.deepEqual(first, second)
    const v2 = createNetIndexV2(doc)
    const v1 = createNetIndex(first)
    const keys = doc.lessonId === 'analog-potentiometer'
      ? ['src:positive', 'src:negative', 'pot-1:vcc', 'pot-1:wiper', 'pot-1:gnd', 'res-1:a', 'res-1:b']
      : ['src:positive', 'src:negative', 'res:a', 'res:b', 'led:anode', 'led:cathode']
    samePartition(keys, v2, v1)
  }
})

test('generated pin connections can be passed to the existing SPICE workspace compiler', () => {
  const doc = benchDoc('spice-adapter-fixture')
  const parts = doc.parts.map(part => ({ id: part.id, type: part.type, value: part.value?.label }))
  const result = compileWorkspaceSpice({ boardLogicLevel: '5 V', parts, connections: compileSpiceConnections(doc) })
  assert.equal(result.ok, true, result.ok ? '' : result.issues.join(' '))
  assert.match(result.netlist, /R1/)
  assert.match(result.netlist, /D1/)
})

test('the current SPICE API cannot model a potentiometer lesson yet', () => {
  const doc = analogPotentiometerDoc()
  const parts = doc.parts.map(part => ({ id: part.id, type: part.type, value: part.value?.label }))
  const result = compileWorkspaceSpice({ boardLogicLevel: '3.3 V', parts, connections: compileSpiceConnections(doc) })
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /chưa có model điện SPICE/i)
})

test('one-pin nets do not produce synthetic self-connections', () => {
  const doc = benchDoc('blink')
  doc.wires = []
  const result = compileSpiceConnections(doc)
  assert.ok(result.every(connection => connection.from.partId !== connection.to.partId || connection.from.pinId !== connection.to.pinId))
})
