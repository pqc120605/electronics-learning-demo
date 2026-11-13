import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, capability, kit, spice
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  capability = await server.ssrLoadModule('/src/data/boardCapabilityRegistry.ts')
  kit = await server.ssrLoadModule('/src/lib/classroomKit.ts')
  spice = await server.ssrLoadModule('/src/lib/workspaceSpice.ts')
})
after(async () => { await server?.close() })
test('board summaries distinguish the exact supported AVR targets from lesson-only profiles', () => {
  for (const id of ['arduino-uno-r3', 'arduino-nano-classic']) {
    const text = capability.getBoardSupportSummary(id).simulation
    assert.match(text, /HEX.*ATmega328P.*AVR8js/)
    assert.doesNotMatch(text, /không chạy firmware/)
  }
  for (const id of ['esp32-devkit', 'raspberry-pi-pico', 'arduino-mega-2560-r3', 'arduino-nano-every']) {
    assert.match(capability.getBoardSupportSummary(id).simulation, /chưa.*firmware/i)
  }
})
test('kit accessories use maximum simultaneous wiring plus two spare jumpers per station', () => {
  const rows = kit.getKitInventory(['blink', 'button-led'], 4, {}, 'arduino-uno-r3')
  assert.equal(rows.find(r => r.componentId === 'accessory:jumper').quantity, 28)
  assert.equal(rows.find(r => r.componentId === 'accessory:usb').quantity, 4)
  assert.match(rows.find(r => r.componentId === 'accessory:usb').label, /USB.*Type-B/)
  assert.match(kit.getKitInventory(['blink'], 1, {}, 'arduino-nano-classic').find(r => r.componentId === 'accessory:usb').label, /Mini-B/)
  assert.match(kit.getKitInventory(['blink'], 1, {}, 'seeed-xiao-esp32-s3').find(r => r.componentId === 'accessory:usb').label, /Type-C/)
  assert.match(kit.getKitInventory(['blink'], 1, {}, 'stm32-bluepill').find(r => r.componentId === 'accessory:usb').label, /kiểm tra/i)
  assert.deepEqual(kit.getKitInventory([], 4, {}, 'arduino-uno-r3'), [])
})
test('accessories survive CSV/share-pack export and old kit configurations still round-trip', () => {
  const plan = kit.createDefaultClassroomKitBundle()
  const pack = kit.serializeClassroomKitSharePack(plan)
  assert.deepEqual(kit.parseClassroomKitImport(pack), plan)
  const csv = kit.serializeClassroomKitCsv(plan, kit.getKitInventory(plan.lessonIds, plan.stationCount, {}, plan.boardId))
  assert.match(csv, /Phụ kiện/)
  assert.match(csv, /jumper/)
  assert.match(csv, /USB/)
})
test('SPICE diagnostics name the board and displayed pins without exposing topology ids', () => {
  const result = spice.compileWorkspaceSpice({ boardId: 'arduino-uno-r3', boardLogicLevel: '5 V', parts: [{ id: 'board-1', type: 'board' }, { id: 'resistor-1', type: 'resistor' }], connections: [{ id: 'wire-1', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'resistor-1', pinId: 'a' } }] })
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /Arduino Uno R3.*D13/)
  assert.doesNotMatch(result.issues.join(' '), /board-1|ledOut|resistor-1/)
})
test('SPICE assumptions are Vietnamese display text while ignored-part ids stay machine-readable', () => {
  const wire = (a,b) => ({ id: a+b, from: {partId:a,pinId:a==='battery-1'?'positive':'b'}, to: {partId:b,pinId:b==='resistor-1'?'a':'anode'} })
  const result = spice.compileWorkspaceSpice({ boardLogicLevel:'5 V', parts:[{id:'battery-1',type:'battery'},{id:'resistor-1',type:'resistor'},{id:'led-1',type:'led'},{id:'motor-1',type:'dc-motor'}], connections:[wire('battery-1','resistor-1'),wire('resistor-1','led-1'),{id:'return',from:{partId:'led-1',pinId:'cathode'},to:{partId:'battery-1',pinId:'negative'}}] })
  assert.equal(result.ok,true)
  assert.match(result.assumptions[0], /Kết nối.*dây/)
  assert.doesNotMatch(result.assumptions.join(' '), /Connectivity|battery-1|resistor-1|led-1/)
  assert.deepEqual(result.ignoredUnwiredParts,['motor-1'])
})
