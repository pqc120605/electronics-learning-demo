import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const boardId = 'adafruit-qtpy-esp32-c3-5405'
const source = 'assets/boards/vendor/adafruit-qtpy-esp32-c3/5405-qtpy-esp32-c3.step'
const boardXml = 'assets/boards/vendor/adafruit-qtpy-esp32-c3/Adafruit QT Py ESP32-C3.brd'
const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1] ?? ''

function eagleElements(xml) {
  const block = xml.match(/<elements>([\s\S]*?)<\/elements>/)?.[1]
  if (!block) throw new Error('Eagle CAD lacks an <elements> block.')
  return [...block.matchAll(/<element\b[^>]*>/g)].map(([tag]) => ({
    reference: attr(tag, 'name'), value: attr(tag, 'value'), footprint: attr(tag, 'package'),
    x: Number(attr(tag, 'x')), y: Number(attr(tag, 'y')),
    rotation: Number((attr(tag, 'rot').match(/\d+/) ?? ['0'])[0]),
    side: attr(tag, 'rot').includes('M') ? 'back' : 'front',
  })).filter((part) => part.reference && Number.isFinite(part.x) && Number.isFinite(part.y))
}

function bounds(mesh) {
  const points = mesh.attributes.position.array
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < points.length; i += 3) for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], points[i + axis]); max[axis] = Math.max(max[axis], points[i + axis])
  }
  return { center: min.map((value, axis) => (value + max[axis]) / 2), size: min.map((value, axis) => max[axis] - value) }
}

const bytes = await readFile(join(root, source))
const xml = await readFile(join(root, boardXml), 'utf8')
const boardCadSha256 = createHash('sha256').update(xml).digest('hex')
const elements = eagleElements(xml)
const importer = await occtFactory()
const result = importer.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter' })
if (!result.success || !result.meshes?.length) throw new Error('Could not import the vendor STEP model.')

// This exact vendor model is Z-up. A +90° X rotation makes board Y point up;
// no axis swap/reflection is used. Center the board origin in the viewer.
const rotate = (x, y, z) => [x / 1000, z / 1000, -y / 1000]
const b = bounds(result.meshes[0])
const boardCenter = b.center
const groups = new Map()
const unassigned = []
for (let index = 0; index < result.meshes.length; index += 1) {
  const mesh = result.meshes[index], box = bounds(mesh)
  if (index === 0 || mesh.name?.trim() === 'Board') {
    groups.set('PCB', { name: 'PCB', sourceName: mesh.name || 'Board', elements: [], indices: [] })
    groups.get('PCB').indices.push(index)
    continue
  }
  // The USB connector's bounding-box center is offset from its Eagle origin;
  // its exact package name in the STEP model is the unambiguous identity.
  let element = mesh.name?.startsWith('USB_C_CUSB31-CFM2AX-01-X') ? elements.find((part) => part.reference === 'X6') : undefined
  let distance = Infinity
  if (!element) {
    for (const candidate of elements) {
      const d = Math.hypot(candidate.x - box.center[0], candidate.y - box.center[1])
      if (d < distance) { distance = d; element = candidate }
    }
    if (distance > 0.015) element = undefined
  }
  if (!element) { unassigned.push(index); continue }
  const group = groups.get(element.reference) ?? { name: element.reference, sourceName: mesh.name || element.footprint, elements: [element], indices: [] }
  group.indices.push(index)
  groups.set(element.reference, group)
}
if (groups.size < 30) throw new Error(`Only ${groups.size - 1} CAD components mapped; refusing to publish an incomplete model.`)
if (unassigned.length) groups.set('CAD_GEOMETRY_UNIDENTIFIED', { name: 'CAD_GEOMETRY_UNIDENTIFIED', sourceName: 'Unnamed or unmatched STEP geometry', elements: [], indices: unassigned })

const parts = [...groups.values()].map((group) => ({
  name: group.name,
  primitives: group.indices.flatMap((index) => primitivesFromStepMesh(
    result.meshes[index],
    (x, y, z) => [x, z, -y],
    [0.46, 0.49, 0.48],
    boardCenter.map((coordinate) => coordinate / 1000),
  )),
}))

const output = join(root, 'public/models', `${boardId}.glb`)
await mkdir(join(root, 'public/models'), { recursive: true })
const glb = writeGlb(parts, { rootName: 'Adafruit QT Py ESP32-C3 Rev B · vendor STEP conversion', generator: 'Mạch Mở STEP import · OpenCascade', extras: { sourceFormat: 'STEP', sourceFile: source, sourceSha256: createHash('sha256').update(bytes).digest('hex'), sourceRevision: 'QT Py ESP32-C3 Rev B · #5405', sourceUnits: 'mm', outputUnits: 'm', modifications: 'STEP mesh grouped by Eagle designator; converted to GLB; geometry centered and rotated without reflection' } })
await writeFile(output, glb)
const modelSha256 = createHash('sha256').update(glb).digest('hex')

const nodes = [...groups.values()].map((group) => ({
  nodeName: group.name, sourceName: group.sourceName, sourceMeshes: group.indices.length,
  ...(group.elements[0] ? { designator: group.elements[0].reference, value: group.elements[0].value, footprint: group.elements[0].footprint, x: group.elements[0].x, y: group.elements[0].y, rotation: group.elements[0].rotation, side: group.elements[0].side } : {}),
}))
const inventory = { boardId, revision: 'Adafruit QT Py ESP32-C3 Rev B · #5405', sourceFile: source, boardCadFile: boardXml, sourceSha256: createHash('sha256').update(bytes).digest('hex'), modelSha256, boardCadSha256, units: 'mm', transform: 'STEP Z-up rotated +90° around X to viewer Y-up; translated to board-center origin; no reflection', sourceMeshCount: result.meshes.length, mappedComponentCount: nodes.filter((node) => node.designator).length, unidentifiedMeshCount: unassigned.length, nodes }
await writeFile(join(root, 'src/data', `${boardId}.mesh-inventory.json`), `${JSON.stringify(inventory, null, 2)}\n`)
console.log(`Wrote ${output}: ${inventory.mappedComponentCount} designator groups, ${unassigned.length} unclassified meshes, ${result.meshes.length} imported meshes; STEP SHA256 ${inventory.sourceSha256}`)
