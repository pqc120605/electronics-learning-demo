import type { CircuitConnection, CircuitPart } from '../types/circuitTopology'

export type WorkspaceSimulationIdentityInput = {
  boardId: string
  lessonId: string
  code: string
  parts: readonly Pick<CircuitPart, 'id' | 'type' | 'value'>[]
  wires: readonly CircuitConnection[]
}

let runSequence = 0

/**
 * A deterministic UI revision token, not a security or electrical-validity hash.
 * Placement and camera state are intentionally excluded because they do not
 * change the simulated topology.
 */
export function createWorkspaceSimulationFingerprint(input: WorkspaceSimulationIdentityInput): string {
  const parts = [...input.parts]
    .map(part => ({ id: part.id, type: part.type, value: part.value ?? '' }))
    .sort((left, right) => left.id.localeCompare(right.id))
  const wires = [...input.wires]
    .map(wire => ({ id: wire.id, from: wire.from, to: wire.to }))
    .sort((left, right) => left.id.localeCompare(right.id))
  const source = JSON.stringify({ boardId: input.boardId, lessonId: input.lessonId, code: input.code, parts, wires })
  let hash = 0x811c9dc5
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `ws-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

/** Monotonic within this page lifetime so an old worker cannot update a newer run. */
export function createSimulationRunId(): string {
  runSequence += 1
  return `${Date.now().toString(36)}-${runSequence.toString(36)}`
}

export function isCurrentSimulationRun(messageRunId: string, currentRunId: string): boolean {
  return messageRunId.length > 0 && messageRunId === currentRunId
}
