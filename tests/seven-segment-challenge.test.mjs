import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let gradeSegmentPrediction

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ gradeSegmentPrediction } = await server.ssrLoadModule('/src/lib/segmentChallenge.ts'))
})

after(async () => { await server?.close() })

test('a correct seven-segment prediction matches all active segments', () => {
  assert.deepEqual(gradeSegmentPrediction([1, 1, 1, 1, 1, 1, 1], ['a', 'b', 'c', 'd', 'e', 'f', 'g']), {
    correct: true,
    missing: [],
    extra: [],
  })
})

test('a wrong prediction reports missing and extra segments in A-to-G order', () => {
  assert.deepEqual(gradeSegmentPrediction([1, 1, 0, 1, 0, 0, 1], ['a', 'c', 'g']), {
    correct: false,
    missing: ['b', 'd'],
    extra: ['c'],
  })
})

test('invalid table rows and unknown segment names are rejected', () => {
  assert.equal(gradeSegmentPrediction([1, 0, 1], ['a']), null)
  assert.equal(gradeSegmentPrediction([1, 0, 0, 0, 0, 0, 0], ['a', 'h']), null)
})
