import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let buildBreadboardDiagram
let adjacentBreadboardHole
let Editor
let getLessonCircuitDoc

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [layout, editor, fixture] = await Promise.all([
    server.ssrLoadModule('/src/lib/breadboardDiagram.ts'),
    server.ssrLoadModule('/src/components/builder/BreadboardEditor.tsx'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
  ])
  buildBreadboardDiagram = layout.buildBreadboardDiagram
  adjacentBreadboardHole = layout.adjacentBreadboardHole
  Editor = editor.BreadboardEditor
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
})

after(async () => { await server?.close() })

test('diagram uses the canonical 400-hole grid and board connector positions', () => {
  const diagram = buildBreadboardDiagram(getLessonCircuitDoc('blink'))
  assert.equal(diagram.holes.length, 400)
  assert.ok(diagram.holes.some(item => item.id === 'bb1:10a'))
  assert.ok(diagram.holes.some(item => item.id === 'bb1:T-:1'))
  assert.ok(diagram.parts.some(item => item.id === 'res-1' && item.pins.some(pin => pin.holeId === 'bb1:10c')))
  assert.ok(diagram.parts.some(item => item.id === 'led-1' && item.pins.some(pin => pin.holeId === 'bb1:15f')))
  assert.equal(diagram.holes.find(item => item.id === 'bb1:10a')?.net, diagram.holes.find(item => item.id === 'bb1:10c')?.net)
  assert.equal(diagram.holes.find(item => item.id === 'bb1:15f')?.net, diagram.holes.find(item => item.id === 'bb1:15j')?.net)
  assert.ok(diagram.boardPins.some(item => item.key === 'board-1:ledOut'))
})

test('diagram exposes unused board pins as connectable endpoints with the lesson pin alias', () => {
  const diagram = buildBreadboardDiagram(getLessonCircuitDoc('button-led'))
  const powerPin = diagram.boardPins.find(pin => pin.key === 'board-1:vcc')
  const inputPin = diagram.boardPins.find(pin => pin.key === 'board-1:input')
  assert.ok(powerPin, 'an unconnected 3V3 endpoint remains available for a new wire')
  assert.equal(powerPin.label, '3V3')
  assert.ok(inputPin)
  assert.equal(inputPin.label, 'GPIO 18')
  assert.deepEqual(new Set(diagram.boardPins.map(pin => pin.side)), new Set(['left', 'right']))
  assert.ok(diagram.boardPins.every(pin => pin.y >= diagram.board.y && pin.y <= diagram.board.y + diagram.board.height))
})

test('diagram hole keyboard navigation stays within the selected breadboard row and rail', () => {
  assert.equal(adjacentBreadboardHole('bb1:3a', 'ArrowRight'), 'bb1:4a')
  assert.equal(adjacentBreadboardHole('bb1:4a', 'ArrowDown'), 'bb1:4b')
  assert.equal(adjacentBreadboardHole('bb1:1a', 'ArrowLeft'), null)
  assert.equal(adjacentBreadboardHole('bb1:T+:1', 'ArrowRight'), 'bb1:T+:2')
  assert.equal(adjacentBreadboardHole('bb1:T+:1', 'ArrowDown'), 'bb1:B+:1')
  assert.equal(adjacentBreadboardHole('bb1:3a', 'Enter'), null)
})

test('diagram wire routes terminate at the same CircuitDocV2 endpoints', () => {
  const doc = getLessonCircuitDoc('blink')
  const diagram = buildBreadboardDiagram(doc)
  assert.equal(diagram.wires.length, doc.wires.length)
  for (const wire of doc.wires) {
    const route = diagram.wires.find(item => item.id === wire.id)
    assert.ok(route, `missing diagram route ${wire.id}`)
    assert.equal(route.fromKey, wire.from.kind === 'hole' ? wire.from.holeId : `${wire.from.partId}:${wire.from.pinId}`)
    assert.equal(route.toKey, wire.to.kind === 'hole' ? wire.to.holeId : `${wire.to.partId}:${wire.to.pinId}`)
    assert.ok(Number.isFinite(route.from.x) && Number.isFinite(route.to.x))
    assert.ok(Array.isArray(route.points) && route.points.length >= 2, `${wire.id} has explicit route geometry`)
    for (let index = 1; index < route.points.length; index += 1) {
      const a = route.points[index - 1], b = route.points[index]
      assert.ok(Math.abs(a.x - b.x) < 1e-7 || Math.abs(a.y - b.y) < 1e-7, `${wire.id} has an orthogonal segment`)
    }
  }
})

test('a bench-mounted switch is visible and every declared switch jumper has a diagram endpoint', () => {
  const doc = getLessonCircuitDoc('button-led')
  const diagram = buildBreadboardDiagram(doc)
  const button = diagram.parts.find(part => part.id === 'button-1')
  assert.ok(button, 'bench parts must be represented in the shared circuit diagram')
  assert.deepEqual(new Set(button.pins.map(pin => pin.pinId)), new Set(['contactA', 'contactB']))
  assert.ok(button.pins.every(pin => !pin.holeId), 'bench terminals must not be presented as breadboard holes')
  assert.equal(diagram.wires.length, doc.wires.length)
  assert.deepEqual(diagram.diagnostics, [])
  assert.match(button.pins.find(pin => pin.pinId === 'contactA')?.key ?? '', /button-1:contactA/)
})

test('the rendered diagram labels bench parts and never invents a hole for their pins', () => {
  const html = renderToStaticMarkup(createElement(Editor, {
    doc: getLessonCircuitDoc('button-led'), selectedWireId: null, pendingEndpoint: null,
    lessonWiring: { noticeIsError: false, onClearNotice() {} },
    onSelectEndpoint() {}, onSelectWire() {}, onCommitWire() {}, onEditWireEndpoint() {}, onSetWireRole() {}, onRemoveWire() {},
  }))
  assert.match(html, /ĐẶT NGOÀI BREADBOARD · NỐI BẰNG JUMPER/)
  assert.match(html, /data-diagram-part="button-1" data-mount="bench"/)
  assert.match(html, /button-1 Tiếp điểm A, đầu nối trên bàn/)
  assert.match(html, /data-diagram-wire="w-button-to-gnd"/)
})

test('editor shows the mounted parts and wire paths on the physical-style diagram', () => {
  const doc = getLessonCircuitDoc('blink')
  const html = renderToStaticMarkup(createElement(Editor, {
    doc,
    selectedWireId: 'w-gpio-to-resistor',
    pendingEndpoint: null,
    lessonWiring: { noticeIsError: false, onClearNotice() {} },
    onSelectEndpoint() {}, onSelectWire() {}, onCommitWire() {}, onEditWireEndpoint() {}, onSetWireRole() {}, onRemoveWire() {},
  }))
  assert.match(html, /breadboard-diagram/)
  assert.match(html, /data-diagram-wire="w-gpio-to-resistor"/)
  assert.match(html, /data-diagram-part="res-1"/)
  assert.match(html, /data-diagram-part="led-1"/)
  assert.ok(html.indexOf('diagram-mounted-parts') < html.indexOf('diagram-hole-hit-layer'))
  assert.equal((html.match(/data-circuit-endpoint="bb1:10a"/g) ?? []).length, 1)
  assert.match(html, /400 tie-point.*chưa xác minh/i)
})

test('occupied holes retain keyboard endpoints without covering component terminals for pointer input', () => {
  const html = renderToStaticMarkup(createElement(Editor, {
    doc: getLessonCircuitDoc('blink'), selectedWireId: null, pendingEndpoint: null,
    lessonWiring: { noticeIsError: false, onClearNotice() {} },
    onSelectEndpoint() {}, onSelectWire() {}, onCommitWire() {}, onEditWireEndpoint() {}, onSetWireRole() {}, onRemoveWire() {},
  }))
  const hole = html.match(/<circle[^>]*data-circuit-endpoint="bb1:10c"[^>]*>/)?.[0]
  assert.ok(hole, 'the occupied hole remains in the keyboard navigation grid')
  assert.match(hole, /data-occupied="true"/)
  assert.match(hole, /pointer-events:none/)
  assert.match(hole, /role="button"/)
  assert.match(hole, /chân linh kiện/)
  assert.match(html, /data-circuit-endpoint="res-1:a"/)
})
