import { Link, useSearchParams } from 'react-router-dom'
import { safeNextPath } from '../lib/authUser'
import { selfHostedOAuthEnabled } from '../lib/backendMode'
import './Community.css'

/** Preserves old bookmarks while OAuth callbacks are handled by the Node API. */
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="callback-title">
        <p className="eyebrow">TÀI KHOẢN MẠCH MỞ</p>
        <h1 id="callback-title">{selfHostedOAuthEnabled ? 'Liên kết đăng nhập đã cũ' : 'Đăng nhập chưa được kết nối'}</h1>
        <p className="auth-lead">Mở trang đăng nhập để thử lại hoặc tiếp tục ở chế độ khách.</p>
        <Link className="button-primary" to={`/login?next=${encodeURIComponent(next)}`}>Về trang đăng nhập</Link>
      </section>
    </div>
  )
}
