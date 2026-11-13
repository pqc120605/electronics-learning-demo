import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let api

class MemoryStorage {
  data = new Map()
  failWrites = false
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) {
    if (this.failWrites) throw new Error('quota exceeded')
    this.data.set(String(key), String(value))
  }
  removeItem(key) { this.data.delete(key) }
}

function v4Workspace(extra = {}) {
  return {
    schemaVersion: 4,
    lesson: 'blink',
    board: 'esp32-devkit',
    placed: [{ id: 'board-1', type: 'board', x: 50, y: 50 }],
    wires: [],
    code: 'void setup() {}',
    projectName: 'Bản nháp của tôi',
    futureExtension: { keep: true },
    ...extra,
  }
}

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  api = await server.ssrLoadModule('/src/lib/circuitStorageV5.ts')
})

after(async () => { await server?.close() })

test('empty storage is reported without writes', () => {
  const storage = new MemoryStorage()
  assert.deepEqual(api.readWorkspace(storage), { status: 'empty' })
  assert.equal(storage.length, 0)
})

test('v4 read returns a migration preview and leaves its raw bytes unchanged', () => {
  const storage = new MemoryStorage()
  const raw = JSON.stringify(v4Workspace())
  storage.setItem('machmo-builder-session', raw)
  const result = api.readWorkspace(storage)
  assert.equal(result.status, 'v4')
  assert.equal(result.raw, raw)
  assert.equal(result.preview.candidate.schemaVersion, 5)
  assert.equal(result.preview.candidate.workspaceFields.code, 'void setup() {}')
  assert.deepEqual(result.preview.candidate.workspaceFields.futureExtension, { keep: true })
  assert.deepEqual([...storage.data.keys()], ['machmo-builder-session'])
  assert.equal(storage.getItem('machmo-builder-session'), raw)
})

test('accepting a preview refuses stale source bytes and writes nothing', () => {
  const storage = new MemoryStorage()
  storage.setItem('machmo-builder-session', JSON.stringify(v4Workspace()))
  const preview = api.readWorkspace(storage).preview
  storage.setItem('machmo-builder-session', JSON.stringify(v4Workspace({ projectName: 'Đã thay đổi' })))
  const result = api.acceptV4Migration(storage, preview)
  assert.equal(result.status, 'stale-source')
  assert.equal(storage.getItem('machmo-builder-session-v5'), null)
})

test('accepted migration writes a valid v5 copy and preserves the exact v4 source', () => {
  const storage = new MemoryStorage()
  const raw = JSON.stringify(v4Workspace())
  storage.setItem('machmo-builder-session', raw)
  const preview = api.readWorkspace(storage).preview
  const result = api.acceptV4Migration(storage, preview)
  assert.equal(result.status, 'saved')
  assert.equal(storage.getItem('machmo-builder-session'), raw)
  assert.ok(storage.getItem('machmo-builder-session-v5'))
  assert.deepEqual(api.readWorkspace(storage), { status: 'v5', value: result.value })
})

test('valid v5 takes precedence over v4 while both source strings remain intact', () => {
  const storage = new MemoryStorage()
  const raw = JSON.stringify(v4Workspace())
  storage.setItem('machmo-builder-session', raw)
  const preview = api.readWorkspace(storage).preview
  api.acceptV4Migration(storage, preview)
  const v5Raw = storage.getItem('machmo-builder-session-v5')
  assert.equal(api.readWorkspace(storage).status, 'v5')
  assert.equal(storage.getItem('machmo-builder-session'), raw)
  assert.equal(storage.getItem('machmo-builder-session-v5'), v5Raw)
})

test('malformed v5 is surfaced instead of silently falling back to v4', () => {
  const storage = new MemoryStorage()
  storage.setItem('machmo-builder-session', JSON.stringify(v4Workspace()))
  storage.setItem('machmo-builder-session-v5', '{broken')
  const result = api.readWorkspace(storage)
  assert.equal(result.status, 'invalid-v5')
  assert.equal(storage.getItem('machmo-builder-session'), JSON.stringify(v4Workspace()))
})

test('storage quota errors leave both the existing v4 and last valid v5 unchanged', () => {
  const storage = new MemoryStorage()
  const raw = JSON.stringify(v4Workspace())
  storage.setItem('machmo-builder-session', raw)
  const preview = api.readWorkspace(storage).preview
  api.acceptV4Migration(storage, preview)
  const oldV5 = storage.getItem('machmo-builder-session-v5')
  const next = { ...JSON.parse(oldV5), updatedAt: oldV5.length + 1 }
  storage.failWrites = true
  const result = api.saveWorkspaceV5(storage, next)
  assert.equal(result.status, 'quota-error')
  assert.equal(storage.getItem('machmo-builder-session'), raw)
  assert.equal(storage.getItem('machmo-builder-session-v5'), oldV5)
})
