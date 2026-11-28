import approval from '../../docs/research/2026-11-27-esp32-c3-electrical-firmware-a2-proposal.json'
import type { BoardPin } from '../components/board/boardSceneTypes'
import { getA3Board } from './freestyle/a3EspProfiles'
import { getA9Board } from './freestyle/a9Stm32Profiles'
import { getA10Board } from './freestyle/a10AvrRuntime'
import arduinoPads from '../data/arduino-header-pins.json'

type PinRole = 'signal' | 'ground' | 'voltage-reference' | 'power' | 'reserved' | 'nc' | 'absent'
type AuxPin = { label: string; number?: string; role: PinRole; anchor?: [number, number, number] }
export type AuxConnector = { id: string; title: string; pins: AuxPin[]; source: string; note: string }

function pinRole(label: string): PinRole {
  if (/vị trí bỏ pad/i.test(label)) return 'absent'
  if (/reserved/i.test(label)) return 'reserved'
  if (/^NC\b/i.test(label)) return 'nc'
  if (/^GND\b/i.test(label)) return 'ground'
  if (/^AREF\b|VDD_TARGET|reference output/i.test(label)) return 'voltage-reference'
  if (/^\+?(?:3V3|5V)\b/i.test(label)) return 'power'
  return 'signal'
}

function numbered(pads: Record<string, string>): AuxPin[] {
  return Object.entries(pads).map(([number, label]) => ({ number, label, role: pinRole(label) }))
}

function named(labels: string[]): AuxPin[] {
  return labels.map(label => ({ label, role: pinRole(label) }))
}

type Evidence = { boards: string[]; source: string }
type NumberedPads = Record<string, string>
// The approved configuration SHA fixes both the entries and their order.
const [st, pico, minima, wifi, every, adafruit] = approval.connectorAudit.additions as unknown as [
  Evidence & { pads: NumberedPads },
  Evidence & { jstSource: string; signalKeys: string[]; pico2hJstPads: NumberedPads },
  Evidence & { swdPads: NumberedPads; icspPads: NumberedPads },
  Evidence & { datasheet: string; signalKeys: { qwiic: string[] }; espHeaderPads: NumberedPads; icspPads: NumberedPads },
  Evidence & { pads: NumberedPads },
  { boards: string[]; sources: string[]; signalKeys: string[] },
]
const stAnchorZ = [-32.12, -29.58, -27.04, -24.5, -21.96, -19.42]
const stNote = 'CN2 nối sẵn hai jumper cho MCU trên board. Dùng CN4 cho target ngoài khi tháo hai jumper. Nếu dùng CN4.5 với target ngoài, tách SB12. VDD_TARGET là mức tham chiếu từ target. SB15 nối SWO với PB3 khi đóng.'

// PCB centers and pad numbers from the matching ABX00080/ABX00087 Altium imports.
// The shared outline center matches the existing GLB transform. Heights use the exact STEP connector bodies.
function arduinoContacts(pads: NumberedPads, xy: ReadonlyArray<readonly [number, number]>, topMm: number): AuxPin[] {
  return numbered(pads).map((pin, index) => ({ ...pin, anchor: [(xy[index][0] - 148.5011) / 1000, topMm / 1000, (xy[index][1] - 105.0036) / 1000] }))
}

const r4Icsp = [[177.8381, 101.1936], [180.3781, 101.1936], [177.8381, 103.7336],
  [180.3781, 103.7336], [177.8381, 106.2736], [180.3781, 106.2736]] as const

export function getBoardAuxConnectors(boardId: string): AuxConnector[] {
  const a10 = getA10Board(boardId)
  if (a10) {
    const source = a10.sources[2]
    const pads = (arduinoPads as Record<string, { headerReference: string; padNumber: string; label: string }[]>)[a10.id]
    const listed = (id: string, title: string, note: string): AuxConnector => ({ id, title: `${id} · ${title}`, source, note,
      pins: pads.filter(pad => pad.headerReference === id).sort((a, b) => Number(a.padNumber) - Number(b.padNumber))
        .map(pad => ({ label: pad.label, number: pad.padNumber, role: pinRole(pad.label) })) })
    if (a10.runnerId === 'arduino-nano') return [listed('J4', 'ICSP của ATmega328P', a10.auxiliary.J4!)]
    return [
      listed('ICSP0', 'ICSP của ATmega2560', a10.auxiliary.ICSP0!),
      listed('ICSP1', 'ICSP của ATmega16U2', a10.auxiliary.ICSP1!),
      listed('JP6', 'Header SCL, SDA và AREF', a10.auxiliary.JP6!),
      { id: 'JP5', title: 'JP5 · Footprint 2×2', source, note: a10.auxiliary.JP5!, pins: numbered({ 1: '8PB4', 2: '8PB6', 3: '8PB5', 4: '8PB7' }) },
    ]
  }
  if (st.boards.includes(boardId)) return [
    { id: 'CN4', title: 'CN4 · SWD từ ST-LINK', source: st.source,
      note: stNote + (boardId === 'stm32-nucleo-l476rg' ? ' Chưa có BOM riêng L476RG-C04 để xác nhận trạng thái SB15.' : ' BOM của bản C04 này ghi SB12 và SB15 lắp sẵn.'),
      pins: numbered(st.pads).map((pin, index) => ({ ...pin, anchor: [-0.02667, 0.0058, stAnchorZ[index] / 1000] })) },
    { id: 'CN2', title: 'CN2 · Chọn target ST-LINK', source: st.source, note: stNote,
      pins: named(['Jumper SWCLK', 'Jumper SWDIO']) },
    { id: 'JP1', title: 'JP1 · Nguồn từ USB', source: st.source, note: 'Xem UM1724 bảng 6 và điều kiện cấp nguồn từ USB.', pins: [] },
    { id: 'JP5', title: 'JP5 · Chọn đường cấp nguồn', source: st.source, note: 'Xem UM1724 bảng 8 cho các vị trí nguồn.', pins: named(['U5V', 'E5V']) },
    { id: 'JP6', title: 'JP6 · Đo dòng MCU', source: st.source, note: 'Jumper IDD nối đường cấp nguồn MCU theo cấu hình mặc định.', pins: [] },
  ]
  if (pico.boards.includes(boardId)) {
    const jst = boardId === 'raspberry-pi-pico-2-h'
    // Raspberry Pi's R3a and Pico W Allegro J2 positions in the existing J0 model frame.
    const wireless = boardId === 'raspberry-pi-pico-w'
    if (boardId === 'raspberry-pi-pico' || wireless) return [{ id: 'J2', title: 'J2 · SWD 3 pad', source: pico.source,
      note: `${wireless ? 'J2 ngay dưới vi điều khiển.' : 'J2 ở mép dưới board.'} Board được cấp nguồn riêng qua USB hoặc VSYS.`,
      pins: (wireless ? [11.0841, 13.6241, 16.1641] : [7.96, 10.50, 13.04]).map((x, index) => ({
        number: String(index + 1), label: pico.signalKeys[index], role: pinRole(pico.signalKeys[index]),
        anchor: [x / 1000, wireless ? 0.00001 : 0.0005, wireless ? -0.0198001 : -0.0016],
      })) }]
    return [{ id: 'SWD', title: jst ? 'SWD · JST-SH 3 chân' : 'SWD · 3 pad', source: jst ? pico.jstSource : pico.source,
      note: `${boardId === 'raspberry-pi-pico-w' ? 'Nằm ngay dưới vi điều khiển.' : 'Nằm ở mép dưới board.'} Đầu SWD gồm tín hiệu và GND. Board được cấp nguồn riêng qua USB hoặc VSYS.`,
      pins: jst ? numbered(pico.pico2hJstPads) : named(pico.signalKeys) }]
  }
  if (minima.boards.includes(boardId)) return [
    { id: 'J2', title: 'J2 · SWD 10 chân RA4M1', source: minima.source, note: 'Chân 1 là +5 V OUT theo pinout ABX00080.',
      pins: arduinoContacts(minima.swdPads, [[176.4761, 93.51362], [175.2061, 93.51362], [176.4761, 92.24362], [175.2061, 92.24362],
        [176.4761, 90.97362], [175.2061, 90.97362], [176.4761, 89.70362], [175.2061, 89.70362], [176.4761, 88.43362], [175.2061, 88.43362]], 4.023374) },
    { id: 'J1', title: 'J1 · ICSP 6 chân', source: minima.source, note: 'SPI chia sẻ tín hiệu với header số.', pins: arduinoContacts(minima.icspPads, r4Icsp, 8.5) },
  ]
  if (wifi.boards.includes(boardId)) return [
    { id: 'J2', title: 'J2 · Qwiic', source: wifi.datasheet, note: 'Bus riêng Wire1, mức 3,3 V.',
      pins: arduinoContacts(Object.fromEntries(wifi.signalKeys.qwiic.map((label, index) => [String(index + 1), label])),
        [[177.69311, 118.82763], [177.69311, 117.82764], [177.69311, 116.82763], [177.69312, 115.82763]], 2.975) },
    { id: 'J6', title: 'J6 · ESP Header', source: wifi.datasheet, note: 'UART/JTAG/boot của ESP32-S3 phụ. Logic 3,3 V.',
      pins: arduinoContacts(wifi.espHeaderPads, [[135.5471, 88.4396], [135.5471, 90.9796], [133.0071, 88.4396], [133.0071, 90.9796], [130.4671, 88.4396], [130.4671, 90.9796]], 8.5) },
    { id: 'J3', title: 'J3 · ICSP', source: wifi.source, note: 'SPI của RA4M1.', pins: arduinoContacts(wifi.icspPads, r4Icsp, 8.5) },
    { id: 'JOFF', title: 'JOFF · Nguồn và RTC', source: wifi.source, note: 'VBATT cấp cho VRTC theo sơ đồ ABX00087.',
      pins: arduinoContacts({ 1: 'OFF', 2: 'GND', 3: 'VBATT / VRTC' }, [[131.9911, 129.1336], [134.5311, 129.1336], [137.0711, 129.1336]], 9.496) },
  ]
  if (boardId === 'esp32-s2-devkitc-1') {
    const source = 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s2/esp32-s2-devkitc-1/user_guide.html'
    return [
      { id: 'USB', title: 'Micro-USB native', source, note: 'Cổng này dùng USB trực tiếp của ESP32-S2.', pins: named(['GPIO19 / USB D−', 'GPIO20 / USB D+']) },
      { id: 'USB-UART', title: 'Micro-USB qua cầu USB–UART', source,
        note: 'Cầu USB–UART nối đến UART0. Danh sách dưới đây ghi tên tín hiệu phía ESP32-S2.', pins: named(['GPIO43 / UART0 TX', 'GPIO44 / UART0 RX']) },
    ]
  }
  if (every.boards.includes(boardId)) return [{ id: 'SWD', title: 'SWD · Pad mặt dưới của SAMD11', source: every.source,
    note: 'Chân 4 bỏ pad. UPDI nối ATmega4809 đến SAMD11 trên PCB. SWD thuộc SAMD11. Serial đi qua cầu USB của SAMD11 bằng USART3. Serial1 dùng USART1 trên D1 và D0.', pins: numbered(every.pads) }]
  if (adafruit.boards.includes(boardId)) {
    const index = adafruit.boards.indexOf(boardId)
    const gpio = [[5, 6], [42, 41], [3, 4]][index]
    // Eagle CONN1 pads, transformed with the same locked GLB offsets as the main header.
    const locations = index === 0 ? [[0.6844, 5.2585], [1.6844, 5.2585], [2.6844, 5.2585], [3.6844, 5.2585]]
      : index === 2 ? [[-1.362, 1.5], [-1.362, 0.5], [-1.362, -0.5], [-1.362, -1.5]] : undefined
    const pins = numbered({ 1: 'GND', 2: index === 0 ? '3V3' : '3V3 / VSENSOR', 3: `SDA / GPIO${gpio[0]}`, 4: `SCL / GPIO${gpio[1]}` })
      .map((pin, i): AuxPin => locations ? { ...pin, anchor: [locations[i][0] / 1000, 0.000785, locations[i][1] / 1000] } : pin)
    return [{ id: 'CONN1', title: 'CONN1 · STEMMA QT', source: adafruit.sources[index],
      note: index === 0 ? 'Cùng bus với header, nguồn 3,3 V.'
        : 'Nguồn VSENSOR 3,3 V có chân điều khiển riêng của biến thể Feather.' + (index === 1 ? ' CONN1 ở mặt sau.' : ''), pins }]
  }
  if (boardId === 'stm32-blue-pill-f103') {
    const evidence = getA9Board(boardId)!.boardEvidence
    const j5 = evidence.auxiliaryLookup.find(group => 'signals' in group)!
    return [{ id: j5.id, title: 'J5 · Tín hiệu SWD trên mẫu tham chiếu', source: evidence.sources[0],
      note: j5.level, pins: named(j5.signals) }]
  }
  const a3 = getA3Board(boardId)
  if (a3?.target === 'esp32c6' || a3?.target === 'esp32h2') return [
    { id: 'J5', title: 'J5 · Jumper đo dòng module', source: a3.pinout.replace('#header-block', '#current-measurement'),
      note: 'Jumper lắp sẵn nối nguồn module. Mạch mẫu A3 dùng trạng thái lắp jumper. J5 dùng để đo dòng nối tiếp theo hướng dẫn hãng.',
      pins: [] },
  ]
  return []
}

export function getAnchoredAuxPins(boardId: string, revision: string): BoardPin[] {
  return getBoardAuxConnectors(boardId).flatMap(group => group.pins.flatMap((pin, index) => {
    if (!pin.anchor || !pin.number) return []
    const id = auxPinId(group.id, pin.number)
    return [{ id, label: pin.label, headerReference: group.id, padNumber: pin.number,
      position: 200 + index, side: 'reference' as const, anchor: pin.anchor,
      plainDescription: group.title, technicalRole: pin.label, connection: `${group.id} · ${pin.number}`,
      safetyNote: group.note, functions: [pin.label], catalog: {
        key: [boardId, revision, group.id, pin.number].map(encodeURIComponent).join('/'), revision,
        sourceUrl: group.source, status: pin.role === 'reserved' ? 'reserved' as const : pin.role === 'nc' ? 'nc' as const : 'named' as const,
        role: pin.role === 'ground' ? 'ground' as const : pin.role === 'power' || pin.role === 'voltage-reference' ? 'power' as const : 'signal' as const,
      } }]
  }))
}

export function auxPinId(connector: string, number: string) {
  return `aux-${connector.toLowerCase()}-${number}`
}

export function withA2DebugFunctions(boardId: string, pins: BoardPin[]): BoardPin[] {
  if (boardId !== approval.board.id) return pins
  const notes = approval.board.pinNotes
  const mapped: Record<string, string> = { ...notes.padJtag, ...notes.nativeUsb, ...notes.uart0 }
  return pins.map(pin => {
    const role = mapped[`${pin.headerReference}:${pin.padNumber}`]
    const gpio = pin.gpio ?? Number(/\bIO(\d+)\b/.exec(pin.label)?.[1])
    const strap = notes.bootStraps.includes(gpio)
    if (!role && !strap) return pin
    return { ...pin, functions: [...pin.functions, ...(role ? [role] : []), ...(strap ? ['Chân cấu hình khi khởi động'] : [])],
      safetyNote: pin.safetyNote + (strap ? ' Mức chân lúc reset ảnh hưởng chế độ khởi động.' : '') }
  })
}
