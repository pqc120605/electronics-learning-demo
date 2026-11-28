import type { LivePinState } from '../lib/avrLiveMachine'
import { coupledSegments, type CircuitStimuli, type CoupledCircuit, type CoupledPart } from '../lib/freestyle/coupledCircuit'
import { createDhtWire } from './dhtWire'
import { advanceFlipFlop, advanceMcp3008, advanceShiftRegister, andGate, initialFlipFlop, initialShiftRegister,
  resetAdc, schmittInverter, type Logic } from './catalogR1Digital'

import { stepR2a, type R2aState } from './catalogR2aDigital'
import { createR2bCircuitInterface } from './catalogR2bCircuit'
import { selectR2bMux, r2bMuxSignal } from './catalogR2bSignals'
import type { R2bBusEvent } from './catalogR2bI2c'

type Voltage = number | 'X' | 'Z'
type Driver = { net: string; voltage: Voltage }
export type CoupledFrame = {
  levels: Record<string, Voltage>
  litParts: string[]
  unstable: boolean
  events: number
  bus?: R2bBusEvent[]
  busIssues?: string[]
  segments?: Record<string, string[]>
  dataEdges?: Array<{ partId: string; timeUs: number; level: 0 | 1 }>
}
type LogicPins = Readonly<Record<number, LivePinState>>

const toVoltage = (level: Logic): Voltage => level === 1 ? 5 : level === 0 ? 0 : level
function toLogic(value: Voltage): Logic {
  return typeof value !== 'number' ? value : value <= 1.5 ? 0 : value >= 3.5 ? 1 : 'X'
}

function resolveDrivers(drives: readonly Driver[]) {
  const levels = new Map<string, Voltage>()
  for (const { net, voltage } of drives) {
    if (voltage === 'Z') continue
    const previous = levels.get(net)
    levels.set(net, previous === undefined || previous === voltage ? voltage : 'X')
  }
  return levels
}

function sameDrivers(a: Map<string, Voltage>, b: Map<string, Voltage>) {
  return a.size === b.size && [...a].every(([pin, voltage]) => b.get(pin) === voltage)
}

export function createCoupledDigital(graph: CoupledCircuit, initialStimuli: CircuitStimuli = {}) {
  let stimuli = initialStimuli
  let events = 0
  let outputs = new Map<string, Voltage>()
  const flips = new Map<string, typeof initialFlipFlop>()
  const shifts = new Map<string, ReturnType<typeof initialShiftRegister>>()
  const adcs = new Map<string, ReturnType<typeof resetAdc>>()
  let registerDrivers = new Map<string, Voltage>()
  const r2aState = new Map<string, R2aState>()
  const switches = graph.parts.filter(part => part.kind === 'button')
  const keypads = graph.parts.filter(part => part.kind === 'keypad')
  const displays = graph.parts.filter(part => part.kind === 'anode-display')
  const sensors = graph.parts.flatMap(part => part.kind === 'dht11' || part.kind === 'dht22'
    ? [{ part, wire: createDhtWire(part.kind), gpio: graph.gpios.find(pin => pin.net === part.pins.data)?.pin }] : [])
  const dataEdges: NonNullable<CoupledFrame['dataEdges']> = []
  const dataLevels = new Map<string, 0 | 1>()
  let nextWakeMs = Infinity
  const pots = graph.parts.filter(part => part.kind === 'pot')
  const resistors = graph.parts.filter(part => part.kind === 'resistor')
  const leds = graph.parts.filter(part => part.kind === 'led')
  const chips = graph.parts.filter(part => ['and', 'schmitt', 'flip', 'shift', 'adc', 'r2a'].includes(part.kind))
  const registers = chips.filter(part => part.kind === 'r2a' && (part.model === '164' || part.model === '165'))
  const combinational = chips.filter(part => !registers.includes(part))
  const hasR2b = graph.parts.some(part => part.kind === 'r2b')
  const interfaces = hasR2b ? createR2bCircuitInterface(graph) : undefined
  const muxes = graph.parts.filter(part => part.kind === 'r2b' && (part.model === 'cd4051b' || part.model === 'cd74hc4067'))
  let time = 0
  const supply = new Set(graph.rail5)
  const railDrivers: Driver[] = [...graph.rail5.map(net => ({ net, voltage: 5 })), { net: graph.ground, voltage: 0 }]
  let frame: CoupledFrame = { levels: {}, litParts: [], unstable: false, events }

  function solve(drivers: Driver[], chipOutputs: Map<string, Voltage>, ignoreChip?: string) {
    const levels = resolveDrivers([...drivers, ...chips.flatMap(part => part.id === ignoreChip ? [] : Object.entries(part.pins).flatMap(([pin, net]) => {
      const voltage = chipOutputs.get(part.id + ':' + pin)
      return voltage === undefined ? [] : [{ net, voltage }]
    }))])
    const contacts: Array<readonly [string, string]> = switches.filter(part => stimuli[part.id] === true)
      .map(part => [part.pins.contactA,part.pins.contactB])
    for (const part of keypads) {
      const key = stimuli[part.id]
      if (typeof key === 'number' && Number.isInteger(key) && key >= 0 && key < 16) {
        contacts.push([part.pins['r' + (1 + Math.floor(key / 4))],part.pins['c' + (1 + key % 4)]])
      }
    }
    function joinContacts(target: Map<string, Voltage>) {
      for (let pass = 0; pass <= contacts.length; pass++) {
        for (const [a,b] of contacts) {
          const l = target.get(a), r = target.get(b)
          const value = l !== undefined && r !== undefined && l !== r ? 'X' : l ?? r
          if (value !== undefined) { target.set(a,value); target.set(b,value) }
        }
      }
    }
    function weakPulls(target: ReadonlyMap<string, Voltage>) {
      const pulls: Driver[] = []
      for (const { pins } of resistors) {
        const a = target.get(pins.a), b = target.get(pins.b)
        if (a === undefined && b !== undefined) pulls.push({ net:pins.a, voltage:b })
        if (b === undefined && a !== undefined) pulls.push({ net:pins.b, voltage:a })
      }
      return pulls
    }
    joinContacts(levels)
    if (interfaces) {
      const external = new Map(levels)
      for (const [net,voltage] of resolveDrivers(weakPulls(levels))) external.set(net,voltage)
      if (!ignoreChip) interfaces.observeExternal(external, time)
      const extra = interfaces.drives()
      for (const [net, voltage] of resolveDrivers(extra.filter(driver => !driver.weak))) {
        const prior = levels.get(net)
        levels.set(net, prior === undefined || prior === voltage ? voltage : 'X')
      }
      for (const chip of muxes) {
        if (chip.kind !== 'r2b' || (chip.model !== 'cd4051b' && chip.model !== 'cd74hc4067')) continue
        const id = selectR2bMux(chip.model, pin => levels.get(chip.pins[pin]) ?? external.get(chip.pins[pin]) ?? 'Z')
        if (id === 'X') levels.set(chip.pins.com,'X')
        if (typeof id === 'number') {
          const com = chip.pins.com, channel = chip.pins['ch'+id]
          const level = r2bMuxSignal(levels.get(com) ?? 'Z', levels.get(channel) ?? 'Z')
          if (level !== 'Z') { levels.set(com,level); levels.set(channel,level) }
          contacts.push([com,channel])
        }
      }
      joinContacts(levels)
      const weak = extra.filter(driver => driver.weak && !levels.has(driver.net))
      for (const [net, voltage] of resolveDrivers([...weakPulls(levels), ...weak])) {
        if (!levels.has(net)) levels.set(net,voltage)
      }
      joinContacts(levels)
      if (!ignoreChip) interfaces.observeFinal(levels)
    } else {
      for (const [net, voltage] of resolveDrivers(weakPulls(levels))) levels.set(net, voltage)
      joinContacts(levels)
    }
    return levels
  }

  function updateChip(part: CoupledPart, levels: Map<string, Voltage>, next: Map<string, Voltage>) {
    const v = (pin: string) => levels.get(part.pins[pin]) ?? 'Z'
    const read = (pin: string) => toLogic(v(pin))
    const write = (pin: string, logic: Logic) => next.set(part.id + ':' + pin, toVoltage(logic))
    const grounded = (pin: string) => part.pins[pin] === graph.ground && v(pin) === 0
    const powered = (pin: string) => supply.has(part.pins[pin]) && v(pin) === 5
    const enabled = powered('vcc') && grounded('gnd')
    if (part.kind === 'r2a') {
      const result = stepR2a(part.model, enabled, read, r2aState.get(part.id))
      if (result.state) r2aState.set(part.id, result.state)
      for (const [pin, value] of Object.entries(result.outputs)) write(pin, value)
    } else if (part.kind === 'and') {
      for (let i = 1; i <= 4; i++) write(i + 'y', andGate(enabled, read(i + 'a'), read(i + 'b')))
    } else if (part.kind === 'schmitt') {
      for (let i = 1; i <= 6; i++) {
        const input = read(i + 'a')
        // This workspace adapter uses rail-to-rail logic. The 4.5 V ramp stays in the separate Schmitt experiment.
        write(i + 'y', schmittInverter(enabled, input === 0 ? 0 : input === 1 ? 4.5 : NaN, 'X'))
      }
    } else if (part.kind === 'flip') {
      for (let i = 1; i <= 2; i++) {
        const key = part.id + ':' + i
        const result = advanceFlipFlop(flips.get(key) ?? initialFlipFlop, {
          powered: enabled, clk: read(i + 'clk'), d: read(i + 'd'), pre: read(i + 'pre'), clr: read(i + 'clr'),
        })
        flips.set(key, result)
        write(i + 'q', result.q); write(i + 'qn', result.qn)
      }
    } else if (part.kind === 'shift') {
      const { next: state, q, serial } = advanceShiftRegister(shifts.get(part.id) ?? initialShiftRegister(), {
        powered: enabled, ser: read('ser'), srclk: read('srclk'), rclk: read('rclk'), srclr: read('srclr'), oe: read('oe'),
      })
      shifts.set(part.id, state)
      Array.from('abcdefgh', (letter, i) => write('q' + letter, q[i]))
      write('qhs', serial)
    } else if (part.kind === 'adc') {
      const state = adcs.get(part.id) ?? resetAdc()
      const cs = read('cs'), clock = read('sclk'), input = read('din')
      const supplied = powered('vdd') && powered('vref') && grounded('agnd') && grounded('dgnd')
      if (cs === 1 || !supplied) {
        const nextState = advanceMcp3008(state, { powered: supplied, cs: 1, clock: clock === 1 ? 1 : 0, din: 0, channelVolts: [] })
        adcs.set(part.id, nextState)
        write('dout', 'Z')
      } else if (cs !== 0 || (clock !== 0 && clock !== 1) || (input !== 0 && input !== 1 && state.command.length < 5)) {
        adcs.set(part.id, resetAdc())
        write('dout', 'X')
      } else {
        const channelVolts = Array.from({ length: 8 }, (_, index) => Number(v('ch' + index)))
        const nextState = advanceMcp3008(state, { powered: true, cs, clock, din: input === 1 ? 1 : 0, channelVolts })
        adcs.set(part.id, nextState)
        write('dout', nextState.dout)
      }
    }
  }

  function step(pins: LogicPins, now = 0) {
    time = now
    events += 1
    const drivers: Driver[] = [...railDrivers]
    for (const entry of graph.gpios) {
      const state = pins[entry.pin]
      if (state?.mode === 'output') drivers.push({ net: entry.net, voltage: state.level ? 5 : 0 })
    }
    nextWakeMs = Infinity
    for (const { part, wire, gpio } of sensors) {
      if (gpio === undefined || !supply.has(part.pins.vcc) || part.pins.gnd !== graph.ground) continue
      const pin = pins[gpio]
      const temp = stimuli[part.id + ':temperature']
      const humidity = stimuli[part.id + ':humidity']
      const active = pin?.mode === 'output'
      const signal = wire.step(time * 1000, active && !pin.level, active && pin.level,
        typeof temp === 'number' ? temp : part.kind === 'dht11' ? 23 : -5.4,
        typeof humidity === 'number' ? humidity : part.kind === 'dht11' ? 55 : 55.5)
      if (signal.low) drivers.push({ net: part.pins.data, voltage: 0 })
      nextWakeMs = Math.min(nextWakeMs, signal.nextMicroseconds / 1000)
    }
    for (const part of pots) {
      if (!supply.has(part.pins.vcc) || part.pins.gnd !== graph.ground) continue
      const value = stimuli[part.id]
      const ratio = typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5
      drivers.push({ net: part.pins.wiper, voltage: ratio * 5 })
    }
    let levels: Map<string, Voltage> = new Map()
    let unstable = true
    for (let delta = 0; delta < 16; delta++) {
      levels = solve(drivers, outputs)
      const next = new Map(registerDrivers)
      for (const chip of combinational) {
        // A DIR change must not let the input side read the chip's own previous drive.
        const inputs = chip.kind === 'r2a' && chip.model === '245' ? solve(drivers, outputs, chip.id) : levels
        updateChip(chip, inputs, next)
      }
      if (!sameDrivers(next, outputs)) {
        outputs = next
        continue
      }
      // Sample all R2A registers from the same settled inputs before publishing any new output.
      const sampled = new Map<string, Voltage>()
      for (const register of registers) updateChip(register, levels, sampled)
      if (sameDrivers(registerDrivers, sampled)) {
        unstable = false
        break
      }
      registerDrivers = sampled
      for (const [pin, voltage] of sampled) outputs.set(pin, voltage)
    }
    if (unstable) {
      outputs = new Map([...outputs].map(([key]) => [key, 'X']))
      registerDrivers.clear()
      r2aState.clear()
      levels = solve(drivers, outputs)
    }
    for (const { part } of sensors) {
      const level = toLogic(levels.get(part.pins.data) ?? 'Z')
      if (level !== 0 && level !== 1 || dataLevels.get(part.id) === level) continue
      dataLevels.set(part.id, level)
      dataEdges.push({ partId: part.id, timeUs: Math.round(time * 1000), level })
      if (dataEdges.length > 192) dataEdges.shift()
    }
    frame = {
      levels: Object.fromEntries(levels), unstable, events,
      ...(sensors.length ? { dataEdges: [...dataEdges] } : {}),
      ...(interfaces ? { bus:interfaces.busEvents(), busIssues:interfaces.issues() } : {}),
      ...(displays.length ? { segments: Object.fromEntries(displays.map(part => [
        part.id, supply.has(part.pins.com1) && supply.has(part.pins.com2)
          ? coupledSegments.filter(segment => levels.get(part.pins[segment]) === 0) : [],
      ])) } : {}),
      litParts: leds.filter(part => toLogic(levels.get(part.pins.anode) ?? 'Z') === 1 && toLogic(levels.get(part.pins.cathode) ?? 'Z') === 0)
        .map(part => part.id),
    }
    return graph.gpios.flatMap(({ pin, net }) => {
      if (pins[pin]?.mode === 'output') return []
      const voltage = levels.get(net)
      const logic = toLogic(voltage ?? 'Z')
      return [{ pin, digital: logic === 1 || (logic === 'Z' && pins[pin]?.mode === 'input_pullup'),
        analog: typeof voltage === 'number' ? voltage / 5 : 0 }]
    })
  }

  return { step, interfaces, nextWakeMs: () => nextWakeMs, update: (values: CircuitStimuli) => { stimuli = values }, snapshot: () => frame }
}
