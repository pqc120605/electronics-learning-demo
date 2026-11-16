import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

let server
let probes

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  probes = await server.ssrLoadModule('/src/simulation/spiceProbes.ts')
})

after(async () => { await server?.close() })

const divider = `Voltage divider
V1 IN 0 DC 5
R1 IN OUT 1k
R2 OUT 0 1k
.op
.end`

test('topology lists two-terminal elements and nodes with ground last', () => {
  const topology = probes.parseSpiceTopology(divider)
  assert.deepEqual(topology.nodes, ['in', 'out', '0'])
  assert.deepEqual(topology.elements.map(element => [element.name, element.kind, element.nodes]), [['v1', 'V', ['in', '0']], ['r1', 'R', ['in', 'out']], ['r2', 'R', ['out', '0']]])
})

test('instrumentation inserts a 0 V ammeter in series with each R/C/L/D and keeps sources untouched', () => {
  const { netlist, currentSeries } = probes.instrumentSpiceNetlist(divider)
  assert.match(netlist, /^R1 IN __mmp_r1 1k$/m)
  assert.match(netlist, /^vmmp_r1 __mmp_r1 OUT DC 0$/m)
  assert.match(netlist, /^vmmp_r2 __mmp_r2 0 DC 0$/m)
  assert.match(netlist, /^V1 IN 0 DC 5$/m)
  assert.deepEqual(currentSeries, { r1: 'i(vmmp_r1)', r2: 'i(vmmp_r2)' })
})

test('ngspice returns element currents through the ammeters without changing node voltages', async () => {
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(probes.instrumentSpiceNetlist(divider).netlist)
  const result = await simulation.runSim()
  const series = probes.cleanProbeSeries(result.data.map(column => ({ name: column.name, type: column.type, values: column.values.map(value => typeof value === 'number' ? value : value.real) })))
  const value = name => probes.probeValue(series, name, 0)
  assert.ok(Math.abs(value('v(out)') - 2.5) < 1e-9)
  assert.ok(Math.abs(value('i(r1)') - 0.0025) < 1e-9, 'current flows from IN to OUT through R1')
  assert.ok(Math.abs(value('i(r2)') - 0.0025) < 1e-9)
  assert.ok(value('i(v1)') < 0, 'ngspice reports source current entering the + node as positive')
  assert.equal(series.some(item => item.name.includes('__mmp_')), false)
  assert.equal(value('v(0)'), 0)
})

test('engineering formatting keeps sign and unit prefix', () => {
  assert.equal(probes.formatEngineering(0.0025, 'A'), '2,5 mA')
  assert.equal(probes.formatEngineering(-1.2e-6, 'A'), '-1,2 µA')
  assert.equal(probes.formatEngineering(undefined, 'V'), '—')
})
