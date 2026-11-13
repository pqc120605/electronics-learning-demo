import type { BoardPin, BoardPinoutEvidence } from '../components/board/boardSceneTypes'
import featherAnchors from './adafruit-feather-esp32-s3-5323.pin-anchors.json'
import featherTftAnchors from './adafruit-feather-esp32-s3-tft-5483.pin-anchors.json'

type PinProfile = Pick<BoardPin, 'gpio' | 'functions' | 'plainDescription' | 'technicalRole' | 'safetyNote'>

function makeProfile(label: string, gpio: number | undefined, functions: string[], role: string, note = 'GPIO mức 3,3 V; không đưa tín hiệu 5 V trực tiếp vào chân này.'): PinProfile {
  return {
    ...(gpio === undefined ? {} : { gpio }),
    functions,
    plainDescription: `Pad ${label} trên header Adafruit Feather ESP32-S3.`,
    technicalRole: role,
    safetyNote: note,
  }
}

function profiles(options: { tft: boolean }): Record<string, PinProfile> {
  const gpio = options.tft
    ? { A0: 18, A1: 17, A2: 16, A3: 15, A4: 14, A5: 8, TX: 1, RX: 2, MISO: 37, MOSI: 35, SCK: 36, SDA: 42, SCL: 41, D13: 13, D12: 12, D11: 11, D10: 10, D9: 9, D6: 6, D5: 5 }
    : { A0: 18, A1: 17, A2: 16, A3: 15, A4: 14, A5: 8, TX: 39, RX: 38, MISO: 37, MOSI: 35, SCK: 36, SDA: 3, SCL: 4, D13: 13, D12: 12, D11: 11, D10: 10, D9: 9, D6: 6, D5: 5 }
  const result: Record<string, PinProfile> = {}
  for (const label of ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']) {
    const adc = label === 'A5' ? 'ADC1' : 'ADC2'
    result[label] = makeProfile(label, gpio[label as keyof typeof gpio], ['GPIO', adc, 'Analog input'], `GPIO${gpio[label as keyof typeof gpio]} · analog-capable ${adc} pad theo pinout Adafruit.`)
  }
  for (const label of ['D5', 'D6', 'D9', 'D10', 'D11', 'D12', 'D13']) {
    result[label] = makeProfile(label, gpio[label as keyof typeof gpio], ['GPIO', 'Digital I/O'], `GPIO${gpio[label as keyof typeof gpio]} · digital I/O theo Arduino core variant cho đúng PID.`)
  }
  result.TX = makeProfile('TX', gpio.TX, ['GPIO', 'UART TX'], `GPIO${gpio.TX} · pad TX theo pinout và Arduino core variant cho đúng PID.`)
  result.RX = makeProfile('RX', gpio.RX, ['GPIO', 'UART RX'], `GPIO${gpio.RX} · pad RX theo pinout và Arduino core variant cho đúng PID.`)
  result.MISO = makeProfile('MISO', gpio.MISO, ['GPIO', 'SPI MISO'], `GPIO${gpio.MISO} · SPI MISO theo Arduino core variant cho đúng PID.`)
  result.MOSI = makeProfile('MOSI', gpio.MOSI, ['GPIO', 'SPI MOSI'], `GPIO${gpio.MOSI} · SPI MOSI theo Arduino core variant cho đúng PID.`)
  result.SCK = makeProfile('SCK', gpio.SCK, ['GPIO', 'SPI SCK'], `GPIO${gpio.SCK} · SPI clock theo Arduino core variant cho đúng PID.`)
  result.SDA = makeProfile('SDA', gpio.SDA, ['GPIO', 'I²C SDA', 'STEMMA QT'], `GPIO${gpio.SDA} · I²C SDA; dùng chung bus với STEMMA QT theo pinout Adafruit.`)
  result.SCL = makeProfile('SCL', gpio.SCL, ['GPIO', 'I²C SCL', 'STEMMA QT'], `GPIO${gpio.SCL} · I²C SCL; dùng chung bus với STEMMA QT theo pinout Adafruit.`)
  result.SDA.safetyNote = 'Guide Adafruit ghi bus I²C có pull-up 5 kΩ trên board. Kiểm tra pull-up trên breakout ngoại vi và giữ mức bus phù hợp 3,3 V.'
  result.SCL.safetyNote = result.SDA.safetyNote
  result.TXD0 = makeProfile('TXD0', undefined, ['Net CAD TXD0'], 'Net được ghi TXD0 trên pad header trong CAD. Không gán alias GPIO vì bảng pinout/Arduino variant được dùng ở đây không xác nhận alias riêng cho pad này.', 'Không đấu theo suy đoán tên net; đối chiếu schematic và board đúng revision trước khi nối thiết bị.')
  result['3.3V'] = makeProfile('3.3V', undefined, ['Nguồn 3,3 V'], 'Pad nguồn 3,3 V theo tên net trong CAD và pinout hãng.', 'Đây là pad nguồn, không phải GPIO. Khả năng cấp dòng phụ thuộc nguồn vào, tải và điều kiện board.')
  result.GND = makeProfile('GND', undefined, ['Mass / đường hồi'], 'Pad mass chung theo tên net trong CAD.', 'Tắt nguồn trước khi thay dây; nối mass theo sơ đồ mạch.')
  result.VBAT = makeProfile('VBAT', undefined, ['Nguồn pin LiPo'], 'Pad VBAT theo tên net trong CAD và pinout hãng; không khẳng định chiều cấp nguồn.', 'Kiểm tra cực tính và dải điện áp của đúng board/pin trước khi đấu thật.')
  result.EN = makeProfile('EN', undefined, ['Enable / reset'], 'Pad EN theo tên net trong CAD; chức năng mức/timing cần đối chiếu tài liệu đúng revision.', 'Không kéo mức chân này tùy tiện khi board đang chạy.')
  result.VBUS = makeProfile('VBUS', undefined, ['Nguồn USB'], 'Pad VBUS theo tên net trong CAD; điện áp và khả năng cấp tải phụ thuộc nguồn USB/board.', 'Không nối VBUS vào GPIO; tránh cấp đồng thời các nguồn không được tài liệu cho phép.')
  result.RESET = makeProfile('RESET', undefined, ['Reset'], 'Pad RESET theo tên net trong CAD.', 'Không nhầm pad reset với GPIO.')
  return result
}

function buildPins(anchors: typeof featherAnchors, pinProfiles: Record<string, PinProfile>, boardLabel: string): BoardPin[] {
  const pins = anchors.headers.flatMap((header) => header.pins.map((anchor) => {
    const label = anchor.netName
    const detail = pinProfiles[label]
    if (!detail) throw new Error(`Thiếu pin profile ${anchors.boardId} ${header.headerReference}.${anchor.padNumber} (${label}).`)
    return {
      id: anchor.id,
      side: anchor.side as 'left' | 'right',
      position: anchor.position,
      label,
      headerReference: header.headerReference,
      padNumber: anchor.padNumber,
      netName: anchor.netName,
      ...detail,
      anchor: [anchor.xMm / 1000, anchors.boardTopMm / 1000, anchor.zMm / 1000] as [number, number, number],
      connection: `${header.headerReference} pad ${anchor.padNumber} · net ${anchor.netName} theo Eagle CAD ${anchors.revision}; ${detail.gpio === undefined ? 'chức năng chỉ mô tả theo nguồn tương ứng, không gán GPIO.' : `alias GPIO${detail.gpio} theo tài liệu hãng/Arduino variant ${boardLabel}.`}`,
    }
  }))
  if (pins.length !== 28 || new Set(pins.map((pin) => pin.id)).size !== 28) {
    throw new Error(`${anchors.boardId}: mong đợi 28 pad JP1/JP3 duy nhất, nhận ${pins.length}.`)
  }
  return pins
}

export const adafruitFeatherEsp32S3Pins = buildPins(featherAnchors, profiles({ tft: false }), '#5323')
export const adafruitFeatherEsp32S3TftPins = buildPins(featherTftAnchors, profiles({ tft: true }), '#5483 TFT')

export const adafruitFeatherEsp32S3PinoutEvidence: BoardPinoutEvidence = {
  summary: '28 pad header JP1/JP3 được đặt theo pad Eagle CAD của đúng PID; phép căn Eagle→GLB dùng 32 tâm mesh hợp lệ cho #5323 và 35 cho #5483 TFT, P95 sai số 0,0007 mm. Net/tên pad lấy từ CAD; alias GPIO và chức năng lấy riêng từ guide Adafruit và Arduino core variant đúng PID. Tra cứu tĩnh, chưa kiểm tra board vật lý, không tô copper/net hay mô phỏng firmware.',
  sourceLabel: 'Mở pinout chính hãng Adafruit',
  sourceUrl: 'https://learn.adafruit.com/adafruit-esp32-s3-feather/pinouts',
}

export const adafruitFeatherEsp32S3TftPinoutEvidence: BoardPinoutEvidence = {
  summary: '28 pad header JP1/JP3 được đặt theo pad Eagle CAD của đúng PID #5483. GPIO alias lấy từ Arduino core variant dành riêng cho Feather ESP32-S3 TFT; không dùng mapping của #5323 (SDA/SCL và TX/RX khác nhau). Tra cứu tĩnh, chưa kiểm tra board vật lý, không tô copper/net hay mô phỏng firmware.',
  sourceLabel: 'Mở pinout chính hãng Adafruit',
  sourceUrl: 'https://learn.adafruit.com/adafruit-esp32-s3-tft-feather/pinouts',
}
