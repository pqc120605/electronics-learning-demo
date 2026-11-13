import { useMemo, type KeyboardEvent } from 'react'
import { layoutSchematicV2, type SchematicPartV2 } from '../../lib/schematicLayoutV2'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import './CircuitSchematicV2.css'

type Props = { doc: CircuitDocV2; selectedKey?: string | null; selectedWireId?: string | null; activeKeys?: ReadonlySet<string>; onSelectPart?: (partId: string) => void; onSelectWire?: (wireId: string) => void; onSelectNet?: (netKey: string) => void; onExportTarget?: (element: HTMLDivElement | null) => void }

function keyboardSelect(event: KeyboardEvent<SVGElement>, select: () => void) {
  // A lesson wrapper may already have activated the target in its capture handler.
  if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    if (!event.repeat) select()
  }
}

function Symbol({ part }: { part: SchematicPartV2 }) {
  const { symbolKind: kind, partId, label, value, height } = part
  return <g className={`circuit-symbol circuit-symbol-${kind}`} data-part-id={partId}>
    {kind === 'resistor' ? <><path d="M-56 0h22l7-12 14 24 14-24 14 24 7-12h34"/><text x="0" y="-30">{partId}</text>{value && <text x="0" y="42">{value}</text>}</>
      : kind === 'led' || kind === 'diode' ? <><path d="M-56 0h35m0-19 33 19-33 19zM12-19v38M12 0h44"/>{kind === 'led' && <path className="schematic-led-emission" d="M0-28l14-14m-7 0h7v7M18-22l14-14m-7 0h7v7"/>}<text x="0" y="-54">{partId}</text><text x="0" y="42">{label}</text></>
      : kind === 'button' ? <g data-symbol-state="open"><path d="M-56 0h37m0 0 27-23M12 0h44M-8-30v-10m-12 0H4"/><circle cx="-19" cy="0" r="3"/><circle cx="12" cy="0" r="3"/><text x="0" y="-56">{partId}</text><text x="0" y="42">{label} · thường mở</text></g>
      : kind === 'board' ? <><rect x="-75" y={-height / 2} width="140" height={height} rx="4"/><text x="-5" y={-height / 2 + 24}>{partId}</text><text x="-5" y={height / 2 - 28}>Chân đang nối</text><text x="-5" y={height / 2 - 12}>Alias theo bài học</text></>
      : <><rect x="-48" y="-28" width="96" height="56" rx="4"/><text x="0" y="-8">{partId}</text><text x="0" y="12">{label}</text><text x="0" y="48">chưa có symbol</text></>}
  </g>
}

export function CircuitSchematicV2({ doc, selectedKey = null, selectedWireId = null, activeKeys = new Set(), onSelectPart = () => {}, onSelectWire = () => {}, onSelectNet = () => {}, onExportTarget }: Props) {
  const layout = useMemo(() => layoutSchematicV2(doc), [doc])
  const selectNet = (key: string, wireIds: string[]) => {
    if (wireIds[0]) onSelectWire(wireIds[0])
    onSelectNet(key)
  }
  const netClass = (wireIds: string[], endpoints: string[], bridges = false) => {
    const prefix = bridges ? 'bridge' : 'net'
    return `${bridges ? 'circuit-net-bridges' : 'circuit-net-line'} ${wireIds.includes(selectedWireId ?? '') ? `${prefix}-selected` : ''} ${endpoints.some(key => activeKeys.has(key)) ? `${prefix}-active` : ''}`
  }
  return <div ref={element => onExportTarget?.(element)}><section className="circuit-schematic-v2" aria-label="Sơ đồ nguyên lý theo kết nối CircuitDocV2">
    <header><div><strong>Sơ đồ nguyên lý</strong><small>Các đường biểu diễn net khai báo · không phải kết quả ERC hay mô phỏng điện</small></div><span>● nhánh nối · cầu vượt: không nối · nguồn/GND theo vai trò dây</span></header>
    <div className="circuit-schematic-scroll" tabIndex={0} role="region" aria-label="Vùng sơ đồ có thể cuộn ngang"><svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="Sơ đồ nguyên lý của mạch" className="circuit-schematic-svg">
      <defs><pattern id="schematic-minor-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="#d8d2c6"/></pattern><pattern id="schematic-major-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#d8d2c6" strokeWidth="1"/></pattern></defs>
      <rect className="schematic-sheet" x="2" y="2" width={layout.width - 4} height={layout.height - 4} rx="3"/><rect className="schematic-sheet-dots" x="10" y="10" width={layout.width - 20} height={layout.height - 20}/><rect className="schematic-sheet-grid" x="10" y="10" width={layout.width - 20} height={layout.height - 20}/><rect className="schematic-sheet-frame" x="18" y="18" width={layout.width - 36} height={layout.height - 36}/>
      {layout.nets.map((net, netIndex) => <g key={net.key} className={netClass(net.wireIds, net.endpoints)} data-net-key={net.key}>
        {net.segments.map((segment, i) => <path key={`${net.key}-s${i}`} d={`M${segment.from[0]} ${segment.from[1]}L${segment.to[0]} ${segment.to[1]}`} onClick={() => selectNet(net.key, net.wireIds)} onKeyDown={event => keyboardSelect(event, () => selectNet(net.key, net.wireIds))} role="button" tabIndex={i === 0 ? 0 : -1} aria-label={`Chọn net ${net.key}`} />)}
        {net.junctions.map(([x, y], i) => <circle key={i} className="schematic-junction" cx={x} cy={y} r="4" />)}
        {net.segments[0] && <text className="schematic-net-reference" x={net.segments[0].to[0] + 5} y={net.segments[0].to[1] + 18}>N{netIndex + 1}</text>}
        {net.marker && <g className="schematic-role-marker" data-role={net.role} transform={`translate(${net.marker[0]} ${net.marker[1]})`}>
          {net.role === 'ground' ? <><path d="M0 0v18m-12 0h24m-9 6H9m-5 6H4"/><text x="-18" y="28" textAnchor="end">GND</text></> : <><path d="M0 0v-18m-9 9 9-9 9 9"/><text x="14" y="-14">Nguồn</text></>}
        </g>}
      </g>)}
      {layout.nets.map(net => <g key={`bridges-${net.key}`} data-net-key={net.key} className={netClass(net.wireIds, net.endpoints, true)} aria-hidden="true">
        {net.crossings.map(([x, y], i) => <g className="schematic-crossing" key={i}><path className="schematic-crossing-gap" d={`M${x - 7} ${y}h14`}/><path className="schematic-crossing-bridge" d={`M${x - 7} ${y}q7 -13 14 0`}/></g>)}
      </g>)}
      {layout.parts.map(part => <g key={part.partId} transform={`translate(${part.x} ${part.y})`} onClick={() => onSelectPart(part.partId)} onKeyDown={event => keyboardSelect(event, () => onSelectPart(part.partId))} className={`schematic-part-v2 ${selectedKey === part.partId ? 'part-selected' : ''}`} role="button" tabIndex={0} aria-label={`Chọn ${part.label} ${part.partId}`}>
        <title>{`${part.partId} · ${part.label}${part.value ? ` · ${part.value}` : ''}`}</title>
        <Symbol part={part}/>
        {part.terminals.map(terminal => <g key={terminal.key} className="schematic-terminal" data-pin-key={terminal.key}>
          {part.symbolKind === 'board' && <path d={`M65 ${terminal.y - part.y}h10`}/>}
          <circle cx={terminal.x - part.x} cy={terminal.y - part.y} r="3"/>
          <text x={part.symbolKind === 'board' ? 56 : terminal.x - part.x} y={terminal.y - part.y - 10} textAnchor={part.symbolKind === 'board' ? 'end' : terminal.x < part.x ? 'end' : 'start'}>{terminal.label}</text>
        </g>)}
      </g>)}
      <g className="schematic-title-block" aria-label="Thông tin bản vẽ">
        <rect x={layout.width - 310} y={layout.height - 112} width="282" height="82"/>
        <path d={`M${layout.width - 310} ${layout.height - 77}h282M${layout.width - 205} ${layout.height - 77}v47M${layout.width - 112} ${layout.height - 77}v47`}/>
        <text x={layout.width - 299} y={layout.height - 91}>MẠCH MỞ · SƠ ĐỒ NGUYÊN LÝ</text>
        <text x={layout.width - 299} y={layout.height - 57}>{doc.lessonId.toLocaleUpperCase('vi-VN')} · CIRCUITDOC V2</text>
        <text x={layout.width - 194} y={layout.height - 54}>TỜ 1/1</text><text x={layout.width - 101} y={layout.height - 54}>ERC: CHƯA CHẠY</text>
      </g>
    </svg></div>
    <details className="circuit-schematic-net-list"><summary>{layout.nets.length} net · danh sách đầu nối và điểm breadboard</summary><p>Nhãn lỗ dưới đây thuộc cùng net; vị trí trên sơ đồ không phải tọa độ cắm.</p><ol>{layout.nets.map((net, i) => <li key={net.key} data-net-key={net.key}><button type="button" onClick={() => selectNet(net.key, net.wireIds)}><strong>Net {i + 1} · {net.key}</strong><span>{net.endpoints.join(' · ') || 'Không có chân linh kiện'}</span><small>{net.wireIds.length} dây{net.role ? ` · ${net.role}` : ''}</small></button><div className="schematic-net-holes">{net.holes.map(hole => <span key={hole} data-hole-id={hole}>{hole}</span>)}</div></li>)}</ol></details>
    {layout.diagnostics.map((item, i) => <p className="schematic-diagnostic" key={`${item.code}-${i}`} role="note">{item.message}</p>)}
  </section></div>
}
