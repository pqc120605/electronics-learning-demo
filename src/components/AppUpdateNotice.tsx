import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './AppUpdateNotice.css'

export function AppUpdateNotice() {
  const location = useLocation()
  const [version, setVersion] = useState('')
  const [dismissed, setDismissed] = useState('')

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const workers = navigator.serviceWorker
    let current = workers.controller?.scriptURL
    const onControllerChange = () => {
      const next = workers.controller?.scriptURL
      if (current && next && current !== next) setVersion(next)
      current = next
    }
    workers.addEventListener('controllerchange', onControllerChange)
    return () => workers.removeEventListener('controllerchange', onControllerChange)
  }, [])

  if (!version || version === dismissed) return null
  return <aside className="app-update-notice" aria-label="Cập nhật ứng dụng">
    <div role="status"><strong>Có bản mới</strong><p>Mở ở tab mới để giữ công việc đang làm.</p></div>
    <a href={window.location.origin + location.pathname + location.search + location.hash} target="_blank" rel="noopener noreferrer">Mở bản mới</a>
    <button type="button" onClick={() => setDismissed(version)} aria-label="Ẩn thông báo cập nhật">×</button>
  </aside>
}
