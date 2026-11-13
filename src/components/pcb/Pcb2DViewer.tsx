import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { PcbBoardManifest, PcbComponent, PcbCopperFeature, PcbPad } from '../../types/pcb'
import { fitPcbViewBox, formatPcbViewBox } from '../../lib/pcbViewBox'
import './pcb-viewer.css'

type Props = {
  boardId: string
  lessonId?: string
  codePin?: number
  signalActive?: boolean
  signalRunning?: boolean
}

const boardManifests: Record<string, { url: string; title: string }> = {
  'arduino-uno-r3': { url: '/boards/arduino-uno-r3-rev3/manifest.json', title: 'Arduino Uno R3' },
  'arduino-nano-classic': { url: '/boards/arduino-nano-classic/manifest.json', title: 'Arduino Nano classic' },
  'arduino-mega-2560-r3': { url: '/boards/arduino-mega-2560-r3/manifest.json', title: 'Arduino Mega 2560 R3' },
  'esp32-devkit': { url: '/boards/esp32-devkit-v1-30pin/manifest.json', title: 'ESP32 DevKit V1 · clone 30 chân' },
}

function padColor(layer: string) { return layer === 'F.Cu' ? '#e3ac62' : '#b97940' }

type Point = { x: number; y: number }
type OutlineEdge = { command: 'L' | 'A'; from: Point; to: Point; args: number[] }
type OutlineFragment = { start: Point; end: Point; edges: OutlineEdge[]; closed: boolean; source: string }

function parseOutlineFragment(source: string): OutlineFragment | null {
  const tokens = source.match(/[MLAZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)
  if (!tokens?.length || tokens[0].toUpperCase() !== 'M') return null
  let index = 1
  const start = { x: Number(tokens[index++]), y: Number(tokens[index++]) }
  let current = start
  const edges: OutlineEdge[] = []
  let closed = false
  while (index < tokens.length) {
    const command = tokens[index++].toUpperCase()
    if (command === 'Z') {
      closed = true
      current = start
      continue
    }
    if (command !== 'A' && command !== 'L') return null
    const count = command === 'A' ? 7 : 2
    if (!count || index + count > tokens.length) return null
    const args = tokens.slice(index, index + count).map(Number)
    index += count
    const to = command === 'A' ? { x: args[5], y: args[6] } : { x: args[0], y: args[1] }
    edges.push({ command, from: current, to, args })
    current = to
  }
  return { start, end: current, edges, closed, source }
}

function reverseOutlineFragment(fragment: OutlineFragment): string {
  const commands = [`M ${fragment.end.x} ${fragment.end.y}`]
  for (const edge of [...fragment.edges].reverse()) {
    if (edge.command === 'L') commands.push(`L ${edge.from.x} ${edge.from.y}`)
    else {
      const [rx, ry, rotation, largeArc, sweep] = edge.args
      commands.push(`A ${rx} ${ry} ${rotation} ${largeArc} ${1 - sweep} ${edge.from.x} ${edge.from.y}`)
    }
  }
  return commands.join(' ')
}

function joinBoardOutline(paths: string[]): string | null {
  if (!paths.length) return null
  const fragments = paths.map(parseOutlineFragment)
  if (fragments.some(fragment => !fragment)) return null
  const parsed = fragments as OutlineFragment[]
  if (parsed.every(fragment => fragment.closed)) return paths.join(' ')
  if (parsed.some(fragment => fragment.closed)) return null

  const toleranceMm = 0.02
  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
  const remaining = parsed.slice(1)
  const chain = [parsed[0]]
  let current = parsed[0].end
  while (remaining.length) {
    const candidates = remaining.flatMap((fragment, index) => [
      { fragment, index, reversed: false, gap: distance(current, fragment.start) },
      { fragment, index, reversed: true, gap: distance(current, fragment.end) },
    ]).filter(candidate => candidate.gap <= toleranceMm).sort((a, b) => a.gap - b.gap || a.index - b.index)
    const next = candidates[0]
    if (!next) return null
    const fragment = remaining.splice(next.index, 1)[0]
    if (next.reversed) {
      const reversed = parseOutlineFragment(reverseOutlineFragment(fragment))
      if (!reversed) return null
      chain.push(reversed)
      current = reversed.end
    } else {
      chain.push(fragment)
      current = fragment.end
    }
  }
  if (distance(current, chain[0].start) > toleranceMm) return null
  const connectedCommands = chain.map((fragment, index) => {
    if (index === 0) return fragment.source
    return fragment.source.replace(/^M\s*[-+\d.eE]+\s+[-+\d.eE]+\s*/i, '')
  })
  return `${connectedCommands.join(' ')} Z`
}

const unoComponentGuide: Record<string, { title: string; role: string; placement: string }> = {
  ZU4: { title: 'Vi điều khiển ATmega328P', role: 'Chạy chương trình Arduino và điều khiển các chân I/O. Trong CAD, các chân của chip nối tới header, reset, dao động và các khối nguồn.', placement: 'Package DIP-28 nằm ở vùng trung tâm để hai hàng chân có thể nối tới các cụm tín hiệu hai bên; mô tả vị trí này là suy luận từ footprint và routing.' },
  U3: { title: 'USB–serial ATmega16U2', role: 'Đảm nhiệm giao tiếp USB và chuyển dữ liệu nối tiếp giữa máy tính với ATmega328P.', placement: 'Nằm gần đầu USB và đường UART để giữ đoạn kết nối USB/serial ngắn; đây là suy luận từ sơ đồ và layout CAD.' },
  U1: { title: 'Bộ ổn áp 5 V', role: 'NCP1117ST50T3G được dùng trong nhánh nguồn 5 V theo BOM/CAD.', placement: 'Đặt trong cụm nguồn để kết nối với đường cấp nguồn và tụ lọc lân cận; chi tiết bố trí là suy luận từ layout.' },
  U2: { title: 'Bộ ổn áp 3,3 V', role: 'LP2985-33DBVR tạo đường nguồn 3,3 V theo BOM/CAD.', placement: 'Đặt cùng cụm nguồn để đường cấp 3,3 V và phần tử lọc gần nhau; đây là suy luận từ layout.' },
  Y1: { title: 'Thạch anh 16 MHz', role: 'Cung cấp xung clock ngoài cho ATmega328P.', placement: 'Được đặt gần MCU để đường clock ngắn và ít nhiễu hơn; chức năng được xác định theo trị số và net XT1/XT2 trong CAD.' },
  F1: { title: 'Cầu chì tự phục hồi 500 mA', role: 'Giới hạn dòng khi có sự cố ở nhánh USB theo thiết kế tham chiếu.', placement: 'Nằm trên đường vào nguồn USB; net USBVCC/XUSB trong CAD cho thấy nó mắc nối tiếp trên nhánh này.' },
  D1: { title: 'Diode bảo vệ nguồn M7', role: 'Nằm trên nhánh PWRIN → VIN theo các net của CAD.', placement: 'Đặt trên đường nguồn vào để phần tử bảo vệ nằm nối tiếp với nhánh cấp nguồn; kiểm tra đúng cực tính trên schematic trước khi áp dụng cho board khác.' },
  L0: { title: 'LED trạng thái L0', role: 'LED màu vàng trên board; CAD gán nó vào net N$1.', placement: 'Đặt gần vùng nhãn/biên board để dễ quan sát. CAD nguồn hiện không xác nhận N$1 được điều khiển bởi D13/SCK, nên không liên kết nó với bài blink.' },
  RX0: { title: 'LED báo RX', role: 'Đèn báo hoạt động nhận dữ liệu nối tiếp.', placement: 'Đặt trong cụm USB–serial để người dùng dễ quan sát trạng thái giao tiếp; chức năng dựa trên nhãn RX0 và net CAD.' },
  TX0: { title: 'LED báo TX', role: 'Đèn báo hoạt động truyền dữ liệu nối tiếp.', placement: 'Đặt trong cụm USB–serial để người dùng dễ quan sát trạng thái giao tiếp; chức năng dựa trên nhãn TX0 và net CAD.' },
  ICSP0: { title: 'Header ICSP', role: 'Đưa các tín hiệu SPI, reset, nguồn và ground ra đầu nối nạp/lập trình.', placement: 'Gom các chân giao tiếp tại một cụm đầu nối; vai trò các pad được đọc trực tiếp từ net name trong CAD.' },
}

export function Pcb2DViewer({ boardId, lessonId, codePin, signalActive = false, signalRunning = false }: Props) {
  const [manifest, setManifest] = useState<PcbBoardManifest | null>(null)
  const [loadError, setLoadError] = useState('')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [showZones, setShowZones] = useState(true)
  const [showReferences, setShowReferences] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<PcbComponent | null>(null)
  const [selectedPad, setSelectedPad] = useState<PcbPad | null>(null)
  const [selectedNetId, setSelectedNetId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const panRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    const boardManifest = boardManifests[boardId]
    setManifest(null)
    setLoadError('')
    setSelectedComponent(null)
    setSelectedPad(null)
    setSelectedNetId(null)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    if (!boardManifest) return
    const controller = new AbortController()
    fetch(boardManifest.url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`Không tải được dữ liệu PCB (${response.status}).`)
        return response.json() as Promise<PcbBoardManifest>
      })
      .then(data => {
        if (data.schemaVersion !== 1 || data.boardId !== boardId || !data.bounds?.width || !Array.isArray(data.copperFeatures)) {
          throw new Error('Manifest PCB không đúng định dạng hoặc không khớp board.')
        }
        setManifest(data)
        setLoadError('')
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Không thể đọc dữ liệu PCB.')
      })
    return () => controller.abort()
  }, [boardId])

  const activeMapping = manifest?.verifiedMappings.find(mapping => mapping.lessonId === lessonId && mapping.codePin === codePin)
  const activeNet = activeMapping?.netId ?? null
  const visibleNets = useMemo(() => manifest?.nets.filter(net => net.id !== '0') ?? [], [manifest])
  const selectedNet = visibleNets.find(net => net.id === selectedNetId)
  const focusedNetId = signalActive && activeMapping ? activeNet : selectedNetId
  const fittedView = manifest ? fitPcbViewBox(manifest.bounds, zoom, offset) : { x: 0, y: 0, width: 70, height: 55 }
  const viewBox = formatPcbViewBox(fittedView)

  function chooseComponent(component: PcbComponent, pad?: PcbPad) {
    setSelectedComponent(component)
    setSelectedPad(pad ?? null)
    if (pad?.netId) setSelectedNetId(pad.netId)
  }

  function chooseFeature(feature: PcbCopperFeature) {
    if (feature.netId) setSelectedNetId(feature.netId)
    setSelectedComponent(null)
    setSelectedPad(null)
  }

  function changeZoom(delta: number) {
    setZoom(value => Math.max(0.65, Math.min(5, Number((value + delta).toFixed(2)))))
  }

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    changeZoom(event.deltaY < 0 ? 0.12 : -0.12)
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest('.pcb-hit')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId || !manifest) return
    const rect = event.currentTarget.getBoundingClientRect()
    const scaleX = fittedView.width / rect.width
    const scaleY = fittedView.height / rect.height
    setOffset({ x: pan.offsetX - (event.clientX - pan.x) * scaleX, y: pan.offsetY - (event.clientY - pan.y) * scaleY })
  }

  function endPan(event: PointerEvent<SVGSVGElement>) {
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
  }

  function renderPad(component: PcbComponent, pad: PcbPad, index: number) {
    if (!(pad.layers ?? [pad.layer]).includes(side === 'front' ? 'F.Cu' : 'B.Cu')) return null
    const focused = Boolean(focusedNetId && pad.netId === focusedNetId)
    const selected = selectedPad === pad
    const key = `${component.reference}-${pad.number}-${index}`
    const common = {
      className: `pcb-hit pcb-pad ${focused ? 'is-net-active' : ''} ${selected ? 'is-selected' : ''}`,
      onClick: (event: React.MouseEvent) => { event.stopPropagation(); chooseComponent(component, pad) },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseComponent(component, pad) }
      },
      tabIndex: 0,
      role: 'button' as const,
      'aria-label': `${component.reference}, pad ${pad.number}, ${pad.netName}`,
      transform: `rotate(${pad.rotation} ${pad.x} ${pad.y})`,
      fill: padColor(side === 'front' ? 'F.Cu' : 'B.Cu'),
      stroke: '#f5d4a1',
      strokeWidth: selected ? 0.3 : 0.12,
    }
    if (pad.shape === 'circle') return <ellipse key={key} {...common} cx={pad.x} cy={pad.y} rx={pad.width / 2} ry={pad.height / 2} />
    if (pad.shape === 'oval') return <rect key={key} {...common} x={pad.x - pad.width / 2} y={pad.y - pad.height / 2} width={pad.width} height={pad.height} rx={Math.min(pad.width, pad.height) / 2} />
    return <rect key={key} {...common} x={pad.x - pad.width / 2} y={pad.y - pad.height / 2} width={pad.width} height={pad.height} rx={pad.shape.includes('round') ? Math.min(pad.width, pad.height) * 0.16 : 0} />
  }

  function renderFeature(feature: PcbCopperFeature) {
    if (feature.kind === 'zone' && !showZones) return null
    if (feature.layerId !== 'both' && feature.layerId !== (side === 'front' ? 'F.Cu' : 'B.Cu')) return null
    const active = Boolean(focusedNetId && feature.netId === focusedNetId)
    const onClick = () => chooseFeature(feature)
    const shared = {
      className: `pcb-hit pcb-feature pcb-${feature.kind} ${active ? 'is-net-active' : ''} ${selectedNetId === feature.netId ? 'is-net-selected' : ''}`,
      onClick,
      tabIndex: feature.netId ? 0 : -1,
      role: feature.netId ? 'button' as const : undefined,
      'aria-label': feature.netId ? `${feature.kind === 'track' ? 'Đường đồng' : feature.kind === 'via' ? 'Via' : 'Vùng đồng'} · ${feature.netName}` : undefined,
      onKeyDown: (event: React.KeyboardEvent) => { if (feature.netId && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); chooseFeature(feature) } },
    }
    if (feature.kind === 'track') return <line key={feature.id} {...shared} x1={feature.x1} y1={feature.y1} x2={feature.x2} y2={feature.y2} strokeWidth={feature.width} />
    if (feature.kind === 'via') return <g key={feature.id} {...shared}><circle cx={feature.x} cy={feature.y} r={(feature.diameter ?? 1) / 2} /><circle className="pcb-via-drill" cx={feature.x} cy={feature.y} r={(feature.drill ?? 0.5) / 2} /></g>
    const d = (feature.contours ?? []).map(points => points.length ? `M ${points.map(point => `${point[0]} ${point[1]}`).join(' L ')} Z` : '').join(' ')
    return d ? <path key={feature.id} {...shared} d={d} fillRule="evenodd" /> : null
  }

  const componentInfo = selectedComponent
  const padInfo = selectedPad
  const netInfo = selectedNet
  const componentGuide = componentInfo ? unoComponentGuide[componentInfo.reference] : undefined
  const boardOutlinePath = useMemo(() => joinBoardOutline(manifest?.outline ?? []), [manifest?.outline])

  return <section className="pcb2d-panel" aria-label="Khám phá lớp đồng PCB 2D">
    <header className="pcb2d-heading"><div><p className="eyebrow">PCB 2D · DỮ LIỆU CAD NGUỒN</p><h3>{boardManifests[boardId]?.title ?? 'Chưa có lớp đồng cho board này'}{manifest ? ` · ${manifest.revision}` : ''}</h3></div>
      {manifest && <span className="pcb2d-source-badge">Nguồn: KiCad · {manifest.components.length} linh kiện · {manifest.copperFeatures.length} đối tượng đồng</span>}
    </header>
    {!boardManifests[boardId] ? <div className="pcb2d-empty"><strong>Board này chưa có PCB 2D được xác minh</strong><p>Chọn một board có CAD nguồn được tích hợp để xem lớp đồng. Board đang chọn vẫn dùng được ở chế độ lắp thử và mô phỏng logic.</p></div>
      : loadError ? <div className="pcb2d-empty" role="alert"><strong>Không tải được mô hình PCB</strong><p>{loadError}</p></div>
      : !manifest ? <div className="pcb2d-empty" aria-live="polite">Đang tải hình học PCB và dữ liệu net từ CAD…</div>
      : <>
        <div className="pcb2d-toolbar" aria-label="Điều khiển lớp PCB">
          <div className="pcb2d-segmented" role="group" aria-label="Chọn mặt PCB">
            <button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Mặt trên · F.Cu</button>
            <button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Mặt dưới · B.Cu</button>
          </div>
          <label className="pcb2d-select-label">Tìm net
            <select aria-label="Tìm net trên PCB" value={selectedNetId ?? ''} onChange={event => setSelectedNetId(event.target.value || null)}>
              <option value="">Chọn một net…</option>{visibleNets.map(net => <option key={net.id} value={net.id}>{net.name} · {net.id}</option>)}
            </select>
          </label>
          <label className="pcb2d-toggle"><input type="checkbox" checked={showZones} onChange={event => setShowZones(event.target.checked)} /> Vùng đồng</label>
          <label className="pcb2d-toggle"><input type="checkbox" checked={showReferences} onChange={event => setShowReferences(event.target.checked)} /> Mã linh kiện</label>
          <div className="pcb2d-zoom" role="group" aria-label="Thu phóng PCB">
            <button type="button" aria-label="Thu nhỏ" onClick={() => changeZoom(-0.2)}>−</button><button type="button" aria-label="Phóng to" onClick={() => changeZoom(0.2)}>+</button>
            <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}>Vừa board</button>
          </div>
        </div>
        <div className="pcb2d-content">
          <div className="pcb2d-canvas-wrap">
            <svg className="pcb2d-svg" viewBox={viewBox} style={{ aspectRatio: `${fittedView.width} / ${fittedView.height}` }} role="img" aria-label={`Bản vẽ PCB ${boardId}, mặt ${side === 'front' ? 'trên' : 'dưới'}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endPan} onPointerCancel={endPan}>
              {boardOutlinePath && <path className="pcb-board-surface" d={boardOutlinePath} />}
              <g aria-label={`Đồng mặt ${side === 'front' ? 'trên' : 'dưới'}`}>{manifest.copperFeatures.map(renderFeature)}</g>
              <g aria-label="Pad linh kiện">{manifest.components.map(component => component.pads.map((pad, index) => renderPad(component, pad, index)))}</g>
              {manifest.components.filter(component => component.side === side).map(component => <g key={`ref-${component.reference}`} className={`pcb-reference pcb-hit ${selectedComponent === component ? 'is-selected' : ''}`} role="button" tabIndex={showReferences ? 0 : -1} aria-label={`${component.reference}, ${component.value}`} onClick={() => chooseComponent(component)} onKeyDown={event => { if (showReferences && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); chooseComponent(component) } }}>
                <circle cx={component.x} cy={component.y} r="0.9" />{showReferences && <text x={component.x + 1} y={component.y - 0.8}>{component.reference}</text>}
              </g>)}
            </svg>
            <div className="pcb2d-canvas-caption"><span>{side === 'front' ? 'F.Cu · mặt trên' : 'B.Cu · mặt dưới'} · kéo nền để di chuyển · cuộn để zoom</span><span>SHA-256 · {manifest.sourceHash.slice(0, 12)}…</span></div>
          </div>
          <section className="pcb2d-inspector" aria-live="polite">
            <p className="eyebrow">{signalActive ? 'LUỒNG BÀI HỌC' : 'KHÁM PHÁ LINH KIỆN'}</p>
            {signalActive && activeMapping ? <div className="pcb2d-signal"><b>{signalRunning ? 'Đang chạy bước mô phỏng' : 'Đang giữ net của bước gần nhất'}</b><span>{activeMapping.pinLabel} → net {manifest.nets.find(net => net.id === activeMapping.netId)?.name ?? activeMapping.netId}</span><small>{activeMapping.description} Highlight này không mô phỏng chiều dòng điện hay điện áp.</small></div> : null}
            {signalActive && !activeMapping ? <div className="pcb2d-unmapped"><b>Chưa có mapping PCB đã xác minh</b><span>Bài hoặc chân code hiện tại chưa có mapping với CAD của board này; chỉ luồng logic ở chế độ lắp thử được mô phỏng.</span></div> : null}
            {padInfo && componentInfo ? <><h4>{componentInfo.reference} · pad {padInfo.number}</h4><p>{componentInfo.value} · {componentInfo.footprint}</p><dl><dt>Net trong CAD</dt><dd>{padInfo.netName}</dd><dt>Vị trí</dt><dd>{padInfo.x.toFixed(2)}, {padInfo.y.toFixed(2)} mm</dd><dt>Lớp</dt><dd>{padInfo.layer}</dd></dl></>
              : componentInfo ? <><h4>{componentInfo.reference} · {componentInfo.value}</h4><p>{componentInfo.footprint}</p>{componentGuide && <div className="pcb2d-component-guide"><strong>{componentGuide.title}</strong><p>{componentGuide.role}</p><small><b>Vì đặt ở đây:</b> {componentGuide.placement}</small><small>Vai trò đối chiếu theo tên linh kiện/net CAD; lý do bố trí là giải thích thiết kế khái quát, không phải ghi chú của nhà thiết kế.</small></div>}<dl><dt>Pad theo CAD</dt><dd>{componentInfo.pads.length}</dd><dt>Vị trí tâm</dt><dd>{componentInfo.x.toFixed(2)}, {componentInfo.y.toFixed(2)} mm</dd><dt>Mặt</dt><dd>{componentInfo.side === 'front' ? 'Trên' : 'Dưới'}</dd></dl></>
              : netInfo ? <><h4>Net · {netInfo.name}</h4><p>Mã net {netInfo.id} trong board CAD này.</p><dl><dt>Đối tượng đồng</dt><dd>{manifest.copperFeatures.filter(feature => feature.netId === netInfo.id && (feature.layerId === 'both' || feature.layerId === (side === 'front' ? 'F.Cu' : 'B.Cu'))).length}</dd><dt>Nhãn</dt><dd>{netInfo.kind}</dd></dl></>
                : <><h4>Chọn linh kiện, pad hoặc đường đồng</h4><p>Dữ liệu được trích trực tiếp từ board KiCad; vị trí và net được giữ theo cùng revision nguồn.</p><dl><dt>Board</dt><dd>{manifest.revision}</dd><dt>Nguồn</dt><dd>{manifest.sourceFiles[0]}</dd><dt>Giấy phép</dt><dd>{manifest.license}</dd></dl></>}
            <div className="pcb2d-note"><strong>Giới hạn hiển thị</strong><p>Đây là PCB tham chiếu. Đường đồng được làm nổi theo net của CAD board; topology dây trong workspace không tự động biến thành copper PCB. Highlight không phải kết quả mô phỏng điện hoặc firmware.</p></div>
          </section>
        </div>
        <footer className="pcb2d-footer"><span>{manifest.attribution}</span><ul>{manifest.checkedOmissions.map(item => <li key={item}>{item}</li>)}</ul></footer>
      </>}
  </section>
}
