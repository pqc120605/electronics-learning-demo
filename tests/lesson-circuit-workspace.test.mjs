import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let LessonCircuitWorkspace
let getLessonCircuitDoc
let getLessonCircuitFlow
let isLessonCircuitConnected

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [view, fixture] = await Promise.all([
    server.ssrLoadModule('/src/components/lesson/LessonCircuitWorkspace.tsx'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
  ])
  LessonCircuitWorkspace = view.LessonCircuitWorkspace
  getLessonCircuitFlow = view.getLessonCircuitFlow
  isLessonCircuitConnected = view.isLessonCircuitConnected
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
})

after(async () => { await server?.close() })

test('supported HIGH and LOW code actions highlight only the canonical LED path', () => {
  const doc = getLessonCircuitDoc('blink')
  const high = getLessonCircuitFlow(doc, { kind: 'write', pin: 23, value: 'HIGH' })
  const low = getLessonCircuitFlow(doc, { kind: 'write', pin: 23, value: 'LOW' })
  assert.equal(high.complete, true)
  assert.deepEqual([...high.wireIds].sort(), ['w-gpio-to-resistor', 'w-led-cathode-to-rail', 'w-rail-to-gnd'])
  assert.deepEqual([...low.wireIds].sort(), [...high.wireIds].sort())
  assert.match(high.label, /GPIO 23 = HIGH/)
  assert.match(low.label, /GPIO 23 = LOW/)
  assert.match(high.label, /không phải dòng điện hay điện áp đã giải/)
})

test('delay retains its previous lesson state; unsupported pins and setup actions invent no signal path', () => {
  const doc = getLessonCircuitDoc('blink')
  assert.equal(getLessonCircuitFlow(doc, { kind: 'delay', pin: 23, previousLedLit: true }).complete, true)
  assert.equal(getLessonCircuitFlow(doc, { kind: 'pinMode', pin: 23 }).wireIds.size, 0)
  assert.equal(getLessonCircuitFlow(doc, { kind: 'write', pin: 18, value: 'HIGH' }).wireIds.size, 0)
})

test('wiring completion is recomputed from exact net membership after an edit', () => {
  const doc = getLessonCircuitDoc('blink')
  assert.equal(isLessonCircuitConnected(doc), true)
  assert.equal(isLessonCircuitConnected({ ...doc, wires: doc.wires.filter(wire => wire.id !== 'w-led-cathode-to-rail') }), false)
})

test('lesson circuit workspace exposes breadboard, schematic, component tabs, signal labeling and local-session limits', () => {
  const html = renderToStaticMarkup(createElement(LessonCircuitWorkspace, {
    doc: getLessonCircuitDoc('blink'),
    activeAction: { kind: 'write', pin: 23, value: 'HIGH' },
    selectedPartId: 'board-1',
    onSelectPart() {},
  }))
  assert.match(html, /Breadboard và dây/)
  assert.match(html, /Schematic/)
  assert.match(html, /Tổng quan/)
  assert.match(html, /Chân/)
  assert.match(html, /Trong bài/)
  assert.match(html, /Thông số/)
  assert.match(html, /GPIO 23 = HIGH/)
  assert.match(html, /không tính dòng\/áp/)
  assert.match(html, /không ghi đè bản nháp của bạn/)
})
