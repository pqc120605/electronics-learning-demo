import { getComponentDefinition } from '../data/componentRegistry'
import type { BuilderLessonId } from '../data/builderLessons'
import type { CircuitConnection, CircuitPart } from '../types/circuitTopology'
import { createNetIndex, endpointKey, findLedSeriesPath, type NetIndex, type WireNet } from './circuitNets'

type PartRef = Pick<CircuitPart, 'id' | 'type'>

export type LogicTraceInput = {
  lessonId: BuilderLessonId
  parts: PartRef[]
  wires: CircuitConnection[]
  frame: { ledOn?: boolean; level?: 'HIGH' | 'LOW'; segments?: number[] } | null
  active: boolean
  hasCircuitErrors: boolean
  inputs: { pressed: boolean; detected: boolean; potPercent: number; lightPercent: number }
  tick: number
}

const pinKeys = (part: PartRef) => (getComponentDefinition(part.type)?.pins ?? []).map((pin) => `${part.id}:${pin.id}`)

function netsTouching(parts: PartRef[], nets: NetIndex, ...types: string[][]) {
  const ids = types.map((group) => new Set(parts.filter((part) => group.includes(part.type)).map((part) => part.id)))
  return nets.nets.filter((net) => ids.every((group) => [...net.endpoints].some((key) => group.has(key.slice(0, key.lastIndexOf(':'))))))
    .flatMap((net) => [...net.wireIds])
}

function groundNets(parts: PartRef[], nets: NetIndex) {
  const grounds = parts.flatMap((part) => (getComponentDefinition(part.type)?.pins ?? []).filter((pin) => pin.electricalType === 'ground').map((pin) => `${part.id}:${pin.id}`))
  return nets.wiresOn(grounds)
}

/**
 * Wires that share a net with the part of the circuit the current frame drives.
 * This is a logic view of what is wired together, not a solved current path.
 */
export function getLogicTraceWireIds({ lessonId, parts, wires, frame, active, hasCircuitErrors, inputs, tick }: LogicTraceInput): Set<string> {
  if (!active || !frame || hasCircuitErrors) return new Set()
  const nets = createNetIndex(wires)
  const ofType = (type: string) => parts.filter((part) => part.type === type)
  const board = ofType('board')[0]
  const boardPin = (pinId: string) => `${board?.id}:${pinId}`
  const onBoardPin = (key: string, pinId: string) => Boolean(board) && nets.sameNet(key, boardPin(pinId)) && Boolean(nets.netOf(key))
  const ledWires = () => frame.ledOn ? ofType('led').flatMap((led) => {
    const path = findLedSeriesPath(parts, led, nets.sameNet)
    return path ? nets.wiresOn([path.sourceFrom, path.sourceTo, path.anode, path.cathode, `${path.resistorId}:a`, `${path.resistorId}:b`]) : []
  }) : []
  const stage = Math.max(0, (tick - 1) % 3)

  const traced = (): string[] => {
    switch (lessonId) {
      case 'blink':
      case 'source-led':
        return ledWires()
      case 'analog-potentiometer':
        return [...ofType('potentiometer').filter((pot) => onBoardPin(`${pot.id}:wiper`, 'input')).flatMap((pot) => [...(inputs.potPercent > 0 ? [`${pot.id}:wiper`] : []), `${pot.id}:vcc`, `${pot.id}:gnd`]).flatMap((key) => nets.wiresOn([key])), ...ledWires()]
      case 'analog-ldr': {
        const divider = ofType('ldr').flatMap((ldr) => {
          const legs = pinKeys(ldr), middle = legs.find((key) => onBoardPin(key, 'input'))
          if (!middle) return []
          const fixedLegs = ofType('resistor').filter((resistor) => pinKeys(resistor).some((key) => nets.sameNet(key, middle))).flatMap((resistor) => pinKeys(resistor).filter((key) => !nets.sameNet(key, middle)))
          return [...(inputs.lightPercent > 0 ? [middle] : []), ...legs.filter((key) => key !== middle), ...fixedLegs]
        })
        return [...nets.wiresOn(divider), ...ledWires()]
      }
      case 'button-led':
      case 'ir-alert': {
        const sourceOn = lessonId === 'button-led' ? inputs.pressed : inputs.detected
        const sources = lessonId === 'button-led' ? ofType('button').filter((part) => pinKeys(part).some((key) => onBoardPin(key, 'input'))) : ofType('ir-sensor').filter((part) => onBoardPin(`${part.id}:out`, 'input'))
        return [...(sourceOn ? nets.wiresOn(sources.flatMap(pinKeys)) : []), ...ledWires()]
      }
      case 'ultrasonic-distance':
        return [...nets.wiresOn(ofType('ultrasonic').flatMap(pinKeys)), ...ledWires()]
      case 'seven-segment-counter': {
        const driven = (frame.segments ?? []).flatMap((value, index) => value ? [boardPin(`seg${index}`)] : [])
        const seriesLegs = driven.flatMap((key) => ofType('resistor').filter((resistor) => pinKeys(resistor).some((leg) => nets.sameNet(leg, key))).flatMap(pinKeys))
        const commons = driven.length ? ofType('seven-segment').flatMap((display) => [`${display.id}:com1`, `${display.id}:com2`]) : []
        return nets.wiresOn([...driven, ...seriesLegs, ...commons])
      }
      case 'buck-boost-concept':
        return stage === 0 ? netsTouching(parts, nets, ['battery']) : stage === 1 ? netsTouching(parts, nets, ['buck-converter', 'boost-converter', 'led']) : []
      case 'dc-motor-driver':
        return stage === 0 ? netsTouching(parts, nets, ['board'], ['tb6612']) : stage === 1 ? netsTouching(parts, nets, ['tb6612'], ['dc-motor']) : [...netsTouching(parts, nets, ['battery']), ...groundNets(parts, nets)]
      case 'mosfet-switch':
        return stage === 0 ? netsTouching(parts, nets, ['board']) : stage === 1 ? netsTouching(parts, nets, ['dc-motor', 'mosfet']) : netsTouching(parts, nets, ['diode', 'battery'])
    }
  }
  return new Set(traced())
}

export type WireSignal = 'power' | 'ground' | 'high' | 'low' | 'pulse' | 'analog' | 'active'
/** `forward` runs from wire.from to wire.to. Only set where the lesson model defines a direction. */
export type WireFlow = { signal: WireSignal; label?: string; direction: 'forward' | 'reverse' | 'none' }

function orientNet(net: WireNet, start: string, wires: CircuitConnection[]) {
  const reached = new Set([start]), result = new Map<string, WireFlow['direction']>()
  const inNet = wires.filter((wire) => net.wireIds.has(wire.id))
  for (let grew = true; grew;) {
    grew = false
    for (const wire of inNet) {
      if (result.has(wire.id)) continue
      const from = endpointKey(wire.from), to = endpointKey(wire.to)
      if (!reached.has(from) && !reached.has(to)) continue
      result.set(wire.id, reached.has(from) ? 'forward' : 'reverse')
      reached.add(from).add(to)
      grew = true
    }
  }
  return result
}

/**
 * Logic state of each wire for the current frame: a teaching label, never a measured
 * voltage or current. Wires with no state the lesson can name are left out of the map.
 */
export function getLogicFlow(input: LogicTraceInput): Map<string, WireFlow> {
  const { lessonId, parts, wires, frame, active, hasCircuitErrors, inputs } = input
  const flows = new Map<string, WireFlow>()
  if (!active || !frame || hasCircuitErrors) return flows
  const nets = createNetIndex(wires)
  const ofType = (type: string) => parts.filter((part) => part.type === type)
  const board = ofType('board')[0]
  const boardPin = (pinId: string) => `${board?.id}:${pinId}`
  const paint = (key: string, flow: WireFlow) => { const net = nets.netOf(key); if (net) for (const id of net.wireIds) flows.set(id, flow) }
  const paintFrom = (key: string, signal: WireSignal, label: string | undefined, directed: boolean) => {
    const net = nets.netOf(key)
    if (!net) return
    const directions = orientNet(net, key, wires)
    for (const id of net.wireIds) flows.set(id, { signal, label, direction: directed ? directions.get(id) ?? 'none' : 'none' })
  }
  for (const part of parts) for (const pin of getComponentDefinition(part.type)?.pins ?? []) {
    if (pin.electricalType === 'ground') paint(`${part.id}:${pin.id}`, { signal: 'ground', label: 'GND', direction: 'none' })
    else if (pin.electricalType === 'power') paint(`${part.id}:${pin.id}`, { signal: 'power', label: 'Nguồn', direction: 'none' })
  }
  if (lessonId === 'buck-boost-concept' || lessonId === 'dc-motor-driver' || lessonId === 'mosfet-switch') {
    for (const id of getLogicTraceWireIds(input)) if (!flows.has(id)) flows.set(id, { signal: 'active', direction: 'none' })
    return flows
  }
  const onBoardPin = (key: string, pinId: string) => Boolean(board && nets.netOf(key)) && nets.sameNet(key, boardPin(pinId))
  for (const led of ofType('led')) {
    const path = findLedSeriesPath(parts, led, nets.sameNet)
    if (!path) continue
    const on = Boolean(frame.ledOn)
    const label = on ? 'HIGH' : 'LOW'
    const seriesParts = [path.resistorId, led.id]
    let cursor = path.sourceFrom
    for (let step = 0; step < 3; step += 1) {
      const groundNet = nets.sameNet(cursor, path.sourceTo)
      paintFrom(cursor, groundNet ? 'ground' : on ? 'high' : 'low', groundNet ? 'GND' : label, on)
      const nextPart = seriesParts.find((id) => parts.some((part) => part.id === id && pinKeys(part).some((key) => nets.sameNet(key, cursor))))
      const next = nextPart ? pinKeys(parts.find((part) => part.id === nextPart)!).find((key) => !nets.sameNet(key, cursor)) : undefined
      if (!nextPart || !next) break
      seriesParts.splice(seriesParts.indexOf(nextPart), 1)
      cursor = next
    }
  }
  if (lessonId === 'button-led') for (const button of ofType('button')) {
    const contact = pinKeys(button).find((key) => onBoardPin(key, 'input'))
    if (contact) paintFrom(contact, inputs.pressed ? 'low' : 'high', inputs.pressed ? 'LOW' : 'HIGH', false)
  }
  if (lessonId === 'ir-alert') for (const sensor of ofType('ir-sensor')) if (onBoardPin(`${sensor.id}:out`, 'input')) paintFrom(`${sensor.id}:out`, inputs.detected ? 'low' : 'high', inputs.detected ? 'LOW' : 'HIGH', inputs.detected)
  if (lessonId === 'analog-potentiometer') for (const pot of ofType('potentiometer')) if (onBoardPin(`${pot.id}:wiper`, 'input')) paintFrom(`${pot.id}:wiper`, 'analog', `${inputs.potPercent}%`, inputs.potPercent > 0)
  if (lessonId === 'analog-ldr') for (const ldr of ofType('ldr')) {
    const middle = pinKeys(ldr).find((key) => onBoardPin(key, 'input'))
    if (middle) paintFrom(middle, 'analog', `${inputs.lightPercent}%`, inputs.lightPercent > 0)
  }
  if (lessonId === 'ultrasonic-distance') for (const sensor of ofType('ultrasonic')) {
    if (onBoardPin(`${sensor.id}:trig`, 'trig')) paintFrom(boardPin('trig'), 'pulse', 'TRIG', true)
    if (onBoardPin(`${sensor.id}:echo`, 'echo')) paintFrom(`${sensor.id}:echo`, 'pulse', 'ECHO', true)
  }
  if (lessonId === 'seven-segment-counter') (frame.segments ?? []).forEach((value, index) => {
    const start = boardPin(`seg${index}`)
    paintFrom(start, value ? 'high' : 'low', value ? 'HIGH' : 'LOW', Boolean(value))
    for (const resistor of ofType('resistor')) {
      const legs = pinKeys(resistor)
      if (!legs.some((leg) => nets.sameNet(leg, start))) continue
      const far = legs.find((leg) => !nets.sameNet(leg, start))
      if (far) paintFrom(far, value ? 'high' : 'low', value ? 'HIGH' : 'LOW', Boolean(value))
    }
  })
  return flows
}
