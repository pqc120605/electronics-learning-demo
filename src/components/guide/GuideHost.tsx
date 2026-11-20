import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {GUIDE_OPEN_EVENT} from './GuideContext'
import './Guide.css'

const GuidePanel=lazy(()=>import('./GuidePanel'))
function read(key:string){try{return localStorage.getItem(key)==='true'}catch{return false}}
function remember(key:string,value:boolean){try{localStorage.setItem(key,String(value))}catch{/* preferences work for this session */}}
export function GuideHost(){
  const {pathname}=useLocation()
  const [open,setOpen]=useState(false),[hidden,setHidden]=useState(()=>read('mm-guide-hidden'))
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [still,setStill]=useState(()=>read('mm-guide-still'))
  const [entry,setEntry]=useState({ question: '', revision: 0 })
  const [compact,setCompact]=useState(false)
  const focusedWorkspace=/^\/(?:app\/)?(?:build|lab|learn\/|tools\/)/.test(pathname)
  const opener=useRef<HTMLElement|null>(null)
  function show(question = '') {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEntry(current => ({ question, revision: current.revision + 1 }))
    setHidden(false)
    remember('mm-guide-hidden', false)
    setOpen(true)
  }
  function closeTo(target: HTMLElement | null) {
    setOpen(false)
    requestAnimationFrame(() => {
      if (target?.isConnected && target.getClientRects().length) target.focus()
      else document.querySelector<HTMLButtonElement>('.help-menu-button')?.focus()
    })
  }
  function close() { closeTo(opener.current) }
  useEffect(() => {
    const listener = (event: Event) => {
      const question = event instanceof CustomEvent && typeof event.detail === 'string' ? event.detail.slice(0, 400) : ''
      show(question)
    }
    window.addEventListener(GUIDE_OPEN_EVENT, listener)
    return () => window.removeEventListener(GUIDE_OPEN_EVENT, listener)
  }, [])
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),onChange=()=>setReduced(media.matches)
    media.addEventListener('change',onChange);return()=>media.removeEventListener('change',onChange)
  },[])
  // Questions stay in the mounted panel only; a route change closes and discards them.
  useEffect(()=>{setOpen(false)},[pathname])
  useEffect(() => {
    const onScroll = () => setCompact(Math.max(window.scrollY, document.querySelector('[data-scroll-root]')?.scrollTop ?? 0) > 160)
    onScroll()
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [pathname])
  return <>
    {!open&&!hidden&&!focusedWorkspace&&<button type="button" aria-label="Hỏi Mở" className={`guide-launcher${compact?' is-compact':''}`} onClick={() => show()}>
      <span className="guide-launcher-icon" aria-hidden="true">?</span><strong>Hỏi Mở</strong>
    </button>}
    {open&&<Suspense fallback={<aside className="guide-loading" role="status">Đang mở hướng dẫn… <button type="button" onClick={close}>Đóng</button></aside>}>
      <GuidePanel key={entry.revision} initialQuestion={entry.question} pathname={pathname} motion={!still&&!reduced} reduced={reduced} onMotion={value=>{setStill(!value);remember('mm-guide-still',!value)}} onClose={close} onNavigate={closeTo} onStartTour={()=>setOpen(false)} onHide={()=>{setHidden(true);remember('mm-guide-hidden',true);close()}} />
    </Suspense>}
  </>
}
