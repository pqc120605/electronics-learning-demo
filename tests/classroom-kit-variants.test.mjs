import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  api = await server.ssrLoadModule('/src/lib/classroomKit.ts')
})

after(async () => { await server?.close() })

const v1 = {
  schemaVersion: 1,
  title: 'Kit cũ',
  boardId: 'esp32-devkit',
  lessonIds: ['blink'],
  stationCount: 2,
  quantityOverrides: { resistor: 4 },
  configurationLicense: 'private',
}

test('keeps canonical v1 JSON byte-identical and readable for a saved local plan', () => {
  const source = JSON.stringify(v1, null, 2)
  const loaded = api.parseClassroomKitBundle(source)
  assert.equal(api.serializeClassroomKitBundle(loaded), source)
  assert.equal(api.parseClassroomKitBundle(source).title, 'Kit cũ')
})

test('writes schema v2 only for explicit variant overrides and preserves canonical resistor identity metadata', () => {
  const plan = {
    ...v1,
    schemaVersion: 2,
    quantityOverrides: {},
    variantOverrides: {
      'resistor:ohm:10000': { value: 10000, unit: 'ohm', package: 'unknown', quantity: 6 },
    },
  }
  const serialized = api.serializeClassroomKitBundle(plan)
  assert.equal(JSON.parse(serialized).schemaVersion, 2)
  assert.deepEqual(api.parseClassroomKitBundle(serialized), plan)
  assert.equal(api.serializeClassroomKitBundle({ ...plan, variantOverrides: {} }).includes('"schemaVersion": 2'), false)
})

test('rejects a v2 bundle with a noncanonical key or metadata that disagrees with its key', () => {
  const base = { ...v1, schemaVersion: 2, quantityOverrides: {}, variantOverrides: {} }
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, variantOverrides: { 'resistor|10000|ohm|unknown': { value: 10000, unit: 'ohm', package: 'unknown', quantity: 2 } } })), /bomKey|mã biến thể/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, variantOverrides: { 'resistor:ohm:10000': { value: 220, unit: 'ohm', package: 'unknown', quantity: 2 } } })), /bomKey|trị số/i)
})

test('shows analog-ldr 10 kΩ from its circuit value and keeps unspecified resistors unknown', () => {
  const rows = api.getKitInventory(['analog-ldr'], 3)
  const known = rows.find(row => row.bomKey === 'resistor:ohm:10000')
  const unknown = rows.find(row => row.componentId === 'resistor')
  assert.deepEqual({ label: known.label, value: known.value, unit: known.unit, package: known.package, quantity: known.quantity }, {
    label: 'Điện trở 10 kΩ', value: 10000, unit: 'ohm', package: 'unknown', quantity: 3,
  })
  assert.match(unknown.label, /chưa rõ trị số/i)
  assert.equal(rows.some(row => row.bomKey === 'resistor:ohm:220'), false)
})

test('applies variant quantities by bomKey without collapsing different resistor values', () => {
  const variantOverrides = {
    'resistor:ohm:10000': { value: 10000, unit: 'ohm', package: 'unknown', quantity: 9 },
  }
  const rows = api.getKitInventory(['analog-ldr', 'seven-segment-counter'], 2, {}, undefined, variantOverrides)
  assert.equal(rows.find(row => row.bomKey === 'resistor:ohm:10000').quantity, 9)
  assert.equal(rows.find(row => row.bomKey === 'resistor:ohm:220'), undefined)
  assert.equal(rows.find(row => row.componentId === 'resistor').quantity, 14)
})

test('round-trips v2 through CSV, including variant metadata and quantity override', () => {
  const plan = {
    ...v1,
    schemaVersion: 2,
    lessonIds: ['analog-ldr'],
    quantityOverrides: {},
    variantOverrides: {
      'resistor:ohm:10000': { value: 10000, unit: 'ohm', package: 'unknown', quantity: 7 },
    },
  }
  const csv = api.serializeClassroomKitCsv(plan, api.getKitInventory(plan.lessonIds, plan.stationCount, plan.quantityOverrides, plan.boardId, plan.variantOverrides))
  const parsed = api.parseClassroomKitImport(csv)
  assert.deepEqual(parsed, plan)
  assert.match(csv, /resistor:ohm:10000/)
  assert.match(csv, /Điện trở 10 kΩ/)
})

test('round-trips v2 through share-pack export/import and keeps resistor identity in inventory', () => {
  const plan = {
    ...v1,
    schemaVersion: 2,
    lessonIds: ['analog-ldr'],
    quantityOverrides: {},
    variantOverrides: {
      'resistor:ohm:10000': { value: 10000, unit: 'ohm', package: 'unknown', quantity: 8 },
    },
  }
  const source = api.serializeClassroomKitSharePack(plan)
  const pack = JSON.parse(source)
  assert.deepEqual(api.parseClassroomKitImport(source), plan)
  assert.ok(pack.inventory.some(row => row.bomKey === 'resistor:ohm:10000' && row.value === 10000 && row.quantity === 8))
  assert.equal(pack.inventory.some(row => row.bomKey === 'resistor:ohm:220'), false)
})

test('previews ambiguous v1 resistor-family overrides and requires an explicit map or leave-defaults choice', () => {
  const imported = { ...v1, lessonIds: ['analog-ldr', 'seven-segment-counter'] }
  const preview = api.getLegacyResistorOverridePreview(imported)
  assert.deepEqual(preview, {
    quantity: 4,
    ambiguous: true,
    variantKeys: ['resistor:ohm:10000'],
    hasUnknownVariant: true,
  })

  const mapped = api.resolveLegacyResistorOverride(imported, { kind: 'map', bomKey: 'resistor:ohm:10000' })
  assert.equal(mapped.schemaVersion, 2)
  assert.equal(mapped.quantityOverrides.resistor, undefined)
  assert.deepEqual(mapped.variantOverrides['resistor:ohm:10000'], { value: 10000, unit: 'ohm', package: 'unknown', quantity: 4 })

  const defaults = api.resolveLegacyResistorOverride(imported, { kind: 'leave-defaults' })
  assert.equal(defaults.quantityOverrides.resistor, undefined)
  assert.equal(defaults.schemaVersion, 1)
  assert.throws(() => api.resolveLegacyResistorOverride(imported), /lựa chọn|quyết định/i)
})

test('imports a v1 share pack without changing its legacy bundle fields', () => {
  const source = api.serializeClassroomKitSharePack(v1)
  assert.deepEqual(api.parseClassroomKitImport(source), v1)
})
