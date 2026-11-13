// Derive QT Py ESP32-C3 Rev B #5405 breakout-pin anchors from its Eagle board
// CAD and the exact matching STEP-derived GLB. Run from the project root.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const inventoryPath = 'src/data/adafruit-qtpy-esp32-c3-5405.mesh-inventory.json'
const outputPath = 'src/data/adafruit-qtpy-esp32-c3-5405.pin-anchors.json'
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'))
const cadBytes = readFileSync(inventory.boardCadFile)
const glbPath = 'public/models/adafruit-qtpy-esp32-c3-5405.glb'
const glbBytes = readFileSync(glbPath)
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
if (sha256(cadBytes) !== inventory.boardCadSha256) throw new Error('Eagle CAD hash không khớp inventory; cần kiểm kê lại nguồn trước khi sinh anchors.')
if (sha256(glbBytes) !== inventory.modelSha256) throw new Error('GLB hash không khớp inventory; cần cập nhật nguồn/transform trước khi sinh anchors.')

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
let parsed
try {
  const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
  parsed = parseBoardGlb(glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength))
} finally {
  await server.close()
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const round = (value) => +value.toFixed(4)
const cad = cadBytes.toString('utf8')
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))
const packageMatch = cad.match(/<package name="1X07_CASTEL">([\s\S]*?)<\/package>/)
if (!packageMatch) throw new Error('Không tìm thấy package 1X07_CASTEL trong board CAD.')
const packagePads = new Map([...packageMatch[1].matchAll(/<pad name="([^"]+)" x="(-?[\d.]+)" y="(-?[\d.]+)"/g)].map((match) => [match[1], [Number(match[2]), Number(match[3])]]))
const elements = new Map([...cad.matchAll(/<element\b[^>]*>/g)].map((match) => {
  const attrs = attributes(match[0])
  return [attrs.name, attrs]
}))
const padNets = new Map()
for (const match of cad.matchAll(/<signal name="([^"]+)"[^>]*>([\s\S]*?)<\/signal>/g)) {
  for (const contact of match[2].matchAll(/<contactref element="(JP1|JP3)" pad="([^"]+)"/g)) {
    padNets.set(`${contact[1]}.${contact[2]}`, match[1])
  }
}

const headers = [
  { reference: 'JP1', side: 'left', padNumbers: ['1', '2', '3', '4', '5', '6', '7'], labels: ['A0', 'A1', 'A2', 'A3', 'SDA', 'SCL', 'TX'] },
  { reference: 'JP3', side: 'right', padNumbers: ['7', '6', '5', '4', '3', '2', '1'], labels: ['5V', 'GND', '3V3', 'MO', 'MI', 'SCK', 'RX'] },
]
const sourcePins = headers.flatMap((header) => header.padNumbers.map((padNumber, index) => {
  const element = elements.get(header.reference)
  const local = packagePads.get(padNumber)
  const netName = padNets.get(`${header.reference}.${padNumber}`)
  const companionNet = padNets.get(`${header.reference}.${padNumber}C`)
  if (!element || !local || !netName || companionNet !== netName) throw new Error(`CAD không xác nhận đồng nhất pad ${header.reference}.${padNumber}/${padNumber}C.`)
  const position = element.rot?.match(/^R(0|90|180|270)$/)?.[1]
  if (!position) throw new Error(`Góc quay header ${header.reference} không được hỗ trợ: ${element.rot ?? '0'}`)
  const [x, y] = local
  const [rotatedX, rotatedY] = Number(position) === 90 ? [-y, x]
    : Number(position) === 180 ? [-x, -y]
      : Number(position) === 270 ? [y, -x]
        : [x, y]
  return {
    id: `${header.reference.toLowerCase()}-${padNumber}`,
    headerReference: header.reference,
    padNumber,
    side: header.side,
    position: index + 1,
    label: header.labels[index],
    netName,
    xMm: Number(element.x) + rotatedX,
    yMm: Number(element.y) + rotatedY,
  }
}))
if (sourcePins.length !== 14 || new Set(sourcePins.map((pin) => pin.netName)).size !== 14) throw new Error('Pin CAD phải đủ 14 net breakout duy nhất.')

const inventoryByReference = new Map(inventory.nodes.filter((node) => node.designator).map((node) => [node.designator, node]))
const matched = parsed.nodeBounds.flatMap((node) => {
  const component = inventoryByReference.get(node.nodeName)
  return component ? [{ node, component }] : []
})
if (matched.length < 20) throw new Error(`GLB/CAD ghép được quá ít designator: ${matched.length}`)
const offsetX = median(matched.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
// STEP-to-GLB keeps the board from being mirrored; Eagle Y and viewer Z use
// opposite coordinate directions, so GLB Z = offsetZ - Eagle Y.
const offsetZ = median(matched.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 + component.y))
const residuals = matched.map(({ node, component }) => Math.hypot((node.min[0] + node.max[0]) * 500 - component.x - offsetX, (node.min[2] + node.max[2]) * 500 + component.y - offsetZ)).sort((a, b) => a - b)
if (residuals[Math.floor(residuals.length * 0.95)] > 0.01) throw new Error(`Tọa độ component STEP/Eagle không tạo được phép ánh xạ nhất quán; P95 residual ${residuals[Math.floor(residuals.length * 0.95)]} mm`)
const boardNode = parsed.nodeBounds.find((node) => node.nodeName === 'PCB')
if (!boardNode) throw new Error('GLB không có node PCB để xác định mặt đồng trên.')
const boardTopMm = round(boardNode.max[1] * 1000)
if (boardTopMm < 0.5 || boardTopMm > 3) throw new Error(`Mặt trên PCB nằm ngoài phạm vi dự kiến: ${boardTopMm} mm`)

const pins = sourcePins.map(({ yMm, ...pin }) => ({
  ...pin,
  xMm: round(pin.xMm + offsetX),
  zMm: round(offsetZ - yMm),
}))
const bounds = parsed.nodeBounds.reduce((result, node) => {
  for (let axis = 0; axis < 3; axis += 1) {
    result.min[axis] = Math.min(result.min[axis], node.min[axis] * 1000)
    result.max[axis] = Math.max(result.max[axis], node.max[axis] * 1000)
  }
  return result
}, { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] })
for (const pin of pins) {
  if (pin.xMm < bounds.min[0] - 0.2 || pin.xMm > bounds.max[0] + 0.2 || pin.zMm < bounds.min[2] - 0.2 || pin.zMm > bounds.max[2] + 0.2) throw new Error(`Anchor ${pin.id} nằm ngoài bounds GLB.`)
}

const output = {
  boardId: inventory.boardId,
  revision: inventory.revision,
  sourceBoardCad: inventory.boardCadFile,
  sourceBoardCadSha256: inventory.boardCadSha256,
  sourceGlb: glbPath,
  sourceGlbSha256: inventory.modelSha256,
  coordinateDerivation: 'Eagle 1X07_CASTEL package pad centers with element R90/R270 transforms; GLB X maps Eagle X and GLB Z maps inverse Eagle Y using robust median offsets from 35 mapped STEP mesh centers; anchors are in metres on the top of the PCB mesh. CAD pairs N/NC are required to share a net; only the 14 exposed JP1/JP3 pads are included.',
  glbCadOffsetMm: { x: round(offsetX), z: round(offsetZ) },
  boardTopMm,
  headers: headers.map((header) => ({ headerReference: header.reference, pins: pins.filter((pin) => pin.headerReference === header.reference) })),
}
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(`Wrote ${outputPath}: ${pins.length} anchors; PCB top ${boardTopMm} mm; CAD/GLB offset ${JSON.stringify(output.glbCadOffsetMm)}`)
