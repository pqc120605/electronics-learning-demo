import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let measure

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  measure = await server.ssrLoadModule('/src/lib/waveformMeasure.ts')
})

after(async () => { await server?.close() })

test('RC transient cursors report delta time and delta voltage with units', () => {
  const result = measure.measureAnalogCursors([
    { time: 0, value: 0 },
    { time: 0.001, value: 0.632 },
    { time: 0.002, value: 0.865 },
  ], 0, 2, 's', 'V')
  assert.deepEqual(result, { deltaTime: 0.002, deltaValue: 0.865, timeUnit: 's', valueUnit: 'V' })
})

test('AVR blink trace estimates 2.03 Hz and 50 percent duty as logic only', () => {
  const events = [
    { time: 0, level: false },
    { time: 246.305, level: true },
    { time: 492.611, level: false },
    { time: 738.916, level: true },
    { time: 985.222, level: false },
    { time: 1231.527, level: true },
  ]
  const result = measure.measureLogicSignal(events)
  assert.ok(Math.abs(result.frequencyHz - 2.03) <= 0.05)
  assert.ok(Math.abs(result.dutyCycle - 50) <= 1)
  assert.equal(result.valueUnit, 'logic')
})

test('invalid or unordered analog samples are not measured', () => {
  assert.equal(measure.measureAnalogCursors([{ time: 1, value: 2 }, { time: 0, value: 3 }], 0, 1, 's', 'V'), null)
})

test('frequency-axis cursors label their x difference as delta frequency', () => {
  assert.equal(measure.formatAxisDeltaSymbol('frequency'), 'Δf')
  assert.equal(measure.formatAxisDeltaSymbol('time'), 'Δt')
})
