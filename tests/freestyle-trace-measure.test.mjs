import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let server, measure, trace, Waveform
const sample = (atMs, level, pwm) => ({ atMs, pins: level === undefined ? {} : { 13: { mode: 'output', level, ...(pwm === undefined ? {} : { pwm }) } } })
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  measure = await server.ssrLoadModule('/src/lib/freestyle/freestyleTraceMeasure.ts')
  trace = await server.ssrLoadModule('/src/lib/freestyle/freestyleTrace.ts')
  ;({ FreestyleWaveform: Waveform } = await server.ssrLoadModule('/src/components/freestyle/FreestyleWaveform.tsx'))
})
after(async () => { await server?.close() })

test('sampled cursors expose absolute milliseconds and logic levels in either order or at the same sample', () => {
  const samples = [sample(0, false), sample(25, true), sample(75, false)]
  assert.deepEqual(measure.measureSampledCursors(samples, 13, 25, 75), {
    status: 'ok', a: { atMs: 25, level: 'HIGH' }, b: { atMs: 75, level: 'LOW' }, deltaMs: 50,
  })
  assert.equal(measure.measureSampledCursors(samples, 13, 75, 25).deltaMs, 50)
  assert.equal(measure.measureSampledCursors(samples, 13, 25, 25).deltaMs, 0)
})

test('missing states stay unknown and PWM remains separately identified metadata without inferred edges', () => {
  const samples = [sample(25), sample(75, true, 0.5)]
  assert.deepEqual(measure.measureSampledCursors(samples, 13, 25, 75), {
    status: 'ok', a: { atMs: 25, level: 'UNKNOWN' }, b: { atMs: 75, level: 'HIGH', pwm: 0.5 }, deltaMs: 50,
  })
  assert.equal(measure.measureSampledCursors(samples, 99, 25, 75).a.level, 'UNKNOWN')
})

test('rolling history resolves timestamps, evicts old selections, and refreshes equal-time replacements', () => {
  let samples = []
  for (let atMs = 0; atMs < 600; atMs++) samples = trace.appendTrace(samples, { simulatedMilliseconds: atMs, pins: sample(atMs, false).pins })
  assert.equal(samples[0].atMs, 88)
  assert.equal(measure.measureSampledCursors(samples, 13, 100, 599).a.atMs, 100)
  assert.equal(measure.measureSampledCursors(samples, 13, 20, 599).status, 'missing-cursor')
  samples = trace.appendTrace(samples, { simulatedMilliseconds: 599, pins: sample(599, true).pins })
  assert.equal(measure.measureSampledCursors(samples, 13, 100, 599).b.level, 'HIGH')
  assert.equal(measure.measureSampledCursors(samples, 13, 20, 599).status, 'missing-cursor')
  assert.equal(measure.measureSampledCursors(samples, 13, 599, 599).a.level, 'HIGH', 'surviving endpoint remains independently readable after its peer is evicted')
})

test('invalid chronology or cursor input returns a reason without throwing or returning a number', () => {
  for (const samples of [[], [sample(NaN)], [sample(Infinity)], [sample(-1)], [sample(2), sample(1)], [sample(1), sample(1)], null, [{ atMs: 0 }]]) {
    const result = measure.measureSampledCursors(samples, 13, 0, 1)
    assert.notEqual(result.status, 'ok')
    assert.equal(result.deltaMs, undefined)
  }
  assert.equal(measure.measureSampledCursors([sample(0)], 13, NaN, 0).status, 'missing-cursor')
})

test('SSR exposes independent measurement controls, default semantics and truthful units', () => {
  const samples = [sample(0, false), sample(25, true), sample(75, false, 0.5)]
  const html = renderToStaticMarkup(createElement(Waveform, { samples, boardId: 'arduino-uno-r3', source: 'Runtime fixture', running: false }))
  assert.match(html, /Kênh đo/)
  assert.match(html, /<label for="[^"]+">Kênh đo<\/label><select id="[^"]+"/)
  assert.match(html, /<label for="[^"]+">Con trỏ A<\/label><input id="[^"]+"/)
  assert.match(html, /Con trỏ A/)
  assert.match(html, /Con trỏ B/)
  assert.match(html, /Δt: 75 ms/)
  assert.match(html, /PWM metadata runtime: 50%/)
  assert.match(html, /Mặc định A\/B/)
  assert.doesNotMatch(html, /Hz|dutyCycle|frequencyHz/)
})

test('SSR rounds visible and accessible milliseconds without rounding sampled identity or delta math', () => {
  const render = samples => renderToStaticMarkup(createElement(Waveform, { samples, boardId: 'arduino-uno-r3', source: 'Runtime fixture', running: false }))
  const samples = [sample(66.03000000298016, false), sample(615.4, true)]
  const raw = measure.measureSampledCursors(samples, 13, 66.03000000298016, 615.4)
  assert.equal(raw.a.atMs, 66.03000000298016)
  assert.equal(raw.deltaMs, 549.3699999970198)
  assert.equal(measure.measureSampledCursors(samples, 13, 66.03, 615.4).status, 'missing-cursor')
  const html = render(samples)
  assert.match(html, /aria-valuetext="66\.03 ms mô phỏng · LOW"/)
  assert.match(html, /data-cursor="A" aria-live="off">66\.03 ms mô phỏng · LOW/)
  assert.match(html, /Δt: 549\.37 ms/)
  assert.match(html, /Cửa sổ hiện tại: 66\.03–615\.4 ms/)
  assert.match(html, /class="freestyle-wave-axis"><span>66\.03 ms<\/span><span>615\.4 ms mô phỏng/)
  assert.doesNotMatch(html, /66\.03000000298016|549\.3699999970198/)

  const deltaSamples = [sample(1000.03, false), sample(1549.3999999999996, true)]
  assert.equal(measure.measureSampledCursors(deltaSamples, 13, 1000.03, 1549.3999999999996).deltaMs, 549.3699999999997)
  const deltaHtml = render(deltaSamples)
  assert.match(deltaHtml, /Δt: 549\.37 ms/)
  assert.doesNotMatch(deltaHtml, /549\.3699999999997|1549\.3999999999996/)
  const fineHtml = render([sample(0, false), sample(1.23456, true)])
  assert.match(fineHtml, /aria-valuetext="1\.235 ms mô phỏng · HIGH"/)
  assert.match(fineHtml, /Δt: 1\.235 ms/)
})

test('measurement channels include GPIOs outside the eight-channel drawing limit', () => {
  const samples = [{ atMs: 0, pins: Object.fromEntries(Array.from({ length: 30 }, (_, pin) => [pin, { mode: 'output', level: true }])) }]
  const html = renderToStaticMarkup(createElement(Waveform, { samples, boardId: 'esp32-devkit', source: 'Runtime fixture', running: false }))
  assert.equal((html.match(/data-wave-pin=/g) ?? []).length, 8)
  assert.doesNotMatch(html, /data-wave-pin="29"/)
  assert.match(html, /value="29">GPIO 29/)
})

test('nonempty missing-pin windows still offer timestamp deltas with UNKNOWN endpoints', () => {
  const html = renderToStaticMarkup(createElement(Waveform, { samples: [sample(25), sample(75)], boardId: 'arduino-uno-r3', source: 'Runtime fixture', running: false }))
  assert.match(html, /Δt: 50 ms/)
  assert.match(html, /25 ms mô phỏng · UNKNOWN/)
  assert.match(html, /75 ms mô phỏng · UNKNOWN/)
  assert.doesNotMatch(html, /data-wave-pin=/)
})

test('continuous readings are not live announcements and invalid PWM cannot appear as measured metadata', () => {
  for (const pwm of [NaN, Infinity, -0.5, 1.5]) {
    const html = renderToStaticMarkup(createElement(Waveform, { samples: [sample(0, true, pwm)], boardId: 'arduino-uno-r3', source: 'Runtime fixture', running: true }))
    assert.match(html, /aria-valuetext="0 ms mô phỏng · HIGH"/)
    assert.match(html, /data-cursor="A" aria-live="off"/)
    assert.match(html, /class="freestyle-measure-result" aria-live="off"/)
    assert.doesNotMatch(html, /NaN%|Infinity%|-50%|150%|PWM 50%/)
  }
})
