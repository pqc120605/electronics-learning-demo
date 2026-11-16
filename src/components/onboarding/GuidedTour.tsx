import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
// astryx (Meta, MIT, 0.7.16): chỉ dùng hook bẫy focus, không nạp CSS/theme của astryx.
import { useFocusTrap } from '@astryxdesign/core/hooks'
import type { TourDefinition } from './tours'

type Rect = { top: number; left: number; width: number; height: number }
const PAD = 8
const GAP = 14

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function findTarget(selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const box = element.getBoundingClientRect()
      if (box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden') return element
    }
  }
  return null
}

/**
 * Tour từng bước: làm mờ trang, khoét sáng vùng đang giới thiệu, hộp thoại modal cạnh vùng đó.
 * Bàn phím: ← → đổi bước, Esc bỏ qua, Tab chỉ đi vòng trong hộp thoại (#root được đặt inert).
 */
export function GuidedTour({ tour, onClose }: { tour: TourDefinition; onClose: (reason: 'done' | 'skip') => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [cardStyle, setCardStyle] = useState<CSSProperties>({})
  const { containerRef: cardRef } = useFocusTrap<HTMLDivElement>({ isActive: true, onEscape: () => onClose('skip') })
  const titleRef = useRef<HTMLHeadingElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const bodyId = useId()
  const step = tour.steps[index]
  const last = index === tour.steps.length - 1

  const measure = useCallback(() => {
    const element = targetRef.current
    if (!element || !element.isConnected) { setRect(null); return }
    const box = element.getBoundingClientRect()
    const top = Math.max(4, box.top - PAD)
    const left = Math.max(4, box.left - PAD)
    const width = Math.min(window.innerWidth - left - 4, box.width + PAD * 2)
    const height = Math.min(window.innerHeight - top - 4, box.height + PAD * 2)
    setRect(width > 0 && height > 0 ? { top, left, width, height } : null)
  }, [])

  // Đổi bước: tìm vùng, cuộn vào giữa, đo lại sau khi cuộn xong.
  useLayoutEffect(() => {
    const element = findTarget(step.target)
    targetRef.current = element
    if (element) element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    measure()
    const settle = window.setTimeout(measure, prefersReducedMotion() ? 0 : 380)
    titleRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(settle)
  }, [step, measure])

  useEffect(() => {
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => { window.removeEventListener('resize', onChange); window.removeEventListener('scroll', onChange, true) }
  }, [measure])

  // Đặt hộp thoại: màn hẹp neo đáy; màn rộng ưu tiên dưới vùng, rồi trên, rồi giữa.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (vw < 640) { setCardStyle({ left: 12, right: 12, bottom: 12 }); return }
    const width = card.offsetWidth
    const height = card.offsetHeight
    if (!rect) { setCardStyle({ left: (vw - width) / 2, top: Math.max(12, (vh - height) / 2) }); return }
    const left = Math.min(Math.max(12, rect.left), vw - width - 12)
    const below = rect.top + rect.height + GAP
    const above = rect.top - GAP - height
    if (below + height <= vh - 12) setCardStyle({ left, top: below })
    else if (above >= 12) setCardStyle({ left, top: above })
    else {
      const right = rect.left + rect.width + GAP
      const side = right + width <= vw - 12 ? right : Math.max(12, rect.left - GAP - width)
      setCardStyle({ left: side, top: Math.min(Math.max(12, rect.top), vh - height - 12) })
    }
  }, [rect, index])

  // Modal thật: phần còn lại của trang không nhận focus/chuột; trả focus khi đóng.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    root?.setAttribute('aria-hidden', 'true')
    document.documentElement.classList.add('mm-tour-open')
    return () => {
      root?.removeAttribute('inert')
      root?.removeAttribute('aria-hidden')
      document.documentElement.classList.remove('mm-tour-open')
      previous?.focus?.({ preventScroll: true })
    }
  }, [])

  const go = (delta: number) => setIndex(current => Math.min(tour.steps.length - 1, Math.max(0, current + delta)))

  // Tab/Shift+Tab và Esc do useFocusTrap xử lý; ở đây chỉ thêm phím mũi tên đổi bước.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); if (last) onClose('done'); else go(1) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
  }

  return createPortal(
    <div className="mm-tour" onKeyDown={onKeyDown}>
      <div className={`mm-tour-backdrop${rect ? ' has-spot' : ''}`} aria-hidden="true" />
      {rect && <div className="mm-tour-spot" aria-hidden="true" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />}
      <div ref={cardRef} className="mm-tour-card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} style={cardStyle}>
        <p className="mm-tour-progress"><span>{tour.label}</span><span>Bước {index + 1}/{tour.steps.length}</span></p>
        <div className="mm-tour-dots" aria-hidden="true">{tour.steps.map((item, dot) => <span key={item.title} className={dot === index ? 'is-current' : dot < index ? 'is-done' : ''} />)}</div>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} key={`t-${index}`}>{step.title}</h2>
        <p id={bodyId} key={`b-${index}`}>{step.body}</p>
        <div className="mm-tour-actions">
          <button type="button" className="mm-tour-skip" onClick={() => onClose('skip')}>Bỏ qua</button>
          <span className="mm-tour-spacer" />
          <button type="button" className="mm-tour-secondary" onClick={() => go(-1)} disabled={index === 0}>Quay lại</button>
          <button type="button" className="mm-tour-primary" onClick={() => (last ? onClose('done') : go(1))}>{last ? 'Xong' : 'Tiếp'}</button>
        </div>
        <p className="mm-tour-keys">Phím: ← → đổi bước · Esc bỏ qua</p>
      </div>
    </div>,
    document.body,
  )
}
