import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api
let registry
let gridApi

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [docApi, mountApi, registryModule, holeApi] = await Promise.all([
    server.ssrLoadModule('/src/lib/circuitDocV2.ts'),
    server.ssrLoadModule('/src/lib/mountResolve.ts'),
    server.ssrLoadModule('/src/data/componentRegistry.ts'),
    server.ssrLoadModule('/src/lib/breadboardGrid.ts'),
  ])
  api = { ...docApi, ...mountApi }
  registry = registryModule.componentRegistry
  gridApi = holeApi
})

after(async () => { await server?.close() })

const blinkDoc = () => ({
  schema: 2,
  lessonId: 'blink',
  breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
  parts: [
    { id: 'board-1', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } },
    { id: 'bb-1', type: 'breadboard', mount: { kind: 'bench', lane: 'right', order: 0 } },
    { id: 'res-1', type: 'resistor', value: { ohm: 220 }, mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 2, rotation: 0 } },
    { id: 'led-1', type: 'led', mount: { kind: 'breadboard', board: 'bb1', col: 14, row: 3, rotation: 0 } },
  ],
  wires: [
    { id: 'w1', from: { kind: 'pin', partId: 'board-1', pinId: 'ledOut' }, to: { kind: 'hole', holeId: 'bb1:10a' } },
    { id: 'w2', from: { kind: 'hole', holeId: 'bb1:15a' }, to: { kind: 'hole', holeId: 'bb1:T-:1' } },
    { id: 'w3', from: { kind: 'hole', holeId: 'bb1:T-:2' }, to: { kind: 'pin', partId: 'board-1', pinId: 'gnd' } },
  ],
  expect: { partCount: 4, wireCount: 3, netCount: 3 },
})

test('the CircuitDocV2 blink example validates against the current registry', () => {
  const issues = api.validateCircuitDoc(blinkDoc(), registry)
  assert.deepEqual(issues.filter(issue => issue.severity === 'error'), [])
  assert.ok(issues.some(issue => issue.code === 'G2' && issue.severity === 'warning'))
})

test('an unknown component type is rejected at G2', () => {
  const doc = blinkDoc()
  doc.parts[2].type = 'made-up-part'
  assert.ok(api.validateCircuitDoc(doc, registry).some(issue => issue.code === 'G2' && issue.severity === 'error'))
})

test('a pin endpoint absent from the component definition is rejected at G3', () => {
  const doc = blinkDoc()
  doc.wires[0].from.pinId = 'not-a-pin'
  assert.ok(api.validateCircuitDoc(doc, registry).some(issue => issue.code === 'G3'))
})

test('invalid or multiply occupied hole endpoints are rejected at G4', () => {
  const invalid = blinkDoc()
  invalid.wires[0].to.holeId = 'bb1:31a'
  assert.ok(api.validateCircuitDoc(invalid, registry).some(issue => issue.code === 'G4'))
  const duplicate = blinkDoc()
  duplicate.wires[1].to.holeId = 'bb1:15a'
  assert.ok(api.validateCircuitDoc(duplicate, registry).some(issue => issue.code === 'G4'))
})

test('a wire endpoint cannot share a hole with a component leg', () => {
  const doc = blinkDoc()
  doc.wires[1].to.holeId = 'bb1:10c'
  const errors = api.validateCircuitDoc(doc, registry)
    .filter(issue => issue.code === 'G4' && issue.severity === 'error' && issue.message.includes('bb1:10c'))
  assert.equal(errors.length, 1)
  assert.match(errors[0].message, /res-1:a/)
  assert.match(errors[0].message, /w2\.to/)
})

test('two component legs cannot occupy the same breadboard hole', () => {
  const doc = blinkDoc()
  const resistor = doc.parts.find(part => part.id === 'res-1')
  const collidingRegistry = registry.map(item => item.id === 'resistor' ? { ...item, legsMm: [{ pinId: 'a', x: 0, z: 0 }, { pinId: 'b', x: 0, z: 0 }] } : item)
  const collision = api.canMount(resistor, resistor.mount, doc, collidingRegistry)
  assert.equal(collision.ok, false)
  assert.match(collision.reason, /lỗ/i)
})

test('canMount returns stable gate codes for unknown, incomplete and occupied mounts', () => {
  const doc = blinkDoc()
  const resistor = doc.parts.find(part => part.id === 'res-1')
  const occupiedMount = { ...resistor.mount, col: 10 }
  const otherPart = { ...resistor, id: 'res-2', mount: occupiedMount }
  assert.equal(api.canMount(otherPart, occupiedMount, doc, registry).code, 'G4')

  const unknown = { ...otherPart, type: 'made-up-part' }
  assert.equal(api.canMount(unknown, occupiedMount, doc, registry).code, 'G2')

  const missingLegsRegistry = registry.map(item => item.id === 'resistor'
    ? { ...item, legsMm: [] }
    : item)
  assert.equal(api.canMount(resistor, resistor.mount, doc, missingLegsRegistry).code, 'G2')
})

test('two different pins of one part cannot land in the same strip without intentionalShort', () => {
  const doc = blinkDoc()
  const part = { id: 'r2', type: 'resistor', mount: { kind: 'breadboard', board: 'bb1', col: 20, row: 2, rotation: 0 } }
  const sameStripRegistry = registry.map(item => item.id === 'resistor'
    ? { ...item, legsMm: [{ pinId: 'a', x: 0, z: 0 }, { pinId: 'b', x: 0, z: 2.54 }] }
    : item)
  const result = api.canMount(part, part.mount, doc, sameStripRegistry)
  assert.equal(result.ok, false)
  assert.match(result.reason, /dải/i)
  const allowed = api.canMount({ ...part, intentionalShort: true }, part.mount, doc, sameStripRegistry)
  assert.equal(allowed.ok, true)
})

test('G4 reports coincident legs and a shorted strip in the full document validator', () => {
  const coincident = blinkDoc()
  const sameHoleRegistry = registry.map(item => item.id === 'resistor'
    ? { ...item, legsMm: [{ pinId: 'a', x: 0, z: 0 }, { pinId: 'b', x: 0, z: 0 }] }
    : item)
  assert.ok(api.validateCircuitDoc(coincident, sameHoleRegistry).some(issue => issue.code === 'G4' && issue.severity === 'error'))

  const sameStrip = blinkDoc()
  const sameStripRegistry = registry.map(item => item.id === 'resistor'
    ? { ...item, legsMm: [{ pinId: 'a', x: 0, z: 0 }, { pinId: 'b', x: 0, z: 2.54 }] }
    : item)
  assert.ok(api.validateCircuitDoc(sameStrip, sameStripRegistry).some(issue => issue.code === 'G4' && issue.severity === 'error'))
  sameStrip.parts.find(part => part.id === 'res-1').intentionalShort = true
  assert.ok(!api.validateCircuitDoc(sameStrip, sameStripRegistry).some(issue => issue.code === 'G4' && issue.severity === 'error'))
})

test('the current registry has no breadboard-mounted type missing legsMm', () => {
  assert.deepEqual(api.registryMissingBreadboardLegs(registry), [])
  const missing = registry.map(item => item.id === 'resistor' ? { ...item, mount: 'breadboard', legsMm: [] } : item)
  assert.deepEqual(api.registryMissingBreadboardLegs(missing), ['resistor'])
})

test('footprint holes use manifest legs and occupancy separates legs from wire endpoints', () => {
  const doc = blinkDoc()
  const resistor = doc.parts.find(part => part.id === 'res-1')
  const holes = api.footprintHoles(resistor)
  assert.deepEqual(holes.map(hole => gridApi.formatHole(hole)), ['bb1:10c', 'bb1:14c'])
  const occupied = api.occupancy(doc)
  assert.equal(occupied['bb1:10c'].legs.length, 1)
  assert.equal(occupied['bb1:10a'].wireEndpoints.length, 1)
})

test('a two-pin resistor rotates 90 and 270 degrees across breadboard rows', () => {
  const part = { id: 'rotated-resistor', type: 'resistor' }
  const at90 = api.footprintHoles({ ...part, mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 5, rotation: 90 } })
  const at270 = api.footprintHoles({ ...part, mount: { kind: 'breadboard', board: 'bb1', col: 10, row: 0, rotation: 270 } })
  assert.deepEqual(at90.map(hole => gridApi.formatHole(hole)), ['bb1:10f', 'bb1:10d'])
  assert.deepEqual(at270.map(hole => gridApi.formatHole(hole)), ['bb1:10a', 'bb1:10e'])
})

test('a centered 90 degree button mount resolves both legs of each contact in manifest order', () => {
  const mount = { kind: 'breadboard', board: 'bb1', col: 20, row: 5, rotation: 90 }
  const button = { id: 'button-1', type: 'button', mount }
  const doc = blinkDoc()
  doc.parts.push(button)

  assert.deepEqual(api.canMount(button, mount, doc, registry), { ok: true })
  assert.deepEqual(api.footprintHoles(button).map(gridApi.formatHole), ['bb1:20f', 'bb1:20e', 'bb1:22f', 'bb1:22e'])
  const occupied = api.occupancy(doc)
  for (const [holeId, pinId] of [['bb1:20f', 'contactA'], ['bb1:20e', 'contactA'], ['bb1:22f', 'contactB'], ['bb1:22e', 'contactB']]) {
    assert.deepEqual(occupied[holeId].legs, [{ partId: button.id, pinId }])
  }
})

test('centering rejects off-grid, malformed and over-tolerance footprints', () => {
  const mount = { kind: 'breadboard', board: 'bb1', col: 20, row: 5, rotation: 90 }
  const button = { id: 'button-1', type: 'button', mount }
  assert.equal(api.footprintHoles({ ...button, mount: { ...mount, col: 29 } }), null)
  assert.equal(api.footprintHoles({ ...button, mount: { ...mount, row: 5.5 } }), null)
  assert.equal(api.footprintHoles({ ...button, mount: { ...mount, rotation: 45 } }), null)

  const resistor = blinkDoc().parts.find(part => part.type === 'resistor')
  const resistorGeometry = z => registry.map(item => item.id === 'resistor'
    ? { ...item, legsMm: [{ pinId: 'a', x: 0, z: 0 }, { pinId: 'b', x: 11.2, z }] }
    : item)
  // The 0.52 mm centered x residual plus 0.45 or 0.55 mm in z straddles 0.7 mm.
  assert.deepEqual(api.footprintHoles(resistor, resistorGeometry(0.9)).map(gridApi.formatHole), ['bb1:10c', 'bb1:14c'])
  assert.equal(api.footprintHoles(resistor, resistorGeometry(1.1)), null)
})

