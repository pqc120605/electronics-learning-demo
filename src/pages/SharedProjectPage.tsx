import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReportButton } from '../components/community/ReportButton'
import { useAuth } from '../lib/auth'
import { projectRequest, readProjectShare, storeProjectCopy } from '../lib/onlineProjects'
import { parseFreestyleProject } from '../lib/freestyle/freestyleTransfer'

const SharedFreestyleBench = lazy(() => import('./FreestyleLabPage').then(module => ({ default: module.SharedFreestyleBench })))

export function SharedProjectPage() {
  const { code = '' } = useParams()
  const auth = useAuth()
  const [project, setProject] = useState<Awaited<ReturnType<typeof readProjectShare>>>()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const format = (project?.bundle as { format?: string } | null)?.format
  const freestyle = useMemo(() => format === 'mach-mo-freestyle' ? parseFreestyleProject(JSON.stringify(project?.bundle)) : null, [format, project?.bundle])
  useEffect(() => {
    let active = true
    setProject(undefined)
    setError('')
    setSaved('')
    if (!/^[A-Za-z0-9_-]{16}$/.test(code)) {
      setError('Mã chia sẻ không hợp lệ.')
      return
    }
    void readProjectShare(code).then(value => { if (active) setProject(value) })
      .catch(() => { if (active) setError('Không mở được project hoặc link đã được thu hồi.') })
    return () => { active = false }
  }, [code])

  async function like(enabled: boolean) {
    try {
      const result = await projectRequest<{ likes: number }>('/shares/' + code + '/like', enabled ? 'POST' : 'DELETE')
      setProject(value => value?.code === code ? { ...value, likes: result.likes } : value)
    } catch { setError('Chưa ghi được lượt thích. Hãy thử lại.') }
  }
  return <article className="route-placeholder">
    <h1>{project?.name ?? 'Project được chia sẻ'}</h1>
    {project && <>
      <p>{project.views} lượt mở · {project.likes} lượt thích. Lưu bản sao để chỉnh sửa trong thư viện trên thiết bị của bạn.</p>
      {format === 'mach-mo-freestyle' ? (freestyle?.boardId
        ? <Suspense fallback={<p role="status">Đang mở bàn lắp mạch…</p>}><SharedFreestyleBench key={code} workspace={freestyle} /></Suspense>
        : <p role="alert">Dữ liệu mạch tự do không hợp lệ.</p>) : <button type="button" onClick={() => {
        try { setSaved(storeProjectCopy(project.name, project.bundle).id); setError('') }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa tạo được bản sao.') }
      }}>Mở bản sao</button>}
      {saved && <p role="status"><Link to={'/projects?saved=' + saved}>Xem bản sao đã lưu</Link></p>}
      {auth.status === 'signed-in' && <>
        {project.listed && <p><button type="button" onClick={() => void like(true)}>Thích</button> <button type="button" onClick={() => void like(false)}>Bỏ thích</button></p>}
        <ReportButton targetType="project" targetId={code} targetLabel="project này" />
      </>}
    </>}
    {!project && !error && <p role="status">Đang tải project…</p>}
    {error && <p role="alert">{error}</p>}
    <Link to="/projects">Về thư viện project</Link>
  </article>
}
