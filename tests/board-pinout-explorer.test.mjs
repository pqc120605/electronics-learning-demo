import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let explorer
let esp32
let seeed
let canExploreBoardPinout

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[explorer, esp32, seeed, { canExploreBoardPinout }] = await Promise.all([
    server.ssrLoadModule('/src/components/board/BoardPinoutExplorer.tsx'),
    server.ssrLoadModule('/src/data/esp32DevkitModel.ts'),
    server.ssrLoadModule('/src/data/seeedXiaoEsp32C3BoardModel.ts'),
    server.ssrLoadModule('/src/lib/boardPinoutPresentation.ts'),
  ])
})

after(async () => { await server?.close() })

test('static pinout remains browseable even when direct 3D pin picking is disabled', () => {
  assert.equal(canExploreBoardPinout({ pins: [{ id: 'pin-1' }], pinPicking: undefined }), true)
  assert.equal(canExploreBoardPinout({ pins: [{ id: 'pin-1' }], pinPicking: true }), true)
  assert.equal(canExploreBoardPinout({ pins: [{ id: 'pin-1' }], pinPicking: false }), true)
  assert.equal(canExploreBoardPinout({ pins: [], pinPicking: true }), false)
})

test('pinout explorer describes the selected ESP32 clone pin with its own source, not Seeed data', () => {
  const html = renderToStaticMarkup(createElement(explorer.BoardPinoutExplorer, {
    pins: esp32.esp32DevkitModel.pins,
    selectedPinId: esp32.esp32DevkitModel.pins[0].id,
    onSelectPin: () => {},
    evidence: esp32.esp32DevkitModel.pinoutEvidence,
  }))
  assert.match(html, /Mở PCB và schematic của thiết kế clone ESP32 Dev Kit 30 chân/i)
  assert.match(html, /github\.com\/BrijModi\/ESP32-Dev-Kit-Clone/)
  assert.doesNotMatch(html, /Seeed|PAD undefined|J1 pad undefined/i)
})

test('pinout explorer retains the XIAO CAD-to-manufacturer evidence for its selected pin', () => {
  const html = renderToStaticMarkup(createElement(explorer.BoardPinoutExplorer, {
    pins: seeed.seeedXiaoEsp32C3BoardModel.pins,
    selectedPinId: seeed.seeedXiaoEsp32C3BoardModel.pins[0].id,
    onSelectPin: () => {},
    evidence: seeed.seeedXiaoEsp32C3BoardModel.pinoutEvidence,
  }))
  assert.match(html, /PCB KiCad v1\.3/i)
  assert.match(html, /chức năng GPIO theo pin map Seeed/i)
  assert.match(html, /wiki\.seeedstudio\.com\/XIAO_ESP32C3_Getting_Started/)
  assert.doesNotMatch(html, /PAD undefined/i)
})

test('board documentation scopes selectable pinouts to the exact ESP32 clone and XIAO C3 revision', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  const sourcing = readFileSync(new URL('../docs/board-model-sourcing.md', import.meta.url), 'utf8')
  assert.match(readme, /Có 28 board profile/)
  assert.doesNotMatch(readme, /Có 21 board profile/)
  assert.match(readme, /ESP32 DevKit clone có 30 chân header chọn được từ anchor theo CAD nguồn của đúng clone/)
  assert.match(readme, /XIAO ESP32-C3 có 14 chân J1\/J2/)
  assert.match(sourcing, /Header selection and GPIO details are scoped to this exact clone layout/)
})
