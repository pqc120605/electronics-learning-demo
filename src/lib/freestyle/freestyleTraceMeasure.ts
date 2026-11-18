import type { TraceSample } from './freestyleTrace'

export type SampledCursor = { atMs: number; level: 'HIGH' | 'LOW' | 'UNKNOWN'; pwm?: number }
export type SampledCursorMeasurement =
  | { status: 'ok'; a: SampledCursor; b: SampledCursor; deltaMs: number }
  | { status: 'empty' | 'invalid-trace' | 'missing-cursor' }

/** Strict chronology does not certify continuous signal coverage. */
export function isValidSampledTrace(samples: unknown): samples is TraceSample[] {
  if (!Array.isArray(samples)) return false
  let previous = -1
  for (const sample of samples) {
    if (!sample || !Number.isFinite(sample.atMs) || sample.atMs < 0 || sample.atMs <= previous ||
      !sample.pins || typeof sample.pins !== 'object' || Array.isArray(sample.pins)) return false
    previous = sample.atMs
  }
  return true
}

/** Exact snapshots only: never infer edges, frequency, duty or volts. */
export function measureSampledCursors(samples: unknown, pin: number, aMs: number, bMs: number): SampledCursorMeasurement {
  if (!isValidSampledTrace(samples)) return { status: 'invalid-trace' }
  if (!samples.length) return { status: 'empty' }
  const a = samples.find(sample => sample.atMs === aMs), b = samples.find(sample => sample.atMs === bMs)
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs) || !a || !b) return { status: 'missing-cursor' }
  const read = (sample: TraceSample): SampledCursor => {
    const state = sample.pins[pin]
    const level = typeof state?.level === 'boolean' ? state.level ? 'HIGH' : 'LOW' : 'UNKNOWN'
    const pwm = state?.pwm
    return { atMs: sample.atMs, level, ...(typeof pwm === 'number' && Number.isFinite(pwm) && pwm >= 0 && pwm <= 1 ? { pwm } : {}) }
  }
  return { status: 'ok', a: read(a), b: read(b), deltaMs: Math.abs(bMs - aMs) }
}
