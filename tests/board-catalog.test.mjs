import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let m
let data
let adafruit
let arduino
let evidence
let catalog
let sources
let raspberryPi
let seeed
let boardProfile

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  m = await server.ssrLoadModule('/src/lib/boardCatalogView.ts')
  ;[data, adafruit, arduino, evidence, catalog, sources, raspberryPi, seeed, boardProfile] = await Promise.all(['/src/data/boardCapabilityRegistry.ts', '/src/data/adafruitBoardModels.ts', '/src/data/arduinoBoardModels.ts', '/src/lib/boardFeatureEvidence.ts', '/src/data/boards.ts', '/src/data/boardModelSources.ts', '/src/data/raspberryPiBoardModels.ts', '/src/data/seeedBoardModels.ts', '/src/components/board/BoardProfile.tsx'].map((path) => server.ssrLoadModule(path)))
})

after(async () => { await server?.close() })

test('board catalog uses 2D copper only for boards with an implemented copper viewer', () => {
  for (const id of ['arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3', 'esp32-devkit']) {
    assert.equal(m.getBoardCatalogView(id, '2d'), '2d')
  }
  for (const id of ['raspberry-pi-pico', 'raspberry-pi-pico-w', 'raspberry-pi-pico-2', 'raspberry-pi-pico-2-h', 'stm32-nucleo']) {
    assert.equal(m.getBoardCatalogView(id, '2d'), '3d')
  }
})

test('board catalog keeps the requested view when it is supported and defaults to 3D for unknown boards', () => {
  assert.equal(m.getBoardCatalogView('arduino-uno-r3', '3d'), '3d')
  assert.equal(m.getBoardCatalogView('unknown-board', '2d'), '3d')
})

test('board links distinguish a viewer, a lookup-only profile and an unknown id', () => {
  const known = new Set(['esp32-devkit', 'esp32-c6-devkitc-1', 'arduino-uno-r3'])
  const viewers = new Set(['esp32-devkit', 'arduino-uno-r3'])
  assert.deepEqual(m.resolveBoardLink('arduino-uno-r3', known, viewers, 'esp32-devkit'), { boardId: 'arduino-uno-r3', status: 'viewer' })
  assert.deepEqual(m.resolveBoardLink('esp32-c6-devkitc-1', known, viewers, 'esp32-devkit'), { boardId: 'esp32-c6-devkitc-1', status: 'lookup' })
  assert.deepEqual(m.resolveBoardLink('khong-co', known, viewers, 'esp32-devkit'), { boardId: 'esp32-devkit', status: 'unknown', requestedId: 'khong-co' })
  assert.deepEqual(m.resolveBoardLink(null, known, viewers, 'esp32-devkit'), { boardId: 'esp32-devkit', status: 'viewer' })
})

test('board support summary states each capability from its own evidence', () => {
  const viewer = data.getBoardSupportSummary('adafruit-feather-esp32-s3-tft-5483')
  assert.match(viewer.model, /CAD/)
  assert.match(viewer.pinout, /28 pad JP1\/JP3 chọn được theo CAD Eagle #5483/)
  assert.match(viewer.simulation, /Chưa/)
  const lookup = data.getBoardSupportSummary('esp32-devkitm-1')
  assert.match(lookup.model, /Chưa có/)
  assert.match(lookup.simulation, /Chưa/)
  const alias = data.getBoardSupportSummary('esp32-c6-devkitc-1')
  assert.match(alias.pinout, /alias/)
  assert.match(alias.simulation, /hành vi/)
  assert.doesNotMatch(alias.simulation, /firmware thật/i)
  assert.match(data.getBoardSupportSummary('stm32-nucleo').pinout, /UM1724/)
  assert.match(data.getBoardSupportSummary('khong-co').model, /Không tìm thấy/)
})

test('unknown board capability never resolves to whichever board is listed first', () => {
  assert.equal(data.getBoardCapability('khong-co').boardId, 'esp32-devkit')
})

test('feature evidence separates source-backed identity, footprints and unidentified meshes', () => {
  const tft = adafruit.adafruitBoardModels.find((model) => model.id === 'adafruit-feather-esp32-s3-tft-5483')
  const label = (id) => evidence.getFeatureEvidence(tft.features.find((feature) => feature.id === id)).labels
  assert.deepEqual(label('cad-disp1'), ['Có nguồn CAD', 'Designator/value trong CAD', 'Có mesh 3D'])
  assert.deepEqual(label('cad-u6'), ['Có nguồn CAD', 'Designator/value trong CAD', 'Footprint/pad, không có mesh'])
  assert.deepEqual(label('cad-cad-geometry-unidentified'), ['Chưa xác minh chức năng', 'Mesh chưa định danh'])
})

test('generic passives keep their CAD identity without claiming a verified role', () => {
  for (const model of adafruit.adafruitBoardModels) {
    for (const feature of model.features) {
      if (/cần đối chiếu|Có footprint CAD|Có vị trí footprint|chưa được xác minh/.test(feature.technicalRole)) assert.equal(feature.roleEvidence, 'unverified', `${model.id} ${feature.name}`)
    }
  }
})

test('board model counts come from the CAD inventory, not the feature list length', () => {
  const tft = adafruit.adafruitBoardModels.find((model) => model.id === 'adafruit-feather-esp32-s3-tft-5483')
  assert.deepEqual(evidence.getBoardModelStats(tft), { withMesh: 37, withoutMesh: 17, otherGroups: 2 })
  const feather = adafruit.adafruitBoardModels.find((model) => model.id === 'adafruit-feather-esp32-s3-5323')
  assert.deepEqual(evidence.getBoardModelStats(feather), { withMesh: 33, withoutMesh: 14, otherGroups: 2 })
  const uno = arduino.arduinoBoardModels.find((model) => model.id === 'arduino-uno-r3')
  assert.equal(evidence.getBoardModelStats(uno).withoutMesh, 87)
})

test('catalog notes repeat the inventory counts and official hosts', () => {
  const note = (id) => catalog.boards.find((board) => board.id === id).modelNote
  assert.match(note('adafruit-feather-esp32-s3-5323'), /33\/47/)
  assert.match(note('adafruit-feather-esp32-s3-tft-5483'), /37\/54/)
  const urls = catalog.boards.flatMap((board) => [board.sourceUrl, board.sourceEvidenceUrl, ...(board.referenceDocs ?? []).map((doc) => doc.url)]).filter(Boolean)
  assert.equal(urls.filter((url) => url.includes('pip.raspberry.com')).length, 0)
})

test('Espressif KiCad library is linked as footprint evidence without claiming a complete board model', () => {
  for (const id of ['esp32-c3-devkitm-1', 'esp32-devkitm-1', 'esp32-s3-devkitc-1']) {
    const board = catalog.boards.find((item) => item.id === id)
    assert.ok(board.referenceDocs?.some((doc) => /KiCad.*Espressif|Espressif.*KiCad/i.test(doc.label)), id)
    assert.match(board.modelNote, /không.*(assembly|board|DevKit)|chưa có.*assembly/i)
  }
})

test('board reference photos include source, creator and a reusable license', () => {
  for (const id of ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3', 'arduino-uno-r4-minima', 'arduino-uno-r4-wifi', 'raspberry-pi-pico', 'raspberry-pi-pico-w', 'raspberry-pi-pico-2', 'stm32-nucleo', 'stm32-blue-pill-f103']) {
    const board = catalog.boards.find((item) => item.id === id)
    assert.ok(board.photos?.length, `${id} should include an illustrative board photo`)
    for (const photo of board.photos) {
      assert.match(photo.src, /^\/board-reference\/[a-z0-9-]+\.(?:jpg|png|webp)$/)
      const imageUrl = new URL(`../public${photo.src}`, import.meta.url)
      assert.ok(existsSync(imageUrl), photo.src)
      const bytes = readFileSync(imageUrl)
      const signature = bytes.subarray(0, 12).toString('hex')
      assert.ok(signature.startsWith('ffd8ff') || signature.startsWith('89504e470d0a1a0a') || (signature.startsWith('52494646') && bytes.subarray(8, 12).toString('ascii') === 'WEBP'), `${photo.src} is a supported image`)
      assert.ok(photo.alt)
      assert.ok(photo.creator)
      assert.ok(photo.sourceUrl.includes('commons.wikimedia.org/wiki/File:'))
      assert.match(photo.licenseUrl, /^https:\/\/creativecommons\.org\/(?:licenses\/|publicdomain\/zero\/1\.0\/)/)
      assert.match(photo.license, /^CC BY(?:-SA)? (?:2|3|4)\.0$|^CC0 1\.0$/)
      assert.ok(photo.variantNote)
      assert.ok(photo.changes)
    }
  }
})

test('board profiles include separately attributed community and exact-variant reference photos', () => {
  const cases = [
    ['esp32-devkit', 'esp32-dev-board-reference.jpg', 'Edwiyanto', 'CC BY-SA 4.0'],
    ['arduino-uno-r3', 'arduino-uno-r3-back-reference.jpg', 'R.hampl', 'CC BY-SA 4.0'],
    ['arduino-nano-classic', 'arduino-nano-bottom-reference.jpg', 'MakeMagazinDE', 'CC BY-SA 4.0'],
    ['arduino-mega-2560-r3', 'arduino-mega-2560-r3-back-reference.jpg', 'Dsimic', 'CC BY-SA 4.0'],
    ['raspberry-pi-pico-2', 'raspberry-pi-pico-2-reference.jpg', 'Suyash Dwivedi', 'CC BY-SA 4.0'],
    ['raspberry-pi-pico-2', 'raspberry-pi-pico-2-bottom-reference.jpg', 'Profpcde', 'CC0 1.0'],
    ['raspberry-pi-pico-w', 'raspberry-pi-pico-w-reference.jpg', 'SparkFun Electronics', 'CC BY 2.0'],
    ['arduino-uno-r4-wifi', 'arduino-uno-r4-wifi-reference.jpg', 'Lomrjyo', 'CC BY-SA 4.0'],
    ['arduino-uno-r4-minima', 'arduino-uno-r4-minima-reference.webp', 'Arduino', 'CC BY-SA 3.0'],
    ['stm32-nucleo', 'stm32-nucleo-f401re-reference.jpg', 'Ordercrazy (Thomas Springer)', 'CC0 1.0'],
    ['stm32-blue-pill-f103', 'stm32-blue-pill-f103-reference.jpg', 'Avandalen', 'CC BY-SA 4.0'],
  ]
  for (const [boardId, filename, creator, license] of cases) {
    const board = catalog.boards.find((item) => item.id === boardId)
    const photo = board.photos?.find((item) => item.src.endsWith(filename))
    assert.ok(photo, `${boardId} should expose ${filename}`)
    assert.equal(photo.creator, creator)
    assert.equal(photo.license, license)
    assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
    assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)), photo.src)
    assert.match(photo.variantNote, /không.*(cùng mẫu|xác nhận|thay thế|board trong CAD)/i)
  }
})

test('board profile renders new reference photos together with attribution, license and variant limits', () => {
  for (const boardId of ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3', 'arduino-uno-r4-minima', 'arduino-uno-r4-wifi', 'raspberry-pi-pico-2', 'raspberry-pi-pico-w', 'stm32-nucleo', 'stm32-blue-pill-f103']) {
    const board = catalog.boards.find((item) => item.id === boardId)
    const html = renderToStaticMarkup(createElement(boardProfile.BoardProfile, { board }))
    assert.match(html, /Ảnh board tham khảo/)
    assert.match(html, /CC BY-SA [234]\.0|CC BY 2\.0|CC0 1\.0/)
    assert.match(html, /commons\.wikimedia\.org\/wiki\/File:/)
    assert.match(html, /không xác nhận|không đại diện|không phải ảnh xác nhận|không dùng để xác nhận/i)
    for (const photo of board.photos) {
      assert.ok(html.includes(photo.src), `${boardId} renders ${photo.src}`)
      assert.ok(html.includes(photo.creator), `${boardId} renders creator ${photo.creator}`)
    }
  }
})

test('board profile makes its image, pinout, datasheet and CAD source links visible to learners', () => {
  const board = catalog.boards.find((item) => item.id === 'seeed-xiao-esp32c3')
  const html = renderToStaticMarkup(createElement(boardProfile.BoardProfile, { board }))
  assert.match(html, /Tài liệu, ảnh và nguồn board/)
  assert.match(html, /Schematic XIAO ESP32-C3 v1\.3/)
  assert.match(html, /KiCad project XIAO ESP32-C3 v1\.3/)
  assert.match(html, /Seeed XIAO Hardware Resources/)
  assert.match(html, /aria-label="Nguồn tham khảo board/)
})

test('Pico 2 H is a distinct official CAD profile with inherited, explicitly scoped J0 pin selection', () => {
  const board = catalog.boards.find((item) => item.id === 'raspberry-pi-pico-2-h')
  const baseBoard = catalog.boards.find((item) => item.id === 'raspberry-pi-pico-2')
  const model = raspberryPi.raspberryPiBoardModels.find((item) => item.id === 'raspberry-pi-pico-2-h')
  const modelEvidence = sources.getBoardModelEvidence('raspberry-pi-pico-2-h')
  const support = data.getBoardSupportSummary('raspberry-pi-pico-2-h')
  assert.ok(board)
  assert.ok(baseBoard)
  assert.ok(model)
  assert.notEqual(board.revision, baseBoard.revision)
  assert.match(board.revision, /Pico 2 H.*SC1632/i)
  assert.equal(board.mcu, 'RP2350')
  assert.equal(board.availability, 'preview')
  assert.match(board.modelNote, /header hàn sẵn|header.*hàn/i)
  assert.match(board.modelNote, /tọa độ chưa đối chiếu Allegro riêng Pico 2 H/i)
  assert.match(board.sourceUrl, /^https:\/\/pip\.raspberrypi\.com\/categories\/1264-/)
  assert.equal(board.cadViewerUrl, '/cad/raspberry-pi-pico-2-h-step-source/rpi_pico2h.step')
  assert.equal(board.cadDownloadUrl, '/cad/raspberry-pi-pico-2-h-step.zip')
  assert.equal(model.pinPicking, true)
  assert.equal(model.pins.length, 40)
  assert.ok(model.pins.every((pin) => pin.headerReference === 'J0'))
  assert.match(model.pinoutEvidence.summary, /layout Pico R3.*Không có Allegro riêng cho Pico 2 H/)
  assert.deepEqual(model.signalFlows, [])
  assert.equal(model.audit.status, 'cad-reference')
  assert.match(model.audit.sourceRefs[0].path, /raspberry-pi-pico-2-h-step-source\/rpi_pico2h\.step$/)
  assert.match(model.audit.sourceRefs[0].license, /MIT/i)
  assert.equal(modelEvidence.status, 'source-verified-cad')
  assert.match(modelEvidence.licenseName, /MIT/)
  assert.match(support.model, /CAD tham chiếu/)
  assert.match(support.pinout, /40 chân J0 có thể chọn trên model/)
  assert.match(support.simulation, /Chưa có profile bài học trong phòng thử/)
  assert.match(support.simulation, /Chưa hỗ trợ chạy firmware cho board này/)
  assert.ok(modelEvidence.noticeUrl)
  assert.ok(existsSync(new URL(`../public${modelEvidence.noticeUrl}`, import.meta.url)))
})

test('Seeed XIAO ESP32-C3 exposes source-backed CAD inventory and a clearly scoped 3D package model', () => {
  const board = catalog.boards.find((item) => item.id === 'seeed-xiao-esp32c3')
  const modelEvidence = sources.getBoardModelEvidence('seeed-xiao-esp32c3')
  const support = data.getBoardSupportSummary('seeed-xiao-esp32c3')
  const pinout = data.getBoardCapability('seeed-xiao-esp32c3').pinMap
  assert.ok(board)
  assert.equal(board.availability, 'preview')
  assert.equal(board.mcu, 'ESP32-C3')
  assert.match(board.revision, /XIAO ESP32-C3.*v1\.3/i)
  assert.match(board.logicLevel, /3\.3 V/)
  assert.match(board.interfaceSummary, /Wi.?Fi/i)
  assert.equal(board.cadViewerUrl, '/models/seeed-xiao-esp32-c3.glb')
  assert.ok(board.referenceDocs?.some((doc) => /schematic/i.test(doc.label)))
  assert.ok(board.referenceDocs?.some((doc) => /pinout/i.test(doc.label)))
  assert.ok(board.referenceDocs?.some((doc) => /hardware resources/i.test(doc.label)))
  assert.ok(board.referenceDocs?.some((doc) => /KiCad project/i.test(doc.label)))
  assert.equal(board.photos?.length, 2)
  for (const photo of board.photos ?? []) {
    assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)), photo.src)
    assert.equal(photo.creator, 'Seeed Studio')
    assert.equal(photo.license, 'CC BY-SA 4.0')
  }
  assert.equal(Object.keys(pinout).filter((key) => /^d\d+$/.test(key)).length, 11)
  assert.equal(pinout.d4.label, 'GPIO6 · SDA · I²C Data')
  assert.equal(pinout.d5.label, 'GPIO7 · SCL · I²C Clock')
  assert.equal(pinout.d10.label, 'GPIO10 · MOSI · SPI Data')
  assert.ok(Object.entries(pinout).filter(([key]) => ['d0', 'd8', 'd9'].includes(key)).every(([, pin]) => pin.sourceBacked))
  assert.equal(data.getBoardSupportSummary('seeed-xiao-esp32c3').pinout, 'Pinout D0–D10 đã chép theo tài liệu Seeed; chưa xác minh bằng board vật lý.')
  assert.match(board.modelNote, /mesh package/i)
  assert.equal(modelEvidence.status, 'educational-reconstruction')
  assert.equal(modelEvidence.published, true)
  assert.match(modelEvidence.licenseName, /CC BY-SA 4\.0/)
  assert.match(support.model, /CAD tham chiếu 3D/)
  assert.match(support.pinout, /Pinout D0–D10 đã chép theo tài liệu Seeed/)
  assert.match(support.simulation, /Chưa có profile bài học trong phòng thử/)
  assert.match(support.simulation, /Chưa hỗ trợ chạy firmware cho board này/)
  const manifest = seeed.seeedBoardModels.find((item) => item.id === board.id)
  assert.ok(manifest)
  assert.equal(manifest.audit.status, 'educational-reconstruction')
  assert.equal(manifest.pinPicking, true)
  assert.equal(manifest.pins.length, 14)
  assert.ok(manifest.pins.every((pin) => pin.headerReference === 'J1' || pin.headerReference === 'J2'))
  assert.equal(manifest.features.filter((feature) => feature.cadFootprint).length, 68)
  assert.ok(manifest.features.some((feature) => feature.designator === 'U4' && /ESP32-C3FH4/.test(feature.cadFootprint.value)))
  assert.ok(manifest.features.some((feature) => feature.designator === 'U4' && feature.cadFootprint.has3dBody))
  assert.ok(manifest.features.some((feature) => feature.designator === 'USB0' && !feature.cadFootprint.has3dBody))
  assert.ok(manifest.hotspots.every((hotspot) => hotspot.nodeNames.length > 0 || manifest.features.find((feature) => feature.id === hotspot.featureId)?.cadFootprint?.has3dBody === false))
})

test('XIAO CAD pad nets join to manufacturer pinout only when the CAD net exactly names a documented D pin', async () => {
  const { getDocumentedPinForNet } = await server.ssrLoadModule('/src/lib/boardPadPinout.ts')
  const { seeedXiaoEsp32C3BoardModel } = await server.ssrLoadModule('/src/data/seeedXiaoEsp32C3BoardModel.ts')
  const pinMap = data.getBoardCapability('seeed-xiao-esp32c3').pinMap
  assert.equal(getDocumentedPinForNet('D0', pinMap).label, 'GPIO2 · ADC1_CH2 · A0')
  assert.equal(getDocumentedPinForNet('d10', pinMap).label, 'GPIO10 · MOSI · SPI Data')
  assert.equal(getDocumentedPinForNet('N$22', pinMap), null)
  assert.equal(getDocumentedPinForNet('GND', pinMap), null)
  assert.equal(getDocumentedPinForNet(null, pinMap), null)
  const auditText = seeedXiaoEsp32C3BoardModel.audit.auditNotes.join(' ')
  const pageText = readFileSync('src/pages/BoardCatalogPage.tsx', 'utf8')
  const readmeText = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  assert.match(auditText, /Fourteen header pin anchors are derived from J1\/J2 pad centers/)
  assert.doesNotMatch(auditText, /not automatically joined to PCB pads/)
  assert.match(pageText, /BoardPinoutExplorer/)
  assert.match(pageText, /Cột pinout được ghép khi tên net CAD khớp chính xác D0–D10/)
  assert.doesNotMatch(pageText, /pinout chưa liên kết tự động với pad PCB/i)
  assert.match(readmeText, /XIAO ESP32-C3/)
  assert.match(readmeText, /14 chân J1\/J2/)
  assert.match(readmeText, /pinout hãng chỉ ghép khi tên net CAD trùng chính xác D0–D10/)
  assert.doesNotMatch(readmeText, /XIAO C3 có pad\/net tra cứu tĩnh nhưng không nối với pinout/i)
})

test('every published CAD model links its bundled notice when the project ships one', () => {
  for (const id of ['seeed-xiao-esp32-s3', 'adafruit-qtpy-esp32-c3-5405', 'adafruit-feather-esp32-s3-5323', 'adafruit-feather-esp32-s3-tft-5483', 'raspberry-pi-pico', 'raspberry-pi-pico-w', 'raspberry-pi-pico-2', 'raspberry-pi-pico-2-h']) {
    const url = sources.getBoardModelEvidence(id).noticeUrl
    assert.ok(url, id)
    assert.ok(existsSync(new URL(`../public${url}`, import.meta.url)), url)
  }
})

test('board model evidence notes are written in Vietnamese for the in-product evidence panel', () => {
  for (const [id, record] of Object.entries(sources.boardModelSources)) {
    assert.match(record.confidenceNote, /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i, `${id} confidence note`)
    for (const issue of record.unresolvedIssues) assert.match(issue, /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừữựýỳỷỹỵ]/i, `${id} unresolved issue`)
  }
})

test('Adafruit QT Py cache version matches the generated GLB bytes', () => {
  const model = adafruit.adafruitBoardModels.find((item) => item.id === 'adafruit-qtpy-esp32-c3-5405')
  const bytes = readFileSync('public/models/adafruit-qtpy-esp32-c3-5405.glb')
  const digest = createHash('sha256').update(bytes).digest('hex')
  assert.equal(model.assetVersion, digest.slice(0, 12))
  assert.match(model.assetUrl, new RegExp(`\\?v=${digest.slice(0, 12)}$`))
})

test('the ESP32 model id used by the lesson page resolves to its board evidence', () => {
  assert.equal(sources.getBoardModelEvidence('esp32-devkit-v1-30pin'), sources.getBoardModelEvidence('esp32-devkit'))
  assert.ok(sources.getBoardModelEvidence('esp32-devkit'))
})
