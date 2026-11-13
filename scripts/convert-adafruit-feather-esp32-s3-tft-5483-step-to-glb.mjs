import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { writeGlb, primitivesFromStepMesh } from './glb-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const id = 'adafruit-feather-esp32-s3-tft-5483'
const source = 'assets/boards/vendor/adafruit-feather-esp32-s3-tft-5483/5483 Feather ESP32-S3 TFT.step'
const cadFile = 'assets/boards/vendor/adafruit-feather-esp32-s3-tft-5483/Adafruit ESP32-S3 TFT Feather.brd'
const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1] ?? ''
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

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
  return { center: min.map((value, axis) => (value + max[axis]) / 2) }
}

const stepBytes = await readFile(join(root, source))
const cadBytes = await readFile(join(root, cadFile))
const elements = eagleElements(cadBytes.toString('utf8'))
const imported = await (await occtFactory()).ReadStepFile(new Uint8Array(stepBytes), { linearUnit: 'millimeter' })
if (!imported.success || !imported.meshes?.length) throw new Error('Could not import the official Adafruit STEP model.')

// The vendor STEP is Z-up. This proper rotation produces Y-up without reflecting the design.
const rotate = (x, y, z) => [x, z, -y]
const boardBox = bounds(imported.meshes[0])
const boardCenter = boardBox.center
const groups = new Map()
const unassigned = []
for (let index = 0; index < imported.meshes.length; index += 1) {
  const mesh = imported.meshes[index]
  if (index === 0 || mesh.name?.trim() === 'Board') {
    const group = groups.get('PCB') ?? { name: 'PCB', sourceName: mesh.name || 'Board', elements: [], indices: [] }
    group.indices.push(index); groups.set('PCB', group); continue
  }
  const center = bounds(mesh).center
  // Some source packages have an asymmetric STEP origin. Resolve these only
  // when the exact package identity agrees with the product's Eagle CAD.
  const exactPackageElement = elements.find((element) => element.footprint === mesh.name && (
    (mesh.name === 'USB_C_CUSB31-CFM2AX-01-X' && element.reference === 'X3')
    || (mesh.name === 'TFT_1.14IN_240X135_WRAPUNDER' && element.reference === 'DISP1')
  ))
  let nearest
  let distance = Infinity
  for (const element of elements) {
    const candidate = Math.hypot(element.x - center[0], element.y - center[1])
    if (candidate < distance) { distance = candidate; nearest = element }
  }
  if (exactPackageElement) nearest = exactPackageElement
  const exactPackageMatch = Boolean(exactPackageElement)
  if (!nearest || (!exactPackageMatch && distance > 0.015)) { unassigned.push(index); continue }
  const group = groups.get(nearest.reference) ?? { name: nearest.reference, sourceName: mesh.name || nearest.footprint, elements: [nearest], indices: [] }
  group.indices.push(index); groups.set(nearest.reference, group)
}
if (groups.size < 20) throw new Error(`Only ${groups.size - 1} CAD designators mapped; refusing an incomplete export.`)
if (unassigned.length) groups.set('CAD_GEOMETRY_UNIDENTIFIED', { name: 'CAD_GEOMETRY_UNIDENTIFIED', sourceName: 'Unmatched source STEP meshes', elements: [], indices: unassigned })

const parts = [...groups.values()].map((group) => ({
  name: group.name,
  primitives: group.indices.flatMap((index) => primitivesFromStepMesh(imported.meshes[index], rotate, [0.46, 0.49, 0.48], boardCenter.map((value) => value / 1000))),
}))

const output = join(root, 'public/models', `${id}.glb`)
await mkdir(join(root, 'public/models'), { recursive: true })
const modelHash = sha(stepBytes), cadHash = sha(cadBytes)
await writeFile(output, writeGlb(parts, {
  rootName: 'Adafruit Feather ESP32-S3 TFT #5483 · official STEP conversion',
  generator: 'Mạch Mở STEP import · OpenCascade',
  extras: { sourceFormat: 'STEP', sourceFile: source, sourceSha256: modelHash, sourceRevision: 'Adafruit Feather ESP32-S3 TFT #5483 · 4 MB flash · 2 MB PSRAM', sourceUnits: 'mm', outputUnits: 'm', modifications: 'Converted to GLB; STEP meshes grouped by Eagle CAD origin within 0.015 mm; exact Eagle package identity used for asymmetric USB-C and TFT display meshes; rotated Z-up to viewer Y-up and centered without reflection' },
}))

const nodes = [...groups.values()].map((group) => ({
  nodeName: group.name, sourceName: group.sourceName, sourceMeshes: group.indices.length,
  ...(group.elements[0] ? { designator: group.elements[0].reference, value: group.elements[0].value, footprint: group.elements[0].footprint, x: group.elements[0].x, y: group.elements[0].y, rotation: group.elements[0].rotation, side: group.elements[0].side } : {}),
}))
const modelSha256 = createHash('sha256').update(await readFile(output)).digest('hex')
const inventory = { boardId: id, modelSha256, revision: 'Adafruit Feather ESP32-S3 TFT #5483 · 4 MB flash · 2 MB PSRAM', sourceFile: source, boardCadFile: cadFile, sourceSha256: modelHash, boardCadSha256: cadHash, units: 'mm', transform: 'Official STEP Z-up rotated +90° about X to viewer Y-up; translated to board-center origin; no reflection', sourceMeshCount: imported.meshes.length, mappedComponentCount: nodes.filter((node) => node.designator).length, unidentifiedMeshCount: unassigned.length, cadElementCount: elements.length, elements, nodes }
await writeFile(join(root, 'src/data', `${id}.mesh-inventory.json`), `${JSON.stringify(inventory, null, 2)}\n`)
console.log(`Wrote ${output}: ${inventory.mappedComponentCount}/${elements.length} CAD designators with geometry, ${unassigned.length} unidentified STEP meshes; ${imported.meshes.length} input meshes; ${( (await readFile(output)).length / 1048576).toFixed(1)} MB GLB`)
