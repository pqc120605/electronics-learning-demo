import type { EducationalProgram } from '../lib/educationalProgram'

export type SimulationProviderKind =
  | 'educational-scenario'
  | 'code-subset-interpreter'
  | 'firmware-emulator'
  | 'circuit-solver'

/** Capabilities describe data a provider actually emits, not models present in the catalogue. */
export type SimulationCapability =
  | 'educational-trace'
  | 'virtual-inputs'
  | 'firmware-execution'
  | 'digital-pin-trace'
  | 'serial-output'
  | 'analog-waveform'

export type SimulationInstrumentId = 'digital-trace' | 'serial-monitor' | 'spice-waveform'

export type SimulationSessionStatus =
  | 'ready'
  | 'running'
  | 'completed'
  | 'stopped'
  | 'unsupported'
  | 'invalid'
  | 'timeout'
  | 'failed'

export type SimulationProviderDescriptor = {
  id: string
  name: string
  version: string
  kind: SimulationProviderKind
  runtime: 'browser' | 'worker' | 'remote'
  accuracyLabel: string
  supportedBoards: readonly string[] | 'dynamic'
  supportedLessons: readonly string[] | 'dynamic'
  capabilities: readonly SimulationCapability[]
  limitations: readonly string[]
}

export type SimulationRequest = {
  runId: string
  boardId: string
  lessonId: string
  circuitRevision: string
  workspaceFingerprint?: string
  inputs: Readonly<Record<string, number | boolean | string>>
  program?: EducationalProgram
}

export type SimulationTraceEvent = {
  sequence: number
  timeMs?: number
  unit?: string
  targetId?: string
  sourceKind?: 'educational-model' | 'firmware-emulator' | 'circuit-solver'
  kind: 'input' | 'gpio' | 'component' | 'message' | 'warning' | 'error'
  sourceId?: string
  pinId?: string
  value: number | boolean | string
  explanation: string
}

export type SimulationRunReport<State = unknown> = {
  provider: SimulationProviderDescriptor
  request: SimulationRequest
  status: Extract<SimulationSessionStatus, 'completed' | 'unsupported' | 'failed' | 'stopped' | 'timeout' | 'invalid'>
  state?: State
  trace: readonly SimulationTraceEvent[]
  warnings: readonly string[]
  assumptions: readonly string[]
}

/** Future stateful engines implement this contract; current educational providers can remain pure functions. */
export interface StatefulSimulationEngine<State = unknown> {
  readonly descriptor: SimulationProviderDescriptor
  load(request: SimulationRequest): Promise<void>
  setInput(name: string, value: number | boolean | string): Promise<void>
  step(): Promise<SimulationRunReport<State>>
  run(options?: { maxDurationMs?: number; maxEvents?: number }): Promise<SimulationRunReport<State>>
  stop(): Promise<void>
  getState(): Promise<State | undefined>
}
