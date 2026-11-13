import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let CircuitSchematicV2
let getLessonCircuitDoc

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [view, fixture] = await Promise.all([
    server.ssrLoadModule('/src/components/builder/CircuitSchematicV2.tsx'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
  ])
  CircuitSchematicV2 = view.CircuitSchematicV2
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
})

after(async () => { await server?.close() })

test('button schematic exposes open switch, LED emission/polarity, values, role markers and net-linked holes', () => {
  const doc = getLessonCircuitDoc('button-led')
  const html = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc }))
  assert.match(html, /220 Ω/)
  assert.match(html, /res-1/)
  assert.match(html, /Anode \(\+\)/)
  assert.match(html, /Cathode \(−\)/)
  assert.match(html, /data-symbol-state="open"/)
  assert.match(html, /schematic-led-emission/)
  assert.match(html, /GPIO IN/)
  assert.match(html, /data-role="ground"/)
  assert.match(html, /schematic-crossing/)
  assert.match(html, /data-hole-id="bb1:22g"/)
  assert.doesNotMatch(html, /schematic-hole-label/)
  doc.wires[0].role = 'power'
  const powered = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc }))
  assert.match(powered, /data-role="power"/)
  assert.match(powered, /Nguồn/)
  doc.wires.forEach(w => { delete w.role })
  const noRoles = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc }))
  assert.doesNotMatch(noRoles, /data-role="ground"|data-role="power"/)
})

test('unknown symbol and conflicting supply roles stay visible as diagnostics', () => {
  const doc = getLessonCircuitDoc('button-led')
  doc.parts.push({ id: 'unknown-1', type: 'unknown-part', mount: { kind: 'bench', lane: 'bottom', order: 1 } })
  doc.wires[1].role = 'power'
  const html = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc }))
  assert.match(html, /unknown-1/)
  assert.match(html, /circuit-symbol-unsupported/)
  assert.match(html, /xung đột/i)
  assert.doesNotMatch(html, /data-role="ground"|data-role="power"/)
})

test('schematic renders conventional circuit symbols, board terminals, connection labels and honest limits', () => {
  const html = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc: getLessonCircuitDoc('blink') }))
  assert.match(html, /Sơ đồ nguyên lý/)
  assert.match(html, /resistor/)
  assert.match(html, /led/)
  assert.match(html, /GPIO LED/)
  assert.match(html, /bb1:10a/)
  assert.match(html, /không phải kết quả ERC hay mô phỏng điện/)
})

test('schematic exposes accessible stable part and net selection controls', () => {
  const html = renderToStaticMarkup(createElement(CircuitSchematicV2, { doc: getLessonCircuitDoc('blink'), selectedKey: 'res-1', activeKeys: new Set(['res-1:a']) }))
  assert.match(html, /Chọn Điện trở 220 Ω res-1/)
  assert.match(html, /Net 1/)
  assert.match(html, /data-net-key=/)
  assert.match(html, /net-active/)
})
