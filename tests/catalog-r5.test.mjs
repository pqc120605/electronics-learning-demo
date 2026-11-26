import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const expected = {
  lm386: [8, 'load', 0.1],
  max98357a: [17, 'speaker', 0.5],
  tpa2012d2: [21, 'left', 0.4],
  ne5532: [8, 'outa', 1],
  l293d: [16, 'a', 0.28333],
  drv8833: [17, 'a', 0.2 / 0.68],
  drv8825: [29, 'phaseA', 0.426],
  uln2003a: [16, 'first', 0.1],
  uln2803a: [18, 'first', 0.1],
  drv8871: [9, 'a', 0.64],
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
let server
const load = name => server.ssrLoadModule('/src/' + name + '.ts')
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

test('R5 approval is unchanged', async () => {
  assert.equal(sha(await readFile('docs/research/2026-11-26-catalog-fidelity-r5-proposal.md')),
    '73833c9605921928a9a37fdedc3721eca4a333b9779f7ccfd561137ab0613dce')
})

for (const [id, [count, probe, value]] of Object.entries(expected)) {
  test(id + ' has matching pads, a wired circuit and a detectable break', async () => {
    const { getCatalogPart } = await load('data/catalogParts')
    const { getComponentMesh, catalogPackageAssets } = await load('data/componentModels')
    const { createR5Fixture } = await load('simulation/catalogR5Fixtures')
    const { measureR5 } = await load('simulation/catalogR5Lab')
    const { validateCircuitDoc } = await load('lib/circuitDocV2')
    const attachment = getCatalogPart(id)
    assert.equal(attachment?.revision, 'R5')
    assert.equal(attachment.pins.length, count)
    const asset = catalogPackageAssets[attachment.packageKey]
    const mesh = getComponentMesh(attachment.id)
    assert.equal(sha(await readFile('public' + mesh.file)), asset.sha256)
    assert.equal(sha(await readFile('public/models/components/catalog-r5/' + asset.footprint)), asset.footprintSha256)
    assert.deepEqual(asset.pads.map(pad => pad.pad), attachment.pins.map(pin => pin.pad))
    assert.equal(mesh.legsMm.length, count)
    const { createEmptyFreestyleDoc, placePart } = await load('lib/freestyle/freestyleCircuit')
    const { footprintHoles } = await load('lib/mountResolve')
    const placed = placePart(createEmptyFreestyleDoc(), attachment.id).doc.parts.find(item => item.type === attachment.id)
    const dip = asset.pads.every(pad => pad.drill > 0)
    assert.equal(placed.mount.kind, dip ? 'breadboard' : 'bench')
    if (dip) assert.equal(footprintHoles(placed).length, count)
    const { doc, disconnect } = createR5Fixture(id)
    assert.deepEqual(validateCircuitDoc(doc).filter(issue => issue.severity === 'error'), [])
    const measurement = measureR5(doc, 'ic')
    assert.equal(measurement.ok, true, measurement.text)
    if (['lm386', 'ne5532'].includes(id)) {
      assert.match(measurement.netlist, /\.tran 5u 12m/)
      assert.ok(measurement.probes[probe])
    } else {
      assert.ok(Math.abs(measurement.values[probe] - value) < Math.abs(value) * 0.05, measurement.text)
    }
    const broken = { ...doc, wires: doc.wires.filter(wire => wire.id !== disconnect) }
    assert.equal(measureR5(broken, 'ic').ok, false)
  })
}

const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' ≠ ' + expected)
const change = (doc, id, value) => ({ ...doc, parts: doc.parts.map(part => part.id === id ? { ...part, value: { ...part.value, ...value } } : part) })
const disconnect = (doc, id) => ({ ...doc, wires: doc.wires.filter(wire => wire.id !== id) })

async function lab(id, variant) {
  const { createR5Fixture } = await load('simulation/catalogR5Fixtures')
  const { measureR5 } = await load('simulation/catalogR5Lab')
  const { doc } = createR5Fixture(id, variant)
  return { doc, run: (mode, state = doc) => measureR5(state, 'ic', mode) }
}

test('LM386 gain and clipping are determined by the wired capacitor and source', async () => {
  const base = await lab('lm386')
  assert.match(base.run().netlist, /20\*V/)
  const gain = await lab('lm386', 'gain')
  assert.match(gain.run().netlist, /200\*V/)
  const clip = await lab('lm386', 'clip')
  assert.match(clip.run().netlist, /SIN\(0 0\.04 1000\)/)
  assert.equal(gain.run(undefined, disconnect(gain.doc, 'wire-ic-gain8')).ok, false)
})

test('NE5532 gain comes from feedback resistors and both rails are required', async () => {
  const { doc, run } = await lab('ne5532')
  assert.match(run().text, /10×/)
  assert.match(run(undefined, change(doc, 'feedback', { ohm: 4000 })).text, /5×/)
  assert.equal(run(undefined, disconnect(doc, 'wire-ic-in1n')).ok, false)
  assert.equal(run(undefined, disconnect(doc, 'wire-ic-in2n')).ok, false)
})

test('MAX98357A handles signed PCM, channel selection, gain and missing clock', async () => {
  const { doc, run } = await lab('max98357a')
  assert.equal(run('left').values.pcmLeft, 8192)
  assert.equal(run('left').values.pcmRight, -4096)
  for (const [mode, peak] of [['left', 0.5], ['right', 0.25], ['mix', 0.125], ['sleep', 0]]) near(run(mode).values.speaker, peak)
  assert.notEqual(run('early').values.pcmLeft, 8192)
  for (const clock of ['bclk', 'lrclk', 'din']) assert.equal(run('left', disconnect(doc, 'wire-ic-' + clock)).ok, false)
  for (const [pad, db] of [['vdd', 6], ['gnd', 12]]) {
    const wire = { id: 'gain-wire', from: {kind:'pin',partId:'ic',pinId:'gain'}, to: {kind:'pin',partId:'ic',pinId:pad} }
    const state = { ...doc, wires: [...doc.wires, wire] }
    near(run('left', state).values.speaker, 0.5 * 10 ** ((db - 9) / 20))
  }
})

test('TPA2012D2 tests all four gains, both shutdown inputs and BTL wiring', async () => {
  const { doc, run } = await lab('tpa2012d2')
  for (const gain of [2, 4, 8, 16]) {
    const { values } = run('g' + gain)
    near(values.left, gain * 0.1)
    near(values.right, gain * 0.075)
  }
  assert.equal(run('left-off').values.left, 0)
  assert.equal(run('right-off').values.right, 0)
  const invalid = { ...doc, wires: doc.wires.map(wire => wire.id === 'wire-ic-outln'
    ? { ...wire, to: { kind:'pin', partId:'ic', pinId:'agnd' } }
    : wire) }
  assert.equal(run('g4', invalid).ok, false)
})

for (const id of ['l293d', 'drv8833', 'drv8871']) {
  test(id + ' reverses direction and brakes faster than coasting', async () => {
    const { run } = await lab(id)
    assert.ok(run('forward').values.velocityA > 0)
    near(run('reverse').values.velocityA, -run('forward').values.velocityA)
    assert.ok(run('brake').values.velocityA < run('coast').values.velocityA)
    if (id === 'l293d') {
      assert.equal(run('brake').values.in1, 0)
      assert.equal(run('brake').values.in2, 0)
      const brakeHigh = run('brake-high').values
      assert.equal(brakeHigh.in1, 1)
      assert.equal(brakeHigh.in2, 1)
      assert.equal(brakeHigh.enable, 1)
      near(brakeHigh.velocityA, run('brake').values.velocityA)
    }
    if (id !== 'drv8871') assert.ok(run('independent').values.velocityB < 0)
    if (id !== 'l293d') {
      const result = run('sleep')
      assert.equal(result.samples[0].values.enable, 0)
      assert.equal(result.samples.at(-1).values.enable, 1)
      near(result.values.wakeMs, id === 'drv8833' ? 2 : 0.06)
    }
  })
}

test('L293D rejects out-of-domain loads and drivers read changed sense resistors', async () => {
  const l293 = await lab('l293d')
  assert.equal(l293.run('locked', change(l293.doc, 'motor-a', { ohm: 3 })).ok, false)
  const drv8833 = await lab('drv8833')
  const dual = drv8833.run('locked', change(drv8833.doc, 'sense-b', { ohm: 1 }))
  near(dual.values.a, 0.2 / 0.68)
  near(dual.values.b, 0.2)
  const drv8871 = await lab('drv8871')
  near(drv8871.run('locked', change(drv8871.doc, 'limit', { ohm: 128000 })).values.a, 0.5)
})

test('DRV8825 follows the three index tables, DIR, HOME, RESET and ENBL', async () => {
  const { run } = await lab('drv8825')
  const { phaseA, phaseB, home } = run('home').values
  near(phaseA, 0.426); near(phaseB, 0.426); assert.equal(home, 0)
  const indexes = mode => run(mode).samples.map(sample => sample.values.index)
  assert.deepEqual(indexes('full'), [4, 12, 20, 28, 4])
  assert.deepEqual(indexes('half'), [4, 8, 12, 16, 20])
  assert.deepEqual(indexes('eighth'), [4, 5, 6, 7, 8])
  assert.deepEqual(indexes('dir'), [4, 3, 2, 1, 0])
  assert.deepEqual(indexes('disable'), [4, 4, 4, 4, 4])
  const reset = run('reset').values
  assert.equal(reset.home, 0)
  assert.equal(reset.phaseA, 0)
  assert.equal(reset.phaseB, 0)
  near(run('eighth').values.phaseB, 0.6)
  near(run('eighth').values.iB, 0.6, 0.01)
})

for (const [id, last, clamp] of [['uln2003a', 7, 6.2], ['uln2803a', 8, 10.2]]) {
  test(id + ' clamps the inductive load and detects mismatched channel wiring', async () => {
    const { doc, run } = await lab(id)
    for (const [mode, channel] of [['first', 1], ['last', last]]) {
      const result = run(mode)
      assert.equal(result.values.active, channel)
      near(result.values['ch' + channel], 0.1, 0.0003)
      assert.equal(result.values['ch' + (channel === 1 ? last : 1)], 0)
      assert.equal(result.samples.find(point => point.timeMs === 6).values.v, clamp)
      assert.equal(result.samples.at(-1).values.i, 0)
    }
    for (let i = 1; i <= last; i++) assert.equal(run('first', disconnect(doc, 'wire-ic-out' + i)).ok, false)
  })
}

test('R5 allows only the fixed transient behavior form in SPICE', async () => {
  const { inspectSpiceNetlist } = await load('simulation/spiceNetlist')
  const netlist = (await lab('lm386', 'clip')).run().netlist
  assert.deepEqual(inspectSpiceNetlist(netlist).errors, [])
  for (const unsafe of [netlist.replace('min(max(200', 'min(max(201'), netlist.replace('5u 12m 0 5u', '5u 15m 0 5u')]) {
    assert.ok(inspectSpiceNetlist(unsafe).errors.length)
  }
})

test('R5 rejects wired devices outside the approved model', async () => {
  const { doc, run } = await lab('lm386')
  const part = { id: 'extra-led', type: 'led', mount: { kind: 'bench', lane: 'right', order: 99 } }
  const wire = { id: 'extra-wire', from: { kind: 'pin', partId: 'ic', pinId: 'out' },
    to: { kind: 'pin', partId: part.id, pinId: 'anode' } }
  const changed = { ...doc, parts: [...doc.parts, part], wires: [...doc.wires, wire] }
  assert.equal(run(undefined, changed).ok, false)
  assert.equal(run(undefined, { ...changed, wires: doc.wires }).ok, true)
})

test('R5 draft round-trip preserves both circuits, values, endpoint IDs and wire bends', async () => {
  const { blankFreestyleWorkspace, parseFreestyleWorkspace } = await load('lib/freestyle/freestyleCircuit')
  for (const id of ['lm386', 'drv8871']) {
    const { doc } = await lab(id, 'gain')
    const w = { ...blankFreestyleWorkspace(), doc, wireLayout: { [doc.wires[0].id]: { x: 110, y: 120 } } }
    const restored = parseFreestyleWorkspace(JSON.stringify(w))
    assert.deepEqual(restored?.doc, doc)
    assert.deepEqual(restored?.wireLayout, w.wireLayout)
  }
})
