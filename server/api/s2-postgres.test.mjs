import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createCommunityStore } from './community-store.mjs'
import { createStagingPool, migrateStagingDatabase, STAGING_APP, STAGING_OWNER, verifyStagingDatabase } from './database.mjs'
import { newSession } from './oauth.mjs'
import { createOAuthStore } from './oauth-store.mjs'
import { createGuideStore } from './guide-store.mjs'
import { createGuideService } from './guide-service.mjs'
import { createPostgresStore } from '../analytics/store.mjs'
import { createAdminReports, vietnamRange } from './admin.mjs'
import { createProjectHttp, createProjectStore, projectRoute } from './projects.mjs'
import { createClassroomStore } from './classrooms.mjs'
import { createSiteFeedbackStore } from './site-feedback.mjs'

const port = process.env.MACHMO_S2_TEST_PG_PORT

test('staging applies and repeats migrations on PostgreSQL and enforces data ownership and lifecycle', { skip: !port }, async t => {
  // This fixture is for a new, disposable, trust-authenticated loopback container.
  assert.match(port, /^\d{5}$/)
  assert.notEqual(port, '55432')
  const connection = role => 'postgresql://' + role + '@127.0.0.1:' + port + '/machmo_api_staging'
  const owner = createStagingPool(connection(STAGING_OWNER), STAGING_OWNER)
  const app = createStagingPool(connection(STAGING_APP), STAGING_APP)
  t.after(async () => Promise.all([owner.end(), app.end()]))
  assert.deepEqual(await migrateStagingDatabase(owner), [1, 2, 3, 4, 5, 6, 7, 8])
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
  const guideStore = createGuideStore(app)
  const guide = createGuideService({ store: guideStore, secret: 'fixture-value-'.repeat(4), dailyLimit: 3, env: { GUIDE_AI_PROVIDER: 'mock' } })
  const question = { question: 'Điện trở là gì?', evidence: [{ id: 'S1', title: 'Điện trở', text: 'Điện trở giúp hạn chế dòng điện.' }], history: [] }
  const answer = await guide.ask(author.user, question)
  assert.equal(answer.status, 200)
  assert.equal(await guide.vote(author.user, { ...answer.body.feedback, helpful: true }), 204)
  assert.equal(await guideStore.reserve(other.user.id, 3, 1), true)
  assert.equal(await guideStore.reserve(other.user.id, 3, 1), false)
  assert.equal(await guideStore.reserve(author.user.id, 3, 20), true)
  assert.equal(await guideStore.reserve(author.user.id, 3, 20), false)
  assert.deepEqual((await app.query('SELECT status, helpful FROM machmo_guide_ai.guide_ai_requests')).rows, [{ status: 'answered', helpful: true }])
  const analytics = createPostgresStore(app, true)
  const sessionId = randomUUID()
  for (const eventName of ['lesson_open', 'builder_run', 'lesson_complete']) {
    assert.equal(await analytics.record({ session_id: sessionId, event_name: eventName, path: '/build', component_id: null,
      device: 'mobile', referrer_host: 'example.test', lesson_id: 'blink', board_id: 'arduino-uno-r3' }), true)
  }
  await owner.query("INSERT INTO machmo_analytics.events (session_id,event_name,path,created_at) VALUES ($1,'page_view','/',now()-interval '91 days')", [randomUUID()])
  await analytics.expire()
  assert.equal((await app.query('SELECT count(*)::int AS count FROM machmo_analytics.events')).rows[0].count, 3)
  assert.equal((await app.query('SELECT count(*)::int AS count FROM machmo_analytics.daily_totals')).rows[0].count, 1)
  const siteFeedback = createSiteFeedbackStore(app)
  const admin = createAdminReports({ pool: app, analytics, siteFeedback, databaseReady: async () => true, guideEnv: { GUIDE_AI_PROVIDER: 'mock' }, commit: 'fixture', dailyCap: 3 })
  const range = vietnamRange('7', Date.now())
  const reportSummary = await admin.summary(...range)
  assert.deepEqual(reportSummary.funnel, { opened: 1, ran: 1, completed: 1 })
  assert.deepEqual(reportSummary.byLesson, [{ label: 'blink', count: 3 }])
  const reportAi = await admin.ai(...range)
  assert.equal(reportAi.models[0].helpful, 1)
  assert.equal(reportAi.nearLimit, true)
  const communityReport = await admin.community(...range)
  assert.equal(communityReport.totalAccounts, 2)
  assert.deepEqual(communityReport.newAccounts, [{ provider: 'github', count: 1 }, { provider: 'google', count: 1 }])

  assert.deepEqual(await admin.feedback(...range), { total: 0, rated: 0, average: null, items: [] })
  const feedback = { id: randomUUID(), kind: 'bug', title: 'Lỗi mạch LED', details: 'LED không sáng khi chạy mô phỏng.',
    page: '/build', steps: 'Bấm Chạy', expected: 'LED sáng', actual: 'LED tắt', rating: 4 }
  await siteFeedback.save(feedback)
  await siteFeedback.save(feedback)
  await siteFeedback.save({ ...feedback, id: randomUUID(), rating: null })
  const inbox = await admin.feedback(...range)
  assert.equal(inbox.total, 2)
  assert.equal(inbox.rated, 1)
  assert.equal(inbox.average, 4)
  const { createdAt, ...savedFeedback } = inbox.items.find(item => item.id === feedback.id)
  assert.ok(Number.isFinite(Date.parse(createdAt)))
  assert.deepEqual(savedFeedback, feedback)
  await assert.rejects(app.query('DELETE FROM machmo_community.site_feedback'), { code: '42501' })
  await owner.query("UPDATE machmo_community.site_feedback SET created_at=now()-interval '181 days' WHERE id=$1", [feedback.id])
  await siteFeedback.expire()
  assert.equal((await app.query('SELECT count(*)::int AS count FROM machmo_community.site_feedback')).rows[0].count, 1)

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
  const projectStore = createProjectStore(app)
  const origin = 'https://preview.fixture.test'
  const projectApi = createProjectHttp({ origin, store: projectStore, authStore: auth })
  const headers = { host: 'preview.fixture.test', origin, 'x-machmo-csrf': '1' }
  const call = (method, path, login, data) => projectApi(projectRoute(method, path), {
    headers: { ...headers, ...(login && { cookie: '__Host-mm_session=' + login.session.token }) },
  }, async () => data)
  const sourceId = randomUUID()
  const bundle = { format: 'mach-mo-project', version: 1, exportedAt: new Date().toISOString(), lessonDrafts: {}, branchSession: {}, branchDrafts: {},
    workspace: { placed: [{ id: 'board-1', type: 'board', x: 0, y: 0 }], wires: [], lesson: 'blink', simBoard: 'esp32-devkit', code: 'x'.repeat(9000) } }
  const payload = { name: 'Mạch thử 9 KiB', bundle, sourceId }
  assert.equal((await call('POST', '/api/projects', null, payload)).status, 401)
  const saved = await call('POST', '/api/projects', author, payload)
  assert.equal(saved.status, 201)
  assert.equal((await call('POST', '/api/projects', author, payload)).status, 200)
  const variant = await call('POST', '/api/projects', author, { ...payload, name: 'Một bản riêng' })
  assert.equal(variant.body.conflict, true)
  const privateId = saved.body.item.id
  assert.equal((await call('GET', '/api/projects/' + privateId, other)).status, 404)
  const link = await call('POST', '/api/projects/shares', author, { id: privateId, listed: false })
  assert.equal(link.status, 201)
  assert.equal((await projectStore.gallery()).length, 0)
  const shared = '/api/projects/shares/' + link.body.code
  assert.equal((await call('GET', shared)).body.bundle.workspace.code.length, 9000)
  assert.equal((await call('DELETE', shared, other)).status, 404)
  const gallery = await projectStore.share(variant.body.item.id, true, author.user.id)
  assert.equal(await projectStore.like(gallery.code, other.user.id, true), 1)
  assert.equal(await projectStore.like(gallery.code, other.user.id, true), 1)
  const shareReport = await community.report({ targetType: 'project', targetId: gallery.code, reason: 'off-topic', note: 'Fixture' }, other.user)
  assert.equal(await community.moderate(shareReport.id, 'hide'), true)
  assert.equal(await projectStore.readShare(gallery.code), undefined)
  assert.equal((await projectStore.gallery()).length, 0)
  const freestyle = await call('POST', '/api/projects', author, {
    name: 'Mạch tự do', sourceId: randomUUID(), bundle: {
      format: 'mach-mo-freestyle', version: 1, workspace: { version: 1, boardId: 'arduino-uno-r3', code: 'x'.repeat(9000),
        doc: { schema: 2, lessonId: 'freestyle', parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }], wires: [], breadboards: [] } },
    },
  })
  assert.equal(freestyle.status, 201)
  assert.equal(freestyle.body.item.format, 'mach-mo-freestyle')
  const benchShare = await call('POST', '/api/projects/shares', author, { id: freestyle.body.item.id, listed: false })
  assert.equal((await call('GET', '/api/projects/shares/' + benchShare.body.code)).body.bundle.workspace.code.length, 9000)

  const rooms = createClassroomStore(app)
  const room = await rooms.create({ title: 'Lớp LED', kit: { schemaVersion: 1, boardId: 'esp32-devkit', lessonIds: ['blink'] } }, author.user.id)
  assert.equal(await rooms.read(room.id, other.user.id), null)
  const teacherView = await rooms.read(room.id, author.user.id)
  assert.equal(teacherView.role, 'teacher')
  assert.equal((await rooms.join(teacherView.joinCode, other.user.id)).status, 201)
  assert.equal((await rooms.join(teacherView.joinCode, other.user.id)).status, 200)
  assert.equal((await rooms.read(room.id, other.user.id)).joinCode, undefined)
  assert.equal(await rooms.assign(room.id, 'blink', other.user.id), 403)
  assert.equal(await rooms.assign(room.id, 'button-led', author.user.id), 400)
  assert.equal(await rooms.assign(room.id, 'blink', author.user.id), 204)
  const assignment = (await rooms.read(room.id, other.user.id)).assignments[0]
  assert.equal(await rooms.submit(room.id, assignment.id, privateId, other.user.id), 404)
  const homework = (await call('POST', '/api/projects', other, payload)).body.item
  assert.equal(await rooms.submit(room.id, assignment.id, homework.id, other.user.id), 204)
  assert.equal(await rooms.submit(room.id, assignment.id, homework.id, other.user.id), 204)
  assert.equal(await rooms.review(room.id, assignment.id, other.user.id), null)
  assert.equal((await rooms.review(room.id, assignment.id, author.user.id)).length, 1)
  assert.equal((await rooms.read(room.id, author.user.id)).assignments[0].submitted, 1)
  await auth.deleteAccount(author.user.id)
  assert.equal(await auth.read(author.session.digest), null)
  assert.equal(await community.get(post.id), null)
  assert.equal((await call('GET', shared)).status, 404)
  assert.equal((await call('GET', '/api/projects/shares/' + benchShare.body.code)).status, 404)
  assert.equal(await rooms.read(room.id, other.user.id), null)
  assert.equal((await community.queue()).length, 0)
  assert.equal((await auth.read(other.session.digest)).id, other.user.id)
})
