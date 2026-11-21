import { parseProjectBundle, type ProjectBundle } from './projectBundle'
import { addSavedProject, findSavedProjectByName, type SavedProject } from './savedProjects'
import { selfHostedCsrf } from './selfHostedAuth'
import { parseFreestyleProject } from './freestyle/freestyleTransfer'
import type { FreestyleWorkspace } from './freestyle/freestyleCircuit'
import { portableWorkspace } from './freestyle/freestyleShare'

const base = '/api/projects'
type Snapshot = { id: string; name: string; sourceId: string; createdAt: string; byteCount: number; format: 'mach-mo-project' | 'mach-mo-freestyle' }
export type ProjectShare = { code: string; name: string; listed: boolean; hidden?: boolean; createdAt: string; views: number; likes: number }

export async function selfHostedJson<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { ...(method !== 'GET' && selfHostedCsrf), ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  if (response.status === 401) throw new Error('Cần đăng nhập để dùng lưu trực tuyến.')
  if (response.status === 403) throw new Error('Bạn chưa có quyền thực hiện thao tác này.')
  if (response.status === 404) throw new Error('Không tìm thấy mục hoặc bản lưu không khớp bài.')
  if (response.status === 409) throw new Error('Đã chạm giới hạn lưu trữ hoặc mục đang bị ẩn.')
  if (response.status === 204) return undefined as T
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Máy chủ chưa xử lý được yêu cầu.')
  return response.json() as Promise<T>
}

export const projectRequest = <T>(path: string, method = 'GET', body?: unknown) => selfHostedJson<T>(base + path, method, body)

function saveSnapshot(name: string, sourceId: string, bundle: unknown) {
  if (new TextEncoder().encode(JSON.stringify(bundle)).byteLength > 56 * 1024) {
    throw new Error('Project vượt 56 KiB. Bạn vẫn có thể xuất tệp để chuyển sang máy khác.')
  }
  return projectRequest<{ item: Snapshot; conflict?: boolean; repeated?: boolean }>('', 'POST', {
    name, sourceId, bundle,
  })
}

export function syncProject(project: SavedProject) {
  return saveSnapshot(project.name, project.id, project.bundle)
}

export async function shareFreestyle(name: string, sourceId: string, workspace: FreestyleWorkspace) {
  const bundle = { format: 'mach-mo-freestyle', version: 1, workspace: portableWorkspace(workspace) }
  if (!parseFreestyleProject(JSON.stringify(bundle))?.boardId) throw new Error('Chọn board và kiểm tra mạch trước khi chia sẻ.')
  const saved = await saveSnapshot(name, sourceId, bundle)
  return projectRequest<{ code: string }>('/shares', 'POST', { id: saved.item.id, listed: false })
}

export function storeProjectCopy(name: string, value: unknown) {
  const parsed = parseProjectBundle(value)
  let candidate = name.slice(0, 80)
  for (let i = 1; findSavedProjectByName(candidate); i++) {
    const suffix = ' (bản sao ' + i + ')'
    candidate = name.slice(0, 80 - suffix.length) + suffix
  }
  const bundle: ProjectBundle = { ...parsed, workspace: { ...parsed.workspace, projectId: crypto.randomUUID() } }
  return addSavedProject(candidate, bundle)
}

export const listAccountProjects = () => projectRequest<Snapshot[]>('')
export const listAccountShares = () => projectRequest<ProjectShare[]>('/shares')
export const listProjectGallery = () => projectRequest<ProjectShare[]>('/gallery')
export const readAccountProject = (id: string) => projectRequest<Snapshot & { bundle: unknown }>('/' + encodeURIComponent(id))
export const readProjectShare = (code: string) => projectRequest<ProjectShare & { bundle: unknown }>('/shares/' + encodeURIComponent(code))
