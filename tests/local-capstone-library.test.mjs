import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'

let vite, lib, capstone
before(async () => {
  vite = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  lib = await vite.ssrLoadModule('/src/lib/localCapstoneLibrary.ts')
  capstone = await vite.ssrLoadModule('/src/lib/localCapstone.ts')
})
after(async () => { await vite?.close() })
function storage() {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}

test('named snapshots preserve original identity and immutable contents; copies have independent identity', () => {
  const store = storage(), report = capstone.emptyCapstone()
  const first = lib.saveCapstoneSnapshot(store, null, '  Thử ngưỡng  ', report)
  assert.equal(first.entries[0].name, 'Thử ngưỡng')
  assert.equal(first.entries[0].report.projectId, report.projectId)
  const second = lib.saveCapstoneSnapshot(store, first.raw, 'Lần hai', { ...report, notes: 'mới' })
  assert.equal(second.entries[1].report.notes, '')
  const copied = lib.copyCapstoneSnapshot(store, second.raw, second.entries[1].id)
  assert.notEqual(copied.entries[0].report.projectId, report.projectId)
  assert.equal(copied.entries[2].report.projectId, report.projectId)
  assert.equal(store.getItem(capstone.CAPSTONE_STORAGE_KEY), null)
})

test('stale tab mutations, corrupt/future library and quota errors preserve stored bytes', () => {
  const store = storage(), report = capstone.emptyCapstone()
  const first = lib.saveCapstoneSnapshot(store, null, 'Một', report)
  assert.throws(() => lib.saveCapstoneSnapshot(store, null, 'Hai', report), /tab khác/)
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_KEY), first.raw)
  for (const raw of ['{broken', '{"version":2,"entries":[]}']) {
    store.setItem(lib.CAPSTONE_LIBRARY_KEY, raw)
    assert.equal(lib.readCapstoneLibrary(store).kind, 'protected')
    assert.throws(() => lib.saveCapstoneSnapshot(store, raw, 'Hai', report))
    assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_KEY), raw)
  }
  const blocked = { getItem() { throw Error('blocked') } }
  assert.equal(lib.readCapstoneLibrary(blocked).kind, 'unavailable')
  store.setItem(lib.CAPSTONE_LIBRARY_KEY, first.raw)
  store.setItem = () => { throw Error('QuotaExceededError') }
  assert.throws(() => lib.saveCapstoneSnapshot(store, first.raw, 'Hai', report), /đầy|ghi/)
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_KEY), first.raw)
})

test('bounds and deletion permit recovery from full library without overwriting snapshots', () => {
  const store = storage(), report = capstone.emptyCapstone()
  let state = { raw: null }
  assert.throws(() => lib.saveCapstoneSnapshot(store, null, ' ', report), /tên/i)
  for (let i = 0; i < lib.CAPSTONE_LIBRARY_LIMIT; i++) state = lib.saveCapstoneSnapshot(store, state.raw, `Thử ${i}`, report)
  assert.throws(() => lib.saveCapstoneSnapshot(store, state.raw, 'Thêm', report), /đầy/)
  state = lib.removeCapstoneSnapshot(store, state.raw, state.entries[0].id)
  state = lib.saveCapstoneSnapshot(store, state.raw, 'Thêm', report)
  assert.equal(state.entries.length, lib.CAPSTONE_LIBRARY_LIMIT)
})

test('active replacement requires the exact reviewed bytes and preserves damaged legacy records', () => {
  const store = storage(), original = capstone.emptyCapstone(), next = capstone.emptyCapstone()
  const raw = capstone.encodeCapstone(original)
  store.setItem(capstone.CAPSTONE_STORAGE_KEY, raw)
  assert.throws(() => lib.replaceActiveCapstone(store, null, next), /tab khác/)
  assert.equal(store.getItem(capstone.CAPSTONE_STORAGE_KEY), raw)
  lib.replaceActiveCapstone(store, raw, next)
  assert.equal(capstone.decodeCapstone(store.getItem(capstone.CAPSTONE_STORAGE_KEY)).report.projectId, next.projectId)
  store.setItem(capstone.CAPSTONE_STORAGE_KEY, 'broken')
  assert.throws(() => lib.replaceActiveCapstone(store, 'broken', next), /gốc|đọc/)
  assert.equal(store.getItem(capstone.CAPSTONE_STORAGE_KEY), 'broken')
})

test('recovery opens an empty library only after preserving the exact prior bytes', () => {
  const store = storage()
  store.setItem(lib.CAPSTONE_LIBRARY_KEY, '{damaged')
  assert.throws(() => lib.recoverCapstoneLibrary(store, 'different'), /đã đổi/)
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_RECOVERY_KEY), null)
  const res = lib.recoverCapstoneLibrary(store, '{damaged')
  assert.equal(res.kind, 'ready')
  assert.deepEqual(res.entries, [])
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_RECOVERY_KEY), '{damaged')
  store.setItem(lib.CAPSTONE_LIBRARY_KEY, 'damaged again')
  assert.throws(() => lib.recoverCapstoneLibrary(store, 'damaged again'), /được bảo vệ/)
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_KEY), 'damaged again')
  assert.equal(store.getItem(lib.CAPSTONE_LIBRARY_RECOVERY_KEY), '{damaged')
})
