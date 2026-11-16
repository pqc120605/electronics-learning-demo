import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PRODUCT_ROUTES as R, PUBLIC_TO_APP_ROUTE } from '../data/productRoutes'
import { appNavigationGroups, productFeatureRegistry } from '../data/productFeatureRegistry'
import { AuthMenu } from './AuthMenu'
import { HelpMenu } from './onboarding/Onboarding'
import './AppWorkspaceNavigation.css'
import { BrandLogo } from './brand/BrandLogo'

const navigationGroups = appNavigationGroups.map(group => ({
  label: group.label,
  items: group.features.map(id => productFeatureRegistry[id]),
}))
const pageLabels = Object.fromEntries(Object.values(productFeatureRegistry).map(feature => [feature.appRoute, feature.appLabel])) as Record<string, string>
const groupOf = Object.fromEntries(appNavigationGroups.flatMap(group => group.features.map(id => [productFeatureRegistry[id].appRoute, group.label]))) as Record<string, string>

/** Thanh dưới trên điện thoại: đúng năm khu vực như điều hướng công khai. */
const mobileItems: Array<{ to: string; icon: string; label: string; match: (path: string) => boolean }> = [
  { to: R.appLearn, icon: '◎', label: 'Học', match: path => path === R.appHome || path.startsWith('/app/learn') || path === R.appProjects || path === R.appClassroomKit || path === '/app/robot-simulation' },
  { to: R.appFreestyle, icon: '⌁', label: 'Lắp mạch', match: path => path.startsWith(R.appLab) },
  { to: R.appBoards, icon: '▦', label: 'Thư viện', match: path => path === R.appBoards || path === R.appComponents },
  { to: R.appSketch, icon: '▷', label: 'Công cụ', match: path => path.startsWith('/app/tools/') },
  { to: R.appCommunity, icon: '◇', label: 'Cộng đồng', match: path => path.startsWith(R.appCommunity) },
]

export function AppWorkspaceNavigation() {
  const { pathname } = useLocation()
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const activePath = PUBLIC_TO_APP_ROUTE[pathname] ?? pathname
  const title = pageLabels[activePath] ?? (activePath.startsWith(`${R.appCommunity}/`) ? 'Cộng đồng' : activePath === R.appLogin ? 'Đăng nhập' : 'Không gian học')
  const section = groupOf[activePath] ?? (activePath.startsWith(R.appCommunity) ? 'CỘNG ĐỒNG' : 'MẠCH MỞ')
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return <>
    <header className="workspace-topbar">
      <NavLink className="workspace-brand" to={R.appHome}>
        <BrandLogo compact /><span><strong>Mạch Mở</strong><small>WORKSPACE</small></span>
      </NavLink>
      <div className="workspace-current" aria-live="polite"><span>{section}</span><strong>{title}</strong></div>
      <div className="workspace-top-actions"><HelpMenu /><AuthMenu variant="app" /><Link className="workspace-web-link" aria-label="Về website" title="Về website" to={`${R.publicHome}?surface=web`}><span className="workspace-web-label">Về website</span> <span aria-hidden="true">↗</span></Link></div>
    </header>
    {!online && <div className="workspace-offline-notice" role="status">Đang ngoại tuyến · Bản nháp cục bộ vẫn dùng được; tính năng cần mạng có thể tạm gián đoạn.</div>}
    <aside className="workspace-sidebar" aria-label="Điều hướng không gian học">
      {navigationGroups.map(group => <section className="workspace-nav-group" key={group.label} aria-label={group.label}>
        <h2>{group.label}</h2>{group.items.map(item => <NavLink key={item.appRoute} to={item.appRoute} end className={({ isActive }) => `workspace-nav-link${isActive || activePath === item.appRoute ? ' workspace-nav-link-active' : ''}`}>
          <span className="workspace-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.appLabel}</span>
        </NavLink>)}
      </section>)}
      <div className="workspace-sidebar-note"><strong>Tiến độ khách</strong><p>Bài vừa mở và checklist được lưu cục bộ trong trình duyệt này.</p></div>
    </aside>
    <nav className="workspace-mobile-nav" aria-label="Điều hướng nhanh">
      {mobileItems.map(item => <NavLink key={item.to} to={item.to} end className={({ isActive }) => isActive || item.match(activePath) ? 'active' : ''}><span aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}
    </nav>
  </>
}
