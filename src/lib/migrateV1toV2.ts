import { componentRegistry } from '../data/componentRegistry'
import { getComponentDefinition } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import type { CircuitWorkspaceDocument } from '../types/circuitWorkspace'
import { createNetIndexV2 } from './circuitNetsV2'
import { canMount, resolvePartGeometry } from './mountResolve'
import { holeToMm } from './breadboardGrid'
import type { CircuitDocV2, CircuitMountV2, CircuitPartV2 } from './circuitDocV2'

export type WorkspaceMigrationResult =
  | { status: 'migrated'; doc: CircuitDocV2; workspace: CircuitWorkspaceDocument; warnings: string[] }
  | { status: 'unsupported' | 'invalid'; reason: string }
export type StorageMigrationResult =
  | { status: 'migrated'; key: string; warnings: string[] }
  | { status: 'exists' | 'invalid' | 'unsupported'; reason: string; key?: string }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const allowedWorkspaceKeys = (key: string) => key === 'machmo-builder-session'
  || /^machmo-guided-workspace-[a-z0-9-]+$/i.test(key)
const safeSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')

function mountFor(type: string, index: number, geometryMount: 'breadboard' | 'bench'): CircuitMountV2 {
  if (type === 'board') return { kind: 'bench', lane: 'left', order: index }
  if (type === 'breadboard') return { kind: 'bench', lane: 'bottom', order: index }
  if (geometryMount === 'bench') return { kind: 'bench', lane: 'right', order: index }
  // The legacy x/y values are screen percentages, not hole coordinates. Placement
  // is therefore assigned by a deterministic grid search, never inferred from x/y.
  return { kind: 'breadboard', board: 'bb1', col: 1, row: 0, rotation: 0 }
}

function resolveBreadboardMount(part: CircuitPartV2, parts: CircuitPartV2[], docBase: Omit<CircuitDocV2, 'parts' | 'expect'>): CircuitPartV2 | null {
  const grid = getComponentMesh('breadboard')?.gridMm
  const bodyBox = (candidate: CircuitPartV2) => {
    if (candidate.mount.kind !== 'breadboard' || !grid) return null
    const mesh = getComponentMesh(candidate.type), geometry = resolvePartGeometry(candidate.type, docBase.lessonId)
    const lead = geometry?.legsMm[0]
    const anchor = holeToMm({ kind: 'grid', board: 'bb1', column: candidate.mount.col, row: 'abcdefghij'[candidate.mount.row] as 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' }, grid)
    if (!mesh || !lead || !anchor) return null
    const localX = (mesh.boundsMm.min[0] + mesh.boundsMm.max[0]) / 2 - lead.x
    const localY = (mesh.boundsMm.min[2] + mesh.boundsMm.max[2]) / 2 - lead.z
    const angle = candidate.mount.rotation * Math.PI / 180
    const centerX = anchor[0] + localX * Math.cos(angle) - localY * Math.sin(angle)
    const centerY = anchor[1] + localX * Math.sin(angle) + localY * Math.cos(angle)
    const rawWidth = mesh.boundsMm.max[0] - mesh.boundsMm.min[0]
    const rawHeight = mesh.boundsMm.max[2] - mesh.boundsMm.min[2]
    const turned = candidate.mount.rotation % 180 !== 0
    const width = turned ? rawHeight : rawWidth, height = turned ? rawWidth : rawHeight
    return { minX: centerX - width / 2, maxX: centerX + width / 2, minY: centerY - height / 2, maxY: centerY + height / 2 }
  }
  const overlaps = (left: NonNullable<ReturnType<typeof bodyBox>>, right: NonNullable<ReturnType<typeof bodyBox>>) =>
    left.minX < right.maxX + 0.5 && left.maxX + 0.5 > right.minX && left.minY < right.maxY + 0.5 && left.maxY + 0.5 > right.minY
  const rotations = [0, 90, 180, 270] as const
  for (let row = 0; row < 10; row += 1) for (let col = 1; col <= 30; col += 1) for (const rotation of rotations) {
    const candidate: CircuitPartV2 = { ...part, mount: { kind: 'breadboard', board: 'bb1', col, row, rotation } }
    const partial = { ...docBase, parts: [...parts, candidate], expect: { partCount: parts.length + 1, wireCount: 0, netCount: 0 } } as CircuitDocV2
    if (!canMount(candidate, candidate.mount, partial).ok) continue
    const candidateBox = bodyBox(candidate)
    if (!candidateBox || parts.some(existing => existing.type !== 'breadboard' && existing.mount.kind === 'breadboard' && bodyBox(existing) && overlaps(candidateBox, bodyBox(existing)!))) continue
    return candidate
  }
  return null
}

/** Converts a persisted schema-v4 workspace without changing its original stored document. */
export function migrateWorkspaceV1ToV2(value: unknown, lessonOverride?: string): WorkspaceMigrationResult {
  if (!isRecord(value) || !Array.isArray(value.placed) || !Array.isArray(value.wires)) return { status: 'invalid', reason: 'Workspace thiếu placed hoặc wires dạng mảng.' }
  if (value.schemaVersion !== undefined && (typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion) || value.schemaVersion < 1)) return { status: 'invalid', reason: 'schemaVersion không hợp lệ.' }
  if (typeof value.schemaVersion === 'number' && value.schemaVersion > 4) return { status: 'unsupported', reason: `Workspace schemaVersion ${value.schemaVersion} mới hơn phiên bản hỗ trợ 4.` }
  const lessonId = lessonOverride ?? (typeof value.lesson === 'string' ? value.lesson : 'custom')
  if (!safeSlug(lessonId)) return { status: 'invalid', reason: 'lessonId không hợp lệ.' }
  const ids = new Set<string>()
  const legacyParts = value.placed
  if (legacyParts.some(part => !isRecord(part) || typeof part.id !== 'string' || typeof part.type !== 'string' || ids.has(part.id) || (ids.add(part.id), false))) return { status: 'invalid', reason: 'Part thiếu id/type hoặc có id trùng.' }
  if (value.wires.some(wire => !isRecord(wire) || typeof wire.id !== 'string' || !isRecord(wire.from) || !isRecord(wire.to)
    || typeof wire.from.partId !== 'string' || typeof wire.from.pinId !== 'string' || typeof wire.to.partId !== 'string' || typeof wire.to.pinId !== 'string')) return { status: 'invalid', reason: 'Dây cũ thiếu id hoặc endpoint pin hợp lệ.' }
  const legacyById = new Map(legacyParts.map(part => [String((part as Record<string, unknown>).id), String((part as Record<string, unknown>).type)]))
  for (const wire of value.wires as Array<Record<string, unknown>>) for (const endpoint of [wire.from, wire.to] as Array<Record<string, unknown>>) {
    const type = legacyById.get(String(endpoint.partId))
    if (!type || !getComponentDefinition(type)?.pins.some(pin => pin.id === endpoint.pinId)) return { status: 'invalid', reason: `Dây ${String(wire.id)} trỏ tới part/pin không tồn tại: ${String(endpoint.partId)}:${String(endpoint.pinId)}.` }
  }

  const hasBreadboard = legacyParts.some(part => isRecord(part) && part.type === 'breadboard')
  const breadboards = hasBreadboard ? [{ id: 'bb1' as const, spec: '400-30' as const, railSplit: false }] : []
  const docBase: Omit<CircuitDocV2, 'parts' | 'expect'> = { schema: 2, lessonId, breadboards, wires: value.wires.map(wire => ({
    id: String((wire as Record<string, unknown>).id),
    from: { kind: 'pin' as const, partId: String(((wire as Record<string, unknown>).from as Record<string, unknown>).partId), pinId: String(((wire as Record<string, unknown>).from as Record<string, unknown>).pinId) },
    to: { kind: 'pin' as const, partId: String(((wire as Record<string, unknown>).to as Record<string, unknown>).partId), pinId: String(((wire as Record<string, unknown>).to as Record<string, unknown>).pinId) },
  })) }
  const parts: CircuitPartV2[] = []
  for (const [index, raw] of legacyParts.entries()) {
    const part = raw as Record<string, unknown>
    if (!componentRegistry.some(item => item.id === part.type)) return { status: 'invalid', reason: `Không có loại linh kiện “${String(part.type)}” trong registry.` }
    const geometry = resolvePartGeometry(String(part.type), lessonId)
    if (!geometry) return { status: 'invalid', reason: `Thiếu hình học cho “${String(part.type)}”.` }
    const valueLabel = typeof part.value === 'string' ? part.value : undefined
    const base: CircuitPartV2 = {
      id: String(part.id), type: String(part.type),
      ...(valueLabel !== undefined ? { value: { label: valueLabel } } : {}),
      mount: mountFor(String(part.type), index, geometry.mount),
    }
    const resolved = base.mount.kind === 'breadboard' ? resolveBreadboardMount(base, parts, docBase) : base
    if (!resolved) return { status: 'invalid', reason: `Không tìm được vị trí breadboard hợp lệ cho “${String(part.id)}”; bản nháp cũ được giữ nguyên.` }
    parts.push(resolved)
  }
  const doc = { ...docBase, parts, expect: { partCount: parts.length, wireCount: docBase.wires.length, netCount: 0 } } as CircuitDocV2
  doc.expect.netCount = createNetIndexV2(doc).netsList().length
  const netIndex = createNetIndexV2(doc)
  const warnings = componentRegistry.flatMap(definition => {
    const used = parts.filter(part => part.type === definition.id)
    return used.flatMap(part => definition.pins.filter(pin => {
      const net = netIndex.netOf(`${part.id}:${pin.id}`)
      return !net || (net.wireIds.size === 0 && net.holes.size === 0 && net.endpoints.size < 2)
    }).map(pin => `Chân chưa có net nối: ${part.id}:${pin.id}; cần xác nhận trước khi bài v2 được phát hành.`))
  })
  return { status: 'migrated', doc, workspace: structuredClone(value) as unknown as CircuitWorkspaceDocument, warnings }
}

/** Writes only the new key. Original v1 keys remain available as the recovery copy. */
export function copyWorkspaceToV2Key(storage: Pick<Storage, 'getItem' | 'setItem'>, sourceKey: string, lessonId: string): StorageMigrationResult {
  const targetKey = `machmo-circuit-v2-${safeSlug(lessonId)}`
  if (!allowedWorkspaceKeys(sourceKey)) return { status: 'unsupported', reason: `Khóa ${sourceKey} không thuộc các họ workspace đã biết.` }
  if (storage.getItem(targetKey) !== null) return { status: 'exists', reason: 'Khóa v2 đã có dữ liệu; giữ nguyên để không ghi đè.', key: targetKey }
  const raw = storage.getItem(sourceKey)
  if (raw === null) return { status: 'invalid', reason: `Không tìm thấy dữ liệu ở ${sourceKey}.`, key: targetKey }
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return { status: 'invalid', reason: `Dữ liệu ở ${sourceKey} không phải JSON hợp lệ.`, key: targetKey } }
  const result = migrateWorkspaceV1ToV2(parsed, lessonId)
  if (result.status !== 'migrated') return { status: result.status, reason: result.reason, key: targetKey }
  const envelope = { schema: 2, sourceKey, migratedAt: null, workspace: result.workspace, doc: result.doc, warnings: result.warnings }
  try { storage.setItem(targetKey, JSON.stringify(envelope)) }
  catch { return { status: 'invalid', reason: 'Không ghi được khóa v2; bản gốc vẫn được giữ nguyên.', key: targetKey } }
  return { status: 'migrated', key: targetKey, warnings: result.warnings }
}
