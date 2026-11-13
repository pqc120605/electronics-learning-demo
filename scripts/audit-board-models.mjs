// Reads every published board GLB through the same parser the viewer uses and checks it
// against its manifest. Reports geometry facts only; a pass does not prove a physical match.
// Run from electronics-learning-demo: node scripts/audit-board-models.mjs [--json out.json]
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { countPinsOutsideBounds, featuresWithoutMesh } from './board-model-audit-utils.mjs'

const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const load = (path) => server.ssrLoadModule(path)
const { parseBoardGlb } = await load('/src/components/board/glbParser.ts')
const { esp32DevkitModel } = await load('/src/data/esp32DevkitModel.ts')
const { arduinoBoardModels } = await load('/src/data/arduinoBoardModels.ts')
const { raspberryPiBoardModels } = await load('/src/data/raspberryPiBoardModels.ts')
const { communityBoardModels } = await load('/src/data/communityBoardModels.ts')
const { adafruitBoardModels } = await load('/src/data/adafruitBoardModels.ts')
const { seeedBoardModels } = await load('/src/data/seeedBoardModels.ts')
const { espressifBoardModels } = await load('/src/data/espressifBoardModels.ts')

// Same transform BoardScene applies to pin anchors in the LED assembly scene.
const sceneAnchor = (scene) => (pin) => scene.id === 'assembly' ? [0.0510577 - pin.anchor[2], pin.anchor[1], pin.anchor[0] - 0.1501492] : pin.anchor

const report = []
const nodeListBoard = process.argv.includes('--nodes') ? process.argv[process.argv.indexOf('--nodes') + 1] : undefined
for (const manifest of [esp32DevkitModel, ...arduinoBoardModels, ...raspberryPiBoardModels, ...communityBoardModels, ...adafruitBoardModels, ...seeedBoardModels, ...espressifBoardModels]) {
  for (const scene of manifest.scenes) {
    const url = scene.assetUrl.split('?')[0]
    const bytes = readFileSync(`public${url}`)
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    const parsed = parseBoardGlb(buffer)
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (const node of parsed.nodeBounds) for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], node.min[axis])
      max[axis] = Math.max(max[axis], node.max[axis])
    }
    const size = max.map((value, axis) => value - min[axis])
    const nodeNames = new Set(parsed.nodeBounds.map((node) => node.nodeName))
    if (nodeListBoard === manifest.id) console.log(`${manifest.id}/${scene.id} node names: ${[...nodeNames].join(' | ')}`)
    const outlineNameCandidates = parsed.nodeBounds.map((node) => node.nodeName).filter((name) => /(?:^|[_\s.-])(pcb|board|substrate|outline)(?:$|[_\s.-])/i.test(name))
    const missing = scene.hotspots.flatMap((hotspot) => hotspot.nodeNames.filter((name) => !nodeNames.has(name)).map((name) => `${hotspot.featureId} → ${name}`))
    const featureIds = new Set(manifest.features.map((feature) => feature.id))
    const hotspotFeatures = new Set(scene.hotspots.map((hotspot) => hotspot.featureId))
    const orphanHotspots = [...hotspotFeatures].filter((id) => !featureIds.has(id))
    const noMesh = featuresWithoutMesh(manifest.features, scene.hotspots, nodeNames)
    const unpickable = scene.hotspots.flatMap((hotspot) => hotspot.nodeNames.filter((name) => {
      const node = parsed.nodeBounds.find((item) => item.nodeName === name)
      return node && Math.max(...node.max.map((value, axis) => value - node.min[axis])) === 0
    }))
    report.push({
      board: manifest.id, scene: scene.id, file: url, sha256: createHash('sha256').update(bytes).digest('hex').slice(0, 12), megabytes: +(bytes.length / 1048576).toFixed(2),
      nodes: parsed.nodeBounds.length, sizeModelUnits: size.map((value) => +value.toFixed(4)), outlineNameCandidates, hotspots: scene.hotspots.length, missingHotspotNodes: missing, orphanHotspots, unpickable, featuresWithoutMesh: noMesh.length,
      pinAnchors: manifest.pins.length, pinPicking: manifest.pinPicking !== false,
      pinAnchorsOutsideBounds: countPinsOutsideBounds(manifest.pins.map(sceneAnchor(scene)), manifest.pinPicking !== false, (anchor) => anchor.some((value, axis) => value < min[axis] - 1e-3 || value > max[axis] + 1e-3)),
    })
  }
}
await server.close()
const out = process.argv.indexOf('--json')
if (out > 0) writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 2))
for (const row of report) console.log(`${row.board}/${row.scene}: ${row.sizeModelUnits.join(' x ')} nodes=${row.nodes} outline-name-candidates=${row.outlineNameCandidates.length ? row.outlineNameCandidates.join(', ') : 'none'} hotspots=${row.hotspots} missing=${row.missingHotspotNodes.length} orphan=${row.orphanHotspots.length} noMeshFeatures=${row.featuresWithoutMesh} pins=${row.pinAnchors} picking=${row.pinPicking} pinsOutside=${row.pinAnchorsOutsideBounds ?? 'n/a'} ${row.megabytes}MB ${row.sha256}`)
for (const row of report) if (row.missingHotspotNodes.length) console.log(`  ${row.board}/${row.scene} missing: ${row.missingHotspotNodes.slice(0, 8).join(' | ')}`)
