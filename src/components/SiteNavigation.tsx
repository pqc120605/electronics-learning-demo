import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { productFeatureRegistry as F } from '../data/productFeatureRegistry'
import { PRODUCT_ROUTES as R } from '../data/productRoutes'
import { AuthMenu } from './AuthMenu'
import './SiteNavigation.css'

type NavItem = { to: string; label: string; hint: string }
type NavGroup = { id: string; label: string; items: NavItem[] }

/**
 * Công cụ nằm cạnh mạch hoặc dữ liệu mà người học dùng để thao tác.
 */
const navigationGroups: NavGroup[] = [
  { id: 'learn', label: 'Học', items: [
    { to: F.lesson.publicRoute, label: 'Bài đầu tiên', hint: 'Thực hành nối LED' },
    { to: F.learning.publicRoute, label: 'Chủ đề học', hint: 'Lộ trình theo chủ đề' },
    { to: F.dashboard.publicRoute, label: 'Không gian học của tôi', hint: 'Tiếp tục bài đang học' },
  ] },
  { id: 'build', label: 'Lắp mạch', items: [
    { to: R.publicFreestyle, label: 'Bàn lắp mạch tự do', hint: 'Board → linh kiện → code → Chạy' },
    { to: F.lab.publicRoute, label: 'Phòng lắp mạch theo bài', hint: 'Mạch dựng sẵn theo bài mẫu' },
    { to: F.sketch.publicRoute, label: 'Chạy code Arduino/ESP32', hint: 'GPIO, Serial, logic analyzer' },
    { to: F.spice.publicRoute, label: 'Mô phỏng SPICE', hint: 'Phân tích mạch analog' },
    { to: F.firmware.publicRoute, label: 'Kiểm tra firmware HEX', hint: 'Intel HEX và demo AVR' },
  ] },
  { id: 'library', label: 'Thư viện', items: [
    { to: F.boards.publicRoute, label: 'Board', hint: 'ESP32, Arduino, Pico, STM32' },
    { to: F.components.publicRoute, label: 'Linh kiện', hint: 'Chân, vai trò, lưu ý an toàn' },
    { to: F.calculators.publicRoute, label: 'Bộ tính điện tử', hint: 'LED, chia áp, pull-up, RC' },
  ] },
  { id: 'projects', label: 'Dự án', items: [
    { to: F.projects.publicRoute, label: 'Dự án thực hành', hint: 'Bài thực hành và mẫu' },
    { to: F.classroom.publicRoute, label: 'Lớp học & bộ kit', hint: 'Dành cho giáo viên' },
  ] },
]

function isItemActive(pathname: string, to: string) {
  return pathname === to || (to === R.publicFreestyle && pathname.startsWith(`${to}/`))
}

function closeParentDisclosure(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest('.main-nav')?.querySelectorAll('details[open]').forEach((item) => item.removeAttribute('open'))
}

export function SiteNavigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mobileToggleRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  const closeNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    closeParentDisclosure(event)
    setMobileOpen(false)
  }

  const closeOtherGroups = (current: HTMLDetailsElement) => {
    rootRef.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach((item) => {
      if (item !== current) item.removeAttribute('open')
    })
  }

  useEffect(() => {
    const closeDisclosures = () => rootRef.current?.querySelectorAll('details[open]').forEach((item) => item.removeAttribute('open'))
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return
      closeDisclosures()
      setMobileOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const openDetails = rootRef.current?.querySelectorAll<HTMLDetailsElement>('details[open]')
      if (!mobileOpen && !openDetails?.length) return
      event.preventDefault()
      closeDisclosures()
      if (mobileOpen) {
        setMobileOpen(false)
        mobileToggleRef.current?.focus()
      } else {
        const activeDetails = event.target instanceof Element ? event.target.closest('details') : null
        const details = activeDetails?.open ? activeDetails : openDetails?.[0]
        details?.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  return (
    <div className="site-nav-root" ref={rootRef}>
      <button ref={mobileToggleRef} className="site-nav-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => setMobileOpen(open => !open)}>
        {mobileOpen ? 'Đóng menu' : 'Menu'}
      </button>
      <nav className={`main-nav ${mobileOpen ? 'main-nav-open' : ''}`} id="primary-navigation" aria-label="Điều hướng chính">
        {navigationGroups.map(group => {
          const active = group.items.some(item => isItemActive(pathname, item.to))
          return <details key={group.id} className={`site-nav-group ${active ? 'site-nav-group-active' : ''}`} onToggle={(event) => { if (event.currentTarget.open) closeOtherGroups(event.currentTarget) }}>
            <summary>{group.label}</summary>
            <div className="site-nav-submenu">
              {group.items.map(item => <NavLink key={item.to} to={item.to} end onClick={closeNavigation}>
                <span className="site-nav-item-label">{item.label}</span><span className="site-nav-item-hint">{item.hint}</span>
              </NavLink>)}
            </div>
          </details>
        })}
        <NavLink className="site-nav-direct" to={F.community.publicRoute} onClick={closeNavigation}>{F.community.publicLabel}</NavLink>
        {/* Màn hẹp: nút đăng nhập nằm trong menu để header vẫn gọn một hàng. */}
        <div className="site-nav-auth" onClick={() => setMobileOpen(false)}><AuthMenu variant="public" /></div>
      </nav>
    </div>
  )
}
