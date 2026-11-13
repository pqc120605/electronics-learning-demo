import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let buildBreadboardDiagram
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
  assert.ok(diagram.parts.some(item => item.id === 'led-1' && item.pins.some(pin => pin.holeId === 'bb1:15d')))
  assert.equal(diagram.holes.find(item => item.id === 'bb1:10a')?.net, diagram.holes.find(item => item.id === 'bb1:10c')?.net)
  assert.equal(diagram.holes.find(item => item.id === 'bb1:15a')?.net, diagram.holes.find(item => item.id === 'bb1:15d')?.net)
  assert.ok(diagram.boardPins.some(item => item.key === 'board-1:ledOut'))
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
  }
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
  assert.match(html, /400 tie-point.*chưa xác minh/i)
})
