import { FreestyleBoardArt } from '../freestyle/FreestyleBoardArt'
import type { BoardDiagramPresentation } from '../../lib/boardTopView'
import { adjacentBreadboardHole, buildBreadboardDiagram, breadboardDiagramWireColor, type DiagramPart, type DiagramPin } from '../../lib/breadboardDiagram'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import { useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react'

export type WireSignalLabel = { text: string; tone: 'high' | 'low' | 'power' | 'ground' | 'other'; flowing: boolean }

type Props = {
  doc: CircuitDocV2
  presentation?: BoardDiagramPresentation
  selectedWireId?: string | null
  selectedPartId?: string | null
  selectedEndpointId?: string | null
  focusedHoleId?: string
  showHeading?: boolean
  activeWireIds?: ReadonlySet<string>
  highlightedWireIds?: ReadonlySet<string>
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
  onSelectPart: (partId: string) => void
  onFocusHole?: (holeId: string) => void
}

function selectByKeyboard(event: KeyboardEvent<SVGElement>, select: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  select()
}

function navigateHoleByKeyboard(event: KeyboardEvent<SVGCircleElement>, holeId: string, select: () => void) {
  const nextId = adjacentBreadboardHole(holeId, event.key)
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

function PartBody({ part, selected, lit = false, selectedEndpointId, onSelect, onChoosePin, onActivateEndpoint, onStartEndpointDrag }: { part: DiagramPart; selected: boolean; lit?: boolean; selectedEndpointId: string | null; onSelect: () => void; onChoosePin: (pin: DiagramPin) => void; onActivateEndpoint: Props['onActivateEndpoint']; onStartEndpointDrag: Props['onStartEndpointDrag'] }) {
  const lastPin = part.pins[part.pins.length - 1]
  const pinSpan = lastPin && part.pins.length > 1 ? Math.hypot(lastPin.x - part.pins[0].x, lastPin.y - part.pins[0].y) : 0
  return <g data-diagram-part={part.id} data-mount={part.mount} className={`breadboard-diagram-part breadboard-diagram-part-${part.type} diagram-part-${part.mount} ${selected ? 'is-selected' : ''} ${lit ? 'is-lit' : ''}`}>
    <g className="diagram-part-body-control" role="button" tabIndex={0} aria-pressed={selected} aria-label={`${part.label}${part.type === 'button' ? ' SW' : ''}${part.value ? ` ${part.value}` : ''} · ${part.id}`} onClick={onSelect} onKeyDown={event => selectByKeyboard(event, onSelect)} transform={`translate(${part.center.x} ${part.center.y}) rotate(${part.rotation})`}>
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

export function BreadboardDiagram({ doc, presentation, selectedWireId = null, selectedPartId = null, selectedEndpointId = null, focusedHoleId = 'bb1:1a', showHeading = false, activeWireIds = new Set<string>(), highlightedWireIds = new Set<string>(), traceLevel = null, litPartIds = new Set<string>(), wireSignals, onChooseEndpoint, onActivateEndpoint, onStartEndpointDrag, onMoveEndpointDrag, onFinishEndpointDrag, onCancelEndpointDrag, onSelectWire, onSelectPart, onFocusHole }: Props) {
  const [zoom,setZoom]=useState(1)
  const [fit, setFit] = useState(false)
  const diagram = buildBreadboardDiagram(doc,presentation)
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

  return <section className="breadboard-diagram" aria-label="Mạch lắp thử nhìn từ trên xuống">
    {showHeading && <header className="breadboard-diagram-header"><div><p className="breadboard-editor-eyebrow">MẠCH LẮP · CÙNG CIRCUITDOC V2</p><h3>Breadboard và dây nối</h3></div><p>Lỗ cắm, chân linh kiện và từng dây lấy từ cùng sơ đồ mạch; chọn điểm để nối hoặc xem net.</p></header>}
    <p className="breadboard-diagram-assumption" role="note">Lưới minh họa 400 tie-point. Số lỗ và cách nối dải ray là giả định của mô hình, chưa xác minh trên mẫu vật lý.</p>
    <div className="freestyle-view-controls" aria-label="Thu phóng mạch 2D"><button onClick={()=>{setFit(false);setZoom(z=>Math.max(1,z-.5))}} disabled={zoom<=1&&!fit} aria-label="Thu nhỏ mạch 2D">−</button><span>{fit ? 'Tổng quan' : `${Math.round(zoom*100)}%`}</span><button onClick={()=>{setFit(false);setZoom(z=>Math.min(4,z+.5))}} disabled={zoom>=4&&!fit} aria-label="Phóng to mạch 2D">+</button><button onClick={()=>{setZoom(1);setFit(true)}}>Vừa khung 2D</button></div>
    <p className="diagram-navigation-hint">Cuộn trong khung để di chuyển, phóng to để chọn điểm cắm. Có thể nối bằng danh sách chân và lưới lỗ bên dưới.</p>
    <div className="breadboard-diagram-scroll mm-keep-light" tabIndex={0} role="region" aria-label="Khung mạch 2D có thể cuộn và thu phóng">
      <svg className="breadboard-diagram-svg" data-fit={fit} style={{ '--diagram-natural-width': `${diagram.width}px`, ...(zoom>1?{width:`${diagram.width*zoom}px`,maxHeight:'none'}:{}) } as CSSProperties} viewBox={`0 0 ${diagram.width} ${diagram.height}`} role="group" aria-label={`${presentation?.name ?? (board ? "Board ESP32" : "Chưa chọn board")}, breadboard, linh kiện và dây jumper`} onPointerMove={onMoveEndpointDrag} onPointerUp={onFinishEndpointDrag} onPointerCancel={onCancelEndpointDrag}>
        <defs>
          <linearGradient id="diagram-board" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1d7769"/><stop offset="1" stopColor="#103e39"/></linearGradient>
          <filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#23353a" floodOpacity=".2"/></filter>
        </defs>
        <rect className="diagram-bench" x="0" y="0" width={diagram.width} height={diagram.height} rx="13" />
        {board && <g className="diagram-board" data-diagram-part={board.id}>
          <g className="diagram-board-body-control" role="button" tabIndex={0} onClick={() => board && onSelectPart(board.id)} onKeyDown={event => selectByKeyboard(event, () => board && onSelectPart(board.id))}>
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
          <path className="diagram-rail-positive" d={`M${diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:T+:25')?.x ?? 0}`} />
          <path className="diagram-rail-ground" d={`M${diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:T-:25')?.x ?? 0}`} />
          <path className="diagram-rail-positive" d={`M${diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:B+:25')?.x ?? 0}`} />
          <path className="diagram-rail-ground" d={`M${diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:B-:25')?.x ?? 0}`} />
        </g>}
        <g className="diagram-wire-routes" aria-label="Dây jumper">
          {diagram.wires.map(wire => <g key={wire.id} className={`diagram-wire ${selectedWireId === wire.id ? 'is-selected' : ''} ${activeWireIds.has(wire.id) ? 'is-active' : ''} ${signalOf(wire.id) ? `is-level-${signalOf(wire.id)!.tone}` : ''} ${highlightedWireIds.has(wire.id) ? 'is-net-highlighted' : ''}`} data-diagram-wire={wire.id} data-wire-role={wire.role} role="button" tabIndex={0} aria-label={`${wire.id}: ${wire.fromKey} nối ${wire.toKey}${highlightedWireIds.has(wire.id) ? ' · thuộc net đang chọn trên sơ đồ' : ''}${wireTitles.get(wire.id)?.role ? ` · ${wireTitles.get(wire.id)?.role}` : ''}`} onClick={() => onSelectWire(wire.id)} onKeyDown={event => selectByKeyboard(event, () => onSelectWire(wire.id))}>
            <path className="diagram-wire-outline" d={wire.path} /><path className="diagram-wire-color" d={wire.path} style={{ stroke: highlightedWireIds.has(wire.id) ? '#087f9b' : breadboardDiagramWireColor(wire.role) }} />
            {signalOf(wire.id)?.flowing && <path className="diagram-wire-flow" d={wire.path} aria-hidden="true" />}
            {signalOf(wire.id) && <WireLevelPill path={wire.path} signal={signalOf(wire.id)!} />}
          </g>)}
        </g>
        <g className="diagram-board-pin-layer" role="group" aria-label="Chân board">
          {boardPinMarkers.map(pin => <g key={pin.key} className={`diagram-board-pin ${selectedEndpointId === pin.key ? 'is-selected' : ''}`}>
            <circle className="diagram-board-pin-visible" cx={pin.x} cy={pin.y} r="6" aria-hidden="true" />
            <circle className="diagram-board-pin-hit-target" cx={pin.x} cy={pin.y} r="11" role="button" tabIndex={0} data-diagram-endpoint={pin.key} data-circuit-endpoint={pin.key} aria-label={`${pin.key} · ${pin.label}`} onClick={event => onActivateEndpoint(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onPointerDown={event => onStartEndpointDrag(event, { kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onKeyDown={event => selectByKeyboard(event, () => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId }))} />
            <title>{`${pin.label} · ${pin.key}`}</title>
            {(!presentation||selectedEndpointId===pin.key)&&<text x={pin.x + (pin.side === 'left' ? 11 : -11)} y={pin.y + 4} textAnchor={pin.side === 'left' ? 'start' : 'end'}>{pin.label}</text>}
          </g>)}
        </g>
        <g className="diagram-hole-layer" role="group" aria-label="Các lỗ cắm breadboard">
          {diagram.holes.map(hole => <circle key={hole.id} className={`diagram-hole ${hole.kind === 'rail' ? 'is-rail' : ''} ${selectedEndpointId === hole.id ? 'is-selected' : ''}`} cx={hole.x} cy={hole.y} r={hole.kind === 'rail' ? 3.2 : 3.4} data-diagram-hole={hole.id} />)}
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
          {diagram.parts.map(part => <PartBody key={part.id} part={part} selected={selectedPartId === part.id} lit={litPartIds.has(part.id)} selectedEndpointId={selectedEndpointId} onSelect={() => onSelectPart(part.id)} onChoosePin={choosePin} onActivateEndpoint={onActivateEndpoint} onStartEndpointDrag={onStartEndpointDrag} />)}
        </g>
        <g className="diagram-hole-hit-layer" role="group" aria-label="Điểm chọn lỗ breadboard">
          {diagram.holes.map(hole => <circle key={hole.id} className={`diagram-hole-hit-target ${hole.kind === 'rail' ? 'is-rail' : ''} ${selectedEndpointId === hole.id ? 'is-selected' : ''}`} cx={hole.x} cy={hole.y} r={11} style={occupiedHoleIds.has(hole.id) ? { pointerEvents: 'none' } : undefined} data-occupied={occupiedHoleIds.has(hole.id)} data-diagram-endpoint={hole.id} data-circuit-endpoint={hole.id} role="button" tabIndex={hole.id === focusedHoleId ? 0 : -1} aria-label={`${hole.id} · net ${hole.net ?? 'chưa rõ'}${occupiedHoleIds.has(hole.id) ? ' · đang có chân linh kiện; dùng bàn phím hoặc lưới chi tiết để chọn lỗ' : ''}`} onFocus={() => onFocusHole?.(hole.id)} onClick={event => onActivateEndpoint(event, { kind: 'hole', holeId: hole.id })} onPointerDown={event => onStartEndpointDrag(event, { kind: 'hole', holeId: hole.id })} onKeyDown={event => navigateHoleByKeyboard(event, hole.id, () => rowHole(hole.id))} />)}
        </g>
        {doc.breadboards.length > 0 && <g className="diagram-rail-labels" aria-hidden="true">
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.y! + 4}>+</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.y! + 4}>−</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.y! + 4}>+</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.y! + 4}>−</text>
          <text className="diagram-trench-label" x={diagram.breadboard.x + diagram.breadboard.width / 2} y={diagram.breadboard.y + 276} textAnchor="middle">RÃNH GIỮA · HAI NỬA KHÔNG NỐI</text>
        </g>}
      </svg>
    </div>
    {presentation && <details className="diagram-source-details"><summary>Nguồn hình board</summary><p>{presentation.revision} · Hình chiếu trực giao của model tham chiếu, không phải ảnh chụp hay số đo board thật.</p><a href="/board-reference/topview/NOTICE.md" target="_blank" rel="noreferrer">Nguồn, giấy phép và giới hạn model</a></details>}
    {diagram.diagnostics.map((message, index) => <p key={index} className="breadboard-diagram-diagnostic" role="note">{message}</p>)}
  </section>
}
