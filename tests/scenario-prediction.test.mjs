import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let compareScenarioPrediction

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ compareScenarioPrediction } = await server.ssrLoadModule('/src/lib/scenarioPrediction.ts'))
})

after(async () => { await server?.close() })

test('scenario predictions compare an explicit answer to the reported model outcome', () => {
  assert.equal(compareScenarioPrediction('higher', 'higher'), true)
  assert.equal(compareScenarioPrediction('reverse', 'forward'), false)
})

test('scenario prediction refuses empty or non-text values', () => {
  assert.equal(compareScenarioPrediction('', 'higher'), null)
  assert.equal(compareScenarioPrediction('higher', ''), null)
  assert.equal(compareScenarioPrediction(null, 'higher'), null)
})
