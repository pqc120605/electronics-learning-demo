import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import mascot from '../../../assets/brand/concepts/2026-11-15/mach-mo-mascot-concept-v1.png'
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
  const focusedWorkspace=/^\/(?:app\/)?(?:build|lab|learn\/|tools\/)/.test(pathname)
  const opener=useRef<HTMLElement|null>(null)
  function show(){opener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setHidden(false);remember('mm-guide-hidden',false);setOpen(true)}
  function close(){setOpen(false);requestAnimationFrame(()=>{
    const previous=opener.current
    if(previous?.isConnected&&previous.getClientRects().length)previous.focus()
    else document.querySelector<HTMLButtonElement>('.help-menu-button')?.focus()
  })}
  useEffect(()=>{const listener=()=>show();window.addEventListener(GUIDE_OPEN_EVENT,listener);return()=>window.removeEventListener(GUIDE_OPEN_EVENT,listener)},[])
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),onChange=()=>setReduced(media.matches)
    media.addEventListener('change',onChange);return()=>media.removeEventListener('change',onChange)
  },[])
  // Questions stay in the mounted panel only; a route change closes and discards them.
  useEffect(()=>{setOpen(false)},[pathname])
  return <>
    {!open&&!hidden&&!focusedWorkspace&&<button type="button" className="guide-launcher" onClick={show}>
      <img src={mascot} alt="" width="56" height="64" decoding="async" /><span><strong>Hỏi Mở</strong><small>Cùng bạn làm mạch</small></span>
    </button>}
    {open&&<Suspense fallback={<aside className="guide-loading" role="status">Đang mở hướng dẫn… <button type="button" onClick={close}>Đóng</button></aside>}>
      <GuidePanel pathname={pathname} motion={!still&&!reduced} reduced={reduced} onMotion={value=>{setStill(!value);remember('mm-guide-still',!value)}} onClose={close} onStartTour={()=>setOpen(false)} onHide={()=>{setHidden(true);remember('mm-guide-hidden',true);close()}} />
    </Suspense>}
  </>
}
