import type { CoupledCircuit, CoupledPart } from '../lib/freestyle/coupledCircuit'
import type { R2bModel } from '../data/catalogR2bParts'
import { createR2bI2cBus, createR2bI2cTarget, byteHex, type R2bBusEvent, type R2bI2cModel, type R2bTarget } from './catalogR2bI2c'
import { createR2bDac, type R2bSignal } from './catalogR2bSignals'

type Part = Extract<CoupledPart, { kind: 'r2b' }>
type NetPair = readonly [sda: string, scl: string]
const i2cModels: ReadonlySet<string> = new Set(['pcf8574','mcp23017','24lc256','ads1115','tca9548a'])
export const isR2bI2c = (model: R2bModel): model is R2bI2cModel => i2cModels.has(model)

export function createR2bCircuitInterface(graph: CoupledCircuit) {
  const parts = graph.parts.filter((part): part is Part => part.kind === 'r2b')
  const gpioNet = (pin: number) => graph.gpios.find(item => item.pin === pin)?.net
  const root = [gpioNet(18), gpioNet(19)] as const
  const clock = gpioNet(13)
  const data = gpioNet(11)
  const chipSelect = gpioNet(10)
  const latch = gpioNet(9)
  const rails = new Set(graph.rail5)
  const pullups = new Set<string>()
  for (const part of graph.parts) {
    if (part.kind !== 'resistor' || part.resistanceOhm !== 4700) continue
    if (rails.has(part.pins.a)) pullups.add(part.pins.b)
    if (rails.has(part.pins.b)) pullups.add(part.pins.a)
  }

  let external: ReadonlyMap<string, R2bSignal> = new Map()
  let sampled: ReadonlyMap<string, R2bSignal> = external
  let time = 0
  const trace: R2bBusEvent[] = []
  const report = (bus: R2bBusEvent['bus'], detail: string) => {
    if (trace.length >= 40) trace.shift()
    trace.push({ timeMs: time, bus, detail })
  }
  const supplyDefined = (part: Part) => rails.has(part.pins.vcc) && part.pins.gnd === graph.ground
  function read(part: Part, pin: string) {
    if (!supplyDefined(part) && (pin === 'vcc' || pin === 'gnd')) return 'X'
    // Port inputs are measured with the current device's own output bias removed.
    const io = (part.model === 'pcf8574' && /^p\d$/.test(pin)) ||
      (part.model === 'mcp23017' && /^gp[ab]\d$/.test(pin))
    return (io ? external : sampled).get(part.pins[pin]) ?? 'Z'
  }

  const targets = parts.flatMap(part => {
    if (!isR2bI2c(part.model)) return []
    const target = createR2bI2cTarget(part.model, {
      read: pin => read(part, pin), now: () => time,
      addressPin: () => part.pins.addr === part.pins.sda ? 2 : part.pins.addr === part.pins.scl ? 3
        : read(part, 'addr') === 0 ? 0 : read(part, 'addr') === 5 ? 1 : 'X',
    })
    const pair: NetPair = [part.pins.sda, part.pins.scl]
    return [{ part, target, pair }]
  })
  function validPair(pair: readonly (string | undefined)[]): pair is NetPair {
    const [sda, scl] = pair
    return Boolean(sda && scl && sda !== scl && pullups.has(sda) && pullups.has(scl) &&
      sampled.get(sda) === 5 && sampled.get(scl) === 5)
  }
  function reachable() {
    const found: R2bTarget[] = []
    const visited = new Set<string>()
    function visit(pair: readonly (string | undefined)[]) {
      if (!validPair(pair)) return
      const key = JSON.stringify(pair)
      if (visited.has(key)) return
      visited.add(key)
      for (const {part, target, pair: candidate} of targets) {
        if (pair[0] !== candidate[0] || pair[1] !== candidate[1] || target.address() === undefined) continue
        found.push(target)
        const mask = target.mask()
        for (let i = 0; i < 8; i++) if (mask & (1 << i)) visit([part.pins['sd'+i],part.pins['sc'+i]])
      }
    }
    visit(root)
    return found
  }
  const master = createR2bI2cBus(reachable, detail => report('I²C', detail))
  const dacs = parts.filter(part => part.model === 'mcp4921').map(part => ({ part, dac: createR2bDac() }))
  const validSpi = (part: Part) => Boolean(clock && data && chipSelect &&
    new Set([clock,data,chipSelect]).size === 3 &&
    part.pins.sck === clock && part.pins.sdi === data && part.pins.cs === chipSelect && (part.pins.ldac === graph.ground || (part.pins.ldac === latch && ![clock,data,chipSelect].includes(latch))))
  let allowedI2c = false

  return {
    hasI2c: targets.length > 0,
    hasSpi: dacs.length > 0,
    observeExternal(levels: ReadonlyMap<string,R2bSignal>, now: number) {
      external = levels
      sampled = levels
      time = now
    },
    observeFinal(levels: ReadonlyMap<string,R2bSignal>) { sampled = levels },
    drives() {
      const output: Array<{ net: string; voltage: R2bSignal; weak?: true }> = []
      for (const { part, target } of targets) {
        for (const drive of target.drives()) {
          const net = part.pins[drive.pin]
          if (net) output.push({ net, voltage:drive.value, weak:drive.weak })
        }
      }
      for (const { part, dac } of dacs) {
        dac.control(pin => read(part,pin))
        output.push({ net:part.pins.vout, voltage: validSpi(part) ? dac.output() : 'X' })
      }
      return output
    },
    i2c: {
      start(repeated: boolean, frequency = 100_000) {
        allowedI2c = frequency === 100_000 && validPair(root)
        if (!allowedI2c) report('I²C', 'Kiểm SDA A4, SCL A5, kéo lên 4,7 kΩ, nguồn và clock 100 kHz.')
        master.start(repeated)
      },
      stop() { master.stop(); allowedI2c = false },
      connect(address: number, write: boolean) {
        if (allowedI2c) {
          const ack = master.connect(address,write)
          if (!ack) report('I²C', 'Kiểm địa chỉ, dây SDA/SCL và nhánh đang mở. EEPROM có thể đang bận.')
          return ack
        }
        report('I²C', byteHex(address) + ' NACK · bus ngoài cấu hình')
        return false
      },
      write: (value: number) => allowedI2c && master.write(value),
      read: (ack: boolean) => allowedI2c ? master.read(ack) : 'X' as const,
    },
    spi(value: number, frequency: number, mode: number, msb: boolean) {
      const accepted = dacs.filter(item => validSpi(item.part)).map(({ dac }) => dac.write(value,frequency,mode,msb)).some(Boolean)
      report('SPI', byteHex(value) + (accepted ? ' · DAC nhận byte' : ' · kiểm SPI mode 0, 1 MHz, MSB-first, /CS và dây D9/D10/D11/D13'))
      return accepted
    },
    busEvents: () => [...trace],
    issues() {
      const errors: string[] = []
      for (const { part, target } of targets) {
        const issue = !supplyDefined(part) ? 'nối VCC 5 V và GND chung' : target.issue()
        if (issue) errors.push(part.id + ' · ' + issue)
      }
      for (const {part,dac} of dacs) {
        const issue = !validSpi(part) ? 'kiểm dây /LDAC D9, /CS D10, SDI D11 và SCK D13' : dac.error()
        if (issue) errors.push(part.id + ' · ' + issue)
      }
      return errors
    },
  }
}
