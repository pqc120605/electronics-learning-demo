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
  const [scrolled,setScrolled]=useState(false)
  const focusedWorkspace=/^\/(?:app\/)?(?:build|lab|learn\/|tools\/)/.test(pathname)
  const opener=useRef<HTMLElement|null>(null)
  function show(){opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setHidden(false);remember('mm-guide-hidden',false);setOpen(true)}
  function closeTo(target: HTMLElement | null) {
    setOpen(false)
    requestAnimationFrame(() => {
      if (target?.isConnected && target.getClientRects().length) target.focus()
      else document.querySelector<HTMLButtonElement>('.help-menu-button')?.focus()
    })
  }
  function close() { closeTo(opener.current) }
  useEffect(()=>{const listener=()=>show();window.addEventListener(GUIDE_OPEN_EVENT,listener);return()=>window.removeEventListener(GUIDE_OPEN_EVENT,listener)},[])
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),onChange=()=>setReduced(media.matches)
    media.addEventListener('change',onChange);return()=>media.removeEventListener('change',onChange)
  },[])
  useEffect(() => {
    const root = document.querySelector('[data-scroll-root]')
    const update = () => setScrolled(window.scrollY > 64 || (root?.scrollTop ?? 0) > 64)
    update()
    window.addEventListener('scroll', update, { passive: true })
    root?.addEventListener('scroll', update, { passive: true })
    return () => { window.removeEventListener('scroll', update); root?.removeEventListener('scroll', update) }
  }, [pathname])
  // Questions stay in the mounted panel only; a route change closes and discards them.
  useEffect(()=>{setOpen(false)},[pathname])
  return <>
    {!open&&!hidden&&!focusedWorkspace&&<button type="button" className={`guide-launcher${scrolled ? ' guide-launcher-compact' : ''}`} aria-label="Hỏi Mở" onClick={show}>
      <span className="guide-launcher-icon" aria-hidden="true">?</span><span className="guide-launcher-label">Hỏi Mở</span>
    </button>}
    {open&&<Suspense fallback={<aside className="guide-loading" role="status">Đang mở hướng dẫn… <button type="button" onClick={close}>Đóng</button></aside>}>
      <GuidePanel pathname={pathname} motion={!still&&!reduced} reduced={reduced} onMotion={value=>{setStill(!value);remember('mm-guide-still',!value)}} onClose={close} onNavigate={closeTo} onStartTour={()=>setOpen(false)} onHide={()=>{setHidden(true);remember('mm-guide-hidden',true);close()}} />
    </Suspense>}
  </>
}
