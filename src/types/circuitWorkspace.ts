import type { CircuitConnection, CircuitPart } from './circuitTopology'

/**
 * Legacy persisted learning-workspace shape; stable part/pin ids are the source
 * of connectivity. `simBoard` is a simulation-target id, not a full board/CAD
 * record, and this document is neither an EDA project nor a physical netlist.
 * Keep its existing JSON shape compatible until a versioned migration is designed.
 */
export type CircuitWorkspaceDocument = {
  schemaVersion?: number
  placed: Array<CircuitPart & { type: string }>
  wires: CircuitConnection[]
  simBoard?: string
  board?: string
  lesson?: string
  code?: string
  codeMode?: 'blocks' | 'cpp'
  blockProgram?: unknown
  analogCppDraft?: string
  analogMode?: 'blocks' | 'cpp'
  analogThreshold?: number
  analogBlockOrder?: string[]
  projectId?: string
  projectName?: string
  [extension: string]: unknown
}
