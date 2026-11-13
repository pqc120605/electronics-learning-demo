import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let curriculumLessons
let getPracticeChallengeKinds

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ curriculumLessons } = await server.ssrLoadModule('/src/data/curriculumSchema.ts'))
  ;({ getPracticeChallengeKinds } = await server.ssrLoadModule('/src/lib/practiceChallengeCoverage.ts'))
})

after(async () => { await server?.close() })

test('every current lesson has a capability-matched practice challenge', () => {
  const expected = new Map([
    ['blink', ['led-prediction']],
    ['source-led', ['led-prediction']],
    ['button-led', ['led-prediction', 'input-output']],
    ['analog-potentiometer', ['led-prediction', 'input-output']],
    ['analog-ldr', ['led-prediction', 'input-output']],
    ['ir-alert', ['led-prediction', 'input-output']],
    ['ultrasonic-distance', ['led-prediction', 'input-output']],
    ['seven-segment-counter', ['seven-segment']],
    ['buck-boost-concept', ['scenario-prediction']],
    ['dc-motor-driver', ['scenario-prediction']],
    ['mosfet-switch', ['scenario-prediction']],
  ])

  assert.equal(curriculumLessons.length, expected.size)
  assert.deepEqual(new Set(curriculumLessons.map(lesson => lesson.id)), new Set(expected.keys()))
  for (const lesson of curriculumLessons) {
    assert.deepEqual(getPracticeChallengeKinds(lesson.id), expected.get(lesson.id), lesson.id)
  }
})

test('an unknown lesson does not inherit a challenge from another lesson', () => {
  assert.deepEqual(getPracticeChallengeKinds('not-a-real-lesson'), [])
})
