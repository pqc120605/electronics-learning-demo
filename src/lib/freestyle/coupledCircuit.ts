import { getCatalogPart } from '../../data/catalogParts'
import type { R2aModel } from '../../data/catalogR2aParts'
import type { R2bModel } from '../../data/catalogR2bParts'
import { componentRegistry } from '../../data/componentRegistry'
import { createNetIndexV2 } from '../circuitNetsV2'
import type { CircuitDocV2 } from '../circuitDocV2'
import { SIGNAL_PINS, type PinMap } from './freestyleBoards'
import type { AvrLiveBoard } from '../avrLiveMachine'

type Kind = 'and' | 'schmitt' | 'flip' | 'shift' | 'adc' | 'led' | 'resistor' | 'button' | 'pot' | 'dht11' | 'dht22' | 'keypad' | 'anode-display'
export type CoupledPart = { id: string; pins: Record<string, string>; resistanceOhm?: number } & (
  { kind: Kind } | { kind: 'r2a'; model: R2aModel } | { kind: 'r2b'; model: R2bModel }
)
export type CoupledCircuit = {
  board: AvrLiveBoard
  gpios: { pin: number; net: string }[]
  rail5: string[]
  ground: string
  parts: CoupledPart[]
}
export type CircuitStimuli = Record<string, number | boolean>
const supported: Readonly<Record<string, Kind>> = {
  'sn74hc08-r1': 'and', 'sn74hc14-r1': 'schmitt', 'sn74hc74-r1': 'flip',
  'sn74hc595-r1': 'shift', 'mcp3008-r1': 'adc',
  led: 'led', resistor: 'resistor', button: 'button', potentiometer: 'pot',
  dht11: 'dht11', 'dht22-bare': 'dht22', 'keypad-4x4': 'keypad', 'seven-segment-anode': 'anode-display',
}

export const coupledSegments = ['a','b','c','d','e','f','g','dp'] as const

/** Find only a direct resistor between two known nets. */
function hasResistor(parts: readonly CoupledPart[], a: string, b: string, minimum: number, maximum: number) {
  return a !== b && parts.some(part => part.kind === 'resistor' && (part.resistanceOhm ?? 0) >= minimum && (part.resistanceOhm ?? 0) <= maximum
    && (part.pins.a === a && part.pins.b === b || part.pins.a === b && part.pins.b === a))
}

export function compileCoupledCircuit(doc: CircuitDocV2, boardId: string, pinMap: PinMap):
  { ok: true; graph: CoupledCircuit } | { ok: false; issues: string[] } {
  const board = doc.parts.find(part => part.type === 'board')
  if (boardId !== 'arduino-uno-r3' || !board) return { ok: false, issues: ['Chọn Arduino Uno R3 cho phiên chạy HEX cùng mạch số.'] }
  if (doc.parts.length > 40 || doc.wires.length > 120) return { ok: false, issues: ['Miền chạy này hỗ trợ tối đa 40 linh kiện và 120 dây.'] }
  const index = createNetIndexV2(doc)
  const net = (id: string, pin: string) => index.netOf(id + ':' + pin)?.key ?? id + ':' + pin
  const wired = (key: string) => {
    const item = index.netOf(key)
    return Boolean(item && (item.wireIds.size > 0 || item.endpoints.size > 1))
  }
  const issues: string[] = []
  const parts: CoupledPart[] = []
  for (const item of doc.parts) {
    if (item.type === 'board' || item.type === 'breadboard') continue
    const definition = componentRegistry.find(part => part.id === item.type)
    const pins = Object.fromEntries((definition?.pins ?? []).map(pin => [pin.id, net(item.id, pin.id)]))
    if (!Object.values(pins).some(wired)) continue
    const variant = getCatalogPart(item.type)
    if (variant?.revision === 'R2A') {
      parts.push({ id: item.id, pins, kind: 'r2a', model: variant.model })
      continue
    }
    if (variant?.revision === 'R2B') {
      if (variant.catalogId === 'lm358' || variant.catalogId === 'lm393') {
        issues.push(item.id + ' · Dùng phép đo DC ngspice cho ' + variant.mpn + '.')
      } else if (variant.catalogId === 'sn65hvd230' || variant.catalogId === 'max3232') {
        issues.push(item.id + ' · Dùng bài thử transceiver 3,3 V của ' + variant.mpn + '.')
      } else {
        parts.push({ id: item.id, pins, kind: 'r2b', model: variant.catalogId })
      }
      continue
    }
    const kind = supported[item.type]
    if (!kind) {
      const label = variant?.mpn ?? definition?.label ?? item.type
      issues.push(item.id + ' · ' + label + ': chưa có model trong bộ giải mạch số cùng AVR.')
      continue
    }
    parts.push({ id: item.id, pins, kind, ...(kind === "resistor" ? { resistanceOhm: item.value?.ohm ?? 220 } : {}) })
  }
  const gpios: CoupledCircuit['gpios'] = []
  for (const role of SIGNAL_PINS) {
    const key = net(board.id, role)
    if (!wired(key)) continue
    const pin = pinMap[role]
    if (!Number.isInteger(pin) || pin < 0 || pin > 19) {
      issues.push('Chân ' + role + ' phải trỏ tới GPIO Uno từ D0 đến A5.')
      continue
    }
    const previous = gpios.find(item => item.pin === pin)
    if (previous && previous.net !== key) issues.push('Hai alias đang nối các net khác nhau vào cùng GPIO ' + pin + '.')
    else if (!previous) gpios.push({ pin, net: key })
  }
  if (!gpios.length) issues.push('Nối ít nhất một chân tín hiệu của Uno để chạy firmware cùng mạch.')
  const rail5 = [net(board.id,'vcc'), net(board.id,'v5')]
  const ground = net(board.id,'gnd')
  if (rail5.includes(ground)) issues.push('Nguồn 5 V đang nối trực tiếp với GND.')
  for (const part of parts) {
    const p = part.pins
    if ((part.kind === 'dht11' || part.kind === 'dht22') &&
        (!rail5.includes(p.vcc) || p.gnd !== ground || !gpios.some(gpio => gpio.net === p.data)
          || !hasResistor(parts,p.data,p.vcc,1000,10000) || rail5.includes(p.data) || p.data === ground)) {
      issues.push(part.id + ' · DHT cần nguồn 5 V, GND, DATA nối GPIO và điện trở kéo lên 1–10 kΩ.')
    }
    if (part.kind === 'anode-display' && (
      !rail5.includes(p.com1) || !rail5.includes(p.com2) ||
      coupledSegments.some(segment => wired(p[segment]) &&
        (rail5.includes(p[segment]) || p[segment] === ground || gpios.some(gpio => gpio.net === p[segment])
          || !gpios.some(gpio => hasResistor(parts,p[segment],gpio.net,220,10000)))))) {
      issues.push(part.id + ' · Nối COM1/COM2 đến 5 V và mỗi đoạn qua điện trở hạn dòng riêng.')
    }
  }
  if (!parts.some(part => !['led','resistor','button','pot'].includes(part.kind))) {
    issues.push('Nối ít nhất một IC hoặc ngoại vi có mô hình chạy cùng Uno vào mạch.')
  }
  return issues.length ? { ok: false, issues } : { ok: true, graph: {
    board: 'arduino-uno-r3', gpios, parts, rail5, ground,
  } }
}
