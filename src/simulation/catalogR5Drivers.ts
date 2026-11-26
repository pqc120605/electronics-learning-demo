import { needR5, type R5Circuit } from './catalogR5Circuit'

export type R5Values = Record<string, number>
export type R5Sample = { timeMs: number; values: R5Values }
export type R5Reading = { ok: true; kind: 'behavior'; text: string; values: R5Values; samples?: R5Sample[] }
export const r5Reading = (text: string, values: R5Values, samples?: R5Sample[]): R5Reading =>
  ({ ok: true, kind: 'behavior', text, values, ...(samples ? { samples } : {}) })

const direction = (a: number, b: number) => a === b ? 0 : a ? 1 : -1
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))
const amps = (number: number) => number.toFixed(3) + ' A'

function motorTrace(
  coil: { ohm: number; henry: number }, command: number, voltage: number, limit: number,
  mode: string, seriesResistance: number,
) {
  const locked = mode === 'locked'
  const braking = mode === 'brake' || mode === 'coast'
  const dt = 0.00005
  const samples: R5Sample[] = []
  const resistance = coil.ohm + seriesResistance
  let i = 0, velocity = 0
  for (let k = 0; k <= (braking ? 12000 : 10000); k++) {
    const off = braking && k >= 10000
    const applied = off ? 0 : voltage * command
    if (k) {
      // Exact R/L step over dt with back EMF held at the previous sample.
      if (off && mode === 'coast') i *= Math.exp(-dt * (resistance + 25) / coil.henry)
      else {
        const equilibrium = (applied - 0.02 * velocity) / resistance
        i = clamp(equilibrium + (i - equilibrium) * Math.exp(-dt * resistance / coil.henry), limit)
      }
      if (!locked) velocity += dt * (0.02 * i - 0.0002 * velocity) / 0.00002
    }
    if (k % 100 === 0) samples.push({ timeMs: k * dt * 1000, values: { i, velocity, v: applied } })
  }
  return { i, velocity, samples }
}

function bridges(c: R5Circuit, mode: string) {
  const { pin, gnd } = c
  const model = c.model.catalogId
  const motor = (a: string, b: string, name: string) => c.load(pin(a), pin(b), name, 'coil')
  const simultaneous = (pairs: string[][]) =>
    needR5(new Set(pairs.flatMap(pair => pair.map(pin))).size === pairs.length * 2, 'Các ngõ ra cầu H phải nằm trên các net riêng.')
  let voltage: number
  let limits: number[]
  let paths: [string, string][]
  let seriesResistance: number[]
  let transitionMs: number

  if (model === 'l293d') {
    voltage = c.rail('vcc2', 6) - 2.6
    c.rail('vcc1', 5)
    c.controlRail(5)
    for (const signal of ['ena', 'enb', 'in1', 'in2', 'in3', 'in4']) c.signal(signal)
    limits = [Infinity, Infinity]
    paths = [['out1', 'out2'], ['out3', 'out4']]
    seriesResistance = [0, 0]
    transitionMs = 0
  } else if (model === 'drv8833') {
    voltage = c.rail('vm', 5)
    c.controlRail(3.3)
    const sense = [c.resistance(pin('aisen'), gnd, 'AISEN'), c.resistance(pin('bisen'), gnd, 'BISEN')]
    needR5(sense.every(value => value >= 0.15 && value <= 2), 'RSENSE ngoài miền bài đo 0,15–2 Ω.')
    c.cap(pin('vint'), gnd, 2.2e-6, 'VINT')
    c.cap(pin('vcp'), pin('vm'), 10e-9, 'VCP–VM')
    for (const [input, driver] of [['ain1', 'a1'], ['ain2', 'a2'], ['bin1', 'b1'], ['bin2', 'b2'], ['sleep', 'sleep']]) {
      c.signal(input, driver)
    }
    limits = sense.map(value => 0.2 / value)
    paths = [['aout1', 'aout2'], ['bout1', 'bout2']]
    seriesResistance = sense.map(value => 0.36 + value)
    transitionMs = 2
  } else {
    voltage = c.rail('vm', 9)
    c.controlRail(3.3)
    c.signal('in1'); c.signal('in2')
    const ilim = c.resistance(pin('ilim'), gnd, 'ILIM')
    needR5(ilim >= 15000 && ilim <= 150000, 'RILIM ngoài miền bài đo 15–150 kΩ.')
    limits = [64000 / ilim]
    paths = [['out1', 'out2']]
    seriesResistance = [0.565]
    transitionMs = 0.06
  }

  simultaneous(paths)
  const motors = paths.map(([a, b], i) => motor(a, b, i === 0 ? 'motor A' : 'motor B'))
  if (model === 'l293d') needR5(motors.every(coil => voltage / coil.ohm <= 0.6), 'Tải có thể vượt 0,60 A, ngoài miền L293D.')
  if (mode === 'sleep') {
    needR5(model !== 'l293d', 'L293D dùng EN để ngắt cầu.')
    const idleMs = model === 'drv8871' ? 2 : 0
    return r5Reading('Hi-Z · ngủ. Chờ thức ' + transitionMs + ' ms trong bài thử.', { a: 0, sleep: 1, idleMs, wakeMs: transitionMs },
      [{ timeMs: idleMs, values: { enable: 0, a: 0 } },
        { timeMs: idleMs + transitionMs, values: { enable: 1, a: 0 } }])
  }
  const a = mode === 'reverse' ? direction(0, 1) : direction(1, 0)
  const b = mode === 'independent' ? direction(0, 1) : a
  const loadMode = mode === 'brake-high' ? 'brake' : mode
  const results = motors.map((coil, i) =>
    motorTrace(coil, i === 0 ? a : b, voltage, limits[i], loadMode, seriesResistance[i]))
  const [first, second] = results
  const brakeHigh = model === 'l293d' && mode === 'brake-high'
  const text = mode === 'locked' ? 'Dòng khóa trục' : loadMode === 'brake' ? (model === 'l293d' ? (brakeHigh ? 'Phanh 11' : 'Phanh 00') : 'Phanh 11')
    : mode === 'coast' ? 'Thả trôi · Hi-Z' : mode === 'reverse' ? 'Quay ngược'
    : mode === 'independent' ? 'Hai cầu H độc lập' : 'Quay thuận'
  const values: R5Values = { a: first.i, velocityA: first.velocity, wakeMs: transitionMs }
  if (model === 'l293d' && loadMode === 'brake') {
    values.in1 = brakeHigh ? 1 : 0
    values.in2 = values.in1
    values.enable = 1
  }
  if (second) {
    values.b = second.i
    values.velocityB = second.velocity
  }
  const samples = first.samples.map(({ timeMs, values }, i) => ({ timeMs, values: {
    ...values, ...(second ? { iB: second.samples[i].values.i, velocityB: second.samples[i].values.velocity } : {}),
  } }))
  return r5Reading(text + ' · A ' + amps(first.i) + (second ? ' · B ' + amps(second.i) : '') +
    (mode === 'locked' ? '' : ' · ' + first.velocity.toFixed(2) + ' rad/s'), values, samples)
}

function uln(c: R5Circuit, mode: string) {
  const { model, pin, voltage, gnd } = c
  const count = model.catalogId === 'uln2003a' ? 7 : 8
  const supply = model.catalogId === 'uln2003a' ? 5 : 9
  c.controlRail(5)
  needR5(c.wired(c.partId, 'com') && voltage(pin('com')) === supply,
    'Hở COM hoặc sai rail tải. Đường hồi dòng chưa được xác minh.')
  const values: R5Values = {}
  const active = mode === 'last' ? count : 1
  const outputs = Array.from({ length: count }, (_, index) => pin('out' + (index + 1)))
  needR5(new Set(outputs).size === count && !outputs.includes(gnd), 'Các OUT phải độc lập, tải mắc về COM.')
  const samples: R5Sample[] = []
  for (let channel = 1; channel <= count; channel++) {
    c.signal('in' + channel)
    const { ohm, henry } = c.load(pin('com'), outputs[channel - 1], 'cuộn ' + channel, 'coil')
    const steady = (supply - 1) / ohm
    needR5(steady <= 0.3, 'Dòng kênh ' + channel + ' nằm ngoài miền bài thử.')
    const current = steady * (1 - Math.exp(-0.006 * ohm / henry))
    values['ch' + channel] = channel === active ? current : 0
    if (channel !== active) continue
    values.active = channel
    values.clamp = supply + 1.2
    for (let step = 0; step <= 24; step++) {
      const ms = step * 0.5
      const on = ms < 6
      const i = on ? steady * (1 - Math.exp(-(ms / 1000) * ohm / henry)) :
        Math.max(0, (current + 1.2 / ohm) * Math.exp(-(ms / 1000 - 0.006) * ohm / henry) - 1.2 / ohm)
      samples.push({ timeMs: ms, values: { i, v: on ? 1 : i > 0 ? supply + 1.2 : supply } })
    }
  }
  values.first = values.ch1
  values.last = values['ch' + count]
  return r5Reading('Kênh ' + active + ' · ' + amps(values['ch' + active]) + ' · OUT kẹp ' +
    values.clamp.toFixed(1) + ' V rồi dòng về 0', values, samples)
}

const phasePercent = (index: number) => Math.round(Math.sin(index * Math.PI / 16) * 100) / 100

function stepper(c: R5Circuit, mode: string) {
  const { pin, gnd } = c
  const vm = c.rail('vma', 12)
  c.rail('vmb', 12)
  const vrefs = [c.rail('avref', 0.99), c.rail('bvref', 0.99)]
  c.controlRail(3.3)
  for (const control of ['step', 'dir', 'reset', 'sleep', 'disable', 'm0', 'm1', 'm2']) c.signal(control)
  c.cap(pin('cp1'), pin('cp2'), 10e-9, 'CP1–CP2')
  c.cap(pin('vcp'), pin('vma'), 100e-9, 'VCP–VM')
  c.resistance(pin('vcp'), pin('vma'), '1 MΩ VCP–VM')
  c.cap(pin('v3p3out'), gnd, 470e-9, 'V3P3OUT')
  needR5(pin('decay') === gnd, 'Bài DRV8825 dùng DECAY mức thấp.')
  const sense = [c.resistance(pin('isena'), gnd, 'ISENA'), c.resistance(pin('isenb'), gnd, 'ISENB')]
  const currentLimit = sense.map((value, i) => vrefs[i] / (5 * value))
  needR5(currentLimit.every(value => value >= 0.1 && value <= 1), 'Dòng đặt nằm ngoài miền 0,1–1 A của bài thử.')
  const outputs = ['aout1', 'aout2', 'bout1', 'bout2'].map(pin)
  needR5(new Set(outputs).size === 4, 'Bốn ngõ ra DRV8825 phải nối hai cuộn độc lập.')
  const coils = [c.load(outputs[0], outputs[1], 'pha A', 'coil'), c.load(outputs[2], outputs[3], 'pha B', 'coil')]
  const type = mode === 'half' ? 4 : mode === 'eighth' || mode === 'dir' ? 1 : 8
  const backwards = mode === 'dir'
  let index = 4
  let current = [0, 0]
  const samples: R5Sample[] = []
  const read = (step: number, active: boolean) => {
    const set = active ? [phasePercent(8 - index) * currentLimit[0], phasePercent(index) * currentLimit[1]] : [0, 0]
    current = coils.map(({ ohm, henry }, i) => {
      const target = clamp(set[i], vm / ohm)
      const tau = henry / ohm
      const initial = current[i]
      const drive = target === 0 || initial * target >= 0 && Math.abs(initial) >= Math.abs(target)
        ? 0 : Math.sign(target) * vm / ohm
      const estimate = drive + (initial - drive) * Math.exp(-0.005 / tau)
      return drive === 0 && Math.abs(estimate) > Math.abs(target) ? estimate
        : (target - initial) * (estimate - target) >= 0 ? target : estimate
    })
    const values = { index, home: index === 4 ? 0 : 1, phaseA: set[0], phaseB: set[1], iA: current[0], iB: current[1] }
    samples.push({ timeMs: 3 + step * 5, values })
    return values
  }
  const start = read(0, true)
  if (mode === 'home') return r5Reading('HOME · pha A ' + amps(start.phaseA) + ' · pha B ' + amps(start.phaseB), start, samples)
  let final = start
  for (let step = 1; step <= 4; step++) {
    if (mode !== 'disable') index = (index + (backwards ? -type : type) + 32) % 32
    if (mode === 'reset' && step === 4) index = 4
    final = read(step, mode !== 'disable' && !(mode === 'reset' && step === 4))
  }
  const title = mode === 'disable' ? '/ENBL cao · bỏ qua STEP' : mode === 'reset' ? '/RESET thấp · HOME'
    : (backwards ? 'DIR ngược · ' : '') + (type === 8 ? 'Full step' : type === 4 ? 'Half step' : '1/8 step')
  return r5Reading(title + ' · index ' + final.index + ' · pha A ' + amps(final.phaseA) + ' · pha B ' + amps(final.phaseB), final, samples)
}

export function runR5Driver(c: R5Circuit, mode: string) {
  switch (c.model.catalogId) {
    case 'drv8825': return stepper(c, mode)
    case 'uln2003a':
    case 'uln2803a': return uln(c, mode)
    default: return bridges(c, mode)
  }
}
