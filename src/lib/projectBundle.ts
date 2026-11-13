import { componentRegistry, getComponentDefinition } from '../data/componentRegistry'
import { builderLessons } from '../data/builderLessons'
import { simulationTargets } from '../data/simulationTargets'
import type { CircuitWorkspaceDocument } from '../types/circuitWorkspace'
import { PROJECT_IMPORT_MAX_BYTES } from './projectLimits'

export const PROJECT_BUNDLE_FORMAT = 'mach-mo-project'
export const PROJECT_BUNDLE_VERSION = 1
const CURRENT_WORKSPACE_VERSION = 4
const MAX_DRAFT_CHARACTERS = 200_000
const LEGACY_BOARDS: Readonly<Record<string, string>> = { esp32: 'esp32-devkit', uno: 'arduino-uno-r3', nano: 'arduino-nano-classic', stm32: 'stm32-nucleo' }
const WORKSPACE_FIELDS = new Set(['schemaVersion','placed','wires','simBoard','board','lesson','code','codeMode','blockProgram','analogCppDraft','analogMode','analogThreshold','analogBlockOrder','projectId','projectName','layout','libraryEntryId','libraryEntryName'])
const BUNDLE_FIELDS = new Set(['format','version','exportedAt','workspace','lessonDrafts','branchSession','branchDrafts','libraryEntryId','libraryEntryName'])

export type ProjectBundle = {
  format: typeof PROJECT_BUNDLE_FORMAT
  version: typeof PROJECT_BUNDLE_VERSION
  exportedAt: string
  workspace: CircuitWorkspaceDocument
  lessonDrafts: Record<string, unknown>
  branchSession: Record<string, unknown>
  branchDrafts: Record<string, unknown>
}
export type ProjectNormalizationIssue = { code: 'current-draft-conflict'; lessonId: string; boardId: string }
export type ProjectDecodeResult = {
  status: 'valid' | 'unsupported' | 'invalid'
  document?: ProjectBundle
  rawBackup: string
  unknownFields: string[]
  issues: string[]
  normalizationIssues?: ProjectNormalizationIssue[]
}

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function assertDraft(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`Bản nháp ${label} trong project không hợp lệ.`)
  if (value.length > MAX_DRAFT_CHARACTERS) throw new Error(`Bản nháp ${label} vượt giới hạn ${MAX_DRAFT_CHARACTERS} ký tự.`)
}
function normalizeBoardId(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  return LEGACY_BOARDS[value] ?? value
}

/** Pure and idempotent: only missing current drafts are hydrated from workspace.code. */
export function normalizeProjectBundle(input: ProjectBundle): { bundle: ProjectBundle; issues: ProjectNormalizationIssue[] } {
  const bundle = structuredClone(input)
  const issues: ProjectNormalizationIssue[] = []
  const { lesson, simBoard, code } = bundle.workspace
  if (typeof lesson === 'string' && typeof simBoard === 'string' && typeof code === 'string') {
    const existing = Object.hasOwn(bundle.lessonDrafts, lesson) ? bundle.lessonDrafts[lesson] : undefined
    const drafts = object(existing) ? existing : undefined
    if (!drafts || !Object.hasOwn(drafts, simBoard)) bundle.lessonDrafts[lesson] = { ...drafts, [simBoard]: code }
    else if (drafts[simBoard] !== code) issues.push({ code: 'current-draft-conflict', lessonId: lesson, boardId: simBoard })
  }
  return { bundle, issues }
}

function validateBundle(value: unknown): ProjectBundle {
  if (!object(value)) throw new Error('Tệp không phải project Mạch Mở.')
  if (value.format !== PROJECT_BUNDLE_FORMAT || value.version !== PROJECT_BUNDLE_VERSION) throw new Error('Phiên bản project không được hỗ trợ. Hãy xuất lại từ phiên bản Mạch Mở hiện tại.')
  if (!object(value.workspace)) throw new Error('Project thiếu dữ liệu workspace.')
  for (const key of ['lessonDrafts', 'branchSession', 'branchDrafts'] as const) if (!object(value[key])) throw new Error(`Project thiếu dữ liệu ${key}.`)
  const workspace = value.workspace
  if (workspace.schemaVersion !== undefined && (!Number.isInteger(workspace.schemaVersion) || Number(workspace.schemaVersion) < 1)) throw new Error('Phiên bản workspace không hợp lệ.')
  if (typeof workspace.schemaVersion === 'number' && workspace.schemaVersion > CURRENT_WORKSPACE_VERSION) throw new Error(`Phiên bản workspace ${workspace.schemaVersion} chưa được hỗ trợ.`)
  if (!Array.isArray(workspace.placed) || workspace.placed.length < 1 || workspace.placed.length > 100) throw new Error('Danh sách linh kiện trong project không hợp lệ.')
  const parts = new Map<string, Record<string, unknown>>()
  for (const item of workspace.placed) {
    if (!object(item) || typeof item.id !== 'string' || !item.id || parts.has(item.id) || !componentRegistry.some(part => part.id === item.type) || !Number.isFinite(item.x) || !Number.isFinite(item.y) || Number(item.x) < 0 || Number(item.x) > 100 || Number(item.y) < 0 || Number(item.y) > 100 || (item.rotation !== undefined && !Number.isFinite(item.rotation))) throw new Error('Project chứa linh kiện, ID hoặc tọa độ không hợp lệ.')
    parts.set(item.id, item)
  }
  if (!workspace.placed.some(item => object(item) && item.type === 'board')) throw new Error('Project thiếu board.')
  if (!Array.isArray(workspace.wires) || workspace.wires.length > 500) throw new Error('Danh sách dây nối trong project không hợp lệ.')
  const wireIds = new Set<string>()
  for (const wire of workspace.wires) {
    if (!object(wire) || typeof wire.id !== 'string' || !wire.id || wireIds.has(wire.id) || parts.has(wire.id) || !object(wire.from) || !object(wire.to)) throw new Error('Dây nối hoặc ID trong project không hợp lệ.')
    wireIds.add(wire.id)
    for (const end of [wire.from, wire.to]) {
      if (typeof end.partId !== 'string' || typeof end.pinId !== 'string') throw new Error('Đầu dây nối trong project không hợp lệ.')
      const part = parts.get(end.partId)
      if (!part || !getComponentDefinition(String(part.type))?.pins.some(pin => pin.id === end.pinId)) throw new Error('Dây nối tham chiếu linh kiện hoặc chân không tồn tại.')
    }
  }
  if (workspace.lesson !== undefined && (typeof workspace.lesson !== 'string' || !builderLessons.some(lesson => lesson.id === workspace.lesson))) throw new Error('Project chọn bài học không hợp lệ.')
  for (const key of ['code', 'analogCppDraft'] as const) if (workspace[key] !== undefined) assertDraft(workspace[key], key)
  if (typeof workspace.simBoard === 'string' && workspace.simBoard && !normalizeBoardId(workspace.simBoard)) throw new Error('Board trong project không hợp lệ.')
  for (const [lesson, boardMap] of Object.entries(value.lessonDrafts as Record<string, unknown>)) {
    if (!object(boardMap)) throw new Error(`Bản nháp ${lesson} trong project không hợp lệ.`)
    for (const [board, draft] of Object.entries(boardMap)) assertDraft(draft, `${lesson}/${board}`)
  }
  for (const [lesson, draft] of Object.entries(value.branchDrafts as Record<string, unknown>)) assertDraft(draft, lesson)
  return value as unknown as ProjectBundle
}

/** Decode without losing the exact input; unsupported values never produce a loadable document. */
export function decode(raw: string | unknown): ProjectDecodeResult {
  let rawBackup: string
  try { rawBackup = typeof raw === 'string' ? raw : JSON.stringify(raw) ?? String(raw) } catch { rawBackup = String(raw) }
  if (new TextEncoder().encode(rawBackup).byteLength > PROJECT_IMPORT_MAX_BYTES) return { status: 'invalid', rawBackup, unknownFields: [], issues: ['Tệp project vượt giới hạn dung lượng.'] }
  let value: unknown = raw
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw) } catch { return { status: 'invalid', rawBackup, unknownFields: [], issues: ['Tệp không chứa JSON hợp lệ.'] } }
  }
  if (!object(value)) return { status: 'invalid', rawBackup, unknownFields: [], issues: ['Tệp không phải project Mạch Mở.'] }
  const unknownFields = Object.keys(value).filter(key => !BUNDLE_FIELDS.has(key))
  if (object(value.workspace)) unknownFields.push(...Object.keys(value.workspace).filter(key => !WORKSPACE_FIELDS.has(key)).map(key => `workspace.${key}`))
  if (object(value.branchSession)) unknownFields.push(...Object.keys(value.branchSession).filter(key => !['mode', 'order'].includes(key)).map(key => `branchSession.${key}`))
  if (unknownFields.length) return { status: 'unsupported', rawBackup, unknownFields, issues: ['Project có trường mở rộng chưa được hỗ trợ.'] }
  if (value.format !== PROJECT_BUNDLE_FORMAT || value.version !== PROJECT_BUNDLE_VERSION) return { status: 'unsupported', rawBackup, unknownFields, issues: ['Phiên bản bundle không được hỗ trợ.'] }
  if (object(value.workspace) && typeof value.workspace.schemaVersion === 'number' && value.workspace.schemaVersion > CURRENT_WORKSPACE_VERSION) return { status: 'unsupported', rawBackup, unknownFields, issues: [`Phiên bản workspace ${value.workspace.schemaVersion} chưa được hỗ trợ.`] }
  const workspaceInput = object(value.workspace) ? value.workspace : undefined
  const rawTarget = workspaceInput
    ? (typeof workspaceInput.simBoard === 'string' && workspaceInput.simBoard !== '' ? workspaceInput.simBoard
      : typeof workspaceInput.board === 'string' && workspaceInput.board !== '' ? workspaceInput.board : undefined)
    : undefined
  const target = normalizeBoardId(rawTarget)
  if (rawTarget && !simulationTargets.some(item => item.boardId === target)) return { status: 'unsupported', rawBackup, unknownFields, issues: [`Board chưa được hỗ trợ: ${rawTarget}.`] }
  try {
    const candidate = structuredClone(value) as Record<string, unknown>
    const workspace = candidate.workspace as Record<string, unknown>
    if (target) workspace.simBoard = target
    const document = validateBundle(candidate)
    const normalized = normalizeProjectBundle(document)
    return { status: 'valid', document: normalized.bundle, rawBackup, unknownFields, issues: normalized.issues.map(issue => `${issue.code}:${issue.lessonId}/${issue.boardId}`), normalizationIssues: normalized.issues }
  } catch (error) {
    return { status: 'invalid', rawBackup, unknownFields, issues: [error instanceof Error ? error.message : 'Project không hợp lệ.'] }
  }
}

export function createProjectBundle(input: Omit<ProjectBundle, 'format' | 'version' | 'exportedAt'>): ProjectBundle {
  return normalizeProjectBundle({ format: PROJECT_BUNDLE_FORMAT, version: PROJECT_BUNDLE_VERSION, exportedAt: new Date().toISOString(), ...input }).bundle
}
export function parseProjectBundle(value: unknown): ProjectBundle {
  const result = decode(value)
  if (result.status !== 'valid' || !result.document) throw new Error(result.issues[0] ?? 'Project không hợp lệ.')
  return result.document
}
