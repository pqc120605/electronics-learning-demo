import { componentRegistry } from '../data/componentRegistry'
import { canMount, occupancy, resolvePartGeometry, type CircuitRegistryEntry, type GeometrySource } from './mountResolve'
import { formatHole, parseHole } from './breadboardGrid'

export type CircuitMountV2 =
  | { kind: 'breadboard'; board: 'bb1'; col: number; row: number; rotation: 0 | 90 | 180 | 270 }
  | { kind: 'bench'; lane: 'left' | 'right' | 'bottom'; order: number }

export type CircuitPartV2 = {
  id: string
  type: string
  value?: { ohm?: number; farad?: number; label?: string }
  mount: CircuitMountV2
  intentionalShort?: boolean
  geometrySource?: GeometrySource
}

export type CircuitEndpointV2 =
  | { kind: 'pin'; partId: string; pinId: string }
  | { kind: 'hole'; holeId: string }

export type CircuitDocV2 = {
  schema: 2
  lessonId: string
  breadboards: Array<{ id: 'bb1'; spec: '400-30'; railSplit: boolean }>
  parts: CircuitPartV2[]
  wires: Array<{ id: string; from: CircuitEndpointV2; to: CircuitEndpointV2; role?: 'power' | 'ground' | 'signal' }>
  openPins?: Array<{ partId: string; pinId: string; reason: string }>
  expect: { partCount: number; wireCount: number; netCount: number; steps?: string[] }
}

export type CircuitDocGate = 'G1' | 'G2' | 'G3' | 'G4'
export type CircuitDocDiagnostic = { code: CircuitDocGate; severity: 'error' | 'warning'; message: string; path?: string }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const makeIssue = (code: CircuitDocGate, severity: CircuitDocDiagnostic['severity'], message: string, path?: string): CircuitDocDiagnostic => ({ code, severity, message, ...(path ? { path } : {}) })
const validId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function validMount(mount: unknown): mount is CircuitMountV2 {
  if (!isRecord(mount)) return false
  if (mount.kind === 'bench') return ['left', 'right', 'bottom'].includes(String(mount.lane)) && Number.isInteger(mount.order) && Number(mount.order) >= 0
  if (mount.kind === 'breadboard') return mount.board === 'bb1'
    && Number.isInteger(mount.col) && Number(mount.col) >= 1 && Number(mount.col) <= 30
    && Number.isInteger(mount.row) && Number(mount.row) >= 0 && Number(mount.row) < 10
    && [0, 90, 180, 270].includes(Number(mount.rotation))
  return false
}

function validEndpoint(endpoint: unknown): endpoint is CircuitEndpointV2 {
  if (!isRecord(endpoint)) return false
  if (endpoint.kind === 'pin') return validId(endpoint.partId) && validId(endpoint.pinId)
  return endpoint.kind === 'hole' && typeof endpoint.holeId === 'string'
}

export function validateCircuitDoc(value: unknown, registry: readonly CircuitRegistryEntry[] = componentRegistry): CircuitDocDiagnostic[] {
  const issues: CircuitDocDiagnostic[] = []
  if (!isRecord(value)) return [makeIssue('G1', 'error', 'CircuitDocV2 phải là một object.')]
  const doc = value as unknown as CircuitDocV2
  if (doc.schema !== 2) issues.push(makeIssue('G1', 'error', 'schema phải bằng 2.', 'schema'))
  if (!validId(doc.lessonId)) issues.push(makeIssue('G1', 'error', 'lessonId không được để trống.', 'lessonId'))
  if (!Array.isArray(doc.breadboards) || doc.breadboards.length > 1) issues.push(makeIssue('G1', 'error', 'breadboards phải là mảng có tối đa một bo ở slice này.', 'breadboards'))
  else for (const [index, board] of doc.breadboards.entries()) {
    if (!isRecord(board) || board.id !== 'bb1' || board.spec !== '400-30' || typeof board.railSplit !== 'boolean') issues.push(makeIssue('G1', 'error', 'Mỗi breadboard phải có id bb1, spec 400-30 và railSplit boolean.', `breadboards[${index}]`))
  }
  if (!Array.isArray(doc.parts)) issues.push(makeIssue('G1', 'error', 'parts phải là mảng.', 'parts'))
  if (!Array.isArray(doc.wires)) issues.push(makeIssue('G1', 'error', 'wires phải là mảng.', 'wires'))
  if (doc.openPins !== undefined && !Array.isArray(doc.openPins)) issues.push(makeIssue('G1', 'error', 'openPins nếu có phải là mảng.', 'openPins'))
  if (!isRecord(doc.expect)
    || !Number.isInteger(doc.expect.partCount) || Number(doc.expect.partCount) < 0
    || !Number.isInteger(doc.expect.wireCount) || Number(doc.expect.wireCount) < 0
    || !Number.isInteger(doc.expect.netCount) || Number(doc.expect.netCount) < 0
    || (doc.expect.steps !== undefined && (!Array.isArray(doc.expect.steps) || doc.expect.steps.some(step => typeof step !== 'string')))) {
    issues.push(makeIssue('G1', 'error', 'expect cần partCount, wireCount, netCount không âm và steps dạng chuỗi nếu có.', 'expect'))
  }
  if (!Array.isArray(doc.parts) || !Array.isArray(doc.wires) || !isRecord(doc.expect)) return issues

  const ids = new Set<string>()
  for (const board of Array.isArray(doc.breadboards) ? doc.breadboards : []) {
    if (isRecord(board) && validId(board.id)) ids.add(board.id)
  }
  for (const [index, part] of doc.parts.entries()) {
    const path = `parts[${index}]`
    if (!isRecord(part) || !validId(part.id) || !validId(part.type) || !validMount(part.mount)) {
      issues.push(makeIssue('G1', 'error', 'Part cần id, type và mount hợp lệ theo schema v2.', path))
      continue
    }
    if (ids.has(part.id)) issues.push(makeIssue('G1', 'error', `ID “${part.id}” bị trùng.`, `${path}.id`))
    ids.add(part.id)
    if (part.value !== undefined && (!isRecord(part.value)
      || (part.value.ohm !== undefined && (typeof part.value.ohm !== 'number' || !Number.isFinite(part.value.ohm)))
      || (part.value.farad !== undefined && (typeof part.value.farad !== 'number' || !Number.isFinite(part.value.farad)))
      || (part.value.label !== undefined && typeof part.value.label !== 'string'))) {
      issues.push(makeIssue('G1', 'error', 'value chỉ nhận ohm/farad hữu hạn hoặc label chuỗi.', `${path}.value`))
    }
    if (part.intentionalShort !== undefined && typeof part.intentionalShort !== 'boolean') issues.push(makeIssue('G1', 'error', 'intentionalShort nếu có phải là boolean.', `${path}.intentionalShort`))
    if (part.geometrySource !== undefined && !['cad', 'parametric', 'unknown'].includes(String(part.geometrySource))) issues.push(makeIssue('G1', 'error', 'geometrySource phải là cad, parametric hoặc unknown.', `${path}.geometrySource`))
    const definition = registry.find(item => item.id === part.type)
    if (!definition) {
      issues.push(makeIssue('G2', 'error', `Không có loại linh kiện “${part.type}” trong registry.`, `${path}.type`))
      continue
    }
    const geometry = resolvePartGeometry(part.type, doc.lessonId, registry)
    if (!geometry) {
      issues.push(makeIssue('G2', 'error', `Thiếu metadata hình học cho “${part.type}”.`, path))
      continue
    }
    if (part.mount.kind === 'breadboard') {
      if (geometry.mount !== 'breadboard' || geometry.legsMm.length === 0) issues.push(makeIssue('G2', 'error', `G2a: “${part.type}” cần legsMm và mount breadboard đúng manifest.`, path))
      else if (geometry.legsMm.some(leg => !definition.pins.some(pin => pin.id === leg.pinId))) issues.push(makeIssue('G2', 'error', `G2a: legsMm của “${part.type}” có pinId không thuộc registry.`, path))
    } else if (geometry.mount !== 'bench' || Object.keys(geometry.pinsMm).length === 0) {
      issues.push(makeIssue('G2', 'error', `G2a: “${part.type}” cần pinsMm và mount bench đúng manifest.`, path))
    }
    if (geometry.geometrySource !== 'cad' || part.geometrySource === 'parametric' || part.geometrySource === 'unknown') {
      issues.push(makeIssue('G2', 'warning', `G2b: hình học “${part.type}” có nguồn ${geometry.geometrySource}; không xem là hình học vật lý đã xác thực.`, `${path}.geometrySource`))
    }
    const mount = canMount(part as unknown as CircuitDocV2['parts'][number], part.mount, doc, registry)
    if (!mount.ok) {
      issues.push(makeIssue(mount.code, 'error', mount.reason, `${path}.mount`))
    }
  }

  for (const [index, wire] of doc.wires.entries()) {
    const path = `wires[${index}]`
    if (!isRecord(wire) || !validId(wire.id) || !validEndpoint(wire.from) || !validEndpoint(wire.to)
      || (wire.role !== undefined && !['power', 'ground', 'signal'].includes(String(wire.role)))) {
      issues.push(makeIssue('G1', 'error', 'Dây cần id, hai endpoint pin|hole hợp lệ và role tùy chọn đúng enum.', path))
      continue
    }
    if (ids.has(wire.id)) issues.push(makeIssue('G1', 'error', `ID “${wire.id}” bị trùng.`, `${path}.id`))
    ids.add(wire.id)
    for (const [end, endpoint] of [['from', wire.from], ['to', wire.to]] as const) {
      if (endpoint.kind === 'pin') {
        const part = doc.parts.find(item => item.id === endpoint.partId)
        const definition = part && registry.find(item => item.id === part.type)
        if (!part || !definition || !definition.pins.some(pin => pin.id === endpoint.pinId)) issues.push(makeIssue('G3', 'error', `Endpoint pin ${endpoint.partId}:${endpoint.pinId} không tồn tại trong part/registry.`, `${path}.${end}`))
        else if (!resolvePartGeometry(part.type, doc.lessonId, registry)?.pinsMm[endpoint.pinId]) issues.push(makeIssue('G2', 'error', `G2a: pin endpoint ${endpoint.partId}:${endpoint.pinId} thiếu tọa độ pinsMm.`, `${path}.${end}`))
      } else {
        const hole = parseHole(endpoint.holeId)
        if (!hole || !doc.breadboards.some(board => board.id === hole.board)) issues.push(makeIssue('G4', 'error', `Lỗ “${endpoint.holeId}” không hợp lệ hoặc không có breadboard tương ứng.`, `${path}.${end}`))
      }
    }
  }

  for (const [holeId, used] of Object.entries(occupancy(doc, doc.lessonId, registry))) {
    if (used.legs.length === 0 || used.wireEndpoints.length === 0) continue
    const pins = used.legs.map(leg => `${leg.partId}:${leg.pinId}`).join(', ')
    const endpoints = used.wireEndpoints.map(endpoint => `${endpoint.wireId}.${endpoint.end}`).join(', ')
    issues.push(makeIssue('G4', 'error', `Lỗ “${holeId}” vừa chứa chân linh kiện (${pins}) vừa làm đầu dây (${endpoints}).`, 'wires'))
  }

  const wireHoleEnds = new Map<string, string>()
  for (const [index, wire] of doc.wires.entries()) for (const end of ['from', 'to'] as const) {
    const endpoint = wire?.[end]
    if (endpoint?.kind !== 'hole') continue
    const parsed = parseHole(endpoint.holeId)
    const canonical = parsed && formatHole(parsed)
    if (!canonical) continue
    if (wireHoleEnds.has(canonical)) issues.push(makeIssue('G4', 'error', `Lỗ “${canonical}” đã được dùng làm đầu dây bởi ${wireHoleEnds.get(canonical)}.`, `wires[${index}].${end}`))
    else wireHoleEnds.set(canonical, `${wire.id}.${end}`)
  }

  if (Array.isArray(doc.openPins)) for (const [index, open] of doc.openPins.entries()) {
    if (!isRecord(open) || typeof open.reason !== 'string' || !open.reason.trim()) {
      issues.push(makeIssue('G1', 'error', 'openPins cần partId, pinId và lý do không rỗng.', `openPins[${index}]`))
      continue
    }
    const part = doc.parts.find(item => item.id === open.partId)
    const definition = part && registry.find(item => item.id === part.type)
    if (!part || !definition?.pins.some(pin => pin.id === open.pinId)) issues.push(makeIssue('G3', 'error', `openPins trỏ tới chân không tồn tại ${String(open.partId)}:${String(open.pinId)}.`, `openPins[${index}]`))
  }

  if (doc.expect.partCount !== doc.parts.length) issues.push(makeIssue('G1', 'error', 'expect.partCount không khớp parts.length.', 'expect.partCount'))
  if (doc.expect.wireCount !== doc.wires.length) issues.push(makeIssue('G1', 'error', 'expect.wireCount không khớp wires.length.', 'expect.wireCount'))
  return issues
}
