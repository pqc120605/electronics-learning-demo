import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const publicFile = (url) => new URL(`../public${decodeURIComponent(url.split('?')[0])}`, import.meta.url)
const MAX_BOARD_GLB_BYTES = 20 * 1024 * 1024

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const paths = ['/src/data/boards.ts', '/src/data/components.ts', '/src/data/componentRegistry.ts', '/src/data/componentReferences.ts', '/src/data/curriculumSchema.ts', '/src/data/learningPath.ts', '/src/data/arduinoBoardModels.ts', '/src/data/raspberryPiBoardModels.ts', '/src/data/adafruitBoardModels.ts', '/src/data/esp32DevkitModel.ts', '/src/data/communityBoardModels.ts', '/src/data/seeedBoardModels.ts', '/src/data/espressifBoardModels.ts', '/src/data/boardModelSources.ts', '/src/lib/boardSelection.ts', '/src/lib/boardFeatureEvidence.ts', '/src/lib/lessonPreflight.ts', '/src/lib/learningProgress.ts', '/src/lib/componentDisplayLabel.ts']
  m = Object.assign({}, ...await Promise.all(paths.map((path) => server.ssrLoadModule(path))))
})

after(async () => { await server?.close() })

const allModels = () => [m.esp32DevkitModel, ...m.arduinoBoardModels, ...m.raspberryPiBoardModels, ...m.adafruitBoardModels, ...m.communityBoardModels, ...m.seeedBoardModels, ...m.espressifBoardModels]
const boardIdOf = (model) => model.id === 'esp32-devkit-v1-30pin' ? 'esp32-devkit' : model.id

test('every board profile names its revision, logic level and a source', () => {
  assert.equal(new Set(m.boards.map((board) => board.id)).size, m.boards.length)
  for (const board of m.boards) {
    for (const key of ['name', 'revision', 'logicLevel', 'interfaceSummary', 'mcu']) assert.ok(board[key], `${board.id} ${key}`)
    assert.ok(board.sourceUrl || board.sourceEvidenceUrl, `${board.id} source`)
  }
})

test('every local CAD, notice and download link in the board catalog exists', () => {
  for (const board of m.boards) for (const url of [board.cadDownloadUrl, board.cadViewerUrl, ...(board.referenceDocs ?? []).map((doc) => doc.url)]) {
    if (url?.startsWith('/')) assert.ok(existsSync(publicFile(url)), `${board.id} ${url}`)
  }
})

test('a board lists each reference link once, so the catalog keys and buttons stay unique', () => {
  for (const board of m.boards) {
    const urls = (board.referenceDocs ?? []).map((doc) => doc.url)
    assert.equal(new Set(urls).size, urls.length, `${board.id} repeats a referenceDocs URL`)
    const evidence = m.getCatalogEvidenceUrl(board)
    if (evidence) assert.ok(!urls.includes(evidence), `${board.id} shows its sourceEvidenceUrl as a second catalog button`)
  }
})

test('viewer manifests stay internally consistent', () => {
  assert.equal(allModels().length, 14, 'all published board manifests must be in the audit set')
  assert.equal(allModels().reduce((count, model) => count + model.scenes.length, 0), 15, 'the 14 board viewers include one separate lesson assembly scene')
  for (const model of allModels()) {
    const boardId = boardIdOf(model)
    const ids = model.features.map((feature) => feature.id)
    assert.equal(new Set(ids).size, ids.length, `${model.id} duplicate feature ids`)
    assert.ok(ids.includes(m.getDefaultBoardFeatureId(boardId)), `${model.id} default feature`)
    assert.ok(m.boards.some((board) => board.id === boardId), `${model.id} has a catalog profile`)
    assert.ok(m.getBoardModelEvidence(boardId)?.published, `${model.id} has published evidence`)
    for (const scene of model.scenes) {
      assert.ok(existsSync(publicFile(scene.assetUrl)), scene.assetUrl)
      for (const hotspot of scene.hotspots) assert.ok(ids.includes(hotspot.featureId), `${model.id} hotspot ${hotspot.id}`)
    }
  }
})

test('Adafruit model URLs change whenever the published GLB changes', () => {
  for (const model of m.adafruitBoardModels) {
    const hash = createHash('sha256').update(readFileSync(publicFile(model.assetUrl))).digest('hex')
    assert.ok(hash.startsWith(model.assetVersion), `${model.id} ${model.assetVersion} is not the GLB hash`)
  }
})

test('a changed board GLB cannot ship without updating the asset lock', () => {
  const lock = JSON.parse(readFileSync(new URL('../src/data/board-asset-lock.json', import.meta.url), 'utf8'))
  for (const model of allModels()) for (const scene of model.scenes) {
    const path = scene.assetUrl.split('?')[0]
    const entry = lock[path]
    assert.ok(entry, `${path} is missing from the lock`)
    assert.equal(createHash('sha256').update(readFileSync(publicFile(path))).digest('hex'), entry.sha256, `${path} changed; bump its version and run scripts/export-board-asset-lock.mjs`)
    assert.equal(scene.assetVersion, entry.version, `${path} version`)
    assert.ok(statSync(publicFile(path)).size <= MAX_BOARD_GLB_BYTES, `${path} exceeds the size budget`)
  }
})

test('every published board model cache version is derived from its locked GLB hash', () => {
  const lock = JSON.parse(readFileSync(new URL('../src/data/board-asset-lock.json', import.meta.url), 'utf8'))
  for (const model of allModels()) for (const scene of model.scenes) {
    const path = scene.assetUrl.split('?')[0]
    assert.equal(scene.assetVersion, lock[path].sha256.slice(0, 12), `${model.id} ${path} cache version must track the GLB`)
    assert.match(scene.assetUrl, new RegExp(`\\?v=${lock[path].sha256.slice(0, 12)}$`), `${model.id} ${path} URL cache version`)
  }
})

test('references state what they cover, so a general guide never reads as verification', () => {
  for (const part of m.components) assert.ok(['exact', 'chip', 'general'].includes(m.getComponentSourceLevel(part.id)), part.id)
  assert.equal(m.getComponentSourceLevel('arduino-uno'), 'exact')
  assert.equal(m.getComponentSourceLevel('mpu6050'), 'chip')
  assert.equal(m.getComponentSourceLevel('buzzer'), 'general')
  assert.equal(m.getComponentSourceLevel('mosfet'), 'general')
  assert.equal(m.getComponentSourceLevel('ir-obstacle'), 'general')
  assert.equal(m.getComponentSourceLevel('esp32-devkit'), 'exact')
  assert.match(m.componentSourceLevels.general.note, /datasheet/)
})

test('every lesson prerequisite is an earlier lesson in the path', () => {
  const order = m.learningPathOrder
  for (const id of order) for (const required of m.getLessonPrerequisiteIds(id)) {
    assert.ok(order.includes(required), `${id} needs unknown ${required}`)
    assert.ok(order.indexOf(required) < order.indexOf(id), `${id} needs later ${required}`)
  }
  assert.deepEqual(m.getLessonPrerequisiteIds('blink'), [])
  assert.deepEqual(m.getLessonPrerequisiteIds('button-led'), ['blink'])
  for (const lesson of m.curriculumLessons) if (lesson.prerequisites[0] !== 'Không cần kiến thức trước') assert.ok(m.getLessonPrerequisiteIds(lesson.id).length, `${lesson.id} has no linked prerequisite`)
})

test('unmet prerequisites ignore lessons already marked complete', () => {
  assert.deepEqual(m.getUnmetPrerequisiteIds('dc-motor-driver', []), ['blink', 'source-led'])
  assert.deepEqual(m.getUnmetPrerequisiteIds('dc-motor-driver', ['blink']), ['source-led'])
  assert.deepEqual(m.getUnmetPrerequisiteIds('blink', []), [])
})

test('lesson part lists come from the circuit and read as component names', () => {
  const summary = m.getLessonPartsSummary('ir-alert')
  assert.match(summary, /Điện trở 220 Ω/)
  assert.match(summary, /Cảm biến hồng ngoại/)
  assert.doesNotMatch(summary, /ir-sensor|resistor/)
  assert.match(m.getLessonPartsSummary('seven-segment-counter'), /× 7/)
  for (const lesson of m.curriculumLessons) if (lesson.components.includes('led')) assert.ok(lesson.components.includes('resistor'), `${lesson.id} lists an LED without its resistor`)
})

test('an old saved LDR workspace still shows the 10 kΩ divider resistor', () => {
  assert.equal(m.getCircuitPartDisplayLabel({ id: 'resistor-ldr-1', type: 'resistor' }, 'Điện trở 220 Ω'), 'Điện trở 10 kΩ')
  assert.equal(m.getCircuitPartDisplayLabel({ id: 'res-1', type: 'resistor' }, 'Điện trở 220 Ω'), 'Điện trở 220 Ω')
})

test('saved checklist entries that no longer exist do not inflate the count', () => {
  assert.deepEqual(m.getKnownChecklistItems(['a', 'cu', 'b'], ['a', 'b', 'c']), ['a', 'b'])
  assert.deepEqual(m.getKnownChecklistItems(undefined, ['a']), [])
})

test('board evidence shown to learners is written in Vietnamese', () => {
  for (const board of m.boards) {
    const evidence = m.getBoardModelEvidence(board.id)
    if (!evidence) continue
    for (const text of [evidence.attribution, evidence.licenseName]) assert.doesNotMatch(text, /\b(retain|preserve|include the|keep the|upstream|meshes|unresolved|may have)\b/i, `${board.id}: ${text}`)
  }
})

test('features without a named source are labelled as teaching descriptions', () => {
  const module = m.esp32DevkitModel.features.find((feature) => feature.id === 'wroom-module')
  assert.ok(m.getFeatureEvidence(module).labels.includes('Mô tả giáo dục'))
})

test('board GLBs keep draw calls and JSON small enough for a phone', () => {
  const lock = JSON.parse(readFileSync(new URL('../src/data/board-asset-lock.json', import.meta.url), 'utf8'))
  for (const path of Object.keys(lock)) {
    const bytes = readFileSync(publicFile(path))
    const length = bytes.readUInt32LE(12)
    const json = JSON.parse(bytes.subarray(20, 20 + length).toString('utf8'))
    const primitives = json.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0)
    assert.ok(primitives <= 1000, `${path} has ${primitives} primitives`)
    assert.ok(length <= 512 * 1024, `${path} JSON chunk is ${length} bytes`)
  }
})
