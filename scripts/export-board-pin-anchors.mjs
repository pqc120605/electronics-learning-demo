// Maps Arduino header pads from the CAD manifests into each board GLB's coordinates, and records
// GLB bounds for every board so the 3D layout can place them without loading the model first.
// Run from electronics-learning-demo: node scripts/export-board-pin-anchors.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
await server.close()

const uno = { D0: 'IO0', D1: 'IO1', D2: 'IO2', D3: 'IO3', D4: 'IO4', D5: 'IO5', D6: 'IO6', D7: 'IO7', D8: 'IO8', D9: 'IO9', D10: 'SS', D11: 'MOSI', D12: 'MISO', D13: 'SCK', A0: 'AD0', '5V': '+5V', '3V3': '+3V3', GND: 'GND' }
const boards = [
  { id: 'arduino-uno-r3', glb: 'arduino-uno-r3', cad: 'arduino-uno-r3-rev3', headers: ['IOL0', 'IOH0', 'AD0', 'POWER0'], nets: uno },
  { id: 'arduino-nano-classic', glb: 'arduino-nano-classic', cad: 'arduino-nano-classic', headers: ['J1', 'J2'], nets: { ...Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9, 10].map((pin) => [`D${pin}`, `D${pin}`])), D11: 'D11/MOSI', D12: 'D12/MISO', D13: 'D13/SCK', A0: 'A0', '5V': '+5V', '3V3': '3V3', GND: 'COM' } },
  // Mega digital headers name the AVR port, so the labels below follow the board's documented pin mapping.
  { id: 'arduino-mega-2560-r3', glb: 'arduino-mega-2560-r3', cad: 'arduino-mega-2560-r3', headers: ['PWML0', 'JP6', 'ADCL0', 'POWER0'], nets: { D2: 'PE4', D3: 'PE5', D4: 'PG5', D5: 'PE3', D6: 'PH3', D7: 'PH4', D8: 'PH5', D9: 'PH6', D10: 'PB4', D11: 'PB5', D12: 'PB6', D13: 'PB7', A0: 'ADC0', '5V': '+5V', '3V3': '+3V3', GND: 'GND' } },
]

const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1]
const round = (value) => +value.toFixed(3)
function loadGlb(name) {
  const bytes = readFileSync(`public/models/${name}.glb`)
  return parseBoardGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
}
function boundsOf(nodes) {
  const min = [0, 1, 2].map((axis) => Math.min(...nodes.map((node) => node.min[axis])) * 1000)
  const max = [0, 1, 2].map((axis) => Math.max(...nodes.map((node) => node.max[axis])) * 1000)
  return { min: min.map(round), max: max.map(round) }
}

const output = {}
for (const board of boards) {
  const { nodeBounds } = loadGlb(board.glb)
  const cad = JSON.parse(readFileSync(`public/boards/${board.cad}/manifest.json`, 'utf8'))
  const byReference = new Map(cad.components.map((component) => [component.reference, component]))
  const matched = nodeBounds.flatMap((node) => { const component = byReference.get(node.nodeName); return component ? [{ node, component }] : [] })
  const offsetX = median(matched.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
  const offsetZ = median(matched.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 - component.y))
  const pads = board.headers.flatMap((reference) => byReference.get(reference)?.pads ?? [])
  const pins = {}
  for (const [label, net] of Object.entries(board.nets)) {
    const pad = pads.find((item) => item.netName === net)
    if (!pad) throw new Error(`${board.id}: thiếu pad cho ${label} (${net})`)
    pins[label] = [round(pad.x + offsetX), round(pad.y + offsetZ)]
  }
  const front = matched.filter(({ component }) => component.side === 'front').map(({ node }) => node.min[1] * 1000)
  output[board.id] = { boundsMm: boundsOf(nodeBounds), topYMm: round(median(front)), pins, source: `public/boards/${board.cad}/manifest.json` }
}
for (const [id, glb] of [['esp32-devkit', 'esp32-devkit-v1-30pin'], ['raspberry-pi-pico', 'raspberry-pi-pico'], ['raspberry-pi-pico-w', 'raspberry-pi-pico-w'], ['raspberry-pi-pico-2', 'raspberry-pi-pico-2']]) {
  output[id] = { boundsMm: boundsOf(loadGlb(glb).nodeBounds), pins: {} }
}
writeFileSync('src/data/board-pin-anchors.json', `${JSON.stringify(output, null, 2)}\n`)
for (const [id, entry] of Object.entries(output)) console.log(id, JSON.stringify(entry.boundsMm), entry.topYMm ?? '-', Object.keys(entry.pins).length)
