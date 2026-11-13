import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, codec, transfer, library
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  codec = await server.ssrLoadModule('/src/lib/projectBundle.ts')
  transfer = await server.ssrLoadModule('/src/lib/projectTransfer.ts')
  library = await server.ssrLoadModule('/src/lib/savedProjects.ts')
})
after(async () => { await server?.close() })

const bundle = (overrides = {}) => ({
  format: 'mach-mo-project', version: 1, exportedAt: '2026-11-08T00:00:00.000Z',
  workspace: { schemaVersion: 4, placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [], simBoard: 'esp32-devkit', lesson: 'blink', code: '// current', projectId: 'portable-1', layout: { zoom: 1 } },
  lessonDrafts: {}, branchSession: { mode: 'blocks', order: ['button-led', 'ir-alert'] }, branchDrafts: { 'button-led': '// branch edit' },
  ...overrides,
})
function storage(initial = {}, failKey = null) {
  const data = new Map(Object.entries(initial))
  return { get length() { return data.size }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null,
    setItem(k, v) { if (k === failKey) throw new DOMException('full', 'QuotaExceededError'); data.set(k, String(v)) }, removeItem: k => data.delete(k) }
}

test('decode preserves unsupported extension data in its raw backup', () => {
  const raw = JSON.stringify({ format: 'mach-mo-project', version: 1, exportedAt: '2026-11-08T00:00:00.000Z', workspace: {}, lessonDrafts: {}, branchSession: {}, branchDrafts: {}, vendorPayload: { keep: true } })
  const result = codec.decode(raw)

  assert.equal(result.status, 'unsupported')
  assert.equal(result.rawBackup, raw)
  assert.deepEqual(result.unknownFields, ['vendorPayload'])
  assert.equal(result.document, undefined)
})

test('normalization hydrates only the absent current draft and remains idempotent', () => {
  const input = bundle()
  const result = codec.normalizeProjectBundle(input)
  assert.equal(result.bundle.lessonDrafts.blink['esp32-devkit'], '// current')
  assert.deepEqual(codec.normalizeProjectBundle(result.bundle), result)
  assert.deepEqual(input.lessonDrafts, {})
  assert.equal(result.bundle.workspace.projectId, 'portable-1')
  assert.deepEqual(result.bundle.workspace.layout, { zoom: 1 })
  assert.equal(result.bundle.exportedAt, input.exportedAt)
  assert.deepEqual(result.bundle.branchDrafts, input.branchDrafts)
})

test('serialized drafts are retained even when they equal the lesson code', () => {
  const input = bundle({ lessonDrafts: { blink: { 'esp32-devkit': '// current' } } })
  const result = codec.normalizeProjectBundle(input)
  assert.deepEqual(result.bundle.lessonDrafts, input.lessonDrafts)
  assert.deepEqual(result.issues, [])
})

test('conflicting hand-edited lesson drafts across boards survive with conflict issue', () => {
  const input = bundle({ workspace: { ...bundle().workspace, code: '// current changed' }, lessonDrafts: { blink: { 'esp32-devkit': '// esp edit', 'arduino-uno-r3': '// uno edit' }, 'button-led': { 'esp32-devkit': '// button esp', 'arduino-uno-r3': '// button uno' } } })
  const result = codec.normalizeProjectBundle(input)
  assert.deepEqual(result.bundle.lessonDrafts, input.lessonDrafts)
  assert.deepEqual(result.issues, [{ code: 'current-draft-conflict', lessonId: 'blink', boardId: 'esp32-devkit' }])
  assert.deepEqual(codec.normalizeProjectBundle(result.bundle), result)
})

test('unknown extensions, future schema, and unknown target remain unsupported with raw backup', () => {
  const extension = JSON.stringify({ ...bundle(), plugin: { keep: 1 } })
  const extResult = codec.decode(extension)
  assert.equal(extResult.status, 'unsupported'); assert.equal(extResult.rawBackup, extension); assert.deepEqual(extResult.unknownFields, ['plugin'])
  const nestedExtension = codec.decode(JSON.stringify({ ...bundle(), branchSession: { ...bundle().branchSession, injected: true } }))
  assert.equal(nestedExtension.status, 'unsupported'); assert.deepEqual(nestedExtension.unknownFields, ['branchSession.injected'])
  const future = codec.decode(JSON.stringify({ ...bundle(), workspace: { ...bundle().workspace, schemaVersion: 5 } }))
  assert.equal(future.status, 'unsupported'); assert.equal(future.document, undefined)
  const unknownBoard = codec.decode(JSON.stringify({ ...bundle(), workspace: { ...bundle().workspace, simBoard: 'vendor-board-x' } }))
  assert.equal(unknownBoard.status, 'unsupported'); assert.match(unknownBoard.issues.join(), /vendor-board-x/)
})

test('an empty current board field cannot mask an unknown legacy board field', () => {
  const raw = JSON.stringify({ ...bundle(), workspace: { ...bundle().workspace, simBoard: '', board: 'vendor-board-x' } })
  const result = codec.decode(raw)
  assert.equal(result.status, 'unsupported')
  assert.equal(result.rawBackup, raw)
  assert.match(result.issues.join(), /vendor-board-x/)
})

test('only published legacy board aliases are normalized', () => {
  for (const [alias, board] of Object.entries({ esp32: 'esp32-devkit', uno: 'arduino-uno-r3', nano: 'arduino-nano-classic', stm32: 'stm32-nucleo' })) {
    const result = codec.decode(JSON.stringify({ ...bundle(), workspace: { ...bundle().workspace, simBoard: alias } }))
    assert.equal(result.status, 'valid', alias); assert.equal(result.document.workspace.simBoard, board)
  }
})

test('decode rejects duplicate component IDs and dangling endpoint pins', () => {
  const duplicate = bundle({ workspace: { ...bundle().workspace, placed: [{ id: 'same', type: 'board', x: 1, y: 1 }, { id: 'same', type: 'led', x: 2, y: 2 }] } })
  assert.equal(codec.decode(JSON.stringify(duplicate)).status, 'invalid')
  const dangling = bundle({ workspace: { ...bundle().workspace, placed: [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'led-1', type: 'led', x: 2, y: 2 }], wires: [{ id: 'w1', from: { partId: 'board-1', pinId: 'made-up' }, to: { partId: 'led-1', pinId: 'anode' } }] } })
  assert.equal(codec.decode(JSON.stringify(dangling)).status, 'invalid')
})

test('failed section write rolls workspace back and retains recoverable originals', () => {
  const originalWorkspace = JSON.stringify({ schemaVersion: 4, placed: [{ id: 'board', type: 'board', x: 1, y: 1 }], wires: [], simBoard: 'esp32-devkit', lesson: 'blink', code: '// old' })
  const originalDrafts = JSON.stringify({ blink: { 'esp32-devkit': '// old hand edit' } })
  const originalBranch = JSON.stringify({ mode: 'blocks', drafts: { 'button-led': '// old branch' } })
  const s = storage({ 'machmo-builder-session': originalWorkspace, 'machmo-lesson-drafts': originalDrafts, 'machmo-branch-session': originalBranch }, 'machmo-branch-session')
  assert.throws(() => library.replaceWorkspaceWithBundle(bundle(), { storage: s }), /bản sao lưu vẫn được giữ/i)
  assert.equal(s.getItem('machmo-builder-session'), originalWorkspace)
  assert.equal(s.getItem('machmo-lesson-drafts'), originalDrafts)
  const recovery = JSON.parse(s.getItem('machmo-draft-recovery'))
  assert.deepEqual(recovery.branchDrafts, { 'button-led': '// old branch' })
  assert.deepEqual(recovery.lessonDrafts, { blink: { 'esp32-devkit': '// old hand edit' } })
})

test('project import returns a raw-preserving unsupported result without loading it', () => {
  const raw = JSON.stringify({ ...bundle(), exportedAt: 'x', workspace: { ...bundle().workspace, simBoard: 'future-board' } })
  const result = transfer.decodeProjectImport(raw)
  assert.equal(result.status, 'unsupported'); assert.equal(result.rawBackup, raw); assert.equal(result.document, undefined)
})

test('project import preview exposes structured current-draft conflicts', () => {
  const value = bundle({ lessonDrafts: { blink: { 'esp32-devkit': '// hand-edited draft' } } })
  const preview = transfer.parseProjectImport(JSON.stringify(value), 'conflict.machmo.json')
  assert.deepEqual(preview.issues, [{ code: 'current-draft-conflict', lessonId: 'blink', boardId: 'esp32-devkit' }])
})

test('damaged library records expose the unchanged stored bytes for recovery', () => {
  const raw = '{"saved":'
  const result = library.readSavedProjectLibrary(storage({ [library.SAVED_PROJECTS_KEY]: raw }))
  assert.equal(result.damaged, true)
  assert.equal(result.rawBackup, raw)
})
