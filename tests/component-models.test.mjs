import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const glb = (path) => { const bytes = readFileSync(path); return { bytes, buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) } }

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/data/componentModels.ts', '/src/components/board/glbParser.ts', '/src/data/lessonCircuits.ts', '/src/data/componentRegistry.ts', '/src/data/builderLessons.ts', '/src/data/components.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('every part placed in a lesson circuit has a mesh; boards use their own viewers', () => {
  for (const { id } of m.builderLessons) for (const part of m.circuitForLesson(id).placed) {
    if (part.type !== 'board') assert.ok(m.getComponentMesh(part.type), `${id}: ${part.type}`)
  }
})

test('representation levels stay separate facts', () => {
  const led = m.getComponentRepresentations('led')
  assert.equal(led.schematicSymbol, 'specific')
  assert.equal(led.mesh.kind, 'source-cad-mesh')
  const sonar = m.getComponentRepresentations('ultrasonic')
  assert.equal(sonar.schematicSymbol, 'generic')
  assert.equal(sonar.mesh.kind, 'parametric-mesh')
  assert.equal(m.getComponentRepresentations('thermistor').mesh.kind, 'parametric-mesh')
  assert.equal(m.getComponentRepresentations('limit-switch').mesh.kind, 'parametric-mesh')
  assert.match(m.getComponentMesh('thermistor').modelNote, /Không gắn mã B/)
  assert.match(m.getComponentMesh('limit-switch').modelNote, /COM\/NO\/NC/)
})

test('all physical builder parts have an explicit 3D model or an intentional board-viewer route', () => {
  const missing = m.componentRegistry.filter((part) => part.id !== 'board' && !m.getComponentMesh(part.id)).map((part) => part.id)
  assert.deepEqual(missing, [])
})

test('common catalog modules have distinct, explicitly generic 3D models', () => {
  for (const id of ['dht22', 'pir', 'photoresistor-module', 'soil', 'mpu6050', 'bmp280', 'ir-receiver', 'lcd1602', 'rotary-encoder', 'rfid']) {
    const mesh = m.getComponentMesh(id)
    assert.ok(mesh, `${id} should have a locally bundled mesh`)
    assert.equal(mesh.kind, 'parametric-mesh', `${id} must not imply manufacturer CAD`)
    assert.match(mesh.modelNote, /tham khảo|minh họa|không phải/i, `${id} should disclose generic geometry`)
    assert.ok(m.components.some((item) => item.id === id), `${id} should correspond to a catalog record`)
    assert.equal(m.getComponentMeshForCatalog(id).id, id)
  }
  assert.equal(m.getComponentMesh('dht22').id, 'dht22')
  assert.equal(m.getComponentMesh('lcd1602').id, 'lcd1602')
})

test('component GLBs match the manifest and load through the viewer parser', () => {
  for (const part of m.componentRegistry) {
    const mesh = m.getComponentMesh(part.id)
    if (!mesh) continue
    const path = `public${mesh.file}`
    assert.ok(existsSync(path), path)
    const { bytes, buffer } = glb(path)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), mesh.sha256, mesh.id)
    assert.ok(bytes.length < 400 * 1024, `${mesh.id} too large`)
    const { nodeBounds } = m.parseBoardGlb(buffer)
    const size = [0, 1, 2].map((axis) => (Math.max(...nodeBounds.map((node) => node.max[axis])) - Math.min(...nodeBounds.map((node) => node.min[axis]))) * 1000)
    size.forEach((value, axis) => assert.ok(Math.abs(value - mesh.sizeMm[axis]) < 0.05, `${mesh.id} axis ${axis}`))
    assert.ok(Math.max(...size) < 100, `${mesh.id} must be in metres`)
  }
})

test('library meshes record their source; parametric meshes do not claim one', () => {
  for (const part of m.componentRegistry) {
    const mesh = m.getComponentMesh(part.id)
    if (mesh?.kind === 'source-cad-mesh') assert.match(mesh.sourceSha256, /^[a-f0-9]{64}$/)
    if (mesh?.kind === 'parametric-mesh') assert.equal(mesh.sourceFile, undefined)
  }
  const notice = readFileSync('public/models/components/NOTICE.txt', 'utf8')
  assert.match(notice, /CC BY-SA 4\.0/)
  assert.match(notice, /kicad-packages3D/)
  assert.match(m.componentMeshKindLabels['parametric-mesh'], /Minh họa tham số/)
})

test('Pico boards lie flat with the MCU up and are not mirrored', () => {
  for (const [file, mcu, button] of [['raspberry-pi-pico', 'PICO_REF_MICROCONTROLLER', 'PICO_REF_SWITCH'], ['raspberry-pi-pico-w', 'RPI_RP2040', 'TONEPARTS_TP-1221U-K9K5325'], ['raspberry-pi-pico-2', 'rpi_rp2350a', 'toneparts_tp-1221u-k9k5325'], ['raspberry-pi-pico-2-h', 'rpi_rp2350a', 'toneparts_tp-1221u-k9k5325']]) {
    const { nodeBounds } = m.parseBoardGlb(glb(`public/models/${file}.glb`).buffer)
    const size = [0, 1, 2].map((axis) => Math.max(...nodeBounds.map((node) => node.max[axis])) - Math.min(...nodeBounds.map((node) => node.min[axis])))
    assert.ok(size[1] < size[0] && size[0] < size[2], `${file} thin axis must be Y and long axis Z`)
    const center = (name) => nodeBounds.find((node) => node.nodeName === name).center
    const board = nodeBounds.reduce((best, node) => (node.max[0] - node.min[0]) * (node.max[2] - node.min[2]) > (best.max[0] - best.min[0]) * (best.max[2] - best.min[2]) ? node : best)
    assert.ok(center(mcu)[1] > board.center[1], `${file} MCU must face +Y`)
    // Looking down with USB at the top, BOOTSEL sits above and left of the MCU; a mirrored model flips this sign.
    const [dx, , dz] = center(button).map((value, axis) => value - center(mcu)[axis])
    assert.ok(dx * dz > 0, `${file} must not be mirrored`)
  }
})

test('Pico 2 H has a separate locally bundled GLB with the headered board geometry', () => {
  const bytes = readFileSync('public/models/raspberry-pi-pico-2-h.glb')
  const { nodeBounds } = m.parseBoardGlb(glb('public/models/raspberry-pi-pico-2-h.glb').buffer)
  const size = [0, 1, 2].map((axis) => Math.max(...nodeBounds.map((node) => node.max[axis])) - Math.min(...nodeBounds.map((node) => node.min[axis])))
  assert.ok(bytes.length > 100_000)
  assert.ok(bytes.length < 20 * 1024 * 1024)
  assert.ok(size[1] < size[0] && size[0] < size[2], 'board is flat with the documented USB-to-bottom long axis')
  const center = (name) => nodeBounds.find((node) => node.nodeName === name).center
  const board = nodeBounds.reduce((best, node) => (node.max[0] - node.min[0]) * (node.max[2] - node.min[2]) > (best.max[0] - best.min[0]) * (best.max[2] - best.min[2]) ? node : best)
  assert.ok(center('rpi_rp2350a')[1] > board.center[1], 'RP2350 is on the top side')
  const [dx, , dz] = center('toneparts_tp-1221u-k9k5325').map((value, axis) => value - center('rpi_rp2350a')[axis])
  assert.ok(dx * dz > 0, 'BOOTSEL orientation is not mirrored relative to the MCU')
})
