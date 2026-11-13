import { useLayoutEffect, useRef, useState, type DragEvent, type PointerEvent } from 'react'
import type { ComponentDefinition } from '../../data/componentRegistry'
import type { CircuitConnection, CircuitPart } from '../../types/circuitTopology'
import { getWireNetGroups } from '../../lib/circuitNets'
import { SchematicSymbol } from './SchematicSymbol'

export type SchematicPart = CircuitPart
export type SchematicWire = CircuitConnection
type Props = { parts: SchematicPart[]; wires: SchematicWire[]; definitions: ComponentDefinition[]; selectedPartId: string; selectedWireId: string; pending: string | null; highlightedNetKey: string | null; nameFor: (part: SchematicPart) => string; colorWire: (wire: SchematicWire) => string; active: (wire: SchematicWire) => boolean; activePart: (part: SchematicPart) => boolean; onSelect: (id: string) => void; onSelectWire: (id: string) => void; onSelectNet: (key: string | null) => void; onPinClick: (endpoint: string) => void; onDrop: (id: string, x: number, y: number) => void; onRotate: (id: string) => void; onRemove: (id: string) => void; onRemoveWire: (id: string) => void; onExportTarget?: (element: HTMLDivElement | null) => void }

export function SchematicView({ parts, wires, definitions, selectedPartId, selectedWireId, pending, highlightedNetKey, nameFor, colorWire, active, activePart, onSelect, onSelectWire, onSelectNet, onPinClick, onDrop, onRotate, onRemove, onRemoveWire, onExportTarget }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [manualMobileLayout, setManualMobileLayout] = useState(false)
  const [pinPoints, setPinPoints] = useState<Record<string, { x: number; y: number }>>({})
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const panDrag = useRef<{ x: number; y: number } | null>(null)
  const compact = canvasWidth > 0 && canvasWidth <= 680 && !manualMobileLayout
  const compactRows = Math.ceil(parts.length / 2)
  const netGroups = getWireNetGroups(wires)
  const compactPositions = Object.fromEntries(parts.map((part, index) => [part.id, {
    x: index % 2 === 0 ? 26 : 74,
    y: compactRows === 1 ? 50 : compactRows === 2 ? 26 + Math.floor(index / 2) * 48 : 14 + Math.floor(index / 2) * (72 / (compactRows - 1)),
  }]))
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const measure = () => setCanvasWidth(canvas.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const measurePins = () => {
      const bounds = svg.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const next: Record<string, { x: number; y: number }> = {}
      svg.parentElement?.querySelectorAll<HTMLElement>('[data-schematic-endpoint]').forEach(button => {
        const key = button.dataset.schematicEndpoint
        if (!key) return
        const pin = button.getBoundingClientRect()
        next[key] = { x: ((pin.left + pin.width / 2 - bounds.left) / bounds.width) * 100, y: ((pin.top + pin.height / 2 - bounds.top) / bounds.height) * 100 }
      })
      setPinPoints(next)
    }
    measurePins()
    const observer = new ResizeObserver(measurePins)
    observer.observe(svg)
    svg.parentElement?.querySelectorAll('[data-schematic-endpoint]').forEach(pin => observer.observe(pin))
    return () => observer.disconnect()
  }, [parts, zoom, pan, canvasWidth, compact, manualMobileLayout])
  function schematicPinPoint(endpoint: SchematicWire['from']) {
    const measured = pinPoints[`${endpoint.partId}:${endpoint.pinId}`]
    if (measured) return measured
    const part = parts.find(item => item.id === endpoint.partId)
    const definition = definitions.find(item => item.id === part?.type)
    const index = definition?.pins.findIndex(pin => pin.id === endpoint.pinId) ?? -1
    if (!part || !definition || index < 0) return { x: 0, y: 0 }
    const spread = Math.min(32, Math.max(12, definition.pins.length * 2.4))
    return { x: part.x + (index - (definition.pins.length - 1) / 2) * spread / Math.max(1, definition.pins.length - 1), y: part.y + 10 }
  }
  function applyCompactLayout(movedId?: string, moved?: { x: number; y: number }) {
    if (!compact) return
    parts.forEach(part => {
      const position = part.id === movedId && moved ? moved : compactPositions[part.id]
      if (position) onDrop(part.id, position.x, position.y)
    })
    setManualMobileLayout(true)
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const id = event.dataTransfer.getData('partId')
    const rect = event.currentTarget.getBoundingClientRect()
    if (!id || !rect.width || !rect.height) return
    const contentX = rect.width / 2 + (event.clientX - rect.left - rect.width / 2 - pan.x) / zoom
    const contentY = rect.height / 2 + (event.clientY - rect.top - rect.height / 2 - pan.y) / zoom
    const position = { x: Math.max(6, Math.min(94, contentX * 100 / rect.width)), y: Math.max(10, Math.min(90, contentY * 100 / rect.height)) }
    if (compact) applyCompactLayout(id, position)
    else onDrop(id, position.x, position.y)
  }
  function panStart(event: PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    panDrag.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function panMove(event: PointerEvent<HTMLDivElement>) {
    if (!panDrag.current) return
    setPan({ x: event.clientX - panDrag.current.x, y: event.clientY - panDrag.current.y })
  }
  function panEnd() { panDrag.current = null }
  function endpointName(endpoint: SchematicWire['from']) {
    const part = parts.find(item => item.id === endpoint.partId)
    const definition = definitions.find(item => item.id === part?.type)
    const pin = definition?.pins.find(item => item.id === endpoint.pinId)
    return `${part ? nameFor(part) : endpoint.partId}.${pin?.label ?? endpoint.pinId}`
  }
  return <section className="schematic-shell" aria-label="Sơ đồ nguyên lý tương tác">
    <header className="schematic-toolbar"><div><strong>Sơ đồ nguyên lý</strong><small>Kết nối theo chân đã khai báo · sơ đồ học tập, chưa phải ERC KiCad</small></div><span>Đỏ: nguồn +　Đen: GND　Xanh: tín hiệu</span><div className="schematic-zoom" role="group" aria-label="Điều khiển sơ đồ"><button type="button" aria-label="Thu nhỏ sơ đồ" onClick={() => setZoom(value => Math.max(.7, value - .1))}>−</button><output>{Math.round(zoom * 100)}%</output><button type="button" aria-label="Phóng to sơ đồ" onClick={() => setZoom(value => Math.min(1.5, value + .1))}>+</button><button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>Vừa khung</button></div></header>
    <div ref={canvasRef} className="schematic-canvas" style={compact ? { minHeight: `${Math.max(460, compactRows * 230)}px` } : undefined} onDragOver={event => event.preventDefault()} onDrop={drop}>
      <div ref={onExportTarget} className="schematic-content" onPointerDown={panStart} onPointerMove={panMove} onPointerUp={panEnd} onPointerCancel={panEnd} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <svg ref={svgRef} className="schematic-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Các dây nối của topology">{wires.map(wire => { const a = schematicPinPoint(wire.from); const b = schematicPinPoint(wire.to); const mid = (a.x + b.x) / 2; const selected = selectedWireId === wire.id; return <g key={wire.id} className={`schematic-wire ${selected ? 'schematic-wire-selected' : ''}`} role="button" tabIndex={0} aria-label={`Chọn dây ${endpointName(wire.from)} đến ${endpointName(wire.to)}`} onClick={() => onSelectWire(wire.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectWire(wire.id) } }}><path className="schematic-wire-hit" d={`M${a.x} ${a.y}H${mid}V${b.y}H${b.x}`} fill="none" stroke="transparent" strokeWidth="14" vectorEffect="non-scaling-stroke"/><path d={`M${a.x} ${a.y}H${mid}V${b.y}H${b.x}`} fill="none" stroke={selected ? '#fff3a6' : active(wire) ? '#25d3bc' : colorWire(wire)} strokeWidth={selected ? 1.5 : active(wire) ? 1.15 : .7} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none"/></g> })}</svg>
        {parts.map(part => { const def = definitions.find(item => item.id === part.type); if (!def) return null; return <article key={part.id} className={`schematic-part ${selectedPartId === part.id ? 'schematic-part-selected' : ''} ${activePart(part) ? 'schematic-part-active' : ''}`} draggable tabIndex={0} onKeyDown={event => {
          if ((event.key === 'r' || event.key === 'R' || event.key === 'Delete' || event.key.startsWith('Arrow')) && event.target !== event.currentTarget) return
          if (event.key === 'r' || event.key === 'R') { event.preventDefault(); onRotate(part.id) }
          else if (event.key === 'Delete' && part.type !== 'board') { event.preventDefault(); onRemove(part.id) }
          else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(part.id) }
          else if (event.key.startsWith('Arrow')) { event.preventDefault(); const step = event.shiftKey ? 5 : 2; const current = compact ? compactPositions[part.id] : part; const position = { x: Math.max(5, Math.min(95, current.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0))), y: Math.max(10, Math.min(90, current.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0))) }; if (compact) applyCompactLayout(part.id, position); else onDrop(part.id, position.x, position.y) }
        }} onDragStart={event => event.dataTransfer.setData('partId', part.id)} onClick={() => onSelect(part.id)} style={{ left: `${(compact ? compactPositions[part.id] : part).x}%`, top: `${(compact ? compactPositions[part.id] : part).y}%`, transform: 'translate(-50%,-50%)' }}>
          <SchematicSymbol type={part.type} label={nameFor(part)} rotation={part.rotation}/><strong>{nameFor(part)}</strong>
          <div className="schematic-pins">{def.pins.map(pin => { const key = `${part.id}:${pin.id}`; return <button key={pin.id} type="button" data-schematic-endpoint={key} className={`part-pin ${pin.electricalType} ${pending === key ? 'pin-pending' : ''}`} aria-label={`${nameFor(part)} chân ${pin.label} · ${pin.polarity ?? pin.electricalType}`} aria-pressed={pending === key} onClick={event => { event.stopPropagation(); onPinClick(key) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation() }} title={`${pin.label} · ${pin.polarity ?? pin.electricalType}`}>{pin.label}</button> })}</div>
        </article> })}
      </div>
    </div>
    <details className="schematic-net-list" aria-label="Các net logic của sơ đồ"><summary>{netGroups.length} net logic · chọn để tô sáng toàn đường nối</summary>{netGroups.length ? <ol>{netGroups.map((group, index) => <li key={group.key}><button type="button" aria-pressed={highlightedNetKey === group.key} onClick={() => onSelectNet(highlightedNetKey === group.key ? null : group.key)}><strong>Net {index + 1}</strong><span>{group.endpoints.map(endpoint => { const split = endpoint.lastIndexOf(':'); return endpointName({ partId: endpoint.slice(0, split), pinId: endpoint.slice(split + 1) }) }).join(' · ')}</span><small>{group.wireIds.length} dây · nối theo topology workspace</small></button></li>)}</ol> : <p>Chưa có net. Nối hai chân trong workspace để tạo nhóm kết nối.</p>}<p className="schematic-net-boundary">Net ở đây chỉ gom các chân có dây nối tường minh; không đồng nghĩa dòng điện, điện áp hoặc netlist PCB.</p></details>
    <details className="schematic-wire-list"><summary>{wires.length} kết nối dây · mở để chọn hoặc gỡ dây</summary>{wires.length ? wires.map(wire => <div key={wire.id} className={selectedWireId === wire.id ? 'wire-row-selected' : ''}><button type="button" className="wire-select" aria-pressed={selectedWireId === wire.id} onClick={() => onSelectWire(wire.id)}>{endpointName(wire.from)} ↔ {endpointName(wire.to)}</button><button type="button" onClick={() => onRemoveWire(wire.id)}>Gỡ dây</button></div>) : <p>Chưa có dây. Bật chế độ “Nối dây”, sau đó chọn lần lượt hai chân.</p>}</details>
    <p className="schematic-note">Kéo nền để di chuyển · kéo linh kiện để bố trí · chọn chân để xem thông tin; bật “Nối dây” để nối hai chân. Phím mũi tên di chuyển, Shift+mũi tên đi nhanh, R xoay, Delete xóa linh kiện đã chọn. Vị trí và dây dùng chung với các chế độ lắp mạch.</p>
  </section>
}
