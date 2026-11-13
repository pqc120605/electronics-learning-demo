import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const manifestUrl = new URL('assets/boards/archive/stm32-bluepill-sinakarvandi/manifest.json', root)
const glbUrl = new URL('assets/boards/archive/stm32-bluepill-sinakarvandi/stm32-bluepill-sinakarvandi.glb', root)
const pcbUrl = new URL('assets/boards/community/stm32-bluepill-sinakarvandi/bluepill_board/bluepill_board.kicad_pcb', root)
const viewerUrl = new URL('src/components/pcb/Pcb2DViewer.tsx', root)
const catalogUrl = new URL('src/pages/BoardCatalogPage.tsx', root)

test('SinaKarvandi custom design remains archived with its source identity and CAD provenance', async () => {
  assert.ok(existsSync(fileURLToPath(manifestUrl)), 'generated 2D CAD manifest must exist')
  assert.ok(existsSync(fileURLToPath(glbUrl)), 'generated 3D GLB must exist')
  assert.ok(existsSync(fileURLToPath(pcbUrl)), 'preserved upstream KiCad board must exist')
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))
  const glb = await readFile(glbUrl)
  assert.equal(manifest.boardId, 'stm32-bluepill-sinakarvandi')
  assert.match(manifest.revision, /SinaKarvandi.*bluepill_board/)
  assert.equal(manifest.units, 'mm')
  assert.ok(manifest.bounds.width > 0 && manifest.bounds.height > 0)
  assert.equal(manifest.components.length, 33)
  assert.equal(new Set(manifest.components.map((component) => component.reference)).size, 33)
  assert.ok(manifest.nets.length >= 10)
  assert.ok(manifest.copperFeatures.some((feature) => feature.kind === 'track'))
  assert.ok(manifest.copperFeatures.some((feature) => feature.kind === 'zone'))
  assert.match(manifest.license, /GPL-3\.0/)
  assert.match(manifest.sourceArchiveSha256, /^[a-f0-9]{64}$/)
  assert.equal(glb.toString('ascii', 0, 4), 'glTF')
  assert.equal(glb.readUInt32LE(4), 2)
  const jsonLength = glb.readUInt32LE(12)
  const gltf = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength))
  const nodeNames = new Set((gltf.nodes ?? []).map((node) => node.name).filter(Boolean))
  for (const reference of ['U1', 'U2', 'J1', 'J2', 'J3', 'J4', 'D1', 'SW1', 'Y1']) {
    assert.ok(nodeNames.has(reference) || (reference === 'J4' && [...nodeNames].some((name) => name.startsWith('629105150521_'))), `${reference} must have a selectable 3D mesh`)
  }
})

test('custom Blue Pill-style model is not exposed as a standard board model', async () => {
  const viewer = await readFile(viewerUrl, 'utf8')
  const catalog = await readFile(catalogUrl, 'utf8')
  const boards = await readFile(new URL('src/data/boards.ts', root), 'utf8')
  const communityModels = await readFile(new URL('src/data/communityBoardModels.ts', root), 'utf8')
  const lesson = await readFile(new URL('src/pages/LessonPage.tsx', root), 'utf8')
  assert.equal(existsSync(fileURLToPath(new URL('public/models/stm32-bluepill-sinakarvandi.glb', root))), false)
  assert.equal(existsSync(fileURLToPath(new URL('public/boards/stm32-bluepill-sinakarvandi/manifest.json', root))), false)
  assert.doesNotMatch(viewer, /stm32-bluepill-sinakarvandi/)
  assert.doesNotMatch(boards, /stm32-bluepill-sinakarvandi/)
  assert.doesNotMatch(catalog, /stm32-bluepill-sinakarvandi/)
  assert.doesNotMatch(lesson, /Custom STM32F103 board · SinaKarvandi/)
  assert.match(communityModels, /communityBoardModels: BoardModelManifest\[\] = \[\]/)
  assert.match(catalog, /Pcb2DViewer/)
  assert.match(catalog, /PCB 2D/)
})

test('Adafruit QT Py ESP32-C3 Rev B publishes the vendor CAD model with source-matched parts and pins', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const loaded = await Promise.all([
      server.ssrLoadModule('/src/data/boards.ts'),
      server.ssrLoadModule('/src/data/boardModelSources.ts'),
      server.ssrLoadModule('/src/data/adafruitBoardModels.ts'),
    ])
    const [catalog, evidence, model] = loaded
    const board = catalog.boards.find((item) => item.id === 'adafruit-qtpy-esp32-c3-5405')
    assert.ok(board, 'the exact vendor board must be listed')
    assert.equal(board.availability, 'preview', 'viewing CAD does not imply lesson simulation support')
    assert.equal(evidence.getBoardModelEvidence(board.id).published, true)
    const manifest = model.adafruitBoardModels.find((item) => item.id === board.id)
    assert.ok(manifest)
    assert.equal(manifest.audit.status, 'cad-reference')
    assert.equal(manifest.pinPicking, true, 'pin picking is enabled only with generated Eagle anchors')
    assert.equal(manifest.pins.length, 14)
    assert.ok(manifest.pins.every((pin) => pin.anchor && pin.headerReference && pin.padNumber))
    assert.ok(manifest.features.length >= 30)
    assert.ok(manifest.features.some((feature) => feature.designator === 'U2' && feature.roleEvidence === 'source-backed'))
    assert.ok(manifest.features.some((feature) => feature.designator === 'X6' && feature.roleEvidence === 'source-backed'))
    assert.ok(manifest.features.some((feature) => feature.designator === 'Q1'))
    const designatorFeatures = manifest.features.filter((feature) => feature.designator)
    assert.ok(designatorFeatures.length >= 30)
    assert.ok(designatorFeatures.every((feature) => feature.cadFootprint?.reference === feature.designator))
    assert.ok(manifest.features.some((feature) => feature.name.includes('chưa định danh') && feature.roleEvidence === 'unverified'))
    assert.ok(manifest.hotspots.every((hotspot) => hotspot.nodeNames.length > 0))
    const glbPath = fileURLToPath(new URL(`public/models/${board.id}.glb`, root))
    assert.ok(existsSync(glbPath))
    const bytes = await readFile(glbPath)
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
    assert.ok(bytes.byteLength < 20 * 1024 * 1024, `the vendor reference should stay below 20 MiB after removing duplicated face buffers; got ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MiB`)
    const length = bytes.readUInt32LE(12)
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + length))
    for (const reference of ['PCB', 'U2', 'X6', 'CONN1', 'LED1', 'Q1', 'Q2']) assert.ok(gltf.nodes.some((node) => node.name === reference), `${reference} must have selectable source mesh`)
    const notice = await readFile(new URL('public/models/adafruit-qtpy-esp32-c3-5405.NOTICE.txt', root), 'utf8')
    assert.match(notice, /CC BY-SA 2\.5/)
    assert.match(notice, /CC BY-SA 3\.0/)
    assert.match(notice, /MIT License/)
    assert.match(notice, /Modifications: STEP converted to GLB/)
  } finally {
    await server.close()
  }
})

test('Adafruit Feather ESP32-S3 PID #5323 exposes CAD mesh, unmeshed footprints, and exact header anchors', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const [catalog, evidence, models, components] = await Promise.all([
      server.ssrLoadModule('/src/data/boards.ts'),
      server.ssrLoadModule('/src/data/boardModelSources.ts'),
      server.ssrLoadModule('/src/data/adafruitFeatherEsp32S3Models.ts'),
      server.ssrLoadModule('/src/data/components.ts'),
    ])
    const id = 'adafruit-feather-esp32-s3-5323'
    const board = catalog.boards.find((item) => item.id === id)
    assert.ok(board)
    assert.equal(board.revision, 'Adafruit Feather ESP32-S3 · PID #5323 · 8 MB flash · no PSRAM')
    assert.equal(board.availability, 'preview', 'a CAD viewer does not imply simulator support')
    assert.equal(evidence.getBoardModelEvidence(id).published, true)
    const manifest = models.adafruitFeatherEsp32S3BoardModel
    assert.equal(manifest.id, id)
    assert.equal(manifest.audit.status, 'cad-reference')
    assert.equal(manifest.pinPicking, true)
    assert.equal(manifest.pins.length, 28)
    assert.ok(manifest.pins.every((pin) => pin.anchor && pin.headerReference && pin.padNumber))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U1' && feature.name.includes('ESP32-S3-MINI-1')))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U4' && feature.name.includes('BME280')))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U1' && feature.cadFootprint?.has3dBody === false), 'the MCU remains a selectable CAD footprint without pretending an unmatched mesh is its body')
    assert.equal(manifest.features.filter((feature) => feature.cadFootprint && !feature.cadFootprint.has3dBody).length, 14)
    assert.ok(manifest.features.some((feature) => feature.name.includes('chưa định danh') && feature.roleEvidence === 'unverified'))
    assert.ok(manifest.hotspots.some((hotspot) => hotspot.featureId === manifest.features.find((feature) => feature.designator === 'JP1').id && hotspot.nodeNames.length === 0))
    const bytes = await readFile(new URL(`public/models/${id}.glb`, root))
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
    const length = bytes.readUInt32LE(12)
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + length))
    for (const reference of ['PCB', 'U2', 'U3', 'X3', 'SW1', 'SW2', 'LED1', 'CAD_GEOMETRY_UNIDENTIFIED']) assert.ok(gltf.nodes.some((node) => node.name === reference), `${reference} should be selectable from the source geometry`)
    const notice = await readFile(new URL(`public/models/${id}.NOTICE.txt`, root), 'utf8')
    assert.match(notice, /CC BY-SA 3\.0/)
    assert.match(notice, /MIT/)
    assert.match(notice, /Modifications: STEP converted to GLB/)
    assert.match(notice, /#5323/)
    assert.ok(components.components.some((part) => part.id === id && part.boardViewerRoute.endsWith(`board=${id}`)))
  } finally {
    await server.close()
  }
})

test('Adafruit Feather ESP32-S3 TFT PID #5483 exposes its exact revision and matching header anchors', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const [catalog, evidence, models, components, selection] = await Promise.all([
      server.ssrLoadModule('/src/data/boards.ts'),
      server.ssrLoadModule('/src/data/boardModelSources.ts'),
      server.ssrLoadModule('/src/data/adafruitFeatherEsp32S3TftModels.ts'),
      server.ssrLoadModule('/src/data/components.ts'),
      server.ssrLoadModule('/src/lib/boardSelection.ts'),
    ])
    const id = 'adafruit-feather-esp32-s3-tft-5483'
    const board = catalog.boards.find((item) => item.id === id)
    assert.ok(board)
    assert.match(board.revision, /#5483.*4 MB.*2 MB PSRAM/)
    assert.equal(board.availability, 'preview', 'the CAD viewer must not imply firmware simulation support')
    assert.equal(evidence.getBoardModelEvidence(id).published, true)
    const manifest = models.adafruitFeatherEsp32S3TftBoardModel
    assert.equal(manifest.id, id)
    assert.equal(manifest.audit.status, 'cad-reference')
    assert.equal(manifest.pinPicking, true)
    assert.equal(manifest.pins.length, 28)
    assert.ok(manifest.pins.every((pin) => pin.anchor && pin.headerReference && pin.padNumber))
    assert.equal(selection.getDefaultBoardFeatureId(id), 'cad-u6', 'select the MCU footprint by default without fabricating a body')
    assert.ok(manifest.features.some((feature) => feature.designator === 'U6' && feature.name.includes('ESP32-S3-MINI-1') && feature.cadFootprint?.has3dBody === false))
    assert.ok(manifest.features.some((feature) => feature.designator === 'DISP1' && feature.name.includes('TFT')))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U4' && feature.name.includes('BME280')))
    assert.ok(manifest.features.some((feature) => feature.name.includes('chưa định danh') && feature.roleEvidence === 'unverified'))
    assert.ok(manifest.hotspots.every((hotspot) => hotspot.nodeNames.length > 0 || manifest.features.find((feature) => feature.id === hotspot.featureId)?.cadFootprint?.has3dBody === false))
    const bytes = await readFile(new URL(`public/models/${id}.glb`, root))
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
    const length = bytes.readUInt32LE(12)
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + length))
    for (const reference of ['PCB', 'DISP1', 'X3', 'CAD_GEOMETRY_UNIDENTIFIED']) assert.ok(gltf.nodes.some((node) => node.name === reference), `${reference} should have selectable source geometry`)
    assert.ok(!gltf.nodes.some((node) => node.name === 'U6'), 'do not invent an MCU package body when the STEP has none')
    const notice = await readFile(new URL(`public/models/${id}.NOTICE.txt`, root), 'utf8')
    assert.match(notice, /CC BY-SA 3\.0/)
    assert.match(notice, /MIT License/)
    assert.match(notice, /#5483/)
    assert.ok(components.components.some((part) => part.id === id && part.boardViewerRoute.endsWith(`board=${id}`)))
  } finally {
    await server.close()
  }
})

test('Seeed XIAO ESP32-S3 regular board publishes its own manufacturer CAD without inferred component identities', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const [catalog, evidence, models, components, references] = await Promise.all([
      server.ssrLoadModule('/src/data/boards.ts'),
      server.ssrLoadModule('/src/data/boardModelSources.ts'),
      server.ssrLoadModule('/src/data/seeedBoardModels.ts'),
      server.ssrLoadModule('/src/data/components.ts'),
      server.ssrLoadModule('/src/data/componentReferences.ts'),
    ])
    const id = 'seeed-xiao-esp32-s3'
    const board = catalog.boards.find((item) => item.id === id)
    assert.ok(board, 'the regular (non-Sense) board must have an exact profile')
    assert.match(board.revision, /XIAO ESP32-S3.*STEP .*v2/i)
    assert.equal(board.availability, 'preview', 'the CAD viewer must not imply lesson simulation support')
    assert.ok(board.photos?.some((photo) => /mặt trên/i.test(photo.label)))
    assert.ok(board.photos?.some((photo) => /mặt dưới/i.test(photo.label)))
    assert.ok(board.referenceDocs?.some((doc) => /pinout|pin map/i.test(doc.label)))
    assert.ok(board.referenceDocs?.some((doc) => /schematic/i.test(doc.label)))
    assert.equal(board.cadDownloadUrl, '/cad/seeed-xiao-esp32-s3.step', 'the source STEP should be downloadable separately from the GLB used by the viewer')
    assert.match(board.cadDownloadLabel, /STEP/i)
    const stepBytes = await readFile(new URL('../public/cad/seeed-xiao-esp32-s3.step', import.meta.url))
    assert.match(stepBytes.toString('ascii', 0, 32), /ISO-10303-21/)
    const { createHash } = await import('node:crypto')
    assert.equal(createHash('sha256').update(stepBytes).digest('hex'), '870ad45c7af5d92324cec4c6ae65fbf86e3b049d5a97ab9ffd9039ebd73455dd')
    const modelEvidence = evidence.getBoardModelEvidence(id)
    assert.equal(modelEvidence.status, 'source-verified-cad')
    assert.equal(modelEvidence.published, true)
    assert.match(modelEvidence.licenseName, /CC BY-SA 4\.0/)
    assert.ok(existsSync(new URL(`../public${modelEvidence.noticeUrl}`, import.meta.url)))

    const manifest = models.seeedBoardModels.find((item) => item.id === id)
    assert.ok(manifest)
    assert.equal(manifest.audit.status, 'cad-reference')
    assert.equal(manifest.pinPicking, true)
    assert.equal(manifest.pins.length, 14)
    assert.ok(manifest.pins.every((pin) => pin.anchor && pin.headerReference && pin.padNumber))
    assert.deepEqual(manifest.signalFlows, [])
    assert.ok(manifest.features.some((feature) => feature.name.includes('PCB') && feature.roleEvidence === 'source-backed'))
    assert.ok(manifest.features.some((feature) => /U\.FL/i.test(feature.name) && feature.roleEvidence === 'source-backed'))
    assert.ok(manifest.features.some((feature) => feature.name.includes('chưa định danh') && feature.roleEvidence === 'unverified'))
    assert.ok(manifest.features.every((feature) => !feature.designator && !feature.cadFootprint), 'do not invent CAD designators or component placement mappings')

    const glb = await readFile(new URL(`../public/models/${id}.glb`, import.meta.url))
    assert.equal(glb.toString('ascii', 0, 4), 'glTF')
    const glbJsonLength = glb.readUInt32LE(12)
    const gltf = JSON.parse(glb.toString('utf8', 20, 20 + glbJsonLength))
    for (const nodeName of ['PCB', 'RF_SHIELD', 'UFL_CONNECTOR', 'CAD_GEOMETRY_UNIDENTIFIED']) assert.ok(gltf.nodes.some((node) => node.name === nodeName), `${nodeName} must be present in the GLB`)
    assert.ok(components.components.some((part) => part.id === id && part.boardViewerRoute.endsWith(`board=${id}`)))
    assert.ok(references.componentReferences[id]?.some((reference) => /datasheet|schematic|pinout/i.test(reference.label)))
    const notice = await readFile(new URL(`../public/models/${id}.NOTICE.txt`, import.meta.url), 'utf8')
    assert.match(notice, /CC BY-SA 4\.0/)
    assert.match(notice, /Seeed Studio/)
    assert.match(notice, /Modifications: STEP converted to GLB/)
  } finally {
    await server.close()
  }
})

test('Seeed XIAO ESP32-C3 publishes source-derived PCB CAD and package-aligned component meshes with attribution', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const [catalog, evidence, models, selection, picker] = await Promise.all([
      server.ssrLoadModule('/src/data/boards.ts'),
      server.ssrLoadModule('/src/data/boardModelSources.ts'),
      server.ssrLoadModule('/src/data/seeedBoardModels.ts'),
      server.ssrLoadModule('/src/lib/boardSelection.ts'),
      server.ssrLoadModule('/src/lib/boardFeatureFiltering.ts'),
    ])
    const id = 'seeed-xiao-esp32c3'
    const board = catalog.boards.find((item) => item.id === id)
    const manifest = models.seeedBoardModels.find((item) => item.id === id)
    assert.ok(board)
    assert.ok(manifest)
    assert.equal(selection.getDefaultBoardFeatureId(id), 'cad-u4')
    assert.equal(evidence.getBoardModelEvidence(id).status, 'educational-reconstruction')
    assert.equal(evidence.getBoardModelEvidence(id).published, true)
    assert.equal(manifest.audit.status, 'educational-reconstruction')
    assert.equal(manifest.features.length, 68, 'include all 68 source PCB footprints, including logo/footprint-only entries')
    assert.ok(manifest.features.filter((feature) => feature.cadFootprint?.has3dBody).length >= 45)
    assert.ok(manifest.features.some((feature) => feature.designator === 'U4' && feature.cadFootprint?.has3dBody))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U1' && feature.cadFootprint?.has3dBody))
    assert.ok(manifest.features.some((feature) => feature.designator === 'USB0' && feature.cadFootprint?.has3dBody === false))
    assert.ok(manifest.features.some((feature) => feature.designator === 'U$2' && /logo/i.test(feature.name) && feature.cadFootprint?.has3dBody === false))
    assert.equal(manifest.pinPicking, true)
    assert.equal(manifest.pins.length, 14, 'XIAO J1/J2 header pin anchors are derived from PCB pad coordinates')
    const mcu = manifest.features.find((feature) => feature.designator === 'U4')
    assert.ok(mcu.cadFootprint.pads.length >= 30, 'preserve source PCB pad numbers and net assignments for the MCU')
    assert.ok(mcu.cadFootprint.pads.every((pad) => typeof pad.number === 'string' && (pad.net === null || typeof pad.net === 'string')))
    assert.ok(mcu.cadFootprint.pads.some((pad) => pad.net), 'the official PCB source contains assigned nets for the MCU')
    assert.match(mcu.connection, /KiCad.*net/i, 'the detail text should identify the source of net data')
    assert.ok(manifest.hotspots.every((hotspot) => hotspot.nodeNames.length > 0 || manifest.features.find((feature) => feature.id === hotspot.featureId)?.cadFootprint?.has3dBody === false))
    const visible = new Set(manifest.hotspots.map((hotspot) => hotspot.featureId))
    assert.equal(picker.getBoardFeaturePickerEntries(manifest.features, visible, true, '').length, 68, 'all CAD footprint records should be selectable from the picker')
    assert.equal(picker.getBoardFeaturePickerEntries(manifest.features, visible, false, '').length, 47, 'mesh-only filter should show only parts with a package body')
    const bytes = await readFile(new URL('public/models/seeed-xiao-esp32-c3.glb', root))
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
    assert.ok(bytes.byteLength < 20 * 1024 * 1024)
    const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)))
    const nodeNames = new Set(gltf.nodes.map((node) => node.name))
    for (const reference of ['C1', 'R1', 'U1', 'U2', 'U4', 'ANT0', 'CHG0']) assert.ok(nodeNames.has(reference), `${reference} needs a matching named mesh`)
    assert.ok(gltf.meshes.length >= 48, 'board, copper, silkscreen and named package meshes should be present')
    assert.ok(!nodeNames.has('USB0'), 'the unverified USB-C package must not be presented as a source-matched body')
    const notice = await readFile(new URL('public/models/seeed-xiao-esp32-c3.NOTICE.txt', root), 'utf8')
    assert.match(notice, /CC BY-SA 4\.0/)
    assert.match(notice, /KiCad.*exception/i)
    assert.match(notice, /Package meshes are reference shapes/i)
  } finally {
    await server.close()
  }
})

test('CAD viewer download labels match the actual file format', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  try {
    const { getCadViewerDownloadLabel } = await server.ssrLoadModule('/src/lib/boardModelDownload.ts')
    assert.equal(getCadViewerDownloadLabel('/models/seeed-xiao-esp32-s3.glb'), 'Tải model GLB')
    assert.equal(getCadViewerDownloadLabel('/cad/board-model.step'), 'Tải STEP gốc')
    assert.equal(getCadViewerDownloadLabel('/cad/board-model.stp?download=1'), 'Tải STEP gốc')
    assert.equal(getCadViewerDownloadLabel('/cad/board-model.zip'), 'Tải gói CAD ZIP')
  } finally {
    await server.close()
  }
})
