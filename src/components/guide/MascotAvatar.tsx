import {useEffect,useRef,useState,type PointerEvent} from 'react'
import mascot from '../../../assets/brand/concepts/2026-11-15/mach-mo-mascot-concept-v1.webp'
import {MascotScene,type MascotMood} from './MascotScene'

export function MascotAvatar({mood,motion}:{mood:MascotMood;motion:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null),scene=useRef<MascotScene|null>(null),drag=useRef<number|null>(null)
  const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading')
  const [visible,setVisible]=useState(!document.hidden)
  useEffect(()=>{
    const controller=new AbortController();let disposed=false
    const lost=(event:Event)=>{event.preventDefault();scene.current?.dispose();scene.current=null;setStatus('fallback')}
    const node=canvas.current;node?.addEventListener('webglcontextlost',lost)
    const observer=new ResizeObserver(()=>scene.current?.resize());if(node)observer.observe(node)
    const timer=window.setTimeout(()=>controller.abort(),12000)
    fetch('/brand/mo-mascot-v1.glb',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Model không tải được');return response.arrayBuffer()}).then(buffer=>{
      if(disposed||!node)return
      scene.current=new MascotScene(node,buffer);scene.current.setState(mood,motion&&!document.hidden);setStatus('ready')
    }).catch(()=>{if(!disposed)setStatus('fallback')}).finally(()=>clearTimeout(timer))
    const onVisibility=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',onVisibility)
    return()=>{disposed=true;controller.abort();clearTimeout(timer);observer.disconnect();node?.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',onVisibility);scene.current?.dispose();scene.current=null}
    // The renderer is owned by this mounted avatar, not re-created on each pose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])
  useEffect(()=>{scene.current?.setState(mood,motion&&visible)},[mood,motion,visible,status])
  useEffect(()=>{
    if(!motion||!visible||status!=='ready')return
    let end:number|undefined
    const timer=window.setInterval(()=>{scene.current?.setBlink(.12);end=window.setTimeout(()=>scene.current?.setBlink(1),125)},4400)
    return()=>{clearInterval(timer);clearTimeout(end);scene.current?.setBlink(1)}
  },[motion,visible,status])
  const move=(event:PointerEvent<HTMLCanvasElement>)=>{if(drag.current===null)return;scene.current?.rotate((event.clientX-drag.current)*.009);drag.current=event.clientX}
  return <div className="guide-avatar mm-keep-light">
    <div className="guide-avatar-shadow" aria-hidden="true" />
    {status!=='fallback'&&<canvas ref={canvas} data-status={status} data-motion={motion&&visible?'on':'off'} aria-label="Mô hình 3D của Mở" role="img" onPointerDown={event=>{drag.current=event.clientX;event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={move} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} />}
    {status!=='ready'&&<img src={mascot} alt="Mở, robot hướng dẫn học điện tử" width="440" height="467" decoding="async" />}
    <span className="guide-avatar-caption">{status==='fallback'?'Ảnh thay thế':status==='loading'?'Đang mở Mở…':'3D tương tác'}</span>
    {status==='ready'&&<div className="guide-avatar-turn"><button type="button" aria-label="Xoay Mở sang trái" onClick={()=>scene.current?.rotate(-.25)}>↶</button><button type="button" aria-label="Xoay Mở sang phải" onClick={()=>scene.current?.rotate(.25)}>↷</button></div>}
  </div>
}
