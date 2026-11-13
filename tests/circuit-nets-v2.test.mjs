import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let createNetIndexV2
let createNetIndex
let componentRegistry

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [v2, v1, registryModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/circuitNetsV2.ts'),
    server.ssrLoadModule('/src/lib/circuitNets.ts'),
    server.ssrLoadModule('/src/data/componentRegistry.ts'),
  ])
  createNetIndexV2 = v2.createNetIndexV2
  createNetIndex = v1.createNetIndex
  componentRegistry = registryModule.componentRegistry
})

after(async () => { await server?.close() })

const blinkDoc = () => ({
  schema: 2,
  lessonId: 'blink',
  breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
  parts: [
    { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'bb-1', type: 'breadboard', mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'res-1', type: 'resistor', mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    // Equivalent physical placement for the current manifest leg order (cathode is the anchor leg).
    { id: 'led-1', type: 'led', mount: { kind: 'breadboard', board: 'bb1', col: 15, row: 3, rotation: 180 } },
  ],
  wires: [
    { id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'hole', holeId: 'bb1:10a' } },
    { id: 'w2', from: { kind: 'hole', holeId: 'bb1:15a' }, to: { kind: 'hole', holeId: 'bb1:T-:1' } },
    { id: 'w3', from: { kind: 'hole', holeId: 'bb1:T-:2' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' } },
  ],
  expect: { partCount: 4, wireCount: 3, netCount: 3 },
})

test('blink v2 unions wires, breadboard strips, component legs and ground into exactly three connected pin nets', () => {
  const index = createNetIndexV2(blinkDoc())
  const same = (...keys) => keys.slice(1).forEach(key => assert.equal(index.netOf(key), index.netOf(keys[0]), `${key} should share ${keys[0]}`))
  const distinct = (left, right) => assert.notEqual(index.netOf(left), index.netOf(right), `${left} must differ from ${right}`)

  same('board-1:ledOut', 'res-1:a', ...'abcde'.split('').map(row => `bb1:10${row}`))
  same('res-1:b', 'led-1:anode', ...'abcde'.split('').map(row => `bb1:14${row}`))
  same('led-1:cathode', 'board-1:gnd', ...'abcde'.split('').map(row => `bb1:15${row}`), ...Array.from({ length: 25 }, (_, index) => `bb1:T-:${index + 1}`))

  distinct('res-1:a', 'res-1:b')
  distinct('bb1:10c', 'bb1:10f')
  distinct('bb1:10c', 'bb1:11c')

  const connectedPinNets = index.netsList().filter(net => net.endpoints.size >= 2)
  assert.equal(connectedPinNets.length, 3)
  for (const key of ['res-1:a', 'res-1:b', 'led-1:anode', 'led-1:cathode']) {
    assert.ok(connectedPinNets.includes(index.netOf(key)), `${key} belongs to a connected pin net`)
  }
})

test('pin-to-pin-only v2 documents preserve the v1 endpoint partition', () => {
  const samples = [
    [
      { id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'pin', partId: 'res-1', pinId: 'a' } },
      { id: 'w2', from: { kind: 'pin', partId: 'res-1', pinId: 'b' }, to: { kind: 'pin', partId: 'led-1', pinId: 'anode' } },
      { id: 'w3', from: { kind: 'pin', partId: 'led-1', pinId: 'cathode' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' } },
    ],
    [
      { id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'pin', partId: 'led-1', pinId: 'anode' } },
      { id: 'w2', from: { kind: 'pin', partId: 'board-1', pinId: 'gnd' }, to: { kind: 'pin', partId: 'led-1', pinId: 'cathode' } },
    ],
  ]

  for (const wires of samples) {
    const doc = { ...blinkDoc(), breadboards: [], wires }
    const oldIndex = createNetIndex(wires.map(wire => ({
      id: wire.id,
      from: { partId: wire.from.partId, pinId: wire.from.pinId },
      to: { partId: wire.to.partId, pinId: wire.to.pinId },
    })))
    const newIndex = createNetIndexV2(doc)
    const keys = [...new Set(wires.flatMap(wire => [`${wire.from.partId}:${wire.from.pinId}`, `${wire.to.partId}:${wire.to.pinId}`]))]
    for (const left of keys) for (const right of keys) {
      assert.equal(newIndex.netOf(left) === newIndex.netOf(right), oldIndex.sameNet(left, right), `${left} / ${right}`)
    }
  }
})

test('intrinsic ground aliases on the same controller board share a net', () => {
  const registry = componentRegistry.map(definition => definition.id === 'board'
    ? { ...definition, pins: [...definition.pins, { id: 'gnd2', label: 'GND 2', electricalType: 'ground' }] }
    : definition)
  const doc = { ...blinkDoc(), wires: [] }
  const index = createNetIndexV2(doc, registry)
  assert.equal(index.netOf('board-1:gnd'), index.netOf('board-1:gnd2'))
})
