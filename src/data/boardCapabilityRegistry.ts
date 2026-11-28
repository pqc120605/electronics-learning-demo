import { boards } from './boards'
import { getA9Board } from '../lib/freestyle/a9Stm32Profiles'
import { getA10Board } from '../lib/freestyle/a10AvrRuntime'
import { getA11Board } from '../lib/freestyle/a11EspRuntime'
import { getA12Board } from '../lib/freestyle/a12Profiles'
import { a2BoardId } from '../lib/freestyle/a2C3Fixture'
import { getA3Board } from '../lib/freestyle/a3EspProfiles'
import { getA4Board } from '../lib/freestyle/a4EspProfiles'
import { getA5Board } from '../lib/freestyle/a5PicoProfiles'
import { getA6Board } from '../lib/freestyle/a6PicoProfiles'
import { getA7Board } from '../lib/freestyle/a7Stm32Profiles'
import { getA8Board } from '../lib/freestyle/a8Ra4m1Profiles'
import { isHostedFirmware } from '../lib/freestyle/firmwareDelivery'
import { getAtmega328pFirmwareTarget } from '../lib/firmwareTarget'
import { simulationTargets } from './simulationTargets'
import { getBoardModelEvidence } from './boardModelSources'
import { getRemainingBoardAsset } from './remainingCatalogBoardSources'
import type { BoardPin } from '../components/board/boardSceneTypes'
import { adafruitFeatherEsp32S3Pins, adafruitFeatherEsp32S3TftPins } from './adafruitFeatherEsp32S3Pinout'
import { seeedXiaoEsp32S3Pins } from './seeedXiaoEsp32S3Pinout'
import esp32S3PinAnchors from './esp32-s3-devkitc-1.pin-anchors.json'

export type BoardCapability = {
  boardId: string
  revision: string
  confidence: 'source-backed' | 'teaching-alias' | 'catalog-only'
  logicLevel: string
  /** sourceBacked means a named document states the pin; nobody has probed a physical board. */
  pinMap: Record<string, { label: string; sourceBacked: boolean }>
  lessonIds: string[]
  modelStatus: 'cad-reference' | 'preview-only'
  sourceRefs: string[]
}

const sourceBackedPinProfiles = new Set(['esp32-devkit','esp32-s3-devkitc-1','arduino-uno-r3','arduino-nano-classic','arduino-mega-2560-r3','stm32-nucleo','seeed-xiao-esp32c3','seeed-xiao-esp32-s3','raspberry-pi-pico','raspberry-pi-pico-w','raspberry-pi-pico-2','raspberry-pi-pico-2-h','adafruit-feather-esp32-s3-5323','adafruit-feather-esp32-s3-tft-5483'])
const raspberryPiPicoPinoutIds = new Set(['raspberry-pi-pico','raspberry-pi-pico-w','raspberry-pi-pico-2','raspberry-pi-pico-2-h'])
const targets = new Map(simulationTargets.map((target) => [target.boardId, target]))
const featherPinProfiles: Record<string, BoardCapability['pinMap']> = {
  'adafruit-feather-esp32-s3-5323': Object.fromEntries(adafruitFeatherEsp32S3Pins.map((pin) => [pin.label.toLowerCase(), { label: `${pin.label}${pin.gpio === undefined ? '' : ` · GPIO${pin.gpio}`}${pin.functions.length ? ` · ${pin.functions.join(' · ')}` : ''}`, sourceBacked: true }])),
  'adafruit-feather-esp32-s3-tft-5483': Object.fromEntries(adafruitFeatherEsp32S3TftPins.map((pin) => [pin.label.toLowerCase(), { label: `${pin.label}${pin.gpio === undefined ? '' : ` · GPIO${pin.gpio}`}${pin.functions.length ? ` · ${pin.functions.join(' · ')}` : ''}`, sourceBacked: true }])),
}

/** Header pad names are taken from the imported PADS PCB and the official V1.1 guide. */
const esp32S3DevkitC1PinMap: BoardCapability['pinMap'] = Object.fromEntries(
  esp32S3PinAnchors.headers.flatMap((header) => header.pins.map((pin) => [
    pin.id,
    {
      label: `${header.headerReference} pad ${pin.padNumber} · ${pin.label}${pin.netName ? ` · ${pin.netName}` : ''}`,
      sourceBacked: true,
    },
  ])),
)

const nucleoF401PinMap: BoardCapability['pinMap'] = Object.fromEntries([
  ['d0', 'PA3 · USART2_RX'], ['d1', 'PA2 · USART2_TX'], ['d2', 'PA10'], ['d3', 'PB3 · TIM2_CH2'],
  ['d4', 'PB5'], ['d5', 'PB4 · TIM3_CH1'], ['d6', 'PB10 · TIM2_CH3'], ['d7', 'PA8'],
  ['d8', 'PA9'], ['d9', 'PC7 · TIM3_CH2'], ['d10', 'PB6 · SPI1_CS'], ['d11', 'PA7 · SPI1_MOSI'],
  ['d12', 'PA6 · SPI1_MISO'], ['d13', 'PA5 · SPI1_SCK'], ['d14', 'PB9 · I2C1_SDA'], ['d15', 'PB8 · I2C1_SCL'],
  ['a0', 'PA0 · ADC1_IN0'], ['a1', 'PA1 · ADC1_IN1'], ['a2', 'PA4 · ADC1_IN4'],
  ['a3', 'PB0 · ADC1_IN8'], ['a4', 'PC1 · ADC1_IN11*'], ['a5', 'PC0 · ADC1_IN10*'],
].map(([key, label]) => [key, { label, sourceBacked: true }]))

/** Seeed's XIAO ESP32-C3 pin table and strapping-pin warning; not probed on a physical sample. */
const seeedXiaoEsp32C3PinMap: BoardCapability['pinMap'] = Object.fromEntries([
  ['d0', 'GPIO2 · ADC1_CH2 · A0'], ['d1', 'GPIO3 · ADC1_CH3 · A1'], ['d2', 'GPIO4 · ADC1_CH4 · A2'],
  ['d3', 'GPIO5 · ADC2_CH0 · A3'], ['d4', 'GPIO6 · SDA · I²C Data'], ['d5', 'GPIO7 · SCL · I²C Clock'],
  ['d6', 'GPIO21 · TX · UART'], ['d7', 'GPIO20 · RX · UART'], ['d8', 'GPIO8 · SCK · SPI Clock'],
  ['d9', 'GPIO9 · MISO · SPI Data'], ['d10', 'GPIO10 · MOSI · SPI Data'],
].map(([key, label]) => [key, { label, sourceBacked: true }]))

export const boardCapabilityRegistry: BoardCapability[] = boards.map((board) => {
  const target = targets.get(board.id)
  const source = board.sourceEvidenceUrl ?? board.sourceUrl
  const modelEvidence = getBoardModelEvidence(board.id)
  const sourceBacked = sourceBackedPinProfiles.has(board.id)
  return {
    boardId: board.id,
    revision: board.revision ?? 'Revision chưa xác định; cần đối chiếu board cụ thể',
    confidence: sourceBacked ? 'source-backed' : target ? 'teaching-alias' : 'catalog-only',
    logicLevel: board.logicLevel ?? target?.logicLevel ?? 'Đối chiếu tài liệu board',
    pinMap: featherPinProfiles[board.id] ?? (board.id === 'esp32-s3-devkitc-1' ? esp32S3DevkitC1PinMap : board.id === 'seeed-xiao-esp32-s3' ? Object.fromEntries(seeedXiaoEsp32S3Pins.map((pin) => [pin.label.toLowerCase(), { label: `${pin.label}${pin.gpio === undefined ? '' : ` · GPIO${pin.gpio}`}${pin.functions.length ? ` · ${pin.functions.join(' · ')}` : ''}`, sourceBacked: true }])) : board.id === 'stm32-nucleo' ? {
      ...nucleoF401PinMap,
      ledOutput: { label: 'D13 · PA5 · SPI1_SCK', sourceBacked: true },
      input: { label: 'PA0 · alias học tập (tương ứng header A0)', sourceBacked: false },
    } : board.id === 'seeed-xiao-esp32c3' ? seeedXiaoEsp32C3PinMap : target ? {
      ledOutput: { label: target.pinLabel, sourceBacked: sourceBacked },
      input: { label: target.architecture.startsWith('AVR') ? 'D2 (alias học tập)' : target.architecture.startsWith('Arm') ? 'PA0 (alias học tập)' : 'GPIO input (alias học tập)', sourceBacked: false },
    } : ({} as BoardCapability['pinMap'])),
    lessonIds: target ? ['blink','button-led','ir-alert','ultrasonic-distance','seven-segment-counter','analog-potentiometer','analog-ldr'] : [],
    modelStatus: getRemainingBoardAsset(board.id) || modelEvidence?.published && modelEvidence.status !== 'preview-only' ? 'cad-reference' : 'preview-only',
    sourceRefs: source ? [source] : [],
  }
})

export function getBoardCapability(boardId: string, headerPins?: readonly BoardPin[]) {
  const capability = boardCapabilityRegistry.find(entry => entry.boardId === boardId)
  if (!capability) return boardCapabilityRegistry.find(entry => entry.boardId === 'esp32-devkit')!
  if (!headerPins?.length) return capability
  const pinMap = { ...capability.pinMap }
  for (const pin of headerPins) {
    const catalog = pin.catalog
    if (!catalog) continue
    pinMap[catalog.key] = { label: pin.label, sourceBacked: Boolean(catalog.sourceUrl && catalog.status !== 'unresolved') }
    // Only an exact name from the board's own CAD can be used to join a net.
    const net = pin.netName?.trim().toLowerCase()
    if (net && catalog.sourceUrl && catalog.status === 'named' && !Object.hasOwn(pinMap, net)) {
      pinMap[net] = { label: pin.label, sourceBacked: true }
    }
  }
  return { ...capability, pinMap }
}

/** Plain statements for the board profile and comparison; each line reads its own evidence. */
export function getBoardSupportSummary(boardId: string) {
  const capability = boardCapabilityRegistry.find((entry) => entry.boardId === boardId)
  if (!capability) return {
    model: 'Không tìm thấy hồ sơ board.',
    pinout: 'Không có pin map để hiển thị.',
    simulation: 'Không có hồ sơ mô phỏng cho board này.',
  }
  const remaining = getRemainingBoardAsset(boardId)
  return {
    model: remaining ? 'Có mặt trên 2D và mô hình 3D tham chiếu cho ' + remaining.orderCode + '.'
      : capability.modelStatus === 'cad-reference' ? 'Có mô hình CAD tham chiếu 3D; không đại diện mọi clone hay revision.' : 'Chưa có mô hình 3D; chỉ có thông tin tra cứu.',
    pinout: remaining ? remaining.pins.length + ' chân header chọn được trên mô hình theo ' + (boardId.startsWith('stm32-') ? 'UM1724 Rev 17.' : 'tài liệu đúng phiên bản.')
      : boardId === 'esp32-s3-devkitc-1' ? '44 pad header J1/J3 chọn được trên model; tên/chức năng theo guide Espressif V1.1, vị trí pad từ PADS import. Chưa xác minh trên board vật lý; dữ liệu net CAD không thay schematic/netlist đã kiểm chứng.'
      : raspberryPiPicoPinoutIds.has(boardId) ? boardId === 'raspberry-pi-pico-2' || boardId === 'raspberry-pi-pico-2-h'
      ? '40 chân J0 có thể chọn trên model; layout kế thừa Pico R3 theo tài liệu Raspberry Pi và căn theo STEP của biến thể. Chưa có Allegro riêng cho Pico 2 trong nguồn cục bộ.'
      : '40 chân J0 có thể chọn trên model; tâm pad và net từ CAD Allegro hãng, chức năng đối chiếu pinout Raspberry Pi. Chưa đo đối chiếu board vật lý.'
      : boardId === 'stm32-nucleo' ? 'Header Arduino đối chiếu ST UM1724 Rev 17.'
      : boardId === 'seeed-xiao-esp32c3' ? 'Pinout D0–D10 đã chép theo tài liệu Seeed; chưa xác minh bằng board vật lý.'
      : boardId === 'seeed-xiao-esp32-s3' ? '14 pad J1/J2 chọn được theo PCB Seeed OPL và căn với STEP bản thường; GPIO/chức năng theo guide hãng. File OPL không ghi revision; chưa xác minh board thật hoặc tuyến net.'
        : boardId === 'adafruit-qtpy-esp32-c3-5405' ? '14 pad JP1/JP3 chọn được theo Eagle CAD Rev B; chức năng theo pinout Adafruit. Chỉ tra cứu tĩnh, chưa xác minh board vật lý.'
        : boardId === 'adafruit-feather-esp32-s3-5323' ? '28 pad JP1/JP3 chọn được theo CAD Eagle #5323; GPIO theo pinout hãng và Arduino core variant đúng PID. Tra cứu tĩnh, chưa xác minh board vật lý.'
        : boardId === 'adafruit-feather-esp32-s3-tft-5483' ? '28 pad JP1/JP3 chọn được theo CAD Eagle #5483; GPIO theo pinout hãng và Arduino core variant riêng của bản TFT. Không dùng mapping của #5323.'
      : capability.confidence === 'source-backed' ? 'Chân LED của bài có nguồn; chân đầu vào là alias học tập.'
        : capability.confidence === 'teaching-alias' ? 'Chỉ có alias học tập, chưa đối chiếu với pinout của board.'
          : 'Chưa có pin map trong web; tra tài liệu hãng.',
    simulation: describeBoardSimulation(boardId),
  }
}

/** Firmware support comes from the runner's exact target list, never an MCU name match. */
export function describeBoardSimulation(boardId: string): string {
  if (isHostedFirmware()) {
    const stage = boardId === a2BoardId ? 'A2'
      : getA3Board(boardId) ? 'A3' : getA4Board(boardId) ? 'A4'
        : getA5Board(boardId) ? 'A5' : getA6Board(boardId) ? 'A6'
          : getA7Board(boardId) ? 'A7' : getA8Board(boardId) ? 'A8' : getA9Board(boardId) ? 'A9'
            : getA10Board(boardId) ? 'A10' : getA11Board(boardId) ? 'A11' : getA12Board(boardId) ? 'A12' : ''
    if (stage) return `Mạch mẫu ${stage} chạy firmware nút nhấn và LED, hiển thị GPIO, UART và phép đo DC bằng ngspice.`
  }
  if (getA9Board(boardId)) return 'Bản local chạy ELF Renode cho mạch mẫu nút nhấn và LED A9, kèm hai phép đo ngspice DC.'
  const lesson = targets.has(boardId) ? 'Có mô hình hành vi bài học trong phòng thử.' : 'Chưa có profile bài học trong phòng thử.'
  const legacyHex = getAtmega328pFirmwareTarget(boardId)
    ? ' Chạy HEX ATmega328P bằng AVR8js, quan sát D13/PB5 và UART0; cần xác nhận đúng target. Không mô phỏng toàn bộ mạch điện.' : ''
  const a10 = getA10Board(boardId)
  if (a10) return `${lesson}${legacyHex} Bản local chạy HEX trên AVR8js cho mạch mẫu nút nhấn và LED A10, kèm hai phép đo ngspice DC.`
  if (getA12Board(boardId)) return `${lesson} Mạch A12 trên local có hai điểm làm việc DC và sơ đồ chân 2D/3D.`
  if (getA11Board(boardId)) return `${lesson} Bản local chạy ảnh ESP-IDF bằng ESP-EMU cho mạch mẫu A11, kèm hai phép đo ngspice DC.`
  return lesson + (legacyHex || ' Chưa hỗ trợ chạy firmware cho board này.')
}
