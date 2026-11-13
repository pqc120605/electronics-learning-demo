import type { CircuitWorkspaceDocument } from '../types/circuitWorkspace'
import type { CircuitConnection, CircuitEndpoint, CircuitPart } from '../types/circuitTopology'
import { createNetIndexV2 } from './circuitNetsV2'
import { layout2D, type Layout2DResult } from './layout2D'
import { migrateWorkspaceV1ToV2 } from './migrateV1toV2'
import { validateCircuitDoc, type CircuitDocV2, type CircuitPartV2 } from './circuitDocV2'

export type ProjectionIssue = {
  code: 'HOLE_ENDPOINT_UNRESOLVED' | 'LAYOUT_MISSING'
  message: string
  affectedIds: string[]
}

export type TopologyProjection = { parts: CircuitPart[]; connections: CircuitConnection[]; unresolved: ProjectionIssue[] }
export type LegacyDocResult =
  | { status: 'ok'; doc: CircuitDocV2; warnings: string[] }
  | { status: 'unsupported' | 'invalid'; reason: string }
export type LegacyWorkspaceResult =
  | { status: 'ok'; workspace: CircuitWorkspaceDocument; warnings: string[] }
  | { status: 'unsupported' | 'invalid'; reason: string }

function endpointFromKey(key: string): CircuitEndpoint | null {
  const separator = key.lastIndexOf(':')
  if (separator <= 0 || separator === key.length - 1) return null
  return { partId: key.slice(0, separator), pinId: key.slice(separator + 1) }
}

function valueLabel(part: CircuitPartV2): string | undefined {
  if (part.value?.label !== undefined) return part.value.label
  if (part.value?.ohm !== undefined) return `${part.value.ohm} Ω`
  if (part.value?.farad !== undefined) return `${part.value.farad} F`
  return undefined
}

function toDisplayPart(part: CircuitPartV2, layout: Layout2DResult, unresolved: ProjectionIssue[]): CircuitPart {
  const placement = layout.placements.find(item => item.partId === part.id)
  if (!placement) unresolved.push({ code: 'LAYOUT_MISSING', message: `Không có vị trí hiển thị cho linh kiện ${part.id}.`, affectedIds: [part.id] })
  const bounds = layout.bounds
  const spanX = Math.max(1, bounds.maxX - bounds.minX)
  const spanY = Math.max(1, bounds.maxY - bounds.minY)
  const x = placement ? 10 + ((placement.x - bounds.minX) / spanX) * 80 : 50
  const y = placement ? 10 + ((placement.y - bounds.minY) / spanY) * 80 : 50
  const assembly = part.mount.kind === 'breadboard'
    ? { kind: 'breadboard' as const, column: part.mount.col - 1, row: part.mount.row, rotation: part.mount.rotation }
    : undefined
  return {
    id: part.id,
    type: part.type,
    x,
    y,
    ...(placement ? { rotation: placement.rotation } : {}),
    ...(valueLabel(part) !== undefined ? { value: valueLabel(part) } : {}),
    ...(assembly ? { assembly } : {}),
  }
}

/** Projects electrical nets into the old pin-only view without inventing pin identities. */
export function projectDocToTopology(doc: CircuitDocV2, layout: Layout2DResult = layout2D(doc)): TopologyProjection {
  const unresolved: ProjectionIssue[] = []
  const parts = doc.parts.map(part => toDisplayPart(part, layout, unresolved))
  const index = createNetIndexV2(doc)
  const connections: CircuitConnection[] = []
  const parent = new Map<string, string>()
  const find = (key: string): string => {
    const current = parent.get(key)
    if (!current) { parent.set(key, key); return key }
    if (current !== key) parent.set(key, find(current))
    return parent.get(key) ?? key
  }
  const union = (left: string, right: string) => {
    const a = find(left), b = find(right)
    if (a !== b) parent.set(b, a)
  }

  for (const wire of doc.wires) {
    if (wire.from.kind === 'pin' && wire.to.kind === 'pin') {
      connections.push({ id: wire.id, from: { partId: wire.from.partId, pinId: wire.from.pinId }, to: { partId: wire.to.partId, pinId: wire.to.pinId } })
      union(`${wire.from.partId}:${wire.from.pinId}`, `${wire.to.partId}:${wire.to.pinId}`)
    }
  }

  for (const net of index.netsList()) {
    const endpoints = [...net.endpoints].sort((a, b) => a.localeCompare(b, 'en'))
    const explicitHoleWires = doc.wires.filter(wire =>
      (wire.from.kind === 'hole' && net.holes.has(wire.from.holeId))
      || (wire.to.kind === 'hole' && net.holes.has(wire.to.holeId)))
    if (explicitHoleWires.length && endpoints.length < 2) {
      unresolved.push({
        code: 'HOLE_ENDPOINT_UNRESOLVED',
        message: `Không thể biểu diễn net có lỗ breadboard này bằng kết nối chân duy nhất; cần giữ nguyên CircuitDocV2.`,
        affectedIds: [...new Set([...explicitHoleWires.map(wire => wire.id), ...net.holes])].sort((a, b) => a.localeCompare(b, 'en')),
      })
      continue
    }
    if (!net.holes.size || endpoints.length < 2) continue
    const anchor = endpoints[0]
    for (const endpoint of endpoints.slice(1)) {
      if (find(anchor) === find(endpoint)) continue
      const from = endpointFromKey(anchor), to = endpointFromKey(endpoint)
      if (!from || !to) {
        unresolved.push({ code: 'HOLE_ENDPOINT_UNRESOLVED', message: 'Endpoint chân không có khóa partId:pinId hợp lệ.', affectedIds: [anchor, endpoint] })
        continue
      }
      connections.push({ id: `projected:${encodeURIComponent(anchor)}>${encodeURIComponent(endpoint)}`, from, to })
      union(anchor, endpoint)
    }
  }

  for (const wire of doc.wires) for (const endpoint of [wire.from, wire.to]) {
    if (endpoint.kind !== 'hole' || index.netOf(endpoint.holeId)) continue
    unresolved.push({ code: 'HOLE_ENDPOINT_UNRESOLVED', message: `Không tìm thấy net cho endpoint lỗ ${endpoint.holeId}.`, affectedIds: [wire.id, endpoint.holeId] })
  }
  return { parts, connections, unresolved }
}

/** Reads schema-v4 workspaces through the existing migration without mutating storage or input. */
export function legacyWorkspaceToDoc(workspace: unknown, lessonId?: string): LegacyDocResult {
  const result = migrateWorkspaceV1ToV2(workspace, lessonId)
  if (result.status !== 'migrated') return { status: result.status, reason: result.reason }
  return { status: 'ok', doc: result.doc, warnings: result.warnings }
}

/** Converts only pin-addressed topology; hole endpoints must not be silently discarded. */
export function docToLegacyWorkspace(doc: CircuitDocV2, source: CircuitWorkspaceDocument): LegacyWorkspaceResult {
  const errors = validateCircuitDoc(doc).filter(issue => issue.severity === 'error')
  if (errors.length) return { status: 'invalid', reason: `CircuitDocV2 chưa hợp lệ: ${errors[0].message}` }
  const holeWire = doc.wires.find(wire => wire.from.kind === 'hole' || wire.to.kind === 'hole')
  if (holeWire) return { status: 'unsupported', reason: `Wire ${holeWire.id} dùng endpoint lỗ breadboard; schema workspace v4 chỉ lưu endpoint pin nên từ chối ghi mất topology.` }
  const layout = layout2D(doc)
  const projection = projectDocToTopology(doc, layout)
  if (projection.unresolved.length) return { status: 'unsupported', reason: projection.unresolved[0].message }
  return {
    status: 'ok',
    workspace: {
      ...structuredClone(source),
      schemaVersion: source.schemaVersion ?? 4,
      lesson: doc.lessonId,
      placed: projection.parts,
      wires: projection.connections,
    },
    warnings: [],
  }
}
