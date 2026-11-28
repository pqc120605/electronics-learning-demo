import type { BoardPin } from '../components/board/boardSceneTypes'

const nanoPorts = ['PC5', 'PC4', 'PA0', 'PF5', 'PC6', 'PB2', 'PF4', 'PA1', 'PE3', 'PB0', 'PB1',
  'PE0', 'PE1', 'PE2', 'PD3', 'PD2', 'PD1', 'PD0', 'PF2', 'PF3', 'PD4', 'PD5']

function nanoEvery(label: string): Partial<BoardPin> {
  const [alias] = label.split(' ')
  if (!/^[DA]\d+$/.test(alias)) {
    const role: Record<string, string> = { VIN: 'Nguồn vào bộ ổn áp', '5V': 'Rail logic 5 V',
      '3V3': 'Nguồn 3,3 V từ bộ ổn áp', RESET: 'Reset mức thấp', GND: 'Mass (0 V)', AREF: 'Tham chiếu ADC ngoài · PD7' }
    return { functions: [role[label] ?? label] }
  }
  const analog = alias.startsWith('A')
  const gpio = Number(alias.slice(1)) + (analog ? 14 : 0)
  const functions = ['GPIO ' + nanoPorts[gpio]]
  if (analog) functions.push('Đầu vào analog · D' + gpio)
  if ([3, 5, 6, 9, 10].includes(gpio)) functions.push('PWM theo Arduino core')
  if (gpio === 18 || gpio === 19) functions.push(gpio === 18 ? 'I²C SDA · PA2' : 'I²C SCL · PA3')
  if (gpio === 0 || gpio === 1) functions.push('Serial1 · USART1 ' + (gpio === 1 ? 'TX' : 'RX'))
  if (gpio >= 11 && gpio <= 13) functions.push('SPI0 ' + ['MOSI', 'MISO', 'SCK'][gpio - 11])
  return { functions, safetyNote: 'Logic của ATmega4809 trên board là 5 V. Kiểm tra mức tương thích của mô-đun trước khi ghép nối.' }
}

function esp32S2(label: string): Partial<BoardPin> {
  const match = /\bIO(\d+)\b/.exec(label)
  if (!match) {
    const role: Record<string, string> = { RST: 'Reset mức thấp · CHIP_PU', GND: 'Mass (0 V)',
      '3V3': 'Rail logic 3,3 V', '5V': 'Rail 5 V của board' }
    return { functions: [role[label] ?? label] }
  }
  const gpio = Number(match[1])
  const functions = [gpio === 46 ? 'GPIO chỉ nhận đầu vào' : 'GPIO số']
  if ([0, 45, 46].includes(gpio)) functions.push('Chân cấu hình lúc reset (strapping)')
  if (gpio >= 39 && gpio <= 42) functions.push('JTAG ' + ['MTCK', 'MTDO', 'MTDI', 'MTMS'][gpio - 39])
  if (gpio === 19 || gpio === 20) functions.push(gpio === 19 ? 'USB native D−' : 'USB native D+')
  if (gpio === 43 || gpio === 44) functions.push(gpio === 43 ? 'UART0 TX' : 'UART0 RX')
  if (gpio === 18) functions.push('LED RGB trên board · không kéo lên trong biến thể SOLO-2')
  if (gpio >= 1 && gpio <= 10) functions.push('ADC1 · kênh ' + (gpio - 1))
  if (gpio >= 11 && gpio <= 20) functions.push('ADC2 · kênh ' + (gpio - 11))
  if (gpio >= 1 && gpio <= 14) functions.push('Touch')
  if (gpio === 17 || gpio === 18) functions.push('DAC' + (gpio - 16))
  return { gpio, functions, safetyNote: 'GPIO dùng mức logic 3,3 V.' }
}

export function a12PinDetails(boardId: string, label: string): Partial<BoardPin> {
  if (boardId === 'esp32-s2-devkitc-1') return esp32S2(label)
  if (boardId === 'arduino-nano-every') return nanoEvery(label)
  return {}
}
