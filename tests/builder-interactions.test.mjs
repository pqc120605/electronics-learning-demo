import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let interactions
let circuits

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  interactions = await server.ssrLoadModule('/src/lib/builderInteractions.ts')
  circuits = await server.ssrLoadModule('/src/data/lessonCircuits.ts')
})

after(async () => { await server?.close() })

test('starting on a pin reserves the gesture for wire drawing, not component movement', () => {
  assert.equal(interactions.canStartComponentMove(true), false)
  assert.equal(interactions.canStartComponentMove(false), true)
})

test('wire gesture distinguishes pixel jitter from drag on a scrolled and offset canvas', () => {
  const start = interactions.startWireGesture(7, 'led:a', { x: 1100, y: 600 }, { x: 25, y: 50 })
  const rect = { left: 900, top: 400, width: 800, height: 400 }
  assert.equal(interactions.moveWireGesture(start, 7, 1102, 601, rect), undefined)
  assert.equal(interactions.moveWireGesture(start, 8, 1300, 700, rect), undefined)
  const moved = interactions.moveWireGesture(start, 7, 1300, 700, rect)
  assert.deepEqual({ x: moved.x, y: moved.y, dragging: moved.dragging }, { x: 50, y: 75, dragging: true })
  assert.equal(start.dragging, false)
})

test('wire preview reaches edge pins and invalid rectangles never produce NaN', () => {
  const start = interactions.startWireGesture(1, 'board:gnd', { x: 100, y: 100 }, { x: 50, y: 50 })
  const moved = interactions.moveWireGesture(start, 1, 200, 200, { left: 0, top: 0, width: 200, height: 200 })
  assert.equal(moved.x, 100)
  assert.equal(moved.y, 100)
  for (const rect of [{ left: NaN, top: 0, width: 20, height: 20 }, { left: 0, top: 0, width: Infinity, height: 20 }]) {
    assert.equal(interactions.canvasDropPosition(10, 10, rect), undefined)
  }
})

test('canvas drop positions are normalized and clamped to the visible placement area', () => {
  const rect = { left: 100, top: 50, width: 800, height: 400 }
  assert.deepEqual(interactions.canvasDropPosition(500, 250, rect), { x: 50, y: 50 })
  assert.deepEqual(interactions.canvasDropPosition(-100, 900, rect), { x: 5, y: 88 })
})

test('a dragged palette item becomes a placed component at the drop point', () => {
  const { placed, issue } = interactions.addDroppedPart([], 'led', { x: 61, y: 43 }, 'led-drop-1')
  assert.equal(issue, undefined)
  assert.deepEqual(placed, [{ id: 'led-drop-1', type: 'led', x: 61, y: 43 }])
})

test('palette drops cannot add a duplicate board or exceed the workspace limit', () => {
  const board = [{ id: 'board-1', type: 'board', x: 20, y: 40 }]
  assert.equal(interactions.addDroppedPart(board, 'board', { x: 60, y: 50 }, 'board-2').issue, 'board-exists')
  const full = Array.from({ length: 100 }, (_, index) => ({ id: `led-${index}`, type: 'led', x: 50, y: 50 }))
  assert.equal(interactions.addDroppedPart(full, 'resistor', { x: 50, y: 50 }, 'res-101').issue, 'workspace-limit')
})

test('wire drag resolves stable pin ids and refuses duplicate or self connections', () => {
  const { placed } = circuits.circuitForLesson('blink')
  const first = interactions.createWireFromKeys('board-1:ledOut', 'led-1:anode', placed, [], 'wire-user-1')
  assert.equal(first.issue, undefined)
  assert.deepEqual(first.wire, { id: 'wire-user-1', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'led-1', pinId: 'anode' } })
  assert.equal(interactions.createWireFromKeys('board-1:ledOut', 'board-1:ledOut', placed, [], 'wire-self').issue, 'same-pin')
  assert.equal(interactions.createWireFromKeys('board-1:ledOut', 'led-1:anode', placed, [first.wire], 'wire-duplicate').issue, 'duplicate')
  assert.equal(interactions.createWireFromKeys('board-1:missing', 'led-1:anode', placed, [], 'wire-invalid').issue, 'invalid-pin')
})
