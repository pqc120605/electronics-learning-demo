import { componentRegistry } from '../../data/componentRegistry'
import { keypadContact } from '../../data/kitPartProfiles'
import { createNetIndexV2 } from '../circuitNetsV2'
import { canMount, footprintHoles, occupancy, resolvePartGeometry } from '../mountResolve'
import { formatHole, holeNet, type GridHole } from '../breadboardGrid'
import { sketchBoards } from '../sketchInterpreter'
import { validateCircuitDoc, type CircuitDocV2, type CircuitEndpointV2, type CircuitPartV2 } from '../circuitDocV2'
import type { LivePinState } from '../avrLiveMachine'
import { readWireLayout, type FreestyleWireLayout } from './freestyleWireLayout'
import { freestyleSamples, sampleLanguage, type FreestyleSampleId } from './freestyleSampleLibrary'
import { SIGNAL_PINS, freestyleBoards, getFreestyleBoard, type FreestyleLanguage, type PinMap, type SignalPin } from './freestyleBoards'
export { freestyleSamples, type FreestyleSampleId } from './freestyleSampleLibrary'
export { SIGNAL_PINS, SIGNAL_PIN_LABELS, freestyleBoards, getFreestyleBoard } from './freestyleBoards'
export type { FreestyleBoard, FreestyleEngine, FreestyleLanguage, PinMap, SignalPin } from './freestyleBoards'

/**
 * Bàn lắp mạch tự do (2026-11-14): board tự chọn, linh kiện tự đặt, dây tự nối, code tự viết.
 * Tài liệu mạch là CircuitDocV2 với lessonId "freestyle". Board dùng part "board" sẵn có; các chân tín hiệu
 * trừu tượng của part đó (ledOut, input, trig, echo, seg0–seg6) được gán số chân thật bằng `pinMap`.
 * Đánh giá mạch dưới đây là mô hình logic giáo dục (mức HIGH/LOW, có/không điện trở), KHÔNG phải mô phỏng điện.
 */

export function sketchBoardFor(boardId: string) {
  return sketchBoards.find(board => board.id === boardId) ?? sketchBoards[0]
}

/** Nhãn chân như người dùng viết trong code: D13/A0 cho Arduino, GP15 cho Pico, PA5 cho Blue Pill, GPIO 23 cho ESP32. */
export function pinDisplayName(boardId: string, pin: number): string {
  const board = sketchBoardFor(boardId)
  const named = Object.entries(board.nameAliases ?? {}).find(([name, value]) => value === pin && /^P[A-C]\d+$/.test(name))?.[0]
  if (boardId === 'stm32-blue-pill-f103') return named ?? `#${pin}`
  const analog = Object.entries(board.analogAliases).find(([, value]) => value === pin)?.[0]
  if (boardId.startsWith('arduino') || boardId === 'stm32-nucleo-f401re') return analog ?? `D${pin}${named ? ` · ${named}` : ''}`
  if (boardId === 'raspberry-pi-pico') return `GP${pin}`
  return `GPIO ${pin}`
}

/** Tên chân để chèn vào code C++ mẫu. */
export function pinCodeName(boardId: string, pin: number): string {
  const board = sketchBoardFor(boardId)
  if (boardId === 'stm32-blue-pill-f103') return Object.entries(board.nameAliases ?? {}).find(([name, value]) => value === pin && /^P[A-C]\d+$/.test(name))?.[0] ?? String(pin)
  return Object.entries(board.analogAliases).find(([, value]) => value === pin)?.[0] ?? String(pin)
}

export function availablePins(boardId: string): number[] {
  return [...sketchBoardFor(boardId).pins]
}

// ---------------- Tài liệu mạch ----------------

export function createEmptyFreestyleDoc(): CircuitDocV2 {
  return {
    schema: 2,
    lessonId: 'freestyle',
    breadboards: [{ id: 'bb1', spec: '400-30', railSplit: false }],
    parts: [{ id: 'board', type: 'board', mount: { kind: 'bench', lane: 'left', order: 0 } }],
    wires: [],
    expect: { partCount: 1, wireCount: 0, netCount: 0 },
  }
}

function withExpect(doc: CircuitDocV2): CircuitDocV2 {
  const netCount = createNetIndexV2(doc).netsList().filter(net => net.endpoints.size > 1 || net.wireIds.size > 0).length
  return { ...doc, expect: { ...doc.expect, partCount: doc.parts.length, wireCount: doc.wires.length, netCount } }
}

export function nextId(doc: CircuitDocV2, base: string): string {
  const used = new Set([...doc.parts.map(part => part.id), ...doc.wires.map(wire => wire.id)])
  for (let index = 1; ; index += 1) if (!used.has(`${base}${index}`)) return `${base}${index}`
}

export function isBreadboardPart(type: string): boolean {
  return resolvePartGeometry(type, 'freestyle')?.mount === 'breadboard'
}

/** Linh kiện đặt được lên bàn: có trong registry, không phải board/breadboard. */
export const placeableParts = componentRegistry.filter(part => part.id !== 'board' && part.id !== 'breadboard')

/** Đặt linh kiện ở lỗ chỉ định (nếu có) hoặc tự tìm vị trí trống đầu tiên hợp lệ. */
export function placePart(doc: CircuitDocV2, type: string, at?: { col: number; row: number }): { doc: CircuitDocV2; partId?: string; error?: string } {
  if (!componentRegistry.some(part => part.id === type)) return { doc, error: `Không có linh kiện “${type}”.` }
  if (isBreadboardPart(type) && !doc.breadboards.length) return { doc, error: 'Thêm breadboard trước để cắm linh kiện này.' }
  const id = nextId(doc, type.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'part')
  if (!isBreadboardPart(type)) {
    const order = doc.parts.filter(part => part.mount.kind === 'bench' && part.mount.lane === 'right').length
    const part: CircuitPartV2 = { id, type, mount: { kind: 'bench', lane: 'right', order } }
    return { doc: withExpect({ ...doc, parts: [...doc.parts, part] }), partId: id }
  }
  const candidates: Array<{ col: number; row: number; rotation: 0 | 90 | 180 | 270 }> = []
  if (at) for (const rotation of [0, 90] as const) candidates.push({ col: at.col, row: at.row, rotation })
  else for (const row of [2, 7, 0, 5]) for (let col = 3; col <= 28; col += 1) candidates.push({ col, row, rotation: 0 })
  for (const candidate of candidates) {
    const part: CircuitPartV2 = { id, type, mount: { kind: 'breadboard', board: 'bb1', ...candidate } }
    const result = canMount(part, part.mount, doc)
    if (result.ok && (at || (!touchesUsedStrip(doc, part) && !overlapsMountedFootprint(doc, part)))) {
      return { doc: withExpect({ ...doc, parts: [...doc.parts, part] }), partId: id }
    }
    if (at && !result.ok && candidate.rotation === 90) return { doc, error: result.reason }
  }
  return { doc, error: at ? 'Không cắm được ở lỗ này.' : 'Breadboard đã kín chỗ.' }
}

/** Tránh tự động đặt linh kiện chung dải 5 lỗ với linh kiện khác (dễ chập ngoài ý muốn). */
function touchesUsedStrip(doc: CircuitDocV2, part: CircuitPartV2): boolean {
  const used = new Set(doc.parts.flatMap(other => (footprintHoles(other) ?? []).map(hole => holeNet(hole))))
  return (footprintHoles(part) ?? []).some(hole => used.has(holeNet(hole)))
}

function footprintBounds(part: CircuitPartV2) {
  const holes = footprintHoles(part)
  if (!holes?.length) return
  const columns = holes.map(hole => hole.column)
  const rows = holes.map(hole => hole.row)
  return {
    minColumn: Math.min(...columns), maxColumn: Math.max(...columns),
    minRow: rows.reduce((a, b) => a < b ? a : b),
    maxRow: rows.reduce((a, b) => a > b ? a : b),
  }
}

/** Leave the space between a mounted part's legs clear when automatically placing a new part. */
function overlapsMountedFootprint(doc: CircuitDocV2, part: CircuitPartV2): boolean {
  const candidate = footprintBounds(part)
  if (!candidate) return false
  return doc.parts.some(other => {
    const current = footprintBounds(other)
    return current !== undefined
      && candidate.minColumn <= current.maxColumn && current.minColumn <= candidate.maxColumn
      && candidate.minRow <= current.maxRow && current.minRow <= candidate.maxRow
  })
}

export function movePart(doc: CircuitDocV2, partId: string, at: { col: number; row: number }): { doc: CircuitDocV2; error?: string } {
  const part = doc.parts.find(item => item.id === partId)
  if (!part || part.mount.kind !== 'breadboard') return { doc, error: 'Chỉ di chuyển được linh kiện cắm breadboard.' }
  const rest = { ...doc, parts: doc.parts.filter(item => item.id !== partId) }
  const moved: CircuitPartV2 = { ...part, mount: { ...part.mount, col: at.col, row: at.row } }
  const result = canMount(moved, moved.mount, rest)
  if (!result.ok) return { doc, error: result.reason }
  return { doc: { ...doc, parts: doc.parts.map(item => item.id === partId ? moved : item) } }
}

export function rotatePart(doc: CircuitDocV2, partId: string): { doc: CircuitDocV2; error?: string } {
  const part = doc.parts.find(item => item.id === partId)
  if (!part || part.mount.kind !== 'breadboard') return { doc, error: 'Chỉ xoay được linh kiện cắm breadboard.' }
  const rest = { ...doc, parts: doc.parts.filter(item => item.id !== partId) }
  const rotation = ((part.mount.rotation + 180) % 360) as 0 | 180
  const rotated: CircuitPartV2 = { ...part, mount: { ...part.mount, rotation } }
  const result = canMount(rotated, rotated.mount, rest)
  if (!result.ok) return { doc, error: result.reason }
  return { doc: { ...doc, parts: doc.parts.map(item => item.id === partId ? rotated : item) } }
}

export function removePartAndWires(doc: CircuitDocV2, partId: string): CircuitDocV2 {
  if (partId === 'board') return doc
  return withExpect({
    ...doc,
    parts: doc.parts.filter(part => part.id !== partId),
    wires: doc.wires.filter(wire => !(wire.from.kind === 'pin' && wire.from.partId === partId) && !(wire.to.kind === 'pin' && wire.to.partId === partId)),
  })
}

export function addFreestyleWire(doc: CircuitDocV2, from: CircuitEndpointV2, to: CircuitEndpointV2, role: 'power' | 'ground' | 'signal' = 'signal'): CircuitDocV2 {
  return withExpect({ ...doc, wires: [...doc.wires, { id: nextId(doc, 'w'), from, to, role }] })
}

/** Lỗ trống khác cùng dải 5 lỗ với chân linh kiện (để cắm dây như trên breadboard thật). */
function stripHoleFor(doc: CircuitDocV2, partId: string, pinId: string): CircuitEndpointV2 {
  const part = doc.parts.find(item => item.id === partId)
  const holes = part ? footprintHoles(part) : null
  const legs = part ? resolvePartGeometry(part.type, 'freestyle')?.legsMm ?? [] : []
  const index = legs.findIndex(leg => leg.pinId === pinId)
  const hole = holes?.[index] as GridHole | undefined
  if (!hole) return { kind: 'pin', partId, pinId }
  const used = occupancy(doc, 'freestyle')
  const rows = 'abcde'.includes(hole.row) ? 'abcde' : 'fghij'
  for (const row of [...rows].reverse()) {
    const id = formatHole({ ...hole, row })
    if (id && !used[id]?.legs.length && !used[id]?.wireEndpoints.length) return { kind: 'hole', holeId: id }
  }
  return { kind: 'pin', partId, pinId }
}

type Spec = { part: string; pin: string } | { rail: 'T+' | 'T-' | 'B+' | 'B-' }
function endpointFor(doc: CircuitDocV2, spec: Spec): CircuitEndpointV2 {
  if ('rail' in spec) {
    const used = occupancy(doc, 'freestyle')
    for (let hole = 1; hole <= 25; hole += 1) { const id = `bb1:${spec.rail}:${hole}`; if (!used[id]?.wireEndpoints.length) return { kind: 'hole', holeId: id } }
    return { kind: 'hole', holeId: `bb1:${spec.rail}:1` }
  }
  return stripHoleFor(doc, spec.part, spec.pin)
}
function link(doc: CircuitDocV2, a: Spec, b: Spec, role: 'power' | 'ground' | 'signal' = 'signal'): CircuitDocV2 {
  const from = endpointFor(doc, a)
  const reserved = addFreestyleWire(doc, from, from, role) // giữ chỗ để lỗ đích không trùng lỗ nguồn
  const to = endpointFor(reserved, b)
  return addFreestyleWire(doc, from, to, role)
}
function place(doc: CircuitDocV2, type: string, col: number, row: number): { doc: CircuitDocV2; id: string } {
  const result = placePart(doc, type, { col, row })
  if (!result.partId) throw new Error(`Mạch mẫu không đặt được ${type}: ${result.error}`)
  return { doc: result.doc, id: result.partId }
}

// ---------------- Mạch mẫu ----------------

export function buildSampleCircuit(sampleId: FreestyleSampleId, boardId: string): { doc: CircuitDocV2; pinMap: PinMap } {
  const board = getFreestyleBoard(boardId)
  const pinMap: PinMap = { ...board.defaultPins }
  if (sampleId === 'pot-dimmer' || sampleId === 'night-light') Object.assign(pinMap, analogDimmerPins(boardId))
  let doc = createEmptyFreestyleDoc()
  doc = link(doc, { part: 'board', pin: 'gnd' }, { rail: 'B-' }, 'ground')
  const connect = (from: Spec, to: Spec, role?: 'power' | 'ground' | 'signal') => { doc = link(doc, from, to, role) }
  const at = (type: string, col: number, row = 2) => {
    const result = place(doc, type, col, row)
    doc = result.doc
    return result.id
  }
  const bench = (type: string) => {
    const result = placePart(doc, type)
    if (!result.partId) throw new Error(`Không đặt được ${type} trong mạch mẫu.`)
    doc = result.doc
    return result.partId
  }
  const resistor = (col: number, row: number, ohm: number) => {
    const id = at('resistor', col, row)
    doc = { ...doc, parts: doc.parts.map(part => part.id === id ? { ...part, value: { ohm } } : part) }
    return id
  }
  const led = (resistorCol: number, ledCol: number, source: Spec = { part: 'board', pin: 'ledOut' }, row = 2) => {
    const r = at('resistor', resistorCol, row), l = at('led', ledCol, row)
    connect(source, { part: r, pin: 'a' })
    connect({ part: r, pin: 'b' }, { part: l, pin: 'anode' })
    connect({ part: l, pin: 'cathode' }, { rail: 'B-' }, 'ground')
  }
  if (sampleId === 'blink') led(4, 12)
  if (sampleId === 'button-led') {
    led(4, 12)
    const b = placePart(doc, 'button'); doc = b.doc
    doc = link(doc, { part: 'board', pin: 'input' }, { part: b.partId!, pin: 'contactA' })
    doc = link(doc, { part: b.partId!, pin: 'contactB' }, { rail: 'B-' }, 'ground')
  }
  if (sampleId === 'pot-dimmer') {
    led(4, 12)
    const p = place(doc, 'potentiometer', 20, 2); doc = p.doc
    doc = link(doc, { part: 'board', pin: 'vcc' }, { rail: 'B+' }, 'power')
    doc = link(doc, { part: p.id, pin: 'vcc' }, { rail: 'B+' }, 'power')
    doc = link(doc, { part: p.id, pin: 'gnd' }, { rail: 'B-' }, 'ground')
    doc = link(doc, { part: p.id, pin: 'wiper' }, { part: 'board', pin: 'input' })
  }
  if (sampleId === 'motor') {
    const r = place(doc, 'resistor', 4, 2); doc = r.doc
    const q = place(doc, 'transistor', 12, 2); doc = q.doc
    const m = placePart(doc, 'dc-motor'); doc = m.doc
    const supply = placePart(doc, 'battery'); doc = supply.doc
    const flyback = place(doc, 'diode', 20, 2); doc = flyback.doc
    doc = link(doc, { part: 'board', pin: 'ledOut' }, { part: r.id, pin: 'a' })
    doc = link(doc, { part: r.id, pin: 'b' }, { part: q.id, pin: 'base' })
    doc = link(doc, { part: q.id, pin: 'emitter' }, { rail: 'B-' }, 'ground')
    doc = link(doc, { part: q.id, pin: 'collector' }, { part: m.partId!, pin: 'negative' })
    // An independent ideal load supply is explicit; missing board artwork must
    // never decide where a motor gets its power. No real voltage/current rating
    // is inferred by this educational state model.
    doc = link(doc, { part: supply.partId!, pin: 'positive' }, { part: m.partId!, pin: 'positive' }, 'power')
    doc = link(doc, { part: supply.partId!, pin: 'negative' }, { rail: 'B-' }, 'ground')
    doc = link(doc, { part: flyback.id, pin: 'cathode' }, { part: m.partId!, pin: 'positive' }, 'power')
    doc = link(doc, { part: flyback.id, pin: 'anode' }, { part: m.partId!, pin: 'negative' })
  }
  if (sampleId === 'dual-led') {
    led(4, 12)
    led(19, 26, { part: 'board', pin: 'trig' }, 7)
  }
  if (sampleId === 'keypad-five') {
    led(4, 12)
    const keypad = bench('keypad-4x4')
    connect({ rail: 'B-' }, { part: keypad, pin: 'r2' }, 'ground')
    connect({ part: keypad, pin: 'c2' }, { part: 'board', pin: 'input' })
  }
  if (sampleId === 'night-light') {
    led(4, 12)
    const ldr = at('ldr', 19), pull = resistor(22, 7, 10_000)
    connect({ part: 'board', pin: 'vcc' }, { part: ldr, pin: 'a' }, 'power')
    connect({ part: ldr, pin: 'b' }, { part: pull, pin: 'a' })
    connect({ part: pull, pin: 'a' }, { part: 'board', pin: 'input' })
    connect({ part: pull, pin: 'b' }, { rail: 'B-' }, 'ground')
  }
  if (sampleId === 'dht-demo') {
    const dht = bench('dht22-bare'), pull = resistor(9, 2, 4700)
    connect({ part: 'board', pin: 'vcc' }, { rail: 'B+' }, 'power')
    connect({ rail: 'B+' }, { part: dht, pin: 'vcc' }, 'power')
    connect({ rail: 'B+' }, { part: pull, pin: 'a' }, 'power')
    connect({ part: dht, pin: 'gnd' }, { rail: 'B-' }, 'ground')
    connect({ part: dht, pin: 'data' }, { part: pull, pin: 'b' })
    connect({ part: pull, pin: 'b' }, { part: 'board', pin: 'input' })
  }
  if (sampleId === 'ultrasonic') {
    const sonar = at('ultrasonic', 7)
    if (board.logic === '5 V') connect({ part: 'board', pin: 'vcc' }, { part: sonar, pin: 'vcc' }, 'power')
    else {
      const supply = bench('battery')
      doc = { ...doc, parts: doc.parts.map(part => part.id === supply ? { ...part, value: { label: 'Nguồn 5 V lý tưởng' } } : part) }
      connect({ part: supply, pin: 'negative' }, { rail: 'B-' }, 'ground')
      connect({ part: supply, pin: 'positive' }, { part: sonar, pin: 'vcc' }, 'power')
    }
    connect({ rail: 'B-' }, { part: sonar, pin: 'gnd' }, 'ground')
    connect({ part: 'board', pin: 'trig' }, { part: sonar, pin: 'trig' })
    if (board.logic === '5 V') connect({ part: sonar, pin: 'echo' }, { part: 'board', pin: 'echo' })
    else {
      const top = resistor(16, 7, 2200), bottom = resistor(23, 7, 3300)
      connect({ part: sonar, pin: 'echo' }, { part: top, pin: 'a' })
      connect({ part: top, pin: 'b' }, { part: bottom, pin: 'a' })
      connect({ part: bottom, pin: 'a' }, { part: 'board', pin: 'echo' })
      connect({ part: bottom, pin: 'b' }, { rail: 'B-' }, 'ground')
    }
  }
  if (sampleId === 'seg-display') {
    const display = at('seven-segment', 12, 7)
    connect({ part: display, pin: 'com1' }, { rail: 'B-' }, 'ground')
    connect({ part: display, pin: 'com2' }, { rail: 'B-' }, 'ground')
    for (const [i, segment] of ['a', 'b', 'c'].entries()) {
      const r = resistor([3, 19, 25][i], 8, 330)
      connect({ part: 'board', pin: `seg${i}` }, { part: r, pin: 'a' })
      connect({ part: r, pin: 'b' }, { part: display, pin: segment })
    }
  }
  if (sampleId === 'servo-pulse' || sampleId === 'relay-led') {
    const supply = bench('battery')
    const output = bench(sampleId === 'servo-pulse' ? 'servo' : 'relay')
    connect({ part: supply, pin: 'negative' }, { rail: 'B-' }, 'ground')
    connect({ part: output, pin: 'gnd' }, { rail: 'B-' }, 'ground')
    connect({ part: supply, pin: 'positive' }, { part: output, pin: 'vcc' }, 'power')
    connect({ part: 'board', pin: 'ledOut' }, { part: output, pin: sampleId === 'servo-pulse' ? 'signal' : 'in' })
    if (sampleId === 'relay-led') {
      connect({ part: supply, pin: 'positive' }, { part: output, pin: 'com' }, 'power')
      led(4, 12, { part: output, pin: 'no' })
    }
  }
  return { doc: withExpect(doc), pinMap }
}

/** Topology disclosure only: never infers electrical ratings or rewrites drafts. */
export function getMotorProtection(doc: CircuitDocV2): { independentSupply: boolean; commonGround: boolean; flyback: boolean } {
  const motors = doc.parts.filter(part => part.type === 'dc-motor')
  if (motors.length !== 1) return { independentSupply: false, commonGround: false, flyback: false }
  const motor = motors[0], board = doc.parts.find(part => part.type === 'board')
  const index = createNetIndexV2(doc)
  const sameNet = (a: string, b: string) => {
    const key = index.netOf(a)?.key
    return Boolean(key && key === index.netOf(b)?.key)
  }
  const positive = `${motor.id}:positive`, negative = `${motor.id}:negative`
  const supply = doc.parts.find(part => part.type === 'battery' && sameNet(`${part.id}:positive`, positive)
    && (!board || !['vcc', 'v5'].some(pin => sameNet(`${board.id}:${pin}`, positive))))
  return {
    independentSupply: Boolean(supply),
    commonGround: Boolean(supply && board && sameNet(`${supply.id}:negative`, `${board.id}:gnd`)),
    flyback: !sameNet(positive, negative) && doc.parts.some(part => part.type === 'diode' && sameNet(`${part.id}:anode`, negative) && sameNet(`${part.id}:cathode`, positive)),
  }
}

/** Chân có PWM + ADC cho mẫu biến trở. */
function analogDimmerPins(boardId: string): Partial<PinMap> {
  switch (boardId) {
    case 'arduino-uno-r3': case 'arduino-nano': return { ledOut: 9, input: 14 }
    case 'stm32-nucleo-f401re': return { ledOut: 9, input: 16 }
    case 'arduino-mega-2560': return { ledOut: 9, input: 54 }
    case 'raspberry-pi-pico': return { ledOut: 15, input: 26 }
    case 'esp32-devkit': return { ledOut: 23, input: 34 }
    case 'esp32-s3-devkitc-1': return { ledOut: 4, input: 5 }
    case 'stm32-blue-pill-f103': return { ledOut: 8, input: 0 }
    default: return {}
  }
}

export function sampleCode(sampleId: FreestyleSampleId, boardId: string, language: FreestyleLanguage, pinMap: PinMap): string {
  const out = language === 'micropython' ? String(pinMap.ledOut) : pinCodeName(boardId, pinMap.ledOut)
  const input = language === 'micropython' ? String(pinMap.input) : pinCodeName(boardId, pinMap.input)
  const adcMax = sketchBoardFor(boardId).adcBits === 12 ? 4095 : 1023
  if (language === 'micropython') {
    switch (sampleId) {
      case 'blink': return `from machine import Pin\nimport time\n\nled = Pin(${out}, Pin.OUT)\nprint("Bat dau nhay LED")\nwhile True:\n    led.value(1)\n    print("LED: BAT")\n    time.sleep(0.5)\n    led.value(0)\n    print("LED: TAT")\n    time.sleep(0.5)\n`
      case 'button-led': return `from machine import Pin\nimport time\n\nled = Pin(${out}, Pin.OUT)\nnut = Pin(${input}, Pin.IN, Pin.PULL_UP)\ntruoc = 1\nwhile True:\n    v = nut.value()\n    led.value(1 if v == 0 else 0)\n    if v != truoc:\n        print("Nhan" if v == 0 else "Nha")\n        truoc = v\n    time.sleep_ms(20)\n`
      case 'pot-dimmer': return `from machine import Pin, PWM, ADC\nimport time\n\nled = PWM(Pin(${out}))\nled.freq(1000)\nbien_tro = ADC(${input})\nwhile True:\n    gia_tri = bien_tro.read_u16()\n    led.duty_u16(gia_tri)\n    print("ADC", gia_tri >> 4)\n    time.sleep(0.2)\n`
      case 'motor': return `from machine import Pin\nimport time\n\nmotor = Pin(${out}, Pin.OUT)\nwhile True:\n    motor.value(1)\n    print("Motor: CHAY")\n    time.sleep(2)\n    motor.value(0)\n    print("Motor: DUNG")\n    time.sleep(1)\n`
      case 'dual-led': return `from machine import Pin\nimport time\n\na = Pin(${out}, Pin.OUT)\nb = Pin(${pinMap.trig}, Pin.OUT)\nwhile True:\n    a.on()\n    b.off()\n    time.sleep_ms(300)\n    a.off()\n    b.on()\n    time.sleep_ms(600)\n`
      case 'keypad-five': return `from machine import Pin\nimport time\n\ncol2 = Pin(${input}, Pin.IN, Pin.PULL_UP)\nled = Pin(${out}, Pin.OUT)\nwhile True:\n    led.value(1 if col2.value() == 0 else 0)\n    time.sleep_ms(20)\n`
      case 'night-light': return `from machine import ADC, Pin\nimport time\n\nldr = ADC(Pin(${input}))\nled = Pin(${out}, Pin.OUT)\nwhile True:\n    sample = ldr.read_u16()\n    led.value(1 if sample < 22937 else 0)\n    print(sample)\n    time.sleep_ms(100)\n`
      case 'dht-demo': return `from machine import Pin\nimport dht\nimport time\n\nsensor = dht.DHT22(Pin(${input}))\nwhile True:\n    try:\n        sensor.measure()\n        print(sensor.temperature(), "C", sensor.humidity(), "%RH")\n    except OSError:\n        print("Khong doc duoc DHT22")\n    time.sleep_ms(2500)\n`
      case 'ultrasonic': return `from machine import Pin, time_pulse_us\nimport time\n\ntrig = Pin(${pinMap.trig}, Pin.OUT, value=0)\necho_pin = Pin(${pinMap.echo}, Pin.IN)\nwhile True:\n    trig.on()\n    time.sleep_us(10)\n    trig.off()\n    echo = time_pulse_us(echo_pin, 1, 30000)\n    if echo > 0:\n        print(echo / 58)\n    time.sleep_ms(100)\n`
      case 'seg-display': return `from machine import Pin\nimport time\n\nsegments = [Pin(gpio, Pin.OUT, value=1) for gpio in (${pinMap.seg0}, ${pinMap.seg1}, ${pinMap.seg2})]\nwhile True:\n    time.sleep_ms(1000)\n`
      case 'servo-pulse': return `from machine import Pin, PWM\nimport time\n\nservo = PWM(Pin(${out}), freq=50)\nservo.duty_ns(1500000)\nwhile True:\n    time.sleep_ms(1000)\n`
      case 'relay-led': return `from machine import Pin\nimport time\n\nrelay = Pin(${out}, Pin.OUT, value=0)\nwhile True:\n    relay.on()\n    time.sleep_ms(1200)\n    relay.off()\n    time.sleep_ms(800)\n`
    }
  }
  const serial = boardId.startsWith('esp32') ? 115200 : 9600
  const boardPin = (pin: SignalPin) => pinCodeName(boardId, pinMap[pin])
  switch (sampleId) {
    case 'blink': return `const int LED = ${out};   // chân GPIO LED trên bàn lắp mạch\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(${serial});\n  Serial.println("Bat dau nhay LED");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  Serial.println("LED: BAT");\n  delay(500);\n  digitalWrite(LED, LOW);\n  Serial.println("LED: TAT");\n  delay(500);\n}\n`
    case 'button-led': return `const int LED = ${out};\nconst int NUT = ${input};   // nút nối xuống GND\nint truoc = HIGH;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  pinMode(NUT, INPUT_PULLUP);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  int trangThai = digitalRead(NUT);\n  digitalWrite(LED, trangThai == LOW ? HIGH : LOW);\n  if (trangThai != truoc) {\n    Serial.println(trangThai == LOW ? "Nhan" : "Nha");\n    truoc = trangThai;\n  }\n  delay(20);\n}\n`
    case 'pot-dimmer': return `const int LED = ${out};      // chân có PWM\nconst int BIEN_TRO = ${input};\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  int giaTri = analogRead(BIEN_TRO);          // 0..${adcMax}\n  analogWrite(LED, map(giaTri, 0, ${adcMax}, 0, 255));\n  Serial.print("ADC ");\n  Serial.println(giaTri);\n  delay(200);\n}\n`
    case 'motor': return `const int MOTOR = ${out};   // qua điện trở vào cực B của transistor\n\nvoid setup() {\n  pinMode(MOTOR, OUTPUT);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  digitalWrite(MOTOR, HIGH);\n  Serial.println("Motor: CHAY");\n  delay(2000);\n  digitalWrite(MOTOR, LOW);\n  Serial.println("Motor: DUNG");\n  delay(1000);\n}\n`
    case 'dual-led': return `const int A = ${out};\nconst int B = ${boardPin('trig')};\nvoid setup() { pinMode(A, OUTPUT); pinMode(B, OUTPUT); }\nvoid loop() {\n  digitalWrite(A, HIGH); digitalWrite(B, LOW); delay(300);\n  digitalWrite(A, LOW); digitalWrite(B, HIGH); delay(600);\n}\n`
    case 'keypad-five': return `const int COL2 = ${input};\nconst int LED = ${out};\nvoid setup() { pinMode(COL2, INPUT_PULLUP); pinMode(LED, OUTPUT); }\nvoid loop() {\n  digitalWrite(LED, digitalRead(COL2) == LOW ? HIGH : LOW);\n  delay(20);\n}\n`
    case 'night-light': return `const int LDR = ${input};\nconst int LED = ${out};\nvoid setup() { pinMode(LED, OUTPUT); Serial.begin(${serial}); }\nvoid loop() {\n  int sample = analogRead(LDR);\n  digitalWrite(LED, sample < ${Math.round(adcMax * 0.35)} ? HIGH : LOW);\n  Serial.println(sample);\n  delay(100);\n}\n`
    case 'dht-demo': return `// Vi du doc cam bien that can Arduino DHT sensor library (Adafruit).\n#include <DHT.h>\nDHT sensor(${input}, DHT22);\nvoid setup() { Serial.begin(${serial}); sensor.begin(); }\nvoid loop() {\n  Serial.print(sensor.readTemperature());\n  Serial.print(" C, ");\n  Serial.print(sensor.readHumidity());\n  Serial.println(" %RH");\n  delay(2500);\n}\n`
    case 'ultrasonic': return `const int TRIG = ${boardPin('trig')};\nconst int ECHO = ${boardPin('echo')};\nvoid setup() { pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT); Serial.begin(${serial}); }\nvoid loop() {\n  digitalWrite(TRIG, LOW); delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);\n  unsigned long echo = pulseIn(ECHO, HIGH, 30000);\n  if (echo > 0) Serial.println(echo / 58.0);\n  delay(100);\n}\n`
    case 'seg-display': return `const int A = ${boardPin('seg0')}, B = ${boardPin('seg1')}, C = ${boardPin('seg2')};\nvoid setup() {\n  pinMode(A, OUTPUT); pinMode(B, OUTPUT); pinMode(C, OUTPUT);\n  digitalWrite(A, HIGH); digitalWrite(B, HIGH); digitalWrite(C, HIGH);\n}\nvoid loop() { delay(1000); }\n`
    case 'servo-pulse': return `const int SERVO = ${out};\nvoid setup() { pinMode(SERVO, OUTPUT); }\nvoid loop() {\n  digitalWrite(SERVO, HIGH); delayMicroseconds(1500);\n  digitalWrite(SERVO, LOW); delayMicroseconds(18500);\n}\n`
    case 'relay-led': return `const int RELAY = ${out};\nvoid setup() { pinMode(RELAY, OUTPUT); }\nvoid loop() {\n  digitalWrite(RELAY, HIGH); delay(1200);\n  digitalWrite(RELAY, LOW); delay(800);\n}\n`
  }
}

// ---------------- Đánh giá mạch (mô hình logic) ----------------

export type ControlState = Record<string, number | boolean>
export type NetLevel = { level: 'high' | 'low' | 'float' | 'divider'; strong: boolean; pwm?: number; rail?: 'vcc' | 'gnd' }
export type PartOutput =
  | { partId: string; kind: 'led'; on: boolean; brightness: number; missingResistor: boolean }
  | { partId: string; kind: 'rgb'; color: [number, number, number] }
  | { partId: string; kind: 'buzzer'; on: boolean; pwm?: number }
  | { partId: string; kind: 'motor'; direction: -1 | 0 | 1; speed: number }
  | { partId: string; kind: 'servo'; angle?: number }
  | { partId: string; kind: 'segments'; lit: string[] }
export type InputDrive = { pin: number; digital: boolean; analog: number; source: string }
export type CircuitEvaluation = {
  outputs: PartOutput[]
  inputs: InputDrive[]
  netLevels: Map<string, NetLevel>
  litPartIds: Set<string>
  activeWireIds: Set<string>
  warnings: string[]
}

type Edge = { a: string; b: string; strong: boolean }
type Source = { net: string; high: boolean; pwm?: number; rail?: 'vcc' | 'gnd' }

/** Linh kiện cảm biến/điều khiển cần thanh trượt hoặc nút trên bàn. */
export type ControlSpec = { partId: string; kind: 'press' | 'toggle' | 'slider' | 'keypad'; label: string }
export function controlsFor(doc: CircuitDocV2): ControlSpec[] {
  return doc.parts.flatMap((part): ControlSpec[] => {
    switch (part.type) {
      case 'button': return [{ partId: part.id, kind: 'press', label: `Giữ để nhấn ${part.id}` }]
      case 'keypad-4x4': return [{ partId: part.id, kind: 'keypad', label: `Phím của ${part.id}` }]
      case 'limit-switch': return [{ partId: part.id, kind: 'press', label: `Tì công tắc ${part.id}` }]
      case 'slide-switch': return [{ partId: part.id, kind: 'toggle', label: `Gạt ${part.id} sang A` }]
      case 'ir-sensor': return [{ partId: part.id, kind: 'toggle', label: `Có vật cản trước ${part.id}` }]
      case 'potentiometer': return [{ partId: part.id, kind: 'slider', label: `Vặn ${part.id}` }]
      case 'ldr': return [{ partId: part.id, kind: 'slider', label: `Ánh sáng chiếu ${part.id}` }]
      case 'thermistor': return [{ partId: part.id, kind: 'slider', label: `Nhiệt độ ${part.id}` }]
      default: return []
    }
  })
}

export function evaluateFreestyleCircuit(doc: CircuitDocV2, pinMap: PinMap, pinStates: Readonly<Record<number, LivePinState>> | undefined, controls: ControlState): CircuitEvaluation {
  const index = createNetIndexV2(doc)
  const net = (partId: string, pinId: string) => index.netOf(`${partId}:${pinId}`)?.key ?? `${partId}:${pinId}`
  const warnings: string[] = []
  const edges: Edge[] = []
  const sources: Source[] = []

  const board = doc.parts.find(part => part.type === 'board')
  if (board) {
    sources.push({ net: net(board.id, 'gnd'), high: false, rail: 'gnd' })
    sources.push({ net: net(board.id, 'vcc'), high: true, rail: 'vcc' })
    sources.push({ net: net(board.id, 'v5'), high: true, rail: 'vcc' })
    for (const signal of SIGNAL_PINS) {
      const state = pinStates?.[pinMap[signal]]
      if (state?.mode === 'output') sources.push({ net: net(board.id, signal), high: state.pwm !== undefined ? state.pwm > 0 : state.level, ...(state.pwm !== undefined ? { pwm: state.pwm } : {}) })
    }
  }
  const on = (id: string) => Boolean(controls[id])
  for (const part of doc.parts) {
    const n = (pin: string) => net(part.id, pin)
    switch (part.type) {
      case 'resistor': case 'ldr': case 'thermistor': edges.push({ a: n('a'), b: n('b'), strong: false }); break
      case 'potentiometer': edges.push({ a: n('vcc'), b: n('wiper'), strong: false }, { a: n('wiper'), b: n('gnd'), strong: false }); break
      case 'button': if (on(part.id)) edges.push({ a: n('contactA'), b: n('contactB'), strong: true }); break
      case 'keypad-4x4': {
        const key = controls[part.id]
        const contact = typeof key === 'number' ? keypadContact(key) : null
        if (contact) edges.push({ a: n(contact.row), b: n(contact.column), strong: true })
        break
      }
      case 'limit-switch': edges.push({ a: n('com'), b: n(on(part.id) ? 'no' : 'nc'), strong: true }); break
      case 'slide-switch': edges.push({ a: n('common'), b: n(on(part.id) ? 'a' : 'b'), strong: true }); break
      case 'battery': sources.push({ net: n('positive'), high: true, rail: 'vcc' }, { net: n('negative'), high: false, rail: 'gnd' }); break
      case 'ir-sensor': sources.push({ net: n('out'), high: !on(part.id) }); break // module IR thường xuất LOW khi có vật cản
      default: break
    }
  }

  // Lan truyền mức: lặp vài lần để transistor/MOSFET/relay đóng theo mức cực điều khiển.
  let levels = new Map<string, NetLevel>()
  const switchParts = doc.parts.filter(part => ['transistor', 'mosfet', 'relay'].includes(part.type))
  for (let pass = 0; pass < 3; pass += 1) {
    const dynamic: Edge[] = []
    for (const part of switchParts) {
      const n = (pin: string) => net(part.id, pin)
      const control = levels.get(part.type === 'transistor' ? n('base') : part.type === 'mosfet' ? n('gate') : n('in'))
      const closed = control?.level === 'high'
      if (part.type === 'transistor' && closed) dynamic.push({ a: n('collector'), b: n('emitter'), strong: true })
      if (part.type === 'mosfet' && closed) dynamic.push({ a: n('drain'), b: n('source'), strong: true })
      if (part.type === 'relay') dynamic.push({ a: n('com'), b: n(closed ? 'no' : 'nc'), strong: true })
    }
    levels = propagate([...edges, ...dynamic], sources)
  }
  const level = (key: string): NetLevel => levels.get(key) ?? { level: 'float', strong: false }

  const outputs: PartOutput[] = []
  const litPartIds = new Set<string>()
  for (const part of doc.parts) {
    const n = (pin: string) => net(part.id, pin)
    if (part.type === 'led') {
      const anode = level(n('anode')), cathode = level(n('cathode'))
      const lit = anode.level === 'high' && cathode.level === 'low'
      const missingResistor = lit && anode.strong && cathode.strong
      if (missingResistor) warnings.push(`${part.id}: LED nối thẳng giữa nguồn và GND, thiếu điện trở hạn dòng — mạch thật có thể hỏng LED hoặc chân GPIO.`)
      if (lit) litPartIds.add(part.id)
      outputs.push({ partId: part.id, kind: 'led', on: lit, brightness: lit ? anode.pwm ?? 1 : 0, missingResistor })
    } else if (part.type === 'rgb-led') {
      const common = level(n('common'))
      const channel = (pin: string) => { const value = level(n(pin)); return common.level === 'low' && value.level === 'high' ? value.pwm ?? 1 : 0 }
      const color: [number, number, number] = [channel('red'), channel('green'), channel('blue')]
      if (color.some(Boolean)) litPartIds.add(part.id)
      outputs.push({ partId: part.id, kind: 'rgb', color })
    } else if (part.type === 'buzzer') {
      const signal = level(n('signal'))
      outputs.push({ partId: part.id, kind: 'buzzer', on: signal.level === 'high' && level(n('gnd')).level === 'low', ...(signal.pwm !== undefined ? { pwm: signal.pwm } : {}) })
    } else if (part.type === 'dc-motor') {
      const plus = level(n('positive')), minus = level(n('negative'))
      const direction = plus.level === 'high' && minus.level === 'low' ? 1 : plus.level === 'low' && minus.level === 'high' ? -1 : 0
      const speed = direction === 0 ? 0 : (direction === 1 ? plus.pwm : minus.pwm) ?? 1
      outputs.push({ partId: part.id, kind: 'motor', direction, speed })
    } else if (part.type === 'servo') {
      const signal = level(n('signal'))
      // Xung servo 50 Hz: 1–2 ms trên chu kỳ 20 ms ⇒ duty 5–10 %.
      const angle = signal.pwm !== undefined && signal.pwm >= 0.02 && signal.pwm <= 0.13 ? Math.round(Math.min(180, Math.max(0, (signal.pwm * 20 - 1) * 180))) : undefined
      outputs.push({ partId: part.id, kind: 'servo', ...(angle === undefined ? {} : { angle }) })
    } else if (part.type === 'seven-segment' || part.type === 'seven-segment-anode') {
      const anode = part.type === 'seven-segment-anode'
      const common = [level(n('com1')), level(n('com2'))].some(item => item.level === (anode ? 'high' : 'low'))
      outputs.push({ partId: part.id, kind: 'segments', lit: common ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].filter(seg => level(n(seg)).level === (anode ? 'low' : 'high')) : [] })
    } else if (['ultrasonic', 'oled', 'tb6612', 'h-bridge'].includes(part.type)) {
      warnings.push(`${part.id}: ${componentRegistry.find(item => item.id === part.type)?.label ?? part.type} chưa được mô phỏng trên bàn tự do; chỉ hiển thị dây nối.`)
    }
  }

  // Đầu vào cho firmware: mức của net nối với chân board đang là INPUT.
  const inputs: InputDrive[] = []
  if (board) {
    for (const signal of SIGNAL_PINS) {
      const pin = pinMap[signal]
      const state = pinStates?.[pin]
      if (state?.mode === 'output') continue
      const key = net(board.id, signal)
      const connected = index.netOf(key)
      if (!connected || connected.wireIds.size === 0) continue
      const value = level(key)
      const analogPart = doc.parts.find(part => ['potentiometer', 'ldr', 'thermistor'].includes(part.type) && [...connected.endpoints].some(endpoint => endpoint === `${part.id}:${part.type === 'potentiometer' ? 'wiper' : 'a'}` || endpoint === `${part.id}:b`))
      let analog = value.level === 'high' ? 1 : 0
      if (analogPart) {
        const ratio = typeof controls[analogPart.id] === 'number' ? Number(controls[analogPart.id]) : 0.5
        analog = analogPart.type === 'potentiometer' && (level(net(analogPart.id, 'vcc')).level !== 'high' || level(net(analogPart.id, 'gnd')).level !== 'low') ? 0 : ratio
      }
      const digital = analogPart ? analog >= 0.5 : value.level === 'high' || (value.level === 'float' && state?.mode === 'input_pullup')
      inputs.push({ pin, digital, analog, source: analogPart?.id ?? (value.level === 'float' ? 'hở mạch' : value.level) })
    }
  }

  const activeWireIds = new Set<string>()
  for (const wire of doc.wires) {
    const key = wire.from.kind === 'pin' ? net(wire.from.partId, wire.from.pinId) : index.netOf(wire.from.holeId)?.key
    const value = key ? levels.get(key) : undefined
    if (value?.level === 'high' && !value.rail) activeWireIds.add(wire.id)
  }
  return { outputs, inputs, netLevels: levels, litPartIds, activeWireIds, warnings: [...new Set(warnings)] }
}

function propagate(edges: Edge[], sources: Source[]): Map<string, NetLevel> {
  const adjacency = new Map<string, Edge[]>()
  for (const edge of edges) {
    if (edge.a === edge.b) continue
    for (const key of [edge.a, edge.b]) adjacency.set(key, [...(adjacency.get(key) ?? []), edge])
  }
  type Reached = { pwm?: number; rail?: 'vcc' | 'gnd' }
  const reach = (high: boolean, strongOnly: boolean) => {
    const seen = new Map<string, Reached>()
    const queue: string[] = []
    for (const source of sources.filter(item => item.high === high)) {
      seen.set(source.net, { ...(source.pwm !== undefined ? { pwm: source.pwm } : {}), ...(source.rail ? { rail: source.rail } : {}) })
      queue.push(source.net)
    }
    while (queue.length) {
      const current = queue.shift()!
      for (const edge of adjacency.get(current) ?? []) {
        if (strongOnly && !edge.strong) continue
        const next = edge.a === current ? edge.b : edge.a
        if (seen.has(next)) continue
        const from = seen.get(current)!
        seen.set(next, { ...(from.pwm !== undefined ? { pwm: from.pwm } : {}), ...(edge.strong && from.rail ? { rail: from.rail } : {}) })
        queue.push(next)
      }
    }
    return seen
  }
  const strongHigh = reach(true, true), strongLow = reach(false, true)
  const weakHigh = reach(true, false), weakLow = reach(false, false)
  const result = new Map<string, NetLevel>()
  for (const key of new Set([...weakHigh.keys(), ...weakLow.keys()])) {
    const sh = strongHigh.get(key), sl = strongLow.get(key)
    if (sh && !sl) result.set(key, { level: 'high', strong: true, ...sh })
    else if (sl && !sh) result.set(key, { level: 'low', strong: true, ...sl })
    else if (sh && sl) result.set(key, { level: 'divider', strong: true })
    else if (weakHigh.has(key) && !weakLow.has(key)) result.set(key, { level: 'high', strong: false, ...(weakHigh.get(key)?.pwm !== undefined ? { pwm: weakHigh.get(key)!.pwm } : {}) })
    else if (weakLow.has(key) && !weakHigh.has(key)) result.set(key, { level: 'low', strong: false })
    else result.set(key, { level: 'divider', strong: false })
  }
  return result
}

// ---------------- Lưu cục bộ ----------------

export const FREESTYLE_STORAGE_KEY = 'machmo-freestyle-v1'
export type FreestyleWorkspace = {
  version: 1
  boardId: string
  doc: CircuitDocV2
  pinMap: PinMap
  language: FreestyleLanguage
  code: string
  sampleId?: FreestyleSampleId
  updatedAt: string
  wireLayout?: FreestyleWireLayout
}

export function defaultFreestyleWorkspace(boardId = 'arduino-uno-r3', sampleId: FreestyleSampleId = 'blink'): FreestyleWorkspace {
  const board = getFreestyleBoard(boardId)
  const { doc, pinMap } = buildSampleCircuit(sampleId, board.id)
  const language = sampleLanguage(sampleId, board.languages[0])
  return { version: 1, boardId: board.id, doc, pinMap, language, code: sampleCode(sampleId, board.id, language, pinMap), sampleId, updatedAt: new Date(0).toISOString() }
}

/** A new bench is a choice, not an implicit Uno/Blink example. Version 1 drafts remain readable. */
export function blankFreestyleWorkspace(): FreestyleWorkspace {
  return { version: 1, boardId: '', doc: { schema: 2, lessonId: 'freestyle', breadboards: [], parts: [], wires: [], expect: { partCount: 0, wireCount: 0, netCount: 0 } }, pinMap: { ...freestyleBoards[2].defaultPins }, language: 'cpp', code: '', updatedAt: new Date(0).toISOString() }
}

/** Atomic board selection for both UI events and a combined board/part URL intent. */
export function workspaceWithFreestyleBoard(current: FreestyleWorkspace, nextId: string): FreestyleWorkspace {
  const next=getFreestyleBoard(nextId)
  const fromSample=current.sampleId && current.code===sampleCode(current.sampleId,current.boardId,current.language,current.pinMap)?current.sampleId:undefined
  const replacement=fromSample?buildSampleCircuit(fromSample,next.id):undefined
  const pinMap=replacement?.pinMap??{...next.defaultPins}
  const language=fromSample ? sampleLanguage(fromSample,next.languages[0]) : next.languages[0]
  const boardDoc=current.doc.parts.some(p=>p.type==='board')?current.doc:{...current.doc,parts:[...current.doc.parts,{id:'board',type:'board',mount:{kind:'bench' as const,lane:'left' as const,order:0}}],expect:{...current.doc.expect,partCount:current.doc.parts.length+1}}
  // A pristine sonar example changes the Echo divider when the board logic voltage changes.
  const pristineSonar=fromSample==='ultrasonic'&&!current.wireLayout && JSON.stringify(current.doc)===JSON.stringify(buildSampleCircuit(fromSample,current.boardId).doc)
  const doc=pristineSonar&&replacement?replacement.doc:boardDoc
  return {...current,boardId:next.id,doc,pinMap,language,sampleId:fromSample,...(fromSample?{code:sampleCode(fromSample,next.id,language,pinMap)}:{})}
}

/** Đọc workspace đã lưu; dữ liệu hỏng thì trả null (nơi gọi sao lưu bản hỏng). */
export function parseFreestyleWorkspace(raw: string | null): FreestyleWorkspace | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<FreestyleWorkspace>
    if (value?.version !== 1 || typeof value.boardId !== 'string' || typeof value.code !== 'string' || value.code.length > 64 * 1024) return null
    const doc = value.doc
    if (!doc || doc.schema !== 2 || !Array.isArray(doc.parts) || !Array.isArray(doc.wires) || !Array.isArray(doc.breadboards)) return null
    if (value.boardId && (!freestyleBoards.some(board => board.id === value.boardId) || !doc.parts.some(part => part?.type === 'board'))) return null
    if (!value.boardId && doc.parts.some(part => part?.type === 'board')) return null
    if (!doc.parts.every(part => typeof part?.id === 'string' && componentRegistry.some(item => item.id === part.type))) return null
    if (validateCircuitDoc({ ...doc, lessonId: 'freestyle' }).some(issue => issue.severity === 'error')) return null
    const board = getFreestyleBoard(value.boardId)
    const pinMap = { ...board.defaultPins }
    for (const signal of SIGNAL_PINS) if (Number.isInteger(value.pinMap?.[signal])) pinMap[signal] = Number(value.pinMap![signal])
    const language = board.languages.includes(value.language as FreestyleLanguage) ? value.language as FreestyleLanguage : board.languages[0]
    const wireLayout = readWireLayout(value.wireLayout, doc.wires)
    const sampleId = freestyleSamples.find(sample => sample.id === value.sampleId)?.id
    return { version: 1, boardId: value.boardId, doc: { ...doc, lessonId: 'freestyle' }, pinMap, language, code: value.code, ...(wireLayout ? { wireLayout } : {}), ...(sampleId ? { sampleId } : {}), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString() }
  } catch { return null }
}
