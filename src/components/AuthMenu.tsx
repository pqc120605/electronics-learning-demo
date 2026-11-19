import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { signOutUser, useAuth } from '../lib/auth'
import { loginPath } from '../lib/communityStore'
import { UserAvatar } from './UserAvatar'
import './AuthMenu.css'

/**
 * Nút đăng nhập/đăng xuất cho header công khai và topbar workspace.
 * Chưa cấu hình Supabase: vẫn hiện "Đăng nhập" dẫn tới trang giải thích trạng thái "chưa kết nối".
 */
export function AuthMenu({ variant }: { variant: 'public' | 'app' }) {
  const auth = useAuth()
  const { pathname, search } = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const onLoginPage = pathname === '/login' || pathname === '/app/login'
  const next = onLoginPage ? undefined : `${pathname}${search}`

  if (auth.status === 'signed-in') {
    return (
      <div className={`auth-menu auth-menu-${variant}`}>
        <span className="auth-menu-user"><UserAvatar name={auth.user.displayName} url={auth.user.avatarUrl} size={26} /><span className="auth-menu-name">{auth.user.displayName}</span></span>
        <button type="button" className="auth-menu-button" disabled={busy} onClick={async () => {
          setBusy(true)
          setError(false)
          try { await signOutUser() } catch { setError(true) } finally { setBusy(false) }
        }}>Đăng xuất</button>
        {error && <span role="alert">Chưa đăng xuất được. Hãy thử lại.</span>}
      </div>
    )
  }

  return (
    <div className={`auth-menu auth-menu-${variant}`}>
      {variant === 'app' && <span className="workspace-guest"><i aria-hidden="true" /> Khách · lưu trên thiết bị</span>}
      {!onLoginPage && <Link className="auth-menu-button auth-menu-login" to={loginPath(pathname, next)}>{auth.status === 'loading' ? 'Đang kiểm tra…' : 'Đăng nhập'}</Link>}
    </div>
  )
}
