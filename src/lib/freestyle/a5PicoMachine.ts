import { ConsoleLogger, GPIOPinState, LogLevel, Simulator } from 'rp2040js'
import { RP2040_FLASH_BASE } from '../rp2040Runner'
import { a5Pins, a5Target } from './a5PicoProfiles'
import type { A2Sample } from './a2C3Runtime'
import { assertA5Flash } from './a5PicoRuntime'

export function createA5Machine(flash: Uint8Array, bootrom: Uint8Array, onUart: (text: string) => void) {
  assertA5Flash(flash)
  if (bootrom.byteLength !== a5Target.bootrom.bytes) throw new Error('Boot ROM RP2040 B2 phải dài 16 KiB.')
  const { rp2040: mcu, clock } = new Simulator()
  mcu.logger = new ConsoleLogger(LogLevel.Warn)
  const rom = new Uint32Array(bootrom.byteLength / 4)
  new Uint8Array(rom.buffer).set(bootrom)
  mcu.loadBootrom(rom)
  // loadBootrom resets and erases the simulator's flash. Load the verified image afterwards.
  mcu.flash.set(flash)
  mcu.core.PC = RP2040_FLASH_BASE
  mcu.uart[0].onByte = byte => onUart(String.fromCharCode(byte))
  const button = mcu.gpio[a5Pins.button.gpio]
  const led = mcu.gpio[a5Pins.led.gpio]
  const cycleNanos = 1e9 / a5Target.clockHz

  function step() {
    const end = clock.nanos + 1e6
    while (clock.nanos < end) {
      if (mcu.core.waiting) {
        const remaining = end - clock.nanos
        const alarm = clock.nanosToNextAlarm
        clock.tick(alarm > 0 ? Math.min(alarm, remaining) : remaining)
      } else {
        clock.tick(mcu.core.executeInstruction() * cycleNanos)
      }
    }
  }

  function sample(): A2Sample | undefined {
    const value = led.value
    if (value !== GPIOPinState.High && value !== GPIOPinState.Low) return
    return { timeUs: Math.floor(clock.nanos / 1000), inputHigh: button.inputValue, outputHigh: value === GPIOPinState.High }
  }

  return { step, sample, setPressed(pressed: boolean) { button.setInputValue(!pressed) } }
}
