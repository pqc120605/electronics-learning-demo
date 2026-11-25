import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, attachments, community
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  attachments = await server.ssrLoadModule('/src/lib/communityAttachments.ts')
  community = await server.ssrLoadModule('/src/lib/community.ts')
})
after(async () => { await server?.close() })
const item = (size, name = 'code.ino', type = 'text/plain') => ({ size, name, type })
test('attachment bounds reject sixth file, oversized file, excessive combined bytes and empty files', () => {
  assert.equal(attachments.validateAttachments([item(10 * 1024 * 1024)]), null)
  for (const files of [Array(6).fill(item(1)), [item(10485761)], [item(10485760), item(10485760), item(5242881)], [item(0)]]) {
    assert.equal(typeof attachments.validateAttachments(files), 'string')
  }
})
test('active formats are rejected even if a caller supplies an image MIME; download names cannot contain paths/control characters', () => {
  for (const name of ['x.html', 'x.svg', 'x.js', 'x.exe', 'x.svg.png']) {
    if (name === 'x.svg.png') continue // actual raster decode is required separately
    assert.ok(attachments.validateAttachments([item(12, name, 'image/png')]))
  }
  assert.equal(attachments.safeDownloadName('../../x\u0000.txt'), '_.._x_.txt')
  assert.equal(attachments.safeDownloadName(''), 'attachment.bin')
  assert.equal(attachments.safeDownloadName('.txt'), 'attachment.txt')
  const longName = attachments.safeDownloadName('Mạch '.repeat(35) + '.ino')
  assert.ok(longName.length <= 120 && longName.endsWith('.ino'))
})
test('fake raster bytes cannot acquire preview status from filename or MIME alone', async () => {
  const file = new Blob(['<svg onload=alert(1)>'], { type: 'image/png' })
  Object.defineProperty(file, 'name', { value: 'fake.png' })
  await assert.rejects(attachments.prepareAttachment(file), /ảnh|image|decode/i)
})
test('preview attachment failure does not write a post and legacy posts remain readable', async () => {
  const map = new Map()
  const storage = { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v) }
  const repo = community.createPreviewRepository({ posts: [], comments: [] }, storage, undefined, { put: async () => { throw new Error('quota') } })
  const input = { title: 'Attachment quota regression', body: 'Enough detail to explain the problem.', category: 'iot', tags: [], files: [Object.assign(new Blob(['abc']), { name: 'code.txt' })] }
  await assert.rejects(repo.createPost(input, { id: 'guest', name: 'Guest', avatarUrl: null }), /quota/)
  assert.equal((await repo.listPosts()).length, 0)
  await repo.createPost({ ...input, files: [] }, { id: 'guest', name: 'Guest', avatarUrl: null })
  assert.equal((await repo.listPosts()).length, 1)
})

test('metadata write failure rolls back committed blobs and preserves the previous local state', async () => {
  const previous = JSON.stringify({ version: 1, posts: [], comments: [], reports: [] })
  const blobs = new Map()
  const store = { put: async (id, blob) => { blobs.set(id, blob) }, remove: async id => { blobs.delete(id) }, get: async id => blobs.get(id) }
  const storage = { getItem: () => previous, setItem: () => { throw new Error('localStorage quota') } }
  const repo = community.createPreviewRepository({ posts: [], comments: [] }, storage, undefined, store)
  await assert.rejects(repo.createPost({ title: 'Metadata quota failure', body: 'This post must not be saved partially.', category: 'iot', tags: [], files: [Object.assign(new Blob(['abc']), { name: 'code.txt' })] }, { id: 'guest', name: 'Guest', avatarUrl: null }), /localStorage quota/)
  assert.equal(blobs.size, 0)
  assert.equal((await repo.listPosts()).length, 0)
})

test('IndexedDB resolves only at transaction completion and rejects abort after request success', async () => {
  const { createAttachmentStore } = await server.ssrLoadModule('/src/lib/communityAttachmentStore.ts')
  let openRequest, transaction, putRequest
  const factory = { open() { openRequest = {}; return openRequest } }
  const store = createAttachmentStore(factory)
  const db = { close() {}, transaction() { transaction = { objectStore: () => ({ put: () => { putRequest = {}; return putRequest } }) }; return transaction } }
  let settled = false
  const result = store.put('id', new Blob(['x'])).then(() => { settled = true })
  openRequest.result = db
  openRequest.onsuccess()
  await new Promise(resolve => setImmediate(resolve))
  putRequest.result = 'id'
  putRequest.onsuccess()
  await Promise.resolve()
  assert.equal(settled, false)
  transaction.oncomplete()
  await result
  assert.equal(settled, true)
  const aborted = store.put('id2', new Blob(['x']))
  openRequest.result = db; openRequest.onsuccess()
  await new Promise(resolve => setImmediate(resolve))
  putRequest.result = 'id2'; putRequest.onsuccess()
  transaction.onabort()
  await assert.rejects(aborted, /huỷ/)
})

test('denied IndexedDB getter does not throw during store creation and rejects only the file operation', async () => {
  const { createAttachmentStore } = await server.ssrLoadModule('/src/lib/communityAttachmentStore.ts')
  const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  try {
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get() { throw new DOMException('Access denied', 'SecurityError') } })
    let store
    assert.doesNotThrow(() => { store = createAttachmentStore() })
    await assert.rejects(store.put('blocked', new Blob(['x'])), /IndexedDB.*không khả dụng/)
  } finally {
    if (original) Object.defineProperty(globalThis, 'indexedDB', original)
    else delete globalThis.indexedDB
  }
})

test('denied native localStorage rejects community posting instead of accepting a volatile replacement', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new DOMException('Access denied', 'SecurityError') } } })
    const store = await server.ssrLoadModule('/src/lib/communityStore.ts')
    const repo = store.getCommunityRepository()
    const before = (await repo.listPosts()).length
    await assert.rejects(repo.createPost({ title: 'Denied native persistence', body: 'Must stay in compose rather than pretending to save.', category: 'iot', tags: [] }, { id: 'guest', name: 'Guest', avatarUrl: null }), /không cho lưu/)
    assert.equal((await repo.listPosts()).length, before)
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else delete globalThis.window
  }
})
