import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signInAdmin } from '../lib/admin'
import { isSupabaseConfigured } from '../lib/supabase'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { document.title = 'Đăng nhập quản trị — Mạch Mở' }, [])

  if (!isSupabaseConfigured) {
    return <main className="admin-state"><div className="admin-state-card"><span className="admin-state-symbol">⚙</span><p className="eyebrow">KHU QUẢN TRỊ</p><h1>Chưa kết nối Supabase</h1><p>Trang học miễn phí vẫn dùng được. Để đăng nhập và xem thống kê, hãy cấu hình một Supabase project riêng theo README.</p><Link className="button-primary" to="/">Về trang học</Link></div></main>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInAdmin(email.trim(), password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/admin'
      navigate(destination, { replace: true })
    } catch {
      setError('Không đăng nhập được. Kiểm tra email, mật khẩu và quyền admin đã được cấp.')
    } finally {
      setBusy(false)
    }
  }

  if (location.pathname !== '/admin/login') return <Navigate to="/admin/login" replace />

  return (
    <main className="admin-state">
      <section className="admin-login-card">
        <Link className="admin-back" to="/">← Về trang học</Link>
        <span className="admin-login-mark" aria-hidden="true">M</span>
        <p className="eyebrow">KHU VỰC RIÊNG</p>
        <h1>Đăng nhập quản trị</h1>
        <p className="admin-login-intro">Chỉ tài khoản founder được cấp quyền mới xem được số liệu sử dụng.</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-email">Email quản trị</label>
          <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="admin-password">Mật khẩu</label>
          <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'} <span aria-hidden="true">↗</span></button>
        </form>
        <p className="admin-login-foot">Không có đăng ký tài khoản từ trang này.</p>
      </section>
    </main>
  )
}
