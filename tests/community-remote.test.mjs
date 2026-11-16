import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, remote
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  remote = await server.ssrLoadModule('/src/lib/communityRemoteRepository.ts')
})
after(async () => { await server?.close() })
const input = { title: 'Remote test post', body: 'Enough detail to explain the issue.', category: 'iot', tags: [] }
const forged = { id: 'forged', name: 'Forged', avatarUrl: null }
test('remote writes reject absent auth before touching tables or storage', async () => {
  const repo = remote.createRemoteRepository({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } })
  for (const action of [() => repo.createPost(input, forged), () => repo.addComment('p', 'hello', forged), () => repo.report({ targetType: 'post', targetId: 'p', reason: 'spam', note: '' })]) await assert.rejects(action(), /đăng nhập/)
})
test('remote read schema failure is surfaced rather than returned as sample/local success', async () => {
  const repo = remote.createRemoteRepository({ from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: null, error: { message: 'schema missing' } }) }) }) }) })
  await assert.rejects(repo.listPosts(), /schema missing/)
})
test('remote post author comes from server auth, never caller-supplied author', async () => {
  const calls = []
  const repo = remote.createRemoteRepository({
    auth: { getUser: async () => ({ data: { user: { id: 'real', user_metadata: { name: 'Real' } } }, error: null }) },
    rpc: async (name, args) => { calls.push([name, args]); return { data: null, error: { message: 'storage missing' } } },
  })
  await assert.rejects(repo.createPost(input, forged), /storage missing/)
  assert.equal(calls[0][0], 'community_begin_post')
  assert.equal(JSON.stringify(calls).includes('forged'), false)
  assert.equal(JSON.stringify(calls).includes('Forged'), false)
})

const publishedRow = { id: '00000000-0000-4000-8000-000000000001', title: 'Remote test post', body: 'Enough detail to explain the issue.', category: 'iot', tags: [], author_id: 'real', author_name: 'Real', created_at: '2026-11-16T00:00:00Z', attachments: [] }
test('private upload failure does not publish a post; retry reuses its request id', async () => {
  let publishes = 0
  const ids = []
  const repo = remote.createRemoteRepository({
    auth: { getUser: async () => ({ data: { user: { id: 'real' } }, error: null }) },
    rpc: async (name, args) => {
      if (name === 'community_publish_post') { publishes++; return { data: args.p_id, error: null } }
      ids.push(args.p_id); return { data: { status: 'draft', uploaded: [] }, error: null }
    },
    storage: { from: () => ({ upload: async () => ({ data: null, error: { message: 'quota' } }) }) },
  })
  const file = Object.assign(new Blob(['abc']), { name: 'code.txt' })
  for (let i = 0; i < 2; i++) await assert.rejects(repo.createPost({ ...input, requestId: publishedRow.id, files: [file] }, forged), /quota/)
  assert.equal(publishes, 0)
  assert.deepEqual(ids, [publishedRow.id, publishedRow.id])
})
test('published retry reads the server post without uploading or republishing', async () => {
  const repo = remote.createRemoteRepository({
    auth: { getUser: async () => ({ data: { user: { id: 'real' } }, error: null }) },
    rpc: async name => { assert.equal(name, 'community_begin_post'); return { data: { status: 'published', uploaded: [] }, error: null } },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: publishedRow, error: null }) }) }) }) }),
  })
  const result = await repo.createPost({ ...input, requestId: publishedRow.id }, forged)
  assert.equal(result.origin, 'remote')
  assert.equal(result.author.id, 'real')
  assert.equal(result.id, publishedRow.id)
})

test('upload body always uses octet-stream even when picked file advertises active MIME', async () => {
  let sentBlob
  const repo = remote.createRemoteRepository({
    auth: { getUser: async () => ({ data: { user: { id: 'real' } }, error: null }) },
    rpc: async name => ({ data: name === 'community_begin_post' ? { status: 'draft', uploaded: [] } : publishedRow.id, error: null }),
    storage: { from: () => ({ upload: async (path, blob, options) => { assert.equal(path, `real/${publishedRow.id}/0`); assert.equal(options.upsert, false); sentBlob = blob; return { data: { path }, error: null } } }) },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: publishedRow, error: null }) }) }) }) }),
  })
  const file = Object.assign(new Blob(['abc'], { type: 'text/html' }), { name: 'code.txt' })
  await repo.createPost({ ...input, requestId: publishedRow.id, files: [file] }, forged)
  assert.equal(sentBlob.type, 'application/octet-stream')
  assert.equal(await sentBlob.text(), 'abc')
})
