import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { productFeatureRegistry as F } from '../data/productFeatureRegistry'
import './SiteNavigation.css'

function closeParentDisclosure(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest('.main-nav')?.querySelectorAll('details[open]').forEach((item) => item.removeAttribute('open'))
}

export function SiteNavigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mobileToggleRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const libraryActive = pathname === F.boards.publicRoute || pathname === F.components.publicRoute
  const pathActive = pathname === F.learning.publicRoute || pathname === F.projects.publicRoute
  const toolsActive = pathname === F.firmware.publicRoute || pathname === F.calculators.publicRoute || pathname === F.spice.publicRoute

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
        <NavLink to={F.intro.publicRoute} end onClick={closeNavigation}>{F.intro.publicLabel}</NavLink>
        <NavLink to={F.dashboard.publicRoute} onClick={closeNavigation}>{F.dashboard.publicLabel}</NavLink>
        <details className={`site-nav-group ${libraryActive ? 'site-nav-group-active' : ''}`} onToggle={(event) => { if (event.currentTarget.open) closeOtherGroups(event.currentTarget) }}>
          <summary>Thư viện</summary>
          <div className="site-nav-submenu">
            <NavLink to={F.boards.publicRoute} onClick={closeNavigation}>{F.boards.publicLabel}</NavLink>
            <NavLink to={F.components.publicRoute} onClick={closeNavigation}>{F.components.publicLabel}</NavLink>
          </div>
        </details>
        <NavLink to={F.lab.publicRoute} onClick={closeNavigation}>{F.lab.publicLabel}</NavLink>
        <details className={`site-nav-group ${toolsActive ? 'site-nav-group-active' : ''}`} onToggle={(event) => { if (event.currentTarget.open) closeOtherGroups(event.currentTarget) }}>
          <summary>Công cụ</summary>
          <div className="site-nav-submenu">
            <NavLink to={F.firmware.publicRoute} onClick={closeNavigation}>{F.firmware.publicLabel}</NavLink>
            <NavLink to={F.calculators.publicRoute} onClick={closeNavigation}>{F.calculators.publicLabel}</NavLink>
            <NavLink to={F.spice.publicRoute} onClick={closeNavigation}>{F.spice.publicLabel}</NavLink>
          </div>
        </details>
        <details className={`site-nav-group ${pathActive ? 'site-nav-group-active' : ''}`} onToggle={(event) => { if (event.currentTarget.open) closeOtherGroups(event.currentTarget) }}>
          <summary>Lộ trình</summary>
          <div className="site-nav-submenu">
            <NavLink to={F.learning.publicRoute} onClick={closeNavigation}>{F.learning.publicLabel}</NavLink>
            <NavLink to={F.projects.publicRoute} onClick={closeNavigation}>{F.projects.publicLabel}</NavLink>
          </div>
        </details>
      </nav>
    </div>
  )
}
