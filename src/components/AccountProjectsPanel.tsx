import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  listAccountProjects, listAccountShares, listProjectGallery, projectRequest, readAccountProject, storeProjectCopy, syncProject, type ProjectShare,
} from '../lib/onlineProjects'
import type { SavedProject } from '../lib/savedProjects'
import { parseFreestyleProject } from '../lib/freestyle/freestyleTransfer'
import { archiveFreestyle } from '../lib/freestyle/freestyleDrafts'
import { getBrowserStorage } from '../lib/workspaceStorage'

type Props = { local: SavedProject[]; onCopy: (project: SavedProject) => void }

export function AccountProjectsPanel(props: Props) {
  const auth = useAuth()
  const account = auth.status === 'signed-in' ? auth.user.id : null
  return <AccountProjects key={account ?? 'guest'} account={account} {...props} />
}

function AccountProjects({ local, onCopy, account }: Props & { account: string | null }) {
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof listAccountProjects>>>([])
  const [shares, setShares] = useState<ProjectShare[]>([])
  const [gallery, setGallery] = useState<ProjectShare[]>([])
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const authOrigin = window.location.pathname.startsWith('/app') ? '/app/login?next=%2Fapp%2Fprojects' : '/login?next=%2Fprojects'
  const current = local.find(project => project.id === selected) ?? local[0]

  useEffect(() => {
    let active = true
    setEntries([])
    setShares([])
    setLink('')
    if (account) void Promise.all([listAccountProjects(), listAccountShares()]).then(([projects, links]) => {
      if (active) { setEntries(projects); setShares(links) }
    }).catch(() => { if (active) setError('Không tải được project tài khoản.') })
    return () => { active = false }
  }, [account])

  async function run(operation: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try { await operation() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xử lý được yêu cầu.') }
    finally { setBusy(false) }
  }

  return <section className="saved-projects" aria-label="Project trên tài khoản">
    <h2>Project trên tài khoản</h2>
    {account ? <>
      {current && <div className="saved-project-tools">
        <label>Project trên thiết bị
          <select value={current.id} onChange={event => setSelected(event.target.value)} disabled={busy}>
            {local.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => run(async () => {
          const result = await syncProject(current)
          setEntries(await listAccountProjects())
          setMessage(result.conflict ? 'Đã giữ cả hai bản trên tài khoản.' : 'Đã lưu bản project lên tài khoản.')
        })}>Lưu lên tài khoản</button>
      </div>}
      {entries.length ? <ul className="saved-project-list">
        {entries.map(project => <li className="saved-project-card" key={project.id}>
          <div><strong>{project.name}</strong><small>{new Date(project.createdAt).toLocaleString('vi-VN')}</small></div>
          <div>
            <button type="button" disabled={busy} onClick={() => run(async () => {
              const snapshot = await readAccountProject(project.id)
              if (snapshot.format === 'mach-mo-freestyle') {
                const workspace = parseFreestyleProject(JSON.stringify(snapshot.bundle))
                if (!workspace || !archiveFreestyle(getBrowserStorage('localStorage'), JSON.stringify(workspace)).ok) {
                  throw new Error('Chưa lưu được bản nháp mạch tự do trên thiết bị.')
                }
                setMessage('Đã lưu trong Bản nháp của bàn lắp mạch tự do.')
              } else {
                onCopy(storeProjectCopy(snapshot.name, snapshot.bundle))
                setMessage('Đã lưu một bản riêng trên thiết bị.')
              }
            })}>Lưu bản sao về máy</button>
            <button type="button" disabled={busy} onClick={() => run(async () => {
              const result = await projectRequest<{ code: string }>('/shares', 'POST', { id: project.id, listed: false })
              setLink('/s/' + result.code)
              setShares(await listAccountShares())
            })}>Tạo link giới hạn người biết</button>
            <button type="button" disabled={busy} onClick={() => {
              if (!window.confirm('Đưa toàn bộ mạch và code trong bản này lên thư viện công khai?')) return
              void run(async () => {
                const result = await projectRequest<{ code: string }>('/shares', 'POST', { id: project.id, listed: true })
                setLink('/s/' + result.code)
                setShares(await listAccountShares())
              })
            }}>Đăng vào thư viện công khai</button>
            <button type="button" disabled={busy} onClick={() => {
              if (!window.confirm('Xóa bản này trên tài khoản và thu hồi các link đi kèm?')) return
              void run(async () => {
                await projectRequest('/' + project.id, 'DELETE')
                setEntries(await listAccountProjects())
                setShares(await listAccountShares())
                setLink('')
                setMessage('Đã xóa bản trên tài khoản.')
              })
            }}>Xóa bản trên tài khoản</button>
          </div>
        </li>)}
      </ul> : <p>Chưa có bản lưu trên tài khoản.</p>}
      {link && <p><Link to={link}>Mở liên kết vừa tạo</Link> <button type="button" onClick={() => run(async () => {
        await navigator.clipboard.writeText(window.location.origin + link)
        setMessage('Đã sao chép liên kết.')
      })}>Sao chép link</button></p>}
      {shares.length > 0 && <details><summary>Link đã chia sẻ</summary><ul>
        {shares.map(share => <li key={share.code}>
          {share.hidden ? <span>{share.name} · đang ẩn</span> : <Link to={'/s/' + share.code}>{share.name}</Link>}
          {' · '}{share.listed ? 'Công khai' : 'Theo link'} <button type="button" disabled={busy} onClick={() => {
            if (!window.confirm('Thu hồi link chia sẻ này?')) return
            void run(async () => {
              await projectRequest('/shares/' + share.code, 'DELETE')
              setShares(await listAccountShares())
              setLink('')
            })
          }}>Thu hồi link</button>
        </li>)}
      </ul></details>}
    </> : <p><Link to={authOrigin}>Đăng nhập để lưu project lên tài khoản</Link></p>}
    <h3>Thư viện project công khai</h3>
    <button type="button" disabled={busy} onClick={() => run(async () => {
      const projects = await listProjectGallery()
      setGallery(projects)
      if (!projects.length) setMessage('Chưa có project công khai.')
    })}>Tải thư viện</button>
    <ul>{gallery.map(share => <li key={share.code}><Link to={'/s/' + share.code}>{share.name}</Link> · {share.likes} lượt thích</li>)}</ul>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </section>
}
