import { componentRegistry } from '../../data/componentRegistry'
import { createNetIndexV2 } from '../circuitNetsV2'
import { canMount, footprintHoles, occupancy, resolvePartGeometry } from '../mountResolve'
import { formatHole, holeNet, type GridHole } from '../breadboardGrid'
import { sketchBoards } from '../sketchInterpreter'
import type { CircuitDocV2, CircuitEndpointV2, CircuitPartV2 } from '../circuitDocV2'
import type { LivePinState } from '../avrLiveMachine'

/**
 * Bàn lắp mạch tự do (2026-11-14): board tự chọn, linh kiện tự đặt, dây tự nối, code tự viết.
 * Tài liệu mạch là CircuitDocV2 với lessonId "freestyle". Board dùng part "board" sẵn có; các chân tín hiệu
 * trừu tượng của part đó (ledOut, input, trig, echo, seg0–seg6) được gán số chân thật bằng `pinMap`.
 * Đánh giá mạch dưới đây là mô hình logic giáo dục (mức HIGH/LOW, có/không điện trở), KHÔNG phải mô phỏng điện.
 */

export type FreestyleEngine = 'avr' | 'micropython' | 'interpreter'
export type FreestyleLanguage = 'cpp' | 'micropython'
export type SignalPin = 'ledOut' | 'input' | 'trig' | 'echo' | 'seg0' | 'seg1' | 'seg2' | 'seg3' | 'seg4' | 'seg5' | 'seg6'
export const SIGNAL_PINS: readonly SignalPin[] = ['ledOut', 'input', 'trig', 'echo', 'seg0', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5', 'seg6']
export const SIGNAL_PIN_LABELS: Record<SignalPin, string> = { ledOut: 'GPIO LED', input: 'GPIO IN', trig: 'TRIG', echo: 'ECHO', seg0: 'Chân 2', seg1: 'Chân 3', seg2: 'Chân 4', seg3: 'Chân 5', seg4: 'Chân 6', seg5: 'Chân 7', seg6: 'Chân 8' }
export type PinMap = Record<SignalPin, number>

export type FreestyleBoard = {
  id: string
  name: string
  short: string
  logic: '5 V' | '3,3 V'
  /** Engine chạy code thật khi có dịch vụ cục bộ; nếu không có thì rơi về trình thông dịch. */
  realEngine?: 'avr' | 'micropython'
  languages: readonly FreestyleLanguage[]
  defaultPins: PinMap
  limitation: string
}

const pins = (ledOut: number, input: number, trig: number, echo: number, seg: number[]): PinMap => ({ ledOut, input, trig, echo, ...Object.fromEntries(seg.map((value, index) => [`seg${index}`, value])) } as PinMap)

export const freestyleBoards: readonly FreestyleBoard[] = [
  { id: 'esp32-devkit', name: 'ESP32 DevKit V1', short: 'ESP32', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(23, 34, 5, 18, [13, 14, 27, 26, 25, 33, 32]), limitation: 'Chưa có emulator ESP32 mở chạy được trong trình duyệt: code chạy bằng trình thông dịch Arduino C++ rút gọn, không có WiFi/BLE/I²C/SPI.' },
  { id: 'esp32-s3-devkitc-1', name: 'ESP32-S3-DevKitC-1', short: 'ESP32-S3', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(4, 5, 6, 7, [8, 9, 10, 11, 12, 13, 14]), limitation: 'Chạy bằng trình thông dịch Arduino C++ rút gọn; không có LED_BUILTIN đơn, không có WiFi/BLE/USB.' },
  { id: 'arduino-uno-r3', name: 'Arduino Uno R3', short: 'Uno', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Khi có dịch vụ cục bộ: biên dịch thật bằng arduino-cli và chạy firmware trên avr8js. Bản web tĩnh: trình thông dịch rút gọn.' },
  { id: 'arduino-nano', name: 'Arduino Nano classic', short: 'Nano', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Như Uno: arduino-cli + avr8js khi có dịch vụ cục bộ; A6/A7 chỉ đọc analog.' },
  { id: 'arduino-mega-2560', name: 'Arduino Mega 2560 R3', short: 'Mega', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [22, 23, 24, 25, 26, 27, 28]), limitation: 'arduino-cli + avr8js (ATmega2560) khi có dịch vụ cục bộ; A8–A15 chưa nối ADC trong mô phỏng.' },
  { id: 'raspberry-pi-pico', name: 'Raspberry Pi Pico', short: 'Pico', logic: '3,3 V', realEngine: 'micropython', languages: ['micropython', 'cpp'], defaultPins: pins(15, 14, 16, 17, [2, 3, 4, 5, 6, 7, 8]), limitation: 'MicroPython v1.29 chính thức chạy thật trên rp2040js khi có dịch vụ cục bộ (cần bootrom RP2040). Arduino C++ chạy bằng trình thông dịch rút gọn. Mô phỏng thường chậm hơn thời gian thực.' },
  { id: 'stm32-blue-pill-f103', name: 'STM32 Blue Pill (F103C8)', short: 'Blue Pill', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(5, 1, 22, 23, [24, 25, 26, 27, 28, 29, 30]), limitation: 'Chưa có emulator STM32 mở chạy được trong trình duyệt: code chạy bằng trình thông dịch Arduino C++ rút gọn. Viết chân bằng tên PA5, PB0…' },
  { id: 'stm32-nucleo-f401re', name: 'STM32 Nucleo-F401RE', short: 'Nucleo', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Chạy bằng trình thông dịch Arduino C++ rút gọn; số chân theo header Arduino D0–D15, A0–A5.' },
]

export function getFreestyleBoard(id: string): FreestyleBoard {
  return freestyleBoards.find(board => board.id === id) ?? freestyleBoards[2]
}

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

const withExpect = (doc: CircuitDocV2): CircuitDocV2 => ({ ...doc, expect: { ...doc.expect, partCount: doc.parts.length, wireCount: doc.wires.length } })

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
    if (result.ok && (at || !touchesUsedStrip(doc, part))) return { doc: withExpect({ ...doc, parts: [...doc.parts, part] }), partId: id }
    if (at && !result.ok && candidate.rotation === 90) return { doc, error: result.reason }
  }
  return { doc, error: at ? 'Không cắm được ở lỗ này.' : 'Breadboard đã kín chỗ.' }
}

/** Tránh tự động đặt linh kiện chung dải 5 lỗ với linh kiện khác (dễ chập ngoài ý muốn). */
function touchesUsedStrip(doc: CircuitDocV2, part: CircuitPartV2): boolean {
  const used = new Set(doc.parts.flatMap(other => (footprintHoles(other) ?? []).map(hole => holeNet(hole))))
  return (footprintHoles(part) ?? []).some(hole => used.has(holeNet(hole)))
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

export type FreestyleSampleId = 'blink' | 'button-led' | 'pot-dimmer' | 'motor'
export type FreestyleSample = { id: FreestyleSampleId; title: string; summary: string }
export const freestyleSamples: readonly FreestyleSample[] = [
  { id: 'blink', title: 'Nháy LED', summary: 'LED + điện trở 220 Ω nối chân GPIO LED, nháy mỗi 0,5 s.' },
  { id: 'button-led', title: 'Nút nhấn bật LED', summary: 'Nút nối GPIO IN xuống GND (INPUT_PULLUP); giữ nút thì LED sáng.' },
  { id: 'pot-dimmer', title: 'Biến trở chỉnh độ sáng', summary: 'Biến trở đưa điện áp vào chân analog; LED đổi độ sáng bằng PWM.' },
  { id: 'motor', title: 'Động cơ DC qua transistor', summary: 'GPIO → điện trở → transistor NPN đóng/ngắt động cơ, chạy 2 s, nghỉ 1 s.' },
]

export function buildSampleCircuit(sampleId: FreestyleSampleId, boardId: string): { doc: CircuitDocV2; pinMap: PinMap } {
  const board = getFreestyleBoard(boardId)
  const pinMap: PinMap = { ...board.defaultPins }
  if (sampleId === 'pot-dimmer') Object.assign(pinMap, analogDimmerPins(boardId))
  let doc = createEmptyFreestyleDoc()
  doc = link(doc, { part: 'board', pin: 'gnd' }, { rail: 'B-' }, 'ground')
  const led = (resistorCol: number, ledCol: number) => {
    const r = place(doc, 'resistor', resistorCol, 2); doc = r.doc
    const l = place(doc, 'led', ledCol, 2); doc = l.doc
    doc = link(doc, { part: 'board', pin: 'ledOut' }, { part: r.id, pin: 'a' })
    doc = link(doc, { part: r.id, pin: 'b' }, { part: l.id, pin: 'anode' })
    doc = link(doc, { part: l.id, pin: 'cathode' }, { rail: 'B-' }, 'ground')
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
    }
  }
  const serial = boardId.startsWith('esp32') ? 115200 : 9600
  switch (sampleId) {
    case 'blink': return `const int LED = ${out};   // chân GPIO LED trên bàn lắp mạch\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(${serial});\n  Serial.println("Bat dau nhay LED");\n}\n\nvoid loop() {\n  digitalWrite(LED, HIGH);\n  Serial.println("LED: BAT");\n  delay(500);\n  digitalWrite(LED, LOW);\n  Serial.println("LED: TAT");\n  delay(500);\n}\n`
    case 'button-led': return `const int LED = ${out};\nconst int NUT = ${input};   // nút nối xuống GND\nint truoc = HIGH;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  pinMode(NUT, INPUT_PULLUP);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  int trangThai = digitalRead(NUT);\n  digitalWrite(LED, trangThai == LOW ? HIGH : LOW);\n  if (trangThai != truoc) {\n    Serial.println(trangThai == LOW ? "Nhan" : "Nha");\n    truoc = trangThai;\n  }\n  delay(20);\n}\n`
    case 'pot-dimmer': return `const int LED = ${out};      // chân có PWM\nconst int BIEN_TRO = ${input};\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  int giaTri = analogRead(BIEN_TRO);          // 0..${adcMax}\n  analogWrite(LED, map(giaTri, 0, ${adcMax}, 0, 255));\n  Serial.print("ADC ");\n  Serial.println(giaTri);\n  delay(200);\n}\n`
    case 'motor': return `const int MOTOR = ${out};   // qua điện trở vào cực B của transistor\n\nvoid setup() {\n  pinMode(MOTOR, OUTPUT);\n  Serial.begin(${serial});\n}\n\nvoid loop() {\n  digitalWrite(MOTOR, HIGH);\n  Serial.println("Motor: CHAY");\n  delay(2000);\n  digitalWrite(MOTOR, LOW);\n  Serial.println("Motor: DUNG");\n  delay(1000);\n}\n`
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
export type ControlSpec = { partId: string; kind: 'press' | 'toggle' | 'slider'; label: string }
export function controlsFor(doc: CircuitDocV2): ControlSpec[] {
  return doc.parts.flatMap((part): ControlSpec[] => {
    switch (part.type) {
      case 'button': return [{ partId: part.id, kind: 'press', label: `Giữ để nhấn ${part.id}` }]
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
    } else if (part.type === 'seven-segment') {
      const common = [level(n('com1')), level(n('com2'))].some(item => item.level === 'low')
      outputs.push({ partId: part.id, kind: 'segments', lit: common ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].filter(seg => level(n(seg)).level === 'high') : [] })
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
}

export function defaultFreestyleWorkspace(boardId = 'arduino-uno-r3', sampleId: FreestyleSampleId = 'blink'): FreestyleWorkspace {
  const board = getFreestyleBoard(boardId)
  const { doc, pinMap } = buildSampleCircuit(sampleId, board.id)
  const language = board.languages[0]
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
  const pinMap=fromSample?buildSampleCircuit(fromSample,next.id).pinMap:{...next.defaultPins}
  const language=next.languages[0]
  const doc=current.doc.parts.some(p=>p.type==='board')?current.doc:{...current.doc,parts:[...current.doc.parts,{id:'board',type:'board',mount:{kind:'bench' as const,lane:'left' as const,order:0}}],expect:{...current.doc.expect,partCount:current.doc.parts.length+1}}
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
    const board = getFreestyleBoard(value.boardId)
    const pinMap = { ...board.defaultPins }
    for (const signal of SIGNAL_PINS) if (Number.isInteger(value.pinMap?.[signal])) pinMap[signal] = Number(value.pinMap![signal])
    const language = board.languages.includes(value.language as FreestyleLanguage) ? value.language as FreestyleLanguage : board.languages[0]
    return { version: 1, boardId: value.boardId, doc: { ...doc, lessonId: 'freestyle' }, pinMap, language, code: value.code, ...(value.sampleId ? { sampleId: value.sampleId } : {}), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString() }
  } catch { return null }
}
