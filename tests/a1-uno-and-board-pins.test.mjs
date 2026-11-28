import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'
import { a1Approval, loadApprovedA1 } from '../scripts/approved-a1-inputs.mjs'

const approved = await loadApprovedA1()
const rawArtifact = await readFile(new URL('../src/data/a1-uno-firmware.json', import.meta.url), 'utf8').catch(error => {
  if (error.code !== 'ENOENT') throw error
  return undefined
})
const artifacts = rawArtifact && JSON.parse(rawArtifact)
const hexFile = file => readFile(new URL('../public' + file, import.meta.url), 'utf8')
let server
let fixtures, circuit, machine, boards, dht, docs, boardData, spice, practice, capability

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true }, envFile: false })
  ;[fixtures, circuit, machine, boards, dht, docs, boardData, spice, practice, capability] = await Promise.all([
    '/src/lib/freestyle/a1UnoFixtures.ts', '/src/lib/freestyle/coupledCircuit.ts', '/src/lib/avrLiveMachine.ts', '/src/lib/boardCatalogModels.ts',
    '/src/simulation/dhtWire.ts', '/src/lib/circuitDocV2.ts', '/src/data/boards.ts', '/src/simulation/spiceNetlist.ts',
    '/src/simulation/unoA1Spice.ts', '/src/data/boardCapabilityRegistry.ts',
  ].map(path => server.ssrLoadModule(path)))
})
after(async () => { await server?.close() })

test('A1 indexes every catalog board at the correct revision without changing original pin IDs', async () => {
  assert.deepEqual(boardData.boards.map(board => board.id), approved.catalog.boardIds)
  let total = 0
  for (const board of boardData.boards) {
    const pins = await boards.getBoardHeaderPins(board.id)
    total += pins.length
    assert.ok(pins.length, board.id)
    assert.equal(new Set(pins.map(pin => pin.catalog.key)).size, pins.length, board.id)
    assert.equal(new Set(pins.map(pin => pin.id)).size, pins.length, board.id)
    assert.ok(pins.every(pin => pin.catalog.revision === board.revision), board.id)
    const joined = capability.getBoardCapability(board.id, pins)
    assert.ok(pins.every(pin => joined.pinMap[pin.catalog.key]?.label === pin.label), board.id)
  }
  assert.equal(total, 1276)
  const nucleo = await boards.loadBoardCatalogModel('stm32-nucleo')
  assert.equal(nucleo.pins.length, 108)
  assert.equal(nucleo.pinPicking, true)
  const model = await readFile(new URL('../public' + nucleo.assetUrl.split('?')[0], import.meta.url))
  const atlas = JSON.parse(await readFile(new URL('../src/data/boardTopViews.json', import.meta.url)))
  assert.equal(atlas['stm32-nucleo'].assetSha256, createHash('sha256').update(model).digest('hex'))
  assert.equal(nucleo.pins.find(pin => pin.id === 'cn7-9').catalog.status,'nc')
  assert.equal(nucleo.pins.find(pin => pin.id === 'cn5-6').label, 'D13 / PA5')
  for (const [ref, labels] of Object.entries(approved.catalog.nucleoF401.labelsInPadOrder)) {
    const pins = nucleo.pins.filter(pin => pin.headerReference === ref).sort((a,b) => a.position-b.position)
    assert.deepEqual(pins.map(p => p.label), labels)
    assert.ok(pins.every(pin => pin.anchor?.every(Number.isFinite)))
  }
  const pico = await boards.loadBoardCatalogModel('raspberry-pi-pico')
  assert.equal(pico.pinoutEvidence.sourceUrl, approved.catalog.picoR3.reference)
  assert.equal(pico.pins.length, 40)
  assert.equal(pico.pins.find(pin => pin.label === 'VBUS').catalog.role, 'power')
  assert.equal(pico.pins.find(pin => pin.gpio === 15).catalog.role, 'signal')
})

test('ngspice calculates the locked SA56 one-segment current in both states', async (test) => {
  const simulation = new Simulation()
  await simulation.start()
  const approvedSpice = approved.electrical.fixture
  for (const [i, variant] of practice.unoA1Spice.variants.entries()) {
    assert.deepEqual(spice.inspectSpiceNetlist(variant.netlist).errors, [])
    simulation.setNetList(variant.netlist)
    const result = await simulation.runSim()
    const value = name => result.data.find(item => item.name.toLowerCase() === name)?.values[0]
    const currentMa = value('i(vout)') * 1000
    const ledVolts = value('v(vcc)') - value('v(cathode)')
    const resistorVolts = value('v(cathode)') - value('v(gpio)')
    assert.ok(Math.abs(resistorVolts - currentMa * approvedSpice.seriesOhm / 1000) < 1e-6)
    assert.ok(Math.abs(ledVolts + resistorVolts - (5 - value('v(gpio)'))) < 1e-6)
    assert.ok(i === 0 ? currentMa >= 2 && currentMa <= 4 : Math.abs(currentMa) <= .001)
    test.diagnostic(JSON.stringify({ state: i ? 'HIGH' : 'LOW', currentMa, ledVolts, resistorVolts }))
  }
})

test('A1 fixtures keep their exact approved wiring and detect unsafe omissions', () => {
  for (const sample of fixtures.a1UnoFixtures) {
    const { doc, pinMap } = fixtures.buildA1UnoFixture(sample)
    assert.equal(docs.validateCircuitDoc(doc).filter(issue => issue.severity === 'error').length, 0, sample.id)
    const checked = circuit.compileCoupledCircuit(doc, 'arduino-uno-r3', pinMap)
    assert.equal(checked.ok, true, JSON.stringify(checked.issues))
    if (!checked.ok) continue
    assert.equal(circuit.compileCoupledCircuit(doc, 'arduino-nano', pinMap).ok, false)
    const part = checked.graph.parts.find(item => item.id === 'a1-device')
    for (const [signal, target] of Object.entries(sample.pins)) {
      if (signal === 'pad3') continue
      if (target === '5V') { assert.ok(checked.graph.rail5.includes(part.pins[signal])); continue }
      if (target === 'GND') { assert.equal(part.pins[signal], checked.graph.ground); continue }
      const gpio = checked.graph.gpios.find(item => item.pin === Number(target.slice(1)))
      assert.ok(gpio, signal)
      if (sample.seriesOhmEach) {
        const limiter = checked.graph.parts.find(item => item.id === 'a1-r-' + signal)
        assert.equal(limiter.pins.a, gpio.net)
        assert.equal(limiter.pins.b, part.pins[signal])
        assert.equal(limiter.resistanceOhm, 1000)
      } else assert.equal(part.pins[signal], gpio.net)
    }
    if (sample.reading) {
      const noPullup = { ...doc, wires: doc.wires.filter(w => w.from.partId !== 'a1-r-pullup' && w.to.partId !== 'a1-r-pullup') }
      assert.equal(circuit.compileCoupledCircuit(noPullup, 'arduino-uno-r3', pinMap).ok, false)
    }
    if (sample.seriesOhmEach) {
      const low = { ...doc, parts: doc.parts.map(p => p.id === 'a1-r-a' ? { ...p, value: { ohm: 1 } } : p) }
      assert.equal(circuit.compileCoupledCircuit(low, 'arduino-uno-r3', pinMap).ok, false)
      const short = { ...doc, wires: [...doc.wires, { id: 'shorted-limiter', from: { kind: 'pin', partId: 'a1-r-a', pinId: 'a' },
        to: { kind: 'pin', partId: 'a1-r-a', pinId: 'b' } }] }
      assert.equal(circuit.compileCoupledCircuit(short, 'arduino-uno-r3', pinMap).ok, false)
    }
  }
})

test('DHT packets keep the checksum, negative sign and pulse widths on CPU time', () => {
  assert.deepEqual(dht.dhtPacket('dht11',23,55),[55,0,23,0,78])
  assert.deepEqual(dht.dhtPacket('dht22',-5.4,55.5),[2,43,128,54,227])
  const wire = dht.createDhtWire('dht11')
  wire.step(10,true,false,23,55)
  assert.equal(wire.step(18009,false,false,23,55).nextMicroseconds, Infinity)
  wire.step(30000,true,false,23,55)
  assert.equal(wire.step(50000,false,false,23,55).nextMicroseconds,50030)
  assert.deepEqual(wire.step(50030,false,false,23,55), { low:true, nextMicroseconds: 50110 })
  assert.deepEqual(wire.step(50110,false,false,23,55), { low:false, nextMicroseconds: 50190 })
})

async function setupRun(id) {
  const sample = fixtures.getA1UnoFixture(id)
  const { doc, pinMap, controls } = fixtures.buildA1UnoFixture(sample)
  const graph = circuit.compileCoupledCircuit(doc, 'arduino-uno-r3', pinMap).graph
  const asset = artifacts.fixtures[id]
  const hex = await hexFile(asset.file)
  assert.equal(createHash('sha256').update(hex).digest('hex'), asset.sha256)
  return machine.createAvrLiveMachine(hex, 'arduino-uno-r3', { graph, stimuli: controls })
}

if (process.env.MACHMO_REQUIRE_A1 === '1' && !artifacts) throw new Error('A1 compiled firmware artifacts are required')
for (const [id, expected] of [['dht11','DHT11 230 dC 550 dRH OK'],['dht22-bare','DHT22 -54 dC 555 dRH OK']]) {
  test(id + ' compiled HEX reads the simulated wire and validates its checksum', { skip: !artifacts }, async () => {
    assert.equal(artifacts.approval, a1Approval)
    const run = await setupRun(id)
    const frame = run.runFor(110)
    assert.ok(frame.serial.includes(expected), frame.serial)
    const edges = frame.coupled.dataEdges
    assert.ok(edges.length >= 84, JSON.stringify(edges))
    const widths = edges.slice(1).map((edge, i) => edge.timeUs - edges[i].timeUs)
    assert.ok(widths.some(us => us >= 78 && us <= 82))
    assert.ok(widths.some(us => us >= 68 && us <= 72))
    assert.ok(widths.some(us => us >= 25 && us <= 29))
  })
}

test('compiled keypad scan distinguishes every key and reports release through UART', { skip: !artifacts }, async () => {
  const run = await setupRun('keypad-4x4')
  assert.match(run.runFor(35).serial, /KEY IDLE/)
  for (const [index,key] of [...'123A456B789C*0#D'].entries()) {
    run.setCircuitStimuli({ 'a1-device':index })
    assert.ok(run.runFor(45).serial.includes('KEY ' + key), key)
    run.setCircuitStimuli({})
    assert.match(run.runFor(45).serial, /KEY IDLE/)
  }
})

test('DHT firmware times out when its simulated peripheral is disconnected', { skip: !artifacts }, async () => {
  const sample = fixtures.getA1UnoFixture('dht11')
  const { doc, pinMap, controls } = fixtures.buildA1UnoFixture(sample)
  const graph = circuit.compileCoupledCircuit(doc, 'arduino-uno-r3', pinMap).graph
  const hex = await hexFile(artifacts.fixtures.dht11.file)
  assert.throws(() => machine.createAvrLiveMachine(hex, 'arduino-nano', { graph, stimuli: controls }), /không khớp/)
  const lostSensor = { ...graph, parts: graph.parts.filter(part => part.kind !== 'dht11') }
  const frame = machine.createAvrLiveMachine(hex, 'arduino-uno-r3', { graph: lostSensor, stimuli: controls }).runFor(100)
  assert.match(frame.serial, /DHT11 TIMEOUT OR CHECKSUM/)
  assert.doesNotMatch(frame.serial, /dRH OK/)
})

test('compiled SA56 drive reaches each display segment through the correct LOW net', { skip: !artifacts }, async () => {
  const run = await setupRun('seven-segment-anode')
  const patterns = ['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg']
  for (let n = 0; n < 10; n++) {
    const frame = run.runFor(n === 0 ? 35 : 120)
    assert.ok(frame.serial.includes('DIGIT ' + n), frame.serial)
    assert.deepEqual(frame.coupled.segments['a1-device'], [...patterns[n], ...(n === 9 ? ['dp'] : [])])
  }
})
