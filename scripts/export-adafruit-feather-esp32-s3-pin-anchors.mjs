// Derive Adafruit Feather ESP32-S3 breakout anchors from the exact Eagle CAD
// revision and matching STEP-derived GLB. No GPIO/function is inferred here.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const boards = [
  {
    id: 'adafruit-feather-esp32-s3-5323',
    cad: 'assets/boards/vendor/adafruit-feather-esp32-s3-5323/Adafruit ESP32-S3 8MB No PSRAM.brd',
    inventory: 'src/data/adafruit-feather-esp32-s3-5323.mesh-inventory.json',
    glb: 'public/models/adafruit-feather-esp32-s3-5323.glb',
    output: 'src/data/adafruit-feather-esp32-s3-5323.pin-anchors.json',
    headers: [
      { reference: 'JP1', side: 'left', package: '1X16_ROUND', count: 16 },
      { reference: 'JP3', side: 'right', package: '1X12_ROUND', count: 12 },
    ],
  },
  {
    id: 'adafruit-feather-esp32-s3-tft-5483',
    cad: 'assets/boards/vendor/adafruit-feather-esp32-s3-tft-5483/Adafruit ESP32-S3 TFT Feather.brd',
    inventory: 'src/data/adafruit-feather-esp32-s3-tft-5483.mesh-inventory.json',
    glb: 'public/models/adafruit-feather-esp32-s3-tft-5483.glb',
    output: 'src/data/adafruit-feather-esp32-s3-tft-5483.pin-anchors.json',
    headers: [
      { reference: 'JP1', side: 'left', package: '1X16_ROUND_MIN', count: 16 },
      { reference: 'JP3', side: 'right', package: '1X12_ROUND_MIN', count: 12 },
    ],
  },
]

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const round = (value) => +value.toFixed(4)
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))
const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })

try {
  const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
  for (const config of boards) {
    const inventory = JSON.parse(readFileSync(config.inventory, 'utf8'))
    const cadBytes = readFileSync(config.cad)
    const glbBytes = readFileSync(config.glb)
    if (sha256(cadBytes) !== inventory.boardCadSha256) throw new Error(`${config.id}: Eagle CAD hash không khớp inventory.`)
    if (sha256(glbBytes) !== inventory.modelSha256) throw new Error(`${config.id}: GLB hash không khớp inventory.`)
    const cad = cadBytes.toString('utf8')
    const elements = new Map([...cad.matchAll(/<element\b[^>]*>/g)].map((match) => {
      const element = attributes(match[0])
      return [element.name, element]
    }))
    const packagePads = new Map()
    for (const header of config.headers) {
      const match = cad.match(new RegExp(`<package name="${header.package}">([\\s\\S]*?)<\\/package>`))
      if (!match) throw new Error(`${config.id}: không có package ${header.package}.`)
      packagePads.set(header.reference, new Map([...match[1].matchAll(/<pad name="([^\"]+)" x="(-?[\d.]+)" y="(-?[\d.]+)"/g)].map((pad) => [pad[1], [Number(pad[2]), Number(pad[3])]])))
    }
    const padNets = new Map()
    for (const signal of cad.matchAll(/<signal name="([^\"]+)"[^>]*>([\s\S]*?)<\/signal>/g)) {
      for (const contact of signal[2].matchAll(/<contactref element="(JP1|JP3)" pad="([^\"]+)"/g)) {
        const key = `${contact[1]}.${contact[2]}`
        if (padNets.has(key)) throw new Error(`${config.id}: pad ${key} xuất hiện ở nhiều net.`)
        padNets.set(key, signal[1])
      }
    }

    const sourcePins = config.headers.flatMap((header) => {
      const element = elements.get(header.reference)
      const pads = packagePads.get(header.reference)
      if (!element || element.package !== header.package) throw new Error(`${config.id}: package element ${header.reference} không khớp CAD.`)
      const ids = [...pads.keys()].sort((a, b) => Number(a) - Number(b))
      if (ids.length !== header.count) throw new Error(`${config.id}: ${header.reference} phải có ${header.count} pad, thấy ${ids.length}.`)
      const rotation = element.rot ?? 'R0'
      const rotationMatch = rotation.match(/^(M)?R(0|90|180|270)$/)
      if (!rotationMatch) throw new Error(`${config.id}: góc quay ${rotation} chưa hỗ trợ.`)
      const mirrored = Boolean(rotationMatch[1])
      const angle = Number(rotationMatch[2])
      return ids.map((padNumber) => {
        const local = pads.get(padNumber)
        const netName = padNets.get(`${header.reference}.${padNumber}`)
        if (!local || !netName) throw new Error(`${config.id}: thiếu vị trí/net pad ${header.reference}.${padNumber}.`)
        let [x, y] = local
        if (angle === 90) [x, y] = [-y, x]
        else if (angle === 180) [x, y] = [-x, -y]
        else if (angle === 270) [x, y] = [y, -x]
        if (mirrored) x = -x
        return {
          id: `${header.reference.toLowerCase()}-${padNumber}`,
          headerReference: header.reference,
          padNumber,
          side: header.side,
          position: Number(padNumber),
          netName,
          xMm: Number(element.x) + x,
          yMm: Number(element.y) + y,
        }
      })
    })
    if (sourcePins.length !== 28 || new Set(sourcePins.map((pin) => pin.id)).size !== 28) throw new Error(`${config.id}: phải có đủ 28 pad Feather duy nhất.`)

    const parsed = parseBoardGlb(glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength))
    const inventoryByReference = new Map(inventory.nodes.filter((node) => node.designator).map((node) => [node.designator, node]))
    const matched = parsed.nodeBounds.flatMap((node) => {
      const component = inventoryByReference.get(node.nodeName)
      return component ? [{ node, component }] : []
    })
    if (matched.length < 20) throw new Error(`${config.id}: mesh/CAD ghép được quá ít designator (${matched.length}).`)
    let alignmentMatches = matched
    let offsetX = median(alignmentMatches.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
    // STEP conversion keeps X, reverses Eagle Y onto viewer Z and maps the
    // board plane onto viewer X/Z. Use many named mesh centers, not a guess.
    let offsetZ = median(alignmentMatches.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 + component.y))
    const residualFor = ({ node, component }) => Math.hypot((node.min[0] + node.max[0]) * 500 - component.x - offsetX, (node.min[2] + node.max[2]) * 500 + component.y - offsetZ)
    // A small number of vendor mesh bounds (notably the wrapped display and
    // USB shell) are not centered on their Eagle package origin. Exclude only
    // those mesh centers from fitting the transform, never from CAD pin data.
    alignmentMatches = alignmentMatches.filter((match) => residualFor(match) <= 0.015)
    if (alignmentMatches.length < 20) throw new Error(`${config.id}: chỉ còn ${alignmentMatches.length} điểm CAD/GLB đồng tâm sau loại outlier.`)
    offsetX = median(alignmentMatches.map(({ node, component }) => (node.min[0] + node.max[0]) * 500 - component.x))
    offsetZ = median(alignmentMatches.map(({ node, component }) => (node.min[2] + node.max[2]) * 500 + component.y))
    const residuals = matched.map((match) => ({ reference: match.component.designator, error: round(residualFor(match)) })).sort((a, b) => a.error - b.error)
    const p95 = residuals.filter(({ error }) => error <= 0.015).at(Math.floor(alignmentMatches.length * 0.95))?.error ?? 0
    const outlierReferences = residuals.filter(({ error }) => error > 0.015)
    if (p95 > 0.015) throw new Error(`${config.id}: Eagle/GLB transform không ổn định, P95 ${p95} mm.`)
    const pcb = parsed.nodeBounds.find((node) => node.nodeName === 'PCB')
    if (!pcb) throw new Error(`${config.id}: GLB thiếu node PCB.`)
    const boardTopMm = round(pcb.max[1] * 1000)
    const pins = sourcePins.map(({ yMm, ...pin }) => ({ ...pin, xMm: round(pin.xMm + offsetX), zMm: round(offsetZ - yMm), anchorYmm: boardTopMm }))
    const bounds = parsed.nodeBounds.reduce((result, node) => {
      for (let axis = 0; axis < 3; axis += 1) {
        result.min[axis] = Math.min(result.min[axis], node.min[axis] * 1000)
        result.max[axis] = Math.max(result.max[axis], node.max[axis] * 1000)
      }
      return result
    }, { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] })
    for (const pin of pins) {
      if (pin.xMm < bounds.min[0] - 0.2 || pin.xMm > bounds.max[0] + 0.2 || pin.zMm < bounds.min[2] - 0.2 || pin.zMm > bounds.max[2] + 0.2) throw new Error(`${config.id}: anchor ${pin.id} nằm ngoài GLB.`)
    }

    const output = {
      boardId: config.id,
      revision: inventory.revision,
      sourceBoardCad: config.cad,
      sourceBoardCadSha256: inventory.boardCadSha256,
      sourceGlb: config.glb,
      sourceGlbSha256: inventory.modelSha256,
      coordinateDerivation: `28 through-hole breakout pads are transformed from Eagle package centers for JP1/JP3, including ${config.headers.map((header) => `${header.reference} ${elements.get(header.reference).rot ?? 'R0'}`).join(' and ')} transforms. Eagle X/Y are aligned to STEP-derived GLB X/Z using ${alignmentMatches.length} inlier designator mesh centers (P95 residual ${round(p95)} mm); anchors lie on the PCB top plane. Net labels come from the exact board revision; GPIO mappings are maintained separately from the corresponding official Arduino variant.`,
      alignment: { matchedMeshCenters: matched.length, inlierMeshCenters: alignmentMatches.length, p95ResidualMm: round(p95), excludedMeshCenters: outlierReferences },
      glbCadOffsetMm: { x: round(offsetX), z: round(offsetZ) },
      boardTopMm,
      headers: config.headers.map((header) => ({ headerReference: header.reference, side: header.side, pins: pins.filter((pin) => pin.headerReference === header.reference) })),
    }
    writeFileSync(config.output, `${JSON.stringify(output, null, 2)}\n`)
    console.log(`Wrote ${config.output}: ${pins.length} anchors; PCB top ${boardTopMm} mm; ${matched.length} matched CAD/GLB parts; P95 ${round(p95)} mm`)
  }
} finally {
  await server.close()
}
