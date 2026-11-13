// Derive XIAO ESP32-C3 header pin anchors from the vendored v1.3 KiCad PCB and
// the matching GLB coordinate frame. Run from electronics-learning-demo.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { parseBoardFootprints, transformPadToBoard } from './kicadPadCoordinates.mjs'

const inventoryPath = 'src/data/seeed-xiao-esp32c3.inventory.json'
const outputPath = 'src/data/seeed-xiao-esp32c3.pin-anchors.json'
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'))
const pcbBytes = readFileSync(inventory.sourceFile)
const pcbHash = createHash('sha256').update(pcbBytes).digest('hex')
if (pcbHash !== inventory.sourcePcbSha256) throw new Error('PCB KiCad thay đổi so với hash trong inventory; cần kiểm kê lại trước khi sinh pin anchors.')

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
let parsed
try {
  const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
  const glbBytes = readFileSync('public/models/seeed-xiao-esp32-c3.glb')
  const modelHash = createHash('sha256').update(glbBytes).digest('hex')
  if (modelHash !== inventory.modelSha256) throw new Error('Model GLB thay đổi so với hash trong inventory; cần kiểm kê lại trước khi sinh pin anchors.')
  parsed = parseBoardGlb(glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength))
} finally {
  await server.close()
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const round = (value) => +value.toFixed(4)
const sourceFootprints = parseBoardFootprints(pcbBytes.toString('utf8'))
const byReference = new Map(sourceFootprints.map((footprint) => [footprint.reference, footprint]))
const inventoryByReference = new Map(inventory.components.map((component) => [component.reference, component]))
const matched = parsed.nodeBounds.flatMap((node) => {
  const component = inventoryByReference.get(node.nodeName)
  return component ? [{ node, component }] : []
})
if (matched.length < 20) throw new Error(`GLB/CAD сәйкестендіру хэт бага байна: ${matched.length} mesh`)
const offsetX = median(matched.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
const offsetZ = median(matched.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 - component.y))
if (Math.abs(offsetX) > 0.1 || Math.abs(offsetZ) > 0.1) throw new Error(`GLB/CAD координатын шилжилт хүлээгдээгүй байна: (${offsetX}, ${offsetZ}) mm`)

// KiCad exports the board copper surface from its geometry nodes; component
// bodies begin just above it. Keep the pin anchors on the top copper surface.
const boardGeometry = parsed.nodeBounds.filter((node) => node.nodeName.startsWith('=>['))
const boardTopMm = median(boardGeometry.map((node) => node.max[1] * 1000))
if (!Number.isFinite(boardTopMm) || boardTopMm < 1 || boardTopMm > 2) throw new Error(`Không suy ra được mặt đồng trên PCB từ GLB: ${boardTopMm} mm`)

const sideDefinitions = [
  { side: 'left', headerReference: 'J2', signalNets: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'TX_D6'], labels: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'] },
  { side: 'right', headerReference: 'J1', signalNets: ['RX_D7', 'D8', 'D9', 'D10', 'VCC_3V3', 'GND', 'VUSB'], labels: ['D7', 'D8', 'D9', 'D10', '3V3', 'GND', '5V'] },
]

const headers = sideDefinitions.map((definition) => {
  const footprint = byReference.get(definition.headerReference)
  if (!footprint) throw new Error(`Thiếu footprint ${definition.headerReference} trong PCB`)
  const pins = definition.signalNets.map((netName, index) => {
    const outerNumber = String(index + 1)
    const innerNumber = String(index + 13)
    const outer = footprint.pads.find((pad) => pad.number === outerNumber && pad.net === netName)
    const inner = footprint.pads.find((pad) => pad.number === innerNumber && pad.net === netName)
    if (!outer || !inner) throw new Error(`${definition.headerReference} thiếu pad ${outerNumber}/${innerNumber} thuộc net ${netName}`)
    const outerXY = transformPadToBoard(footprint, outer)
    const innerXY = transformPadToBoard(footprint, inner)
    const boardXmm = round((outerXY[0] + innerXY[0]) / 2 + offsetX)
    const boardZmm = round((outerXY[1] + innerXY[1]) / 2 + offsetZ)
    if (boardXmm < 138 || boardXmm > 159 || boardZmm < 96 || boardZmm > 114) throw new Error(`Anchor ${definition.headerReference}.${outerNumber}/${innerNumber} nằm ngoài outline board: ${boardXmm}, ${boardZmm}`)
    return {
      id: `${definition.headerReference.toLowerCase()}-${index + 1}`,
      side: definition.side,
      position: index + 1,
      headerReference: definition.headerReference,
      padNumber: `${outerNumber}/${innerNumber}`,
      label: definition.labels[index],
      netName,
      xMm: boardXmm,
      zMm: boardZmm,
    }
  })
  return { headerReference: definition.headerReference, side: definition.side, pins }
})

const pins = headers.flatMap((header) => header.pins)
if (pins.length !== 14 || new Set(pins.map((pin) => pin.netName)).size !== 14) throw new Error('Pinout header không đủ 14 net duy nhất')
const output = {
  boardId: 'seeed-xiao-esp32c3',
  revision: inventory.revision,
  sourcePcb: inventory.sourceFile,
  sourcePcbSha256: pcbHash,
  sourceGlb: 'public/models/seeed-xiao-esp32-c3.glb',
  sourceGlbSha256: inventory.modelSha256,
  coordinateDerivation: 'KiCad footprint placement + rotated local pad coordinates; average center of same-net outer/inner half-hole pads; GLB axes x/z aligned to PCB x/y; anchors in metres on top copper surface.',
  glbCadOffsetMm: { x: round(offsetX), z: round(offsetZ) },
  boardTopMm: round(boardTopMm),
  headers,
}
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${outputPath}: ${pins.length} pins; surface Y=${output.boardTopMm} mm; GLB/CAD offset=${JSON.stringify(output.glbCadOffsetMm)} mm`)
