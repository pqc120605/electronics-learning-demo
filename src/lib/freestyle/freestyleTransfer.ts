import { getComponentDefinition } from '../../data/componentRegistry'
import { getComponentReferences } from '../../data/componentReferences'
import { getComponentMesh } from '../../data/componentModels'
import { getKitPartProfile } from '../../data/kitPartProfiles'
import { getFreestyleBoard, parseFreestyleWorkspace, type FreestyleWorkspace } from './freestyleCircuit'
import { archiveFreestyle, type SavedFreestyleDraft } from './freestyleDrafts'

const projectFormat = 'mach-mo-freestyle'
const backupFormat = 'mach-mo-freestyle-backup'
export const projectFileLimit = 2 * 1024 * 1024
export const backupFileLimit = 8 * 1024 * 1024

export function serializeFreestyleProject(workspace: FreestyleWorkspace): string {
  return JSON.stringify({ format: projectFormat, version: 1, workspace }, null, 2)
}

export function parseFreestyleProject(raw: string): FreestyleWorkspace | null {
  if (raw.length > projectFileLimit) return null
  try {
    const value = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    if (!Object.hasOwn(value, 'format')) return parseFreestyleWorkspace(raw)
    return value.format === projectFormat && value.version === 1
      ? parseFreestyleWorkspace(JSON.stringify(value.workspace) ?? null) : null
  } catch { return null }
}

export function serializeFreestyleBackup(current: FreestyleWorkspace, drafts: readonly SavedFreestyleDraft[]): string {
  const entries = [...new Set([JSON.stringify(current), ...drafts.map(draft => draft.raw)])]
  return JSON.stringify({ format: backupFormat, version: 1, entries })
}

export function restoreFreestyleBackup(storage: Pick<Storage, 'setItem' | 'getItem' | 'removeItem'>, raw: string): number {
  const invalid = 'Tệp sao lưu nháp không hợp lệ hoặc không được hỗ trợ.'
  if (raw.length > backupFileLimit) throw new Error('Tệp sao lưu vượt 8 MiB.')
  let value: { format?: unknown; version?: unknown; entries?: unknown } | null
  try { value = JSON.parse(raw) } catch { throw new Error(invalid) }
  if (value?.format !== backupFormat || value.version !== 1 || !Array.isArray(value.entries)
    || value.entries.length > 500 || value.entries.some(entry => typeof entry !== 'string' || !entry || entry.length > projectFileLimit)) throw new Error(invalid)

  const added: string[] = []
  // Unreadable drafts remain raw archives. The existing draft parser controls whether each one can be opened.
  for (const entry of new Set<string>(value.entries)) {
    const result = archiveFreestyle(storage, entry)
    if (!result.ok) {
      for (const key of added) storage.removeItem(key)
      throw new Error('Chưa khôi phục được vì bộ nhớ trình duyệt không đủ hoặc không khả dụng.')
    }
    added.push(result.key)
  }
  return added.length
}

const csvCell = (value: string) => `"${(/^[\t\r\n]|^\s*[=+\-@]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`

export function freestyleBomCsv({ boardId, doc }: FreestyleWorkspace): string {
  const groups = new Map<string, { ids: string[]; value: string; footprint: string; source: string }>()
  for (const part of doc.parts) {
    const definition = getComponentDefinition(part.type)
    const board = part.type === 'board' && boardId ? getFreestyleBoard(boardId) : undefined
    const value = part.value?.ohm !== undefined ? `${part.value.ohm} Ω`
      : part.value?.farad !== undefined ? `${part.value.farad} F`
      : part.value?.label ?? (board ? board.name : definition?.label ?? part.type)
    const sources = getComponentReferences(definition?.catalogId ?? part.type)
    const source = getKitPartProfile(part.type)?.url ?? sources.find(item => item.kind === 'Datasheet chip')?.url ?? ''
    const key = JSON.stringify([part.type, value, source])
    const footprint = getComponentMesh(part.type)?.footprint
    const group = groups.get(key) ?? { ids: [], value, footprint: footprint ? `${footprint} (tham chiếu)` : 'Chưa xác minh', source }
    group.ids.push(part.id)
    groups.set(key, group)
  }
  if (doc.breadboards.length) groups.set('breadboard', { ids: doc.breadboards.map(board => board.id), value: 'Breadboard 400 lỗ (mô hình)', footprint: 'Chưa xác minh', source: '' })
  return '\uFEFF' + [
    ['Reference', 'Value', 'Footprint', 'Số lượng', 'Datasheet'],
    ...[...groups.values()].map(row => [row.ids.join(' '), row.value, row.footprint, String(row.ids.length), row.source]),
  ].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
