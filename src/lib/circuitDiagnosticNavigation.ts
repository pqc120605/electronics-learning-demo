import { componentRegistry } from '../data/componentRegistry'
import type { CircuitDocV2 } from './circuitDocV2'
import type { CircuitDiagnosticAction, CircuitGateId, CircuitGateReport } from './circuitGates'
import { createNetIndexV2 } from './circuitNetsV2'

export type CircuitDiagnosticContext = { doc: CircuitDocV2; report: CircuitGateReport; boardId: string; lessonId: string }
export type CircuitDiagnosticRequest = CircuitDiagnosticContext & { gateId: CircuitGateId; action: CircuitDiagnosticAction }
export type CircuitDiagnosticSelection =
  | { kind: 'endpoint'; endpointKey: string; partId: string }
  | { kind: 'wire'; wireId: string; netKey: string | null }
  | { kind: 'part'; partId: string }

/** Resolve only a finding issued by the current report; never infer identity from display text. */
export function resolveCircuitDiagnostic(current: CircuitDiagnosticContext, request: CircuitDiagnosticRequest): CircuitDiagnosticSelection | null {
  if (current.doc !== request.doc || current.report !== request.report || current.boardId !== request.boardId || current.lessonId !== request.lessonId) return null
  const gate = current.report.gates.find(gate => gate.id === request.gateId)
  const { action } = request
  if (!gate?.diagnosticActions?.some(candidate => candidate.diagnosticIndex === action.diagnosticIndex && candidate.nextStep === action.nextStep && JSON.stringify(candidate.target) === JSON.stringify(action.target)) || !gate.diagnostics[action.diagnosticIndex]) return null
  const target = action.target
  if (target.kind === 'wire') {
    const wire = current.doc.wires.find(wire => wire.id === target.wireId)
    if (!wire) return null
    const key = wire.from.kind === 'pin' ? `${wire.from.partId}:${wire.from.pinId}` : wire.from.holeId
    return { kind: 'wire', wireId: wire.id, netKey: createNetIndexV2(current.doc).netOf(key)?.key ?? null }
  }
  const partId = target.kind === 'part' ? target.partId : target.endpoint.partId
  const part = current.doc.parts.find(part => part.id === partId)
  if (!part) return null
  if (target.kind === 'part') return { kind: 'part', partId }
  if (!componentRegistry.find(definition => definition.id === part.type)?.pins.some(pin => pin.id === target.endpoint.pinId)) return null
  return { kind: 'endpoint', partId, endpointKey: `${partId}:${target.endpoint.pinId}` }
}
