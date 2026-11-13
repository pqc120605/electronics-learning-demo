import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const boardId = 'seeed-xiao-esp32-s3'
const source = 'assets/boards/vendor/seeed-xiao-esp32s3/source/XIAO-ESP32S3 v2.step'

function bounds(mesh) {
  const position = mesh.attributes.position.array
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let index = 0; index < position.length; index += 3) for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], position[index + axis])
    max[axis] = Math.max(max[axis], position[index + axis])
  }
  return { min, max, center: min.map((value, axis) => (value + max[axis]) / 2), size: min.map((value, axis) => max[axis] - value) }
}

const bytes = await readFile(join(root, source))
const sourceSha256 = createHash('sha256').update(bytes).digest('hex')
const occt = await occtFactory()
const imported = occt.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter' })
if (!imported.success || !Array.isArray(imported.meshes) || imported.meshes.length < 4) throw new Error('Không đọc được STEP XIAO ESP32-S3 hoặc hình học không đầy đủ.')

const boardIndex = imported.meshes.findIndex((mesh) => mesh.name?.trim() === 'SOLID')
const shieldIndex = imported.meshes.findIndex((mesh) => mesh.name?.trim() === 'Shield')
const uflIndex = imported.meshes.findIndex((mesh) => mesh.name?.trim() === 'U.FL-R-SMT-1_10_ v1')
if ([boardIndex, shieldIndex, uflIndex].some((index) => index < 0)) throw new Error('STEP source is missing an explicitly named PCB, shield, or U.FL mesh.')

const groups = [
  { nodeName: 'PCB', sourceName: 'SOLID', meshIndices: [boardIndex] },
  { nodeName: 'RF_SHIELD', sourceName: 'Shield', meshIndices: [shieldIndex] },
  { nodeName: 'UFL_CONNECTOR', sourceName: 'U.FL-R-SMT-1_10_ v1', meshIndices: [uflIndex] },
  {
    nodeName: 'CAD_GEOMETRY_UNIDENTIFIED',
    sourceName: 'CAD feature geometry without verified designators',
    meshIndices: imported.meshes.flatMap((_, index) => [boardIndex, shieldIndex, uflIndex].includes(index) ? [] : [index]),
  },
]
const usedIndices = groups.flatMap((group) => group.meshIndices)
if (new Set(usedIndices).size !== imported.meshes.length) throw new Error('CAD mesh grouping has duplicate or missing source meshes.')

// Source STEP already uses Y as the thickness/up axis expected by the viewer.
// Center by the PCB body. This is a unit rotation and cannot mirror the model.
const boardBounds = bounds(imported.meshes[boardIndex])
const centerMeters = boardBounds.center.map((value) => value / 1000)
const identity = (x, y, z) => [x, y, z]
const parts = groups.map((group) => ({
  name: group.nodeName,
  primitives: group.meshIndices.flatMap((index) => primitivesFromStepMesh(imported.meshes[index], identity, [0.08, 0.12, 0.14], centerMeters)),
}))

const glb = writeGlb(parts, {
  rootName: 'Seeed Studio XIAO ESP32-S3 · manufacturer STEP v2',
  generator: 'Mạch Mở STEP import · OpenCascade',
  extras: {
    sourceFormat: 'STEP', sourceFile: source, sourceSha256, sourceRevision: 'Seeed Studio XIAO ESP32-S3 · official STEP v2',
    sourceUnits: 'mm', outputUnits: 'm',
    modifications: 'STEP converted to GLB; centered at PCB body; source Y-up orientation preserved without reflection; only source-named geometry grouped; unidentified CAD feature meshes left unassigned',
  },
})
const modelSha256 = createHash('sha256').update(glb).digest('hex')
const outputDirectory = join(root, 'public/models')
await mkdir(outputDirectory, { recursive: true })
await writeFile(join(outputDirectory, `${boardId}.glb`), glb)

const nodes = groups.map((group) => ({
  nodeName: group.nodeName, sourceName: group.sourceName, sourceMeshes: group.meshIndices.length,
  sourceMeshNames: group.meshIndices.map((index) => imported.meshes[index].name?.trim() || `Unnamed mesh ${index + 1}`),
}))
const inventory = {
  boardId, revision: 'Seeed Studio XIAO ESP32-S3 · official STEP v2 · regular board (not Sense/Plus)', sourceFile: source,
  sourceSha256, modelSha256, sourceMeshCount: imported.meshes.length, mappedDesignatorCount: 0,
  units: 'mm', transform: 'Source STEP Y-up retained as viewer Y-up; translated by PCB-body center; identity rotation, no reflection.',
  pcbBodySizeMm: boardBounds.size.map((value) => +value.toFixed(4)), nodes,
  pcbBodyBoundsMm: { min: boardBounds.min.map((value) => +value.toFixed(4)), max: boardBounds.max.map((value) => +value.toFixed(4)) },
}
await writeFile(join(root, 'src/data', `${boardId}.mesh-inventory.json`), `${JSON.stringify(inventory, null, 2)}\n`)
console.log(`Wrote public/models/${boardId}.glb: ${imported.meshes.length} source meshes, ${nodes.length} honest groups; STEP SHA256 ${sourceSha256}; GLB SHA256 ${modelSha256}; PCB ${inventory.pcbBodySizeMm.join(' × ')} mm`)
