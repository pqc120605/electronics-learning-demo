import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let saveDraft

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ saveDraft } = await server.ssrLoadModule('/src/lib/draftStorage.ts'))
})

after(async () => { await server?.close() })

test('draft save enters the warning path when browser storage throws', () => {
  let warningShown = false
  const storage = { setItem() { throw new Error('quota exceeded') } }
  saveDraft(storage, 'drafts', '{}', () => { warningShown = true })
  assert.equal(warningShown, true)
})

test('draft save does not enter the warning path when browser storage succeeds', () => {
  let warningShown = false
  let written
  const storage = { setItem(key, value) { written = [key, value] } }
  saveDraft(storage, 'drafts', '{}', () => { warningShown = true })
  assert.deepEqual(written, ['drafts', '{}'])
  assert.equal(warningShown, false)
})
