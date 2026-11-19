import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const courseKey = 'machmo-beginner-course-v1'
let sourceServer, savedCourse, boards
test.beforeAll(async () => {
  sourceServer = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const engine = await sourceServer.ssrLoadModule('/src/lib/beginnerCourse.ts')
  let session = { ...engine.createBeginnerSession(), activityId: 'sensor-threshold', boardId: 'esp32-devkit', prediction: 'on' }
  session.controls.inputPercent = 51
  session = engine.observeBeginnerSession(session).session
  session.controls.threshold = 75
  session.hintsUsed['sensor-threshold'] = 1
  savedCourse = JSON.stringify(session, null, 2)
  boards = engine.getBeginnerBoardOptions().map(board => ({ id: board.boardId, name: board.name }))
})
test.afterAll(async () => { await sourceServer?.close() })

function seededData(raw = savedCourse) {
  const workspace = { schemaVersion: 4, placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [], simBoard: 'esp32-devkit', lesson: 'blink', code: '// PRIVATE LEARNER DRAFT', projectId: 'teacher-isolation', layout: { zoom: 1 } }
  const bundle = { format: 'mach-mo-project', version: 1, exportedAt: '2026-11-18T00:00:00Z', workspace, lessonDrafts: { blink: { 'esp32-devkit': workspace.code } }, branchSession: {}, branchDrafts: {} }
  return {
    [courseKey]: raw,
    'machmo-builder-session': JSON.stringify(workspace, null, 2),
    'machmo-lesson-drafts': JSON.stringify(bundle.lessonDrafts),
    'machmo-saved-projects': JSON.stringify([{ id: 'isolation', name: 'PRIVATE PROJECT', updatedAt: bundle.exportedAt, bundle, revisions: [], tags: [] }]),
  }
}

async function start(page, route, raw = savedCourse, storageMode = 'normal') {
  await page.addInitScript(({ entries, storageMode, courseKey }) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, freestyle: 1, lab: 1 }))
    const get = Storage.prototype.getItem
    const set = Storage.prototype.setItem
    window.__teacherWrites = []
    window.__teacherReadStorage = () => Object.fromEntries(Object.keys(entries).map(key => [key, get.call(localStorage, key)]))
    Storage.prototype.getItem = function (key) {
      if (storageMode === 'blocked' && key === courseKey) throw new DOMException('blocked', 'SecurityError')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      window.__teacherWrites.push(key)
      if (storageMode !== 'normal') throw new DOMException('blocked', storageMode === 'quota' ? 'QuotaExceededError' : 'SecurityError')
      return set.call(this, key, value)
    }
  }, { entries: seededData(raw), storageMode, courseKey })
  await page.goto(route)
  await expect(page.getByRole('heading', { name: 'Nền tảng điện tử', exact: true })).toBeVisible()
  await page.locator('.beginner-teacher-pack summary').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Board của gói giáo viên', { exact: true })).toBeVisible()
  await page.evaluate(() => { window.__teacherWrites = [] })
}

async function chooseAndDownload(page, board = 'arduino-uno-r3') {
  const select = page.getByLabel('Board của gói giáo viên', { exact: true })
  await select.focus()
  // Native select keyboard interaction from the intentionally empty first option.
  await page.keyboard.press('Home')
  const index = boards.findIndex(item => item.id === board)
  for (let step = 0; step <= index; step++) await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toHaveValue(board)
  const button = page.getByRole('button', { name: 'Tải gói HTML', exact: true })
  await expect(button).toBeEnabled()
  await button.focus()
  const download = page.waitForEvent('download')
  await page.keyboard.press('Enter')
  return download
}

for (const route of ['/learn/basics', '/app/learn/basics']) {
  for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    test(`teacher pack keyboard, offline and print ${route} ${viewport.width}`, async ({ page, browser }, testInfo) => {
      await page.setViewportSize(viewport)
      await start(page, route)
      const before = await page.evaluate(() => window.__teacherReadStorage())
      const select = page.getByLabel('Board của gói giáo viên', { exact: true })
      await expect(select).toHaveValue('')
      await expect(page.getByLabel('Board của thử nghiệm', { exact: true })).toHaveValue('esp32-devkit')
      await expect(page.getByRole('button', { name: 'Tải gói HTML', exact: true })).toBeDisabled()
      const preview = page.frameLocator('iframe[title="Xem trước gói thực hành giáo viên"]')
      await expect(preview.locator('#teacher-answer-key')).toContainText('Chưa thể đánh giá')
      const download = await chooseAndDownload(page)
      expect(download.suggestedFilename()).toBe('mach-mo-teacher-pack-arduino-uno-r3.html')
      const filePath = testInfo.outputPath(download.suggestedFilename())
      await download.saveAs(filePath)
      const html = await readFile(filePath, 'utf8')
      expect(html).toContain('<meta charset="utf-8">')
      expect(html).toContain('Arduino Uno R3')
      expect(html).not.toMatch(/PRIVATE LEARNER|PRIVATE PROJECT|potPercent &gt; 75|<script|<form|<link|<img|url\(|(?:src|href)=/i)
      await expect(preview.locator('#teacher-answer-key')).not.toContainText('Chưa thể đánh giá')
      await expect(preview.locator('#teacher-answer-key')).toContainText('Arduino Uno R3')
      await page.getByRole('button', { name: 'Tải gói HTML', exact: true }).focus()
      await page.keyboard.press('Tab')
      await expect(page.locator('iframe[title="Xem trước gói thực hành giáo viên"]')).toBeFocused()
      const previewContent = preview.getByRole('main', { name: 'Nội dung gói thực hành giáo viên' })
      if (!await previewContent.evaluate(element => element === document.activeElement)) await page.keyboard.press('Tab')
      await expect(previewContent).toBeFocused()
      await page.keyboard.press('PageDown')
      await expect.poll(() => preview.locator('html').evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      const unoKey = await preview.locator('#teacher-answer-key').innerText()
      await select.selectOption('esp32-devkit')
      await expect(preview.locator('#teacher-answer-key')).toContainText('ESP32 DevKit V1')
      expect(await preview.locator('#teacher-answer-key').innerText()).not.toBe(unoKey)
      expect(await page.evaluate(() => window.__teacherReadStorage())).toEqual(before)
      expect(await page.evaluate(() => window.__teacherWrites)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await preview.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)

      const offline = await browser.newContext({ offline: true, viewport })
      try {
        const opened = await offline.newPage()
        const network = []
        opened.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()) })
        await opened.goto(pathToFileURL(filePath).href)
        await expect(opened.locator('.worksheet-case')).toHaveCount(13)
        await expect(opened.locator('#teacher-answer-key')).toContainText('Arduino Uno R3')
        await expect(opened.locator('#teacher-answer-key')).toContainText('potPercent > 50')
        expect(await opened.locator('script,link,img,iframe,form').count()).toBe(0)
        expect(network).toEqual([])
        await opened.emulateMedia({ media: 'print' })
        expect(await opened.locator('#teacher-answer-key').evaluate(element => getComputedStyle(element).breakBefore)).toBe('page')
        expect(await opened.locator('.worksheet-case').first().evaluate(element => getComputedStyle(element).breakInside)).toBe('avoid')
        expect(await opened.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
        await opened.pdf({ path: testInfo.outputPath('teacher-pack-print.pdf'), format: 'A4', preferCSSPageSize: true })
      } finally { await offline.close() }
    })
  }
}

for (const [name, raw, mode] of [
  ['malformed', '{ teacher original bytes', 'normal'],
  ['newer', '{"schema":99,"courseVersion":99,"private":"keep bytes"}', 'normal'],
  ['blocked', undefined, 'blocked'],
  ['quota', undefined, 'quota'],
]) {
  test(`teacher pack remains usable without storage writes: ${name}`, async ({ page }) => {
    await start(page, '/learn/basics', raw ?? savedCourse, mode)
    const before = await page.evaluate(() => window.__teacherReadStorage())
    const download = await chooseAndDownload(page)
    expect(download.suggestedFilename()).toBe('mach-mo-teacher-pack-arduino-uno-r3.html')
    expect(await page.evaluate(() => window.__teacherReadStorage())).toEqual(before)
    expect(await page.evaluate(() => window.__teacherWrites)).toEqual([])
    await expect(page.getByRole('heading', { name: 'Nền tảng điện tử', exact: true })).toBeVisible()
  })
}
