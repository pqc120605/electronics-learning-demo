import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

let server
let spice

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  spice = await server.ssrLoadModule('/src/simulation/spiceNetlist.ts')
})

after(async () => { await server?.close() })

test('the bundled ngspice engine solves a 1:1 DC divider locally', async () => {
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(`Voltage Divider
V1 in 0 DC 5
R1 in out 1k
R2 out 0 1k
.op
.end`)

  const result = await simulation.runSim()
  assert.equal(result.dataType, 'real')
  assert.ok(result.numPoints >= 1)
  assert.ok(result.variableNames.some((name) => name.toLowerCase().includes('out')))
  const output = result.data.find((item) => item.name.toLowerCase().includes('out'))
  assert.ok(output, `expected output node in ${result.variableNames.join(', ')}`)
  assert.ok(Math.abs(output.values[0] - 2.5) < 1e-6, `expected 2.5 V, got ${output.values[0]}`)
})

test('SPICE normalizes a Unicode lesson title before sending the netlist to ngspice', async () => {
  const netlist = `Voltage divider · 5 V to 2.5 V
V1 IN 0 DC 5
R1 IN OUT 1k
R2 OUT 0 1k
.op
.end`
  const prepared = spice.normalizeSpiceNetlistForEngine(netlist)
  assert.equal(prepared.split('\n')[0], 'Voltage divider 5 V to 2.5 V')
  assert.equal(prepared.split('\n').slice(1).join('\n'), netlist.split('\n').slice(1).join('\n'))

  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(prepared)
  const result = await simulation.runSim()
  const output = result.data.find((item) => item.name.toLowerCase().includes('out'))
  assert.ok(output, `expected output node in ${result.variableNames.join(', ')}`)
  assert.ok(Math.abs(output.values[0] - 2.5) < 1e-6, `expected 2.5 V, got ${output.values[0]}`)
})

test('SPICE editor accepts bounded resistor-capacitor transient netlists', () => {
  const report = spice.inspectSpiceNetlist(`RC step response
V1 IN 0 PULSE(0 5 0 1us 1us 5ms 10ms)
R1 IN OUT 1k
C1 OUT 0 10u
.tran 10us 50ms
.end`)
  assert.deepEqual(report.errors, [])
  assert.equal(report.maxAnalysisPoints, 5_001)
})

test('SPICE result point budget also guards adaptive solver output', () => {
  assert.doesNotThrow(() => spice.assertSpiceResultPointBudget(20_000))
  assert.throws(() => spice.assertSpiceResultPointBudget(20_001), /vượt giới hạn 20\.000/)
  assert.throws(() => spice.assertSpiceResultPointBudget(Number.NaN), /số điểm kết quả hợp lệ/)
})

test('SPICE editor rejects file access, control commands, unknown devices, and unbounded analysis', () => {
  for (const netlist of [
    'unsafe\n.include secret.lib\n.op\n.end',
    'unsafe\n.control\nshell whoami\n.endc\n.end',
    'unknown\nX1 a b model\n.op\n.end',
    'huge\nV1 a 0 DC 5\nR1 a 0 1k\n.tran 1n 1s\n.end',
  ]) assert.ok(spice.inspectSpiceNetlist(netlist).errors.length > 0, netlist)
})

test('SPICE editor rejects malformed source and model lines before starting the engine', () => {
  for (const netlist of [
    'bad source\nV1 in 0 nonsense 5\nR1 in 0 1k\n.op\n.end',
    'bad model\nV1 in 0 DC 5\nD1 in 0 D1\n.model D1 D nope\n.op\n.end',
  ]) assert.ok(spice.inspectSpiceNetlist(netlist).errors.length > 0, netlist)
})

test('SPICE validator accepts the standard diode model form used by the LED example', () => {
  const report = spice.inspectSpiceNetlist(`LED with series resistor · idealized model
V1 VIN 0 DC 5
R1 VIN ANODE 330
D1 ANODE 0 DLED
.model DLED D(IS=1e-14 N=2)
.op
.end`)
  assert.deepEqual(report.errors, [])
})

test('custom netlist selector and textarea retain an accessible description and error relation', async () => {
  const source = await (await import('node:fs/promises')).readFile('src/pages/SpiceWorkbenchPage.tsx', 'utf8')
  assert.match(source, /id="spice-netlist-error"/)
  assert.match(source, /aria-describedby=\{runState === 'error' && inspection\.errors\.length \? 'spice-netlist-help spice-netlist-error' : 'spice-netlist-help'\}/)
  assert.match(source, /<option value="custom">Netlist tùy chỉnh<\/option>/)
  assert.match(source, /const WORKER_TIMEOUT_MS = 30_000/)
  assert.match(source, /engine WASM khoảng 6,1 MB/)
})

test('SPICE engineering suffixes convert to SI values', () => {
  assert.ok(Math.abs(spice.spiceNumberValue('10us') - 10e-6) < 1e-18)
  assert.equal(spice.spiceNumberValue('1Meg'), 1e6)
  assert.equal(spice.spiceNumberValue('4.7k'), 4700)
  assert.ok(Math.abs(spice.spiceNumberValue('-22n') + 22e-9) < 1e-20)
})
