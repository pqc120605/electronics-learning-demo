import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

// Guards against parts placed off their footprint in published GLBs (found 2026-11-14:
// ESP32-S3-DevKitC-1 headers lay across the board and the WROOM module hung off the edge).
let server, parseBoardGlb
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts'))
})
after(async () => { await server?.close() })

const nodeBounds = (file) => {
  const bytes = readFileSync(file)
  return parseBoardGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)).nodeBounds
}
const mm = (value) => value * 1000

test('ESP32-S3-DevKitC-1 headers run along the 22 pads and the module sits on the board width', () => {
  const nodes = nodeBounds('public/models/esp32-s3-devkitc-1-v1.1.glb')
  const anchors = JSON.parse(readFileSync('src/data/esp32-s3-devkitc-1.pin-anchors.json', 'utf8'))
  for (const header of anchors.headers) {
    const node = nodes.find(item => item.nodeName === header.headerReference)
    const xs = header.pins.map(pin => pin.xMm), zs = header.pins.map(pin => pin.zMm)
    // 2.54 mm wide strip centred on the pad column, covering pad 1 … pad 22 with ±1.27 mm body margin.
    assert.ok(mm(node.max[0] - node.min[0]) < 3, `${header.headerReference} width ${mm(node.max[0] - node.min[0])}`)
    assert.ok(Math.abs(mm(node.min[0] + node.max[0]) / 2 - xs[0]) < 0.2, `${header.headerReference} x centre`)
    assert.ok(mm(node.min[2]) <= Math.min(...zs) - 1 && mm(node.max[2]) >= Math.max(...zs) + 1, `${header.headerReference} z span`)
  }
  const module = nodes.find(item => item.nodeName === 'U4')
  const left = anchors.headers[0].pins[0].xMm, right = anchors.headers[1].pins[0].xMm
  // 18 mm WROOM-1 body centred between the two headers (official board width 25.4 mm).
  assert.ok(Math.abs(mm(module.min[0] + module.max[0]) / 2 - (left + right) / 2) < 0.5)
  // Overall length with the antenna overhang is about 69 mm in Espressif's dimension drawing.
  const all = { min: Math.min(...nodes.map(item => item.min[2])), max: Math.max(...nodes.map(item => item.max[2])) }
  assert.ok(Math.abs(mm(all.max - all.min) - 69) < 1, `length ${mm(all.max - all.min)}`)
})

test('TB6612 breakout legs follow the SparkFun order on both header rows', () => {
  const manifest = JSON.parse(readFileSync('src/data/component-models.manifest.json', 'utf8'))
  const legs = manifest.find(item => item.id === 'tb6612').legsMm
  const row = (z) => legs.filter(leg => leg.z === z).sort((a, b) => a.x - b.x).map(leg => leg.pinId)
  assert.deepEqual(row(-8.89).slice(0, 5), ['vm', 'vcc', 'gnd', 'a01', 'a02'])
  assert.deepEqual(row(8.89).slice(0, 4), ['pwma', 'ain2', 'ain1', 'stby'])
})

// Pad centres read with pcbnew from assets/boards/arduino-reference/*-viewer.kicad_pcb (KiCad 10.0.7), mm.
test('Arduino Uno ATmega328P socket sits on its DIP-28 pads', () => {
  const nodes = nodeBounds('public/models/arduino-uno-r3.glb')
  const socket = nodes.filter(item => item.nodeName === 'ZU4')
  const cx = mm(Math.min(...socket.map(n => n.min[0])) + Math.max(...socket.map(n => n.max[0]))) / 2
  const cz = mm(Math.min(...socket.map(n => n.min[2])) + Math.max(...socket.map(n => n.max[2]))) / 2
  assert.ok(Math.abs(cx - 160.566) < 0.3 && Math.abs(cz - 115.291) < 0.3, `ZU4 centre ${cx},${cz}`)
})

test('Arduino boards carry bodies for headers, connectors, crystal and reset button', () => {
  const required = {
    'arduino-uno-r3': ['IOH0', 'IOL0', 'POWER0', 'AD0', 'ICSP0', 'ICSP1', 'X1', 'X2', 'Y1', 'Y2', 'RESET0'],
    'arduino-mega-2560-r3': ['JP6', 'PWML0', 'COMMUNICATION0', 'POWER0', 'ADCL0', 'ADCH0', 'XIO0', 'X1', 'X2', 'RESET0'],
    'arduino-nano-classic': ['J1', 'J2', 'SW1', 'Y1'],
  }
  for (const [board, refs] of Object.entries(required)) {
    const names = new Set(nodeBounds(`public/models/${board}.glb`).map(item => item.nodeName))
    assert.deepEqual(refs.filter(ref => !names.has(ref)), [], board)
  }
  // Jack and USB-B overhang the PCB edge like the real Uno (front of jack ~1.7 mm, USB-B 6.35 mm).
  const uno = nodeBounds('public/models/arduino-uno-r3.glb')
  const minX = (ref) => mm(Math.min(...uno.filter(item => item.nodeName === ref).map(item => item.min[0])))
  assert.ok(Math.abs(minX('X1') - 112.1) < 0.5, `X1 ${minX('X1')}`)
  assert.ok(Math.abs(minX('X2') - 107.45) < 0.2, `X2 ${minX('X2')}`)
})

test('STM32 educational boards keep header geometry and pin labels from public docs', async () => {
  const { stm32BoardModels } = await server.ssrLoadModule('/src/data/stm32BoardModels.ts')
  const bluePill = stm32BoardModels.find(model => model.id === 'stm32-blue-pill-f103')
  const nucleo = stm32BoardModels.find(model => model.id === 'stm32-nucleo')
  assert.equal(bluePill.pins.length, 40)
  const row = (ref) => bluePill.pins.filter(pin => pin.headerReference === ref).map(pin => pin.anchor)
  // Two 1x20 rows on 2.54 mm pitch, 15.24 mm apart.
  assert.ok(Math.abs(mm(row('J2')[0][2] - row('J1')[0][2]) - 15.24) < 0.01)
  assert.ok(Math.abs(mm(row('J1')[1][0] - row('J1')[0][0]) - 2.54) < 0.01)
  assert.equal(nucleo.pins.find(pin => pin.label.startsWith('D13')).label, 'D13 · PA5')
  // Arduino rows are 48.26 mm apart (Uno R3 geometry reused for CN5/CN6).
  const cn5 = nucleo.pins.find(pin => pin.headerReference === 'CN5').anchor, cn6 = nucleo.pins.find(pin => pin.headerReference === 'CN6').anchor
  assert.ok(Math.abs(mm(cn5[0] - cn6[0]) - 48.26) < 0.05)
  for (const [file, model] of [['stm32-blue-pill-f103', bluePill], ['stm32-nucleo-f401re', nucleo]]) {
    const names = new Set(nodeBounds(`public/models/${file}.glb`).map(item => item.nodeName))
    assert.deepEqual(model.hotspots.filter(spot => !spot.nodeNames.every(name => names.has(name))).map(spot => spot.featureId), [], file)
    assert.equal(model.audit.status, 'educational-reconstruction')
  }
})
