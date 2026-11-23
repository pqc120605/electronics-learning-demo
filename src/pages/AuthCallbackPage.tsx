import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { UserAvatar } from '../components/UserAvatar'
import { readCurrentUser } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'
import { readOAuthError, safeNextPath, type AuthUser } from '../lib/authUser'
import './Community.css'

type CallbackState =
  | { status: 'unconfigured' }
  | { status: 'working' }
  | { status: 'done'; user: AuthUser }
  | { status: 'error'; message: string }

/** Nhận redirect từ Google/GitHub qua Supabase, hiển thị người dùng rồi quay lại trang trước. */
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNextPath(params.get('next'))
  const [state, setState] = useState<CallbackState>(() => (isSupabaseConfigured ? { status: 'working' } : { status: 'unconfigured' }))

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    const oauthError = readOAuthError(window.location.search, window.location.hash)
    if (oauthError) {
      setState({ status: 'error', message: oauthError })
      return
    }
    // supabase-js tự đọc mã/token trong URL (detectSessionInUrl); getSession chờ bước đó xong.
    readCurrentUser()
      .then(user => {
        if (!active) return
        if (!user) { setState({ status: 'error', message: 'Không nhận được phiên đăng nhập. Liên kết có thể đã hết hạn.' }); return }
        setState({ status: 'done', user })
        window.setTimeout(() => { if (active) navigate(next, { replace: true }) }, 1500)
      })
      .catch(() => { if (active) setState({ status: 'error', message: 'Không xác thực được phiên đăng nhập.' }) })
    return () => { active = false }
  }, [navigate, next])

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="callback-title" aria-live="polite">
        <p className="eyebrow">TÀI KHOẢN MẠCH MỞ</p>
        {state.status === 'unconfigured' && <>
          <h1 id="callback-title">Đăng nhập chưa được kết nối</h1>
          <p className="auth-lead">Mở lại trang đăng nhập để sử dụng phương thức đang có trên Mạch Mở.</p>
          <Link className="button-primary" to="/login">Về trang đăng nhập</Link>
        </>}
        {state.status === 'working' && <>
          <h1 id="callback-title">Đang hoàn tất đăng nhập…</h1>
          <p className="auth-lead">Vui lòng đợi trong giây lát.</p>
        </>}
        {state.status === 'done' && <>
          <h1 id="callback-title">Đăng nhập thành công</h1>
          <div className="auth-signed-in">
            <UserAvatar name={state.user.displayName} url={state.user.avatarUrl} size={44} />
            <div><strong>{state.user.displayName}</strong><p>Đang quay lại trang trước…</p></div>
          </div>
          <Link className="button-primary" to={next} replace>Tiếp tục ngay</Link>
        </>}
        {state.status === 'error' && <>
          <h1 id="callback-title">Chưa đăng nhập được</h1>
          <p className="auth-error" role="alert">{state.message}</p>
          <Link className="button-primary" to={`/login?next=${encodeURIComponent(next)}`}>Thử lại</Link>
        </>}
      </section>
    </div>
  )
}
