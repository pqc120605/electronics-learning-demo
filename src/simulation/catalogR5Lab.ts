import type { R5Model } from '../data/catalogR5Parts'
import type { CircuitDocV2 } from '../lib/circuitDocV2'
import { compileR5Analog } from './catalogR5Analog'
import { createR5Circuit, needR5, type R5Circuit } from './catalogR5Circuit'
import { r5Reading, runR5Driver } from './catalogR5Drivers'

export const r5Modes = {
  lm386: [['measure', 'Đo quá độ ngspice']],
  ne5532: [['measure', 'Đo quá độ ngspice']],
  max98357a: [['left', 'Kênh trái'], ['right', 'Kênh phải'], ['mix', 'Trộn L/R'], ['sleep', 'Tắt'],
    ['early', 'DIN lệch một nhịp']],
  tpa2012d2: [['g4', '4×'], ['g8', '8×'], ['g2', '2×'], ['g16', '16×'], ['left-off', 'Tắt trái'], ['right-off', 'Tắt phải']],
  l293d: [['locked', 'Khóa trục'], ['forward', 'Thuận'], ['reverse', 'Ngược'], ['independent', 'A thuận · B ngược'],
    ['brake', 'Phanh 00'], ['brake-high', 'Phanh 11'], ['coast', 'Tắt EN']],
  drv8833: [['locked', 'Khóa trục'], ['forward', 'Thuận'], ['reverse', 'Ngược'], ['independent', 'A thuận · B ngược'],
    ['brake', 'Phanh'], ['coast', 'Thả trôi'], ['sleep', 'Ngủ và thức']],
  drv8825: [['home', 'Home'], ['full', 'Full step'], ['half', 'Half step'], ['eighth', '1/8 step'],
    ['dir', 'DIR ngược'], ['disable', 'Ngắt cầu'], ['reset', 'Reset về home']],
  uln2003a: [['first', 'Kênh 1'], ['last', 'Kênh 7']],
  uln2803a: [['first', 'Kênh 1'], ['last', 'Kênh 8']],
  drv8871: [['locked', 'Khóa trục'], ['forward', 'Thuận'], ['reverse', 'Ngược'], ['brake', 'Phanh'],
    ['coast', 'Thả trôi'], ['sleep', 'Ngủ và thức']],
} as const satisfies Record<R5Model, ReadonlyArray<readonly [string, string]>>

const horizon = 48
export function r5I2sFrame(early: boolean) {
  const words = Array.from({ length: horizon }, (_, index) => {
    const sample = Math.sin(2 * Math.PI * index / horizon)
    return [Math.round(8192 * sample), Math.round(-4096 * sample)]
  }).flat()
  const bits = words.flatMap(word => Array.from({ length: 16 }, (_, index) => (word >> (15 - index)) & 1))
  // LRCLK changes one BCLK before the first data bit. The one-period pattern wraps exactly.
  const din = early ? bits : [bits[bits.length - 1], ...bits.slice(0, -1)]
  const reconstructed = words.map((_, index) => {
    let word = 0
    for (let bit = 1; bit <= 16; bit++) word = (word << 1) | din[(index * 16 + bit) % din.length]
    return word >= 0x8000 ? word - 0x10000 : word
  })
  return Array.from({ length: horizon }, (_, index) => ({ left: reconstructed[index * 2], right: reconstructed[index * 2 + 1] }))
}

function max98357a(c: R5Circuit, mode: string) {
  const { pin, gnd } = c
  c.rail('vdd', 5); c.rail('vdd8', 5)
  c.controlRail(3.3)
  for (const signal of ['din', 'bclk', 'lrclk', 'sd']) c.signal(signal)
  const a = pin('outp'), b = pin('outn')
  c.load(a, b, 'OUTP–OUTN', 'speaker')
  const gain = !c.wired(c.partId, 'gain') ? 9 : pin('gain') === gnd ? 12 : c.voltage(pin('gain')) === 5 ? 6 : undefined
  needR5(gain !== undefined, 'GAIN_SLOT phải hở, nối GND hoặc VDD theo bài thử.')
  const sd = mode === 'right' ? 1.05 : mode === 'mix' ? 0.45 : mode === 'sleep' ? 0 : 3.3
  const toVolts = 2 * 10 ** ((gain - 9) / 20)
  const samples = r5I2sFrame(mode === 'early').map(({ left, right }, index) => ({
    timeMs: index / 48,
    values: { left, right, v: toVolts * (sd === 3.3 ? left : sd === 1.05 ? right : sd === 0.45 ? (left + right) / 2 : 0) / 32768 },
  }))
  const peak = Math.max(...samples.map(item => Math.abs(item.values.v)))
  const quarter = samples[12].values
  return r5Reading('I²S 16 bit · ' + gain + ' dB · loa ' + peak.toFixed(3) + ' V đỉnh' +
    (sd === 0 ? ' · shutdown' : ''), { speaker: peak, gain, sd, pcmLeft: quarter.left, pcmRight: quarter.right }, samples)
}

function tpa2012d2(c: R5Circuit, mode: string) {
  const { pin } = c
  for (const name of ['avdd', 'pvdd', 'pvdd13']) c.rail(name, 5)
  c.controlRail(5)
  for (const signal of ['g1', 'g0', 'sdl', 'sdr']) c.signal(signal)
  const outputs = ['outlp', 'outln', 'outrp', 'outrn'].map(pin)
  needR5(new Set(outputs).size === 4, 'Hai kênh BTL phải có bốn ngõ ra độc lập.')
  c.load(outputs[0], outputs[1], 'loa trái BTL', 'speaker')
  c.load(outputs[2], outputs[3], 'loa phải BTL', 'speaker')
  const g1 = mode === 'g8' || mode === 'g16' ? 1 : 0
  const g0 = mode === 'g2' || mode === 'g8' ? 0 : 1
  const gain = 2 << (g1 * 2 + g0)
  const peaks = ['inlp', 'inln', 'inrp', 'inrn'].map(name => c.coupledSine(pin(name), 1e-6))
  const left = mode === 'left-off' ? 0 : (peaks[0] - peaks[1]) * gain
  const right = mode === 'right-off' ? 0 : (peaks[2] - peaks[3]) * gain
  needR5(Math.max(Math.abs(left), Math.abs(right)) < 5, 'Biên độ BTL nằm ngoài rail 5 V của bài thử.')
  const samples = Array.from({ length: 49 }, (_, index) => {
    const sine = Math.sin(Math.PI * index / 24)
    return { timeMs: index / 48, values: { left: left * sine, right: right * sine } }
  })
  return r5Reading('BTL ' + gain + '× · trái ' + Math.abs(left).toFixed(3) + ' V · phải ' +
    Math.abs(right).toFixed(3) + ' V đỉnh', { left: Math.abs(left), right: Math.abs(right), gain, g0, g1 }, samples)
}

export function measureR5(doc: CircuitDocV2, partId: string, mode?: string) {
  try {
    const c = createR5Circuit(doc, partId)
    const modes = r5Modes[c.model.catalogId]
    const selection = mode ?? modes[0][0]
    if (!(modes as ReadonlyArray<readonly [string, string]>).some(([id]) => id === selection)) {
      throw new Error('Chế độ thử này chưa được hỗ trợ cho ' + c.model.mpn + '.')
    }
    switch (c.model.catalogId) {
      case 'lm386':
      case 'ne5532': return compileR5Analog(c)
      case 'max98357a': return max98357a(c, selection)
      case 'tpa2012d2': return tpa2012d2(c, selection)
      default: return runR5Driver(c, selection)
    }
  } catch (error) {
    return { ok: false as const, kind: 'unavailable' as const, text: error instanceof Error ? error.message : 'Không đo được mạch R5.' }
  }
}
