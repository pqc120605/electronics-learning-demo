import { getA3Board } from './a3EspProfiles'
import { getA4Board } from './a4EspProfiles'
import { getA5Board } from './a5PicoProfiles'
import { getA6Board } from './a6PicoProfiles'
import { getA7Board } from './a7Stm32Profiles'
import { getA8Board } from './a8Ra4m1Profiles'
import { getA9Board } from './a9Stm32Profiles'
import { getA11Board } from './a11EspRuntime'
import { getA12Board } from './a12Profiles'

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
  { id: 'esp32-devkit', name: 'ESP32 DevKit V1', short: 'ESP32', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(23, 34, 5, 18, [13, 14, 27, 26, 25, 33, 32]), limitation: 'Bàn lắp tự do dùng trình thông dịch Arduino C++ rút gọn. Mở mạch mẫu A11 trên local để chạy firmware ESP-IDF bằng ESP-EMU.' },
  { id: 'esp32-s3-devkitc-1', name: 'ESP32-S3-DevKitC-1', short: 'ESP32-S3', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(4, 5, 6, 7, [8, 9, 10, 11, 12, 13, 14]), limitation: 'Chạy bằng trình thông dịch Arduino C++ rút gọn; không có LED_BUILTIN đơn, không có WiFi/BLE/USB.' },
  { id: 'arduino-uno-r3', name: 'Arduino Uno R3', short: 'Uno', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Khi có dịch vụ cục bộ: biên dịch thật bằng arduino-cli và chạy firmware trên avr8js. Bản web tĩnh: trình thông dịch rút gọn.' },
  { id: 'arduino-nano', name: 'Arduino Nano classic', short: 'Nano', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Như Uno: arduino-cli + avr8js khi có dịch vụ cục bộ; A6/A7 chỉ đọc analog.' },
  { id: 'arduino-mega-2560', name: 'Arduino Mega 2560 R3', short: 'Mega', logic: '5 V', realEngine: 'avr', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [22, 23, 24, 25, 26, 27, 28]), limitation: 'arduino-cli + avr8js (ATmega2560) khi có dịch vụ cục bộ; A8–A15 chưa nối ADC trong mô phỏng.' },
  { id: 'raspberry-pi-pico', name: 'Raspberry Pi Pico', short: 'Pico', logic: '3,3 V', realEngine: 'micropython', languages: ['cpp', 'micropython'], defaultPins: pins(15, 14, 16, 17, [2, 3, 4, 5, 6, 7, 8]), limitation: 'MicroPython v1.29 chính thức chạy thật trên rp2040js khi có dịch vụ cục bộ (cần bootrom RP2040). Arduino C++ chạy bằng trình thông dịch rút gọn. Mô phỏng thường chậm hơn thời gian thực.' },
  { id: 'stm32-blue-pill-f103', name: 'STM32 Blue Pill (F103C8)', short: 'Blue Pill', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(5, 1, 22, 23, [24, 25, 26, 27, 28, 29, 30]), limitation: 'Chưa có emulator STM32 mở chạy được trong trình duyệt: code chạy bằng trình thông dịch Arduino C++ rút gọn. Viết chân bằng tên PA5, PB0…' },
  { id: 'stm32-nucleo-f401re', name: 'STM32 Nucleo-F401RE', short: 'Nucleo', logic: '3,3 V', languages: ['cpp'], defaultPins: pins(13, 2, 9, 10, [3, 4, 5, 6, 7, 8, 11]), limitation: 'Chạy bằng trình thông dịch Arduino C++ rút gọn; số chân theo header Arduino D0–D15, A0–A5.' },
]

const c3FixtureBoard: FreestyleBoard = { id: 'esp32-c3-devkitm-1', name: 'ESP32-C3-DevKitM-1', short: 'ESP32-C3', logic: '3,3 V',
  languages: ['cpp'], defaultPins: pins(10, 4, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
  limitation: 'ESP-EMU chạy firmware biên dịch cho mạch nút nhấn và LED A2.' }

export function getFreestyleBoard(id: string): FreestyleBoard {
  const a12 = getA12Board(id)
  if (a12) return {
    id, name: a12.name, short: a12.name, logic: a12.voltageV === 5 ? '5 V' : '3,3 V', languages: ['cpp'],
    defaultPins: pins(a12.led.gpio, a12.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Mạch nút nhấn và LED A12 trên bản local.',
  }
  const a11 = getA11Board(id)
  if (a11?.id === 'esp32-devkitm-1') return {
    id, name: a11.name, short: 'DevKitM-1', logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a11.led.gpio, a11.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Mạch nút nhấn và LED A11 chạy firmware ESP-IDF trên local.',
  }
  const a9 = getA9Board(id)
  if (a9?.id === 'stm32-nucleo-l476rg') return {
    id, name: a9.name, short: 'NUCLEO-L476RG', logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a9.led.gpio, a9.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Renode chạy riêng firmware C của mạch nút nhấn và LED A9 trên local.',
  }
  const a8 = getA8Board(id)
  if (a8) return {
    id, name: a8.name, short: a8.sku, logic: '5 V', languages: ['cpp'],
    defaultPins: pins(a8.led.gpio, a8.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Renode chạy riêng firmware C của mạch nút nhấn và LED A8 trên local.',
  }
  const a7 = getA7Board(id)
  if (a7) return {
    id, name: a7.name, short: a7.orderCode, logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a7.led.gpio, a7.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Renode chạy riêng firmware C của mạch nút nhấn và LED A7 trên local.',
  }
  const a3 = getA3Board(id)
  if (a3) return { id, name: a3.name, short: a3.name, logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a3.led.gpio, a3.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'ESP-EMU chạy firmware biên dịch cho mạch nút nhấn và LED A3.' }
  const a4 = getA4Board(id)
  if (a4 && id !== 'esp32-s3-devkitc-1') return {
    id, name: a4.name, short: a4.name, logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a4.led.gpio, a4.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'ESP-EMU chạy firmware biên dịch cho mạch nút nhấn và LED A4.',
  }
  const a6 = getA6Board(id)
  if (a6) return {
    id, name: a6.name, short: a6.name, logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a6.led.gpio, a6.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'Mạch nút nhấn và LED A6 chạy firmware C biên dịch cho RP2350 trên local.',
  }
  const a5 = getA5Board(id)
  if (a5?.sdkBoard === 'pico_w') return {
    id, name: a5.name, short: 'Pico W', logic: '3,3 V', languages: ['cpp'],
    defaultPins: pins(a5.led.gpio, a5.button.gpio, -1, -1, [-1, -1, -1, -1, -1, -1, -1]),
    limitation: 'rp2040js chạy firmware C biên dịch cho mạch nút nhấn và LED A5.',
  }
  return id === c3FixtureBoard.id ? c3FixtureBoard : freestyleBoards.find(board => board.id === id) ?? freestyleBoards[2]
}
