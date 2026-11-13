import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

function memoryStorage() {
  const data = new Map()
  return { get length() { return data.size }, key: (i) => [...data.keys()][i] ?? null, getItem: (k) => data.has(k) ? data.get(k) : null, setItem: (k, v) => { data.set(k, String(v)) }, removeItem: (k) => { data.delete(k) } }
}
const bundle = () => ({ format: 'mach-mo-project', version: 1, exportedAt: '2026-11-01T00:00:00.000Z', workspace: { schemaVersion: 4, placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [], simBoard: 'esp32-devkit', lesson: 'blink' }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} })
const wire = (id, a, ap, b, bp) => ({ id, from: { partId: a, pinId: ap }, to: { partId: b, pinId: bp } })
const errorCodes = (parts, wires, lesson) => m.validateCircuit({ parts, wires }, lesson).filter((item) => item.severity === 'error').map((item) => item.code)
const ledPath = [wire('l1', 'board-1', 'ledOut', 'res-1', 'a'), wire('l2', 'res-1', 'b', 'led-1', 'anode'), wire('l3', 'led-1', 'cathode', 'board-1', 'gnd')]
const ledParts = [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'led-1', type: 'led', x: 1, y: 1 }, { id: 'res-1', type: 'resistor', x: 1, y: 1 }]

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/data/builderLessons.ts', '/src/data/simulationTargets.ts', '/src/lib/educationalProgram.ts', '/src/lib/circuitValidation.ts', '/src/lib/projectBundle.ts', '/src/lib/savedProjects.ts', '/src/data/productRoutes.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('button lesson accepts swapped contacts, a re-added button and a breadboard row', () => {
  const button = { id: 'button-1', type: 'button', x: 1, y: 1 }
  assert.deepEqual(errorCodes([...ledParts, button], [...ledPath, wire('b1', 'board-1', 'input', 'button-1', 'contactB'), wire('b2', 'board-1', 'gnd', 'button-1', 'contactA')], 'button-led'), [])
  const readded = { id: 'button-1793000000-4', type: 'button', x: 1, y: 1 }
  assert.deepEqual(errorCodes([...ledParts, readded], [...ledPath, wire('b1', 'board-1', 'input', readded.id, 'contactA'), wire('b2', 'board-1', 'gnd', readded.id, 'contactB')], 'button-led'), [])
  const row = { id: 'bread-1', type: 'breadboard', x: 1, y: 1 }
  assert.deepEqual(errorCodes([...ledParts, button, row], [...ledPath, wire('b1', 'board-1', 'input', 'bread-1', 'rowA'), wire('b2', 'bread-1', 'rowA', 'button-1', 'contactA'), wire('b3', 'board-1', 'gnd', 'button-1', 'contactB')], 'button-led'), [])
  assert.deepEqual(errorCodes([...ledParts, button], [...ledPath, wire('b1', 'board-1', 'input', 'button-1', 'contactA')], 'button-led'), ['button-input-open'])
})

test('sensor lessons resolve re-added parts by type', () => {
  const ir = { id: 'ir-sensor-1793', type: 'ir-sensor', x: 1, y: 1 }
  assert.deepEqual(errorCodes([...ledParts, ir], [...ledPath, wire('i1', 'board-1', 'input', ir.id, 'out'), wire('i2', 'board-1', 'vcc', ir.id, 'vcc'), wire('i3', 'board-1', 'gnd', ir.id, 'gnd')], 'ir-alert'), [])
})

test('LDR divider accepts either terminal of the LDR and the fixed resistor', () => {
  const parts = [...ledParts, { id: 'ldr-1', type: 'ldr', x: 1, y: 1 }, { id: 'resistor-ldr-1', type: 'resistor', x: 1, y: 1 }]
  assert.deepEqual(errorCodes(parts, [...ledPath, wire('d1', 'board-1', 'vcc', 'ldr-1', 'b'), wire('d2', 'ldr-1', 'a', 'board-1', 'input'), wire('d3', 'resistor-ldr-1', 'b', 'board-1', 'input'), wire('d4', 'resistor-ldr-1', 'a', 'board-1', 'gnd')], 'analog-ldr'), [])
  assert.deepEqual(errorCodes(parts, [...ledPath, wire('d1', 'board-1', 'vcc', 'ldr-1', 'b'), wire('d2', 'ldr-1', 'a', 'board-1', 'input')], 'analog-ldr'), ['ldr-divider-open'])
})

test('seven-segment paths accept any series resistor with either terminal', () => {
  const resistors = Array.from({ length: 7 }, (_, index) => ({ id: `resistor-new-${index}`, type: 'resistor', x: 1, y: 1 }))
  const parts = [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'display-1', type: 'seven-segment', x: 1, y: 1 }, ...resistors]
  const segments = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  const wires = resistors.flatMap((part, index) => [wire(`x${index}`, 'board-1', `seg${index}`, part.id, 'b'), wire(`y${index}`, part.id, 'a', 'display-1', segments[index])])
  wires.push(wire('c1', 'display-1', 'com1', 'board-1', 'gnd'), wire('c2', 'display-1', 'com2', 'board-1', 'gnd'))
  assert.deepEqual(errorCodes(parts, wires, 'seven-segment-counter'), [])
  assert.deepEqual(errorCodes(parts, wires.slice(1), 'seven-segment-counter'), ['segment-0-open'])
})

test('a motor wired straight to the board is rejected whatever its id', () => {
  const parts = [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'dc-motor-99', type: 'dc-motor', x: 1, y: 1 }]
  assert.ok(errorCodes(parts, [wire('m', 'board-1', 'ledOut', 'dc-motor-99', 'positive')], 'dc-motor-driver').includes('motor-direct-gpio'))
  assert.ok(errorCodes(parts, [wire('m', 'board-1', 'ledOut', 'dc-motor-99', 'positive')], 'mosfet-switch').includes('load-direct-gpio'))
})

test('parser rejects oversized sources quickly', () => {
  const started = Date.now()
  const parsed = m.parseEducationalProgram('int a('.repeat(30_000), 'blink')
  assert.equal(parsed.ok, false)
  assert.match(parsed.message, /quá dài/)
  assert.ok(Date.now() - started < 200)
})

test('ultrasonic parser requires the TRIG pulse before reading ECHO', () => {
  const target = m.getSimulationTarget('esp32-devkit')
  const sample = m.getBuilderLesson('ultrasonic-distance').code(target, m.getInputAlias(target, 'ultrasonic-distance').pin)
  assert.equal(m.parseEducationalProgram(sample, 'ultrasonic-distance').ok, true)
  const noPulse = m.parseEducationalProgram(sample.replace('  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n', ''), 'ultrasonic-distance')
  assert.equal(noPulse.ok, false)
  assert.match(noPulse.message, /TRIG/)
})

test('saving under a new name renames the open project', () => {
  const storage = memoryStorage()
  const saved = m.addSavedProject('Cũ', m.parseProjectBundle(bundle()), storage)
  const renamed = m.addSavedProject('Mới', m.parseProjectBundle(bundle()), storage, saved.id)
  assert.equal(renamed.id, saved.id)
  assert.equal(renamed.name, 'Mới')
  m.addSavedProject('Khác', m.parseProjectBundle(bundle()), storage)
  assert.throws(() => m.addSavedProject('Khác', m.parseProjectBundle(bundle()), storage, saved.id), /đã được dùng/)
})

test('a name clash is reported so the lab can ask before overwriting', () => {
  const storage = memoryStorage()
  m.addSavedProject('LED nhấp nháy', m.parseProjectBundle(bundle()), storage)
  assert.equal(m.findSavedProjectByName('led nhấp nháy ', storage)?.name, 'LED nhấp nháy')
  assert.equal(m.findSavedProjectByName('Khác', storage), undefined)
})

test('page titles are readable on both app and public routes', () => {
  assert.equal(m.getPageTitle('/app/lab'), 'Lắp mạch & mô phỏng — Mạch Mở')
  assert.equal(m.getPageTitle('/build'), 'Lắp mạch & mô phỏng — Mạch Mở')
  assert.equal(m.getPageTitle('/app/learn/esp32-led'), 'Làm đèn LED với ESP32 — Mạch Mở')
  assert.equal(m.getPageTitle('/app/tools/firmware'), 'Kiểm tra firmware HEX — Mạch Mở')
  assert.equal(m.getPageTitle('/app'), 'Không gian học — Mạch Mở')
  assert.equal(m.getPageTitle('/khong-co'), 'Không tìm thấy trang — Mạch Mở')
})
