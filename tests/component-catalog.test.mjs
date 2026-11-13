import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let components
let registry
let catalogLib
let models
let references
let displayLabel
let lessonCircuits
let bundles
let workspaceSpice

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[components, registry, catalogLib, models, references, displayLabel, lessonCircuits, bundles, workspaceSpice] = await Promise.all([
    server.ssrLoadModule('/src/data/components.ts'),
    server.ssrLoadModule('/src/data/componentRegistry.ts'),
    server.ssrLoadModule('/src/lib/componentCatalog.ts'),
    server.ssrLoadModule('/src/data/componentModels.ts'),
    server.ssrLoadModule('/src/data/componentReferences.ts'),
    server.ssrLoadModule('/src/lib/componentDisplayLabel.ts'),
    server.ssrLoadModule('/src/data/lessonCircuits.ts'),
    server.ssrLoadModule('/src/lib/projectBundle.ts'),
    server.ssrLoadModule('/src/lib/workspaceSpice.ts'),
  ])
})

test('new generic components link to scoped learning references without claiming a specific module pinout', () => {
  for (const id of ['rgb-led', 'ir-obstacle', 'dc-supply', 'slide-switch', 'rp2350-pico-2-h']) {
    const refs = references.getComponentReferences(id)
    assert.ok(refs.length, `${id} has at least one reference`)
    assert.ok(refs.every((ref) => ref.note.trim().length > 12 && /^https:\/\//.test(ref.url)))
  }
  assert.match(references.getComponentReferences('ir-obstacle').map((ref) => ref.note).join(' '), /không xác nhận|không xác minh/i)
  assert.match(references.getComponentReferences('rp2350-pico-2-h').map((ref) => ref.note).join(' '), /SC1632|Pico 2 H/)
})

test('common sensor, actuator and power parts have relevant learning sources with hardware caveats', () => {
  for (const id of ['ntc', 'hc-sr04', 'pir', 'servo', 'dc-motor', 'mosfet', 'relay', 'lcd1602', 'neopixel', 'photoresistor-module', 'soil', 'ir-receiver', 'diode', 'transistor-bjt', 'soil-relay-pump', 'buck', 'boost']) {
    const refs = references.getComponentReferences(id)
    assert.ok(refs.length > 0, `${id} has a learning source`)
    assert.ok(refs.every((ref) => /^https:\/\//.test(ref.url) && ref.note.trim().length > 20), `${id} source is linked and scoped`)
  }
  assert.match(references.getComponentReferences('photoresistor-module')[0].note, /không xác nhận/i)
  assert.match(references.getComponentReferences('mosfet').map((ref) => ref.note).join(' '), /không xác nhận/i)
})

test('HC-SR04 reference photo is local, attributed and scoped to a compatible module', () => {
  const photos = references.getComponentReferences('hc-sr04').flatMap((reference) => reference.photos ?? [])
  assert.equal(photos.length, 1)
  const photo = photos[0]
  assert.equal(photo.src, '/component-reference/hc-sr04-reference.jpg')
  assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)))
  assert.equal(photo.creator, 'Suyash Dwivedi')
  assert.equal(photo.license, 'CC BY-SA 4.0')
  assert.match(photo.scopeNote, /compatible|tương thích/i)
  assert.match(photo.changes, /1200 px|nén/i)
})

test('XIAO ESP32-C3 library shows official pinout diagrams with their share-alike attribution', () => {
  const photos = references.getComponentReferences('seeed-xiao-esp32c3').flatMap((reference) => reference.photos ?? [])
  assert.equal(photos.length, 2)
  assert.deepEqual(photos.map((photo) => photo.src), [
    '/board-reference/seeed-xiao-esp32c3-front.png',
    '/board-reference/seeed-xiao-esp32c3-back.png',
  ])
  for (const photo of photos) {
    assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)))
    assert.equal(photo.creator, 'Seeed Studio')
    assert.equal(photo.license, 'CC BY-SA 4.0')
    assert.equal(photo.licenseUrl, 'https://wiki.seeedstudio.com/License/')
    assert.ok(photo.scopeNote.length > 20)
  }
})

test('common beginner components show locally bundled, scoped reference photos with attribution', () => {
  for (const id of ['resistor', 'led', 'potentiometer', 'button', 'ldr', 'capacitor', 'electrolytic', 'breadboard']) {
    const photos = references.getComponentReferences(id).flatMap((reference) => reference.photos ?? [])
    assert.ok(photos.length, `${id} includes a reference photo near its explanation`)
    for (const photo of photos) {
      assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)), `${id}: ${photo.src}`)
      assert.ok(photo.creator)
      assert.ok(photo.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'))
      assert.ok(photo.license)
      assert.ok(photo.licenseUrl.startsWith('https://'))
      assert.ok(photo.scopeNote.length > 20)
      assert.ok(photo.changes.length > 8)
    }
  }
})

test('additional common parts show local, licensed reference photos with model-specific caveats', () => {
  const photoById = (id) => references.getComponentReferences(id).flatMap((reference) => reference.photos ?? [])
  for (const id of ['ntc', 'diode', 'transistor-bjt', 'servo', 'dc-motor', 'relay', 'buzzer', 'jumper']) {
    const photos = photoById(id)
    assert.ok(photos.length, `${id} includes a reference photo near its explanation`)
    for (const photo of photos) {
      const path = new URL(`../public${photo.src}`, import.meta.url)
      assert.ok(existsSync(path), `${id}: ${photo.src}`)
      assert.ok(photo.creator)
      assert.ok(photo.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'))
      assert.ok(photo.license)
      assert.ok(photo.licenseUrl.startsWith('https://'))
      assert.ok(photo.scopeNote.length > 20)
      assert.ok(photo.changes.length > 8)
    }
  }
  assert.match(photoById('ntc').map((photo) => photo.scopeNote).join(' '), /đường cong|mã.*thật/i)
  assert.match(photoById('diode').map((photo) => photo.scopeNote).join(' '), /mã.*thật|không xác nhận/i)
  assert.match(photoById('transistor-bjt').map((photo) => photo.scopeNote).join(' '), /chân|pinout/i)
  assert.match(photoById('servo').map((photo) => photo.scopeNote).join(' '), /SG90|SKU|clone/i)
  assert.match(photoById('dc-motor').map((photo) => photo.scopeNote).join(' '), /mã|dòng|công suất/i)
  assert.match(photoById('relay').map((photo) => photo.scopeNote).join(' '), /Grove|module|không phải/i)
  assert.match(photoById('buzzer').map((photo) => photo.scopeNote).join(' '), /6 V|6V|active|chủ động/i)
  assert.match(photoById('jumper').map((photo) => photo.scopeNote).join(' '), /màu dây|dòng|dây thật/i)
})

test('selected representative module sources identify exact product variants and mismatches', () => {
  const refs = (id) => references.getComponentReferences(id)
  assert.match(refs('ir-obstacle').map((ref) => ref.label + ' ' + ref.note).join(' '), /Grove.*Infrared Reflective Sensor.*v1\.2|active LOW/i)
  assert.match(refs('ir-obstacle').map((ref) => ref.note).join(' '), /đã ngừng bán/)
  assert.match(components.components.find((item) => item.id === 'ir-obstacle').caution, /Grove v1\.2.*active LOW/i)
  assert.match(refs('buck').map((ref) => ref.label + ' ' + ref.note).join(' '), /D24V5F5.*2843/i)
  assert.match(refs('boost').map((ref) => ref.label + ' ' + ref.note).join(' '), /U3V16F5.*4941/i)
  assert.match(refs('motor-driver').map((ref) => ref.label).join(' '), /Adafruit.*2448|TB6612.*breakout/i)
  assert.match(refs('relay').map((ref) => ref.label + ' ' + ref.note).join(' '), /Grove Relay.*103020005|thấp áp/i)
  assert.match(refs('oled').map((ref) => ref.label).join(' '), /Adafruit.*326/)
  assert.match(refs('lcd1602').map((ref) => ref.note).join(' '), /không phải.*PCF8574|khác.*PCF8574/i)
})

test('every catalog entry has a scoped source or datasheet link', () => {
  for (const component of components.components) {
    const refs = references.getComponentReferences(component.id)
    assert.ok(refs.length > 0, `${component.id} has a source`)
    assert.ok(refs.every((ref) => /^https:\/\//.test(ref.url) && ref.label.trim() && ref.note.trim().length > 20), `${component.id} sources state their scope`)
  }
})

test('resistor variants resolve from legacy part values without rewriting circuit data', () => {
  const circuit = lessonCircuits.circuitForLesson('blink')
  const legacy = {
    ...circuit, schemaVersion: 4, lesson: 'blink', simBoard: 'esp32-devkit',
    placed: circuit.placed.map(part => part.type === 'resistor' ? { ...part, value: '220 Ω' } : part),
  }
  const before = JSON.stringify(legacy)
  const legacyResistor = legacy.placed.find(part => part.type === 'resistor')
  const known = catalogLib.resolveResistorVariant(legacyResistor)
  assert.equal(known.status, 'known')
  assert.equal(known.variant.id, 'resistor-220ohm')
  assert.equal(known.variant.revision, 1)
  assert.deepEqual(known.nominal, { value: 220, unit: 'ohm' })
  assert.equal(known.bomKey, 'resistor:ohm:220')
  assert.equal(known.variant.spiceLiteral, '220')
  assert.equal(known.variant.physical.tolerancePercent, null)
  assert.equal(JSON.stringify(legacy), before)
  const bundle = bundles.createProjectBundle({ workspace: legacy, lessonDrafts: {}, branchSession: {}, branchDrafts: {} })
  const reopened = bundles.parseProjectBundle(JSON.parse(JSON.stringify(bundle))).workspace
  assert.deepEqual(reopened.placed.find(part => part.id === legacyResistor.id), legacyResistor)
  assert.deepEqual(reopened.wires, legacy.wires)
  const model = catalogLib.getCatalogModel('resistor')
  assert.equal(model.label, 'Điện trở 220 Ω')
  assert.deepEqual(model.pins.map(({ id, electricalType, polarity }) => [id, electricalType, polarity]), [
    ['a', 'passive', undefined], ['b', 'passive', undefined],
  ])
  assert.deepEqual(catalogLib.resolveComponentLink('resistor', ['led', 'resistor']), { id: 'resistor', status: 'found' })

  const ldr = lessonCircuits.circuitForLesson('analog-ldr').placed.find(part => part.id === 'resistor-ldr-1')
  for (const value of [ldr.value, '10000 Ω', '10kΩ']) {
    const resolved = catalogLib.resolveResistorVariant({ ...ldr, value })
    assert.equal(resolved.status, 'known')
    assert.equal(resolved.rawValue, value)
    assert.equal(resolved.variant.id, 'resistor-10000ohm')
    assert.equal(resolved.variant.spiceLiteral, '10k')
    assert.deepEqual(resolved.nominal, { value: 10000, unit: 'ohm' })
    assert.equal(resolved.bomKey, 'resistor:ohm:10000')
  }
})

test('catalog keeps missing, unsupported, custom and invalid resistor values distinct', () => {
  for (const [input, status, reason] of [
    [{}, 'unknown', 'missing-value'],
    [{ value: '220 Ω', variantId: 'resistor-unknown' }, 'unknown', 'unknown-variant'],
    [{ value: '330 Ω' }, 'custom', 'unlisted-nominal'],
    [{ value: '5 V' }, 'invalid', 'invalid-resistance'],
    [{ value: '0 Ω' }, 'invalid', 'invalid-resistance'],
    [{ value: '-220 Ω' }, 'invalid', 'invalid-resistance'],
    [{ value: '10 kΩ', variantId: 'resistor-220ohm' }, 'invalid', 'variant-value-mismatch'],
  ]) {
    const actual = catalogLib.resolveResistorVariant({ type: 'resistor', ...input })
    assert.equal(actual.status, status, JSON.stringify(input))
    assert.equal(actual.reason, reason)
    assert.equal(actual.rawValue, input.value)
    assert.equal(actual.requestedVariantId, input.variantId)
    if (status === 'custom') assert.deepEqual(actual.nominal, { value: 330, unit: 'ohm' })
    else assert.equal(actual.bomKey, undefined)
  }
})

test('resistor catalog keeps provenance and evidence independent by context', () => {
  const part = { type: 'resistor', value: '10 kΩ' }
  const mesh = catalogLib.resolveResistorVariant(part, { assetStatus: 'verified', lessonId: 'analog-ldr', analogModelAvailable: true })
  assert.equal(mesh.variant.source.lessonId, 'analog-ldr')
  assert.equal(mesh.variant.source.partId, 'resistor-ldr-1')
  assert.deepEqual(mesh.variant.physical, {
    status: 'unknown', tolerancePercent: null, mpn: null, sku: null, package: null,
    material: null, powerWatts: null, voltageVolts: null, footprintId: null, pinPadMap: null,
  })
  assert.equal(mesh.contexts.geometry.status, 'reference-only')
  assert.equal(mesh.contexts.geometry.representation, 'mesh')
  assert.equal(mesh.contexts.geometry.assetPath, '/models/components/resistor.glb')
  assert.equal(mesh.contexts.lesson.status, 'documented-example')
  assert.equal(mesh.contexts.analog.status, 'ideal-model-available')
  assert.equal(mesh.contexts.physical.status, 'unknown')
  for (const assetStatus of ['missing', 'hash-mismatch']) {
    const fallback = catalogLib.resolveResistorVariant(part, { assetStatus, analogModelAvailable: false })
    assert.equal(fallback.variant.id, mesh.variant.id)
    assert.deepEqual(fallback.pinIds, ['a', 'b'])
    assert.equal(fallback.contexts.geometry.representation, 'symbol')
    assert.equal(fallback.contexts.geometry.status, 'reference-only')
    assert.equal(fallback.contexts.analog.reason, 'analog-model-missing')
  }
  assert.equal(catalogLib.resolveResistorVariant({ type: 'resistor' }, { analogModelAvailable: true }).contexts.analog.status, 'unknown')
})

test('SPICE legacy fallback stays an assumption, while catalog identity stays unknown', () => {
  const resistor = { id: 'r', type: 'resistor' }
  const input = {
    boardLogicLevel: '3.3 V',
    parts: [{ id: 'supply', type: 'battery', value: '5 V' }, resistor],
    connections: [
      { id: 'supply-r', from: { partId: 'supply', pinId: 'positive' }, to: { partId: 'r', pinId: 'a' } },
      { id: 'r-return', from: { partId: 'r', pinId: 'b' }, to: { partId: 'supply', pinId: 'negative' } },
    ],
  }
  const legacy = workspaceSpice.compileWorkspaceSpice(input)
  assert.equal(legacy.ok, true, legacy.issues?.join('\n'))
  assert.match(legacy.netlist, /^R1 .+ 220$/m)
  assert.match(legacy.assumptions.join('\n'), /dùng trị số mặc định từ tên linh kiện \(220\)/)
  assert.equal(catalogLib.resolveResistorVariant(resistor).status, 'unknown')
  assert.equal(Object.hasOwn(resistor, 'value'), false)
  for (const [value, literal] of [['220 Ω', '220'], ['10 kΩ', '10k']]) {
    const explicit = { ...resistor, value }
    const result = workspaceSpice.compileWorkspaceSpice({ ...input, parts: [input.parts[0], explicit] })
    assert.equal(result.ok, true, result.issues?.join('\n'))
    assert.equal(result.netlist.split('\n').find(line => line.startsWith('R1 ')).split(' ').at(-1), literal)
    assert.equal(catalogLib.resolveResistorVariant(explicit).variant.spiceLiteral, literal)
  }
})

test('the LDR lesson labels its fixed resistor as 10 kΩ in all builder views', () => {
  const part = lessonCircuits.circuitForLesson('analog-ldr').placed.find((item) => item.id === 'resistor-ldr-1')
  assert.equal(part.value, '10 kΩ')
  assert.equal(displayLabel.getCircuitPartDisplayLabel(part, 'Điện trở 220 Ω'), 'Điện trở 10 kΩ')
  assert.equal(displayLabel.getCircuitPartDisplayLabel({ ...part, id: 'res-1', value: undefined }, 'Điện trở 220 Ω'), 'Điện trở 220 Ω')
})

after(async () => { await server?.close() })

test('catalog distinguishes the HC-SR04 ultrasonic sensor from a mechanical limit switch', () => {
  const sonar = components.components.find((item) => item.id === 'hc-sr04')
  const limitSwitch = components.components.find((item) => item.id === 'limit-switch')
  assert.match(sonar.name, /HC-SR04/i)
  assert.match(sonar.pins, /TRIG.*ECHO/i)
  assert.match(limitSwitch.name, /công tắc hành trình/i)
  assert.match(limitSwitch.pins, /COM.*NO.*NC/i)

  const sonarModel = registry.componentRegistry.find((item) => item.catalogId === 'hc-sr04')
  const limitSwitchModel = registry.componentRegistry.find((item) => item.catalogId === 'limit-switch')
  assert.ok(sonarModel.pins.some((pin) => pin.id === 'trig'))
  assert.deepEqual(limitSwitchModel.pins.map((pin) => pin.id), ['com', 'no', 'nc'])
  assert.equal(limitSwitchModel.simulation, 'visual-only')
})

test('component catalog records and catalog mappings use unique identities', () => {
  const ids = components.components.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
  const catalogIds = registry.componentRegistry.flatMap((item) => item.catalogId ? [item.catalogId] : [])
  assert.equal(new Set(catalogIds).size, catalogIds.length)
})

test('module MOSFET is not identified as a relay', () => {
  const mosfetModule = components.components.find((item) => item.id === 'mosfet-module')
  assert.match(mosfetModule.name, /MOSFET/i)
  assert.match(mosfetModule.pins, /SIG/)
  assert.equal(components.components.some((item) => item.id === 'relay-module'), false)
})

test('workspace parts map to a catalog record of the same physical identity', () => {
  const nameOf = (type) => components.components.find((item) => item.id === registry.componentRegistry.find((part) => part.id === type).catalogId)?.name
  assert.match(nameOf('ir-sensor'), /hồng ngoại/i)
  assert.match(nameOf('rgb-led'), /RGB 4 chân/)
  assert.match(nameOf('battery'), /Nguồn DC/)
  assert.match(nameOf('slide-switch'), /Công tắc gạt/)
  for (const part of registry.componentRegistry) assert.ok(part.catalogId, `${part.id} has a catalog record`)
})

test('catalog records do not borrow a model from a different component', () => {
  assert.equal(catalogLib.getCatalogModel('capacitor'), undefined)
  assert.equal(catalogLib.getCatalogModel('electrolytic').id, 'capacitor')
  assert.equal(catalogLib.getCatalogModel('neopixel'), undefined)
  assert.equal(catalogLib.getCatalogModel('photoresistor-module'), undefined)
  assert.equal(catalogLib.getCatalogModel('power-bank'), undefined)
  assert.equal(models.getComponentMeshForCatalog('capacitor'), undefined)
  assert.equal(models.getComponentMeshForCatalog('electrolytic').id, 'capacitor')
  assert.equal(models.getComponentMeshForCatalog('neopixel'), undefined)
  assert.equal(models.getComponentMeshForCatalog('ir-obstacle').id, 'ir-sensor')
  assert.equal(models.getComponentMeshForCatalog('photoresistor-module').id, 'photoresistor-module')
})

test('component links report a missing id', () => {
  const ids = components.components.map((item) => item.id)
  assert.deepEqual(catalogLib.resolveComponentLink('led', ids), { id: 'led', status: 'found' })
  assert.deepEqual(catalogLib.resolveComponentLink(null, ids), { id: ids[0], status: 'default' })
  assert.deepEqual(catalogLib.resolveComponentLink('khong-co', ids), { id: ids[0], status: 'unknown', requestedId: 'khong-co' })
})

test('every board record in the catalog opens its own board page', () => {
  const route = (id) => components.components.find((item) => item.id === id)
  for (const [id, board] of [['esp32-devkit', 'esp32-devkit'], ['arduino-uno', 'arduino-uno-r3'], ['arduino-nano', 'arduino-nano-classic'], ['arduino-mega', 'arduino-mega-2560-r3'], ['rp2040-pico', 'raspberry-pi-pico'], ['rp2350-pico-2-h', 'raspberry-pi-pico-2-h'], ['adafruit-feather-esp32-s3-tft-5483', 'adafruit-feather-esp32-s3-tft-5483']]) {
    assert.equal(route(id).boardViewerRoute, `/boards?board=${board}`)
  }
  for (const [id, board] of [['stm32-f401', 'stm32-nucleo'], ['esp32-s3', 'esp32-s3-devkitc-1']]) assert.equal(route(id).boardProfileRoute, `/boards?board=${board}`)
})

test('component visual availability distinguishes a board CAD model from an individual part mesh', async () => {
  const { getComponentVisualNotice } = await server.ssrLoadModule('/src/lib/componentVisualStatus.ts')
  assert.deepEqual(getComponentVisualNotice({ hasPartMesh: false, boardModelHref: '/boards?board=seeed-xiao-esp32-s3' }), {
    title: 'Chưa có model 3D riêng cho linh kiện này',
    description: 'Board có mô hình CAD 3D tham khảo.',
    href: '/boards?board=seeed-xiao-esp32-s3',
    linkLabel: 'Xem mô hình board 3D',
  })
  assert.deepEqual(getComponentVisualNotice({ hasPartMesh: false }), {
    title: 'Chưa có model 3D',
    description: 'Hình trên là minh họa 2D.',
  })
  assert.equal(getComponentVisualNotice({ hasPartMesh: true, boardModelHref: '/boards?board=x' }), null)
})
