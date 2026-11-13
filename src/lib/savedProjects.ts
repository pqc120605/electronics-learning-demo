import { createProjectBundle, parseProjectBundle, type ProjectBundle } from './projectBundle'
import { normalizeProjectTags } from './projectLibrary'
import { getBrowserStorage, isVolatileStorage, withoutLibraryWorkspaceMetadata } from './workspaceStorage'

export const SAVED_PROJECTS_KEY = 'machmo-saved-projects'
const DRAFT_RECOVERY_KEY = 'machmo-draft-recovery'
export type ProjectRevision = { id: string; updatedAt: string; bundle: ProjectBundle }
export type SavedProject = { id: string; name: string; updatedAt: string; bundle: ProjectBundle; revisions: ProjectRevision[]; tags: string[]; unreadableRevisions?: unknown[] }
export type SavedProjectLibrary = { projects: SavedProject[]; unreadable: unknown[]; damaged: boolean; rawBackup?: string }
function sameProjectContent(a:ProjectBundle,b:ProjectBundle):boolean { return JSON.stringify({workspace:a.workspace,lessonDrafts:a.lessonDrafts,branchSession:a.branchSession,branchDrafts:a.branchDrafts})===JSON.stringify({workspace:b.workspace,lessonDrafts:b.lessonDrafts,branchSession:b.branchSession,branchDrafts:b.branchDrafts}) }

function readPortableBundle(value: unknown): ProjectBundle {
  const bundle = parseProjectBundle(value)
  return { ...withoutLibraryWorkspaceMetadata(bundle), workspace: withoutLibraryWorkspaceMetadata(bundle.workspace) }
}

function readProject(item:unknown):SavedProject|undefined {
  if (!item || typeof item !== 'object') return
  const project = item as Record<string, unknown>
  if (typeof project.id !== 'string' || typeof project.name !== 'string' || typeof project.updatedAt !== 'string') return
  try {
    const revisions:ProjectRevision[]=[],unreadableRevisions:unknown[]=Array.isArray(project.unreadableRevisions)?[...project.unreadableRevisions]:[]
    for(const entry of Array.isArray(project.revisions)?project.revisions:[]){
      const revision=(entry&&typeof entry==='object'?entry:{}) as Record<string,unknown>
      try{
        if(typeof revision.id!=='string'||typeof revision.updatedAt!=='string')throw new Error('Revision không hợp lệ.')
        revisions.push({id:revision.id,updatedAt:revision.updatedAt,bundle:readPortableBundle(revision.bundle)})
      }catch{unreadableRevisions.push(entry)}
    }
    return { id: project.id, name: project.name, updatedAt: project.updatedAt, bundle: readPortableBundle(project.bundle), revisions: revisions.slice(0,10), tags: normalizeProjectTags(project.tags), ...(unreadableRevisions.length?{unreadableRevisions}:{}) }
  } catch { return }
}

/** Reads the library without discarding anything: entries this version cannot parse stay in `unreadable`. */
export function readSavedProjectLibrary(storage: Storage = getBrowserStorage('localStorage')): SavedProjectLibrary {
  let value: unknown
  const rawBackup = storage.getItem(SAVED_PROJECTS_KEY) ?? '[]'
  try { value = JSON.parse(rawBackup) } catch { return { projects: [], unreadable: [], damaged: true, rawBackup } }
  if (!Array.isArray(value)) return { projects: [], unreadable: [], damaged: true, rawBackup }
  const projects: SavedProject[] = [], unreadable: unknown[] = []
  for (const item of value) {
    const project = readProject(item)
    if (project) projects.push(project)
    else unreadable.push(item)
  }
  projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return { projects, unreadable, damaged: false }
}

export function readSavedProjects(storage: Storage = getBrowserStorage('localStorage')): SavedProject[] {
  return readSavedProjectLibrary(storage).projects
}

function writeProjects(projects: SavedProject[], storage: Storage): void {
  if (isVolatileStorage(storage)) throw new Error('Không lưu được vào thư viện. Bộ nhớ trình duyệt đang bị chặn; hãy xuất tệp để giữ bản sao.')
  const { unreadable, damaged } = readSavedProjectLibrary(storage)
  if (damaged) {
    try { storage.setItem(`${SAVED_PROJECTS_KEY}-damaged-${Date.now()}`, storage.getItem(SAVED_PROJECTS_KEY) ?? '') }
    catch { throw new Error('Không sao lưu được thư viện project bị hỏng nên chưa ghi đè. Hãy giải phóng bộ nhớ trình duyệt rồi thử lại.') }
  }
  try { storage.setItem(SAVED_PROJECTS_KEY, JSON.stringify([...projects, ...unreadable])) }
  catch { throw new Error('Không lưu được vì bộ nhớ trình duyệt đã đầy hoặc bị chặn. Hãy xuất tệp project để giữ bản sao.') }
}

export function findSavedProjectByName(name: string, storage: Storage = getBrowserStorage('localStorage')): SavedProject | undefined {
  const key = projectNameKey(name)
  return readSavedProjects(storage).find((project) => projectNameKey(project.name) === key)
}

const cleanProjectName = (name: string) => name.trim().slice(0, 80).trimEnd()
const projectNameKey = (name: string) => cleanProjectName(name).toLocaleLowerCase('vi-VN')

export class MissingSavedProjectError extends Error {
  constructor() {
    super('Không tìm thấy bản đã lưu. Bản đang mở vẫn còn.')
  }
}

/** With an entry ID, update only that entry. Without one, always create a separate entry. */
export function addSavedProject(name: string, value: ProjectBundle, storage: Storage = getBrowserStorage('localStorage'), entryId?: string): SavedProject {
  const cleaned = cleanProjectName(name)
  if (!cleaned) throw new Error('Nhập tên project trước khi lưu.')
  const projects = readSavedProjects(storage)
  const existing = entryId === undefined ? undefined : projects.find(project => project.id === entryId)
  if (entryId !== undefined && !existing) throw new MissingSavedProjectError()
  if (projects.some(project => project.id !== entryId && projectNameKey(project.name) === projectNameKey(cleaned))) {
    throw new Error('Tên này đã được dùng cho project khác. Hãy chọn tên khác.')
  }
  const bundle = readPortableBundle(value)
  const updatedAt = new Date().toISOString()
  if (existing) {
    const revisions=sameProjectContent(existing.bundle,bundle)?existing.revisions:[{id:crypto.randomUUID(),updatedAt:existing.updatedAt,bundle:existing.bundle},...existing.revisions].slice(0,10)
    const updated:SavedProject={...existing,name:cleaned,updatedAt,bundle,revisions}
    writeProjects([updated,...projects.filter(project=>project.id!==existing.id)],storage)
    return updated
  }
  if (projects.length >= 30) throw new Error('Đã đạt giới hạn 30 project trên thiết bị. Hãy xuất và xóa project cũ trước.')
  const project: SavedProject = { id: crypto.randomUUID(), name: cleaned, updatedAt, bundle, revisions:[], tags:[] }
  writeProjects([project, ...projects], storage)
  return project
}

export function renameSavedProject(id:string,name:string,storage:Storage=getBrowserStorage('localStorage')):SavedProject {
  const cleaned=cleanProjectName(name);if(!cleaned)throw new Error('Tên project không được để trống.')
  const projects=readSavedProjects(storage);const target=projects.find(project=>project.id===id);if(!target)throw new Error('Không tìm thấy project cần đổi tên.')
  if(projects.some(project=>project.id!==id&&projectNameKey(project.name)===projectNameKey(cleaned)))throw new Error('Tên này đã được dùng cho project khác.')
  const renamed={...target,name:cleaned,updatedAt:new Date().toISOString()};writeProjects([renamed,...projects.filter(project=>project.id!==id)],storage);return renamed
}

export function updateSavedProjectTags(id: string, tags: unknown, storage: Storage = getBrowserStorage('localStorage')): SavedProject {
  const projects = readSavedProjects(storage)
  const target = projects.find(project => project.id === id)
  if (!target) throw new Error('Không tìm thấy project cần gắn nhãn.')
  const updated: SavedProject = { ...target, tags: normalizeProjectTags(tags) }
  writeProjects(projects.map(project => project.id === id ? updated : project), storage)
  return updated
}

export function duplicateSavedProject(id:string,storage:Storage=getBrowserStorage('localStorage')):SavedProject {
  const projects=readSavedProjects(storage);if(projects.length>=30)throw new Error('Đã đạt giới hạn 30 project trên thiết bị. Hãy xuất và xóa project cũ trước.')
  const source=projects.find(project=>project.id===id);if(!source)throw new Error('Không tìm thấy project cần sao chép.')
  const stem=source.name.slice(0,64);let name=`${stem} (bản sao)`,suffix=2;while(projects.some(project=>project.name.toLocaleLowerCase('vi-VN')===name.toLocaleLowerCase('vi-VN'))){name=`${stem} (bản sao ${suffix++})`}
  const bundle = { ...source.bundle, workspace: { ...source.bundle.workspace, projectId: crypto.randomUUID() } }
  const duplicate:SavedProject={id:crypto.randomUUID(),name:name.slice(0,80),updatedAt:new Date().toISOString(),bundle,revisions:[],tags:[...source.tags]}
  writeProjects([duplicate,...projects],storage);return duplicate
}

export function removeSavedProject(id: string, storage: Storage = getBrowserStorage('localStorage')): void {
  writeProjects(readSavedProjects(storage).filter(project => project.id !== id), storage)
}

function backupCurrentWorkspace(storage: Storage, recoveryBundle?: ProjectBundle): void {
  try {
    if (recoveryBundle) {
      const validatedRecovery = parseProjectBundle(recoveryBundle)
      storage.setItem(DRAFT_RECOVERY_KEY, JSON.stringify(validatedRecovery))
      return
    }
    const workspaceRaw = storage.getItem('machmo-builder-session')
    if (workspaceRaw === null) return
    const workspace = JSON.parse(workspaceRaw) as unknown
    if (workspace === null) return
    const branch = JSON.parse(storage.getItem('machmo-branch-session') ?? '{}') as { drafts?: Record<string, unknown> } & Record<string, unknown>
    const lessonDrafts = JSON.parse(storage.getItem('machmo-lesson-drafts') ?? '{}') as Record<string, unknown>
    const recovery = createProjectBundle({
      workspace: withoutLibraryWorkspaceMetadata(workspace as ProjectBundle['workspace']),
      lessonDrafts,
      branchSession: { mode: branch.mode, order: branch.order },
      branchDrafts: branch.drafts ?? {},
    })
    // Do not overwrite an active workspace unless its recovery copy can be parsed later.
    parseProjectBundle(recovery)
    storage.setItem(DRAFT_RECOVERY_KEY, JSON.stringify(recovery))
  } catch {
    throw new Error('Không tạo được bản sao lưu hợp lệ cho workspace hiện tại; dữ liệu chưa bị thay thế. Hãy xuất project hoặc giải phóng bộ nhớ trình duyệt rồi thử lại.')
  }
}

export type WorkspaceReplacementOptions = {
  storage?: Storage
  libraryEntry?: Pick<SavedProject, 'id' | 'name'>
  recoveryBundle?: ProjectBundle
}

/** Replace the active workspace only after a validated recovery copy is safely stored. */
export function replaceWorkspaceWithBundle(value: unknown, options: WorkspaceReplacementOptions = {}): void {
  const storage = options.storage ?? getBrowserStorage('localStorage')
  const bundle = readPortableBundle(value)
  const workspace = {
    ...bundle.workspace,
    ...(options.libraryEntry ? { libraryEntryId: options.libraryEntry.id, libraryEntryName: options.libraryEntry.name } : {}),
  }
  const writes = [
    ['machmo-builder-session', JSON.stringify(workspace)],
    ['machmo-lesson-drafts', JSON.stringify(bundle.lessonDrafts)],
    ['machmo-branch-session', JSON.stringify({ ...bundle.branchSession, drafts: bundle.branchDrafts })],
  ] as const
  const workspaceKeys = ['machmo-builder-session', 'machmo-lesson-drafts', 'machmo-branch-session'] as const
  const previous = workspaceKeys.map((key) => [key, storage.getItem(key)] as const)
  backupCurrentWorkspace(storage, options.recoveryBundle)

  try {
    for (const [key, serialized] of writes) storage.setItem(key, serialized)
  } catch {
    let rollbackFailed = false
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, value)
      } catch {
        rollbackFailed = true
      }
    }
    if (rollbackFailed) {
      throw new Error('Không mở được project và workspace cũ chưa thể khôi phục hoàn toàn. Bản sao lưu vẫn được giữ nếu trình duyệt còn truy cập được; vào phòng thử và chọn “Khôi phục bản sao lưu”.')
    }
    throw new Error('Không ghi được workspace mới. Workspace cũ đã được khôi phục; hãy giải phóng bộ nhớ trình duyệt rồi thử lại.')
  }
}

export function restoreSavedProject(project: SavedProject, storage: Storage = getBrowserStorage('localStorage')): void {
  replaceWorkspaceWithBundle(project.bundle, { storage, libraryEntry: project })
}
