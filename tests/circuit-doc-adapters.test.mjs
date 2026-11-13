import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [adapters, fixture, layoutModule, topology] = await Promise.all([
    server.ssrLoadModule('/src/lib/circuitDocAdapters.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/layout2D.ts'),
    server.ssrLoadModule('/src/lib/circuitNets.ts'),
  ])
  api = { ...adapters, getLessonCircuitDoc: fixture.getLessonCircuitDoc, layout2D: layoutModule.layout2D, createNetIndex: topology.createNetIndex }
})

after(async () => { await server?.close() })

const legacyWorkspace = () => ({
  schemaVersion: 4,
  lesson: 'blink',
  simBoard: 'esp32-devkit',
  code: 'const pin = 23',
  codeMode: 'cpp',
  projectId: 'project-1',
  projectName: 'Saved lesson',
  libraryEntryId: 'library-1',
  customExtension: { preserved: true },
  placed: [
    { id: 'board-1', type: 'board', x: 10, y: 20 },
    { id: 'bread-1', type: 'breadboard', x: 40, y: 50 },
    { id: 'res-1', type: 'resistor', x: 60, y: 40, value: '220 Ω' },
  ],
  wires: [{ id: 'w1', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'res-1', pinId: 'a' } }],
})

test('projects stable part/pin IDs and breadboard-hole nets to the existing topology shape', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const result = api.projectDocToTopology(doc, api.layout2D(doc))
  assert.deepEqual(result.parts.map(part => part.id), doc.parts.map(part => part.id))
  assert.equal(new Set(result.connections.map(wire => wire.id)).size, result.connections.length)
  assert.deepEqual(result.unresolved, [])
  assert.ok(result.connections.every(wire => wire.from.partId && wire.from.pinId && wire.to.partId && wire.to.pinId))
  const index = api.createNetIndex(result.connections)
  const same = (...keys) => keys.slice(1).forEach(key => assert.equal(index.netOf(keys[0]), index.netOf(key), `${key} should share ${keys[0]}`))
  const different = (left, right) => assert.notEqual(index.netOf(left), index.netOf(right), `${left} must differ from ${right}`)
  same('board-1:ledOut', 'res-1:a')
  same('res-1:b', 'led-1:anode')
  same('board-1:gnd', 'led-1:cathode', 'bb-1:railMinus')
  different('res-1:a', 'res-1:b')
})

test('two layout inputs change only display positions, not the connection partition or IDs', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const first = api.layout2D(doc)
  const shifted = {
    ...first,
    placements: first.placements.map(item => ({ ...item, x: item.x + 13, y: item.y + 7 })),
    bounds: { ...first.bounds },
  }
  const left = api.projectDocToTopology(doc, first)
  const right = api.projectDocToTopology(doc, shifted)
  const partition = result => result.connections.map(wire => [wire.from, wire.to].map(pin => `${pin.partId}:${pin.pinId}`).sort().join('|')).sort()
  assert.deepEqual(partition(left), partition(right))
  assert.deepEqual(left.connections.map(wire => wire.id), right.connections.map(wire => wire.id))
  assert.notDeepEqual(left.parts.map(part => [part.id, part.x, part.y]), right.parts.map(part => [part.id, part.x, part.y]))
})

test('hole-to-pin and hole-to-hole connectivity project only when the endpoint pins are unique', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const result = api.projectDocToTopology(doc, api.layout2D(doc))
  assert.equal(result.connections.length, 4)
  assert.deepEqual(result.unresolved, [])

  const ambiguous = {
    ...doc,
    wires: [{ id: 'single-hole-wire', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'hole', holeId: 'bb1:20a' } }],
  }
  const unresolved = api.projectDocToTopology(ambiguous, api.layout2D(ambiguous)).unresolved
  assert.ok(unresolved.some(issue => issue.code === 'HOLE_ENDPOINT_UNRESOLVED' && issue.affectedIds.includes('single-hole-wire')))
  const holeOnly = { ...doc, wires: [{ id: 'hole-to-hole', from: { kind: 'hole', holeId: 'bb1:20a' }, to: { kind: 'hole', holeId: 'bb1:20f' } }] }
  assert.ok(api.projectDocToTopology(holeOnly, api.layout2D(holeOnly)).unresolved.some(issue => issue.affectedIds.includes('hole-to-hole')))
})

test('legacy schema-4 migration preserves user identity, code, wires and extension fields', () => {
  const source = legacyWorkspace()
  const before = structuredClone(source)
  const result = api.legacyWorkspaceToDoc(source, 'blink')
  assert.equal(result.status, 'ok')
  if (result.status !== 'ok') return
  assert.equal(result.doc.schema, 2)
  assert.equal(result.doc.lessonId, 'blink')
  assert.deepEqual(source, before, 'migration must not mutate the persisted workspace')
  assert.deepEqual(result.doc.wires[0], { id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'pin', partId: 'res-1', pinId: 'a' } })
})

test('legacy writes preserve all source extensions and refuse explicit hole endpoints', () => {
  const source = legacyWorkspace()
  const pinDoc = {
    schema: 2,
    lessonId: 'blink',
    breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
    parts: [
      { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
      { id: 'bread-1', type: 'breadboard', mount: { kind: 'bench', lane: 'right', order: 0 } },
      { id: 'res-1', type: 'resistor', value: { ohm: 220 }, mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    ],
    wires: [{ id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'pin', partId: 'res-1', pinId: 'a' } }],
    expect: { partCount: 3, wireCount: 1, netCount: 1 },
  }
  const converted = api.docToLegacyWorkspace(pinDoc, source)
  assert.equal(converted.status, 'ok')
  if (converted.status === 'ok') {
    assert.equal(converted.workspace.code, source.code)
    assert.equal(converted.workspace.projectName, source.projectName)
    assert.deepEqual(converted.workspace.customExtension, source.customExtension)
    assert.deepEqual(converted.workspace.wires, [{ id: 'w1', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'res-1', pinId: 'a' } }])
  }
  assert.equal(api.docToLegacyWorkspace(api.getLessonCircuitDoc('blink'), source).status, 'unsupported')
})
