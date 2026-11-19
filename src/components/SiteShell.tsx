import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getPageTitle, getPublicCanonicalPath, PRODUCT_ROUTES, PUBLIC_SITE_ORIGIN } from '../data/productRoutes'
import { analyticsConfigured, isLocalAnalyticsAdmin, trackPageView } from '../lib/analytics'
import { isSupabaseConfigured } from '../lib/supabase'
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
    const title = getPageTitle(pathname)
    document.title = title
    const canonicalPath = getPublicCanonicalPath(pathname)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement('link')
    if (canonicalPath) {
      canonical.rel = 'canonical'
      canonical.href = new URL(canonicalPath, PUBLIC_SITE_ORIGIN).href
      if (!canonical.isConnected) document.head.append(canonical)
    } else {
      canonical.remove()
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalPath ? canonical.href : PUBLIC_SITE_ORIGIN)
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
      <TourHost />
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
        {variant === 'public' && (isSupabaseConfigured || isLocalAnalyticsAdmin()) && <Link className="admin-entry" to="/admin/login">Khu quản trị</Link>}
      </footer>
      </div>
      <GuideHost />
    </div></GuideProvider>
  )
}
