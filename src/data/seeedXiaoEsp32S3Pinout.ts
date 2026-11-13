import type { BoardPin, BoardPinoutEvidence } from '../components/board/boardSceneTypes'
import anchorSource from './seeed-xiao-esp32-s3.pin-anchors.json'

const cadPinByLabel = new Map(anchorSource.headers.flatMap((header) => header.pins.map((pin) => [pin.label, pin] as const)))

const gpioPins = [
  { label: 'D0', gpio: 1, functions: ['GPIO', 'Analog input'], role: 'GPIO1 · chân GPIO/analog theo pin map Seeed.' },
  { label: 'D1', gpio: 2, functions: ['GPIO', 'Analog input'], role: 'GPIO2 · chân GPIO/analog theo pin map Seeed.' },
  { label: 'D2', gpio: 3, functions: ['GPIO', 'Analog input'], role: 'GPIO3 · chân GPIO/analog theo pin map Seeed.' },
  { label: 'D3', gpio: 4, functions: ['GPIO', 'Analog input'], role: 'GPIO4 · chân GPIO/analog theo pin map Seeed.' },
  { label: 'D4', gpio: 5, functions: ['GPIO', 'Analog input', 'I²C SDA'], role: 'GPIO5 · I²C SDA và analog input theo pin map Seeed.' },
  { label: 'D5', gpio: 6, functions: ['GPIO', 'Analog input', 'I²C SCL'], role: 'GPIO6 · I²C SCL và analog input theo pin map Seeed.' },
  { label: 'D6', gpio: 43, functions: ['GPIO', 'UART TX'], role: 'GPIO43 · UART transmit theo pin map Seeed.' },
  { label: 'D7', gpio: 44, functions: ['GPIO', 'UART RX'], role: 'GPIO44 · UART receive theo pin map Seeed.' },
  { label: 'D8', gpio: 7, functions: ['GPIO', 'Analog input', 'SPI SCK'], role: 'GPIO7 · SPI clock và analog input theo pin map Seeed.' },
  { label: 'D9', gpio: 8, functions: ['GPIO', 'Analog input', 'SPI MISO'], role: 'GPIO8 · SPI MISO và analog input theo pin map Seeed.' },
  { label: 'D10', gpio: 9, functions: ['GPIO', 'Analog input', 'SPI MOSI'], role: 'GPIO9 · SPI MOSI và analog input theo pin map Seeed.' },
]

const referencePins: BoardPin[] = [
  {
    id: 'xiao-s3-5v', side: 'reference', position: 0, label: '5V', functions: ['VBUS', 'Nguồn USB'],
    plainDescription: 'Chân 5V/VBUS của XIAO ESP32-S3 bản thường.',
    technicalRole: 'Đường 5V liên quan tới cổng USB-C; guide hãng nêu điều kiện riêng nếu cấp nguồn vào chân này.',
    connection: 'Tên và vai trò lấy từ bảng pinout Seeed. Model 3D hiện không có anchor pad CAD để khẳng định vị trí trực tiếp.',
    safetyNote: 'Không đưa 5V vào GPIO. Guide Seeed lưu ý chân 5V không có điện khi board chạy bằng pin LiPo; chỉ cấp nguồn ngoài theo đúng sơ đồ và hướng dẫn hãng.',
  },
  {
    id: 'xiao-s3-gnd', side: 'reference', position: 1, label: 'GND', functions: ['Mass / đường hồi'],
    plainDescription: 'Mass chung của board và mạch ngoại vi.',
    technicalRole: 'Đường hồi nguồn/tín hiệu theo pinout Seeed.',
    connection: 'Tên lấy từ bảng pinout Seeed; không có pad/net CAD được gán trong viewer này.',
    safetyNote: 'Tắt nguồn trước khi thay dây và nối mass chung theo sơ đồ mạch.',
  },
  {
    id: 'xiao-s3-3v3', side: 'reference', position: 2, label: '3V3', functions: ['Nguồn 3,3 V'],
    plainDescription: 'Ngõ ra 3,3 V đã ổn áp của board.',
    technicalRole: 'Nguồn 3V3_OUT theo pin map Seeed.',
    connection: 'Tên lấy từ bảng pinout Seeed; giới hạn tải phụ thuộc board, nguồn và điều kiện sử dụng.',
    safetyNote: 'Đây là chân nguồn, không phải GPIO. Không vượt giới hạn dòng và nhiệt của board.',
  },
  ...gpioPins.map((pin, index): BoardPin => ({
    id: `xiao-s3-${pin.label.toLowerCase()}`,
    side: 'reference',
    position: index + 3,
    label: pin.label,
    gpio: pin.gpio,
    functions: pin.functions,
    plainDescription: `${pin.label} là nhãn GPIO trên pin map của XIAO ESP32-S3 bản thường.`,
    technicalRole: pin.role,
    connection: 'Tên GPIO/chức năng lấy từ pin map Seeed. Chưa liên kết tên này với pad hoặc net CAD trong viewer.',
    safetyNote: 'GPIO dùng mức logic 3,3 V; không đưa tín hiệu 5 V trực tiếp vào.',
  })),
].map((pin): BoardPin => {
  const cadPin = cadPinByLabel.get(pin.label)
  if (!cadPin) throw new Error(`Thiếu pad CAD cho pin XIAO ESP32-S3 ${pin.label}`)
  return {
    ...pin,
    side: cadPin.side as BoardPin['side'],
    position: cadPin.position,
    headerReference: cadPin.headerReference,
    padNumber: cadPin.padNumber,
    netName: cadPin.cadNetName,
    anchor: cadPin.anchorMeters as [number, number, number],
    connection: `Tâm pad suy ra từ J${cadPin.headerReference === 'J1' ? '1' : '2'} trong PCB Seeed OPL, căn theo tâm outline với STEP bản thường (sai số biên dọc tối đa 0,095 mm). Net CAD “${cadPin.cadNetName}” là nhãn trong nguồn, không xác nhận tuyến điện của mọi revision hoặc board bán lẻ.`,
  }
})

if (referencePins.length !== 14 || referencePins.some((pin) => !pin.anchor || !pin.headerReference || !pin.padNumber)) {
  throw new Error('Pin map XIAO ESP32-S3 cần đủ 14 anchor lấy từ footprint J1/J2 của PCB Seeed OPL.')
}

export const seeedXiaoEsp32S3Pins = referencePins

export const seeedXiaoEsp32S3PinoutEvidence: BoardPinoutEvidence = {
  summary: '14 chân 5V/GND/3V3/D0–D10 có tâm pad lấy từ footprint J1/J2 trong PCB Seeed OPL và căn theo outline STEP v2 bản thường (sai số biên dọc tối đa 0,095 mm). GPIO/chức năng lấy từ guide chính hãng hiện hành; nhãn net trong OPL là dữ liệu CAD của file đó, không chứng minh tuyến điện trên mọi revision. Chưa đối chiếu board vật lý.',
  sourceLabel: 'Mở pin map Seeed · XIAO ESP32-S3 bản thường',
  sourceUrl: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/',
}
