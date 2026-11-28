
import { a6Firmware, a6Pins } from './a6PicoProfiles'
import { assertA6Elf } from './a6PicoRuntime'
import type { A2Sample } from './a2C3Runtime'

const timerRawLow = 0x400b0028
const ledMask = 1 << a6Pins.led.gpio
const inputMask = 1 << a6Pins.button.gpio
const uartCapacity = 512
const instructionBatch = 10_000
const targetSampleUs = 1000

export interface A6Emulator {
  HEAPU8: Uint8Array
  _malloc(size: number): number
  _free(address: number): void
  _picoemu_init(architecture: number): number
  _picoemu_set_clock(mhz: number): void
  _picoemu_set_cores(count: number): void
  _picoemu_load_elf(address: number, length: number): number
  _picoemu_reset(): void
  _picoemu_step(instructions: number): number
  _picoemu_script_load(address: number, length: number): number
  _picoemu_get_gpio(pin: number): number
  _picoemu_get_gpio_oe(): number
  _picoemu_get_gpio_out(): number
  _picoemu_mem_read32(address: number): number
  _picoemu_read_uart_bulk(address: number, max: number): number
}

export type A6EmulatorFactory = (options: {
  wasmBinary: Uint8Array; locateFile?: (file: string) => string
  print: (line: string) => void; printErr: (line: string) => void
}) => Promise<A6Emulator>

export function createA6Machine(mcu: A6Emulator, elf: Uint8Array, onUart: (text: string) => void) {
  assertA6Elf(elf)
  if (mcu._picoemu_init(2) !== 1) throw new Error('Chưa khởi tạo được Cortex-M33 A6.')
  mcu._picoemu_set_clock(a6Firmware.clockMHz)
  mcu._picoemu_set_cores(a6Firmware.cores)

  function withPayload(bytes: Uint8Array, work: (address: number, size: number) => number) {
    const address = mcu._malloc(bytes.byteLength)
    if (!address) throw new Error('pico-emu thiếu bộ nhớ.')
    try {
      mcu.HEAPU8.set(bytes, address)
      return work(address, bytes.byteLength)
    } finally {
      mcu._free(address)
    }
  }

  if (withPayload(elf, (address, size) => mcu._picoemu_load_elf(address, size)) !== 1) {
    throw new Error('pico-emu chưa nạp được ELF A6.')
  }
  mcu._picoemu_reset()
  const uart = mcu._malloc(uartCapacity)
  if (!uart) throw new Error('pico-emu thiếu bộ nhớ UART.')
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const now = () => mcu._picoemu_mem_read32(timerRawLow) >>> 0
  let previousPressed: boolean | undefined

  function setPressed(pressed: boolean) {
    if (pressed === previousPressed) return
    // In v1.0.6, set_gpio writes GPIO_OUT. Scripted GPIO events drive GPIO_IN.
    const stimulus = encoder.encode('0ms: gpio' + a6Pins.button.gpio + ' ' + (pressed ? '0' : '1') + '\n')
    if (withPayload(stimulus, (address, size) => mcu._picoemu_script_load(address, size)) !== 0) {
      throw new Error('Chưa đưa được tín hiệu nút nhấn vào GP14.')
    }
    previousPressed = pressed
  }

  function step() {
    // The M33 cycle counter stays at zero in this build. TIMER0 is also the firmware's time base.
    const start = now()
    for (let batch = 0; batch < 64; batch++) {
      if (mcu._picoemu_step(instructionBatch) <= 0) throw new Error('Cortex-M33 A6 đã dừng thực thi.')
      const count = mcu._picoemu_read_uart_bulk(uart, uartCapacity)
      if (count > 0) onUart(decoder.decode(mcu.HEAPU8.subarray(uart, uart + count), { stream: true }))
      if (((now() - start) >>> 0) >= targetSampleUs) return
    }
    throw new Error('TIMER0 của RP2350 không tiến trong bộ mô phỏng.')
  }

  function sample(): A2Sample | undefined {
    const direction = mcu._picoemu_get_gpio_oe()
    if (!(direction & ledMask) || direction & inputMask) return
    const outputHigh = Boolean(mcu._picoemu_get_gpio_out() & ledMask)
    if (Boolean(mcu._picoemu_get_gpio(a6Pins.led.gpio)) !== outputHigh) return
    return { timeUs: now(), inputHigh: Boolean(mcu._picoemu_get_gpio(a6Pins.button.gpio)), outputHigh }
  }

  return { setPressed, step, sample }
}
