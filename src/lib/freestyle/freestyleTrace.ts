import type { LivePinState } from '../avrLiveMachine'
export type TraceSample = { atMs: number; pins: Record<number, LivePinState> }
export const MAX_TRACE_SAMPLES = 512
export function traceChannels(samples: TraceSample[], preferred: readonly number[] = [], focus?: number): number[] {
  const observed=new Set(samples.flatMap(sample=>Object.keys(sample.pins).map(Number)))
  return [...new Set([...(focus===undefined?[]:[focus]),...preferred,...[...observed].sort((a,b)=>a-b)])].filter(pin=>observed.has(pin)).slice(0,8)
}
/** Runtime snapshots only. A PWM duty value is metadata, never permission to synthesize edges. */
export function appendTrace(history: TraceSample[], frame: { pins: Record<number, LivePinState>; simulatedMilliseconds: number }): TraceSample[] {
  const atMs = frame.simulatedMilliseconds
  if (!Number.isFinite(atMs) || atMs < 0 || (history.length && atMs < history[history.length - 1].atMs)) return history
  const sample = { atMs, pins: Object.fromEntries(Object.entries(frame.pins).slice(0, 80).map(([pin, state]) => [pin, { ...state }])) }
  const prefix = history.at(-1)?.atMs === atMs ? history.slice(0, -1) : history
  return [...prefix.slice(-(MAX_TRACE_SAMPLES - 1)), sample]
}
/** Paths stop at missing states. X is normalized to 0..1000; Y is logical HIGH/LOW, not volts. */
export function tracePath(samples: TraceSample[], pin: number, start: number, end: number): string {
  let path = '', previous: number | undefined
  for (const sample of samples) {
    const state = sample.pins[pin]
    if (!state) { previous = undefined; continue }
    const x = (sample.atMs - start) / Math.max(1, end - start) * 1000, y = state.level ? 18 : 54
    path += previous === undefined ? `M${x} ${y}` : `H${x}V${y}`
    previous = y
  }
  return path
}
