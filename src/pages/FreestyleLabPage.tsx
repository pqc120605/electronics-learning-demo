import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FreestyleBench } from '../components/freestyle/FreestyleBench'
import type { FreestyleWorkspace } from '../lib/freestyle/freestyleCircuit'
import { archiveFreestyle } from '../lib/freestyle/freestyleDrafts'
import { readFreestyleShare } from '../lib/freestyle/freestyleShare'
import { getBrowserStorage } from '../lib/workspaceStorage'

function SharedCircuit({ fragment }: { fragment: string }) {
  const [workspace, setWorkspace] = useState<FreestyleWorkspace>()
  const [error, setError] = useState('')
  const [copyKey, setCopyKey] = useState('')

  useEffect(() => {
    let active = true
    void readFreestyleShare(fragment).then(value => { if (active) setWorkspace(value) })
      .catch(reason => { if (active) setError(reason.message) })
    return () => { active = false }
  }, [fragment])

  if (!workspace) return <section className="freestyle-card">
    {error ? <><h1>Không mở được mạch chia sẻ</h1><p role="alert">{error}</p><Link to="/app/lab/freestyle">Mở bàn mới</Link></>
      : <p role="status">Đang đọc mạch chia sẻ…</p>}
  </section>

  return <>
    {error && <p className="freestyle-card" role="alert">{error}</p>}
    {copyKey && <p className="freestyle-card" role="status">Đang sửa bản sao. Bản nháp gốc có thể mở lại từ Bản nháp.</p>}
    <FreestyleBench key={copyKey || 'shared'} variant="full" initialWorkspace={workspace} readOnly={!copyKey}
      storageKey={copyKey || undefined} onCopy={() => {
        const result = archiveFreestyle(getBrowserStorage('localStorage'), JSON.stringify(workspace))
        if (result.ok) { setError(''); setCopyKey(result.key) }
        else setError('Chưa lưu được bản sao vào bộ nhớ trình duyệt.')
      }} />
  </>
}

/** Phòng lắp mạch tự do toàn màn hình (2026-11-14): cùng mạch/code đã lưu cục bộ với bàn ở trang chủ. */
export function FreestyleLabPage() {
  const { hash } = useLocation()
  return <div className="freestyle-page mm-fit">{hash.startsWith('#s=') ? <SharedCircuit key={hash} fragment={hash} /> : <FreestyleBench variant="full" />}</div>
}
