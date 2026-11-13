import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, transfer, projectsPage, savedProjects
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  transfer = await server.ssrLoadModule('/src/lib/projectTransfer.ts')
  projectsPage = await server.ssrLoadModule('/src/pages/ProjectsPage.tsx')
  savedProjects = await server.ssrLoadModule('/src/lib/savedProjects.ts')
})
after(async () => { await server?.close() })

const bundle = () => ({
  format: 'mach-mo-project', version: 1, exportedAt: '2026-11-08T00:00:00.000Z',
  workspace: { schemaVersion: 4, placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [], simBoard: 'esp32-devkit', lesson: 'blink', code: '// current', projectId: 'portable-1', layout: { zoom: 1 } },
  lessonDrafts: { blink: { 'esp32-devkit': '// hand-edited draft' } }, branchSession: { mode: 'blocks', order: ['button-led', 'ir-alert'] }, branchDrafts: {},
})
function storage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return { get length() { return data.size }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null,
    setItem(k, v) { data.set(k, String(v)) }, removeItem: k => data.delete(k) }
}

test('oversize classification rejects above the limit and accepts the exact limit', () => {
  assert.equal(projectsPage.getProjectImportSizeError(5 * 1024 * 1024), '')
  assert.match(projectsPage.getProjectImportSizeError(5 * 1024 * 1024 + 1), /vượt quá giới hạn 5 MiB/i)
})

test('oversize inspection returns a recoverable size error without reading file contents', async () => {
  let read = false
  const inspected = await projectsPage.inspectProjectImportFile({ size: 5 * 1024 * 1024 + 1, text: async () => { read = true; throw new Error('must not read') } })
  assert.deepEqual(inspected, { kind: 'oversize', reason: 'Tệp project vượt quá giới hạn 5 MiB.' })
  assert.equal(read, false)
})

test('recovery blob preserves original File bytes without reading the file as text', async () => {
  const original = new File([new Uint8Array([0, 255, 13, 10, 1, 2])], 'broken.machmo.json', { type: 'application/json' })
  const recovered = projectsPage.createOriginalImportDownloadBlob(original)
  assert.deepEqual(new Uint8Array(await recovered.arrayBuffer()), new Uint8Array(await original.arrayBuffer()))
  assert.equal(recovered.type, 'application/json')
})

test('conflict imports remain separate library entries and leave workspace drafts untouched', () => {
  const raw = JSON.stringify(bundle())
  const preview = transfer.parseProjectImport(raw, 'conflict.machmo.json')
  assert.deepEqual(preview.issues.map(issue => issue.code), ['current-draft-conflict'])
  const workspaceBytes = JSON.stringify({ code: '// workspace draft', lesson: 'blink' })
  const draftsBytes = JSON.stringify({ blink: { 'esp32-devkit': '// learner draft' } })
  const target = storage({ 'machmo-builder-session': workspaceBytes, 'machmo-lesson-drafts': draftsBytes })
  const saved = projectsPage.saveImportedProjectToLibrary(preview.name, preview.bundle, target)
  assert.equal(saved.bundle.lessonDrafts.blink['esp32-devkit'], '// hand-edited draft')
  assert.equal(target.getItem('machmo-builder-session'), workspaceBytes)
  assert.equal(target.getItem('machmo-lesson-drafts'), draftsBytes)
  assert.equal(savedProjects.readSavedProjects(target).length, 1)
})

test('rendered valid review shows conflict and library-only affordance before save', () => {
  const preview = transfer.parseProjectImport(JSON.stringify(bundle()), 'conflict.machmo.json')
  let saves = 0
  const props = {
    preview, importName: preview.name, fileName: 'conflict.machmo.json', onNameChange() {}, onSave() { saves++ }, onCancel() {},
  }
  const tree = projectsPage.ProjectImportReview(props)
  const markup = renderToStaticMarkup(tree)
  assert.match(markup, /Xung đột bản nháp/)
  assert.match(markup, /Chỉ thêm vào thư viện; bản nháp trong workspace không bị thay đổi/)
  assert.match(markup, /Lưu vào thư viện/)
  assert.ok(markup.indexOf('Xung đột bản nháp') < markup.indexOf('Lưu vào thư viện'))
  assert.equal(saves, 0)
  findButton(tree, 'Lưu vào thư viện').props.onClick()
  assert.equal(saves, 1)
})

test('recovery buttons use only cancel or exact original File for download and expose no save action', async () => {
  let saves = 0, cancels = 0
  let downloaded
  const originalFile = new File([new Uint8Array([0, 255, 13, 10, 1, 2])], 'lesson backup.json', { type: 'application/json' })
  const problem = { status: 'invalid', reason: 'Tệp project vượt quá giới hạn 5 MiB.' }
  const props = { problem, originalFile, fileName: originalFile.name, onSave() { saves++ }, onDownloadOriginal(file) { downloaded = file }, onCancel() { cancels++ } }
  const tree = projectsPage.ProjectImportReview(props)
  const markup = renderToStaticMarkup(tree)
  assert.match(markup, /Tệp project vượt quá giới hạn 5 MiB/)
  assert.match(markup, /Tải bản gốc lesson backup\.json/)
  assert.doesNotMatch(markup, /Lưu vào thư viện/)
  findButton(tree, 'Tải bản gốc lesson backup.json').props.onClick()
  assert.equal(downloaded, originalFile)
  assert.equal(downloaded.name, 'lesson backup.json')
  const recovered = projectsPage.createOriginalImportDownloadBlob(downloaded)
  assert.deepEqual(new Uint8Array(await recovered.arrayBuffer()), new Uint8Array(await originalFile.arrayBuffer()))
  findButton(tree, 'Hủy').props.onClick()
  assert.equal(saves, 0)
  assert.equal(cancels, 1)
  assert.equal(findButtons(tree).some(button => String(button.props.children).includes('Lưu vào thư viện')), false)
})

test('unsupported recovery review names the original file, downloads it, and exposes only cancel', () => {
  let saves = 0, cancels = 0, downloaded
  const originalFile = new File(['future-format'], 'future-project.machmo.json', { type: 'application/json' })
  const tree = projectsPage.ProjectImportReview({
    problem: { status: 'unsupported', reason: 'Phiên bản bundle không được hỗ trợ.' },
    originalFile,
    fileName: originalFile.name,
    onSave() { saves++ },
    onDownloadOriginal(file) { downloaded = file },
    onCancel() { cancels++ },
  })
  const markup = renderToStaticMarkup(tree)
  assert.match(markup, /Tệp chưa thể nhập \(unsupported\)/)
  assert.match(markup, /Phiên bản bundle không được hỗ trợ/)
  assert.match(markup, /Tải bản gốc future-project\.machmo\.json/)
  assert.doesNotMatch(markup, /Lưu vào thư viện/)
  findButton(tree, 'Tải bản gốc future-project.machmo.json').props.onClick()
  assert.equal(downloaded, originalFile)
  findButton(tree, 'Hủy').props.onClick()
  assert.equal(saves, 0)
  assert.equal(cancels, 1)
})

test('new selection and cancel invalidate pending import read tokens', () => {
  const requests = projectsPage.createImportRequestToken()
  let applied = 0
  const first = requests.begin()
  const second = requests.begin()
  assert.equal(requests.isCurrent(first), false)
  assert.equal(requests.isCurrent(second), true)
  assert.equal(requests.runIfCurrent(first, () => applied++), false)
  assert.equal(requests.runIfCurrent(second, () => applied++), true)
  const third = requests.begin()
  requests.invalidate()
  assert.equal(requests.isCurrent(third), false)
  assert.equal(requests.runIfCurrent(third, () => applied++), false)
  assert.equal(applied, 1)
})

function findButtons(tree, buttons = []) {
  if (Array.isArray(tree)) { for (const child of tree) findButtons(child, buttons); return buttons }
  if (!tree || typeof tree !== 'object' || !tree.props) return buttons
  if (tree.type === 'button') buttons.push(tree)
  findButtons(tree.props.children, buttons)
  return buttons
}
function findButton(tree, label) {
  const button = findButtons(tree).find(item => item.props['aria-label'] === label || String(item.props.children) === label)
  assert.ok(button, `expected button ${label}`)
  return button
}
