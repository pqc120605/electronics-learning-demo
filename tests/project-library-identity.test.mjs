import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, library
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  library = await server.ssrLoadModule('/src/lib/savedProjects.ts')
})
after(async () => { await server?.close() })

function memoryStorage() {
  const entries = new Map()
  return {
    failKey: null,
    getItem: key => entries.get(key) ?? null,
    setItem(key, value) {
      if (key === this.failKey) throw new DOMException('full', 'QuotaExceededError')
      entries.set(key, String(value))
    },
    removeItem: key => entries.delete(key),
  }
}

function bundle(projectId) {
  return {
    format: 'mach-mo-project', version: 1, exportedAt: '2026-11-05T00:00:00.000Z',
    workspace: {
      schemaVersion: 4, placed: [{ id: 'board', type: 'board', x: 20, y: 30 }], wires: [],
      simBoard: 'esp32-devkit', lesson: 'blink', code: '// current', projectName: 'Document',
      ...(projectId === undefined ? {} : { projectId }),
    },
    lessonDrafts: { blink: { 'esp32-devkit': '', 'arduino-uno-r3': '// other board' } },
    branchSession: {}, branchDrafts: { 'button-led': '', 'ir-alert': '// IR' },
  }
}

test('opening and updating exact library entry preserves portable identity and conflicting drafts', () => {
  const storage = memoryStorage()
  const unrelated = library.addSavedProject('Unrelated', bundle('other'), storage)
  const source = bundle(unrelated.id)
  const first = library.addSavedProject('First', source, storage)
  const second = library.addSavedProject('Second', source, storage)
  library.restoreSavedProject(second, storage)
  const opened = JSON.parse(storage.getItem('machmo-builder-session'))
  assert.equal(opened.projectId, unrelated.id)
  assert.equal(opened.projectName, 'Document')
  assert.equal(opened.libraryEntryId, second.id)
  assert.deepEqual(JSON.parse(storage.getItem('machmo-lesson-drafts')), source.lessonDrafts)
  assert.deepEqual(JSON.parse(storage.getItem('machmo-branch-session')).drafts, source.branchDrafts)
  const modified = structuredClone(source)
  modified.workspace.code = '// changed'
  const updated = library.addSavedProject('Second', modified, storage, opened.libraryEntryId)
  assert.equal(updated.id, second.id)
  assert.deepEqual(updated.revisions.map(item => item.bundle), [source])
  assert.deepEqual(library.readSavedProjects(storage).find(item => item.id === first.id), first)
  assert.deepEqual(library.readSavedProjects(storage).find(item => item.id === unrelated.id), unrelated)
})

test('duplicates, a missing target, and a failed write never overwrite a library entry or draft', () => {
  const storage = memoryStorage()
  const source = bundle('portable')
  const saved = library.addSavedProject('A'.repeat(80), source, storage)
  library.restoreSavedProject(saved, storage)
  const before = storage.getItem(library.SAVED_PROJECTS_KEY)
  const draft = storage.getItem('machmo-builder-session')
  assert.throws(() => library.addSavedProject('  ' + 'a'.repeat(80) + ' suffix  ', source, storage), /tên/i)
  assert.throws(() => library.addSavedProject(saved.name, source, storage, 'deleted-entry'), /không tìm thấy/i)
  storage.failKey = library.SAVED_PROJECTS_KEY
  assert.throws(() => library.addSavedProject(saved.name, bundle('changed'), storage, saved.id), /bộ nhớ/i)
  assert.equal(storage.getItem(library.SAVED_PROJECTS_KEY), before)
  assert.equal(storage.getItem('machmo-builder-session'), draft)
})

test('missing portable ID remains absent and explicit fork allocates a new portable and entry ID', () => {
  const storage = memoryStorage()
  const absent = library.addSavedProject('Missing P', bundle(), storage)
  library.restoreSavedProject(absent, storage)
  assert.equal(Object.hasOwn(JSON.parse(storage.getItem('machmo-builder-session')), 'projectId'), false)
  const legacy = { ...absent, bundle: bundle(absent.id) }
  storage.setItem(library.SAVED_PROJECTS_KEY, JSON.stringify([legacy]))
  library.restoreSavedProject(legacy, storage)
  assert.equal(JSON.parse(storage.getItem('machmo-builder-session')).projectId, legacy.id)
  const fork = library.duplicateSavedProject(legacy.id, storage)
  assert.notEqual(fork.id, legacy.id)
  assert.notEqual(fork.bundle.workspace.projectId, legacy.id)
  assert.notEqual(fork.bundle.workspace.projectId, fork.id)
  assert.deepEqual(fork.bundle.lessonDrafts, legacy.bundle.lessonDrafts)
  assert.deepEqual(fork.bundle.branchDrafts, legacy.bundle.branchDrafts)
  assert.deepEqual(fork.revisions, [])
  assert.deepEqual(library.readSavedProjects(storage).find(item => item.id === legacy.id), legacy)
})

test('portable input cannot inject local library metadata and failed replacement restores the existing link', () => {
  const storage = memoryStorage()
  const initial = library.addSavedProject('Initial', bundle('original'), storage)
  library.restoreSavedProject(initial, storage)
  const draftKey = 'machmo-builder-session'
  const prior = storage.getItem(draftKey)
  const input = bundle('imported')
  input.workspace.libraryEntryId = initial.id
  input.workspace.libraryEntryName = initial.name
  input.libraryEntryId = initial.id
  storage.failKey = 'machmo-lesson-drafts'
  assert.throws(() => library.replaceWorkspaceWithBundle(input, { storage }), /không mở được project/i)
  assert.equal(storage.getItem(draftKey), prior)
  storage.failKey = null
  library.replaceWorkspaceWithBundle(input, { storage })
  const workspace = JSON.parse(storage.getItem(draftKey))
  assert.equal(workspace.projectId, 'imported')
  assert.equal(Object.hasOwn(workspace, 'libraryEntryId'), false)
  assert.equal(Object.hasOwn(workspace, 'libraryEntryName'), false)
  const imported = library.addSavedProject('Imported', input, storage)
  assert.equal(Object.hasOwn(imported.bundle, 'libraryEntryId'), false)
  assert.equal(Object.hasOwn(imported.bundle.workspace, 'libraryEntryId'), false)
})
