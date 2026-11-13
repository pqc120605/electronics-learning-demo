import { useRef, useState } from 'react'
import type { ComponentDefinition } from '../../data/componentRegistry'
import type { CircuitConnection, CircuitPart } from '../../types/circuitTopology'

export type AssemblyPart = CircuitPart
export type AssemblyWire = CircuitConnection
type Props = {
  parts: AssemblyPart[]
  wires: AssemblyWire[]
  definitions: ComponentDefinition[]
  nameFor: (part: AssemblyPart) => string
  pinPoint: (endpoint: AssemblyWire['from']) => { x: number; y: number }
  colorWire: (wire: AssemblyWire) => string
  onPinClick: (endpoint: string) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onRotate: (id: string) => void
  onDrop: (id: string, x: number, y: number) => void
  pending: string | null
  active: (wire: AssemblyWire) => boolean
  activePart?: (part: AssemblyPart) => boolean
}

export function Assembly3DView({ parts, wires, definitions, nameFor, pinPoint, colorWire, onPinClick, onSelect, onRemove, onRotate, onDrop, pending, active, activePart }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const [azimuth, setAzimuth] = useState(-28)
  const [elevation, setElevation] = useState(54)
  const [zoom, setZoom] = useState(1)
  const transform = `rotateX(${elevation}deg) rotateZ(${azimuth}deg) scale(${zoom})`
  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('.assembly3d-part')) return
    dragRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = dragRef.current
    if (!previous) return
    setAzimuth((value) => (value + (event.clientX - previous.x) * 0.7 + 360) % 360)
    setElevation((value) => Math.max(12, Math.min(165, value + (event.clientY - previous.y) * 0.45)))
    dragRef.current = { x: event.clientX, y: event.clientY }
  }
  function drop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const id = event.dataTransfer.getData('partId')
    const rect = event.currentTarget.getBoundingClientRect()
    if (!id || !rect.width || !rect.height) return
    onDrop(id, Math.max(5, Math.min(90, (event.clientX - rect.left) * 100 / rect.width)), Math.max(8, Math.min(88, (event.clientY - rect.top) * 100 / rect.height)))
  }
  return <div className="assembly3d-shell">
    <div className="assembly3d-toolbar"><span><b>3D minh họa tham số</b><small>Hình khối giúp nhận biết loại linh kiện; không phải CAD của nhà sản xuất.</small></span><div><button type="button" onClick={() => setZoom((value) => Math.max(.6, value - .1))} aria-label="Thu nhỏ mô hình 3D">−</button><button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + .1))} aria-label="Phóng to mô hình 3D">＋</button><button type="button" onClick={() => { setAzimuth(-28); setElevation(54); setZoom(1) }}>Đặt lại góc</button></div></div>
    <div className="assembly3d-stage" ref={stageRef} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowLeft') setAzimuth((value) => (value - 8 + 360) % 360); else if (event.key === 'ArrowRight') setAzimuth((value) => (value + 8) % 360); else if (event.key === 'ArrowUp') setElevation((value) => Math.max(12, value - 5)); else if (event.key === 'ArrowDown') setElevation((value) => Math.min(165, value + 5)); else return; event.preventDefault() }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(.6, Math.min(1.5, value + (event.deltaY < 0 ? .05 : -.05)))) }} onDragOver={(event) => event.preventDefault()} onDrop={drop} aria-label="Mô hình lắp mạch 3D; kéo nền để xoay, dùng phím mũi tên khi đã chọn vùng xem, lăn chuột để phóng to">
      <div className="assembly3d-world" style={{ transform }}>
      <svg className="assembly3d-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Dây nối trên mô hình 3D">{wires.map((wire) => { const a = pinPoint(wire.from); const b = pinPoint(wire.to); const activeWire = active(wire); const mid = (a.x + b.x) / 2; return <path key={wire.id} d={`M ${a.x} ${a.y} H ${mid} V ${b.y} H ${b.x}`} fill="none" stroke={activeWire ? '#1fb7a7' : colorWire(wire)} strokeWidth={activeWire ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/> })}</svg>
        {parts.map((part) => { const definition = definitions.find((item) => item.id === part.type); if (!definition) return null; return <div key={part.id} draggable tabIndex={0} role="group" onFocus={(event) => { if (event.target === event.currentTarget) onSelect(part.id) }} onClick={(event) => { if (!(event.target as HTMLElement).closest('button')) onSelect(part.id) }} onKeyDown={(event) => { if ((event.key === 'r' || event.key === 'R' || event.key === 'Delete' || event.key.startsWith('Arrow')) && event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(part.id) } else if (event.key === 'r' || event.key === 'R') { event.preventDefault(); onRotate(part.id) } else if (event.key === 'Delete' && part.type !== 'board') { event.preventDefault(); onRemove(part.id) } }} onDragStart={(event) => event.dataTransfer.setData('partId', part.id)} className={`assembly3d-part shape-${definition.visual.shape3d} ${activePart?.(part)?'assembly3d-part-active':''}`} style={{ left: `${part.x}%`, top: `${part.y}%`, transform: `translate(-50%,-50%) rotateZ(${part.rotation ?? 0}deg)` }} title={`${nameFor(part)} — ${definition.explanation}`}>
          <div className="assembly3d-solid" aria-hidden="true"><i/><i/><i/></div><strong>{nameFor(part)}</strong><div className="assembly3d-pins">{definition.pins.map((pin) => { const key = `${part.id}:${pin.id}`; return <button key={pin.id} type="button" className={`part-pin pin-${pin.electricalType} ${pending === key ? 'pin-pending' : ''}`} aria-label={`${nameFor(part)} chân ${pin.label} · ${pin.polarity ?? pin.electricalType}`} aria-pressed={pending === key} title={`${pin.label} — ${pin.polarity ?? pin.electricalType}`} onClick={(event) => { event.stopPropagation(); onPinClick(key) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); else if (event.key.startsWith('Arrow')) event.stopPropagation() }}>{pin.label}</button> })}</div>
        </div> })}
      </div>
      <span className="assembly3d-hint">Kéo nền để xoay · kéo linh kiện để sắp xếp · phím mũi tên khi vùng xem được chọn · chọn hai chân khi đang nối dây</span>
      <div className="assembly3d-legend"><span><i className="wire-red"/>Nguồn +</span><span><i className="wire-black"/>GND</span><span><i className="wire-blue"/>Tín hiệu</span></div>
    </div>
  </div>
}
