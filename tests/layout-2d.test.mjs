import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let layout2D
let migrateWorkspaceV1ToV2
let circuitForLesson

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ layout2D } = await server.ssrLoadModule('/src/lib/layout2D.ts'))
  ;({ migrateWorkspaceV1ToV2 } = await server.ssrLoadModule('/src/lib/migrateV1toV2.ts'))
  ;({ circuitForLesson } = await server.ssrLoadModule('/src/data/lessonCircuits.ts'))
})

after(async () => { await server?.close() })

const doc = () => ({
  schema: 2,
  lessonId: 'blink',
  breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
  parts: [
    { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'bb-1', type: 'breadboard', mount: { kind: 'bench', lane: 'bottom', order: 0 } },
    { id: 'res-1', type: 'resistor', mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    { id: 'led-1', type: 'led', mount: { kind: 'breadboard', board: 'bb1', col: 15, row: 3, rotation: 180 } },
    { id: 'battery-1', type: 'battery', mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'motor-1', type: 'dc-motor', mount: { kind: 'bench', lane: 'bottom', order: 1 } },
  ],
  wires: [],
  expect: { partCount: 6, wireCount: 0, netCount: 0 },
})

test('layout is deterministic and returns every part in a stable lane', () => {
  const circuit = doc()
  const first = layout2D(circuit)
  assert.deepEqual(layout2D(circuit), first)
  assert.equal(first.placements.length, circuit.parts.length)
  assert.deepEqual(first.unplaced, [])
  assert.equal(first.placements.find(part => part.partId === 'res-1').lane, 'mounted')
  assert.equal(first.placements.find(part => part.partId === 'battery-1').lane, 'right')
})

test('breadboard part locations follow physical hole coordinates and preserve rotation', () => {
  const result = layout2D(doc())
  const resistor = result.placements.find(part => part.partId === 'res-1')
  const led = result.placements.find(part => part.partId === 'led-1')
  assert.ok(resistor.x < led.x)
  assert.equal(led.rotation, 180)
})

test('bench footprints have at least 0.5 mm clearance within each lane', () => {
  const result = layout2D(doc()).placements.filter(part => part.lane !== 'breadboard' && part.lane !== 'mounted')
  for (let i = 0; i < result.length; i += 1) for (const other of result.slice(i + 1)) {
    const horizontal = Math.max(result[i].bounds.minX, other.bounds.minX) <= Math.min(result[i].bounds.maxX, other.bounds.maxX)
    const vertical = Math.max(result[i].bounds.minY, other.bounds.minY) <= Math.min(result[i].bounds.maxY, other.bounds.maxY)
    assert.ok(!(horizontal && vertical), `${result[i].partId} overlaps ${other.partId}`)
    const xGap = Math.max(result[i].bounds.minX - other.bounds.maxX, other.bounds.minX - result[i].bounds.maxX, 0)
    const yGap = Math.max(result[i].bounds.minY - other.bounds.maxY, other.bounds.minY - result[i].bounds.maxY, 0)
    assert.ok(xGap >= 0.5 || yGap >= 0.5, `${result[i].partId}/${other.partId} has <0.5 mm clearance`)
  }
})

test('invalid breadboard geometry is surfaced as unplaced instead of guessed', () => {
  const circuit = doc()
  circuit.parts.find(part => part.id === 'res-1').mount.col = 31
  assert.deepEqual(layout2D(circuit).unplaced, ['res-1'])
})

test('legacy builder circuit samples receive deterministic layouts without overlapping part bodies', () => {
  const lessons = ['blink', 'source-led', 'button-led', 'ir-alert', 'ultrasonic-distance', 'seven-segment-counter', 'buck-boost-concept', 'dc-motor-driver', 'mosfet-switch', 'analog-potentiometer', 'analog-ldr']
  const blockedByLegacyGeometry = []
  for (const lesson of lessons) {
    const legacy = circuitForLesson(lesson)
    const migrated = migrateWorkspaceV1ToV2({ schemaVersion: 4, lesson, placed: legacy.placed, wires: legacy.wires })
    if (migrated.status !== 'migrated') {
      blockedByLegacyGeometry.push(lesson)
      assert.match(migrated.reason, /vị trí breadboard hợp lệ/)
      continue
    }
    const result = layout2D(migrated.doc)
    assert.deepEqual(result.unplaced, [], lesson)
    const parts = result.placements.filter(part => part.type !== 'breadboard')
    for (let index = 0; index < parts.length; index += 1) for (const other of parts.slice(index + 1)) {
      const xOverlap = parts[index].bounds.minX < other.bounds.maxX + 0.5 && parts[index].bounds.maxX + 0.5 > other.bounds.minX
      const yOverlap = parts[index].bounds.minY < other.bounds.maxY + 0.5 && parts[index].bounds.maxY + 0.5 > other.bounds.minY
      assert.ok(!(xOverlap && yOverlap), `${lesson}: ${parts[index].partId} overlaps ${other.partId}`)
    }
  }
  assert.deepEqual(blockedByLegacyGeometry, ['buck-boost-concept', 'dc-motor-driver', 'mosfet-switch'])
})
