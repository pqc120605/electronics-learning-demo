import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getBuilderLesson, type BuilderLessonId } from '../data/builderLessons'
import { useAuth } from '../lib/auth'
import { loginPath } from '../lib/communityStore'
import type { ClassroomKitBundle } from '../lib/classroomKit'
import { listAccountProjects, selfHostedJson } from '../lib/onlineProjects'

type Room = { id: string; title: string; role: 'teacher' | 'student' }
type Assignment = { id: string; lessonId: BuilderLessonId; submitted: number }
type Detail = Room & { joinCode?: string; memberCount?: number; kit: { boardId: string; lessonIds: BuilderLessonId[] }; assignments: Assignment[] }
type Submission = { student: string; project: string; submittedAt: string }
const request = <T,>(path: string, method = 'GET', body?: unknown) => selfHostedJson<T>('/api/classes' + path, method, body)

export function ClassroomOnlinePanel({ bundle }: { bundle: ClassroomKitBundle }) {
  const { pathname } = useLocation()
  const auth = useAuth()
  return <section className="saved-projects" aria-label="Lớp học online">
    <h2>Lớp học online</h2>
    {auth.status === 'signed-in' ? <Rooms key={auth.user.id} bundle={bundle} />
      : <Link to={loginPath(pathname, pathname)}>Đăng nhập để tạo hoặc tham gia lớp</Link>}
  </section>
}

function Rooms({ bundle }: { bundle: ClassroomKitBundle }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [room, setRoom] = useState<Detail>()
  const [selected, setSelected] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [lesson, setLesson] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listAccountProjects>>>([])
  const activeRoom = room?.id === selected ? room : undefined

  useEffect(() => {
    let current = true
    void Promise.all([request<Room[]>(''), listAccountProjects()]).then(([list, files]) => {
      if (current) { setRooms(list); setProjects(files.filter(project => project.format === 'mach-mo-project')) }
    }).catch(() => { if (current) setError('Không tải được lớp học online.') })
    return () => { current = false }
  }, [])
  useEffect(() => {
    if (!selected) return
    let current = true
    setRoom(undefined)
    setLesson('')
    void request<Detail>('/' + selected).then(value => { if (current) setRoom(value) })
      .catch(() => { if (current) setError('Không mở được lớp đã chọn.') })
    return () => { current = false }
  }, [selected])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setNotice('')
    setError('')
    try { await action() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không xử lý được yêu cầu.') }
    finally { setBusy(false) }
  }
  const availableLessons = activeRoom?.kit.lessonIds.filter(id => !activeRoom.assignments.some(assignment => assignment.lessonId === id)) ?? []
  const nextLesson = availableLessons.includes(lesson as BuilderLessonId) ? lesson : availableLessons[0]
  return <>
    <button type="button" disabled={busy || bundle.lessonIds.length === 0} onClick={() => run(async () => {
      const created = await request<Room>('', 'POST', { title: bundle.title, kit: bundle })
      setRooms(await request<Room[]>(''))
      setSelected(created.id)
      setNotice('Đã tạo lớp từ board và bài trong gói đang mở.')
    })}>Tạo lớp từ gói này</button>
    <form className="saved-project-tools" onSubmit={(event: FormEvent) => {
      event.preventDefault()
      void run(async () => {
        const joined = await request<{ id: string }>('/join', 'POST', { code: joinCode.trim() })
        setRooms(await request<Room[]>(''))
        setSelected(joined.id)
        setJoinCode('')
        setNotice('Đã vào lớp.')
      })
    }}>
      <label>Mã tham gia <input value={joinCode} maxLength={12} onChange={event => setJoinCode(event.target.value)} /></label>
      <button disabled={busy || joinCode.trim().length !== 12}>Tham gia lớp</button>
    </form>
    {!!rooms.length && <label>Lớp của bạn <select value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}>
      <option value="">Chọn lớp…</option>
      {rooms.map(item => <option key={item.id} value={item.id}>{item.title} · {item.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</option>)}
    </select></label>}
    {activeRoom && <section>
      <h3>{activeRoom.title}</h3>
      {activeRoom.role === 'teacher' && <>
        <p>Mã tham gia <code>{activeRoom.joinCode}</code> · {activeRoom.memberCount} học sinh</p>
        {nextLesson && <div className="saved-project-tools">
          <label>Bài cần giao <select value={nextLesson} onChange={event => setLesson(event.target.value)}>
            {availableLessons.map(id => <option key={id} value={id}>{getBuilderLesson(id).title}</option>)}
          </select></label>
          <button type="button" disabled={busy} onClick={() => run(async () => {
            await request('/' + activeRoom.id + '/assignments', 'POST', { lessonId: nextLesson })
            setRoom(await request<Detail>('/' + activeRoom.id))
          })}>Giao bài</button>
        </div>}
      </>}
      {!activeRoom.assignments.length && <p>Chưa có bài được giao.</p>}
      {activeRoom.assignments.map(item => <ClassAssignment key={item.id} room={activeRoom} assignment={item} projects={projects}
        onSubmit={projectId => run(async () => {
          await request('/' + activeRoom.id + '/submissions', 'POST', { assignmentId: item.id, projectId })
          setRoom(await request<Detail>('/' + activeRoom.id))
          setNotice('Máy chủ đã nhận bài nộp.')
        })} />)}
    </section>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
  </>
}

function ClassAssignment({ room, assignment, projects, onSubmit }: {
  room: Detail; assignment: Assignment; projects: Awaited<ReturnType<typeof listAccountProjects>>; onSubmit: (id: string) => Promise<void>
}) {
  const [projectId, setProjectId] = useState('')
  const [review, setReview] = useState<Submission[] | null>(null)
  const [error, setError] = useState('')
  return <details>
    <summary>{getBuilderLesson(assignment.lessonId).title} · {room.role === 'teacher' ? assignment.submitted + ' đã nộp' : assignment.submitted ? 'Đã nộp' : 'Chưa nộp'}</summary>
    <p><Link to={'/build?' + new URLSearchParams({ lesson: assignment.lessonId, board: room.kit.boardId, guided: '1' })}>Mở bài thực hành</Link></p>
    {room.role === 'teacher' ? <>
      <button type="button" onClick={async () => {
        setError('')
        try { setReview(await request<Submission[]>('/' + room.id + '/submissions/' + assignment.id)) }
        catch { setError('Không tải được bài nộp.') }
      }}>Xem bài đã nộp</button>
      {review && (review.length ? <ul>{review.map((item, index) => <li key={item.submittedAt + ':' + index}>{item.student} · {item.project} · {new Date(item.submittedAt).toLocaleString('vi-VN')}</li>)}</ul>
        : <p>Chưa có bài nộp.</p>)}
    </> : projects.length ? <>
      <label>Bản project đã lưu trên tài khoản <select value={projectId} onChange={event => setProjectId(event.target.value)}>
        <option value="">Chọn project…</option>
        {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select></label>
      <button type="button" disabled={!projectId} onClick={() => void onSubmit(projectId)}>Nộp bài</button>
    </> : <p><Link to="/projects">Lưu project lên tài khoản</Link> trước khi nộp bài.</p>}
    {error && <p role="alert">{error}</p>}
  </details>
}
