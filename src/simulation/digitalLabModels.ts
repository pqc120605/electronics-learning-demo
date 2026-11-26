export const nandOutput = (a: boolean, b: boolean) => !(a && b)

const segmentCodes = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']

export function bcdDisplay(code: number, stored: number | null, controls: { hold: boolean; lampTest: boolean; blanking: boolean }) {
  const captured = controls.hold ? stored : code
  const segments = controls.lampTest ? 'abcdefg' : controls.blanking ? '' : captured === null ? null : segmentCodes[captured] ?? ''
  return { captured, segments }
}

export function timer555Astable(raKohm: number, rbKohm: number, capacitanceUf: number) {
  if (![raKohm, rbKohm, capacitanceUf].every(value => Number.isFinite(value) && value > 0)) return undefined
  const scale = Math.LN2 * capacitanceUf
  const highMs = (raKohm + rbKohm) * scale
  const lowMs = rbKohm * scale
  const periodMs = highMs + lowMs
  if (!Number.isFinite(periodMs) || periodMs <= 0) return undefined
  return { highMs, lowMs, periodMs, hz: 1000 / periodMs, duty: highMs / periodMs }
}

export const labHex = (byte: number) => '0x' + byte.toString(16).toUpperCase().padStart(2, '0')

function acceptsTransfer(address: number, configured: number, powered: boolean, bytes: readonly number[]) {
  return powered && address === configured && bytes.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)
}

// This is the port layout of the virtual LCD backpack used in this lab.
const lcdEnable = 0x04
const lcdRegisterSelect = 0x01

export function lcdPortBytes(data: number, isCharacter: boolean) {
  const flags = isCharacter ? lcdRegisterSelect : 0
  return [data & 0xf0, (data & 0x0f) << 4].flatMap(nibble => [nibble | flags | lcdEnable, nibble | flags])
}

/** Addressable PCF8574-style port writes, with a bounded HD44780 4-bit write model. */
export function createLcd1602(address: number, powered: boolean) {
  const memory = Array<string>(128).fill(' ')
  let position = 0
  let visible = false
  let previousPort = 0
  let highNibble: number | undefined
  function acceptNibble(port: number) {
    const nibble = port >> 4
    if (highNibble === undefined) {
      highNibble = nibble
      return
    }
    const data = (highNibble << 4) | nibble
    highNibble = undefined
    if (port & lcdRegisterSelect) {
      memory[position] = data >= 0x20 && data <= 0x7e ? String.fromCharCode(data) : '?'
      position = (position + 1) & 0x7f
    } else if (data & 0x80) {
      position = data & 0x7f
    } else if ((data & 0xf8) === 0x08) {
      visible = Boolean(data & 0x04)
    } else if (data === 1 || data === 2) {
      position = 0
      if (data === 1) memory.fill(' ')
    }
  }
  return {
    write(target: number, bytes: readonly number[]) {
      if (!acceptsTransfer(target, address, powered, bytes)) return false
      for (const port of bytes) {
        if ((previousPort & lcdEnable) && !(port & lcdEnable)) acceptNibble(port)
        previousPort = port
      }
      return true
    },
    rows() {
      return [0, 0x40].map(start => visible && powered ? memory.slice(start, start + 16).join('') : ' '.repeat(16))
    },
  }
}

/** SSD1306 page addressing only. Data bytes fill one column in the selected 8-row page. */
export function createOled1306(address: number, powered: boolean) {
  const width = 128
  const pages = 8
  const ram = new Uint8Array(width * pages)
  let on = false
  let column = 0
  let page = 0
  return {
    write(target: number, bytes: readonly number[]) {
      if (!acceptsTransfer(target, address, powered, bytes)) return false
      const [control, ...payload] = bytes
      if (control === 0x00) {
        for (const command of payload) {
          if (command === 0xae || command === 0xaf) on = command === 0xaf
          else if (command >= 0xb0 && command <= 0xb7) page = command & 7
          else if (command < 0x10) column = (column & 0xf0) | command
          else if (command <= 0x17) column = (column & 0x0f) | ((command & 7) << 4)
        }
      } else if (control === 0x40) {
        for (const data of payload) {
          ram[page * width + column] = data
          column = (column + 1) % width
        }
      }
      return true
    },
    pixels() {
      const output = new Uint8Array(width * pages * 8)
      if (on && powered) ram.forEach((bits, index) => {
        const x = index % width
        const y = Math.floor(index / width) * 8
        for (let bit = 0; bit < 8; bit++) output[(y + bit) * width + x] = (bits >> bit) & 1
      })
      return output
    },
  }
}

/** MAX7219 registers relevant to a single 8×8 matrix in raw, no-decode mode. */
export function createLedMatrix7219() {
  const digits = new Uint8Array(8)
  let scanLimit = 0
  let intensity = 0
  let running = false
  let displayTest = false
  return {
    write(word: number) {
      if (!Number.isInteger(word) || word < 0 || word > 0xffff) return
      const address = (word >> 8) & 0xf
      const data = word & 0xff
      if (address >= 1 && address <= 8) digits[address - 1] = data
      else if (address === 0x0a) intensity = data & 0x0f
      else if (address === 0x0b) scanLimit = data & 7
      else if (address === 0x0c) running = Boolean(data & 1)
      else if (address === 0x0f) displayTest = Boolean(data & 1)
    },
    read() {
      return {
        intensity: displayTest ? 15 : intensity,
        pixels: Uint8Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8)
          return displayTest ? 1 : running && row <= scanLimit ? (digits[row] >> (7 - index % 8)) & 1 : 0
        }),
      }
    },
  }
}

export type WifiCondition = 'connected' | 'wrong-password' | 'no-network'
type TelemetryReading = { stage: Exclude<WifiCondition, 'connected'> | 'broker-unavailable' | 'no-match'; payload: null }
  | { stage: 'delivered'; payload: string }

/** One QoS 0 delivery attempt between a publisher and an exact-topic subscriber. */
export function simulateTelemetry(input: { wifi: WifiCondition; brokerOnline: boolean; topic: string; subscription: string; payload: string }): TelemetryReading {
  if (input.wifi !== 'connected') return { stage: input.wifi, payload: null }
  if (!input.brokerOnline) return { stage: 'broker-unavailable', payload: null }
  if (input.topic !== input.subscription) return { stage: 'no-match', payload: null }
  return { stage: 'delivered', payload: input.payload }
}
