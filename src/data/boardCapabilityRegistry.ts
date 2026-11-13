import { boards } from './boards'
import { getAtmega328pFirmwareTarget } from '../lib/firmwareTarget'
import { simulationTargets } from './simulationTargets'
import { getBoardModelEvidence } from './boardModelSources'
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
    modelStatus: modelEvidence?.published && modelEvidence.status !== 'preview-only' ? 'cad-reference' : 'preview-only',
    sourceRefs: source ? [source] : [],
  }
})

export function getBoardCapability(boardId: string) {
  return boardCapabilityRegistry.find((entry) => entry.boardId === boardId) ?? boardCapabilityRegistry.find((entry) => entry.boardId === 'esp32-devkit')!
}

/** Plain statements for the board profile and comparison; each line reads its own evidence. */
export function getBoardSupportSummary(boardId: string) {
  const capability = boardCapabilityRegistry.find((entry) => entry.boardId === boardId)
  if (!capability) return {
    model: 'Không tìm thấy hồ sơ board.',
    pinout: 'Không có pin map để hiển thị.',
    simulation: 'Không có hồ sơ mô phỏng cho board này.',
  }
  return {
    model: capability.modelStatus === 'cad-reference' ? 'Có mô hình CAD tham chiếu 3D; không đại diện mọi clone hay revision.' : 'Chưa có mô hình 3D; chỉ có thông tin tra cứu.',
    pinout: boardId === 'esp32-s3-devkitc-1' ? '44 pad header J1/J3 chọn được trên model; tên/chức năng theo guide Espressif V1.1, vị trí pad từ PADS import. Chưa xác minh trên board vật lý; dữ liệu net CAD không thay schematic/netlist đã kiểm chứng.'
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
  const lesson = targets.has(boardId) ? 'Có mô hình hành vi bài học trong phòng thử.' : 'Chưa có profile bài học trong phòng thử.'
  return getAtmega328pFirmwareTarget(boardId)
    ? `${lesson} Chạy HEX ATmega328P bằng AVR8js, quan sát D13/PB5 và UART0; cần xác nhận đúng target. Không mô phỏng toàn bộ mạch điện.`
    : `${lesson} Chưa hỗ trợ chạy firmware cho board này.`
}
