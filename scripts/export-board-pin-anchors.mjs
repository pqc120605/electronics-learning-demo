// Maps Arduino header pads from the CAD manifests into each board GLB's coordinates, and records
// GLB bounds for every board so the 3D layout can place them without loading the model first.
// Run from electronics-learning-demo: node scripts/export-board-pin-anchors.mjs
// Pass an Arduino board ID to refresh just that board in the existing output.
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
await server.close()

const uno = { D0: 'IO0', D1: 'IO1', D2: 'IO2', D3: 'IO3', D4: 'IO4', D5: 'IO5', D6: 'IO6', D7: 'IO7', D8: 'IO8', D9: 'IO9', D10: 'SS', D11: 'MOSI', D12: 'MISO', D13: 'SCK', A0: 'AD0', '5V': '+5V', '3V3': '+3V3', GND: 'GND' }
// Arduino Mega Rev3e labels and corresponding nets from the imported header pads.
const megaDigitalNets = [
  'PE0', 'PE1', 'PE4', 'PE5', 'PG5', 'PE3', 'PH3', 'PH4', 'PH5', 'PH6', 'PB4', 'PB5', 'PB6', 'PB7',
  'TXD3', 'RXD3', 'TXD2', 'RXD2', 'TXD1', 'RXD1', 'SDA', 'SCL',
  'PA0', 'PA1', 'PA2', 'PA3', 'PA4', 'PA5', 'PA6', 'PA7',
  'PC7', 'PC6', 'PC5', 'PC4', 'PC3', 'PC2', 'PC1', 'PC0',
  'PD7', 'PG2', 'PG1', 'PG0', 'PL7', 'PL6', 'PL5', 'PL4', 'PL3', 'PL2', 'PL1', 'PL0',
  'PB3', 'PB2', 'PB1', 'PB0',
]
const boards = [
  { id: 'arduino-uno-r3', glb: 'arduino-uno-r3', cad: 'arduino-uno-r3-rev3', headers: ['IOL0', 'IOH0', 'AD0', 'POWER0'], nets: uno },
  { id: 'arduino-nano-classic', glb: 'arduino-nano-classic', cad: 'arduino-nano-classic', headers: ['J1', 'J2'], nets: { ...Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9, 10].map((pin) => [`D${pin}`, `D${pin}`])), D11: 'D11/MOSI', D12: 'D12/MISO', D13: 'D13/SCK', A0: 'A0', '5V': '+5V', '3V3': '3V3', GND: 'COM' } },
  // Mega digital headers name the AVR port, so the labels below follow the board's documented pin mapping.
  {
    id: 'arduino-mega-2560-r3', glb: 'arduino-mega-2560-r3', cad: 'arduino-mega-2560-r3',
    headers: ['PWML0', 'JP6', 'ADCL0', 'POWER0', 'COMMUNICATION0', 'XIO0', 'ADCH0'],
    // D20/D21 refer to the numbered pads. JP6 also exposes these nets as SDA/SCL reference contacts.
    pinHeaders: { D20: 'COMMUNICATION0', D21: 'COMMUNICATION0' },
    nets: {
      ...Object.fromEntries(megaDigitalNets.map((net, index) => [`D${index}`, net])),
      ...Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`A${index}`, `ADC${index}`])),
      '5V': '+5V', '3V3': '+3V3', GND: 'GND',
    },
  },
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

const outputPath = 'src/data/board-pin-anchors.json'
const selectedId = process.argv[2]
const selectedBoards = selectedId ? boards.filter(board => board.id === selectedId) : boards
if (selectedBoards.length === 0) throw new Error(`Unsupported Arduino board: ${selectedId}`)
const output = selectedId ? JSON.parse(readFileSync(outputPath, 'utf8')) : {}
for (const board of selectedBoards) {
  const { nodeBounds } = loadGlb(board.glb)
  const cad = JSON.parse(readFileSync(`public/boards/${board.cad}/manifest.json`, 'utf8'))
  const byReference = new Map(cad.components.map((component) => [component.reference, component]))
  const matched = nodeBounds.flatMap((node) => { const component = byReference.get(node.nodeName); return component ? [{ node, component }] : [] })
  const offsetX = median(matched.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
  const offsetZ = median(matched.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 - component.y))
  const pads = board.headers.flatMap((reference) => byReference.get(reference)?.pads ?? [])
  const pins = {}
  for (const [label, net] of Object.entries(board.nets)) {
    const header = board.pinHeaders?.[label]
    const sourcePads = header ? byReference.get(header)?.pads ?? [] : pads
    const pad = sourcePads.find((item) => item.netName === net)
    if (!pad) throw new Error(`${board.id}: thiếu pad cho ${label} (${net})`)
    pins[label] = [round(pad.x + offsetX), round(pad.y + offsetZ)]
  }
  const front = matched.filter(({ component }) => component.side === 'front').map(({ node }) => node.min[1] * 1000)
  output[board.id] = { boundsMm: boundsOf(nodeBounds), topYMm: round(median(front)), pins, source: `public/boards/${board.cad}/manifest.json` }
}
if (!selectedId) {
  for (const [id, glb] of [['esp32-devkit', 'esp32-devkit-v1-30pin'], ['raspberry-pi-pico', 'raspberry-pi-pico'], ['raspberry-pi-pico-w', 'raspberry-pi-pico-w'], ['raspberry-pi-pico-2', 'raspberry-pi-pico-2']]) {
    output[id] = { boundsMm: boundsOf(loadGlb(glb).nodeBounds), pins: {} }
  }
}
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
for (const [id, entry] of Object.entries(output)) console.log(id, JSON.stringify(entry.boundsMm), entry.topYMm ?? '-', Object.keys(entry.pins).length)
