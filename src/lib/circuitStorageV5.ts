import type { CircuitWorkspaceDocument } from '../types/circuitWorkspace'
import { validateCircuitDoc, type CircuitDocV2 } from './circuitDocV2'
import { migrateWorkspaceV1ToV2 } from './migrateV1toV2'
import { layout2D } from './layout2D'

export const V4_WORKSPACE_KEY = 'machmo-builder-session'
export const V5_WORKSPACE_KEY = 'machmo-builder-session-v5'

export type CircuitWorkspaceV5 = {
  schemaVersion: 5
  circuit: CircuitDocV2
  layout: Record<string, { x: number; y: number }>
  boardId: string
  lessonId: string
  workspaceFields: Record<string, unknown>
  source: { key: typeof V4_WORKSPACE_KEY; schemaVersion: 4 }
  updatedAt: number
}

export type MigrationPreview = {
  sourceRaw: string
  candidate: CircuitWorkspaceV5
  warnings: string[]
}

export type WorkspaceReadResult =
  | { status: 'v5'; value: CircuitWorkspaceV5 }
  | { status: 'v4'; raw: string; preview: MigrationPreview }
  | { status: 'invalid-v4'; raw: string; reason: string }
  | { status: 'invalid-v5'; raw: string; reason: string }
  | { status: 'empty' }

export type WorkspaceSaveResult =
  | { status: 'saved'; value: CircuitWorkspaceV5 }
  | { status: 'stale-source' | 'exists' | 'quota-error' | 'invalid'; reason: string }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function validateV5(value: unknown): value is CircuitWorkspaceV5 {
  if (!isRecord(value) || value.schemaVersion !== 5 || !isRecord(value.circuit) || !isRecord(value.layout)
    || typeof value.boardId !== 'string' || !value.boardId.trim()
    || typeof value.lessonId !== 'string' || !value.lessonId.trim()
    || !isRecord(value.workspaceFields)
    || !isRecord(value.source) || value.source.key !== V4_WORKSPACE_KEY || value.source.schemaVersion !== 4
    || typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt) || value.updatedAt < 0) return false
  if (validateCircuitDoc(value.circuit).some(issue => issue.severity === 'error')) return false
  const partIds = new Set((value.circuit as unknown as CircuitDocV2).parts.map(part => part.id))
  return Object.entries(value.layout).every(([id, position]) => partIds.has(id) && isRecord(position)
    && typeof position.x === 'number' && Number.isFinite(position.x)
    && typeof position.y === 'number' && Number.isFinite(position.y))
}

function makeCandidate(raw: string): { preview: MigrationPreview } | { reason: string } {
  let source: unknown
  try { source = JSON.parse(raw) } catch { return { reason: 'Bản nháp schema 4 không phải JSON hợp lệ; dữ liệu gốc vẫn được giữ nguyên.' } }
  const migrated = migrateWorkspaceV1ToV2(source)
  if (migrated.status !== 'migrated') return { reason: `Không thể xem trước di trú: ${migrated.reason}` }

  const rawRecord = isRecord(source) ? source : {}
  const layoutResult = layout2D(migrated.doc)
  const layout = Object.fromEntries(layoutResult.placements.map(part => [part.partId, { x: part.x, y: part.y }]))
  const { placed: _placed, wires: _wires, schemaVersion: _schemaVersion, ...workspaceFields } = rawRecord
  const candidate: CircuitWorkspaceV5 = {
    schemaVersion: 5,
    circuit: migrated.doc,
    layout,
    boardId: typeof rawRecord.board === 'string' ? rawRecord.board : typeof rawRecord.simBoard === 'string' ? rawRecord.simBoard : 'esp32-devkit',
    lessonId: migrated.doc.lessonId,
    workspaceFields,
    source: { key: V4_WORKSPACE_KEY, schemaVersion: 4 },
    updatedAt: Date.now(),
  }
  if (!validateV5(candidate)) return { reason: 'Bản xem trước không vượt qua kiểm tra CircuitDocV2; dữ liệu gốc vẫn được giữ nguyên.' }
  return { preview: { sourceRaw: raw, candidate, warnings: migrated.warnings } }
}

export function readWorkspace(storage: Pick<Storage, 'getItem'>): WorkspaceReadResult {
  const v5Raw = storage.getItem(V5_WORKSPACE_KEY)
  if (v5Raw !== null) {
    let value: unknown
    try { value = JSON.parse(v5Raw) } catch { return { status: 'invalid-v5', raw: v5Raw, reason: 'Bản nháp v5 không phải JSON hợp lệ; không ghi đè dữ liệu.' } }
    return validateV5(value)
      ? { status: 'v5', value }
      : { status: 'invalid-v5', raw: v5Raw, reason: 'Bản nháp v5 không hợp lệ; bản schema 4 vẫn được giữ nguyên để khôi phục.' }
  }

  const raw = storage.getItem(V4_WORKSPACE_KEY)
  if (raw === null) return { status: 'empty' }
  const generated = makeCandidate(raw)
  return 'reason' in generated
    ? { status: 'invalid-v4', raw, reason: generated.reason }
    : { status: 'v4', raw, preview: generated.preview }
}

export function acceptV4Migration(storage: Pick<Storage, 'getItem' | 'setItem'>, preview: MigrationPreview): WorkspaceSaveResult {
  if (storage.getItem(V4_WORKSPACE_KEY) !== preview.sourceRaw) return { status: 'stale-source', reason: 'Bản nháp schema 4 đã thay đổi sau khi xem trước; hãy tạo preview mới.' }
  if (storage.getItem(V5_WORKSPACE_KEY) !== null) return { status: 'exists', reason: 'Đã có bản v5; giữ nguyên cả hai bản để người dùng chọn khôi phục.' }
  if (!validateV5(preview.candidate)) return { status: 'invalid', reason: 'Bản xem trước v5 không hợp lệ; không ghi dữ liệu.' }
  try {
    storage.setItem(V5_WORKSPACE_KEY, JSON.stringify(preview.candidate))
  } catch {
    return { status: 'quota-error', reason: 'Không đủ bộ nhớ để ghi v5; bản schema 4 vẫn nguyên vẹn.' }
  }
  const verified = readWorkspace(storage)
  if (verified.status !== 'v5') return { status: 'invalid', reason: 'Không xác minh được bản v5 sau khi ghi; dữ liệu schema 4 vẫn được giữ nguyên.' }
  return { status: 'saved', value: verified.value }
}

export function saveWorkspaceV5(storage: Pick<Storage, 'setItem'>, value: CircuitWorkspaceV5): WorkspaceSaveResult {
  if (!validateV5(value)) return { status: 'invalid', reason: 'Workspace v5 không hợp lệ; bản lưu trước không bị thay đổi.' }
  try { storage.setItem(V5_WORKSPACE_KEY, JSON.stringify(value)) }
  catch { return { status: 'quota-error', reason: 'Không đủ bộ nhớ để lưu v5; bản lưu trước không bị thay đổi.' } }
  return { status: 'saved', value }
}

export function workspaceFieldsToV4(value: CircuitWorkspaceV5): Omit<CircuitWorkspaceDocument, 'placed' | 'wires'> | null {
  if (!validateV5(value)) return null
  return {
    ...value.workspaceFields,
    schemaVersion: 4,
    lesson: value.lessonId,
    board: value.boardId,
  } as Omit<CircuitWorkspaceDocument, 'placed' | 'wires'>
}
