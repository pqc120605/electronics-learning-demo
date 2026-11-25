import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GuidedTour } from './GuidedTour'
import { readTheme, setTheme, THEME_KEY, type ThemePreference } from '../../lib/theme'
import { TOUR_ORDER, TOUR_PENDING_KEY, TOUR_SEEN_KEY, TOURS, markTourSeen, readSeenTours, tourIdForPath, type TourId } from './tours'
import './Onboarding.css'
import { requestGuideOpen } from '../guide/GuideContext'
import mascot from '../../../assets/brand/concepts/2026-11-15/mach-mo-mascot-concept-v1.png'

const START_EVENT = 'mm:start-tour'

function local(): Storage | null { try { return window.localStorage } catch { return null } }
function session(): Storage | null { try { return window.sessionStorage } catch { return null } }

export function requestTour(id: TourId) { window.dispatchEvent(new CustomEvent<TourId>(START_EVENT, { detail: id })) }

/** Lời mời tour lần đầu (không chặn thao tác) + tour đang chạy của trang hiện tại. */
export function TourHost() {
  const { pathname } = useLocation()
  const tourId = tourIdForPath(pathname)
  const [active, setActive] = useState<TourId | null>(null)
  const [invite, setInvite] = useState(false)

  useEffect(() => {
    setActive(null)
    if (!tourId) { setInvite(false); return }
    const pending = session()?.getItem(TOUR_PENDING_KEY)
    if (pending === tourId) {
      session()?.removeItem(TOUR_PENDING_KEY)
      setInvite(false)
      // Chờ trang vẽ xong vùng cần giới thiệu.
      const timer = window.setTimeout(() => setActive(tourId), 450)
      return () => window.clearTimeout(timer)
    }
    setInvite(tourId !== 'home' && tourId !== 'app-home' && !readSeenTours(local())[tourId])
  }, [tourId, pathname])

  useEffect(() => {
    const onStart = (event: Event) => {
      const id = (event as CustomEvent<TourId>).detail
      if (id && TOURS[id]) { setInvite(false); setActive(id) }
    }
    window.addEventListener(START_EVENT, onStart)
    return () => window.removeEventListener(START_EVENT, onStart)
  }, [])

  const close = (id: TourId) => { markTourSeen(local(), id); setActive(null); setInvite(false) }
  const tour = tourId ? TOURS[tourId] : null

  return <>
    {invite && tour && !active && <aside className="mm-tour-invite" aria-label="Hướng dẫn cho người mới">
      <p className="mm-tour-invite-title">{tour.label} · {tour.steps.length} bước</p>
      <div className="mm-tour-invite-actions">
        <button type="button" className="mm-tour-primary" onClick={() => { setInvite(false); setActive(tour.id) }}>Xem hướng dẫn</button>
        <button type="button" className="mm-tour-secondary" onClick={() => close(tour.id)}>Để sau</button>
      </div>
    </aside>}
    {active && <GuidedTour tour={TOURS[active]} onClose={() => close(active)} />}
  </>
}

/** Menu Trợ giúp trên thanh đầu trang: mở lại tour của trang này hoặc của khu vực khác. */
export function HelpMenu() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [theme, updateTheme] = useState<ThemePreference>(() => readTheme(local()))
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const current = tourIdForPath(pathname)
  const inApp = pathname.startsWith('/app')

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== THEME_KEY && event.key !== null) return
      const value = readTheme(local())
      document.documentElement.dataset.theme = value
      updateTheme(value)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => { setOpen(false); setResetDone(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus() } }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  function start(id: TourId) {
    setOpen(false)
    if (id === current) { requestTour(id); return }
    session()?.setItem(TOUR_PENDING_KEY, id)
    navigate(inApp ? TOURS[id].appPath : TOURS[id].publicPath)
  }

  return <div className="help-menu" ref={rootRef}>
    <button ref={buttonRef} type="button" className="help-menu-button" aria-label="Trợ giúp" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(value => !value)}>
      <span className="help-menu-icon" aria-hidden="true">?</span><span className="help-menu-label">Trợ giúp</span>
    </button>
    <div id={menuId} className="help-menu-panel" hidden={!open}>
      <button type="button" className="help-guide-entry" onClick={() => { setOpen(false); requestGuideOpen() }}><img src={mascot} width="34" height="40" loading="lazy" alt="" /><span><strong>Hỏi Mở</strong><small>Hướng dẫn · kiến thức điện tử cục bộ</small></span></button>
      <fieldset className="help-theme" role="radiogroup" aria-label="Giao diện">
        <legend>Giao diện</legend>
        {([['light', 'Sáng'], ['dark', 'Tối'], ['system', 'Theo hệ thống']] as const).map(([value, label]) => <label key={value}>
          <input type="radio" name={`${menuId}-theme`} value={value} checked={theme === value} onChange={() => { setTheme(value, local(), document.documentElement); updateTheme(value) }} />{label}
        </label>)}
      </fieldset>
      {current && <button type="button" className="help-menu-primary" onClick={() => start(current)}>
        <strong>Hướng dẫn trang này</strong><small>{TOURS[current].label} · {TOURS[current].steps.length} bước</small>
      </button>}
      <p className="help-menu-heading">Hướng dẫn theo khu vực</p>
      <ul>
        {TOUR_ORDER.filter(id => id !== current).map(id => <li key={id}><button type="button" onClick={() => start(id)}>{TOURS[id].label}<small>{TOURS[id].steps.length} bước</small></button></li>)}
      </ul>
      <p className="help-menu-heading">Bắt đầu nhanh</p>
      <ul>
        <li><Link to={inApp ? '/app/learn/esp32-led' : '/learn/esp32-led'} onClick={() => setOpen(false)}>Bài học đầu tiên<small>Đọc → lắp → chạy</small></Link></li>
        <li><Link to={inApp ? '/app/lab/freestyle' : '/build/freestyle'} onClick={() => setOpen(false)}>Bàn lắp mạch tự do<small>Board → linh kiện → code</small></Link></li>
        <li><Link to={inApp ? '/app/feedback' : '/feedback'} state={{from:pathname}} onClick={() => setOpen(false)}>Góp ý & báo lỗi<small>Tải file góp ý và thông tin người phát triển</small></Link></li>
      </ul>
      <button type="button" className="help-menu-reset" onClick={() => { try { local()?.removeItem(TOUR_SEEN_KEY) } catch { /* bỏ qua */ } setResetDone(true) }}>
        Hiện lại lời mời hướng dẫn
      </button>
      <p className="help-menu-status" role="status">{resetDone ? 'Đã đặt lại. Lời mời sẽ hiện khi bạn mở trang có hướng dẫn.' : ''}</p>
    </div>
  </div>
}
