import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let migrate

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  migrate = await server.ssrLoadModule('/src/lib/migrateV1toV2.ts')
})

after(async () => { await server?.close() })

const legacyWorkspace = (lesson = 'blink') => ({
  schemaVersion: 4,
  lesson,
  simBoard: 'esp32-devkit',
  code: 'const value = 1',
  codeMode: 'cpp',
  projectId: 'project-1',
  projectName: 'My circuit',
  libraryEntryId: 'library-1',
  placed: [
    { id: 'board-1', type: 'board', x: 10, y: 20 },
    { id: 'bread-1', type: 'breadboard', x: 40, y: 50 },
    { id: 'res-1', type: 'resistor', x: 60, y: 40, value: '10 kΩ', rotation: 90 },
  ],
  wires: [{ id: 'wire-1', from: { partId: 'board-1', pinId: 'ledOut' }, to: { partId: 'res-1', pinId: 'a' } }],
})

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries))
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    key: index => [...map.keys()][index] ?? null,
    get length() { return map.size },
    entries: () => [...map.entries()],
  }
}

test('migrates v4 workspace while retaining identity, topology, and non-circuit fields', () => {
  const input = legacyWorkspace()
  const result = migrate.migrateWorkspaceV1ToV2(input)
  assert.equal(result.status, 'migrated')
  assert.deepEqual(result.doc.parts.map(({ id, type }) => ({ id, type })), input.placed.map(({ id, type }) => ({ id, type })))
  assert.deepEqual(result.doc.wires, input.wires.map(wire => ({
    id: wire.id,
    from: { kind: 'pin', ...wire.from },
    to: { kind: 'pin', ...wire.to },
  })))
  assert.equal(result.doc.parts.find(part => part.id === 'res-1').value.label, '10 kΩ')
  assert.equal(result.workspace.code, input.code)
  assert.equal(result.workspace.projectName, input.projectName)
  assert.equal(result.workspace.libraryEntryId, input.libraryEntryId)
  assert.deepEqual(result.workspace.placed, input.placed)
  assert.deepEqual(result.workspace.wires, input.wires)
  assert.ok(result.warnings.some(warning => warning.toLowerCase().includes('chân chưa có net')))
})

test('writes one v2 workspace key while leaving the other three persisted key families untouched', () => {
  const entries = {
    'machmo-builder-session': JSON.stringify(legacyWorkspace()),
    'machmo-lesson-drafts': JSON.stringify({ blink: { 'esp32-devkit': 'draft code' } }),
    'machmo-branch-session': JSON.stringify({ drafts: { blink: 'branch' } }),
    'machmo-guided-workspace-blink': JSON.stringify(legacyWorkspace()),
  }
  const storage = memoryStorage(entries)
  const migrated = migrate.copyWorkspaceToV2Key(storage, 'machmo-builder-session', 'blink')
  assert.equal(migrated.status, 'migrated')
  assert.equal(migrated.key, 'machmo-circuit-v2-blink')
  assert.deepEqual(storage.entries().map(([key]) => key).sort(), [...Object.keys(entries), migrated.key].sort())
  for (const [key, value] of Object.entries(entries)) assert.equal(storage.getItem(key), value)
  const saved = JSON.parse(storage.getItem(migrated.key))
  assert.equal(saved.schema, 2)
  assert.equal(saved.workspace.code, 'const value = 1')
  assert.equal(saved.doc.lessonId, 'blink')
})

test('does not replace an existing v2 document and refuses malformed or future records', () => {
  const storage = memoryStorage({
    'machmo-builder-session': JSON.stringify(legacyWorkspace()),
    'machmo-circuit-v2-blink': '{"schema":2,"keep":true}',
  })
  assert.equal(migrate.copyWorkspaceToV2Key(storage, 'machmo-builder-session', 'blink').status, 'exists')
  assert.equal(storage.getItem('machmo-circuit-v2-blink'), '{"schema":2,"keep":true}')
  assert.equal(migrate.migrateWorkspaceV1ToV2({ ...legacyWorkspace(), schemaVersion: 5 }).status, 'unsupported')
  assert.equal(migrate.migrateWorkspaceV1ToV2({ ...legacyWorkspace(), wires: [{ id: 'bad', from: {}, to: {} }] }).status, 'invalid')
})
