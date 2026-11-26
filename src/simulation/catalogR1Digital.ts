export type Logic = 0 | 1 | 'X' | 'Z'
type Driven = 0 | 1
const not = (value: Logic): Logic => value === 0 ? 1 : value === 1 ? 0 : 'X'
const rising = (previous: Logic, current: Logic) => previous === 0 && current === 1

export function andGate(powered: boolean, a: Logic, b: Logic): Logic {
  if (!powered) return 'X'
  if (a === 0 || b === 0) return 0
  return a === 1 && b === 1 ? 1 : 'X'
}

export function schmittInverter(powered: boolean, volts: number, last: Logic): Logic {
  if (!powered || !Number.isFinite(volts) || volts < 0 || volts > 4.5) return 'X'
  if (volts >= 2.5) return 0
  if (volts <= 1.6) return 1
  return last
}

type FlipFlop = { clk: Logic; q: Logic; qn: Logic; forcedBoth: boolean }
export const initialFlipFlop: FlipFlop = { clk: 'X', q: 'X', qn: 'X', forcedBoth: false }

export function advanceFlipFlop(state: FlipFlop, pins: { powered: boolean; clk: Logic; d: Logic; pre: Logic; clr: Logic }): FlipFlop {
  const { powered, clk, d, pre, clr } = pins
  if (!powered || (pre !== 0 && pre !== 1) || (clr !== 0 && clr !== 1)) return { ...initialFlipFlop, clk }
  if (pre === 0 && clr === 0) return { clk, q: 1, qn: 1, forcedBoth: true }
  if (clr === 0) return { clk, q: 0, qn: 1, forcedBoth: false }
  if (pre === 0) return { clk, q: 1, qn: 0, forcedBoth: false }
  if (state.forcedBoth || state.clk === 'X' && clk === 1) return { ...initialFlipFlop, clk }
  if (!rising(state.clk, clk)) return { ...state, clk }
  return { clk, q: d === 'Z' ? 'X' : d, qn: not(d), forcedBoth: false }
}

type ShiftRegister = { shift: Logic[]; stored: Logic[]; srclk: Logic; rclk: Logic }
const unknownByte = (): Logic[] => Array<Logic>(8).fill('X')
export function initialShiftRegister(): ShiftRegister {
  return { shift: unknownByte(), stored: unknownByte(), srclk: 'X', rclk: 'X' }
}

export function advanceShiftRegister(state: ShiftRegister, pins: {
  powered: boolean; ser: Logic; srclk: Logic; rclk: Logic; srclr: Logic; oe: Logic
}) {
  const { powered, ser, srclk, rclk, srclr, oe } = pins
  if (!powered) {
    const next = initialShiftRegister()
    return { next, q: next.stored, serial: 'X' as Logic }
  }
  const shifts = rising(state.srclk, srclk)
  const latches = rising(state.rclk, rclk)
  const shift = srclr === 0 ? Array<Logic>(8).fill(0)
    : srclr !== 1 || (srclk === 1 && state.srclk === 'X') ? unknownByte()
    : shifts ? [ser === 'Z' ? 'X' as const : ser, ...state.shift.slice(0, 7)] : state.shift
  // Tied clocks latch the previous shift register. SRCLR itself never clears the latch.
  const stored = latches ? srclr === 0 ? shift : state.shift
    : rclk === 1 && state.rclk === 'X' ? unknownByte() : state.stored
  const next = { shift, stored, srclk, rclk }
  const q = oe === 1 ? Array<Logic>(8).fill('Z') : oe === 0 ? stored : unknownByte()
  return { next, q, serial: shift[7] }
}

type Adc = { active: boolean; clock: Driven; command: Driven[]; remaining: Logic[]; dout: Logic; ready: boolean; rejection: boolean }
export const resetAdc = (): Adc => ({ active: false, clock: 0, command: [], remaining: [], dout: 'Z', ready: false, rejection: false })

export function advanceMcp3008(state: Adc, pins: {
  powered: boolean; cs: Driven; clock: Driven; din: Driven; channelVolts: readonly number[]
}): Adc {
  const { powered, cs, clock, din, channelVolts } = pins
  if (!powered || cs === 1) return { ...resetAdc(), ready: powered && cs === 1, clock }
  if (!state.ready) return { ...state, clock }
  const next = { ...state, clock, active: true }
  if (state.rejection) return next
  if (state.clock === 0 && clock === 1 && state.command.length < 6) {
    if (!state.command.length && din === 0) return next
    return { ...next, command: [...state.command, din] }
  }
  if (state.clock === 1 && clock === 0 && state.command.length === 6) {
    if (state.remaining.length || state.dout !== 'Z') {
      const [dout = 0, ...remaining] = state.remaining
      return { ...next, remaining, dout }
    }
    const [, single, d2, d1, d0] = state.command
    const volts = channelVolts[(d2 << 2) | (d1 << 1) | d0]
    if (single !== 1 || !Number.isFinite(volts) || volts < 0 || volts > 5) {
      return { ...next, rejection: true, dout: 'X' }
    }
    const code = Math.min(1023, Math.floor(1024 * volts / 5))
    const msb = Array.from({ length: 10 }, (_, i) => ((code >> (9 - i)) & 1) as Driven)
    return { ...next, dout: 0, remaining: [...msb, ...msb.slice(0, -1).reverse()] }
  }
  return next
}

export function captureMcp3008(channel: number, volts: readonly number[], powered: boolean, single: Driven = 1) {
  if (!Number.isInteger(channel) || channel < 0 || channel > 7) return { code: undefined, clocks: [] }
  let state = advanceMcp3008(resetAdc(), { powered, cs: 1, clock: 0, din: 0, channelVolts: volts })
  const command = [1, single, (channel >> 2) & 1, (channel >> 1) & 1, channel & 1, 0]
  const clocks = Array.from({ length: 17 }, (_, i) => {
    const din = (command[i] ?? 0) as Driven
    state = advanceMcp3008(state, { powered, cs: 0, clock: 1, din, channelVolts: volts })
    const sample = { atUs: i + 0.5, din, dout: state.dout }
    state = advanceMcp3008(state, { powered, cs: 0, clock: 0, din, channelVolts: volts })
    return sample
  })
  const incoming = clocks.slice(7).map(sample => sample.dout)
  const code = incoming.every(bit => bit === 0 || bit === 1) ? parseInt(incoming.join(''), 2) : undefined
  return { code, clocks }
}
