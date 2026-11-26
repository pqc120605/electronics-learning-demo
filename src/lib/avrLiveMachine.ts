import {
  AVRADC, AVRIOPort, AVRTimer, AVRUSART, CPU, PinState, adcConfig, avrInstruction,
  portAConfig, portBConfig, portCConfig, portDConfig, portEConfig, portFConfig, portGConfig, portHConfig, portJConfig, portKConfig, portLConfig,
  timer0Config, timer1Config, timer2Config, usart0Config,
  type AVRPortConfig,
} from 'avr8js'
import { inspectIntelHex } from './intelHex'
import { attachR2bAvrBuses } from './avrR2bBuses'
import { createCoupledDigital, type CoupledFrame } from '../simulation/coupledDigital'
import type { CoupledCircuit, CircuitStimuli } from './freestyle/coupledCircuit'

/**
 * Máy AVR chạy liên tục cho bàn lắp mạch (2026-11-14): chạy firmware .hex thật do arduino-cli biên dịch
 * trên lõi avr8js, theo nhịp thời gian thực, nhận đầu vào digital/analog từ mạch và trả trạng thái chân.
 * Uno/Nano: ATmega328P. Mega 2560: ATmega2560 với bảng vector và chân riêng (A8–A15 chưa nối ADC vì
 * cấu hình ADC của avr8js chỉ có kênh 0–7).
 * Đây là mô phỏng lõi CPU + ngoại vi số, không mô phỏng điện.
 */
export type AvrLiveBoard = 'arduino-uno-r3' | 'arduino-nano' | 'arduino-mega-2560'
export type LivePinState = { mode: 'output' | 'input' | 'input_pullup'; level: boolean; pwm?: number; servoPulseUs?: number }
export type AvrLiveFrame = {
  pins: Record<number, LivePinState>
  serial: string
  simulatedMilliseconds: number
  cycles: number
  coupled?: CoupledFrame
}

type PortName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L'
type PinDef = { pin: number; port: PortName; bit: number; adc?: number }

const CLOCK_HZ = 16_000_000
const portConfigs: Record<PortName, AVRPortConfig> = { A: portAConfig, B: portBConfig, C: portCConfig, D: portDConfig, E: portEConfig, F: portFConfig, G: portGConfig, H: portHConfig, J: portJConfig, K: portKConfig, L: portLConfig }

const seq = (first: number, port: PortName, bits: number[], adcStart?: number): PinDef[] => bits.map((bit, index) => ({ pin: first + index, port, bit, ...(adcStart === undefined ? {} : { adc: adcStart + index }) }))

/** Arduino Uno/Nano: D0–D7 = PD0–7, D8–D13 = PB0–5, A0–A5 (14–19) = PC0–5. */
const atmega328Pins: PinDef[] = [...seq(0, 'D', [0, 1, 2, 3, 4, 5, 6, 7]), ...seq(8, 'B', [0, 1, 2, 3, 4, 5]), ...seq(14, 'C', [0, 1, 2, 3, 4, 5], 0)]

/** Arduino Mega 2560 theo bảng chân của core Arduino AVR (pins_arduino.h, biến thể "mega"). */
const atmega2560Pins: PinDef[] = [
  { pin: 0, port: 'E', bit: 0 }, { pin: 1, port: 'E', bit: 1 }, { pin: 2, port: 'E', bit: 4 }, { pin: 3, port: 'E', bit: 5 },
  { pin: 4, port: 'G', bit: 5 }, { pin: 5, port: 'E', bit: 3 }, { pin: 6, port: 'H', bit: 3 }, { pin: 7, port: 'H', bit: 4 },
  { pin: 8, port: 'H', bit: 5 }, { pin: 9, port: 'H', bit: 6 }, { pin: 10, port: 'B', bit: 4 }, { pin: 11, port: 'B', bit: 5 },
  { pin: 12, port: 'B', bit: 6 }, { pin: 13, port: 'B', bit: 7 }, { pin: 14, port: 'J', bit: 1 }, { pin: 15, port: 'J', bit: 0 },
  { pin: 16, port: 'H', bit: 1 }, { pin: 17, port: 'H', bit: 0 }, { pin: 18, port: 'D', bit: 3 }, { pin: 19, port: 'D', bit: 2 },
  { pin: 20, port: 'D', bit: 1 }, { pin: 21, port: 'D', bit: 0 },
  ...seq(22, 'A', [0, 1, 2, 3, 4, 5, 6, 7]),
  ...seq(30, 'C', [7, 6, 5, 4, 3, 2, 1, 0]),
  { pin: 38, port: 'D', bit: 7 }, { pin: 39, port: 'G', bit: 2 }, { pin: 40, port: 'G', bit: 1 }, { pin: 41, port: 'G', bit: 0 },
  ...seq(42, 'L', [7, 6, 5, 4, 3, 2, 1, 0]),
  { pin: 50, port: 'B', bit: 3 }, { pin: 51, port: 'B', bit: 2 }, { pin: 52, port: 'B', bit: 1 }, { pin: 53, port: 'B', bit: 0 },
  ...seq(54, 'F', [0, 1, 2, 3, 4, 5, 6, 7], 0),
  ...seq(62, 'K', [0, 1, 2, 3, 4, 5, 6, 7]),
]

type ChipProfile = { flashBytes: number; sramBytes: number; pins: PinDef[]; analogOnly?: Record<number, number>; vectors?: { t0: [number, number, number]; t1: [number, number, number, number]; t2: [number, number, number]; usart: [number, number, number]; adc: number } }

const chips: Record<AvrLiveBoard, ChipProfile> = {
  'arduino-uno-r3': { flashBytes: 32 * 1024, sramBytes: 2048, pins: atmega328Pins },
  'arduino-nano': { flashBytes: 32 * 1024, sramBytes: 2048, pins: atmega328Pins, analogOnly: { 20: 6, 21: 7 } },
  // ATmega2560: vector n nằm ở word 2n (mỗi vector 2 word). TIMER0 COMPA/B/OVF = 21/22/23, TIMER1 CAPT/COMPA/COMPB/OVF = 16/17/18/20,
  // TIMER2 COMPA/B/OVF = 13/14/15, USART0 RX/UDRE/TX = 25/26/27, ADC = 29.
  // SRAM của ATmega2560 bắt đầu ở 0x200 (sau vùng I/O mở rộng) nên mảng dữ liệu cần thêm 256 byte so với 328P.
  'arduino-mega-2560': { flashBytes: 256 * 1024, sramBytes: 8 * 1024 + 256, pins: atmega2560Pins, vectors: { t0: [0x2a, 0x2c, 0x2e], t1: [0x20, 0x22, 0x24, 0x28], t2: [0x1a, 0x1c, 0x1e], usart: [0x32, 0x34, 0x36], adc: 0x3a } },
}

export const avrLiveBoards = Object.keys(chips) as AvrLiveBoard[]
export function isAvrLiveBoard(value: string): value is AvrLiveBoard { return Object.hasOwn(chips, value) }

export function createAvrLiveMachine(hex: string, board: AvrLiveBoard, circuit?: { graph: CoupledCircuit; stimuli: CircuitStimuli }) {
  if (circuit && circuit.graph.board !== board) throw new Error('Board của mạch không khớp firmware AVR.')
  const coupling = circuit ? createCoupledDigital(circuit.graph, circuit.stimuli) : undefined
  let netDirty = Boolean(coupling)
  const chip = chips[board]
  const image = inspectIntelHex(hex, { maxBytes: chip.flashBytes })
  const flash = new Uint8Array(chip.flashBytes).fill(0xff)
  for (const segment of image.segments) {
    if (segment.address + segment.data.length > chip.flashBytes) throw new Error('Firmware vượt bộ nhớ flash của chip.')
    flash.set(segment.data, segment.address)
  }
  const program = new Uint16Array(chip.flashBytes / 2)
  for (let index = 0; index < program.length; index += 1) program[index] = flash[index * 2] | (flash[index * 2 + 1] << 8)

  const cpu = new CPU(program, chip.sramBytes)
  const usedPorts = [...new Set(chip.pins.map(pin => pin.port))]
  const ports = Object.fromEntries(usedPorts.map(name => [name, new AVRIOPort(cpu, portConfigs[name])])) as Partial<Record<PortName, AVRIOPort>>
  const v = chip.vectors
  if (v) {
    // Chân so sánh của ATmega2560: OC0A=PB7, OC0B=PG5, OC1A=PB5, OC1B=PB6, OC2A=PB4, OC2B=PH6.
    new AVRTimer(cpu, { ...timer0Config, compAInterrupt: v.t0[0], compBInterrupt: v.t0[1], ovfInterrupt: v.t0[2], compPortA: portBConfig.PORT, compPinA: 7, compPortB: portGConfig.PORT, compPinB: 5 })
    new AVRTimer(cpu, { ...timer1Config, captureInterrupt: v.t1[0], compAInterrupt: v.t1[1], compBInterrupt: v.t1[2], ovfInterrupt: v.t1[3], compPortA: portBConfig.PORT, compPinA: 5, compPortB: portBConfig.PORT, compPinB: 6 })
    new AVRTimer(cpu, { ...timer2Config, compAInterrupt: v.t2[0], compBInterrupt: v.t2[1], ovfInterrupt: v.t2[2], compPortA: portBConfig.PORT, compPinA: 4, compPortB: portHConfig.PORT, compPinB: 6 })
  } else {
    new AVRTimer(cpu, timer0Config)
    new AVRTimer(cpu, timer1Config)
    new AVRTimer(cpu, timer2Config)
  }
  const adc = new AVRADC(cpu, v ? { ...adcConfig, adcInterrupt: v.adc } : adcConfig)
  const usart = new AVRUSART(cpu, v ? { ...usart0Config, rxCompleteInterrupt: v.usart[0], dataRegisterEmptyInterrupt: v.usart[1], txCompleteInterrupt: v.usart[2] } : usart0Config, CLOCK_HZ)
  let serialBytes: number[] = []
  usart.onByteTransmit = (value) => { if (serialBytes.length < 8192) serialBytes.push(value & 0xff) }

  // Đo duty PWM theo thời gian HIGH trong cửa sổ giữa hai lần chụp trạng thái.
  type Track = { level: boolean; since: number; high: number; edges: number }
  const tracks = new Map<number, Track>()
  let windowStart = 0
  for (const name of usedPorts) {
    const port = ports[name]!
    const defs = chip.pins.filter(pin => pin.port === name)
    port.addListener(() => {
      if (coupling) netDirty = true
      for (const def of defs) {
        const level = port.pinState(def.bit) === PinState.High
        const track = tracks.get(def.pin)
        if (!track) { tracks.set(def.pin, { level, since: cpu.cycles, high: 0, edges: 0 }); continue }
        if (track.level === level) continue
        if (track.level) track.high += cpu.cycles - Math.max(track.since, windowStart)
        track.level = level
        track.since = cpu.cycles
        track.edges += 1
      }
    })
  }

  function pinStates(): Record<number, LivePinState> {
    const result: Record<number, LivePinState> = {}
    const windowCycles = Math.max(1, cpu.cycles - windowStart)
    for (const def of chip.pins) {
      const port = ports[def.port]!
      const config = portConfigs[def.port]
      const output = Boolean(cpu.data[config.DDR] & (1 << def.bit))
      const pullup = Boolean(cpu.data[config.PORT] & (1 << def.bit))
      const state = port.pinState(def.bit)
      if (!output && !pullup && state === PinState.Input && !wiredByNumber.has(def.pin)) continue
      const track = tracks.get(def.pin)
      let pwm: number | undefined
      if (output && track && track.edges >= 4) {
        const high = track.high + (track.level ? cpu.cycles - Math.max(track.since, windowStart) : 0)
        pwm = Math.min(1, Math.max(0, high / windowCycles))
      }
      result[def.pin] = { mode: output ? 'output' : pullup ? 'input_pullup' : 'input', level: output ? state === PinState.High : Boolean(cpu.data[config.PIN] & (1 << def.bit)), ...(pwm === undefined ? {} : { pwm }) }
    }
    for (const track of tracks.values()) { track.high = 0; track.edges = 0 }
    windowStart = cpu.cycles
    return result
  }

  const wiredPins = circuit ? chip.pins.filter(def => circuit.graph.gpios.some(gpio => gpio.pin === def.pin)) : []
  const wiredByNumber = new Map(wiredPins.map(def => [def.pin, def]))
  function settleCircuit() {
    if (!coupling || !netDirty) return
    netDirty = false
    const drives: Record<number, LivePinState> = {}
    for (const def of wiredPins) {
      const state = ports[def.port]!.pinState(def.bit)
      drives[def.pin] = { mode: state === PinState.InputPullUp ? 'input_pullup' : state === PinState.Input ? 'input' : 'output', level: state === PinState.High }
    }
    for (const input of coupling.step(drives, cpu.cycles / (CLOCK_HZ / 1000))) {
      const def = wiredByNumber.get(input.pin)!
      ports[def.port]!.setPin(def.bit, input.digital)
      if (def.adc !== undefined) adc.channelValues[def.adc] = input.analog * 5
    }
  }

  if (coupling?.interfaces) {
    attachR2bAvrBuses(cpu, coupling.interfaces, () => {
      netDirty = true
      settleCircuit()
    }, () => { netDirty = true })
  }

  return {
    board,
    setCircuitStimuli(values: CircuitStimuli) { coupling?.update(values); netDirty = Boolean(coupling) },
    /** Chạy thêm `milliseconds` thời gian mô phỏng (tối đa 250 ms mỗi lần gọi) và trả khung trạng thái. */
    runFor(milliseconds: number): AvrLiveFrame {
      const budget = Math.round(Math.min(250, Math.max(0, milliseconds)) * (CLOCK_HZ / 1000))
      const target = cpu.cycles + budget
      while (cpu.cycles < target) {
        if (netDirty) settleCircuit()
        avrInstruction(cpu)
        cpu.tick()
      }
      if (netDirty) settleCircuit()
      const serial = serialBytes.length ? new TextDecoder('utf-8').decode(new Uint8Array(serialBytes)) : ''
      serialBytes = []
      return { pins: pinStates(), serial, simulatedMilliseconds: cpu.cycles / (CLOCK_HZ / 1000), cycles: cpu.cycles, ...(coupling ? { coupled: coupling.snapshot() } : {}) }
    },
    setDigitalInput(pin: number, level: boolean) {
      const def = chip.pins.find(item => item.pin === pin)
      if (def) ports[def.port]!.setPin(def.bit, level)
    },
    /** `ratio` 0..1 của VCC 5 V. */
    setAnalogInput(pin: number, ratio: number) {
      const channel = chip.analogOnly?.[pin] ?? chip.pins.find(item => item.pin === pin)?.adc
      if (channel === undefined) return
      adc.channelValues[channel] = Math.min(1, Math.max(0, ratio)) * 5
    },
  }
}
