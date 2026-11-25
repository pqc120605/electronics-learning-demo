import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
let server, plot, events
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  plot = await server.ssrLoadModule('/src/lib/freestyle/serialPlot.ts')
  events = await server.ssrLoadModule('/src/lib/freestyle/serialEvents.ts')
})
after(async () => server?.close())

test('Serial event time follows the frame that completed the line and the log stays bounded', () => {
  let state = events.appendSerialEvents(events.createSerialEvents(), 'first\r\nsecond', 12)
  state = events.appendSerialEvents(state, '\r\nthird\n', 534)
  assert.deepEqual(state.entries, [{text:'first',atMs:12},{text:'second',atMs:534},{text:'third',atMs:534}])
  state = events.appendSerialEvents(state, 'data\n'.repeat(100), 900)
  assert.equal(state.entries.length, 12)
  assert.equal(state.entries[0].atMs, 900)
})

test('only complete finite numeric or explicit labelled lines become samples', () => {
  let state = plot.createSerialPlot()
  state = plot.appendSerialPlot(state, 'boot 123\nLED: BAT\n1x\nNaN\nInfinity\n1e999\n0x10\n\n12')
  assert.deepEqual(state.samples, [])
  state = plot.appendSerialPlot(state, '.5\r\ntemp: -2.5, volts:3e-2\n7 junk\ntemp:1 temp:2\n')
  assert.deepEqual(state.samples, [
    { ordinal: 1, values: { 'Giá trị': 12.5 } },
    { ordinal: 2, values: { temp: -2.5, volts: 0.03 } },
  ])
})

test('fragmentation, oversized lines and reset never manufacture samples', () => {
  let state = plot.appendSerialPlot(plot.createSerialPlot(), 'temp:1')
  assert.equal(state.samples.length, 0)
  state = plot.appendSerialPlot(state, '2\n' + '9'.repeat(20000))
  assert.deepEqual(state.samples[0], { ordinal: 1, values: { temp: 12 } })
  assert.ok(state.partial.length <= plot.MAX_SERIAL_LINE)
  state = plot.appendSerialPlot(state, '3\n4\n')
  assert.deepEqual(state.samples[1], { ordinal: 2, values: { 'Giá trị': 4 } })
  state = plot.appendSerialPlot(plot.createSerialPlot(), '5\n')
  assert.deepEqual(state.samples, [{ ordinal: 1, values: { 'Giá trị': 5 } }])
})

test('history and series stay bounded while sample ordinals survive rolling truncation', () => {
  let state = plot.createSerialPlot()
  state = plot.appendSerialPlot(state, 'a:1 b:2 c:3 d:4 e:5\ne:6\na:7\n')
  assert.deepEqual(state.series, ['a', 'b', 'c', 'd'])
  assert.deepEqual(state.samples, [{ ordinal: 1, values: { a: 1, b: 2, c: 3, d: 4 } }, { ordinal: 2, values: { a: 7 } }])
  for (let i = 0; i < 600; i++) state = plot.appendSerialPlot(state, `a:${i}\n`)
  assert.equal(state.samples.length, plot.MAX_SERIAL_SAMPLES)
  assert.equal(state.samples.at(-1).ordinal, 602)
  assert.equal(state.samples[0].ordinal, 347)
  assert.deepEqual(state.samples.at(-1).values, { a: 599 })
})

test('CSV exports actual ordinals and values without assigning timestamps or filling gaps', () => {
  const state = plot.appendSerialPlot(plot.createSerialPlot(), 'a:2 b:-3\na:4\n')
  assert.equal(plot.serialPlotCsv(state), 'sample,series,value\r\n1,"a",2\r\n1,"b",-3\r\n2,"a",4\r\n')
  assert.equal(plot.serialPlotCsv(plot.createSerialPlot()), 'sample,series,value\r\n')
})

test('plot rendering preserves empty guidance, real series labels and finite extreme geometry', async () => {
  const { SerialPlotter } = await server.ssrLoadModule('/src/components/freestyle/SerialPlotter.tsx')
  const empty = renderToStaticMarkup(createElement(SerialPlotter, { state: plot.createSerialPlot(), source: 'Trình thông dịch rút gọn', expanded: true }))
  assert.match(empty, /Chưa có mẫu số/)
  assert.match(empty, /disabled/)
  const state = plot.appendSerialPlot(plot.createSerialPlot(), 'a:1e308\na:-1e308\n')
  const markup = renderToStaticMarkup(createElement(SerialPlotter, { state, source: 'Trình thông dịch rút gọn', expanded: true }))
  assert.match(markup, /role="img"/)
  assert.match(markup, /Thứ tự mẫu/)
  assert.match(markup, /Trình thông dịch rút gọn/)
  assert.doesNotMatch(markup, /NaN|Infinity/)
  const reserved = plot.appendSerialPlot(plot.createSerialPlot(), 'constructor:1\ntoString:2\n__proto__:3\n')
  const safeMarkup = renderToStaticMarkup(createElement(SerialPlotter, { state: reserved, source: 'Trình thông dịch rút gọn', expanded: true }))
  assert.doesNotMatch(safeMarkup, /NaN|Infinity/)
})
