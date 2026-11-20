import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createCommunityStore } from './community-store.mjs'
import { createStagingPool, migrateStagingDatabase, STAGING_APP, STAGING_OWNER, verifyStagingDatabase } from './database.mjs'
import { newSession } from './oauth.mjs'
import { createOAuthStore } from './oauth-store.mjs'

const port = process.env.MACHMO_S2_TEST_PG_PORT

test('S2 applies and repeats migration on disposable PostgreSQL and enforces community lifecycle', { skip: !port }, async t => {
  // This fixture is for a new, disposable, trust-authenticated loopback container.
  assert.match(port, /^\d{5}$/)
  assert.notEqual(port, '55432')
  const connection = role => 'postgresql://' + role + '@127.0.0.1:' + port + '/machmo_api_staging'
  const owner = createStagingPool(connection(STAGING_OWNER), STAGING_OWNER)
  const app = createStagingPool(connection(STAGING_APP), STAGING_APP)
  t.after(async () => Promise.all([owner.end(), app.end()]))
  assert.deepEqual(await migrateStagingDatabase(owner), [1, 2, 3])
  assert.deepEqual(await migrateStagingDatabase(owner), [])
  assert.equal(await verifyStagingDatabase(app), true)

  const auth = createOAuthStore(app, 'github:102')
  const community = createCommunityStore(app)
  const createUser = async (provider, providerUserId) => {
    const session = newSession()
    await auth.startSession({ provider, providerUserId, displayName: 'Mạch Mở thử', avatarUrl: null }, session)
    return { session, user: await auth.read(session.digest) }
  }
  const author = await createUser('google', '101')
  const other = await createUser('github', '102')
  assert.notEqual(author.user.id, other.user.id)
  assert.equal(other.user.role, 'admin')
  const loginAgain = await createUser('google', '101')
  assert.equal(loginAgain.user.id, author.user.id)

  const body = 'Vì sao điện trở mắc nối tiếp với LED?'
  const input = { id: randomUUID(), title: 'Thử mạch LED cơ bản', body, category: 'co-ban', tags: ['led'] }
  const post = await community.create(input, author.user)
  assert.equal(post.canEdit, true)
  assert.deepEqual(post.author, { name: 'Mạch Mở thử', avatarUrl: null })
  assert.equal((await community.create(input, author.user)).id, post.id)
  assert.equal(await community.create(input, other.user), null)
  const comment = await community.addComment(post.id, 'Để giới hạn dòng điện.', other.user)
  assert.equal((await community.get(post.id)).commentCount, 1)
  assert.equal(await community.change('post', post.id, null, other.user), 403)
  assert.equal(await community.change('comment', comment.id, 'Nội dung sửa', author.user), 403)
  assert.equal(await community.change('comment', comment.id, 'Giới hạn dòng qua LED.', other.user), 204)
  assert.equal((await community.listComments(post.id))[0].body, 'Giới hạn dòng qua LED.')

  const second = await community.create({ ...input, id: randomUUID() }, author.user)
  const query = { limit: 1, terms: ['dien', 'tro'], category: 'co-ban', tag: 'led' }
  const page = await community.list(query)
  assert.equal(page.items[0].id, second.id)
  const [time, id] = JSON.parse(Buffer.from(page.nextCursor, 'base64url'))
  const next = await community.list({ ...query, cursor: { time, id } })
  assert.equal(next.items[0].id, post.id)
  assert.equal(next.nextCursor, null)
  assert.equal((await community.tags())[0].count, 2)
  const report = await community.report({ targetType: 'comment', targetId: comment.id, reason: 'off-topic', note: 'Fixture' }, author.user)
  assert.equal((await community.queue())[0].postId, post.id)
  assert.equal(await community.moderate(report.id, 'hide'), true)
  assert.equal((await community.listComments(post.id)).length, 0)
  await auth.deleteAccount(author.user.id)
  assert.equal(await auth.read(author.session.digest), null)
  assert.equal(await community.get(post.id), null)
  assert.equal((await community.queue()).length, 0)
  assert.equal((await auth.read(other.session.digest)).id, other.user.id)
})
