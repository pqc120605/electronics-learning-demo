import type { R2aModel } from '../data/catalogR2aParts'
import type { Logic } from './catalogR1Digital'

type Bit = Exclude<Logic, 'Z'>
type Read = (id: string) => Logic
export type R2aState = { clock: Bit; bits: readonly Bit[] }
type Step = { outputs: Record<string, Logic>; state?: R2aState }
const letters = 'abcdefgh'.split('')
const not = (a: Bit): Bit => a === 'X' ? 'X' : a === 0 ? 1 : 0
const and = (a: Bit, b: Bit): Bit => a === 0 || b === 0 ? 0 : a === 1 && b === 1 ? 1 : 'X'
const or = (a: Bit, b: Bit): Bit => not(and(not(a), not(b)))
const merge = (a: Bit, b: Bit): Bit => a === b ? a : 'X'
const choose = (select: Bit, low: Bit, high: Bit): Bit => select === 'X' ? merge(low, high) : select === 0 ? low : high

function selectData(select: readonly Bit[], data: (index: number) => Bit, start = 0): Bit {
  if (!select.length) return data(start)
  const [msb, ...rest] = select
  const offset = 1 << rest.length
  // Read just the selected input when the address is known.
  if (msb !== 'X') return selectData(rest, data, start + msb * offset)
  return merge(selectData(rest, data, start), selectData(rest, data, start + offset))
}

function selectedAddress(index: number, select: readonly Bit[]): Bit {
  return select.reduce<Bit>((matches, bit, shift) => and(matches, index & (1 << shift) ? bit : not(bit)), 1)
}

function rising(previous: Bit, current: Bit): Bit {
  return and(not(previous), current)
}

export function stepR2a(model: R2aModel, powered: boolean, read: Read, state?: R2aState): Step {
  const value = (id: string): Bit => {
    const signal = read(id)
    return signal === 'Z' ? 'X' : signal
  }
  const outputs: Record<string, Logic> = {}
  const emit = (id: string, signal: Logic) => { outputs[id] = powered ? signal : 'X' }

  switch (model) {
    case '02': case '04': case '32': case '86': case '125': case '126': {
      for (let i = 1; i <= (model === '04' ? 6 : 4); i++) {
        const a = value(i + 'a')
        const b = value(i + 'b')
        let signal: Logic
        switch (model) {
          case '02': signal = not(or(a, b)); break
          case '04': signal = not(a); break
          case '32': signal = or(a, b); break
          case '86': signal = a === 'X' || b === 'X' ? 'X' : a !== b ? 1 : 0; break
          default: {
            const oe = value(i + 'oe')
            signal = oe === 'X' ? 'X' : oe === (model === '125' ? 0 : 1) ? a : 'Z'
          }
        }
        emit(i + 'y', signal)
      }
      break
    }
    case '138': {
      const enabled = and(value('g1'), and(not(value('g2a')), not(value('g2b'))))
      const select = [value('a'), value('b'), value('c')]
      for (let i = 0; i < 8; i++) emit('y' + i, not(and(enabled, selectedAddress(i, select))))
      break
    }
    case '139': {
      for (const channel of [1, 2]) {
        const enabled = not(value(channel + 'g'))
        const select = [value(channel + 'a'), value(channel + 'b')]
        for (let i = 0; i < 4; i++) emit(channel + 'y' + i, not(and(enabled, selectedAddress(i, select))))
      }
      break
    }
    case '151': {
      const selected = selectData([value('c'), value('b'), value('a')], i => value('d' + i))
      const y = and(not(value('g')), selected)
      emit('y', y)
      emit('w', not(y))
      break
    }
    case '153': {
      for (const channel of [1, 2]) {
        const selected = selectData([value('b'), value('a')], i => value(channel + 'c' + i))
        emit(channel + 'y', and(not(value(channel + 'g')), selected))
      }
      break
    }
    case '157': {
      for (let i = 1; i <= 4; i++) {
        emit(i + 'y', and(not(value('g')), choose(value('sel'), value(i + 'a'), value(i + 'b'))))
      }
      break
    }
    case '164': case '165': {
      const clock = model === '165' ? or(value('clk'), value('clkinh')) : value('clk')
      const edge = rising(state?.clock ?? 'X', clock)
      const held = state?.bits ?? letters.map(() => 'X' as const)
      const serial = model === '165' ? value('ser') : and(value('a'), value('b'))
      const shifted = [serial, ...held.slice(0, 7)]
      const overridden = model === '165' ? letters.map(value) : letters.map(() => 0 as const)
      const control = model === '165' ? value('shld') : value('clr')
      const bits = held.map((bit, i) => powered ? choose(control, overridden[i], choose(edge, bit, shifted[i])) : 'X')
      if (model === '165') {
        emit('qh', bits[7])
        emit('qhn', not(bits[7]))
      } else {
        for (const [i, letter] of letters.entries()) emit('q' + letter, bits[i])
      }
      return { outputs, state: { clock: powered ? clock : 'X', bits } }
    }
    case '245': {
      const oe = value('oe')
      const dir = value('dir')
      for (let i = 1; i <= 8; i++) {
        emit('a' + i, oe === 1 ? 'Z' : oe === 'X' || dir === 'X' ? 'X' : dir === 0 ? value('b' + i) : 'Z')
        emit('b' + i, oe === 1 ? 'Z' : oe === 'X' || dir === 'X' ? 'X' : dir === 1 ? value('a' + i) : 'Z')
      }
      break
    }
  }
  return { outputs }
}
