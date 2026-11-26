import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

const pinouts = {
  lm7805: 'vin gnd vout', lm317: 'adj vout vin', tl431: 'ref a k',
  lm2596: 'vin sw gnd fb onoff', lm2577: 'comp fb gnd vin sw',
  tps61023: 'fb en vin gnd sw vout', lm1117: 'gnd vout vin',
  tps5430: 'boot nc2 nc3 fb en gnd vin sw ep',
  tps62160: 'pgnd vin en agnd fb vos sw pg ep',
  bq24074: 'ts bat2 bat3 ce en2 en1 pgood vss chg out10 out11 ilim vin tmr iterm iset ep',
  ref5025: 'dnc1 vin temp gnd trim vout nc7 dnc8', lm4040: 'k a nc3',
  '1n4007': 'k a', '1n5819': 'k a', '1n4733a': 'k a',
  '2n3906': 'e b c', tip120: 'b c e', irlz44n: 'g d s', '2n7000': 's g d',
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
let server
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

test('R3 integrates the 19 approved variants with a physical map and downloadable assets', async () => {
  const { getCatalogPart } = await server.ssrLoadModule('/src/data/catalogParts.ts')
  const { getComponentMesh, catalogPackageAssets } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const { createEmptyFreestyleDoc, placePart } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  const { footprintHoles } = await server.ssrLoadModule('/src/lib/mountResolve.ts')
  assert.equal(sha(await readFile('docs/research/2026-11-26-catalog-fidelity-r3-proposal.md')),
    '60db39dbfd91ebdb56032615a8b9afb0974626b4e8f57f0b06577345f94eed81')
  for (const [id, pins] of Object.entries(pinouts)) {
    const part = getCatalogPart(id)
    assert.equal(part?.revision, 'R3', id)
    assert.deepEqual(part.pins.map(pin => pin.id), pins.split(' '), id)
    const asset = catalogPackageAssets[part.packageKey]
    const mesh = getComponentMesh(part.id)
    const spec = 'adafruit-65-r2c-1'
    const placement = placePart(createEmptyFreestyleDoc(spec), part.id)
    assert.ok(placement.partId, id)
    const placed = placement.doc.parts.find(item => item.id === placement.partId)
    const mount = ['to220R3','do41R3'].includes(part.packageKey) ? 'breadboard' : 'bench'
    assert.equal(placed.mount.kind, mount)
    if (mount === 'breadboard') assert.equal(footprintHoles(placed, undefined, spec).length, part.pins.length)
    assert.equal(sha(await readFile('public' + mesh.file)), mesh.sha256)
    const path = 'public/models/components/catalog-r3/' + asset.footprint.split('/').at(-1)
    assert.equal(sha(await readFile(path)), asset.footprintSha256)
    assert.ok(asset.maxOffsetMm === null || asset.maxOffsetMm <= 0.15)
    for (const pin of part.pins) {
      const pad = asset.pads.find(item => item.pad === pin.pad)
      assert.deepEqual(mesh.pinsMm[pin.id], [pad.x, 0, pad.z])
    }
  }
  assert.equal(catalogPackageAssets.sot223R3.pads.filter(pad => pad.pad === 2).length, 2)
})

test('each R3 model has an ngspice lesson with at least two conditions', async () => {
  const { spicePractices } = await server.ssrLoadModule('/src/simulation/spicePractice.ts')
  for (const id of Object.keys(pinouts)) {
    const practice = spicePractices.find(item => item.id === 'r3-' + id)
    assert.ok(practice, id)
    assert.ok(practice.variants.length >= 2, id)
  }
})

const ranges = {
  lm7805: [[4.75, 5.25], [3.9, 4.1]],
  lm317: [[4.90, 5.18], [3.40, 3.60]],
  tl431: [[4.85, 5.15], [2.43, 2.56]],
  lm2596: [[4.75, 5.25], [0, 0.01]],
  lm2577: [[11.4, 12.2], [12.25, 12.6]],
  tps61023: [[4.75, 5.25], [0, 0.01]],
  lm1117: [[3.2, 3.4], [2.7, 2.9]],
  tps5430: [[4.75, 5.25], [0, 0.01]],
  tps62160: [[3.14, 3.46], [0, 0.01], [4.9, 5.1], [4.9, 5.1], [0, 0.05]],
  bq24074: [[360,410], [75,140], [-0.005,0.005], [-0.005,0.005], [4.3,4.5], [0,0.05], [0,0.05], [4.9,5.1]],
  ref5025: [[2.495, 2.505], [2.495, 2.505]],
  lm4040: [[2.49, 2.51], [2.49, 2.51]],
  '1n4007': [[0.50, 0.85], [0.45, 0.65], [-0.01, 0]],
  '1n5819': [[0.18, 0.45], [-1, 0]],
  '1n4733a': [[4.845, 5.355], [0.55, 0.95]],
  '2n3906': [[4.75, 5], [-0.0047, 0.0047]],
  tip120: [[0.6, 1.5], [4.9953, 5.001]],
  irlz44n: [[0, 0.01], [4.9995, 5.001], [0.25, 0.9]],
  '2n7000': [[0, 0.25], [4.9975, 5.001], [0.25, 0.9]],
}

for (const [id, results] of Object.entries(ranges)) {
  test(id + ' solves each wired operating point in ngspice', async () => {
    const { findSpicePractice, practiceValue } = await server.ssrLoadModule('/src/simulation/spicePractice.ts')
    const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
    const { getR3CircuitFixture } = await server.ssrLoadModule('/src/simulation/catalogR3Fixtures.ts')
    const { inspectSpiceNetlist } = await server.ssrLoadModule('/src/simulation/spiceNetlist.ts')
    const { blankFreestyleWorkspace, parseFreestyleWorkspace } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
    const practice = findSpicePractice('r3-' + id)
    assert.equal(practice.variants.length, results.length)
    const simulation = new Simulation()
    await simulation.start()
    for (const [index, variant] of practice.variants.entries()) {
      const [low, high] = results[index]
      const fixture = getR3CircuitFixture(id + '-r3', index)
      const restored = parseFreestyleWorkspace(JSON.stringify({ ...blankFreestyleWorkspace(), doc: fixture.doc }))
      assert.ok(restored, id + ' draft round-trip')
      assert.deepEqual(restored.doc.wires, fixture.doc.wires)
      const compile = compileFreestyleAnalog(restored.doc, '', 25)
      assert.equal(compile.ok, true, compile.issues?.join(' '))
      assert.equal(variant.netlist, compile.netlist)
      assert.deepEqual(inspectSpiceNetlist(variant.netlist).errors, [])
      simulation.setNetList(variant.netlist)
      const measured = await simulation.runSim()
      const value = practiceValue(practice, variant, measured.data)
      assert.ok(Number.isFinite(value) && value >= low && value <= high,
        id + ' ' + variant.label + ': ' + value + ' outside [' + low + ', ' + high + ']')
      if (index === 0 && ['lm2596','lm2577','tps61023','tps5430','tps62160'].includes(id)) {
        const input = measured.data.find(row => row.name.toLowerCase() === compile.sourceSignals.supply).values[0]
        const output = value
        const [vin, resistance, eta, divider] = {
          lm2596:[12,20,0.85,Infinity],lm2577:[5,120,0.8,9760],
          tps61023:[3.3,50,0.8,841000],tps5430:[12,20,0.85,13240],tps62160:[5,16.5,0.85,412000],
        }[id]
        const watts = output * output * (1 / resistance + 1 / divider)
        assert.ok(Math.abs(-input * vin * eta - watts) <= .001)
      }
      if (index === 0 && id === 'bq24074') {
        const input = measured.data.find(row => row.name.toLowerCase() === compile.sourceSignals.supply).values[0]
        assert.ok(-input >= 0.49 && -input <= 0.51)
      }
    }
  })
}

test('R3 diagnoses missing feedback, EP ground, charger pads and bias conditions', async () => {
  const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
  const { getR3CircuitFixture } = await server.ssrLoadModule('/src/simulation/catalogR3Fixtures.ts')
  for (const [id, pin, diagnostic] of [
    ['lm317','adj',/ADJ/], ['lm2596','fb',/FB/], ['lm2577','fb',/FB/],
    ['tps61023','sw',/cuộn cảm/], ['tps5430','ep',/EP/], ['tps62160','vos',/VOS/], ['bq24074','bat3',/BAT/],
  ]) {
    const doc = getR3CircuitFixture(id + '-r3').doc
    doc.wires = doc.wires.filter(wire => ![wire.from,wire.to].some(end => end.partId === 'ic' && end.pinId === pin))
    const result = compileFreestyleAnalog(doc, '', 25)
    assert.equal(result.ok, false, id)
    assert.match(result.issues.join(' '), diagnostic)
  }
  for (const [id, volts, diagnostic] of [
    ['lm2577',3,/VIN/], ['ref5025',2.5,/2,7 V/], ['lm4040',2.55,/phân cực/],
  ]) {
    const doc = getR3CircuitFixture(id + '-r3').doc
    doc.parts.find(item => item.id === 'supply').value.label = 'Nguồn ' + volts + ' V lý tưởng'
    const result = compileFreestyleAnalog(doc, '', 25)
    assert.equal(result.ok, false, id)
    assert.match(result.issues.join(' '), diagnostic)
  }
})

test('9 V regulator and Schottky power a load across two R2C breadboard strips only with the jumper', async () => {
  const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
  const pin = (partId,pinId) => ({kind:'pin',partId,pinId})
  const hole = holeId => ({ kind:'hole',holeId })
  const bench = (id,type,value) => ({id,type,value,mount:{kind:'bench',lane:'right',order:0}})
  const doc = {
    schema:2, lessonId:'freestyle', breadboards:[{id:'bb1',spec:'adafruit-65-r2c-1',railSplit:false}],
    parts:[bench('source','battery',{label:'Nguồn 9 V lý tưởng'}),bench('reg','lm7805-r3'),
      bench('diode','1n5819-r3'),bench('load','resistor',{ohm:100})],
    wires:[
      [pin('source','positive'),pin('reg','vin')],
      [pin('source','negative'),pin('reg','gnd')],
      [pin('source','negative'),pin('load','b')],
      [pin('reg','vout'),hole('bb1:4a')],
      [pin('diode','a'),hole('bb1:4j')],
      [pin('diode','k'),pin('load','a')],
    ].map(([from,to], index) => ({id:'w'+index,from,to})),
    expect:{partCount:4,wireCount:6,netCount:0},
  }
  const simulator = new Simulation()
  await simulator.start()
  const open = compileFreestyleAnalog(doc, '', 25)
  assert.equal(open.ok, true, open.issues?.join(' '))
  simulator.setNetList(open.netlist)
  const disconnected = await simulator.runSim()
  const read = (result, key) => result.data.find(row => row.name.toLowerCase() === key).values[0]
  assert.ok(Math.abs(read(disconnected,open.pinSignals['load:a'])) < 1e-5)
  doc.wires.push({ id:'jumper',from:hole('bb1:4e'),to:hole('bb1:4f') })
  const wired = compileFreestyleAnalog(doc, '', 25)
  assert.equal(wired.ok, true, wired.issues?.join(' '))
  simulator.setNetList(wired.netlist)
  const connected = await simulator.runSim()
  const output = read(connected,wired.pinSignals['load:a'])
  assert.ok(output >= 4.5 && output <= 4.8)
  assert.ok(read(connected,wired.pinSignals['reg:vout']) > output)
})
