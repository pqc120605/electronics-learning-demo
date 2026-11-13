import { createNetIndexV2 } from './circuitNetsV2'
import { validateCircuitDoc, type CircuitDocDiagnostic, type CircuitDocV2, type CircuitPartV2 } from './circuitDocV2'
import type { CircuitEndpointV2 } from './circuitDocV2'

export type LayoutPoint = { x: number; y: number }
export type CircuitDocEditResult = { doc: CircuitDocV2; issues: CircuitDocDiagnostic[] }

/** Updates display coordinates separately; no CircuitDocV2 bytes or net membership change. */
export function movePartLayout(layout: Record<string, LayoutPoint>, partId: string, position: LayoutPoint): Record<string, LayoutPoint> {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return layout
  return { ...layout, [partId]: { x: position.x, y: position.y } }
}

function connectedNetCount(doc: CircuitDocV2): number {
  try {
    return createNetIndexV2(doc).netsList().filter(net => net.endpoints.size > 1 || net.wireIds.size > 0).length
  } catch {
    return 0
  }
}

function withCounts(doc: CircuitDocV2, parts = doc.parts, wires = doc.wires): CircuitDocV2 {
  const candidate = {
    ...doc,
    parts,
    wires,
    expect: { ...doc.expect, partCount: parts.length, wireCount: wires.length, netCount: 0 },
  }
  candidate.expect.netCount = connectedNetCount(candidate)
  return candidate
}

function validateEdit(original: CircuitDocV2, candidate: CircuitDocV2): CircuitDocEditResult {
  const issues = validateCircuitDoc(candidate)
  return issues.some(issue => issue.severity === 'error') ? { doc: original, issues } : { doc: candidate, issues }
}

export function addPart(doc: CircuitDocV2, part: CircuitPartV2): CircuitDocEditResult {
  return validateEdit(doc, withCounts(doc, [...doc.parts, structuredClone(part)]))
}

export function removePart(doc: CircuitDocV2, partId: string): CircuitDocEditResult {
  const part = doc.parts.find(item => item.id === partId)
  if (!part) return { doc, issues: [{ code: 'G1', severity: 'error', message: `Không tìm thấy linh kiện ${partId}.`, path: 'parts' }] }
  const wire = doc.wires.find(item => [item.from, item.to].some((endpoint: CircuitEndpointV2) => endpoint.kind === 'pin' && endpoint.partId === partId))
  if (wire) return { doc, issues: [{ code: 'G3', severity: 'error', message: `Không thể xóa ${partId}: dây ${wire.id} đang tham chiếu tới chân của linh kiện.`, path: `wires.${wire.id}` }] }
  const openPin = doc.openPins?.find(item => item.partId === partId)
  if (openPin) return { doc, issues: [{ code: 'G3', severity: 'error', message: `Không thể xóa ${partId}: openPins đang tham chiếu chân ${openPin.pinId}.`, path: 'openPins' }] }
  return validateEdit(doc, withCounts(doc, doc.parts.filter(item => item.id !== partId)))
}

export function addWire(doc: CircuitDocV2, wire: CircuitDocV2['wires'][number]): CircuitDocEditResult {
  return validateEdit(doc, withCounts(doc, doc.parts, [...doc.wires, structuredClone(wire)]))
}

export function removeWire(doc: CircuitDocV2, wireId: string): CircuitDocEditResult {
  if (!doc.wires.some(item => item.id === wireId)) return { doc, issues: [{ code: 'G1', severity: 'error', message: `Không tìm thấy dây ${wireId}.`, path: 'wires' }] }
  return validateEdit(doc, withCounts(doc, doc.parts, doc.wires.filter(item => item.id !== wireId)))
}

export function setPartValue(doc: CircuitDocV2, partId: string, value: CircuitPartV2['value']): CircuitDocEditResult {
  if (!doc.parts.some(item => item.id === partId)) return { doc, issues: [{ code: 'G1', severity: 'error', message: `Không tìm thấy linh kiện ${partId}.`, path: 'parts' }] }
  const parts = doc.parts.map(part => part.id === partId
    ? { ...part, ...(value === undefined ? { value: undefined } : { value: structuredClone(value) }) }
    : part)
  return validateEdit(doc, withCounts(doc, parts))
}

export function editWireEndpoint(doc: CircuitDocV2, wireId: string, end: 'from' | 'to', endpoint: CircuitEndpointV2): CircuitDocEditResult {
  const wire = doc.wires.find(item => item.id === wireId)
  if (!wire) return { doc, issues: [{ code: 'G1', severity: 'error', message: `Không tìm thấy dây ${wireId}.`, path: 'wires' }] }
  const wires = doc.wires.map(item => item.id === wireId ? { ...item, [end]: structuredClone(endpoint) } : item)
  return validateEdit(doc, withCounts(doc, doc.parts, wires))
}

export function setWireRole(doc: CircuitDocV2, wireId: string, role: 'power' | 'ground' | 'signal'): CircuitDocEditResult {
  const wire = doc.wires.find(item => item.id === wireId)
  if (!wire) return { doc, issues: [{ code: 'G1', severity: 'error', message: `Không tìm thấy dây ${wireId}.`, path: 'wires' }] }
  const wires = doc.wires.map(item => item.id === wireId ? { ...item, role } : item)
  return validateEdit(doc, withCounts(doc, doc.parts, wires))
}
