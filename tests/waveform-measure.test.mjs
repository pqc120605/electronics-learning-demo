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

test('a complete transition period preserves exact frequency, duty and plateau semantics', () => {
  const events = [
    { time: 0, level: false }, { time: 10, level: true },
    { time: 20, level: false }, { time: 30, level: true },
  ]
  assert.deepEqual(measure.measureLogicSignal(events), { frequencyHz: 50, dutyCycle: 50, periods: 1, valueUnit: 'logic' })
  assert.deepEqual(measure.measureLogicSignal([
    events[0], { time: 5, level: false }, events[1], { time: 15, level: true },
    events[2], { time: 25, level: false }, events[3],
  ]), measure.measureLogicSignal(events))
})

test('invalid transition timestamps never leave a plausible partial estimate', () => {
  const prefix = [{ time: 0, level: false }, { time: 10, level: true }, { time: 20, level: false }, { time: 30, level: true }]
  for (const time of [NaN, Infinity, -1, 15, 30]) {
    assert.equal(measure.measureLogicSignal([...prefix, { time, level: false }, { time: 50, level: true }]), null, `invalid timestamp ${time}`)
  }
})

test('malformed events and non-boolean levels are unmeasurable without throwing', () => {
  const prefix = [{ time: 0, level: false }, { time: 10, level: true }, { time: 20, level: false }, { time: 30, level: true }]
  for (const event of [null, undefined, {}, { time: 40 }, { time: 40, level: 'LOW' }, { time: 40, level: 1 }]) {
    let result
    assert.doesNotThrow(() => { result = measure.measureLogicSignal([...prefix, event]) })
    assert.equal(result, null)
  }
  for (const events of [null, undefined, {}, new Array(4), []]) {
    let result
    assert.doesNotThrow(() => { result = measure.measureLogicSignal(events) })
    assert.equal(result, null)
  }
})

test('an initial HIGH or a partial pulse does not invent a preceding rising edge', () => {
  assert.equal(measure.measureLogicSignal([{ time: 0, level: true }, { time: 10, level: false }, { time: 20, level: true }]), null)
  assert.equal(measure.measureLogicSignal([{ time: 0, level: false }, { time: 10, level: true }, { time: 20, level: false }]), null)
})

test('finite timestamps that overflow the calculated frequency remain unmeasurable', () => {
  assert.equal(measure.measureLogicSignal([
    { time: 0, level: false }, { time: 1e-320, level: true },
    { time: 2e-320, level: false }, { time: 3e-320, level: true },
  ]), null)
})
