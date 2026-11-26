import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { catalogR1Approval, catalogR1Parts, r1Packages } from '../src/data/catalogR1Parts.ts'
import {
  advanceFlipFlop, advanceMcp3008, advanceShiftRegister, andGate,
  captureMcp3008, initialFlipFlop, initialShiftRegister, resetAdc, schmittInverter,
} from '../src/simulation/catalogR1Digital.ts'

let server
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

test('R1 lock, package maps and model hashes agree with the approved eight MPNs', async () => {
  const { getComponentMeshForCatalog } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const packages = JSON.parse(await readFile('src/data/catalog-r1-packages.json', 'utf8'))
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(hash(await readFile('docs/research/2026-11-25-catalog-fidelity-r1-proposal.md')), catalogR1Approval)
  const pinout = {
    SN74HC08N: '1a 1b 1y 2a 2b 2y gnd 3y 3a 3b 4y 4a 4b vcc',
    SN74HC14N: '1a 1y 2a 2y 3a 3y gnd 4y 4a 5y 5a 6y 6a vcc',
    SN74HC74N: '1clr 1d 1clk 1pre 1q 1qn gnd 2qn 2q 2pre 2clk 2d 2clr vcc',
    SN74HC595N: 'qb qc qd qe qf qg qh gnd qhs srclr srclk rclk oe ser qa vcc',
    '1N4148-TAP': 'k a', '2N3904BU': 'e b c', TMP36GT9Z: 'vs vout gnd',
    'MCP3008-I/P': 'ch0 ch1 ch2 ch3 ch4 ch5 ch6 ch7 dgnd cs din dout sclk agnd vref vdd',
  }
  assert.equal(catalogR1Parts.length, 8)
  for (const part of catalogR1Parts) {
    const mesh = getComponentMeshForCatalog(part.catalogId)
    const selectedPackage = r1Packages[part.packageKey]
    const generated = packages[part.packageKey]
    assert.equal(part.pins.map(pin => pin.id).join(' '), pinout[part.mpn])
    assert.equal(mesh.id, part.id)
    assert.equal(generated.footprintSha256, selectedPackage.footprintSha)
    assert.equal(generated.sourceSha256, selectedPackage.stepSha)
    assert.ok(generated.maxOffsetMm <= 0.05)
    assert.equal(hash(await readFile('public' + mesh.file)), mesh.sha256)
    for (const pin of part.pins) {
      const pad = generated.pads.find(item => item.pad === pin.pad)
      assert.deepEqual(mesh.pinsMm[pin.id], [pad.x, 0, pad.z])
    }
  }
})

test('DIP placement keeps its leads across the breadboard gap and TO-92 stays on the bench', async () => {
  const { footprintHoles } = await server.ssrLoadModule('/src/lib/mountResolve.ts')
  const { createEmptyFreestyleDoc, placePart } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  for (const part of catalogR1Parts.filter(part => part.packageKey.startsWith('dip'))) {
    for (const rotation of [0, 90, 180, 270]) {
      const mount = { kind: 'breadboard', board: 'bb1', row: rotation === 90 ? 5 : 4, col: 12, rotation }
      const holes = footprintHoles({ type: part.id, mount })
      if (rotation % 180 === 0) assert.equal(holes, null)
      else {
        assert.equal(holes.length, part.pins.length)
        assert.deepEqual([...new Set(holes.map(hole => hole.row))].sort(), ['e', 'f'])
      }
    }
    const placed = placePart(createEmptyFreestyleDoc(), part.id, { col: 10, row: 4 })
    assert.ok(placed.partId)
    assert.equal(placed.doc.parts.at(-1).mount.rotation, 270)
  }
  for (const part of catalogR1Parts.filter(part => part.packageKey === 'to92')) {
    const placed = placePart(createEmptyFreestyleDoc(), part.id)
    assert.equal(placed.doc.parts.at(-1).mount.kind, 'bench')
  }
})

test('AND, Schmitt hysteresis and the flip-flop obey power, uncertainty and clock boundaries', () => {
  assert.deepEqual([[0,0],[0,1],[1,0],[1,1]].map(([a,b]) => andGate(true,a,b)), [0,0,0,1])
  assert.equal(andGate(false, 1, 1), 'X')
  assert.equal(andGate(true, 1, 'X'), 'X')
  let q = 'X'
  assert.deepEqual([0,2,2.5,2,1.6].map(volts => q = schmittInverter(true, volts, q)), [1,1,0,0,1])
  assert.equal(schmittInverter(false, 0, 1), 'X')
  let ff = initialFlipFlop
  const step = overrides => ff = advanceFlipFlop(ff, { powered: true, clk: 0, d: 1, pre: 1, clr: 1, ...overrides })
  assert.equal(step({}).q, 'X')
  assert.equal(step({ clk: 1 }).q, 1)
  assert.equal(step({ clk: 1, d: 0 }).q, 1)
  assert.equal(step({ clr: 0 }).q, 0)
  assert.deepEqual([step({ clr: 0, pre: 0 }).q, ff.qn], [1, 1])
  assert.equal(step({}).q, 'X')
  assert.equal(step({ powered: false }).qn, 'X')
})

test('595 shifts 0x96, latches on its own clock and retains data while disabled or clearing shift', () => {
  let state = initialShiftRegister()
  const step = overrides => {
    const result = advanceShiftRegister(state, { powered: true, ser: 0, srclk: 0, rclk: 0, srclr: 1, oe: 0, ...overrides })
    state = result.next
    return result
  }
  for (const serial of '10010110') { step({}); step({ srclk: 1, ser: Number(serial) }) }
  assert.equal(state.stored.join(''), 'XXXXXXXX')
  assert.equal(state.shift[7], 1)
  assert.equal(step({ rclk: 1 }).q.toReversed().join(''), '10010110')
  assert.equal(step({ oe: 1 }).q.join(''), 'ZZZZZZZZ')
  assert.equal(step({ srclr: 0 }).q.toReversed().join(''), '10010110')
  assert.equal(state.shift.join(''), '00000000')
  assert.equal(step({ powered: false }).q.join(''), 'XXXXXXXX')
})

test('MCP3008 mode 0 has the null bit, MSB-first order, exact channel selection and CS reset', () => {
  const volts = [0, 0.625, 1.25, 1.875, 2.5, 3.125, 3.75, 5]
  for (const [channel, expected] of [0,128,256,384,512,640,768,1023].entries()) {
    const trace = captureMcp3008(channel, volts, true)
    assert.equal(trace.clocks.length, 17)
    assert.equal(trace.clocks[6].dout, 0)
    assert.equal(trace.code, expected)
    assert.deepEqual(trace.clocks.slice(7).map(sample => sample.dout).join(''), expected.toString(2).padStart(10, '0'))
  }
  assert.equal(captureMcp3008(4, volts, false).code, undefined)
  assert.equal(captureMcp3008(4, volts, true, 0).code, undefined)
  let state = resetAdc()
  const step = overrides => state = advanceMcp3008(state, { powered: true, cs: 0, clock: 0, din: 1, channelVolts: volts, ...overrides })
  assert.equal(step({ clock: 1 }).command.length, 0)
  step({ cs: 1 })
  assert.deepEqual(step({ clock: 1 }).command, [1])
  assert.deepEqual(step({ cs: 1 }).command, [])
  assert.equal(state.dout, 'Z')
})

test('all R1 SPICE fixtures pass the existing parser and temperature is constrained', async () => {
  const { inspectSpiceNetlist } = await server.ssrLoadModule('/src/simulation/spiceNetlist.ts')
  const { catalogR1Spice } = await server.ssrLoadModule('/src/simulation/catalogR1Spice.ts')
  for (const { variants } of catalogR1Spice) {
    for (const { netlist } of variants) assert.deepEqual(inspectSpiceNetlist(netlist).errors, [], netlist)
  }
  for (const directive of ['.temp 25 30', '.temp 126', '.temp 25e0', '.temp upload']) {
    assert.ok(inspectSpiceNetlist('Test\nV1 A 0 DC 5\n' + directive + '\n.op\n.end').errors.length)
  }
})
