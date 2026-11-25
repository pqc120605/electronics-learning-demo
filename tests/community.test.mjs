import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let community
let markdown
let authUser
let seedModule

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  community = await server.ssrLoadModule('/src/lib/community.ts')
  markdown = await server.ssrLoadModule('/src/lib/simpleMarkdown.ts')
  authUser = await server.ssrLoadModule('/src/lib/authUser.ts')
  seedModule = await server.ssrLoadModule('/src/data/communitySeed.ts')
})

after(async () => { await server?.close() })

function memoryStorage() {
  const map = new Map()
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key, String(value)) }, map }
}

const author = { id: 'u1', name: 'Tester', avatarUrl: null }

test('seed covers all five community groups and every post has sample origin', () => {
  const ids = community.COMMUNITY_CATEGORIES.map(category => category.id)
  assert.deepEqual(ids, ['co-ban', 'nhung', 'iot', 'du-an', 'hoi-dap-loi'])
  for (const id of ids) assert.ok(seedModule.communitySeed.posts.some(post => post.category === id), id)
  assert.ok(seedModule.communitySeed.posts.every(post => post.origin === 'sample'))
})

test('filterPosts matches Vietnamese text without diacritics, category and tag', () => {
  const posts = seedModule.communitySeed.posts
  const byText = community.filterPosts(posts, { search: 'dien tro led' })
  assert.ok(byText.some(post => post.id === 'led-dien-tro-bao-nhieu'))
  assert.ok(community.filterPosts(posts, { category: 'iot' }).every(post => post.category === 'iot'))
  assert.ok(community.filterPosts(posts, { tag: 'mqtt' }).every(post => post.tags.includes('mqtt')))
  assert.equal(community.filterPosts(posts, { search: 'khongcobainaonhuvay' }).length, 0)
})

test('validatePostInput rejects short title/body, bad category and too many tags', () => {
  const result = community.validatePostInput({ title: 'ngắn', body: 'ít', category: 'nope', tags: ['a', 'b', 'c', 'd', 'e', 'f'] })
  assert.equal(result.ok, false)
  assert.deepEqual(Object.keys(result.errors).sort(), ['body', 'category', 'tags', 'title'])
  assert.equal(community.validatePostInput({ title: 'ESP32 không nhận DHT22', body: 'Mô tả đủ dài để người khác hiểu vấn đề.', category: 'nhung', tags: ['esp32'] }).ok, true)
})

test('parseTags normalises, dedupes and strips unsafe characters', () => {
  assert.deepEqual(community.parseTags('#ESP32, esp32,  cảm biến , <script>'), ['esp32', 'cảm-biến', 'script'])
})

test('preview repository stores posts, comments and reports in local storage only', async () => {
  const storage = memoryStorage()
  const repo = community.createPreviewRepository(seedModule.communitySeed, storage, () => new Date('2026-11-14T00:00:00Z'))
  assert.equal(repo.mode, 'preview')
  const post = await repo.createPost({ title: 'Câu hỏi thử nghiệm về I2C', body: 'Nội dung đủ dài cho bài viết thử nghiệm.', category: 'nhung', tags: ['I2C'] }, author)
  assert.equal(post.origin, 'local')
  assert.deepEqual(post.tags, ['i2c'])
  assert.equal((await repo.listPosts())[0].id, post.id)
  await repo.addComment(post.id, 'Bình luận đầu tiên', author)
  assert.equal((await repo.getPost(post.id)).commentCount, 1)
  await repo.report({ targetType: 'post', targetId: post.id, reason: 'spam', note: 'x' })
  const stored = JSON.parse(storage.map.get(community.COMMUNITY_STORAGE_KEY))
  assert.equal(stored.posts.length, 1)
  assert.equal(stored.comments.length, 1)
  assert.equal(stored.reports.length, 1)
  await assert.rejects(repo.addComment('khong-ton-tai', 'Bình luận', author))
  await assert.rejects(repo.createPost({ title: 'x', body: 'y', category: 'iot', tags: [] }, author))
})

test('preview repository ignores corrupt storage and keeps seed readable', async () => {
  const storage = memoryStorage()
  storage.setItem(community.COMMUNITY_STORAGE_KEY, '{not json')
  const repo = community.createPreviewRepository(seedModule.communitySeed, storage)
  assert.equal((await repo.listPosts()).length, seedModule.communitySeed.posts.length)
  storage.setItem(community.COMMUNITY_STORAGE_KEY, JSON.stringify({ version: 1, posts: [{ id: 1 }], comments: 'x' }))
  assert.equal((await repo.listPosts()).length, seedModule.communitySeed.posts.length)
})

test('markdown parser produces code blocks, inline marks and lists', () => {
  const blocks = markdown.parseMarkdown('# Tiêu đề\n\nĐoạn **đậm** và `code`.\n\n```cpp\npinMode(2, OUTPUT);\n```\n\n- một\n- hai\n\n1. a\n2. b\n\n> trích')
  assert.deepEqual(blocks.map(block => block.type), ['heading', 'paragraph', 'code', 'list', 'list', 'quote'])
  assert.equal(blocks[2].lang, 'cpp')
  assert.equal(blocks[2].text, 'pinMode(2, OUTPUT);')
  assert.deepEqual(blocks[1].children.map(node => node.type), ['text', 'strong', 'text', 'code', 'text'])
  assert.equal(blocks[3].ordered, false)
  assert.equal(blocks[4].ordered, true)
})

test('markdown keeps HTML as plain text and drops unsafe link protocols', () => {
  const blocks = markdown.parseMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1)) [ok](https://example.com)')
  const inline = blocks[0].children
  assert.equal(inline[0].type, 'text')
  assert.match(inline[0].text, /<img src=x onerror=alert\(1\)>/)
  assert.match(inline[0].text, /\[x\]\(javascript:alert\(1\)\)/)
  const link = inline.find(node => node.type === 'link')
  assert.equal(link.href, 'https://example.com/')
  assert.equal(markdown.safeLinkHref('data:text/html,hi'), null)
})

test('community UI never injects raw HTML', async () => {
  const files = ['src/components/community/MarkdownView.tsx', 'src/components/community/MarkdownEditor.tsx', 'src/pages/CommunityPage.tsx', 'src/pages/CommunityPostPage.tsx', 'src/pages/CommunityNewPostPage.tsx']
  for (const file of files) assert.doesNotMatch(await readFile(file, 'utf8'), /dangerouslySetInnerHTML|innerHTML/, file)
})

test('auth helpers accept HTTPS avatars and block open redirects', () => {
  assert.equal(authUser.safeAvatarUrl('https://avatars.example/u.png'), 'https://avatars.example/u.png')
  assert.equal(authUser.safeAvatarUrl('javascript:alert(1)'), null)
  assert.equal(authUser.safeAvatarUrl('http://avatars.example/u.png'), null)
  assert.equal(authUser.safeNextPath('/community/abc'), '/community/abc')
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil', 'javascript:alert(1)', '/login?next=/x', '']) assert.equal(authUser.safeNextPath(bad), '/community', bad)
  assert.equal(authUser.initialsOf('Nguyễn Văn An'), 'NA')
  assert.equal(authUser.initialsOf('Chi (mẫu)'), 'C')
  assert.equal(markdown.markdownExcerpt('1. ESP32-C3 + **BME280**\n- RPI-RP2'), 'ESP32-C3 + BME280 RPI-RP2')
})

test('login and community routes are registered without removing existing ones', async () => {
  const [routes, registry, app, nav, workspaceNav, shell] = await Promise.all(['src/data/productRoutes.ts', 'src/data/productFeatureRegistry.ts', 'src/App.tsx', 'src/components/SiteNavigation.tsx', 'src/components/AppWorkspaceNavigation.tsx', 'src/components/SiteShell.tsx'].map(file => readFile(file, 'utf8')))
  assert.match(routes, /publicCommunity:\s*'\/community'/)
  assert.match(routes, /appCommunity:\s*'\/app\/community'/)
  assert.match(routes, /publicLogin:\s*'\/login'/)
  assert.match(routes, /appLogin:\s*'\/app\/login'/)
  assert.match(routes, /authCallback:\s*'\/auth\/callback'/)
  for (const path of ['R.publicLogin', 'R.appLogin', 'R.authCallback', 'R.publicCommunity', 'R.appCommunity']) assert.match(app, new RegExp(`path=\\{${path.replace('.', '\\.')}\\}`), path)
  assert.match(app, /path="\/admin\/login"/)
  assert.match(registry, /type ProductFeatureId[^\n]*'community'/)
  assert.match(registry, /features: \['community'\]/)
  assert.match(nav, /F\.community\.publicRoute/)
  assert.match(workspaceNav, /<AuthMenu variant="app"/)
  assert.match(shell, /<AuthMenu variant="public"/)
  assert.match(await readFile('src/lib/auth.ts', 'utf8'), /return startSelfHostedOAuth\(provider, next\)/)
})

test('the website uses the Node backend and has no legacy database client dependency', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'))
  assert.equal(manifest.dependencies['@supabase/supabase-js'], undefined)
  const env = await readFile('.env.example', 'utf8')
  assert.doesNotMatch(env, /VITE_(?:MACHMO_LEGACY_)?SUPABASE/i)
  const repository = await readFile('src/lib/communityStore.ts', 'utf8')
  assert.match(repository, /createSelfHostedCommunityRepository\(\)/)
  assert.match(repository, /createPreviewRepository\(communitySeed, storage\)/)
})
