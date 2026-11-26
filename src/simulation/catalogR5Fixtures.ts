import { catalogR5Parts, r5ControllerType, type R5Model } from '../data/catalogR5Parts'
import type { CircuitDocV2, CircuitPartV2, CircuitEndpointV2 } from '../lib/circuitDocV2'
import { createNetIndexV2 } from '../lib/circuitNetsV2'

type Connections = Record<string, string>
const gnd = 'gnd'
const route = (...pins: string[]) => Object.fromEntries(pins.map(pin => [pin, pin]))
const channels = (name: string, count: number) => Array.from({ length: count }, (_, index) => name + (index + 1))

export function createR5Fixture(model: R5Model, variant = 'base') {
  const part = catalogR5Parts.find(entry => entry.catalogId === model)!
  const doc: CircuitDocV2 = { schema: 2, lessonId: 'freestyle', breadboards: [], parts: [], wires: [],
    expect: { partCount: 0, wireCount: 0, netCount: 0 } }
  const nets = new Map<string, CircuitEndpointV2[]>()
  function add(id: string, type: string, connections: Connections, value?: CircuitPartV2['value']) {
    doc.parts.push({ id, type, ...(value ? { value } : {}), mount: {
      kind: 'bench', lane: type === r5ControllerType || type === 'battery' || type === 'r5-sine' ? 'left' : 'right',
      order: doc.parts.length,
    } })
    for (const [pinId, net] of Object.entries(connections)) {
      const endpoints = nets.get(net) ?? []
      endpoints.push({ kind: 'pin', partId: id, pinId })
      nets.set(net, endpoints)
    }
  }
  const rail = (id: string, volts: number) => add('src-' + id, 'battery', {
    positive: volts < 0 ? gnd : id, negative: volts < 0 ? id : gnd,
  }, { label: Math.abs(volts) + ' V' })
  const resistor = (id: string, a: string, b: string, ohm: number) => add(id, 'resistor', { a, b }, { ohm })
  const cap = (id: string, plus: string, minus: string, farad: number) => add(id, 'capacitor', { plus, minus }, { farad, label: farad >= 1e-6 ? (farad * 1e6).toPrecision(3) + ' µF' : (farad * 1e9).toPrecision(3) + ' nF' })
  const bypass = (supply: string, bulk = 0) => {
    cap('decouple-' + supply, supply, gnd, 100e-9)
    if (bulk) cap('bulk-' + supply, supply, gnd, bulk)
  }
  const sine = (id: string, node: string, peak: number) => add(id, 'r5-sine', { plus: node, minus: gnd }, { label: peak + ' Vpk' })
  const controller = (volts: number, ...pins: string[]) => {
    rail('logic', volts)
    add('control', r5ControllerType, { ...route(...pins), vref: 'logic', gnd })
  }
  const load = (id: string, a: string, b: string, ohm: number, henry = 0, label = id) =>
    add(id, 'r5-load', { a, b }, { ohm, henry, label })
  const motor = (id: string, a: string, b: string) => load(id, a, b, 12, 0.008, 'Motor DC ' + id)
  let pins: Connections = { gnd }
  let breakPin: string

  switch (model) {
    case 'lm386':
      rail('vs', 9)
      bypass('vs', 100e-6)
sine('audio', 'audio', variant === 'clip' ? 0.04 : 0.005)
      if (variant === 'gain' || variant === 'clip') cap('gain-cap', 'gain1', 'gain8', 10e-6)
      cap('input-cap', 'inplus', 'audio', 100e-9)
      cap('output-cap', 'out', 'speaker', 220e-6)
      cap('bypass-cap', 'bypass', gnd, 10e-6)
      resistor('zobel-r', 'out', 'zobel', 10)
      cap('zobel-c', 'zobel', gnd, 47e-9)
      load('speaker', 'speaker', gnd, 8, 0, 'Loa ảo 8 Ω')
      pins = { ...pins, ...route('vs', 'out', 'bypass', 'inplus'), inminus: gnd,
        gain1: 'gain1', gain8: 'gain8' }
      breakPin = 'out'
      break
    case 'ne5532':
      rail('vp', 12)
      rail('vn', -12)
      sine('audio', 'in1p', 0.1)
resistor('feedback', 'out1', 'in1n', variant === 'gain' ? 4000 : 9000)
      resistor('gain-r', 'in1n', gnd, 1000)
      load('load-a', 'out1', gnd, 10000, 0, 'Tải A 10 kΩ')
      load('load-b', 'out2', gnd, 10000, 0, 'Tải B 10 kΩ')
      pins = { ...route('vp', 'vn', 'in1p', 'in1n', 'out1', 'out2'), in2p: 'out1', in2n: 'out2' }
      breakPin = 'vn'
      break
    case 'max98357a':
      rail('vdd', 5)
      bypass('vdd', 10e-6)
      controller(3.3, 'din', 'bclk', 'lrclk', 'sd')
      load('speaker', 'outp', 'outn', 8, 0, 'Loa vi sai 8 Ω')
      pins = { ...pins, ...route('vdd', 'din', 'bclk', 'lrclk', 'sd', 'outp', 'outn'),
        vdd8: 'vdd', gnd11: gnd, gnd15: gnd, ep: gnd, gain: 'gain' }
      breakPin = 'bclk'
      break
    case 'tpa2012d2':
      rail('vdd', 5)
      bypass('vdd', 10e-6)
      controller(5, 'g1', 'g0', 'sdl', 'sdr')
      for (const [pin, peak] of [['inlp', 0.05], ['inln', -0.05], ['inrp', -0.0375], ['inrn', 0.0375]] as const) {
        sine('audio-' + pin, 'src-' + pin, peak)
        cap('coupling-' + pin, pin, 'src-' + pin, 1e-6)
      }
      load('speaker-l', 'outlp', 'outln', 8, 0, 'Loa trái 8 Ω')
      load('speaker-r', 'outrp', 'outrn', 8, 0, 'Loa phải 8 Ω')
      pins = { ...route('g1', 'g0', 'sdl', 'sdr', 'outlp', 'outln', 'outrp', 'outrn', 'inlp', 'inln', 'inrp', 'inrn'),
        pvdd: 'vdd', pvdd13: 'vdd', avdd: 'vdd', agnd: gnd, pgnd: gnd, pgnd12: gnd, ep: gnd }
      breakPin = 'avdd'
      break
    case 'l293d':
      rail('vcc2', 6)
      bypass('vcc2', 47e-6)
      controller(5, 'ena', 'enb', ...channels('in', 4))
      bypass('logic')
      motor('motor-a', 'out1', 'out2')
      motor('motor-b', 'out3', 'out4')
      pins = { ...pins, ...route('vcc2', 'ena', 'enb', ...channels('in', 4), ...channels('out', 4)), vcc1: 'logic',
        gnd5: gnd, gnd12: gnd, gnd13: gnd }
      breakPin = 'ena'
      break
    case 'drv8833':
      rail('vm', 5)
      bypass('vm', 47e-6)
      controller(3.3, 'a1', 'a2', 'b1', 'b2', 'sleep')
      cap('vint-cap', 'vint', gnd, 2.2e-6)
      cap('charge-cap', 'vcp', 'vm', 10e-9)
      resistor('sense-a', 'aisen', gnd, 0.68)
      resistor('sense-b', 'bisen', gnd, 0.68)
      resistor('pull-fault', 'fault', 'logic', 10000)
      motor('motor-a', 'aout1', 'aout2')
      motor('motor-b', 'bout1', 'bout2')
      pins = { ...pins, ...route('vm', 'vint', 'vcp', 'fault', 'aisen', 'bisen', 'sleep', 'aout1', 'aout2', 'bout1', 'bout2'),
        ain1: 'a1', ain2: 'a2', bin1: 'b1', bin2: 'b2', ep: gnd }
      breakPin = 'sleep'
      break
    case 'drv8825':
      rail('vm', 12)
      bypass('vm', 47e-6)
      cap('decouple-vmb', 'vm', gnd, 100e-9)
      rail('ref', 0.99)
      controller(3.3, 'reset', 'sleep', 'dir', 'step', 'disable', 'm0', 'm1', 'm2')
      cap('pump', 'cp1', 'cp2', 10e-9)
      cap('pump-bypass', 'vcp', 'vm', 100e-9)
      resistor('pump-r', 'vcp', 'vm', 1e6)
      cap('regulator-bypass', 'v3p3out', gnd, 470e-9)
      resistor('sense-a', 'isena', gnd, 0.33)
      resistor('sense-b', 'isenb', gnd, 0.33)
      resistor('pull-fault', 'fault', 'logic', 10000)
      resistor('pull-home', 'home', 'logic', 10000)
      load('phase-a', 'aout1', 'aout2', 6.8, 0.004, 'Pha A')
      load('phase-b', 'bout1', 'bout2', 6.8, 0.004, 'Pha B')
      pins = { ...pins, ...route('cp1', 'cp2', 'vcp', 'v3p3out', 'isena', 'isenb', 'reset', 'sleep', 'fault', 'dir',
        'disable', 'step', 'm0', 'm1', 'm2', 'home', 'aout1', 'aout2', 'bout1', 'bout2'),
        vma: 'vm', vmb: 'vm', avref: 'ref', bvref: 'ref', gnd28: gnd, ep: gnd, decay: gnd }
      breakPin = 'step'
      break
    case 'uln2003a':
    case 'uln2803a': {
      const small = model === 'uln2003a'
      const count = small ? 7 : 8
      rail('load', small ? 5 : 9)
      controller(5, ...channels('in', count))
      for (const name of channels('out', count)) load('coil-' + name, 'load', name, small ? 40 : 80, small ? 0.04 : 0.08, 'Cuộn ' + name.slice(3))
      pins = { ...pins, ...route(...channels('in', count), ...channels('out', count)), com: 'load' }
      breakPin = 'com'
      break
    }
    case 'drv8871':
      rail('vm', 9)
      bypass('vm', 47e-6)
      controller(3.3, 'in1', 'in2')
      resistor('limit', 'ilim', gnd, 100000)
      motor('motor-a', 'out1', 'out2')
      pins = { ...pins, ...route('vm', 'in1', 'in2', 'out1', 'out2', 'ilim'), pgnd: gnd, ep: gnd }
      breakPin = 'ilim'
      break
  }

  add('ic', part.id, pins)
  for (const [node, endpoints] of nets) {
    for (const endpoint of endpoints.slice(1)) {
      if (endpoint.kind !== 'pin') continue
      doc.wires.push({ id: 'wire-' + endpoint.partId + '-' + endpoint.pinId, from: endpoints[0], to: endpoint,
        role: node === gnd ? 'ground' : 'signal' })
    }
  }
  doc.expect = { partCount: doc.parts.length, wireCount: doc.wires.length, netCount: createNetIndexV2(doc).netsList().length }
  return { doc, disconnect: 'wire-ic-' + breakPin }
}

export function getR5CircuitFixture(id: string) {
  const [base, variant] = id.split(':')
  const entry = catalogR5Parts.find(part => part.id === base)
  if (!entry || variant && !(entry.catalogId === 'lm386' && ['gain', 'clip'].includes(variant) ||
    entry.catalogId === 'ne5532' && variant === 'gain')) return
  return createR5Fixture(entry.catalogId, variant)
}
