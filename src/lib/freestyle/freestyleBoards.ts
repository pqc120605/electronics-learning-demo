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
