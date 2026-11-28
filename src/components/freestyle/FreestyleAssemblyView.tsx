import { useEffect,useMemo,useRef,useState } from 'react'
import { AssemblyScene, type ScreenPoint } from '../builder/AssemblyScene'
import { freestyleAssembly } from '../../lib/freestyle/freestyleAssembly'
import { freestylePresentation } from '../../lib/freestyle/freestylePresentation'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import type { PinMap } from '../../lib/freestyle/freestyleCircuit'
import type { WireSignalLabel } from '../builder/BreadboardDiagram'
import { getKitPartProfile } from '../../data/kitPartProfiles'
import { getComponentMesh } from '../../data/componentModels'
import { assemblyHolePoint, type Vec3 } from '../../lib/assemblyLayout'
import { getR2cBreadboard } from '../../data/catalogR2cBoards'
import { formatHole, holeToMm, snapNearest } from '../../lib/breadboardGrid'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'

type Props = {
 doc:CircuitDocV2;boardId:string;pinMap:PinMap;selectedPartId:string|null;selectedEndpointKey:string
 litPartIds:ReadonlySet<string>;onSelectPart:(id:string)=>void;onInspectEndpoint:(key:string)=>void
 wireSignals:ReadonlyMap<string,WireSignalLabel>
}

const pointMetres = ([x,y,z]:Vec3):Vec3 => [x/1000,y/1000,z/1000]

export function FreestyleAssemblyView({doc,boardId,pinMap,selectedPartId,selectedEndpointKey,litPartIds,onSelectPart,onInspectEndpoint,wireSignals}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),scene=useRef<AssemblyScene|null>(null)
 const [error,setError]=useState(''),[loading,setLoading]=useState(0)
 const [failed,setFailed]=useState(false)
 const [marker,setMarker]=useState<ScreenPoint>()
 const plan=useMemo(()=>freestyleAssembly(doc,boardId,pinMap),[doc,boardId,pinMap])
 const presentation=useMemo(()=>boardId?freestylePresentation(boardId,pinMap,doc):undefined,[boardId,pinMap,doc])
 const boardPart=doc.parts.find(part=>part.type==='board')
 const only2D=doc.parts.filter(part=>getKitPartProfile(part.type)&&!getComponentMesh(part.type))
 const profile=getR2cBreadboard(plan.grid?.spec)
 const inspectedNet = useMemo(() => profile && selectedEndpointKey.startsWith('bb1:') ? createNetIndexV2(doc).netOf(selectedEndpointKey) : undefined,[profile,selectedEndpointKey,doc])
 const planRef=useRef(plan);planRef.current=plan
 const refreshMarker=useRef<()=>void>(()=>{})
 refreshMarker.current=()=>{
   const point=plan.pinPoints[selectedEndpointKey] ?? assemblyHolePoint(selectedEndpointKey,plan.grid)
   setMarker(point && scene.current ? scene.current.project(pointMetres(point)) : undefined)
 }
 useEffect(()=>{
   if(!canvas.current)return
   let renderer:AssemblyScene|undefined
   const lost=(e:Event)=>{e.preventDefault();setError('WebGL bị mất. Quay về 2D để tiếp tục; mở lại 3D để thử lại.')}
   const element=canvas.current
   try{renderer=AssemblyScene.create(element);scene.current=renderer;renderer.onViewChange=()=>refreshMarker.current();renderer.onAssets=s=>{setLoading(s.loading);setFailed(s.failedUrls.length>0)};renderer.update(planRef.current);renderer.setPreset('overview')}
   catch(e){setError(e instanceof Error?e.message:'Không mở được WebGL. Hãy dùng view 2D.')}
   element.addEventListener('webglcontextlost',lost)
   const observer=new ResizeObserver(()=>renderer?.resize());observer.observe(element)
   return()=>{observer.disconnect();element.removeEventListener('webglcontextlost',lost);renderer?.dispose();scene.current=null}
 },[])
 useEffect(()=>{scene.current?.update(plan)},[plan])
 useEffect(()=>refreshMarker.current(),[plan,selectedEndpointKey])
 useEffect(()=>{scene.current?.setSelection(selectedPartId??'');scene.current?.setHighlights([], [...litPartIds])},[selectedPartId,litPartIds])
 useEffect(()=>{scene.current?.setWireStyles(new Map(doc.wires.map(wire=>{const signal=wireSignals.get(wire.id);return [wire.id,{color:signal?.tone==='high'?[.9,.3,.15] as [number,number,number]:wire.role==='ground'?[.12,.17,.22] as [number,number,number]:wire.role==='power'?[.8,.2,.16] as [number,number,number]:[.1,.4,.75] as [number,number,number],stripes:false,direction:0 as const}]})),false)},[doc.wires,wireSignals])
 const drag=useRef<{x:number;y:number;moved:boolean}|null>(null)
 function inspectAt(x:number,y:number) {
   const renderer=scene.current, rect=canvas.current?.getBoundingClientRect()
   if(!renderer||!rect)return
   if(boardPart && presentation?.model.pinPicking) {
     const candidates=Object.entries(plan.pinPoints).flatMap(([key,point])=>{
       if(!key.startsWith(`${boardPart.id}:`))return []
       const screen=renderer.project(pointMetres(point))
       const distance=Math.hypot(screen.x+rect.left-x,screen.y+rect.top-y)
       return screen.visible&&distance<=8?[{key,distance}]:[]
     }).sort((a,b)=>a.distance-b.distance)
     const first=candidates[0]
     if(first && (!candidates[1] || candidates[1].distance-first.distance>1)) {
       onSelectPart(boardPart.id)
       onInspectEndpoint(first.key)
       return
     }
   }
   const pick=renderer.pick(x,y)
   const grid = plan.grid
   if(profile && grid && !failed && (!pick || pick.partId==='bb1')) {
     const hit=renderer.planePoint(x,y,grid.topY)
     if(hit) {
       const local: Vec3=[hit[0]-grid.originX,grid.topY,hit[1]-grid.originZ]
       const hole=snapNearest(local,grid)
       const point=hole && holeToMm(hole,grid)
       const id=hole && formatHole(hole,grid.spec)
       if(id && point && Math.hypot(point[0]-local[0],point[2]-local[2])<=1.1) {
         onSelectPart('bb1');onInspectEndpoint(id);return
       }
     }
   }
   if(pick){onSelectPart(pick.partId);onInspectEndpoint('')}
 }
 const selectedPinLabel=selectedEndpointKey.startsWith(`${boardPart?.id}:`)
   ? presentation?.pinLabels[selectedEndpointKey.split(':').at(-1) ?? ''] ?? selectedEndpointKey
   : selectedEndpointKey
 return <section className="freestyle-assembly" aria-label="Lắp mạch 3D">
   <div className="freestyle-assembly-meta"><strong>{presentation?.name??'Bàn chưa chọn board'}</strong><span>{loading?'Đang tải model…':failed?'Một model chưa tải được':error?'3D không khả dụng':'Hình học tham chiếu · không phải mô phỏng điện'}</span></div>
   <div className="freestyle-assembly-stage">
     <canvas ref={canvas} aria-label="Mô hình mạch 3D, kéo để xoay; dùng các nút bên dưới để điều khiển bằng bàn phím" onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const p=drag.current;if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.moved ||= Math.abs(dx)+Math.abs(dy)>3;scene.current?.rotate(dx*.006,dy*.006);p.x=e.clientX;p.y=e.clientY}} onPointerCancel={()=>{drag.current=null}} onPointerUp={e=>{if(drag.current&&!drag.current.moved)inspectAt(e.clientX,e.clientY);drag.current=null}} />
     {marker?.visible && !error && <span className="freestyle-assembly-pin" data-pin-key={selectedEndpointKey} style={{left:marker.x,top:marker.y}}>{selectedPinLabel}</span>}
   </div>
   {inspectedNet && <p role="status">{selectedEndpointKey.slice(4)} · {inspectedNet.holes.size} lỗ trên cùng net.</p>}
   {error&&<p role="alert">{error}</p>}{failed&&<p role="status">Model lỗi không được thay bằng board khác. Bạn vẫn nối dây trong view 2D.</p>}
   {only2D.length>0&&<p role="note">{only2D.map(part=>part.id).join(', ')} chỉ có minh họa 2D và sơ đồ nguyên lý.</p>}
   <div className="freestyle-view-controls" aria-label="Điều khiển cảnh 3D">
    <button onClick={()=>scene.current?.rotate(-Math.PI/9,0)} aria-label="Xoay trái 3D">↶</button><button onClick={()=>scene.current?.rotate(Math.PI/9,0)} aria-label="Xoay phải 3D">↷</button><button onClick={()=>scene.current?.zoom(-1)} aria-label="Thu nhỏ 3D">−</button><button onClick={()=>scene.current?.zoom(1)} aria-label="Phóng to 3D">+</button><button onClick={()=>scene.current?.setPreset('top')}>Nhìn từ trên</button><button onClick={()=>scene.current?.resetView()}>Vừa mạch</button>
   </div>
   <details><summary>Nguồn hình học và {plan.diagnostics?.length??0} dây chưa có tọa độ</summary><p>{presentation?.revision}. Chân không có anchor từ đúng nguồn sẽ không có dây 3D.</p><p>LED và chân linh kiện theo footprint của model tham chiếu. Sáng/tắt là trạng thái trace giáo dục, không phải ánh sáng hay điện áp đo thật. {profile ? 'Adafruit '+profile.pid+' · hình học tham chiếu từ bản vẽ.' : 'Vị trí lỗ rail là giả định của breadboard 400 lỗ.'}</p>{plan.diagnostics?.map(d=><p key={d.wireId}>{d.message}</p>)}</details>
 </section>
}
