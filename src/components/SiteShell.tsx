import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getPageTitle, PRODUCT_ROUTES } from '../data/productRoutes'
import { analyticsConfigured, trackPageView } from '../lib/analytics'
import { SiteNavigation } from './SiteNavigation'
import { AppWorkspaceNavigation } from './AppWorkspaceNavigation'
import { AuthMenu } from './AuthMenu'
import { HelpMenu, TourHost } from './onboarding/Onboarding'
import { BrandLogo } from './brand/BrandLogo'
import { GuideProvider } from './guide/GuideContext'
import { GuideHost } from './guide/GuideHost'

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
    <GuideProvider><div className={`site-frame${variant === 'app' ? ' app-workspace-frame' : ''}`}>
      <a className="skip-link" href="#main-content">Đi đến nội dung chính</a>
      {variant === 'app' ? <AppWorkspaceNavigation /> : <header className="site-header">
        <Link className="brand" to="/" aria-label="Mạch Mở, về trang khám phá">
          <BrandLogo />
        </Link>
        <SiteNavigation />
        <HelpMenu />
        <Link className="header-cta" to={PRODUCT_ROUTES.publicBasics}>
          Bắt đầu học <span aria-hidden="true">↗</span>
        </Link>
        <div className="header-auth"><AuthMenu variant="public" /></div>
      </header>}
      <div className="site-scroll" data-scroll-root="">
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <BrandLogo compact />
          <div>
            <strong>Mạch Mở</strong>
            <p>Hiểu mạch điện bằng cách tự tay làm.</p>
          </div>
        </div>
        <p className="privacy-note">{analyticsConfigured && "Một số lượt xem và thao tác được ghi nhận bằng mã phiên ngẫu nhiên trong tab để cải thiện bài học. Sự kiện không lưu tên hay email. "}<Link to="/privacy">Chính sách quyền riêng tư</Link> · <Link to={variant==='app'?'/app/feedback':'/feedback'} state={{from:pathname}}>Góp ý & báo lỗi</Link> · <Link to={`${variant==='app'?'/app/feedback':'/feedback'}#nguoi-phat-trien`}>Người phát triển</Link></p>
        {variant === 'public' && <Link className="admin-entry" to="/admin/login">Khu quản trị</Link>}
      </footer>
      </div>
      <TourHost />
      <GuideHost />
    </div></GuideProvider>
  )
}
