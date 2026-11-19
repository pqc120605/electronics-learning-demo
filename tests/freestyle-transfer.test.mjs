import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, circuits, transfer
before(async () => {
  server = await createServer({ logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  ;[circuits, transfer] = await Promise.all([
    server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts'),
    server.ssrLoadModule('/src/lib/freestyle/freestyleTransfer.ts'),
  ])
})
after(async () => { await server?.close() })

test('versioned project accepts legacy JSON and preserves stable keys and code', () => {
  const workspace = circuits.defaultFreestyleWorkspace('arduino-uno-r3', 'button-led')
  const raw = transfer.serializeFreestyleProject(workspace)
  for (const file of [raw, JSON.stringify(workspace)]) {
    const restored = transfer.parseFreestyleProject(file)
    assert.equal(restored.code, workspace.code)
    assert.deepEqual(restored.doc, workspace.doc)
    assert.deepEqual(restored.pinMap, workspace.pinMap)
  }
  for (const input of ['{', 'null', JSON.stringify({ ...JSON.parse(raw), version: 9 }), JSON.stringify({ ...JSON.parse(raw), workspace: {} })]) {
    assert.equal(transfer.parseFreestyleProject(input), null)
  }
})

test('backup imports independent copies and preserves unreadable originals', () => {
  const workspace = circuits.defaultFreestyleWorkspace('arduino-uno-r3', 'blink')
  const raw = transfer.serializeFreestyleBackup(workspace, [{ raw: '{old', key: 'previous', workspace: null }])
  const storage = new Map([['machmo-freestyle-v1', 'current']])
  const adapter = { setItem: (key, value) => storage.set(key, value), getItem: key => storage.get(key), removeItem: key => storage.delete(key) }
  assert.throws(() => transfer.restoreFreestyleBackup(adapter, '{'), /không hợp lệ/)
  assert.throws(() => transfer.restoreFreestyleBackup({ ...adapter, setItem: (key, value) => {
    if (value === '{old') throw new Error('quota')
    storage.set(key, value)
  } }, raw), /bộ nhớ/)
  assert.deepEqual([...storage.entries()], [['machmo-freestyle-v1', 'current']])
  assert.equal(transfer.restoreFreestyleBackup(adapter, raw), 2)
  assert.equal(storage.get('machmo-freestyle-v1'), 'current')
  assert.ok([...storage.values()].includes('{old'))
  assert.equal(storage.size, 3)
})

test('BOM retains designators, values, quantities and neutralizes spreadsheet formulas', () => {
  const workspace = circuits.defaultFreestyleWorkspace('arduino-uno-r3', 'blink')
  const resistor = workspace.doc.parts.find(part => part.type === 'resistor')
  resistor.value = { ohm: 330 }
  workspace.doc.parts.push({ ...resistor, id: 'res-copy' })
  const led = workspace.doc.parts.find(part => part.type === 'led')
  led.value = { label: '=SUM(1,1)' }
  const csv = transfer.freestyleBomCsv(workspace)
  assert.match(csv, /"Reference","Value","Footprint","Số lượng","Datasheet"/)
  assert.match(csv, new RegExp(`"${resistor.id} res-copy","330 Ω","[^"]+","2"`))
  assert.match(csv, /"'=SUM\(1,1\)"/)
  assert.match(csv, /Breadboard 400 lỗ/)
})
