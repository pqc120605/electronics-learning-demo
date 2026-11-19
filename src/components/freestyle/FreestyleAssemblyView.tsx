import { useEffect,useMemo,useRef,useState } from 'react'
import { AssemblyScene } from '../builder/AssemblyScene'
import { freestyleAssembly } from '../../lib/freestyle/freestyleAssembly'
import { freestylePresentation } from '../../lib/freestyle/freestylePresentation'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import type { PinMap } from '../../lib/freestyle/freestyleCircuit'
import type { WireSignalLabel } from '../builder/BreadboardDiagram'
export function FreestyleAssemblyView({doc,boardId,pinMap,selectedPartId,litPartIds,onSelectPart,wireSignals}:{doc:CircuitDocV2;boardId:string;pinMap:PinMap;selectedPartId:string|null;litPartIds:ReadonlySet<string>;onSelectPart:(id:string)=>void;wireSignals:ReadonlyMap<string,WireSignalLabel>}){
 const canvas=useRef<HTMLCanvasElement>(null),scene=useRef<AssemblyScene|null>(null)
 const [error,setError]=useState(''),[loading,setLoading]=useState(0)
 const [failed,setFailed]=useState(false)
 const plan=useMemo(()=>freestyleAssembly(doc,boardId,pinMap),[doc,boardId,pinMap])
 const planRef=useRef(plan);planRef.current=plan
 useEffect(()=>{
   if(!canvas.current)return
   let renderer:AssemblyScene|undefined
   const lost=(e:Event)=>{e.preventDefault();setError('WebGL bị mất. Quay về 2D để tiếp tục; mở lại 3D để thử lại.')}
   const element=canvas.current
   try{renderer=AssemblyScene.create(element);scene.current=renderer;renderer.onAssets=s=>{setLoading(s.loading);setFailed(s.failedUrls.length>0)};renderer.update(planRef.current);renderer.setPreset('overview')}
   catch(e){setError(e instanceof Error?e.message:'Không mở được WebGL. Hãy dùng view 2D.')}
   element.addEventListener('webglcontextlost',lost)
   const observer=new ResizeObserver(()=>renderer?.resize());observer.observe(element)
   return()=>{observer.disconnect();element.removeEventListener('webglcontextlost',lost);renderer?.dispose();scene.current=null}
 },[])
 useEffect(()=>{scene.current?.update(plan)},[plan])
 useEffect(()=>{scene.current?.setSelection(selectedPartId??'');scene.current?.setHighlights([], [...litPartIds])},[selectedPartId,litPartIds])
 useEffect(()=>{scene.current?.setWireStyles(new Map(doc.wires.map(wire=>{const signal=wireSignals.get(wire.id);return [wire.id,{color:signal?.tone==='high'?[.9,.3,.15] as [number,number,number]:wire.role==='ground'?[.12,.17,.22] as [number,number,number]:wire.role==='power'?[.8,.2,.16] as [number,number,number]:[.1,.4,.75] as [number,number,number],stripes:false,direction:0 as const}]})),false)},[doc.wires,wireSignals])
 const drag=useRef<{x:number;y:number;moved:boolean}|null>(null)
 return <section className="freestyle-assembly" aria-label="Lắp mạch 3D">
   <div className="freestyle-assembly-meta"><strong>{boardId?freestylePresentation(boardId,pinMap).name:'Bàn chưa chọn board'}</strong><span>{loading?'Đang tải model…':failed?'Một model chưa tải được':error?'3D không khả dụng':'Hình học tham chiếu · không phải mô phỏng điện'}</span></div>
   <canvas ref={canvas} aria-label="Mô hình mạch 3D, kéo để xoay; dùng các nút bên dưới để điều khiển bằng bàn phím" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const p=drag.current;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.moved ||= Math.abs(dx)+Math.abs(dy)>3;scene.current?.rotate(dx*.006,dy*.006);p.x=e.clientX;p.y=e.clientY}} onPointerCancel={()=>{drag.current=null}} onPointerUp={e=>{if(drag.current&&!drag.current.moved){const pick=scene.current?.pick(e.clientX,e.clientY);if(pick)onSelectPart(pick.partId)}drag.current=null}} />
   {error&&<p role="alert">{error}</p>}{failed&&<p role="status">Model lỗi không được thay bằng board khác. Bạn vẫn nối dây trong view 2D.</p>}
   <div className="freestyle-view-controls" aria-label="Điều khiển cảnh 3D">
    <button onClick={()=>scene.current?.rotate(-Math.PI/9,0)} aria-label="Xoay trái 3D">↶</button><button onClick={()=>scene.current?.rotate(Math.PI/9,0)} aria-label="Xoay phải 3D">↷</button><button onClick={()=>scene.current?.zoom(-1)} aria-label="Thu nhỏ 3D">−</button><button onClick={()=>scene.current?.zoom(1)} aria-label="Phóng to 3D">+</button><button onClick={()=>scene.current?.setPreset('top')}>Nhìn từ trên</button><button onClick={()=>scene.current?.resetView()}>Vừa mạch</button>
   </div>
   <details><summary>Nguồn hình học và {plan.diagnostics?.length??0} dây chưa có tọa độ</summary><p>{boardId&&freestylePresentation(boardId,pinMap).revision}. Chân không có anchor từ đúng nguồn sẽ không có dây 3D.</p><p>LED và chân linh kiện theo footprint của model tham chiếu. Sáng/tắt là trạng thái trace giáo dục, không phải ánh sáng hay điện áp đo thật. Vị trí lỗ rail là giả định của breadboard 400 lỗ, chưa được đối chiếu từng lỗ trên mesh.</p>{plan.diagnostics?.map(d=><p key={d.wireId}>{d.message}</p>)}</details>
 </section>
}
