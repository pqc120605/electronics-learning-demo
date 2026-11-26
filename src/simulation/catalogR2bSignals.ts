/** Voltage at a terminal in the bounded R2B models. */
export type R2bSignal = number | 'X' | 'Z'
export type ReadR2bPin = (pin: string) => R2bSignal
export type R2bMux = 'cd4051b' | 'cd74hc4067'

export function r2bBit(signal: R2bSignal, rail = 5): 0 | 1 | 'X' {
  if (typeof signal !== 'number' || !Number.isFinite(signal) || signal < 0 || signal > rail) return 'X'
  return signal <= 0.3 * rail ? 0 : signal >= 0.7 * rail ? 1 : 'X'
}

export function r2bAddress(bits: readonly R2bSignal[], rail = 5): number | 'X' {
  let address = 0
  for (const [i, signal] of bits.entries()) {
    const bit = r2bBit(signal, rail)
    if (bit === 'X') return 'X'
    address |= bit << i
  }
  return address
}

export function r2bJoin(a: R2bSignal, b: R2bSignal): R2bSignal {
  if (a === 'Z') return b
  if (b === 'Z') return a
  return a === b ? a : 'X'
}

export function selectR2bMux(model: R2bMux, read: ReadR2bPin): number | 'X' | 'Z' {
  if (read('vcc') !== 5 || read('gnd') !== 0 || (model === 'cd4051b' && read('vee') !== 0)) return 'X'
  const enable = r2bBit(read(model === 'cd4051b' ? 'inh' : 'en'))
  if (enable !== 0) return enable === 1 ? 'Z' : 'X'
  const pins = model === 'cd4051b' ? ['a','b','c'] : ['s0','s1','s2','s3']
  return r2bAddress(pins.map(read))
}

export function r2bMuxSignal(com: R2bSignal, channel: R2bSignal): R2bSignal {
  const inRange = (v: R2bSignal) => typeof v !== 'number' || (Number.isFinite(v) && v >= 0 && v <= 5)
  return inRange(com) && inRange(channel) ? r2bJoin(com, channel) : 'X'
}

function dacVoltage(word: number): R2bSignal {
  if ((word & 0xc000) !== 0) return 'X'
  if ((word & 0x1000) === 0) return 'Z'
  return (word & 0xfff) * 2.5 / 4096 * ((word & 0x2000) === 0 ? 2 : 1)
}

export function createR2bDac() {
  let cs: 0 | 1 | 'X' = 'X'
  let ldac: 0 | 1 | 'X' = 'X'
  let bytes: number[] = []
  let staged: R2bSignal = 'Z'
  let output: R2bSignal = 'Z'
  let valid = false
  let error: string | undefined

  function control(read: ReadR2bPin) {
    const nextCs = r2bBit(read('cs'))
    const nextLdac = r2bBit(read('ldac'))
    if (read('vcc') !== 5 || read('gnd') !== 0 || read('vref') !== 2.5) {
      cs = ldac = 'X'
      bytes = []
      staged = output = 'Z'
      valid = false
      error = 'DAC cần VDD 5 V, VREF 2,500 V và GND chung.'
      return
    }
    if (nextCs === 0 && cs !== 0) {
      bytes = []
      valid = true
      error = undefined
    }
    if (nextCs === 'X') valid = false
    if (cs === 0 && nextCs === 1) {
      if (valid && bytes.length === 2) {
        staged = dacVoltage((bytes[0] << 8) | bytes[1])
        if (staged === 'X') error = 'Từ lệnh DAC nằm ngoài cấu hình BUF=0.'
        if (nextLdac === 0) output = staged
      } else if (!error) error = 'DAC cần đúng một từ 16 bit trong mỗi lượt /CS.'
    }
    if (ldac !== 0 && nextLdac === 0 && nextCs === 1) output = staged
    cs = nextCs
    ldac = nextLdac
  }

  return {
    control,
    write(value: number, frequency: number, mode: number, msb: boolean) {
      if (cs !== 0 || !valid) return false
      if (frequency !== 1_000_000 || mode !== 0 || !msb || !Number.isInteger(value) || value < 0 || value > 255) {
        valid = false
        error = 'Dùng SPI mode 0, MSB-first, 1 MHz cho DAC R2B.'
        return false
      }
      if (bytes.length >= 2) valid = false
      else bytes.push(value)
      return valid
    },
    output: () => output,
    error: () => error,
  }
}

export function r2bCanDrive(power: R2bSignal, ground: R2bSignal, rs: R2bSignal, d: R2bSignal): R2bSignal {
  if (power !== 3.3 || ground !== 0) return 'Z'
  if (rs === 3.3) return 'Z'
  if (rs !== 0) return 'X'
  const bit = r2bBit(d, 3.3)
  return bit === 0 ? 2 : bit === 1 ? 'Z' : 'X'
}

export function r2bCanBus(activeDrivers: readonly R2bSignal[]): R2bSignal {
  if (activeDrivers.includes(2)) return 2
  return activeDrivers.includes('X') ? 'X' : 0
}

export function r2bCanReceive(power: R2bSignal, ground: R2bSignal, differential: R2bSignal): R2bSignal {
  if (power !== 3.3 || ground !== 0) return 'Z'
  if (typeof differential !== 'number' || !Number.isFinite(differential)) return 'X'
  return differential >= 0.9 ? 0 : differential <= 0.5 ? 3.3 : 'X'
}

export function r2bRs232(power: R2bSignal, ground: R2bSignal, din: R2bSignal, rin: R2bSignal): { tx: R2bSignal; rx: R2bSignal } {
  if (power !== 3.3 || ground !== 0) return { tx: 'Z' as const, rx: 'Z' as const }
  const bit = r2bBit(din, 3.3)
  return {
    tx: bit === 'X' ? 'X' : bit ? -5 : 5,
    rx: typeof rin !== 'number' || !Number.isFinite(rin) ? 'X' : rin <= -3 ? 3.3 : rin >= 3 ? 0 : 'X',
  }
}
