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

test('computes reusable kit inventory by the largest per-lesson need at each station', () => {
  const inventory = api.getKitInventory(['blink', 'seven-segment-counter'], 4)
  const byType = Object.fromEntries(inventory.map(item => [item.componentId, item.quantity]))
  assert.equal(byType.board, 4)
  assert.equal(byType.breadboard, 4)
  assert.equal(byType.resistor, 28)
  assert.equal(byType['seven-segment'], 4)
  const withBoard = api.getKitInventory(['blink'], 4, {}, 'seeed-xiao-esp32c3')
  assert.deepEqual(withBoard.filter(item => item.kind === 'board').map(item => [item.label, item.quantity]), [['Seeed Studio XIAO ESP32-C3', 4]])
  assert.equal(withBoard.filter(item => item.componentId === 'board').length, 0)
  assert.equal(withBoard.some(item => item.componentId === 'board'), false)
})

test('round trips only the allowlisted lesson, board, quantities, and sharing metadata', () => {
  const plan = {
    schemaVersion: 1,
    title: 'Bộ thực hành nhập môn',
    boardId: 'esp32-devkit',
    lessonIds: ['blink', 'button-led'],
    stationCount: 6,
    quantityOverrides: { resistor: 10 },
    configurationLicense: 'private',
  }
  const parsed = api.parseClassroomKitBundle(api.serializeClassroomKitBundle(plan))
  assert.deepEqual(parsed, plan)
  assert.equal(api.getKitInventory(parsed.lessonIds, parsed.stationCount, parsed.quantityOverrides).find(item => item.componentId === 'resistor')?.quantity, 10)
  assert.equal(api.getKitInventory(parsed.lessonIds, parsed.stationCount, { resistor: 12 }).find(item => item.componentId === 'resistor')?.quantity, 12)
})

test('rejects unknown identifiers, invalid quantities, unsupported licenses, and unexpected PII fields', () => {
  const base = { schemaVersion: 1, title: 'Kit', boardId: 'esp32-devkit', lessonIds: ['blink'], stationCount: 2, quantityOverrides: {}, configurationLicense: 'private' }
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, studentNames: ['A'] })), /không hợp lệ/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, boardId: 'made-up-board' })), /board/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, lessonIds: ['made-up-lesson'] })), /bài/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, quantityOverrides: { resistor: 0 } })), /số lượng/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, configurationLicense: 'unknown' })), /chia sẻ/i)
})

test('caps station counts, file size, and lesson count before processing imports', () => {
  const base = { schemaVersion: 1, title: 'Kit', boardId: 'esp32-devkit', lessonIds: ['blink'], stationCount: 101, quantityOverrides: {}, configurationLicense: 'private' }
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify(base)), /số trạm/i)
  assert.throws(() => api.parseClassroomKitBundle(' '.repeat(70_000)), /64 kB/i)
  assert.throws(() => api.parseClassroomKitBundle(JSON.stringify({ ...base, stationCount: 1, lessonIds: Array(30).fill('blink') })), /số bài/i)
})

test('exports an Excel-safe CSV with the selected board revision and total quantities', () => {
  const plan = { schemaVersion: 1, title: '=cmd|test', boardId: 'esp32-devkit', lessonIds: ['blink'], stationCount: 2, quantityOverrides: {}, configurationLicense: 'private' }
  const inventory = api.getKitInventory(plan.lessonIds, plan.stationCount, plan.quantityOverrides, plan.boardId)
  const csv = api.serializeClassroomKitCsv(plan, inventory)
  assert.ok(csv.startsWith('\uFEFF'))
  assert.match(csv, /"'=cmd\|test"/)
  assert.match(csv, /ESP32 Dev Kit Clone · thiết kế 30 chân/)
  assert.match(csv, /"ESP32 DevKit V1".*"board:esp32-devkit".*2/s)
  assert.match(csv, /"Điện trở · chưa rõ trị số".*"resistor".*2/s)
  assert.doesNotMatch(csv, /Điện trở 220 Ω/)
})

test('exports a manual-share classroom pack with revision, capability labels, safety notes, and no learner data', () => {
  const plan = { schemaVersion: 1, title: 'Kit lớp nhập môn', boardId: 'esp32-devkit', lessonIds: ['blink', 'analog-ldr'], stationCount: 3, quantityOverrides: {}, configurationLicense: 'CC-BY-SA-4.0' }
  const source = api.serializeClassroomKitSharePack(plan)
  const pack = JSON.parse(source)
  assert.equal(pack.schema, 'mach-mo/classroom-kit-share')
  assert.equal(pack.schemaVersion, 1)
  assert.equal(pack.board.revision, 'ESP32 Dev Kit Clone · thiết kế 30 chân')
  assert.deepEqual(pack.lessons.map(item => item.id), plan.lessonIds)
  assert.equal(pack.lessons[0].route, '/learn/esp32-led')
  assert.ok(pack.lessons.every(item => typeof item.capabilityLabel === 'string' && item.capabilityLabel.length > 0))
  assert.ok(pack.safetyNotes.some(note => note.includes('3,3 V')))
  assert.match(pack.attribution.name, /Mạch Mở/)
  assert.equal(pack.license, 'CC-BY-SA-4.0')
  assert.doesNotMatch(source, /studentNames|email|studentId|\bgrade\b/i)
  assert.deepEqual(api.parseClassroomKitImport(source), plan)
})

test('imports a classroom share pack through the same allowlisted plan validation and rejects unknown wrapper fields', () => {
  const plan = { schemaVersion: 1, title: 'Kit lớp', boardId: 'esp32-devkit', lessonIds: ['blink'], stationCount: 2, quantityOverrides: {}, configurationLicense: 'private' }
  const pack = JSON.parse(api.serializeClassroomKitSharePack(plan))
  pack.configuration.stationCount = 5
  assert.equal(api.parseClassroomKitImport(JSON.stringify(pack)).stationCount, 5)
  assert.throws(() => api.parseClassroomKitImport(JSON.stringify({ ...pack, studentRoster: ['Ada'] })), /trường lạ|không hợp lệ/i)
})
