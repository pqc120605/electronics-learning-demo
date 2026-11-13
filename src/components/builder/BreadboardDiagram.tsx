import { buildBreadboardDiagram, breadboardDiagramWireColor, type DiagramPart, type DiagramPin } from '../../lib/breadboardDiagram'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import type { KeyboardEvent } from 'react'

type Props = {
  doc: CircuitDocV2
  selectedWireId?: string | null
  selectedEndpointId?: string | null
  activeWireIds?: ReadonlySet<string>
  onChooseEndpoint: (endpoint: CircuitEndpointV2) => void
  onSelectWire: (wireId: string) => void
  onSelectPart: (partId: string) => void
}

function selectByKeyboard(event: KeyboardEvent<SVGElement>, select: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  select()
}

function PartBody({ part, onSelect, onChoosePin }: { part: DiagramPart; onSelect: () => void; onChoosePin: (pin: DiagramPin) => void }) {
  const lastPin = part.pins[part.pins.length - 1]
  const pinSpan = lastPin && part.pins.length > 1 ? Math.hypot(lastPin.x - part.pins[0].x, lastPin.y - part.pins[0].y) : 0
  return <g data-diagram-part={part.id} className={`breadboard-diagram-part breadboard-diagram-part-${part.type}`}>
    <g className="diagram-part-body-control" role="button" tabIndex={0} aria-label={`${part.label}${part.value ? ` ${part.value}` : ''} · ${part.id}`} onClick={onSelect} onKeyDown={event => selectByKeyboard(event, onSelect)} transform={`translate(${part.center.x} ${part.center.y}) rotate(${part.rotation})`}>
    {part.type === 'resistor' ? <g>
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
    {part.pins.map(pin => <circle key={pin.key} className="diagram-part-pin" cx={pin.x} cy={pin.y} r="4.5" data-diagram-endpoint={pin.key} data-circuit-endpoint={pin.key} aria-label={`${part.id} ${pin.label}, ${pin.holeId}`} role="button" tabIndex={0} onClick={() => onChoosePin(pin)} onKeyDown={event => selectByKeyboard(event, () => onChoosePin(pin))} />)}
  </g>
}

export function BreadboardDiagram({ doc, selectedWireId = null, selectedEndpointId = null, activeWireIds = new Set<string>(), onChooseEndpoint, onSelectWire, onSelectPart }: Props) {
  const diagram = buildBreadboardDiagram(doc)
  const choosePin = (pin: DiagramPin) => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId })
  const rowHole = (holeId: string) => onChooseEndpoint({ kind: 'hole', holeId })
  const board = doc.parts.find(part => part.type === 'board')
  const wireTitles = new Map(doc.wires.map(wire => [wire.id, wire]))

  return <section className="breadboard-diagram" aria-label="Mạch lắp thử nhìn từ trên xuống">
    <header className="breadboard-diagram-header"><div><p className="breadboard-editor-eyebrow">MẠCH LẮP · CÙNG CIRCUITDOC V2</p><h3>Breadboard và dây nối</h3></div><p>Lỗ cắm, chân linh kiện và từng dây lấy từ cùng sơ đồ mạch; chọn điểm để nối hoặc xem net.</p></header>
    <p className="breadboard-diagram-assumption" role="note">Lưới minh họa 400 tie-point. Số lỗ và cách nối dải ray là giả định của mô hình, chưa xác minh trên mẫu vật lý.</p>
    <div className="breadboard-diagram-scroll">
      <svg className="breadboard-diagram-svg" viewBox={`0 0 ${diagram.width} ${diagram.height}`} role="group" aria-label="Board ESP32, breadboard, linh kiện và dây jumper">
        <defs>
          <linearGradient id="diagram-board" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1d7769"/><stop offset="1" stopColor="#103e39"/></linearGradient>
          <filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#23353a" floodOpacity=".2"/></filter>
        </defs>
        <rect className="diagram-bench" x="0" y="0" width={diagram.width} height={diagram.height} rx="13" />
        <g className="diagram-board" data-diagram-part={board?.id ?? 'board'}>
          <g className="diagram-board-body-control" role="button" tabIndex={0} aria-label="ESP32 DevKit V1board pin map · minh họa" onClick={() => board && onSelectPart(board.id)} onKeyDown={event => selectByKeyboard(event, () => board && onSelectPart(board.id))}>
            <rect x={diagram.board.x} y={diagram.board.y} width={diagram.board.width} height={diagram.board.height} rx="18" />
            <rect className="diagram-board-module" x={diagram.board.x + 43} y={diagram.board.y + 22} width={126} height={66} rx="9" />
            <path className="diagram-board-antenna" d={`M${diagram.board.x + 70} ${diagram.board.y + 48}h72`} />
            <rect className="diagram-board-usb" x={diagram.board.x - 8} y={diagram.board.y + 72} width="22" height="58" rx="4" />
            <text className="diagram-board-name" x={diagram.board.x + diagram.board.width / 2} y={diagram.board.y + 154} textAnchor="middle">ESP32 DevKit V1</text>
            <text className="diagram-board-note" x={diagram.board.x + diagram.board.width / 2} y={diagram.board.y + 174} textAnchor="middle">board pin map · minh họa</text>
          </g>
          {diagram.boardPins.map(pin => <g key={pin.key} className={`diagram-board-pin ${selectedEndpointId === pin.key ? 'is-selected' : ''}`} role="button" tabIndex={0} data-diagram-endpoint={pin.key} data-circuit-endpoint={pin.key} aria-label={`${pin.key} · ${pin.label}`} onClick={() => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId })} onKeyDown={event => selectByKeyboard(event, () => onChooseEndpoint({ kind: 'pin', partId: pin.partId, pinId: pin.pinId }))}>
            <circle cx={pin.x} cy={pin.y} r="6" /><text x={pin.x - 11} y={pin.y + 4} textAnchor="end">{pin.label}</text>
          </g>)}
        </g>
        <g className="diagram-breadboard" filter="url(#diagram-shadow)">
          <rect x={diagram.breadboard.x} y={diagram.breadboard.y} width={diagram.breadboard.width} height={diagram.breadboard.height} rx="18" />
          <rect className="diagram-breadboard-core" x={diagram.breadboard.x + 12} y={diagram.breadboard.y + 12} width={diagram.breadboard.width - 24} height={diagram.breadboard.height - 24} rx="12" />
        </g>
        <g className="diagram-rail" aria-hidden="true">
          <path className="diagram-rail-positive" d={`M${diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:T+:25')?.x ?? 0}`} />
          <path className="diagram-rail-ground" d={`M${diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:T-:25')?.x ?? 0}`} />
          <path className="diagram-rail-positive" d={`M${diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:B+:25')?.x ?? 0}`} />
          <path className="diagram-rail-ground" d={`M${diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.x ?? 0} ${diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.y ?? 0}H${diagram.holes.find(hole => hole.id === 'bb1:B-:25')?.x ?? 0}`} />
        </g>
        <g className="diagram-wire-routes" aria-label="Dây jumper">
          {diagram.wires.map(wire => <g key={wire.id} className={`diagram-wire ${selectedWireId === wire.id ? 'is-selected' : ''} ${activeWireIds.has(wire.id) ? 'is-active' : ''}`} data-diagram-wire={wire.id} data-wire-role={wire.role} role="button" tabIndex={0} aria-label={`${wire.id}: ${wire.fromKey} nối ${wire.toKey}${wireTitles.get(wire.id)?.role ? ` · ${wireTitles.get(wire.id)?.role}` : ''}`} onClick={() => onSelectWire(wire.id)} onKeyDown={event => selectByKeyboard(event, () => onSelectWire(wire.id))}>
            <path className="diagram-wire-outline" d={wire.path} /><path className="diagram-wire-color" d={wire.path} style={{ stroke: breadboardDiagramWireColor(wire.role) }} />
          </g>)}
        </g>
        <g className="diagram-hole-layer" aria-label="Các lỗ cắm breadboard">
          {diagram.holes.map(hole => <circle key={hole.id} className={`diagram-hole ${hole.kind === 'rail' ? 'is-rail' : ''} ${selectedEndpointId === hole.id ? 'is-selected' : ''}`} cx={hole.x} cy={hole.y} r={hole.kind === 'rail' ? 3.2 : 3.4} data-diagram-hole={hole.id} data-diagram-endpoint={hole.id} data-circuit-endpoint={hole.id} role="button" tabIndex={0} aria-label={`${hole.id} · net ${hole.net ?? 'chưa rõ'}`} onClick={() => rowHole(hole.id)} onKeyDown={event => selectByKeyboard(event, () => rowHole(hole.id))} />)}
        </g>
        <g className="diagram-row-labels" aria-hidden="true">
          {'abcdefghij'.split('').map(row => <text key={row} x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === `bb1:1${row}`)?.y! + 4}>{row.toUpperCase()}</text>)}
          {Array.from({ length: 6 }, (_, index) => index * 5 + 1).map(column => <text key={column} x={diagram.holes.find(hole => hole.id === `bb1:${column}a`)?.x} y={diagram.breadboard.y + 40}>{column}</text>)}
        </g>
        <g className="diagram-mounted-parts">
          {diagram.parts.map(part => <PartBody key={part.id} part={part} onSelect={() => onSelectPart(part.id)} onChoosePin={choosePin} />)}
        </g>
        <g className="diagram-rail-labels" aria-hidden="true">
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:T+:1')?.y! + 4}>+</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:T-:1')?.y! + 4}>−</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:B+:1')?.y! + 4}>+</text>
          <text x={diagram.breadboard.x + 28} y={diagram.holes.find(hole => hole.id === 'bb1:B-:1')?.y! + 4}>−</text>
          <text className="diagram-trench-label" x={diagram.breadboard.x + diagram.breadboard.width / 2} y={diagram.breadboard.y + 276} textAnchor="middle">RÃNH GIỮA · HAI NỬA KHÔNG NỐI</text>
        </g>
      </svg>
    </div>
    {diagram.diagnostics.map((message, index) => <p key={index} className="breadboard-diagram-diagnostic" role="note">{message}</p>)}
  </section>
}
