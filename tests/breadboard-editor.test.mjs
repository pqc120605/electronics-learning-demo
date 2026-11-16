import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let Editor
let getLessonCircuitDoc

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [editorModule, fixture] = await Promise.all([
    server.ssrLoadModule('/src/components/builder/BreadboardEditor.tsx'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
  ])
  Editor = editorModule.BreadboardEditor
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
})

after(async () => { await server?.close() })

const props = (doc, overrides = {}) => ({
  doc,
  selectedWireId: 'w-gpio-to-resistor',
  pendingEndpoint: null,
  onSelectEndpoint() {},
  onSelectWire() {},
  onCommitWire() {},
  onEditWireEndpoint() {},
  onSetWireRole() {},
  onRemoveWire() {},
  ...overrides,
})

test('breadboard editor renders 300 grid holes and 100 assumed rails as accessible endpoints', () => {
  const html = renderToStaticMarkup(createElement(Editor, props(getLessonCircuitDoc('blink'))))
  assert.equal((html.match(/data-hole-id=/g) ?? []).length, 400)
  assert.match(html, /bb1:10a/)
  assert.match(html, /bb1:T\+:1/)
  assert.match(html, /Rãnh giữa/)
  assert.match(html, /chưa xác minh/i)
})

test('breadboard editor identifies occupied leads and provides selectable component pins', () => {
  const html = renderToStaticMarkup(createElement(Editor, props(getLessonCircuitDoc('blink'))))
  assert.match(html, /data-occupied="true"/)
  assert.match(html, /board-1:ledOut/)
  assert.match(html, /res-1:a/)
})

test('workspace shows one breadboard heading while the lesson canvas keeps its own contextual heading', () => {
  const doc = getLessonCircuitDoc('blink')
  const workspaceHtml = renderToStaticMarkup(createElement(Editor, props(doc)))
  const lessonHtml = renderToStaticMarkup(createElement(Editor, props(doc, { lessonWiring: { noticeIsError: false, onClearNotice() {} } })))
  const headingPattern = /<h[23][^>]*>Breadboard và dây nối<\/h[23]>/g
  assert.equal((workspaceHtml.match(headingPattern) ?? []).length, 1)
  assert.equal((lessonHtml.match(headingPattern) ?? []).length, 1)
})

test('selected wire exposes endpoint, role and removal controls with accessible names', () => {
  const html = renderToStaticMarkup(createElement(Editor, props(getLessonCircuitDoc('blink'))))
  assert.match(html, /Chỉnh đầu dây w-gpio-to-resistor/)
  assert.match(html, /Đổi loại dây/)
  assert.match(html, /Xóa dây w-gpio-to-resistor/)
})

test('lesson flow can highlight the exact active V2 wire in the endpoint list', () => {
  const html = renderToStaticMarkup(createElement(Editor, props(getLessonCircuitDoc('blink'), { activeWireIds: new Set(['w-gpio-to-resistor']) })))
  assert.match(html, /breadboard-wire-flow-active/)
  assert.match(html, /đường lệnh đang xem/)
})

test('editor displays typed wiring diagnostics without changing the source document', () => {
  const doc = getLessonCircuitDoc('blink')
  const html = renderToStaticMarkup(createElement(Editor, props(doc, { notice: 'G4: Lỗ bb1:15a đang bị chiếm.' })))
  assert.match(html, /G4: Lỗ bb1:15a đang bị chiếm\./)
  assert.equal(doc.wires.length, 4)
})
