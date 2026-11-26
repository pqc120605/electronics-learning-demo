import { r2bAddress, r2bBit, type ReadR2bPin, type R2bSignal } from './catalogR2bSignals'

export type R2bI2cModel = 'pcf8574' | 'mcp23017' | '24lc256' | 'ads1115' | 'tca9548a'
export type R2bDrive = { pin: string; value: R2bSignal; weak?: true }
type Byte = number | 'X'
type Context = { read: ReadR2bPin; now: () => number; addressPin?: () => number | 'X' }
type Device = {
  select(write: boolean): boolean
  write(value: number): boolean
  read(): Byte
  stop(): void
  reset(): void
  drives(): R2bDrive[]
  channelMask?(): number
  issue?(): string | undefined
}

function pcf8574({ read }: Context): Device {
  let latch = 255
  let baseline: Byte = 255
  function port(): Byte {
    let result = 0
    for (let i = 0; i < 8; i++) {
      const signal = read('p' + i)
      const bit = signal === 'Z' ? (latch >> i) & 1 : r2bBit(signal)
      if (bit === 'X' || ((latch & (1 << i)) === 0 && bit !== 0)) return 'X'
      result |= bit << i
    }
    return result
  }
  return {
    select: () => true,
    write(value) { latch = value; baseline = port(); return true },
    read() { baseline = port(); return baseline },
    stop() {},
    reset() { latch = baseline = 255 },
    drives() {
      const result: R2bDrive[] = Array.from({ length: 8 }, (_, pin) =>
        latch & (1 << pin) ? { pin: 'p' + pin, value: 5, weak: true } : { pin: 'p' + pin, value: 0 })
      const sampled = port()
      result.push({ pin: 'int', value: sampled === 'X' ? 'X' : sampled === baseline ? 'Z' : 0 })
      return result
    },
  }
}

function mcp23017({ read }: Context): Device {
  const registers = new Uint8Array(22)
  const baseline = [0, 0]
  const captured: Byte[] = [0, 0]
  let pointer = 0
  let addressByte = true
  let issue: string | undefined

  function reset() {
    registers.fill(0)
    registers[0] = registers[1] = 255
    baseline.fill(0)
    captured.fill(0)
    pointer = 0
    issue = undefined
  }
  reset()

  function port(bank: number, enabledInputs = 255): Byte {
    const prefix = bank === 0 ? 'gpa' : 'gpb'
    const direction = registers[bank]
    const latch = registers[0x14 + bank]
    let value = latch & ~direction
    for (let i = 0; i < 8; i++) {
      const mask = 1 << i
      if (!(direction & enabledInputs & mask)) continue
      const signal = read(prefix + i)
      const bit = signal === 'Z' && (registers[0x0c + bank] & mask) ? 1 : r2bBit(signal)
      if (i === 7 || bit === 'X') return 'X'
      value |= bit << i
    }
    return value
  }

  function interrupt(bank: number) {
    const mask = registers[4 + bank] & registers[bank] & 0x7f
    const value = port(bank, mask)
    const previous = registers[0x0e + bank]
    if (value !== 'X') {
      const changed = (baseline[bank] ^ value) & mask
      if (!previous && changed) captured[bank] = port(bank)
      registers[0x0e + bank] |= changed
    }
  }

  function clearInterrupt(bank: number) {
    const value = port(bank, 0x7f)
    if (value !== 'X') baseline[bank] = value
    registers[0x0e + bank] = 0
  }

  const writable = new Set([0,1,4,5,8,9,10,11,12,13,18,19,20,21])
  return {
    select(write) { addressByte = write; return true },
    write(value) {
      if (addressByte) { addressByte = false; pointer = value; return addressableMcp(pointer) }
      if (!writable.has(pointer)) { issue = 'Thanh ghi chỉ đọc hoặc nằm ngoài BANK=0 của mô hình.'; return false }
      if ((pointer === 8 || pointer === 9) && value !== 0) {
        issue = 'Ca thử ngắt dùng INTCON=0 để nhận thay đổi mức.'
        return false
      }
      if ((pointer === 10 || pointer === 11) && (value & ~0x06)) {
        issue = 'IOCON chỉ hỗ trợ BANK=0, tăng địa chỉ, ODR và INTPOL trong R2B.'
        return false
      }
      issue = (pointer <= 1 && value & 0x80) ? 'GPA7 và GPB7 chỉ dùng làm đầu ra.' : undefined
      if (pointer === 10 || pointer === 11) registers[10] = registers[11] = value
      else registers[pointer === 18 || pointer === 19 ? pointer + 2 : pointer] = value
      if (pointer <= 1 || pointer === 4 || pointer === 5) clearInterrupt(pointer & 1)
      pointer = (pointer + 1) % 22
      return true
    },
    read() {
      if (!addressableMcp(pointer)) return 'X'
      const at = pointer
      const bank = at & 1
      pointer = (pointer + 1) % 22
      interrupt(0); interrupt(1)
      if (at === 0x10 || at === 0x11) {
        const result = captured[bank]
        clearInterrupt(bank)
        return result
      }
      if (at === 0x12 || at === 0x13) {
        const result = port(bank)
        if (registers[bank] & 0x80) issue = 'Đặt bit 7 làm đầu ra trước khi đọc cả byte GPIO.'
        clearInterrupt(bank)
        return result
      }
      return registers[at]
    },
    stop() {},
    reset,
    drives() {
      const result: R2bDrive[] = []
      for (const bank of [0,1]) {
        const prefix = bank === 0 ? 'gpa' : 'gpb'
        interrupt(bank)
        for (let i = 0; i < 8; i++) {
          const bit = 1 << i
          const pin = prefix + i
          if ((registers[bank] & bit) === 0) result.push({ pin, value: registers[0x14 + bank] & bit ? 5 : 0 })
          else if (i !== 7 && (registers[0x0c + bank] & bit)) result.push({ pin, value: 5, weak: true })
        }
        const pending = !!registers[0x0e + bank]
        const value = registers[10] & 4 ? pending ? 0 : 'Z' : pending === !!(registers[10] & 2) ? 5 : 0
        result.push({ pin: bank === 0 ? 'inta' : 'intb', value })
      }
      return result
    },
    issue: () => issue,
  }
}

function addressableMcp(register: number) { return Number.isInteger(register) && register >= 0 && register < 22 }

function eeprom({ read, now }: Context): Device {
  // The EEPROM array survives virtual loss of power. An unfinished page program does not.
  const cells = new Uint8Array(32768).fill(255)
  let cursor = 0
  let addressByte = 0
  let high = 0
  let page = 0
  const dirty = new Map<number, number>()
  let programming: { deadline: number; cells: Map<number, number> } | undefined
  function complete() {
    if (!programming || programming.deadline > now()) return
    for (const [address,value] of programming.cells) cells[address] = value
    programming = undefined
  }
  return {
    select(write) {
      complete()
      if (programming) return false
      if (write) addressByte = 0
      return true
    },
    write(value) {
      if (addressByte === 0) { high = value & 0x7f; addressByte++ }
      else if (addressByte === 1) { cursor = high * 256 + value; page = cursor & ~63; addressByte++ }
      else {
        dirty.set(cursor, value)
        cursor = page | ((cursor + 1) & 63)
      }
      return true
    },
    read() {
      const value = cells[cursor]
      cursor = (cursor + 1) & 0x7fff
      return value
    },
    stop() {
      if (dirty.size && r2bBit(read('wp')) === 0) programming = { deadline: now() + 5, cells: new Map(dirty) }
      dirty.clear()
    },
    reset() { complete(); dirty.clear(); programming = undefined; cursor = 0; addressByte = 0 },
    drives: () => [],
    issue: () => r2bBit(read('wp')) === 'X' ? 'WP cần mức xác định.' : undefined,
  }
}

export function r2bAdcCode(positive: R2bSignal, negative: R2bSignal): Byte {
  if (typeof positive !== 'number' || typeof negative !== 'number' || !Number.isFinite(positive) ||
    !Number.isFinite(negative) || Math.min(positive, negative) < 0 || Math.max(positive, negative) > 5) return 'X'
  return Math.max(-32768, Math.min(32767, Math.round((positive - negative) * 16000))) & 0xffff
}

function ads1115({ read, now }: Context): Device {
  let config = 0x8583
  let pointer = 0
  let phase = 0
  let high = 0
  let result: Byte = 0
  let sampled: Byte = 0
  let deadline = 0
  let issue: string | undefined
  let reading: Byte = 0

  function refresh() {
    if (deadline && now() >= deadline) { result = sampled; deadline = 0 }
  }
  return {
    select(write) {
      refresh()
      phase = 0
      if (!write) reading = pointer === 0 ? result : pointer === 1 ? (config & 0x7fff) | (deadline ? 0 : 0x8000) : 'X'
      return true
    },
    write(value) {
      if (phase++ === 0) { pointer = value; return pointer === 0 || pointer === 1 }
      if (pointer !== 1 || phase > 3) return false
      if (phase === 2) { high = value; return true }
      const word = (high << 8) | value
      if ((word & 0x0fe3) !== 0x0583) {
        issue = 'Chọn single-shot 128 SPS, PGA ±2,048 V và tắt comparator.'
        return false
      }
      issue = undefined
      config = word
      if (word & 0x8000 && !deadline) {
        const mux = (word >> 12) & 7
        const a = [0,0,1,2,0,1,2,3][mux]
        const b = [1,3,3,3][mux]
        sampled = r2bAdcCode(read('ain' + a), b === undefined ? 0 : read('ain' + b))
        if (sampled === 'X') issue = 'Đầu vào ADC cần ở 0–5 V.'
        deadline = now() + 7.8125
      }
      return true
    },
    read() { return reading === 'X' ? 'X' : phase++ % 2 === 0 ? reading >> 8 : reading & 255 },
    stop() {},
    reset() { config = 0x8583; pointer = phase = deadline = 0; result = reading = sampled = 0; issue = undefined },
    drives: () => [],
    issue: () => issue,
  }
}

function tca9548a(): Device {
  let mask = 0
  let pending: number | undefined
  return {
    select: () => true,
    write(value) { pending = value; return true },
    read: () => mask,
    stop() { if (pending !== undefined) mask = pending; pending = undefined },
    reset() { mask = 0; pending = undefined },
    drives: () => [],
    channelMask: () => mask,
  }
}

const factories = { pcf8574, mcp23017, '24lc256': eeprom, ads1115, tca9548a }
const baseAddress = { pcf8574:0x20, mcp23017:0x20, '24lc256':0x50, ads1115:0x48, tca9548a:0x70 }

export function createR2bI2cTarget(model: R2bI2cModel, context: Context) {
  const impl = factories[model](context)
  let active = false
  function powered() {
    const { read } = context
    const resetPin = model === 'mcp23017' || model === 'tca9548a'
    const on = read('vcc') === 5 && read('gnd') === 0 && (!resetPin || r2bBit(read('reset')) === 1)
    if (!on && active) impl.reset()
    active = on
    return on
  }
  return {
    model,
    address() {
      if (!powered()) return
      const suffix = model === 'ads1115'
        ? context.addressPin?.() ?? (context.read('addr') === 0 ? 0 : context.read('addr') === 5 ? 1 : 'X')
        : r2bAddress(['a0','a1','a2'].map(context.read))
      return suffix === 'X' ? undefined : baseAddress[model] + suffix
    },
    select: (write: boolean) => powered() && impl.select(write),
    write: (value: number) => powered() && Number.isInteger(value) && value >= 0 && value <= 255 && impl.write(value),
    read: (): Byte => powered() ? impl.read() : 'X',
    stop: () => { if (powered()) impl.stop() },
    drives: () => powered() ? impl.drives() : [],
    mask: () => powered() ? impl.channelMask?.() ?? 0 : 0,
    issue: () => impl.issue?.(),
  }
}

export type R2bTarget = ReturnType<typeof createR2bI2cTarget>
export type R2bBusEvent = { timeMs: number; bus: 'I²C' | 'SPI'; detail: string }
export const byteHex = (byte: number) => '0x' + byte.toString(16).toUpperCase().padStart(2, '0')

export function createR2bI2cBus(reachable: () => readonly R2bTarget[], report: (event: string) => void = () => {}) {
  let selected: R2bTarget[] = []
  const participants = new Set<R2bTarget>()
  let direction: 'read' | 'write' | undefined
  return {
    start(repeated: boolean) {
      if (!repeated) participants.clear()
      selected = []
      direction = undefined
      report(repeated ? 'REPEATED START' : 'START')
    },
    stop() {
      for (const device of participants) device.stop()
      selected = []
      participants.clear()
      direction = undefined
      report('STOP')
    },
    connect(address: number, write: boolean) {
      selected = [...new Set(reachable())].filter(device => device.address() === address && device.select(write))
      for (const device of selected) participants.add(device)
      direction = write ? 'write' : 'read'
      report(byteHex(address) + (write ? ' W ' : ' R ') + (selected.length ? 'ACK' : 'NACK'))
      return selected.length > 0
    },
    write(value: number) {
      const outcomes = direction === 'write' ? selected.map(device => device.write(value)) : []
      const ack = outcomes.some(Boolean)
      report('TX ' + byteHex(value) + (ack ? ' ACK' : ' NACK'))
      for (const device of selected) {
        const issue = device.issue()
        if (issue) report(issue)
      }
      return ack
    },
    read(ack: boolean): Byte {
      const values = direction === 'read' ? selected.map(device => device.read()) : []
      const bytes = values.filter((value): value is number => value !== 'X')
      const result = values.length && values.length === bytes.length ? bytes.reduce((a,b) => a & b, 255) : 'X'
      const collision = new Set(values).size > 1
      report('RX ' + (result === 'X' ? 'X' : byteHex(result)) + (ack ? ' ACK' : ' NACK') +
        (collision ? ' · phản hồi khác nhau trên bus open-drain' : ''))
      return result
    },
  }
}
