import { useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { UserAvatar } from '../components/UserAvatar'
import { isSelfHostedAuth, signInWithProvider, signOutUser, useAuth } from '../lib/auth'
import { redeemSelfHostedInvite, selfHostedOAuthEnabled } from '../lib/selfHostedAuth'
import { OAUTH_PROVIDERS, safeNextPath, type OAuthProviderId } from '../lib/authUser'
import { communityBase } from '../lib/communityStore'
import './Community.css'

function ProviderIcon({ id }: { id: OAuthProviderId }) {
  if (id === 'github') return <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
  return <svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" /><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" /><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" /><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" /></svg>
}

export function LoginPage() {
  const auth = useAuth()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'), communityBase(pathname))
  const [pending, setPending] = useState<OAuthProviderId | null>(null)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState('')
  const [sessionBusy, setSessionBusy] = useState(false)
  const unconfigured = auth.status === 'unconfigured'
  const inviteMode = isSelfHostedAuth && !selfHostedOAuthEnabled
  const oauthError = params.get('oauth_error')
  const callbackNotice = oauthError === 'unavailable' ? 'Nhà cung cấp này chưa sẵn sàng trên máy chủ.'
    : oauthError === 'retry' ? 'Không hoàn tất đăng nhập. Chọn nhà cung cấp để thử lại.' : ''

  async function manageSession(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError('')
    setSessionBusy(true)
    try {
      if (event) {
        await redeemSelfHostedInvite(invite.trim())
        setInvite('')
      } else {
        await signOutUser()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được phiên đăng nhập.')
    } finally {
      setSessionBusy(false)
    }
  }

  async function start(provider: OAuthProviderId) {
    setError('')
    setPending(provider)
    try {
      await signInWithProvider(provider, next)
      // Trình duyệt sẽ chuyển sang trang của nhà cung cấp; giữ trạng thái chờ.
    } catch {
      setPending(null)
      setError('Không mở được trang đăng nhập. Vui lòng thử lại.')
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">TÀI KHOẢN MẠCH MỞ</p>
        <h1 id="login-title">Đăng nhập</h1>
        <p className="auth-lead">{inviteMode ? 'Đăng nhập bằng mã mời để thử tài khoản. Bài học, phòng thử và công cụ vẫn dùng được ở chế độ khách.' : 'Đăng nhập để viết bài và bình luận trong cộng đồng. Bài học, phòng thử và công cụ vẫn dùng được ở chế độ khách.'}</p>
        {callbackNotice && <p className="auth-error" role="alert">{callbackNotice}</p>}

        {auth.status === 'signed-in' ? (
          <div className="auth-signed-in" role="status">
            <UserAvatar name={auth.user.displayName} url={auth.user.avatarUrl} size={44} />
            <div><strong>{auth.user.displayName}</strong><p>Bạn đã đăng nhập.</p></div>
            <div className="auth-actions-row">
              <Link className="button-primary" to={next}>Tiếp tục</Link>
              <button type="button" className="auth-secondary" disabled={sessionBusy} onClick={() => { void manageSession() }}>Đăng xuất</button>
            </div>
          </div>
        ) : (
          <>
            {unconfigured && (
              <div className="auth-notice" role="status" id="auth-unconfigured">
                <strong>Đăng nhập chưa được kết nối</strong>
                <p>Bản web này chưa khai báo Supabase nên chưa thể đăng nhập bằng Google hay GitHub. Không có tài khoản nào được tạo giả. Bạn vẫn có thể học và lưu tiến độ trên thiết bị.</p>
              </div>
            )}
            {inviteMode ? <form className="auth-providers" onSubmit={manageSession}>
              <label htmlFor="pilot-invite">Mã mời dùng một lần</label>
              <input type="password" id="pilot-invite" autoComplete="off" required maxLength={80} value={invite} onChange={event => setInvite(event.currentTarget.value)} />
              <button type="submit" className="button-primary" disabled={sessionBusy || auth.status === 'loading' || !invite.trim()}>
                {sessionBusy ? 'Đang kiểm tra mã…' : 'Đăng nhập bằng mã mời'}
              </button>
            </form> : <div className="auth-providers">
              {OAUTH_PROVIDERS.map(provider => (
                <button key={provider.id} type="button" className={`auth-provider auth-provider-${provider.id}`} disabled={unconfigured || pending !== null || auth.status === 'loading'} aria-describedby={unconfigured ? 'auth-unconfigured' : undefined} onClick={() => start(provider.id)}>
                  <ProviderIcon id={provider.id} />
                  <span>{pending === provider.id ? 'Đang chuyển hướng…' : `Đăng nhập bằng ${provider.label}`}</span>
                </button>
              ))}
            </div>}
          </>
        )}
        {(error || auth.status === 'error') && <p className="auth-error" role="alert">{error || (auth.status === 'error' ? auth.message : '')}</p>}

        <div className="auth-guest">
          <p><strong>Chế độ khách:</strong> tiến độ học, mạch và bài nháp được lưu cục bộ trong trình duyệt này, không gửi lên máy chủ.</p>
          <Link to={pathname.startsWith('/app') ? '/app' : '/'}>Tiếp tục với chế độ khách</Link>
        </div>
        <p className="auth-fineprint">{inviteMode ? 'Bản thử tài khoản chỉ hiển thị tên bạn dùng khi được mời.' : 'Khi đăng nhập, Mạch Mở chỉ hiển thị tên và ảnh đại diện từ Google/GitHub.'} Xem <Link to="/privacy">chính sách quyền riêng tư</Link>.</p>
      </section>
    </div>
  )
}
