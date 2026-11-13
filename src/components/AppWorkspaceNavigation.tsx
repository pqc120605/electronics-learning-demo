import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PRODUCT_ROUTES as R, PUBLIC_TO_APP_ROUTE } from '../data/productRoutes'
import { appNavigationGroups, productFeatureRegistry } from '../data/productFeatureRegistry'
import './AppWorkspaceNavigation.css'

const navigationGroups = appNavigationGroups.map(group => ({
  label: group.label,
  items: group.features.map(id => productFeatureRegistry[id]),
}))
const pageLabels = Object.fromEntries(Object.values(productFeatureRegistry).map(feature => [feature.appRoute, feature.appLabel])) as Record<string, string>

export function AppWorkspaceNavigation() {
  const { pathname } = useLocation()
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  const activePath = PUBLIC_TO_APP_ROUTE[pathname] ?? pathname
  const title = pageLabels[activePath] ?? 'Không gian học'
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return <>
    <header className="workspace-topbar">
      <NavLink className="workspace-brand" to={R.appHome}>
        <span className="workspace-brand-mark" aria-hidden="true">M</span><span><strong>Mạch Mở</strong><small>WORKSPACE</small></span>
      </NavLink>
      <div className="workspace-current" aria-live="polite"><span>KHÔNG GIAN HỌC</span><strong>{title}</strong></div>
      <div className="workspace-top-actions"><span className="workspace-guest"><i aria-hidden="true" /> Khách · lưu trên thiết bị</span><Link className="workspace-web-link" to={`${R.publicHome}?surface=web`}>Về website <span aria-hidden="true">↗</span></Link></div>
    </header>
    {!online && <div className="workspace-offline-notice" role="status">Đang ngoại tuyến · Bản nháp cục bộ vẫn dùng được; tính năng cần mạng có thể tạm gián đoạn.</div>}
    <aside className="workspace-sidebar" aria-label="Điều hướng không gian học">
      <div className="workspace-sidebar-intro"><span className="workspace-kicker">MẠCH MỞ · PWA</span><p>Học, tra cứu và thử mạch trong một workspace.</p></div>
      {navigationGroups.map(group => <section className="workspace-nav-group" key={group.label} aria-label={group.label}>
        <h2>{group.label}</h2>{group.items.map(item => <NavLink key={item.appRoute} to={item.appRoute} end className={({ isActive }) => `workspace-nav-link${isActive || activePath === item.appRoute ? ' workspace-nav-link-active' : ''}`}>
          <span className="workspace-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.appLabel}</span>
        </NavLink>)}
      </section>)}
      <div className="workspace-sidebar-note"><strong>Tiến độ khách</strong><p>Bài vừa mở và checklist được lưu cục bộ trong trình duyệt này.</p></div>
    </aside>
    <nav className="workspace-mobile-nav" aria-label="Điều hướng nhanh">
      <NavLink to={R.appHome} end className={({ isActive }) => isActive || activePath === R.appHome ? 'active' : ''}><span aria-hidden="true">⌂</span>Tổng quan</NavLink>
      <NavLink to={R.appLearn} end className={({ isActive }) => isActive || activePath === R.appLesson ? 'active' : ''}><span aria-hidden="true">◎</span>Học</NavLink>
      <NavLink to={R.appBoards} end className={({ isActive }) => isActive || activePath === R.appComponents ? 'active' : ''}><span aria-hidden="true">▦</span>Thư viện</NavLink>
      <NavLink to={R.appLab} end className={({ isActive }) => isActive || activePath === R.appLab || activePath.startsWith('/app/tools/') ? 'active' : ''}><span aria-hidden="true">⌁</span>Thực hành</NavLink>
      <NavLink to={R.appProjects} end className={({ isActive }) => isActive ? 'active' : ''}><span aria-hidden="true">⌘</span>Dự án</NavLink>
      <NavLink to={R.appClassroomKit} end className={({ isActive }) => isActive ? 'active' : ''}><span aria-hidden="true">▤</span>Lớp & kit</NavLink>
    </nav>
  </>
}
