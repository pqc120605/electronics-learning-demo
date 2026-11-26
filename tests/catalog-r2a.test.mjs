import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } })
try {
  const { componentRegistry } = await server.ssrLoadModule('/src/data/componentRegistry.ts')
  const { getComponentMesh, catalogPackageAssets } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const { r2aPackages } = await server.ssrLoadModule('/src/data/catalogR2aParts.ts')
  const { footprintHoles } = await server.ssrLoadModule('/src/lib/mountResolve.ts')
  const { holeNet } = await server.ssrLoadModule('/src/lib/breadboardGrid.ts')
  const { createEmptyFreestyleDoc, placePart } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  const { stepR2a } = await server.ssrLoadModule('/src/simulation/catalogR2aDigital.ts')
  const logic = (model, signals, state, powered = true) => stepR2a(model, powered, pin => signals[pin] ?? 'Z', state)
  const fixtures = {
    '02': '1y 1a 1b 2y 2a 2b gnd 3a 3b 3y 4a 4b 4y vcc',
    '04': '1a 1y 2a 2y 3a 3y gnd 4y 4a 5y 5a 6y 6a vcc',
    '32': '1a 1b 1y 2a 2b 2y gnd 3y 3a 3b 4y 4a 4b vcc',
    '86': '1a 1b 1y 2a 2b 2y gnd 3y 3a 3b 4y 4a 4b vcc',
    '125': '1oe 1a 1y 2oe 2a 2y gnd 3y 3a 3oe 4y 4a 4oe vcc',
    '126': '1oe 1a 1y 2oe 2a 2y gnd 3y 3a 3oe 4y 4a 4oe vcc',
    '138': 'a b c g2a g2b g1 y7 gnd y6 y5 y4 y3 y2 y1 y0 vcc',
    '139': '1g 1a 1b 1y0 1y1 1y2 1y3 gnd 2y3 2y2 2y1 2y0 2b 2a 2g vcc',
    '151': 'd3 d2 d1 d0 y w g gnd c b a d7 d6 d5 d4 vcc',
    '153': '1g b 1c3 1c2 1c1 1c0 1y gnd 2y 2c0 2c1 2c2 2c3 a 2g vcc',
    '157': 'sel 1a 1b 1y 2a 2b 2y gnd 3y 3b 3a 4y 4b 4a g vcc',
    '165': 'shld clk e f g h qhn gnd qh ser a b c d clkinh vcc',
    '164': 'a b qa qb qc qd gnd clk clr qe qf qg qh vcc',
    '245': 'dir a1 a2 a3 a4 a5 a6 a7 a8 gnd b8 b7 b6 b5 b4 b3 b2 b1 oe vcc',
  }
  test('all 14 approved part types expose every TI pad and an exact DIP anchor', () => {
    for (const [model, pinText] of Object.entries(fixtures)) {
      const id = 'sn74hc' + model + '-r2a'
      const pins = pinText.split(' ')
      const part = componentRegistry.find(item => item.id === id)
      const mesh = getComponentMesh(id)
      assert.ok(part && mesh, id)
      assert.deepEqual(part.pins.map(pin => pin.id), pins)
      assert.equal(mesh.mount, 'breadboard')
      const half = pins.length / 2
      for (const [index, pin] of pins.entries()) {
        const expected = index < half ? [0, 0, index * 2.54] : [7.62, 0, (pins.length - 1 - index) * 2.54]
        assert.ok(mesh.pinsMm[pin].every((coordinate, axis) => Math.abs(coordinate - expected[axis]) < 1e-6), id + ':' + pin)
      }
    }
  })

  const vector = (values, prefix, count) => Object.fromEntries(Array.from({ length: count }, (_, i) => [prefix + i, values[i]]))
  const get = (values, prefix, count) => Array.from({ length: count }, (_, i) => values[prefix + i])
  const address = i => ({ a: i & 1, b: (i >> 1) & 1, c: (i >> 2) & 1 })
  const binary = [0, 1]
  for (const [model, expected] of Object.entries({ '02': [1,0,0,0], '32': [0,1,1,1], '86': [0,1,1,0] })) {
    test('SN74HC' + model + ' truth table on all four gates', () => {
      for (let gate = 1; gate <= 4; gate++) {
        for (const a of binary) for (const b of binary) {
          assert.equal(logic(model, { [gate+'a']: a, [gate+'b']: b }).outputs[gate+'y'], expected[2*a+b])
        }
        assert.equal(logic(model, {}, undefined, false).outputs[gate+'y'], 'X')
      }
    })
  }
  test('SN74HC04 inverts all six gates and displays X on a floating input', () => {
    for (let gate = 1; gate <= 6; gate++) {
      for (const a of binary) assert.equal(logic('04', { [gate+'a']: a }).outputs[gate+'y'], 1-a)
      assert.equal(logic('04', {}).outputs[gate+'y'], 'X')
    }
  })
  for (const [model, enable] of [['125',0], ['126',1]]) {
    test('SN74HC' + model + ' active enable and true high impedance on all channels', () => {
      for (let gate = 1; gate <= 4; gate++) {
        for (const a of binary) {
          assert.equal(logic(model, { [gate+'a']: a, [gate+'oe']: enable }).outputs[gate+'y'], a)
          assert.equal(logic(model, { [gate+'a']: a, [gate+'oe']: 1-enable }).outputs[gate+'y'], 'Z')
          assert.equal(logic(model, { [gate+'a']: a }).outputs[gate+'y'], 'X')
        }
      }
    })
  }
  test('SN74HC138 decodes all addresses, and each of three enables can disable it', () => {
    for (let i = 0; i < 8; i++) {
      const inputs = { ...address(i), g1:1, g2a:0, g2b:0 }
      assert.deepEqual(get(logic('138', inputs).outputs, 'y', 8), Array.from({length:8}, (_, j) => Number(j !== i)))
      for (const off of [{g1:0}, {g2a:1}, {g2b:1}]) {
        assert.deepEqual(get(logic('138', {...inputs, ...off}).outputs, 'y', 8), Array(8).fill(1))
      }
    }
  })
  test('SN74HC139 enables both decoders independently', () => {
    for (const channel of [1,2]) for (let i = 0; i < 4; i++) {
      const a = address(i)
      const out = logic('139', { '1g':1, '2g':1, [channel+'g']:0, [channel+'a']:a.a, [channel+'b']:a.b }).outputs
      assert.deepEqual(get(out, channel+'y', 4), Array.from({length:4}, (_, j) => Number(j !== i)))
      assert.deepEqual(get(out, (3-channel)+'y', 4), Array(4).fill(1))
    }
  })
  test('SN74HC151 selects every input with complementary outputs and the disabled state', () => {
    for (let i = 0; i < 8; i++) {
      const inputs = { ...address(i), ...vector(Array.from({length:8}, (_, j) => Number(j === i)), 'd', 8) }
      assert.deepEqual(logic('151', {...inputs,g:0}).outputs, {y:1,w:0})
      assert.deepEqual(logic('151', {...inputs,g:1}).outputs, {y:0,w:1})
      assert.deepEqual(logic('151', {...inputs,['d'+i]:0,g:0}).outputs, {y:0,w:1})
    }
  })
  test('SN74HC153 selects each of four addresses, with independent enables', () => {
    for (let i = 0; i < 4; i++) {
      const inputs = { ...address(i), ...vector([0,0,0,0], '1c', 4), ...vector([1,1,1,1], '2c', 4),
        ['1c'+i]:1, ['2c'+i]:0 }
      assert.deepEqual(logic('153', {...inputs,'1g':0,'2g':0}).outputs, {'1y':1,'2y':0})
      assert.deepEqual(logic('153', {...inputs,'1g':1,'2g':0,['2c'+i]:1}).outputs, {'1y':0,'2y':1})
      assert.deepEqual(logic('153', {...inputs,'1g':0,'2g':1,['2c'+i]:1}).outputs, {'1y':1,'2y':0})
    }
  })
  test('SN74HC157 selects between two four-bit patterns and strobes low', () => {
    const inputs = {'1a':1,'2a':0,'3a':1,'4a':1,'1b':0,'2b':1,'3b':0,'4b':0}
    assert.deepEqual(logic('157', {...inputs,sel:0,g:0}).outputs, {'1y':1,'2y':0,'3y':1,'4y':1})
    assert.deepEqual(logic('157', {...inputs,sel:1,g:0}).outputs, {'1y':0,'2y':1,'3y':0,'4y':0})
    assert.deepEqual(logic('157', {...inputs,g:1}).outputs, {'1y':0,'2y':0,'3y':0,'4y':0})
  })
  test('SN74HC165 loads asynchronously, shifts H through A and honors clock inhibit on both polarities', () => {
    const parallel = {a:0,b:1,c:1,d:0,e:1,f:0,g:0,h:1}
    let {state, outputs} = logic('165', {...parallel,shld:0,clk:0,clkinh:0})
    assert.deepEqual(outputs, {qh:1,qhn:0})
    const run = (clk, clkinh = 0, ser = 0) => {
      const next = logic('165', {shld:1,clk,clkinh,ser}, state)
      state = next.state
      assert.equal(next.outputs.qhn, 1-next.outputs.qh)
      return next.outputs.qh
    }
    const observed = [run(0)]
    for (let i = 0; i < 7; i++) { observed.push(run(1)); run(0) }
    assert.deepEqual(observed, [1,0,0,1,0,1,1,0])
    state = logic('165', {...parallel,shld:0,clk:1,clkinh:0}, state).state
    assert.equal(run(1,1),1)
    assert.equal(run(0,1),1)
    assert.equal(run(1,1),1)
    assert.equal(run(0,0),1)
    assert.equal(run(0,1),0, 'CLK INH rising while CLK is low clocks the register')
  })
  test('SN74HC164 shifts on rising edge, gates serial A and B, and clears asynchronously', () => {
    let state
    const run = (clk, a, b, clr = 1) => {
      const next = logic('164', {clk,a,b,clr}, state)
      state = next.state
      return Object.values(next.outputs)
    }
    assert.deepEqual(run(0,0,0,0), Array(8).fill(0))
    const bits = [1,0,0,1,0,1,1,0]
    for (const bit of bits) { run(0,1,bit); run(1,1,bit); run(1,0,0) }
    assert.deepEqual(run(0,0,1), [...bits].reverse())
    assert.deepEqual(run(1,0,1), [0, ...[...bits].reverse().slice(0,7)])
    assert.deepEqual(run(1,1,1,0), Array(8).fill(0))
  })
  test('SN74HC245 drives all 8 lanes in either direction and releases both sides when disabled', () => {
    const pattern = [1,0,0,1,0,1,1,0]
    for (const dir of binary) {
      const [source, destination] = dir ? ['a','b'] : ['b','a']
      const input = Object.fromEntries(pattern.map((bit, i) => [source+(i+1), bit]))
      const output = logic('245', {...input,oe:0,dir}).outputs
      assert.deepEqual(pattern.map((_, i) => output[destination+(i+1)]), pattern)
      assert.ok(pattern.every((_, i) => output[source+(i+1)] === 'Z'))
      assert.ok(Object.values(logic('245', {oe:1,dir}).outputs).every(level => level === 'Z'))
    }
  })
  test('approved files and generated assets match, and every DIP seats across the breadboard gap', async () => {
    const hash = bytes => createHash('sha256').update(bytes).digest('hex')
    const approved = await readFile('docs/research/2026-11-26-catalog-fidelity-r2a-proposal.md')
    assert.equal(hash(approved), 'd049bcb6254dea581eeec7cb480bf68f05083f0a9765e22939c5547dc8fb8713')
    for (const [key, source] of Object.entries(r2aPackages)) {
      const asset = catalogPackageAssets[key]
      const footprint = asset.footprint.split('/').at(-1)
      assert.equal(hash(await readFile('public/models/components/catalog-r2a/' + footprint)), source.footprintSha)
      assert.equal(hash(await readFile('public' + asset.file)), asset.sha256)
      assert.equal(asset.sourceSha256, source.stepSha)
      assert.ok(asset.maxOffsetMm <= 0.05)
    }
    for (const [model, pins] of Object.entries(fixtures)) {
      const type = 'sn74hc' + model + '-r2a'
      for (const rotation of [0, 90, 180, 270]) {
        const mount = { kind:'breadboard', board:'bb1', row:rotation === 90 ? 5 : 4, col:12, rotation }
        const holes = footprintHoles({ type, mount })
        if (rotation % 180 === 0) assert.equal(holes, null)
        else {
          assert.equal(holes.length, pins.split(' ').length)
          assert.deepEqual([...new Set(holes.map(hole => hole.row))].sort(), ['e','f'])
          assert.equal(new Set(holes.map(hole => holeNet(hole))).size, holes.length)
        }
      }
      const placed = placePart(createEmptyFreestyleDoc(), type)
      assert.ok(placed.partId, type)
      assert.equal(placed.doc.parts.at(-1).mount.kind, 'breadboard')
    }
  })
} finally {
  await server.close()
}
