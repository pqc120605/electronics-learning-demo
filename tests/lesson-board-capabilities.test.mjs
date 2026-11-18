import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

let server, api
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => server?.close())
async function capabilities() {
  assert.ok(existsSync('src/lib/lessonBoardCapabilities.ts'), 'lesson capability adapter is missing')
  api ??= await server.ssrLoadModule('/src/lib/lessonBoardCapabilities.ts')
  return api
}

test('unknown board or lesson never falls back to a familiar profile', async () => {
  const { getLessonBoardCapabilities: get } = await capabilities()
  assert.equal(get('unknown-clone-99', 'blink'), null)
  assert.equal(get('arduino-uno-r3', 'missing-lesson'), null)
  assert.equal(get('', 'blink'), null)
})

test('source-backed pinout and current lesson anchors stay independent', async () => {
  const { getLessonBoardCapabilities: get } = await capabilities()
  const uno = get('arduino-uno-r3', 'blink')
  const nucleo = get('stm32-nucleo', 'blink')
  assert.equal(uno.lessonSupported, true)
  assert.equal(uno.anchors.status, 'complete')
  assert.deepEqual(uno.anchors.required.map(pin => pin.id).sort(), ['gnd', 'ledOut'])
  assert.equal(uno.anchors.missing.length, 0)
  assert.equal(nucleo.pinConfidence, 'source-backed')
  assert.equal(nucleo.anchors.anchored.length, 0)
  assert.equal(nucleo.anchors.status, 'missing')
  assert.ok(nucleo.anchors.missing.some(pin => pin.id === 'ledOut'))
  assert.equal(uno.hex.supported, true)
  assert.equal(nucleo.hex.supported, false)
})

test('Pico source data does not imply lesson binding or verified analog support', async () => {
  const { getLessonBoardCapabilities: get } = await capabilities()
  const picoW = get('raspberry-pi-pico-w', 'blink')
  assert.equal(picoW.pinConfidence, 'source-backed')
  assert.equal(picoW.anchors.status, 'missing')
  const analog = get('raspberry-pi-pico', 'analog-potentiometer')
  assert.equal(analog.lessonSupported, false)
  assert.match(analog.lessonReason, /ADC/)
  assert.equal(analog.anchors.status, 'unavailable')
})

test('reference-only and non-MCU lessons have explicit limits', async () => {
  const { getLessonBoardCapabilities: get } = await capabilities()
  const reference = get('seeed-xiao-esp32-s3', 'blink')
  assert.equal(reference.lessonSupported, false)
  assert.equal(reference.targetAvailable, false)
  assert.equal(reference.boardId, 'seeed-xiao-esp32-s3')
  assert.equal(reference.anchors.status, 'unavailable')
  assert.ok(reference.boardRoute.endsWith('seeed-xiao-esp32-s3'))
  const source = get('arduino-uno-r3', 'source-led')
  assert.equal(source.anchors.status, 'not-needed')
  assert.match(source.lessonRuntime, /kịch bản|minh họa/i)
  assert.match(reference.solverNote, /không.*SPICE/i)
})

test('finder filters exact capabilities and searches Vietnamese deterministically', async () => {
  const { listLessonBoardCapabilities: list, filterLessonBoardCapabilities: filter } = await capabilities()
  const rows = list('analog-potentiometer')
  assert.deepEqual(filter(rows, { query: '  UNO R3  ', capability: 'all' }).map(row => row.boardId), ['arduino-uno-r3'])
  const lessons = filter(rows, { query: '', capability: 'lesson' })
  assert.ok(lessons.length > 0)
  assert.ok(lessons.every(row => row.lessonSupported))
  assert.ok(!lessons.some(row => row.boardId === 'raspberry-pi-pico'))
  const hex = filter(rows, { query: '', capability: 'hex' })
  assert.deepEqual(hex.map(row => row.boardId).sort(), ['arduino-nano-classic', 'arduino-uno-r3'])
  assert.deepEqual(list('missing-lesson'), [])
})

test('capability lookup never changes registry data or returned previous snapshots', async () => {
  const { listLessonBoardCapabilities: list } = await capabilities()
  const { boards } = await server.ssrLoadModule('/src/data/boards.ts')
  const { simulationTargets } = await server.ssrLoadModule('/src/data/simulationTargets.ts')
  const before = JSON.stringify({ boards, simulationTargets })
  const first = list('blink')
  const snapshot = JSON.stringify(first)
  list('seven-segment-counter')
  assert.equal(JSON.stringify(first), snapshot)
  assert.equal(JSON.stringify({ boards, simulationTargets }), before)
  assert.equal(new Set(first.map(row => row.boardId)).size, boards.length)
  assert.ok(first.every(row => row.hex.supported || /chưa|không/i.test(row.hex.description)))
})

test('finder starts as optional comparison with no chosen board or callback side effect', async () => {
  assert.ok(existsSync('src/components/lesson/BoardCapabilityFinder.tsx'), 'board capability finder is missing')
  const { BoardCapabilityFinder } = await server.ssrLoadModule('/src/components/lesson/BoardCapabilityFinder.tsx')
  let choices = 0
  const html = renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(BoardCapabilityFinder, { lessonId: 'blink', onChoose: () => choices++ })))
  assert.match(html, /So sánh khả năng/)
  assert.match(html, /Tìm board để so sánh/)
  assert.match(html, /Công cụ HEX ATmega328P/)
  assert.doesNotMatch(html, /Chọn Arduino Uno R3 cho bài này/)
  assert.equal(choices, 0)
})
