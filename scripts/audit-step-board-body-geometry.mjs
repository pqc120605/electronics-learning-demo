// Compare hash-pinned source STEP PCB-body meshes against isolated PCB nodes in published GLBs.
// This checks conversion/packaging dimensions only; it does not prove a physical board revision.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { createServer } from 'vite'
import { compareStepBodyToModelBounds } from './board-model-audit-utils.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const registry = JSON.parse(readFileSync(join(root, 'scripts/step-board-body-registry.json'), 'utf8'))
const importer = await occtFactory()
const server = await createServer({ root, configFile: join(root, 'vite.config.ts'), logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
const load = (path) => server.ssrLoadModule(path)
let report = []
let failed = false

function boundsFromPositions(values) {
  if (!values || values.length < 3 || values.length % 3 !== 0) throw new Error('Mesh position array is empty or malformed.')
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let index = 0; index < values.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = Number(values[index + axis])
      if (!Number.isFinite(value)) throw new Error('Mesh contains a non-finite vertex.')
      min[axis] = Math.min(min[axis], value)
      max[axis] = Math.max(max[axis], value)
    }
  }
  return { min, max }
}

try {
  const { parseBoardGlb } = await load('/src/components/board/glbParser.ts')
  const registries = await Promise.all([
    '/src/data/esp32DevkitModel.ts',
    '/src/data/arduinoBoardModels.ts',
    '/src/data/raspberryPiBoardModels.ts',
    '/src/data/communityBoardModels.ts',
    '/src/data/adafruitBoardModels.ts',
    '/src/data/seeedBoardModels.ts',
    '/src/data/espressifBoardModels.ts',
  ].map(load))
  const manifests = new Map()
  for (const module of registries) {
    for (const value of Object.values(module)) {
      const rows = Array.isArray(value) ? value : [value]
      for (const row of rows) if (row && typeof row.id === 'string' && Array.isArray(row.scenes)) manifests.set(row.id, row)
    }
  }

  for (const board of registry.boards) {
    try {
      const sourceBytes = readFileSync(join(root, board.sourceFile))
      const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
      if (sourceSha256 !== board.sourceSha256) throw new Error(`Source STEP hash changed (expected ${board.sourceSha256}, got ${sourceSha256}).`)
      const imported = importer.ReadStepFile(new Uint8Array(sourceBytes), { linearUnit: 'millimeter' })
      if (!imported.success || !Array.isArray(imported.meshes)) throw new Error('STEP source could not be imported.')
      const sourceMatches = imported.meshes.filter((mesh) => mesh.name?.trim() === board.sourceBodyMeshName)
      if (sourceMatches.length !== 1) throw new Error(`Expected exactly one STEP mesh named “${board.sourceBodyMeshName}”, found ${sourceMatches.length}.`)
      const sourceBoundsMm = boundsFromPositions(sourceMatches[0].attributes?.position?.array)

      const manifest = manifests.get(board.boardId)
      if (!manifest) throw new Error(`No board model manifest found for “${board.boardId}”.`)
      const scene = manifest.scenes.find((item) => item.id === 'pcb') ?? manifest.scenes.find((item) => item.assetUrl)
      if (!scene?.assetUrl) throw new Error('Board manifest has no GLB scene asset.')
      const assetUrl = scene.assetUrl.split('?')[0]
      const glbBytes = readFileSync(join(root, 'public', assetUrl.replace(/^\//, '')))
      const glbBuffer = glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength)
      const parsed = parseBoardGlb(glbBuffer)
      const modelMatches = parsed.nodeBounds.filter((node) => node.nodeName === board.modelBodyNodeName)
      if (modelMatches.length !== 1) throw new Error(`Expected exactly one GLB node named “${board.modelBodyNodeName}”, found ${modelMatches.length}.`)
      const result = compareStepBodyToModelBounds(sourceBoundsMm, modelMatches[0], board.modelAxisOrder, registry.units.toleranceMeters)
      const sourceSizeMm = sourceBoundsMm.max.map((value, axis) => +(value - sourceBoundsMm.min[axis]).toFixed(6))
      const modelSizeMm = result.actualMeters.map((value) => +(value * 1000).toFixed(6))
      const deltaMm = result.deltaMeters.map((value) => +(value * 1000).toFixed(6))
      const row = { boardId: board.boardId, status: result.status, sourceFile: board.sourceFile, sourceSha256, sourceBodyMeshName: board.sourceBodyMeshName, modelBodyNodeName: board.modelBodyNodeName, sourceSizeMm, modelSizeMm, deltaMm, toleranceMm: +(result.toleranceMeters * 1000).toFixed(6), glbSha256: createHash('sha256').update(glbBytes).digest('hex') }
      report.push(row)
      if (row.status !== 'match') failed = true
      console.log(`${row.status.toUpperCase()} ${row.boardId}: STEP ${row.sourceSizeMm.join(' × ')} mm; GLB ${row.modelSizeMm.join(' × ')} mm; Δ ${row.deltaMm.join(' / ')} mm (tol ${row.toleranceMm} mm)`)
    } catch (error) {
      failed = true
      const row = { boardId: board.boardId, status: 'error', error: error instanceof Error ? error.message : String(error) }
      report.push(row)
      console.error(`ERROR ${row.boardId}: ${row.error}`)
    }
  }
} finally {
  await server.close()
}

console.log(`\nSummary: ${report.filter((row) => row.status === 'match').length}/${registry.boards.length} isolated STEP-to-GLB board-body checks match.`)
console.log('Scope: source-to-model board-body dimensions only; no physical board, footprint, component placement, or revision proof.')
if (failed) process.exitCode = 1
