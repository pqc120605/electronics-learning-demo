import type { BuilderLessonId } from '../data/builderLessons'
import type { WireFlow } from './logicTrace'

/** The subset of a simulation-provider frame this module reads. Every value comes from the engine. */
export type SignalFrame = {
  pin?: number
  level?: 'HIGH' | 'LOW'
  ledOn?: boolean
  digit?: number
  segments?: number[]
  analogPercent?: number
  events?: ReadonlyArray<{ kind: string; pin?: number; level?: string; line?: number }>
  motor?: { direction: string; enabled: boolean; pwm: number }
  loadEnabled?: boolean
  converter?: { input: number; output: number; mode: string }
}

export type SerialEntry = { atMs: number; text: string }
export type FlowLegendEntry = { wireId: string; label: string; signal: WireFlow['signal']; direction: WireFlow['direction'] }

const conceptLessons = new Set<BuilderLessonId>(['buck-boost-concept', 'dc-motor-driver', 'mosfet-switch', 'source-led'])

/** Concept lessons animate a teaching sequence, not an executed program; the UI must say "minh họa". */
export function isIllustrativeLesson(lessonId: BuilderLessonId) {
  return conceptLessons.has(lessonId)
}

/**
 * 1-based line of `code` matching the statement the current frame just executed.
 * Uses the parser's own source line when the frame carries one; otherwise finds the
 * digitalWrite that produces the frame's output level. Returns undefined when no line
 * can be tied to the frame (concept lessons, unrecognised code).
 */
export function activeCodeLine(code: string, frame: SignalFrame | null | undefined, lessonId: BuilderLessonId): number | undefined {
  if (!frame || isIllustrativeLesson(lessonId)) return undefined
  const write = frame.events?.find(event => event.kind === 'write')
  if (write?.line) return write.line
  const lines = code.split(/\r\n|\r|\n/)
  const find = (test: (line: string) => boolean) => { const index = lines.findIndex(test); return index < 0 ? undefined : index + 1 }
  const statement = (line: string) => line.replace(/\/\/.*$/, '')
  if (frame.segments) return find(line => /digitalWrite\s*\(\s*segPins/.test(statement(line)))
  if (!frame.level) return undefined
  const level = frame.level
  // Skip trigger writes: the LED/output write is the one that reflects the frame's level.
  return find(line => { const text = statement(line); return /digitalWrite\s*\(/.test(text) && !/trig/i.test(text) && new RegExp(`\\b${level}\\b`).test(text) })
}

/** One Serial-style line describing the frame's observable state; identical frames give identical text. */
export function describeSignalFrame(frame: SignalFrame | null | undefined, lessonId: BuilderLessonId, distanceCm?: number): string | undefined {
  if (!frame) return undefined
  if (frame.motor) return `[minh họa] TB6612 · ${frame.motor.direction} · PWMA ${frame.motor.pwm}% · STBY ${frame.motor.enabled ? 'HIGH' : 'LOW'}`
  if (frame.loadEnabled !== undefined) return `[minh họa] Gate ${frame.loadEnabled ? 'HIGH · MOSFET dẫn, tải chạy' : 'LOW · MOSFET ngắt, tải dừng'}`
  if (frame.converter) return `[minh họa] ${frame.converter.mode} · VIN ${frame.converter.input.toFixed(1)} V → VOUT mục tiêu ${frame.converter.output.toFixed(1)} V`
  if (lessonId === 'source-led') return `[minh họa] Nguồn DC → điện trở → LED ${frame.ledOn ? 'sáng' : 'tắt'} → cực âm`
  if (frame.segments) return `Hiển thị ${frame.digit ?? 0} · A–G = ${frame.segments.join('')}`
  const led = `LED ${frame.ledOn ? 'sáng' : 'tắt'}`
  const out = frame.pin !== undefined && frame.level ? `digitalWrite(${frame.pin}, ${frame.level})` : undefined
  const read = frame.events?.find(event => event.kind === 'read')
  if (read && read.pin !== undefined) return `digitalRead(${read.pin}) = ${read.level} → ${out ?? ''} · ${led}`
  if (frame.analogPercent !== undefined) return `analogRead → ${frame.analogPercent.toFixed(0)}% → ${out ?? ''} · ${led}`
  if (lessonId === 'ultrasonic-distance' && distanceCm !== undefined) return `pulseIn(ECHO) ≈ ${distanceCm} cm → ${out ?? ''} · ${led}`
  return out ? `${out} · ${led}` : undefined
}

/** Appends `text` when it differs from the last entry; keeps the newest `limit` lines. */
export function appendSerial(log: readonly SerialEntry[], atMs: number, text: string | undefined, limit = 12): SerialEntry[] {
  if (!text || log[log.length - 1]?.text === text) return log as SerialEntry[]
  return [...log, { atMs, text }].slice(-limit)
}

/** One legend row per distinct labelled net, in wire order. */
export function flowLegend(flows: ReadonlyMap<string, WireFlow>): FlowLegendEntry[] {
  const seen = new Set<string>()
  const rows: FlowLegendEntry[] = []
  for (const [wireId, flow] of flows) {
    if (!flow.label) continue
    const key = `${flow.signal}:${flow.label}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ wireId, label: flow.label, signal: flow.signal, direction: flow.direction })
  }
  return rows
}
