import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { CPU, spiConfig, twiConfig } from 'avr8js'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

let server
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

const pin = (partId, pinId) => ({ kind: 'pin', partId, pinId })
const unoRoles = { ledOut: 18, input: 19, trig: 9, echo: 10, seg0: 11, seg1: 13 }
const partTypes = { uno: 'board', pot: 'potentiometer' }
const makeDoc = (parts, wires) => ({
  schema: 2, lessonId: 'freestyle', breadboards: [],
  parts: parts.map((name, order) => ({
    id: name, type: partTypes[name] ?? (name.startsWith('r') ? 'resistor' : name + '-r2b'),
    mount: { kind: 'bench', lane: 'right', order },
    ...(name.startsWith('r') ? { value: {ohm: 4700} } : {}),
  })),
  wires: wires.map(([a,b,c,d],index) => ({ id: 'w' + index, from: pin(a,b), to: pin(c,d) })),
})
const at = (part, net, ...pins) => pins.map(pin => ['uno', net, part, pin])
const power = part => [...at(part,'vcc','vcc'), ...at(part,'gnd','gnd')]
const addresses = part => at(part,'gnd','a0','a1','a2')
const pair = (part1, pin1, pin2, part2, resistor) => [
  [part1,pin1,part2,'sda'], [part1,pin2,part2,'scl'],
  [part1,pin1,'r'+resistor,'a'], [part1,pin2,'r'+(resistor+1),'a'],
  ['uno','vcc','r'+resistor,'b'], ['uno','vcc','r'+(resistor+1),'b'],
]

function makeTcaDoc() {
  return makeDoc(['uno','tca9548a','pcf8574','mcp23017','r1','r2','r3','r4','r5','r6'], [
    ...power('tca9548a'),...power('mcp23017'),...power('pcf8574'),
    ...addresses('tca9548a'),...addresses('mcp23017'),...addresses('pcf8574'),
    ...at('tca9548a','vcc','reset'),...at('mcp23017','vcc','reset'),
    ...pair('uno','ledOut','input','tca9548a',1),
    ...pair('tca9548a','sd0','sc0','pcf8574',3),
    ...pair('tca9548a','sd1','sc1','mcp23017',5),
  ])
}

async function bench(doc) {
  const { compileCoupledCircuit } = await server.ssrLoadModule('/src/lib/freestyle/coupledCircuit.ts')
  const { createCoupledDigital } = await server.ssrLoadModule('/src/simulation/coupledDigital.ts')
  const result = compileCoupledCircuit(doc, 'arduino-uno-r3', unoRoles)
  assert.ok(result.ok, JSON.stringify(result))
  return { graph: result.graph, circuit: createCoupledDigital(result.graph, { pot: 0.5 }) }
}

async function registerDriver(circuit, drives) {
  const { attachR2bAvrBuses } = await server.ssrLoadModule('/src/lib/avrR2bBuses.ts')
  const cpu = new CPU(new Uint16Array(8))
  const step = () => circuit.step(drives, cpu.cycles / 16_000)
  attachR2bAvrBuses(cpu, circuit.interfaces, step, step)
  const advance = cycles => {
    for (let i = 0; i < cycles; i++) { cpu.cycles++; cpu.tick() }
    step()
  }
  const twi = twiConfig
  const tw = (modifier, data, expected) => {
    if (data !== undefined) cpu.writeData(twi.TWDR, data)
    cpu.writeData(twi.TWCR, 0x84 | modifier)
    advance(1600)
    if (expected !== undefined) assert.equal(cpu.readData(twi.TWSR) & 248, expected)
    return cpu.readData(twi.TWDR)
  }
  cpu.writeData(twi.TWBR,72)
  return {
    start: (repeated = false) => tw(0x20,undefined,repeated ? 0x10 : 0x08),
    connect: (address, read, ack = true) => tw(0,(address << 1) | Number(read),read ? (ack ? 0x40 : 0x48) : (ack ? 0x18 : 0x20)),
    write: value => tw(0,value,0x28),
    read: ack => tw(ack ? 0x40 : 0,undefined,ack ? 0x50 : 0x58),
    stop: () => tw(0x10),
    configureSpi: () => cpu.writeData(spiConfig.SPCR,0x51),
    spi: value => {
      cpu.writeData(spiConfig.SPDR,value)
      advance(130)
      assert.ok(cpu.readData(spiConfig.SPSR) & 128, 'SPI should finish at 1 MHz')
      assert.equal(cpu.readData(spiConfig.SPDR),255)
    },
    advance, step,
  }
}

test('TCA9548A routes two same-address devices through physically separate branch nets and native Uno TWI', async () => {
  const {circuit} = await bench(makeTcaDoc())
  const avr = await registerDriver(circuit,{})
  const command = (address, bytes) => {
    avr.start()
    avr.connect(address,false)
    for (const byte of bytes) avr.write(byte)
    avr.stop()
  }
  avr.start()
  avr.connect(0x20,false,false)
  avr.stop()
  avr.start()
  avr.connect(0x70,false)
  avr.write(1)
  avr.start(true)
  avr.connect(0x20,false,false)
  avr.stop()
  command(0x20,[0xfe])
  avr.start()
  avr.connect(0x20,true)
  assert.equal(avr.read(false),0xfe)
  avr.stop()
  command(0x70,[2])
  avr.start()
  avr.connect(0x20,false)
  avr.write(0)
  avr.start(true)
  avr.connect(0x20,true)
  assert.equal(avr.read(true),0xff)
  assert.equal(avr.read(false),0xff)
  avr.stop()
  const events = circuit.snapshot().bus
  assert.ok(events.some(event => event.detail.includes('NACK')))
  assert.ok(events.some(event => event.detail.includes('0xFE')))
  assert.ok(events.some(event => event.detail === 'STOP'))
  assert.ok(events.every((event,index) => index === 0 || event.timeMs >= events[index-1].timeMs))
})

test('virtual I²C sees NACK on wrong wires, missing pull-up and missing device power', async () => {
  const original = makeTcaDoc()
  const docs = [
    { ...original, wires: original.wires.filter(w => !(w.from.partId === 'uno' && w.from.pinId === 'ledOut' && w.to.pinId === 'sda')) },
    { ...original, parts: original.parts.map(part => part.id === 'r1' ? {...part, value:{ohm:1000}} : part) },
    { ...original, wires: original.wires.filter(w => !(w.from.pinId === 'vcc' && w.to.partId === 'tca9548a' && w.to.pinId === 'vcc')) },
  ]
  for (const doc of docs) {
    const { circuit } = await bench(doc)
    circuit.step({},0)
    const bus = circuit.interfaces.i2c
    bus.start(false)
    assert.equal(bus.connect(0x70,false),false)
    bus.stop()
    circuit.step({},0.3)
    const summary = JSON.stringify(circuit.snapshot())
    assert.match(summary, /NACK/)
    assert.match(summary, /kéo lên 4,7|VCC 5 V|dây SDA\/SCL/)
  }
})

test('MCP4921 SPI output crosses a real graph net into ADS1115 and converts through Uno TWI', async () => {
  const doc = makeDoc(['uno','mcp4921','ads1115','pot','r1','r2'], [
    ...power('mcp4921'), ...power('ads1115'), ...power('pot'),
    ...at('ads1115','gnd','addr','ain1'),
    ['uno','trig','mcp4921','ldac'], ['uno','echo','mcp4921','cs'],
    ['uno','seg0','mcp4921','sdi'], ['uno','seg1','mcp4921','sck'],
    ['pot','wiper','mcp4921','vref'], ['mcp4921','vout','ads1115','ain0'],
    ...pair('uno','ledOut','input','ads1115',1),
  ])
  const { graph,circuit } = await bench(doc)
  const actualDac = graph.parts.find(part => part.id === 'mcp4921')
  const drives = {9:{mode:'output',level:true},10:{mode:'output',level:true}}
  const avr = await registerDriver(circuit,drives)
  const out = () => circuit.snapshot().levels[actualDac.pins.vout] ?? 'Z'
  avr.configureSpi()
  avr.step()
  drives[10].level = false
  avr.step()
  avr.spi(0x38)
  avr.spi(0x00)
  drives[10].level = true
  avr.step()
  assert.equal(out(),'Z')
  drives[9].level = false
  avr.step()
  drives[9].level = true
  avr.step()
  assert.equal(out(),1.25)

  avr.start()
  avr.connect(0x48,false)
  for (const value of [1,0x85,0x83]) avr.write(value)
  avr.stop()
  avr.advance(130_000)
  avr.start()
  avr.connect(0x48,false)
  avr.write(0)
  avr.start(true)
  avr.connect(0x48,true)
  assert.deepEqual([avr.read(true), avr.read(false)],[0x4e,0x20])
  avr.stop()
  const events = circuit.snapshot().bus
  assert.ok(events.some(event => event.bus === 'SPI' && event.detail.includes('0x38')))
  assert.ok(events.some(event => event.bus === 'I²C' && event.detail.includes('0x4E')))
})

test('both LM358P and LM393P channels execute approved DC operating points in local ngspice', async () => {
  const { r2bDcNetlist } = await server.ssrLoadModule('/src/simulation/catalogR2bSpice.ts')
  const simulation = new Simulation()
  await simulation.start()
  for (const channel of [1,2]) {
    for (const [model, condition, min, max] of [
      ['lm358','buffer',0.495,0.505], ['lm358','gain',1.98,2.02], ['lm358','limit',3.299,3.301],
      ['lm393','low',0,0.4], ['lm393','high',4.95,5.01],
    ]) {
      simulation.setNetList(r2bDcNetlist(model,condition,channel))
      const {data} = await simulation.runSim()
      const out = data.find(item => item.name.toLowerCase() === (channel === 1 ? 'v(out)' : 'v(out2)'))?.values[0]
      assert.ok(out >= min && out <= max, [model,condition,channel,out].join(' '))
    }
  }
})


test('wired LM393P selects the loaded channel and reports Z, equality and out-of-range input', async () => {
  const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
  const base = makeDoc(['uno','lm393','r1'], [
    ...power('lm393'), ['uno','vcc','r1','a'], ['r1','b','lm393','out2'],
    ['plus','positive','lm393','in2p'], ['minus','positive','lm393','in2n'],
    ['uno','gnd','plus','negative'], ['uno','gnd','minus','negative'],
  ])
  const voltage = (id, value) => ({id,type:'battery',mount:{kind:'bench',lane:'right',order:4},value:{label:value+' V'}})
  const preset = (vplus,vminus) => ({ ...base, parts:[
    ...base.parts.map(part=>part.id==='r1'?{...part,value:{ohm:10000}}:part),
    voltage('plus',vplus),voltage('minus',vminus),
  ] })
  const result = compileFreestyleAnalog(preset(1,2),'5 V',25)
  assert.ok(result.ok,JSON.stringify(result))
  const match = result.netlist.match(/BMMCMP\d+ (n\d+)/)
  assert.ok(match)
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(result.netlist)
  const reading = (await simulation.runSim()).data.find(item=>item.name.toLowerCase() === 'v('+match[1]+')').values[0]
  assert.ok(reading < 0.4 && reading >= 0)
  for (const [doc, expected] of [
    [preset(1,1), /đầu ra X/], [preset(4,2), /ngoài miền/],
    [{ ...preset(2,1), parts:preset(2,1).parts.map(part=>part.id==='r1'?{...part,value:{ohm:1000}}:part) }, /nhả Z/],
  ]) {
    const out = compileFreestyleAnalog(doc,'5 V',25)
    assert.ok(!out.ok && out.issues.some(issue=>expected.test(issue)), JSON.stringify(out))
  }
})


test('both R2B mux packages carry analog voltage over a wired net and isolate it when inhibited', async () => {
  for (const [id, selector, enable] of [
    ['cd4051b',['a','b','c'],'inh'], ['cd74hc4067',['s0','s1','s2','s3'],'en'],
  ]) {
    const doc = makeDoc(['uno',id,'pot'], [
      ...power(id), ...power('pot'), ...at(id,'gnd',...selector),
      ...(id==='cd4051b' ? at(id,'gnd','vee') : []),
      ['uno','echo',id,enable], ['uno','seg0',id,'com'], ['pot','wiper',id,'ch0'],
    ])
    const { graph,circuit } = await bench(doc)
    const pins = graph.parts.find(part=>part.id===id).pins
    const resolve = (inhibited, output) => {
      circuit.step({10:{mode:'output',level:inhibited}, ...(output ? {11:{mode:'output',level:true}} : {})})
      return circuit.snapshot().levels
    }
    assert.equal(resolve(false)[pins.com],2.5)
    assert.equal(resolve(false)[pins.ch1],undefined)
    assert.equal(resolve(false,true)[pins.com],'X')
    assert.equal(resolve(true,true)[pins.ch0],2.5)
    assert.equal(resolve(true,true)[pins.com],5)
  }
})
