import type { BoardPin, BoardPinoutEvidence } from '../components/board/boardSceneTypes'
import anchors from './adafruit-qtpy-esp32-c3-5405.pin-anchors.json'

type PinDetails = Pick<BoardPin, 'gpio' | 'functions' | 'plainDescription' | 'technicalRole' | 'safetyNote'>

const details: Record<string, PinDetails> = {
  A0: { gpio: 4, functions: ['GPIO', 'ADC1_CH4', 'Analog input'], plainDescription: 'Pad A0 trên QT Py ESP32-C3 Rev B.', technicalRole: 'GPIO4 · đầu vào ADC1_CH4 theo pinout Adafruit.', safetyNote: 'GPIO mức 3,3 V; không đưa 5 V vào chân này.' },
  A1: { gpio: 3, functions: ['GPIO', 'ADC1_CH3', 'Analog input'], plainDescription: 'Pad A1 trên QT Py ESP32-C3 Rev B.', technicalRole: 'GPIO3 · đầu vào ADC1_CH3 theo pinout Adafruit.', safetyNote: 'GPIO mức 3,3 V; không đưa 5 V vào chân này.' },
  A2: { gpio: 1, functions: ['GPIO', 'ADC1_CH1', 'Analog input'], plainDescription: 'Pad A2 trên QT Py ESP32-C3 Rev B.', technicalRole: 'GPIO1 · đầu vào ADC1_CH1 theo pinout Adafruit.', safetyNote: 'GPIO mức 3,3 V; không đưa 5 V vào chân này.' },
  A3: { gpio: 0, functions: ['GPIO', 'ADC1_CH0', 'Analog input'], plainDescription: 'Pad A3 trên QT Py ESP32-C3 Rev B.', technicalRole: 'GPIO0 · đầu vào ADC1_CH0 theo pinout Adafruit.', safetyNote: 'GPIO mức 3,3 V; không đưa 5 V vào chân này.' },
  SDA: { gpio: 5, functions: ['GPIO', 'I²C SDA', 'ADC2'], plainDescription: 'Pad SDA trên header; cùng đường I²C với chân SDA của STEMMA QT.', technicalRole: 'GPIO5 · I²C SDA · ADC2 theo pinout Adafruit.', safetyNote: 'Adafruit ghi không có pull-up tích hợp trên SCL/SDA. Dùng pull-up phù hợp 3,3 V nếu breakout chưa có; không đưa 5 V vào GPIO.' },
  SCL: { gpio: 6, functions: ['GPIO', 'I²C SCL'], plainDescription: 'Pad SCL trên header; cùng đường I²C với chân SCL của STEMMA QT.', technicalRole: 'GPIO6 · I²C SCL theo pinout Adafruit.', safetyNote: 'Adafruit ghi không có pull-up tích hợp trên SCL/SDA. Dùng pull-up phù hợp 3,3 V nếu breakout chưa có; không đưa 5 V vào GPIO.' },
  TX: { gpio: 21, functions: ['GPIO', 'UART0 TX'], plainDescription: 'Pad TX dùng làm UART transmit hoặc GPIO.', technicalRole: 'GPIO21 · UART0 TX theo pinout Adafruit.', safetyNote: 'Mức logic 3,3 V; khi nối UART ngoài, nối TX tới RX của thiết bị và dùng chung GND.' },
  RX: { gpio: 20, functions: ['GPIO', 'UART0 RX'], plainDescription: 'Pad RX dùng làm UART receive hoặc GPIO.', technicalRole: 'GPIO20 · UART0 RX theo pinout Adafruit.', safetyNote: 'Mức logic 3,3 V; không đưa tín hiệu UART 5 V trực tiếp vào GPIO.' },
  SCK: { gpio: 10, functions: ['GPIO', 'SPI SCK'], plainDescription: 'Pad SCK trên header.', technicalRole: 'GPIO10 · SPI clock theo pinout Adafruit.', safetyNote: 'Mức logic 3,3 V; kiểm tra điện áp logic của thiết bị SPI.' },
  MI: { gpio: 8, functions: ['GPIO', 'SPI MISO'], plainDescription: 'Pad MI (microcontroller input) trên header.', technicalRole: 'GPIO8 · SPI MISO theo pinout Adafruit.', safetyNote: 'Mức logic 3,3 V; kiểm tra điện áp logic của thiết bị SPI.' },
  MO: { gpio: 7, functions: ['GPIO', 'SPI MOSI'], plainDescription: 'Pad MO (microcontroller output) trên header.', technicalRole: 'GPIO7 · SPI MOSI theo pinout Adafruit.', safetyNote: 'Mức logic 3,3 V; kiểm tra điện áp logic của thiết bị SPI.' },
  '3V3': { functions: ['Nguồn 3,3 V'], plainDescription: 'Pad nguồn 3,3 V của QT Py.', technicalRole: 'Net CAD 3.3V; ngõ ra của bộ ổn áp board.', safetyNote: 'Không nhầm rail 3,3 V với GPIO. Tổng tải và điều kiện nhiệt phụ thuộc board, nguồn vào và ngoại vi.' },
  GND: { functions: ['Mass / đường hồi'], plainDescription: 'Pad mass chung của board.', technicalRole: 'Net CAD GND.', safetyNote: 'Tắt nguồn trước khi thay dây; chỉ nối mass theo sơ đồ mạch.' },
  '5V': { functions: ['Nguồn 5 V từ USB'], plainDescription: 'Pad 5V trên header; CAD gọi net này là +5V.', technicalRole: 'Đường 5 V liên quan nguồn USB theo thiết kế board.', safetyNote: 'Không nối 5 V vào GPIO. Kiểm tra hướng cấp nguồn và sơ đồ board trước khi dùng pad này làm đầu vào.' },
}

const labelForCadNet: Record<string, string> = { '+5V': '5V', '3.3V': '3V3', MOSI: 'MO', MISO: 'MI' }

export const adafruitQtPyEsp32C3Pins: BoardPin[] = anchors.headers.flatMap((header) => header.pins.map((anchor) => {
  const label = labelForCadNet[anchor.netName] ?? anchor.label
  const description = details[label]
  if (!description) throw new Error(`Thiếu mô tả pinout cho ${header.headerReference}.${anchor.padNumber} (${label}).`)
  return {
    id: anchor.id,
    side: anchor.side as 'left' | 'right',
    position: anchor.position,
    label,
    headerReference: header.headerReference,
    padNumber: anchor.padNumber,
    netName: anchor.netName,
    ...description,
    anchor: [anchor.xMm / 1000, anchors.boardTopMm / 1000, anchor.zMm / 1000],
    connection: `${header.headerReference} pad ${anchor.padNumber} · net ${anchor.netName} trong Eagle CAD Rev B; chức năng ${label}${description.gpio === undefined ? '' : ` → GPIO${description.gpio}`} theo pinout Adafruit.`,
  }
}))

if (adafruitQtPyEsp32C3Pins.length !== 14 || new Set(adafruitQtPyEsp32C3Pins.map((pin) => pin.netName)).size !== 14) {
  throw new Error('Pinout QT Py ESP32-C3 phải chứa đủ 14 chân breakout CAD duy nhất.')
}

export const adafruitQtPyEsp32C3PinoutEvidence: BoardPinoutEvidence = {
  summary: '14 anchor J1/J2 ngoài biên board được suy ra từ package 1X07_CASTEL và net JP1/JP3 trong Eagle CAD Rev B #5405; tọa độ được căn vào STEP→GLB bằng 35 designator đã ghép. Tên/chức năng tra theo pinout Adafruit. Đây là tra cứu tĩnh, chưa đo board vật lý và không tô net/copper.',
  sourceLabel: 'Mở pinout chính hãng Adafruit',
  sourceUrl: 'https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board/pinouts',
}
