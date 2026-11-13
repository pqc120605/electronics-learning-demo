import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let boardModelSources
let boards
const meshInventory = JSON.parse(await readFile(new URL('../src/data/seeed-xiao-esp32-s3.mesh-inventory.json', import.meta.url), 'utf8'))

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ boardModelSources } = await server.ssrLoadModule('/src/data/boardModelSources.ts'))
  ;({ boards } = await server.ssrLoadModule('/src/data/boards.ts'))
})

after(async () => { await server?.close() })

test('XIAO ESP32-S3 evidence copy is Vietnamese and preserves source attribution/license', () => {
  const evidence = boardModelSources['seeed-xiao-esp32-s3']
  assert.match(evidence.revision, /bản thường/)
  assert.match(evidence.attribution, /Seeed Studio/)
  assert.match(evidence.attribution, /@SeeedStudio/)
  assert.match(evidence.attribution, /CC BY-SA 4\.0/)
  assert.match(evidence.attribution, /chuyển từ STEP sang GLB/)
  assert.doesNotMatch(`${evidence.revision} ${evidence.licenseName} ${evidence.attribution}`, /regular board|Keep attribution|identify the STEP/i)

  const board = boards.find((candidate) => candidate.id === 'seeed-xiao-esp32-s3')
  assert.match(board.revision, /bản thường/)
  assert.doesNotMatch(`${board.revision} ${meshInventory.revision}`, /official STEP|regular board|not Sense\/Plus/i)
  assert.match(meshInventory.revision, /bản thường/)
})
