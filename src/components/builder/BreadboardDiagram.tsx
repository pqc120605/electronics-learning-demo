import { FreestyleBoardArt } from '../freestyle/FreestyleBoardArt'
import { isDhtPart, keypadKeys } from '../../data/kitPartProfiles'
import type { BoardDiagramPresentation } from '../../lib/boardTopView'
import { adjacentBreadboardHole, buildBreadboardDiagram, breadboardDiagramWireColor, type DiagramPart, type DiagramPin } from '../../lib/breadboardDiagram'
import { getR2cBreadboard, type BreadboardSpec } from '../../data/catalogR2cBoards'
import { RAIL_IDS, breadboardCounts } from '../../lib/breadboardGrid'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import type { FreestyleWireLayout, WireBend } from '../../lib/freestyle/freestyleWireLayout'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react'

export type WireSignalLabel = { text: string; tone: 'high' | 'low' | 'power' | 'ground' | 'other'; flowing: boolean }

type Props = {
  doc: CircuitDocV2
  presentation?: BoardDiagramPresentation
  selectedWireId?: string | null
  selectedPartId?: string | null
  selectedPartIds?: ReadonlySet<string>
  selectedEndpointId?: string | null
  focusedHoleId?: string
  showHeading?: boolean
  activeWireIds?: ReadonlySet<string>
  highlightedWireIds?: ReadonlySet<string>
  highlightedHoleIds?: ReadonlySet<string>
  /** Mức logic từ trace bài học/provider đang chạy; null = không chạy, không vẽ tín hiệu. */
  traceLevel?: 'HIGH' | 'LOW' | null
  /** LED đang sáng theo state mô phỏng (không phải phép đo). */
  litPartIds?: ReadonlySet<string>
  /** Nhãn tín hiệu theo từng dây từ provider trace (ưu tiên hơn traceLevel). */
  wireSignals?: ReadonlyMap<string, WireSignalLabel>
  onChooseEndpoint: (endpoint: CircuitEndpointV2) => void
  onActivateEndpoint: (event: MouseEvent<SVGElement>, endpoint: CircuitEndpointV2) => void
  onStartEndpointDrag: (event: PointerEvent<SVGCircleElement>, endpoint: CircuitEndpointV2) => void
  onMoveEndpointDrag: (event: PointerEvent<SVGSVGElement>) => void
  onFinishEndpointDrag: (event: PointerEvent<SVGSVGElement>) => void
  onCancelEndpointDrag: () => void
  onSelectWire: (wireId: string) => void
  onSelectPart: (partId: string, extend?: boolean) => void
  onSelectParts?: (partIds: string[]) => void
  onFocusHole?: (holeId: string) => void
  adjustWirePath?: boolean
  wireLayout?: FreestyleWireLayout
  onWireBendChange?: (wireId: string, bend: WireBend | null) => void
}

function selectByKeyboard(event: KeyboardEvent<SVGElement>, select: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  select()
}

function navigateHoleByKeyboard(event: KeyboardEvent<SVGCircleElement>, holeId: string, select: () => void, spec?: BreadboardSpec) {
  const nextId = adjacentBreadboardHole(holeId, event.key, spec)
  if (nextId) {
    const next = Array.from(event.currentTarget.ownerSVGElement?.querySelectorAll<SVGCircleElement>('.diagram-hole-hit-target') ?? [])
      .find(hole => hole.dataset.circuitEndpoint === nextId)
    if (next) {
      event.preventDefault()
      next.focus()
      return
    }
  }
  selectByKeyboard(event, select)
}

function PartBody({ part, selected, lit = false, selectedEndpointId, onSelect, onChoosePin, onActivateEndpoint, onStartEndpointDrag }: { part: DiagramPart; selected: boolean; lit?: boolean; selectedEndpointId: string | null; onSelect: (extend?: boolean) => void; onChoosePin: (pin: DiagramPin) => void; onActivateEndpoint: Props['onActivateEndpoint']; onStartEndpointDrag: Props['onStartEndpointDrag'] }) {
  const lastPin = part.pins[part.pins.length - 1]
  const pinSpan = lastPin && part.pins.length > 1 ? Math.hypot(lastPin.x - part.pins[0].x, lastPin.y - part.pins[0].y) : 0
  return <g data-diagram-part={part.id} data-mount={part.mount} className={`breadboard-diagram-part breadboard-diagram-part-${part.type} diagram-part-${part.mount} ${selected ? 'is-selected' : ''} ${lit ? 'is-lit' : ''}`}>
    <g className="diagram-part-body-control" role="button" tabIndex={0} aria-pressed={selected} aria-label={`${part.label}${part.type === 'button' ? ' SW' : ''}${part.value ? ` ${part.value}` : ''} · ${part.id}`} onClick={event=>onSelect(event.shiftKey)} onKeyDown={event => selectByKeyboard(event, ()=>onSelect(event.shiftKey))} transform={`translate(${part.center.x} ${part.center.y}) rotate(${part.rotation})`}>
    {part.type === 'button' ? <g>
      <path className="diagram-component-lead" d={`M${-pinSpan / 2} 0H${-part.width / 2} M${part.width / 2} 0H${pinSpan / 2}`} />
      <rect className="diagram-button-body" x={-part.width / 2 + 6} y={-part.height / 2} width={part.width - 12} height={part.height} rx="9" />
      <circle className="diagram-button-cap" cx="0" cy="-2" r="14" />
      <text className="diagram-button-mark" x="0" y="3" textAnchor="middle">SW</text>
    </g> : part.type === 'resistor' ? <g>
      <path className="diagram-component-lead" d={`M${-pinSpan / 2} 0H${-part.width / 2} M${part.width / 2} 0H${pinSpan / 2}`} />
      <rect className="diagram-resistor-body" x={-part.width / 2} y={-part.height / 2} width={part.width} height={part.height} rx="8" />
      <path className="diagram-resistor-band" d={`M${-part.width / 4} ${-part.height / 2}v${part.height} M${part.width / 8} ${-part.height / 2}v${part.height}`} />
      <text className="diagram-component-value" x="0" y={-part.height / 2 - 9} textAnchor="middle">{part.value || part.id}</text>
    </g> : part.type === 'led' ? <g>
      <path className="diagram-component-lead" d={`M${-pinSpan / 2} 0h${(pinSpan - 22) / 2} M${22 / 2} 0h${(pinSpan - 22) / 2}`} />
      <circle className="diagram-led-body" cx="0" cy="0" r="13" />
      <path className="diagram-led-cap" d="M-10 1q10 13 20 0v-3q-10-12-20 0z" />
      <text className="diagram-component-value" x="0" y="-23" textAnchor="middle">LED</text>
    </g> : isDhtPart(part.type) ? <g aria-hidden="true">
      <rect x="-33" y="-26" width="66" height="52" rx="7" fill={part.type === 'dht11' ? '#096997' : '#d2d9d7'} stroke="#2c484e"/>
      {Array.from({length:12}, (_,i) => <rect key={i} x={-21 + (i % 4) * 12} y={-19 + Math.floor(i / 4) * 8} width="7" height="4" rx="1" fill="#1e3a45"/>)}
      <text x="0" y="19" textAnchor="middle" fontSize="11" fill={part.type === 'dht11' ? '#fff' : '#1e3a45'}>{part.type === 'dht11' ? 'DHT11' : 'DHT22'}</text>
    </g> : part.type === 'keypad-4x4' ? <g aria-hidden="true">
      <rect x="-43" y="-30" width="86" height="60" rx="6" fill="#263841"/>
      {keypadKeys.map((key, index) => <g key={key} transform={`translate(${-32 + index % 4 * 16},${-22 + Math.floor(index / 4) * 12})`}><rect width="13" height="9" rx="2" fill="#f6eee0"/><text x="6.5" y="7" fill="#1e3a45" textAnchor="middle" fontSize="7">{key}</text></g>)}
    </g> : part.type === 'seven-segment' || part.type === 'seven-segment-anode' ? <g aria-hidden="true">
      <rect x="-24" y="-25" width="48" height="50" rx="4" fill="#23323a"/>
      <path d="M-10 -16H7M9 -13V-3M9 3V13M-10 16H7M-12 3V13M-12 -13V-3M-10 0H7" fill="none" stroke="#e9867f" strokeWidth="3" strokeLinecap="round" opacity=".73"/>
      <circle cx="16" cy="16" r="2" fill="#e9867f"/>
    </g> : <g>
      <rect className="diagram-generic-body" x={-part.width / 2} y={-part.height / 2} width={part.width} height={part.height} rx="5" />
      <text className="diagram-component-value" x="0" y="4" textAnchor="middle">{part.label}</text>
      {part.value && <text className="diagram-component-value" x="0" y={-part.height / 2 - 8} textAnchor="middle">{part.value}</text>}
    </g>}
    </g>
    {part.pins.map(pin => <g key={pin.key}><circle className="diagram-part-pin-visible" cx={pin.x} cy={pin.y} r="6.5" aria-hidden="true" /><circle className={`diagram-part-pin ${selectedEndpointId === pin.key ? 'is-selected' : ''}`} cx={pin.x} cy={pin.y} r="11" data-diagram-endpoint={pin.key} data-circuit-endpoint={pin.key} aria-label={`${part.id} ${pin.label}${pin.holeId ? `, lỗ ${pin.holeId}` : ', đầu nối trên bàn'}`} role="button" tabIndex={0} onClick={event => onActivateEndpoint(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onPointerDown={event => onStartEndpointDrag(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onKeyDown={event => selectByKeyboard(event, () => onChoosePin(pin))} /></g>)}
  </g>
}

function WireLevelPill({ path, signal }: { path: string; signal: WireSignalLabel }) {
  const match = /M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(path)
  if (!match) return null
  const x = Number(match[1]) + 14
  const y = Number(match[2]) - 16
  const width = signal.text.length * 7 + 14
  return <g className={`diagram-level-pill is-${signal.tone}`} transform={`translate(${x} ${y})`} aria-hidden="true"><rect x="-4" y="-11" width={width} height="18" rx="9" /><text x={width / 2 - 4} y="2" textAnchor="middle">{signal.text}</text></g>
}

export function BreadboardDiagram({ doc, presentation, selectedWireId = null, selectedPartId = null, selectedPartIds, selectedEndpointId = null, focusedHoleId = 'bb1:1a', showHeading = false, activeWireIds = new Set<string>(), highlightedWireIds = new Set<string>(), highlightedHoleIds, traceLevel = null, litPartIds = new Set<string>(), wireSignals, onChooseEndpoint, onActivateEndpoint, onStartEndpointDrag, onMoveEndpointDrag, onFinishEndpointDrag, onCancelEndpointDrag, onSelectWire, onSelectPart, onSelectParts, onFocusHole, adjustWirePath = false, wireLayout, onWireBendChange }: Props) {
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(false)
  const [explicitZoom, setExplicitZoom] = useState(false)
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)
  const [focusedPin, setFocusedPin] = useState<string | null>(null)
  const [bends, setBends] = useState<ReadonlyMap<CircuitDocV2['wires'][number], { x: number; y: number }>>(new Map())
  const dragBend = useRef<{ wireId: string; point: WireBend } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const rangeStart = useRef<DOMPoint | null>(null)
  const [range, setRange] = useState<{x:number;y:number;width:number;height:number}>()
  const zoomAnchor = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const diagram = useMemo(() => buildBreadboardDiagram(doc, presentation), [doc, presentation])
  const pointInDiagram = (event: PointerEvent<SVGSVGElement>) => {
    const matrix=event.currentTarget.getScreenCTM()
    return matrix ? new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()) : null
  }
  const rectangle = (start: DOMPoint, end: DOMPoint) => ({x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)})
  const startRange = (event: PointerEvent<SVGSVGElement>) => {
    if (!onSelectParts || !event.shiftKey || event.pointerType!=='mouse' || event.button!==0 || (event.target instanceof Element && event.target.closest('[role="button"]'))) return
    const point=pointInDiagram(event)
    if (!point) return
    event.preventDefault()
    rangeStart.current=point
    event.currentTarget.setPointerCapture(event.pointerId)
    setRange(rectangle(point,point))
  }
  const moveRange = (event: PointerEvent<SVGSVGElement>) => {
    if (!rangeStart.current) { onMoveEndpointDrag(event);return }
    const end=pointInDiagram(event)
    if (end) setRange(rectangle(rangeStart.current,end))
  }
  const endRange = (event: PointerEvent<SVGSVGElement>) => {
    const start=rangeStart.current
    if (!start) { onFinishEndpointDrag(event);return }
    rangeStart.current=null;setRange(undefined)
    const end=pointInDiagram(event)
    if (!end) return
    const box=rectangle(start,end)
    onSelectParts?.(diagram.parts.filter(({center})=>center.x>=box.x&&center.x<=box.x+box.width&&center.y>=box.y&&center.y<=box.y+box.height).map(part=>part.id))
  }
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const wheel = (event: WheelEvent) => {
      if (!event.deltaY || event.ctrlKey || event.metaKey || event.shiftKey) return
      const bounds = svgRef.current?.getBoundingClientRect()
      if (!bounds?.width || !bounds.height) return
      const current = bounds.width / diagram.width
      const next = event.deltaY < 0 ? Math.min(4, current * 1.16) : Math.min(current, Math.max(.25, current / 1.16))
      if (Math.abs(next - current) < 0.001) return
      event.preventDefault()
      const viewport = container.getBoundingClientRect()
      zoomAnchor.current = {
        x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height,
        offsetX: event.clientX - viewport.left, offsetY: event.clientY - viewport.top,
      }
      setFit(false)
      setExplicitZoom(true)
      setZoom(next)
    }
    container.addEventListener('wheel', wheel, { passive: false })
    return () => container.removeEventListener('wheel', wheel)
  }, [diagram.width])
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current
    zoomAnchor.current = null
    if (!anchor || !scrollRef.current || !svgRef.current) return
    const box = svgRef.current.getBoundingClientRect()
    scrollRef.current.scrollTo(anchor.x * box.width - anchor.offsetX, anchor.y * box.height - anchor.offsetY)
  }, [zoom, explicitZoom, fit])
  const occupiedHoleIds = new Set(diagram.parts.flatMap(part => part.pins.flatMap(pin => pin.holeId ? [pin.holeId] : [])))
  const signalOf = (wireId: string): WireSignalLabel | null => !activeWireIds.has(wireId) ? null : wireSignals?.get(wireId) ?? (traceLevel ? { text: traceLevel, tone: traceLevel === 'HIGH' ? 'high' : 'low', flowing: traceLevel === 'HIGH' } : null)
  const choosePin = (pin: DiagramPin) => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId })
  const rowHole = (holeId: string) => onChooseEndpoint({ kind: 'hole', holeId })
  const board = doc.parts.find(part => part.type === 'board')
  const wireTitles = new Map(doc.wires.map(wire => [wire.id, wire]))
  // Function aliases can share a sourced physical pad (e.g. input and trig).
  // Keep stable endpoint IDs, but don't let an unused alias cover a wired pin.
  const connectedPins=new Set(doc.wires.flatMap(wire=>[wire.from,wire.to].flatMap(endpoint=>endpoint.kind==='pin'?[`${endpoint.partId}:${endpoint.pinId}`]:[])))
  const pinPriority=(key:string)=>selectedEndpointId===key?2:connectedPins.has(key)?1:0
  const boardPinMarkers=[...diagram.boardPins].sort((a,b)=>pinPriority(a.key)-pinPriority(b.key))
  const indicatedPin = diagram.boardPins.find(pin => pin.key === (hoveredPin ?? focusedPin))
  const editableRoute = adjustWirePath ? diagram.wires.find(wire => wire.id === selectedWireId) : undefined
  const editableWire = editableRoute ? wireTitles.get(editableRoute.id) : undefined
  const bendOf = (wire: CircuitDocV2['wires'][number]) => onWireBendChange
    ? (dragBend.current?.wireId === wire.id ? dragBend.current.point : wireLayout?.[wire.id])
    : bends.get(wire)
  const routeHandle = editableRoute && ((editableWire && bendOf(editableWire))
    ?? editableRoute.points[Math.floor(editableRoute.points.length / 2)])
  const resetBend = () => {
    if (editableWire && onWireBendChange) onWireBendChange(editableWire.id, null)
    else setBends(current => new Map([...current].filter(([wire]) => wire !== editableWire)))
  }
  const moveBend = (x: number, y: number, preview = false) => {
    if (!editableWire) return
    const point = { x: Math.min(diagram.width - 8, Math.max(8, x)), y: Math.min(diagram.height - 8, Math.max(8, y)) }
    if (onWireBendChange && !preview) { onWireBendChange(editableWire.id, point); return }
    if (onWireBendChange) dragBend.current = { wireId: editableWire.id, point }
    setBends(current => {
      const next = new Map([...current].filter(([wire]) => doc.wires.includes(wire)))
      next.set(editableWire, point)
      return next
    })
  }

  const spec = doc.breadboards[0]?.spec
  const profile = getR2cBreadboard(spec)
  const railCount = breadboardCounts(spec).railHoles
  const marks = diagram.holes.filter(hole=>hole.kind==='rail'&&hole.id.endsWith(':1'))
  return <section className="breadboard-diagram" aria-label="Mạch lắp thử nhìn từ trên xuống">
    {showHeading && <header className="breadboard-diagram-header"><div><p className="breadboard-editor-eyebrow">MẠCH LẮP · CÙNG CIRCUITDOC V2</p><h3>Breadboard và dây nối</h3></div><p>Lỗ cắm, chân linh kiện và từng dây lấy từ cùng sơ đồ mạch; chọn điểm để nối hoặc xem net.</p></header>}
    {doc.breadboards.length > 0 && <p className="breadboard-diagram-assumption" role="note">{profile
      ? 'Adafruit '+profile.pid+' · '+profile.pointCount+' điểm · '+(railCount ? '4 rail độc lập, mỗi rail 50 lỗ.' : 'Hai dải 5 lỗ mỗi cột, không có rail nguồn.')
      : 'Lưới minh họa 400 tie-point. Số lỗ và cách nối dải ray là giả định của mô hình, chưa xác minh trên mẫu vật lý.'}</p>}
    <div className="freestyle-view-controls" aria-label="Thu phóng mạch 2D"><button type="button" onClick={() => { setFit(false); setExplicitZoom(true); setZoom(z => Math.max(.25, z / 1.25)) }} disabled={zoom<=.25&&!fit} aria-label="Thu nhỏ mạch 2D">−</button><span>{fit ? 'Tổng quan' : `${Math.round(zoom*100)}%`}</span><button type="button" onClick={() => { setFit(false); setExplicitZoom(true); setZoom(z => Math.min(4, z * 1.25)) }} disabled={zoom>=4&&!fit} aria-label="Phóng to mạch 2D">+</button><button type="button" onClick={() => { setZoom(1); setFit(true); setExplicitZoom(false) }}>Vừa khung 2D</button></div>
    <p className="diagram-navigation-hint">Cuộn trên mạch để thu phóng. Kéo thanh cuộn để di chuyển, hoặc chọn “Vừa khung 2D”.</p>
    <div ref={scrollRef} className="breadboard-diagram-scroll mm-keep-light" tabIndex={0} role="region" aria-label="Khung mạch 2D có thể cuộn và thu phóng">
      <svg ref={svgRef} className="breadboard-diagram-svg" data-fit={fit} style={{ '--diagram-natural-width': `${diagram.width}px`, ...(explicitZoom ? {width: `${diagram.width * zoom}px`, minWidth: 0, maxHeight:'none'} : {}) } as CSSProperties} viewBox={`0 0 ${diagram.width} ${diagram.height}`} role="group" aria-label={`${presentation?.name ?? (board ? "Board ESP32" : "Chưa chọn board")}, breadboard, linh kiện và dây jumper`} onPointerDown={startRange} onPointerMove={moveRange} onPointerUp={endRange} onPointerCancel={()=>{rangeStart.current=null;setRange(undefined);onCancelEndpointDrag()}}>
        <defs>
          <linearGradient id="diagram-board" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1d7769"/><stop offset="1" stopColor="#103e39"/></linearGradient>
          <filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#23353a" floodOpacity=".2"/></filter>
        </defs>
        <rect className="diagram-bench" x="0" y="0" width={diagram.width} height={diagram.height} rx="13" />
        {board && <g className="diagram-board" data-diagram-part={board.id}>
          <g className="diagram-board-body-control" role="button" tabIndex={0} aria-label={`Thông tin ${presentation?.name ?? 'board'}`} onClick={() => onSelectPart(board.id)} onKeyDown={event => selectByKeyboard(event, () => onSelectPart(board.id))}>
            {presentation ? <FreestyleBoardArt view={presentation} {...diagram.board} /> : <>
            <rect x={diagram.board.x} y={diagram.board.y} width={diagram.board.width} height={diagram.board.height} rx="18" />
            <rect className="diagram-board-module" x={diagram.board.x + 43} y={diagram.board.y + 22} width={126} height={66} rx="9" />
            <path className="diagram-board-antenna" d={`M${diagram.board.x + 70} ${diagram.board.y + 48}h72`} />
            <rect className="diagram-board-usb" x={diagram.board.x - 8} y={diagram.board.y + 72} width="22" height="58" rx="4" />
            <text className="diagram-board-name" x={diagram.board.x + diagram.board.width / 2} y={diagram.board.y + 154} textAnchor="middle">ESP32 DevKit V1</text>
            <text className="diagram-board-note" x={diagram.board.x + diagram.board.width / 2} y={diagram.board.y + 174} textAnchor="middle">board pin map · minh họa</text>
            </>}
          </g>
        </g>}
        {doc.breadboards.length > 0 && <g className="diagram-breadboard" filter="url(#diagram-shadow)">
          <rect x={diagram.breadboard.x} y={diagram.breadboard.y} width={diagram.breadboard.width} height={diagram.breadboard.height} rx="18" />
          <rect className="diagram-breadboard-core" x={diagram.breadboard.x + 12} y={diagram.breadboard.y + 12} width={diagram.breadboard.width - 24} height={diagram.breadboard.height - 24} rx="12" />
        </g>}
        {doc.breadboards.length > 0 && <g className="diagram-rail" aria-hidden="true">
          {RAIL_IDS.map(rail=>{
            const points = diagram.holes.filter(hole=>hole.id.startsWith('bb1:'+rail+':'))
            if (!points.length) return null
            const halves = doc.breadboards[0]?.railSplit ? [points.slice(0,Math.floor(railCount/2)),points.slice(Math.floor(railCount/2))] : [points]
            return halves.map(([start,...rest])=><line key={start.id} className={rail.endsWith('+')?'diagram-rail-positive':'diagram-rail-ground'}
              x1={start.x} y1={start.y} x2={rest.at(-1)?.x??start.x} y2={start.y} />)
          })}
        </g>}
        <g className="diagram-wire-routes" aria-label="Dây jumper">
          {diagram.wires.map(wire => {
            const sourceWire = wireTitles.get(wire.id)
            const bend = sourceWire && bendOf(sourceWire)
            const path = bend
              ? `M ${wire.from.x} ${wire.from.y} L ${bend.x} ${bend.y} L ${wire.to.x} ${wire.to.y}`
              : wire.path
            return <g key={wire.id} className={`diagram-wire ${selectedWireId === wire.id ? 'is-selected' : ''} ${activeWireIds.has(wire.id) ? 'is-active' : ''} ${signalOf(wire.id) ? `is-level-${signalOf(wire.id)!.tone}` : ''} ${highlightedWireIds.has(wire.id) ? 'is-net-highlighted' : ''}`} data-diagram-wire={wire.id} data-wire-role={wire.role} role="button" tabIndex={0} aria-label={`${wire.id}: ${wire.fromKey} nối ${wire.toKey}${highlightedWireIds.has(wire.id) ? ' · thuộc net đang chọn trên sơ đồ' : ''}${wireTitles.get(wire.id)?.role ? ` · ${wireTitles.get(wire.id)?.role}` : ''}`} onClick={() => onSelectWire(wire.id)} onKeyDown={event => selectByKeyboard(event, () => onSelectWire(wire.id))}>
              <path className="diagram-wire-outline" d={path} /><path className="diagram-wire-color" d={path} style={{ stroke: highlightedWireIds.has(wire.id) ? '#087f9b' : breadboardDiagramWireColor(wire.role) }} />
              {signalOf(wire.id)?.flowing && <path className="diagram-wire-flow" d={path} aria-hidden="true" />}
              {signalOf(wire.id) && <WireLevelPill path={path} signal={signalOf(wire.id)!} />}
            </g>
          })}
        </g>
        <g className="diagram-board-pin-layer" role="group" aria-label="Chân board">
          {boardPinMarkers.map(pin => <g key={pin.key} className={`diagram-board-pin ${selectedEndpointId === pin.key ? 'is-selected' : ''}`}>
            <circle className="diagram-board-pin-visible" cx={pin.x} cy={pin.y} r="6" aria-hidden="true" />
            <circle className="diagram-board-pin-hit-target" cx={pin.x} cy={pin.y} r="11" role="button" tabIndex={0} data-diagram-endpoint={pin.key} data-circuit-endpoint={pin.key} aria-label={`${pin.key} · ${pin.label}`} onPointerEnter={() => setHoveredPin(pin.key)} onPointerLeave={() => setHoveredPin(null)} onFocus={() => setFocusedPin(pin.key)} onBlur={() => setFocusedPin(null)} onClick={event => onActivateEndpoint(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onPointerDown={event => onStartEndpointDrag(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onKeyDown={event => selectByKeyboard(event, () => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId }))} />
            <title>{`${pin.label} · ${pin.key}`}</title>
            {(!presentation||selectedEndpointId===pin.key)&&<text x={pin.x + (pin.side === 'left' ? 11 : -11)} y={pin.y + 4} textAnchor={pin.side === 'left' ? 'start' : 'end'}>{pin.label}</text>}
          </g>)}
        </g>
        <g className="diagram-hole-layer" role="group" aria-label="Các lỗ cắm breadboard">
          {diagram.holes.map(hole => <circle key={hole.id} className={`diagram-hole ${hole.kind === 'rail' ? 'is-rail' : ''} ${selectedEndpointId === hole.id ? 'is-selected' : highlightedHoleIds?.has(hole.id) ? 'is-same-net' : ''}`} cx={hole.x} cy={hole.y} r={hole.kind === 'rail' ? 3.2 : 3.4} data-diagram-hole={hole.id} />)}
        </g>
        {doc.breadboards.length > 0 && <g className="diagram-row-labels" aria-hidden="true">
          {'abcdefghij'.split('').map(row => <text key={row} x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === `bb1:1${row}`)?.y! + 4}>{row.toUpperCase()}</text>)}
          {Array.from({ length: 6 }, (_, index) => index * 5 + 1).map(column => <text key={column} x={diagram.holes.find(hole => hole.id === `bb1:${column}a`)?.x} y={diagram.breadboard.y + 40}>{column}</text>)}
        </g>}
        {diagram.parts.some(part => part.mount === 'bench') && <g className="diagram-bench-lane" aria-label="Linh kiện đặt ngoài breadboard">
          <path d="M24 430H292" />
          <text x="32" y="451">ĐẶT NGOÀI BREADBOARD · NỐI BẰNG JUMPER</text>
        </g>}
        <g className="diagram-mounted-parts">
          {diagram.parts.map(part => <PartBody key={part.id} part={part} selected={selectedPartId === part.id || Boolean(selectedPartIds?.has(part.id))} lit={litPartIds.has(part.id)} selectedEndpointId={selectedEndpointId} onSelect={extend => onSelectPart(part.id,Boolean(onSelectParts)&&extend)} onChoosePin={choosePin} onActivateEndpoint={onActivateEndpoint} onStartEndpointDrag={onStartEndpointDrag} />)}
        </g>
        <g className="diagram-hole-hit-layer" role="group" aria-label="Điểm chọn lỗ breadboard">
          {diagram.holes.map(hole => <circle key={hole.id} className={`diagram-hole-hit-target ${hole.kind === 'rail' ? 'is-rail' : ''} ${selectedEndpointId === hole.id ? 'is-selected' : highlightedHoleIds?.has(hole.id) ? 'is-same-net' : ''}`} cx={hole.x} cy={hole.y} r={11} style={occupiedHoleIds.has(hole.id) ? { pointerEvents: 'none' } : undefined} data-occupied={occupiedHoleIds.has(hole.id)} data-diagram-endpoint={hole.id} data-circuit-endpoint={hole.id} role="button" tabIndex={hole.id === focusedHoleId ? 0 : -1} aria-label={`${hole.id} · net ${hole.net ?? 'chưa rõ'}${occupiedHoleIds.has(hole.id) ? ' · đang có chân linh kiện; dùng bàn phím hoặc lưới chi tiết để chọn lỗ' : ''}`} onFocus={() => onFocusHole?.(hole.id)} onClick={event => onActivateEndpoint(event, { kind: 'hole', holeId: hole.id })} onPointerDown={event => onStartEndpointDrag(event, { kind: 'hole', holeId: hole.id })} onKeyDown={event => navigateHoleByKeyboard(event, hole.id, () => rowHole(hole.id),spec)} />)}
        </g>
        {doc.breadboards.length > 0 && <g className="diagram-rail-labels" aria-hidden="true">
          {marks.map(mark=><text key={mark.id} x={diagram.breadboard.x+10} y={mark.y+4}>{mark.id.includes('+')?'+':'−'}</text>)}
          <text className="diagram-trench-label" x={diagram.breadboard.x + diagram.breadboard.width / 2} y={profile ? diagram.breadboard.y + diagram.breadboard.height / 2 + 4 : diagram.breadboard.y + 276} textAnchor="middle">RÃNH GIỮA · HAI NỬA KHÔNG NỐI</text>
        </g>}
        {editableRoute && routeHandle && <circle className="diagram-wire-handle" cx={routeHandle.x} cy={routeHandle.y} r="10" tabIndex={0} role="button"
          aria-label={`Chỉnh đường đi dây ${editableRoute.id}. Dùng phím mũi tên để di chuyển, Enter để đặt lại.`}
          onPointerDown={event => { if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId) }}
          onPointerMove={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
            const matrix = svgRef.current?.getScreenCTM()
            if (!matrix) return
            const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
            moveBend(point.x, point.y, true)
          }}
          onPointerUp={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
            const pending = dragBend.current
            dragBend.current = null
            if (pending) onWireBendChange?.(pending.wireId, pending.point)
            event.currentTarget.releasePointerCapture(event.pointerId)
          }}
          onPointerCancel={() => { dragBend.current = null; setBends(new Map()) }}
          onKeyDown={event => {
            const delta = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[event.key]
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); resetBend() }
            if (delta) { event.preventDefault(); moveBend(routeHandle.x + delta[0], routeHandle.y + delta[1]) }
          }} />}
        {range && <rect {...range} fill="#087f9b22" stroke="#087f9b" strokeDasharray="7 3" pointerEvents="none" aria-hidden="true" />}
        {indicatedPin && <g className="diagram-pin-tooltip" aria-hidden="true" transform={`translate(${Math.max(65, Math.min(diagram.width - 65, indicatedPin.x))} ${Math.max(19, indicatedPin.y - 19)})`}>
          <rect x="-62" y="-14" width="124" height="24" rx="5" />
          <text textAnchor="middle" y="3">{indicatedPin.label}</text>
        </g>}
      </svg>
    </div>
    {editableRoute && <p className="diagram-navigation-hint">Kéo chốt trên dây để đổi đường đi hiển thị. Hai đầu dây giữ nguyên.{onWireBendChange ? ' Đường đi được lưu cùng bản nháp trên trình duyệt này.' : ''} <button type="button" onClick={resetBend}>Về đường tự động</button></p>}
    {presentation && <details className="diagram-source-details"><summary>Nguồn hình board</summary><p>{presentation.revision} · Hình chiếu trực giao của model tham chiếu, không phải ảnh chụp hay số đo board thật.</p><a href="/board-reference/topview/NOTICE.md" target="_blank" rel="noreferrer">Nguồn, giấy phép và giới hạn model</a></details>}
    {diagram.diagnostics.map((message, index) => <p key={index} className="breadboard-diagram-diagnostic" role="note">{message}</p>)}
  </section>
}
