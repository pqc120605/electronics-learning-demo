import { GPIOPinState, Simulator } from 'rp2040js'

/**
 * Chạy firmware Raspberry Pi Pico (RP2040) thật bằng rp2040js (2026-11-14).
 * - Nhận UF2 (định dạng Pico) hoặc ảnh flash nhị phân.
 * - Khi không có bootrom RP2040: nhảy thẳng vào vector table ở 0x10000100 (sau boot2 256 byte).
 *   Firmware dùng Pico SDK gọi hàm trong ROM nên CẦN bootrom; demo tích hợp thì không.
 * Chỉ quan sát GPIO 0–29 và UART0. Không mô phỏng điện.
 */

export const RP2040_FLASH_BASE = 0x10000000
export const RP2040_FLASH_BYTES = 2 * 1024 * 1024
const UF2_MAGIC_START0 = 0x0a324655
const UF2_MAGIC_START1 = 0x9e5d5157
const UF2_MAGIC_END = 0x0ab16f30
const UF2_FLAG_FAMILY = 0x00002000
const RP2040_FAMILY_ID = 0xe48bff56
const CPU_HZ = 125_000_000
const MAX_EVENTS = 2_048
const MAX_SERIAL_BYTES = 4_096

export type Rp2040Snapshot = {
  target: 'raspberry-pi-pico-rp2040'
  cycles: number
  simulatedMilliseconds: number
  bootrom: 'loaded' | 'absent'
  channels: Record<string, Array<{ level: boolean; cycles: number; simulatedMilliseconds: number }>>
  channelsTruncated: boolean
  serialText: string
  serialByteCount: number
  serialTruncated: boolean
  led25: 'on' | 'off' | 'input'
}

export function parseUf2(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0 || bytes.length % 512 !== 0) throw new Error('Tệp UF2 phải gồm các khối 512 byte.')
  const flash = new Uint8Array(RP2040_FLASH_BYTES).fill(0xff)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let blocks = 0
  for (let offset = 0; offset < bytes.length; offset += 512) {
    if (view.getUint32(offset, true) !== UF2_MAGIC_START0 || view.getUint32(offset + 4, true) !== UF2_MAGIC_START1 || view.getUint32(offset + 508, true) !== UF2_MAGIC_END) {
      throw new Error(`Khối UF2 ở byte ${offset} sai magic.`)
    }
    const flags = view.getUint32(offset + 8, true)
    if (flags & UF2_FLAG_FAMILY && view.getUint32(offset + 28, true) !== RP2040_FAMILY_ID) throw new Error('UF2 không dành cho họ RP2040.')
    const address = view.getUint32(offset + 12, true)
    const size = view.getUint32(offset + 16, true)
    if (size > 476 || address < RP2040_FLASH_BASE || address + size > RP2040_FLASH_BASE + RP2040_FLASH_BYTES) throw new Error(`Khối UF2 ghi ra ngoài flash RP2040 (0x${address.toString(16)}).`)
    flash.set(bytes.subarray(offset + 32, offset + 32 + size), address - RP2040_FLASH_BASE)
    blocks += 1
  }
  if (!blocks) throw new Error('UF2 rỗng.')
  return flash
}

/** Lắp ráp firmware demo nhỏ (Thumb) bật/tắt GPIO25 qua SIO, không gọi ROM. Mã máy thật chạy trên CPU giả lập. */
export function buildPicoBlinkDemoImage(delayLoops = 10_000_000): Uint8Array {
  const flash = new Uint8Array(0x200).fill(0xff)
  const view = new DataView(flash.buffer)
  const vector = 0x100
  const code = 0x108
  view.setUint32(vector, 0x20042000, true) // SP đầu RAM
  view.setUint32(vector + 4, RP2040_FLASH_BASE + code + 1, true) // Reset handler (bit Thumb)
  const literals = [0x400140cc /* IO_BANK0 GPIO25_CTRL */, 0xd0000000 /* SIO */, 1 << 25, delayLoops]
  const literalBase = 0x140
  literals.forEach((value, index) => view.setUint32(literalBase + index * 4, value >>> 0, true))
  const halfwords: number[] = []
  const at = () => code + halfwords.length * 2
  const ldrLiteral = (rt: number, index: number) => { const pc = (at() + 4) & ~3; halfwords.push(0x4800 | (rt << 8) | ((literalBase + index * 4 - pc) >> 2)) }
  ldrLiteral(0, 0) // r0 = GPIO25_CTRL
  halfwords.push(0x2000 | (1 << 8) | 5) // movs r1, #5 (FUNCSEL = SIO)
  halfwords.push(0x6000 | (0 << 6) | (0 << 3) | 1) // str r1, [r0]
  ldrLiteral(0, 1) // r0 = SIO base
  ldrLiteral(1, 2) // r1 = 1 << 25
  halfwords.push(0x6000 | ((0x24 >> 2) << 6) | (0 << 3) | 1) // str r1, [r0, #0x24] GPIO_OE_SET
  const loop = at()
  halfwords.push(0x6000 | ((0x1c >> 2) << 6) | (0 << 3) | 1) // str r1, [r0, #0x1c] GPIO_OUT_XOR
  ldrLiteral(2, 3) // r2 = delay
  const delay = at()
  halfwords.push(0x3800 | (2 << 8) | 1) // subs r2, #1
  halfwords.push(0xd100 | (((delay - (at() + 4)) >> 1) & 0xff)) // bne delay
  halfwords.push(0xe000 | (((loop - (at() + 4)) >> 1) & 0x7ff)) // b loop
  if (at() > literalBase) throw new Error('Demo vượt vùng literal.')
  halfwords.forEach((value, index) => view.setUint16(code + index * 2, value, true))
  return flash
}

export function createRp2040Machine(flashImage: Uint8Array, options: { bootrom?: Uint32Array } = {}) {
  if (flashImage.length > RP2040_FLASH_BYTES) throw new Error('Ảnh flash vượt 2 MB của Pico.')
  const simulator = new Simulator()
  const mcu = simulator.rp2040
  const clock = simulator.clock
  mcu.flash.set(flashImage)
  const bootrom = options.bootrom ? 'loaded' as const : 'absent' as const
  if (options.bootrom) {
    mcu.loadBootrom(options.bootrom)
    mcu.core.reset()
  } else {
    const view = new DataView(flashImage.buffer, flashImage.byteOffset, flashImage.byteLength)
    if (flashImage.length < 0x108) throw new Error('Ảnh flash quá ngắn: thiếu vector table ở 0x10000100.')
    mcu.core.SP = view.getUint32(0x100, true)
    mcu.core.PC = view.getUint32(0x104, true) & ~1
  }

  const channels: Rp2040Snapshot['channels'] = {}
  let channelEvents = 0
  let channelsTruncated = false
  const serial: number[] = []
  let serialTruncated = false
  mcu.gpio.forEach((pin, index) => {
    pin.addListener((state) => {
      if (state !== GPIOPinState.High && state !== GPIOPinState.Low) return
      const level = state === GPIOPinState.High
      const list = (channels[`GP${index}`] ??= [])
      if (list.at(-1)?.level === level) return
      if (channelEvents >= MAX_EVENTS) { channelsTruncated = true; return }
      channelEvents += 1
      list.push({ level, cycles: mcu.core.cycles, simulatedMilliseconds: clock.nanos / 1e6 })
    })
  })
  mcu.uart[0].onByte = (value) => { if (serial.length < MAX_SERIAL_BYTES) serial.push(value & 0xff); else serialTruncated = true }

  function snapshot(): Rp2040Snapshot {
    const led = mcu.gpio[25].value
    return {
      target: 'raspberry-pi-pico-rp2040',
      cycles: mcu.core.cycles,
      simulatedMilliseconds: clock.nanos / 1e6,
      bootrom,
      channels: Object.fromEntries(Object.entries(channels).map(([name, events]) => [name, [...events]])),
      channelsTruncated,
      serialText: new TextDecoder('utf-8').decode(new Uint8Array(serial)),
      serialByteCount: serial.length,
      serialTruncated,
      led25: led === GPIOPinState.High ? 'on' : led === GPIOPinState.Low ? 'off' : 'input',
    }
  }

  return {
    /** Chạy tối đa `cycleBudget` chu kỳ CPU (125 MHz). */
    step(cycleBudget: number): Rp2040Snapshot {
      if (!Number.isSafeInteger(cycleBudget) || cycleBudget < 1) throw new Error('Ngân sách chu kỳ phải là số nguyên dương.')
      const cycleNanos = 1e9 / CPU_HZ
      const stop = mcu.core.cycles + cycleBudget
      while (mcu.core.cycles < stop) {
        if (mcu.core.waiting) {
          const wait = clock.nanosToNextAlarm
          if (!Number.isFinite(wait) || wait <= 0) break
          clock.tick(wait)
          mcu.core.cycles += Math.ceil(wait / cycleNanos)
        } else {
          clock.tick(mcu.core.executeInstruction() * cycleNanos)
        }
      }
      return snapshot()
    },
    snapshot,
  }
}
