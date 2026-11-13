import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getPageTitle } from '../data/productRoutes'
import { trackPageView } from '../lib/analytics'
import { SiteNavigation } from './SiteNavigation'
import { AppWorkspaceNavigation } from './AppWorkspaceNavigation'

type SiteShellProps = {
  children: ReactNode
  variant?: 'public' | 'app'
}

export function SiteShell({ children, variant = 'public' }: SiteShellProps) {
  const { pathname } = useLocation()
  const previousPathRef = useRef(pathname)

  useEffect(() => {
    trackPageView('page_view')
    document.title = getPageTitle(pathname)
    if (previousPathRef.current !== pathname) {
      const main = document.getElementById('main-content')
      const target = main?.querySelector<HTMLElement>('h1') ?? main
      if (target) {
        target.setAttribute('tabindex', '-1')
        target.classList.add('route-focus-target')
        target.focus({ preventScroll: true })
        target.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    }
    previousPathRef.current = pathname
  }, [pathname])

  return (
    <div className={`site-frame${variant === 'app' ? ' app-workspace-frame' : ''}`}>
      <a className="skip-link" href="#main-content">Đi đến nội dung chính</a>
      {variant === 'app' ? <AppWorkspaceNavigation /> : <header className="site-header">
        <Link className="brand" to="/" aria-label="Mạch Mở, về trang khám phá">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M5 16h7m8 0h7M16 5v7m0 8v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="16" r="4" fill="currentColor" />
              <circle cx="5" cy="16" r="2" fill="currentColor" />
              <circle cx="27" cy="16" r="2" fill="currentColor" />
              <circle cx="16" cy="5" r="2" fill="currentColor" />
              <circle cx="16" cy="27" r="2" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-name">Mạch Mở</span>
        </Link>
        <SiteNavigation />
        <Link className="header-cta" to={pathname === '/app' ? '/learn/esp32-led' : '/app'}>
          {pathname === '/app' ? 'Bài đầu tiên' : 'Mở ứng dụng'} <span aria-hidden="true">↗</span>
        </Link>
      </header>}
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="footer-symbol" aria-hidden="true">M</span>
          <div>
            <strong>Mạch Mở</strong>
            <p>Hiểu mạch điện bằng cách tự tay làm.</p>
          </div>
        </div>
        <p className="privacy-note">Một số lượt xem và thao tác được ghi nhận bằng mã phiên ngẫu nhiên trong tab để cải thiện bài học. Sự kiện không lưu tên hay email. <Link to="/privacy">Chính sách quyền riêng tư</Link></p>
        {variant === 'public' && <Link className="admin-entry" to="/admin/login">Khu quản trị</Link>}
      </footer>
    </div>
  )
}
