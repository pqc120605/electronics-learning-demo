import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api

function assertNoErrors(issues) {
  assert.deepEqual(issues.filter(issue => issue.severity === 'error'), [])
}

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [edits, fixture, nets] = await Promise.all([
    server.ssrLoadModule('/src/lib/circuitDocEdits.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/circuitNetsV2.ts'),
  ])
  api = { ...edits, getLessonCircuitDoc: fixture.getLessonCircuitDoc, createNetIndexV2: nets.createNetIndexV2 }
})

after(async () => { await server?.close() })

test('add/remove part and add/remove wire are immutable and refresh document counts', () => {
  const before = api.getLessonCircuitDoc('blink')
  const addedPart = api.addPart(before, { id: 'res-2', type: 'resistor', mount: { kind: 'breadboard', board: 'bb1', col: 20, row: 0, rotation: 0 } })
  assertNoErrors(addedPart.issues)
  assert.equal(addedPart.doc.parts.length, 5)
  assert.equal(addedPart.doc.expect.partCount, 5)
  assert.equal(before.parts.length, 4)

  const addedWire = api.addWire(addedPart.doc, { id: 'w-extra', from: { kind: 'pin', partId: 'board-1', pinId: 'vcc' }, to: { kind: 'pin', partId: 'res-2', pinId: 'a' } })
  assertNoErrors(addedWire.issues)
  assert.equal(addedWire.doc.expect.wireCount, 4)
  const removedWire = api.removeWire(addedWire.doc, 'w-extra')
  assertNoErrors(removedWire.issues)
  assert.equal(removedWire.doc.expect.wireCount, 3)
  const removedPart = api.removePart(removedWire.doc, 'res-2')
  assertNoErrors(removedPart.issues)
  assert.equal(removedPart.doc.parts.length, 4)
  assert.equal(removedPart.doc.expect.partCount, 4)
  assert.equal(before.parts.some(part => part.id === 'res-2'), false)
})

test('removePart refuses parts referenced by a wire or open pin', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const wireBlocked = api.removePart(doc, 'board-1')
  assert.ok(wireBlocked.issues.some(issue => issue.code === 'G3'))
  assert.equal(wireBlocked.doc, doc)
  const open = { ...doc, openPins: [{ partId: 'res-1', pinId: 'a', reason: 'retained for the exercise' }] }
  const openBlocked = api.removePart(open, 'res-1')
  assert.ok(openBlocked.issues.some(issue => issue.code === 'G3'))
  assert.equal(openBlocked.doc, open)
})

test('setPartValue updates only the selected part and remains immutable', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const changed = api.setPartValue(doc, 'res-1', { ohm: 330 })
  assertNoErrors(changed.issues)
  assert.equal(changed.doc.parts.find(part => part.id === 'res-1').value.ohm, 330)
  assert.equal(doc.parts.find(part => part.id === 'res-1').value.ohm, 220)
  assert.equal(changed.doc.wires, doc.wires)
})

test('layout movement changes only layout and preserves serialized document and net partitions', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const serialized = JSON.stringify(doc)
  const before = api.createNetIndexV2(doc)
  const keys = ['board-1:ledOut', 'res-1:a', 'res-1:b', 'led-1:anode', 'led-1:cathode', 'board-1:gnd']
  const partition = keys.map(left => keys.map(right => before.netOf(left) === before.netOf(right)))
  const layout = api.movePartLayout({ 'res-1': { x: 40, y: 50 } }, 'res-1', { x: 70, y: 20 })
  const after = api.createNetIndexV2(doc)
  assert.deepEqual(layout['res-1'], { x: 70, y: 20 })
  assert.deepEqual(keys.map(left => keys.map(right => after.netOf(left) === after.netOf(right))), partition)
  assert.equal(JSON.stringify(doc), serialized)
})

test('invalid topology changes are rejected with G4 and leave the original document unchanged', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const invalid = api.addWire(doc, { id: 'duplicate-hole', from: { kind: 'hole', holeId: 'bb1:10a' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' } })
  assert.ok(invalid.issues.some(issue => issue.code === 'G4' && issue.severity === 'error'))
  assert.equal(invalid.doc, doc)
  assert.equal(doc.wires.some(wire => wire.id === 'duplicate-hole'), false)
})

test('wire endpoint edits can move either end between pins and holes without changing wire identity', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const first = api.editWireEndpoint(doc, 'w-gpio-to-resistor', 'to', { kind: 'hole', holeId: 'bb1:5a' })
  assertNoErrors(first.issues)
  assert.equal(first.doc.wires[0].id, 'w-gpio-to-resistor')
  assert.deepEqual(first.doc.wires[0].to, { kind: 'hole', holeId: 'bb1:5a' })

  const second = api.editWireEndpoint(first.doc, 'w-gpio-to-resistor', 'to', { kind: 'pin', partId: 'res-1', pinId: 'a' })
  assertNoErrors(second.issues)
  assert.deepEqual(second.doc.wires[0].to, { kind: 'pin', partId: 'res-1', pinId: 'a' })
  assert.equal(doc.wires[0].to.kind, 'hole')
})

test('wire endpoint edits refuse occupied holes and duplicate wire endpoints without mutating the source', () => {
  const doc = api.getLessonCircuitDoc('blink')
  const occupied = api.editWireEndpoint(doc, 'w-gpio-to-resistor', 'to', { kind: 'hole', holeId: 'bb1:15a' })
  assert.ok(occupied.issues.some(issue => issue.code === 'G4' && issue.severity === 'error'))
  assert.equal(occupied.doc, doc)

  const duplicate = api.editWireEndpoint(doc, 'w-gpio-to-resistor', 'to', { kind: 'hole', holeId: 'bb1:T-:2' })
  assert.ok(duplicate.issues.some(issue => issue.code === 'G4' && issue.severity === 'error'))
  assert.equal(duplicate.doc, doc)
})

test('wire role changes preserve stable wire ids and reject unknown wires', () => {
  const doc = api.getLessonCircuitDoc('blink')
  for (const role of ['power', 'ground', 'signal']) {
    const result = api.setWireRole(doc, 'w-gpio-to-resistor', role)
    assertNoErrors(result.issues)
    assert.equal(result.doc.wires[0].id, 'w-gpio-to-resistor')
    assert.equal(result.doc.wires[0].role, role)
  }
  const missing = api.setWireRole(doc, 'missing-wire', 'signal')
  assert.ok(missing.issues.some(issue => issue.severity === 'error'))
  assert.equal(missing.doc, doc)
})
