import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

let server
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

const endpoint = (partId, pinId) => ({ kind: 'pin', partId, pinId })
const part = (id, type, value) => ({ id, type, mount: { kind: 'bench', lane: 'right', order: 0 }, ...(value ? { value } : {}) })
const wire = (id, fromPart, fromPin, toPart, toPin) => ({ id, from: endpoint(fromPart, fromPin), to: endpoint(toPart, toPin) })
const asDoc = (parts, wires) => ({ parts, wires, breadboards: [], lessonId: 'freestyle' })

test('actual Arduino Blink HEX drives an R1 gate and feeds the resulting voltage back into an AVR input', async () => {
  const { createAvrLiveMachine } = await server.ssrLoadModule('/src/lib/avrLiveMachine.ts')
  const { compileCoupledCircuit } = await server.ssrLoadModule('/src/lib/freestyle/coupledCircuit.ts')
  const doc = asDoc([part('board', 'board'), part('ic', 'sn74hc08-r1'), part('led1', 'led'), part('r', 'resistor')], [
    wire('w1', 'board','ledOut','ic','1a'), wire('w2','board','vcc','ic','1b'), wire('w3','board','vcc','ic','vcc'),
    wire('w4','board','gnd','ic','gnd'), wire('w5','ic','1y','r','a'), wire('w6','r','b','led1','anode'),
    wire('w7','led1','cathode','board','gnd'), wire('w8','ic','1y','board','input'),
  ])
  const compiled = compileCoupledCircuit(doc, 'arduino-uno-r3', { ledOut: 13, input: 8 })
  assert.ok(compiled.ok, JSON.stringify(compiled))
  const hex = await readFile('public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex', 'utf8')
  const machine = createAvrLiveMachine(hex, compiled.graph.board, { graph: compiled.graph, stimuli: {} })
  const samples = Array.from({ length: 16 }, () => machine.runFor(125))
  assert.ok(samples.every(frame => frame.coupled && frame.coupled.events && !frame.coupled.unstable))
  assert.deepEqual([...new Set(samples.map(frame => frame.pins[13]?.level))].sort(), [false, true])
  for (const frame of samples) {
    assert.equal(frame.pins[8].level, frame.pins[13].level)
    assert.equal(frame.coupled.litParts.includes('led1'), frame.pins[13].level)
  }
  assert.ok(samples.at(-1).cycles >= 32_000_000)
  assert.ok(samples.at(-1).coupled.events < 100, 'only port/stimulus changes need a solve')
})

test('coupled MCP3008 uses the connected channel and returns DOUT to the selected AVR input', async () => {
  const { createCoupledDigital } = await server.ssrLoadModule('/src/simulation/coupledDigital.ts')
  const graph = { board: 'arduino-uno-r3', gpios: [
    { pin: 2, net: 'cs' }, { pin: 3, net: 'clock' }, { pin: 4, net: 'din' }, { pin: 5, net: 'dout' },
  ], rail5: ['vcc'], ground: 'gnd', parts: [
    { id: 'adc', kind: 'adc', pins: { vdd: 'vcc', vref: 'vcc', agnd: 'gnd', dgnd: 'gnd', cs: 'cs',
      sclk: 'clock', din: 'din', dout: 'dout', ch6: 'signal' } },
    { id: 'pot', kind: 'pot', pins: { vcc: 'vcc', gnd: 'gnd', wiper: 'signal' } },
  ] }
  const circuit = createCoupledDigital(graph, { pot: 0.5 })
  const settle = (cs, clock, din) => circuit.step(Object.fromEntries([[2, cs], [3, clock], [4, din]].map(([pin, value]) =>
    [pin, { mode: 'output', level: value === 1 }])))
  settle(1, 0, 0)
  const command = [1, 1, 1, 1, 0, 0]
  const data = []
  for (let i = 0; i < 17; i++) {
    const bit = command[i] ?? 0
    const drive = settle(0, 1, bit).find(input => input.pin === 5)
    if (i >= 7) data.push(drive.digital ? '1' : '0')
    settle(0, 0, bit)
  }
  assert.equal(data.join(''), '1000000000')
  assert.equal(circuit.snapshot().levels.signal, 2.5)
  settle(1, 0, 0)
  assert.equal(circuit.snapshot().levels.dout, undefined)
})

test('mismatched targets, analog parts wired in the digital model and GPIO aliases fail closed', async () => {
  const { compileCoupledCircuit } = await server.ssrLoadModule('/src/lib/freestyle/coupledCircuit.ts')
  const doc = asDoc([part('board', 'board'), part('d','1n4148-r1'), part('ic','sn74hc08-r1')], [
    wire('w','board','ledOut','d','a'), wire('w2','board','input','ic','1a'),
  ])
  assert.equal(compileCoupledCircuit(doc, 'esp32-devkit', { ledOut: 13, input: 13 }).ok, false)
  const result = compileCoupledCircuit(doc, 'arduino-uno-r3', { ledOut: 13, input: 13 })
  assert.ok(!result.ok && result.issues.some(issue => issue.includes('1N4148-TAP')))
  assert.ok(!result.ok && result.issues.some(issue => issue.includes('cùng GPIO 13')))
})

test('a wired R1 diode and series resistor produce a real ngspice operating point', async () => {
  const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
  const doc = asDoc([part('src','battery'), part('r','resistor',{ohm:1000}), part('d','1n4148-r1')], [
    wire('w1','src','positive','r','a'), wire('w2','r','b','d','a'), wire('w3','d','k','src','negative'),
  ])
  const result = compileFreestyleAnalog(doc, '5 V', 25)
  assert.ok(result.ok, JSON.stringify(result))
  assert.match(result.netlist, /R1 n1 n2 1000/)
  assert.match(result.netlist, /D2 n2 0 MM4148/)
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(result.netlist)
  const measurement = await simulation.runSim()
  const value = measurement.data.find(item => /^v\(n2\)$/i.test(item.name))?.values[0]
  assert.ok(value > 0.6 && value < 0.72, JSON.stringify(measurement.data))
  assert.equal(compileFreestyleAnalog({ ...doc, wires: doc.wires.slice(0,2) }, '5 V', 25).ok, false)
})


const link = (from, fromPin, to, toPin, index) => ({
  id: 'wire'+index,
  from: {kind:'pin', partId:from, pinId:fromPin},
  to: {kind:'pin', partId:to, pinId:toPin},
})

test('Uno Blink HEX feeds back through a wired gate, buffer, selector and shift register', async () => {
  const { createAvrLiveMachine } = await server.ssrLoadModule('/src/lib/avrLiveMachine.ts')
  const { compileCoupledCircuit } = await server.ssrLoadModule('/src/lib/freestyle/coupledCircuit.ts')
  const hex = await readFile('public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex', 'utf8')
  const cases = [
    ['32','1a','1y', ['1b'], []],
    ['125','1a','1y', ['1oe'], []],
    ['151','d0','y', ['a','b','c','g'], []],
    ['164','clk','qa', [], ['a','b','clr']],
  ]
  for (const [model, stimulus, measured, low, high] of cases) {
    const parts = ['board','ic'].map((id,order) => ({id,type: id==='board' ? 'board' : 'sn74hc'+model+'-r2a',
      mount:{kind:'bench', lane:'right', order}}))
    const connections = [['board','gnd','ic','gnd'], ['board','vcc','ic','vcc'],
      ['board','ledOut','ic',stimulus], ['ic',measured,'board','input'],
      ...low.map(pin => ['board','gnd','ic',pin]), ...high.map(pin => ['board','vcc','ic',pin])]
    const doc = {schema:2, lessonId:'freestyle', parts, breadboards:[],
      wires:connections.map(([a,b,c,d],i) => link(a,b,c,d,i))}
    const result = compileCoupledCircuit(doc, 'arduino-uno-r3', {ledOut:13,input:8})
    assert.ok(result.ok, model + ' ' + JSON.stringify(result))
    const runtime = createAvrLiveMachine(hex, 'arduino-uno-r3', {graph:result.graph, stimuli:{}})
    const before = runtime.runFor(0)
    const samples = Array.from({length:16}, () => runtime.runFor(125))
    assert.ok(samples.every(sample => !sample.coupled.unstable), model)
    assert.deepEqual([...new Set(samples.map(sample => sample.pins[13].level))].sort(), [false, true])
    if (model !== '164') {
      for (const sample of samples) assert.equal(sample.pins[8].level, sample.pins[13].level, model)
    } else {
      assert.equal(before.pins[8].level, false)
      assert.equal(samples.at(-1).pins[8].level, true)
      assert.ok(samples.some(sample => sample.pins[8].level && !sample.pins[13].level), 'held QA on falling clock')
    }
  }
})

test('SN74HC245 circuit detects competing drivers and changes direction without holding its old output', async () => {
  const { createCoupledDigital } = await server.ssrLoadModule('/src/simulation/coupledDigital.ts')
  const circuit = createCoupledDigital({
    board: 'arduino-uno-r3', rail5:['vcc'], ground:'gnd',
    parts:[{id:'bus', kind:'r2a', model:'245', pins:{vcc:'vcc',gnd:'gnd',dir:'dir',oe:'oe',a1:'a',b1:'b'}}],
    gpios:['dir','oe','a','b'].map((net,pin)=>({net,pin})),
  })
  const drive = levels => {
    circuit.step(Object.fromEntries(levels.map((level,i) => [i, {mode: level === undefined ? 'input' : 'output', level:level===1}])))
    return circuit.snapshot().levels
  }
  assert.equal(drive([1,0,1,undefined]).b,5)
  assert.equal(drive([1,0,1,0]).b,'X')
  assert.equal(drive([1,1,1,0]).b,0)
  drive([1,0,1,undefined])
  assert.equal(drive([0,0,undefined,undefined]).a,'X')
  assert.equal(drive([0,0,undefined,0]).a,0)
  assert.equal(drive([0,1,undefined,0]).a,undefined)
})

test('two R2A shift registers sharing a clock sample the previous QA on a simultaneous edge', async () => {
  const { createCoupledDigital } = await server.ssrLoadModule('/src/simulation/coupledDigital.ts')
  const circuit = createCoupledDigital({
    board:'arduino-uno-r3', rail5:['vcc'], ground:'gnd',
    gpios:[{pin:2,net:'clock'},{pin:3,net:'clear'}],
    parts:[
      { id:'left', kind:'r2a', model:'164', pins:{vcc:'vcc',gnd:'gnd',a:'vcc',b:'vcc',clk:'clock',clr:'clear',qa:'stage'} },
      { id:'right', kind:'r2a', model:'164', pins:{vcc:'vcc',gnd:'gnd',a:'stage',b:'vcc',clk:'clock',clr:'clear',qa:'end'} },
    ],
  })
  const step=(clock,clear)=>{
    circuit.step({2:{mode:'output',level:clock},3:{mode:'output',level:clear}})
    return circuit.snapshot().levels
  }
  step(false,false)
  step(false,true)
  let result=step(true,true)
  assert.equal(result.stage,5)
  assert.equal(result.end,0)
  step(false,true)
  result=step(true,true)
  assert.equal(result.end,5)
})
