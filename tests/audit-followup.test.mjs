import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let modules

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all([
    '/src/data/productRoutes.ts',
    '/src/data/lessonCircuits.ts',
    '/src/lib/lessonBoardPins.ts',
    '/src/lib/boardFeatureEvidence.ts',
  ].map((path) => server.ssrLoadModule(path)))
  modules = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('lesson title lookup distinguishes a real lesson from an unknown lesson route', () => {
  assert.equal(modules.getPageTitle('/learn/button-led'), 'Chuẩn bị bài học — Mạch Mở')
  assert.equal(modules.getPageTitle('/learn/khong-co'), 'Không tìm thấy trang — Mạch Mở')
  assert.equal(modules.getPageTitle('/app/learn/khong-co'), 'Không tìm thấy trang — Mạch Mở')
})

test('board pin panel can derive only pins used by the selected lesson and current wiring', () => {
  const { circuitForLesson } = modules
  const blink = circuitForLesson('blink')
  assert.deepEqual(modules.getLessonBoardPinIds('blink', 'board-1', []), ['ledOut', 'gnd'])

  const button = circuitForLesson('button-led')
  assert.deepEqual(modules.getLessonBoardPinIds('button-led', 'board-1', button.wires), ['ledOut', 'gnd', 'input'])
  const addedPin = { id: 'extra', from: { partId: 'board-1', pinId: 'trig' }, to: { partId: 'sonar-1', pinId: 'trig' } }
  assert.deepEqual(modules.getLessonBoardPinIds('blink', 'board-1', [addedPin]), ['ledOut', 'gnd', 'trig'])
  assert.deepEqual(modules.getLessonBoardPinIds('blink', 'other-board', blink.wires), [])
  const boardPins = [{ id: 'ledOut' }, { id: 'gnd' }, { id: 'trig' }]
  assert.deepEqual(modules.getVisibleBoardPins(boardPins, ['ledOut', 'gnd'], false), boardPins.slice(0, 2))
  assert.deepEqual(modules.getVisibleBoardPins(boardPins, ['ledOut', 'gnd'], true), boardPins)
})

test('CAD identity evidence does not claim that a component function is verified', () => {
  const evidence = modules.getFeatureEvidence({
    name: 'ATmega328P · ZU4',
    roleEvidence: 'unverified',
    cadFootprint: { reference: 'ZU4', value: 'ATMEGA328P-PU', footprint: 'DIP-28', x: 0, y: 0, rotation: 0, side: 'front', has3dBody: true },
  })
  assert.ok(evidence.labels.includes('Chưa xác minh chức năng'))
  assert.ok(evidence.labels.includes('Designator/value trong CAD'))
  assert.ok(evidence.labels.includes('Có mesh 3D'))
})

test('lab controls meet the minimum target size found in the web audit', async () => {
  const css = await readFile('src/styles/app.css', 'utf8')
  assert.match(css, /\.circuit-builder-page \.builder-return-links :is\(a,button\)\s*\{[^}]*min-height:\s*44px/s)
  assert.match(css, /\.builder-content \.builder-actions button\s*\{[^}]*min-height:\s*44px/s)
  assert.match(css, /\.builder-content \.builder-wire-list summary\s*\{[^}]*min-height:\s*40px/s)
  assert.match(css, /\.builder-content \.builder-wire-list button\s*\{[^}]*min-height:\s*32px/s)
  assert.match(css, /\.builder-content :is\(\.diagnostic-notes,\.simulation-provider-details,\.builder-learning,\.builder-code\) summary\s*\{[^}]*min-height:\s*40px/s)
})
