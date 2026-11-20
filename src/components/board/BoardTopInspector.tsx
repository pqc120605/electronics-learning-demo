import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { projectTopViewPoint, type BoardTopView } from '../../lib/boardTopView'
import type { BoardComponents, BoardPad } from '../../types/boardComponents'
import type { BoardPin } from './boardSceneTypes'
import { requestGuideOpen } from '../guide/GuideContext'
import './BoardTopInspector.css'

const datasets = import.meta.glob<{ default: BoardComponents }>('../../data/board-components/*.json')
const settingsKey = 'mach-mo:board-top-layers:v1'
const defaultLayers = { parts: true, pins: true, labels: false, back: false }
const layers = [
  ['parts', 'Linh kiện'], ['pins', 'Chân'], ['labels', 'Nhãn chân'], ['back', 'Mặt sau'],
] as const
const electricalNames: Record<BoardPad['electricalType'],string> = {
  input:'Đầu vào', output:'Đầu ra', bidirectional:'Hai chiều', tri_state:'Ba trạng thái', passive:'Thụ động',
  power_in:'Vào nguồn', power_out:'Ra nguồn', open_collector:'Collector hở', open_emitter:'Emitter hở', no_connect:'Không nối', unspecified:'Chưa xác định',
}

const padName = (pin: BoardPin) => pin.headerReference && pin.padNumber
  ? `${pin.label}, ${pin.headerReference} chân ${pin.padNumber}`
  : pin.label

function readLayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) ?? '{}')
    return {
      parts: typeof saved.parts === 'boolean' ? saved.parts : defaultLayers.parts,
      pins: typeof saved.pins === 'boolean' ? saved.pins : defaultLayers.pins,
      labels: typeof saved.labels === 'boolean' ? saved.labels : defaultLayers.labels,
      back: typeof saved.back === 'boolean' ? saved.back : defaultLayers.back,
    }
  } catch { return defaultLayers }
}

type Props = {
  top: BoardTopView
  pins: BoardPin[]
  selectedPinId: string
  featureRef?: string
  onSelectPin: (pinId: string) => void
  onSelectComponent: (ref: string) => void
}

export default function BoardTopInspector({ top, pins, selectedPinId, featureRef, onSelectPin, onSelectComponent }: Props) {
  const [boardData, setBoardData] = useState<BoardComponents>()
  const [loading, setLoading] = useState(Boolean(datasets[`../../data/board-components/${top.id}.json`]))
  const [visible, setVisible] = useState(readLayers)
  const [zoom, setZoom] = useState(1)
  const [nearby, setNearby] = useState<BoardPin[]>([])
  const [focusedPin, setFocusedPin] = useState('')
  const [typeFilter, setTypeFilter] = useState<BoardPad['electricalType'] | ''>('')
  const viewport = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = datasets[`../../data/board-components/${top.id}.json`]
    void load?.().then(({ default: data }) => {
      if (!cancelled && data.modelSha256 === top.assetSha256) setBoardData(data)
    }).catch(() => undefined).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [top.id, top.assetSha256])

  const setLayer = (layer: keyof typeof defaultLayers) => {
    const next = { ...visible, [layer]: !visible[layer] }
    setVisible(next)
    setNearby([])
    try { localStorage.setItem(settingsKey, JSON.stringify(next)) } catch { /* Settings are optional. */ }
  }
  const bounds = { x: 0, y: 0, width: top.width, height: top.height }
  const project = (point: readonly number[]) => {
    const projected = projectTopViewPoint(top.boundsMm, bounds, point)
    return projected && { x: visible.back ? top.width - projected.x : projected.x, y: projected.y }
  }
  const projectPcb = (x: number, y: number) => boardData
    && project([x + boardData.modelOffsetMm.x, 0, y + boardData.modelOffsetMm.z])
  const padPoints = [...pins].sort((a, b) => a.position - b.position).flatMap(pin => {
    const point = pin.anchor && project(pin.anchor.map(value => value * 1000))
    return point ? [{ pin, ...point }] : []
  })
  const parts = boardData?.components.filter(item => item.side === (visible.back ? 'back' : 'front')) ?? []
  const selected = pins.find(pin => pin.id === selectedPinId)
  const selectedPad = selected && boardData?.components.find(part => part.ref === selected.headerReference)
    ?.pads.find(pad => pad.pinId === selected.id)
  const padFunctions = new Map(pins.map(pin => [pin.id, pin.functions.join(' · ')]))
  const inspected = parts.find(item => item.ref === featureRef)
  const markPin = (id: string) => {
    setFocusedPin(id)
    setNearby([])
    onSelectPin(id)
  }
  const keyPin = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'Escape') { markPin(''); return }
    if (!visible.pins || !padPoints.length) return
    const index = padPoints.findIndex(({ pin }) => pin.id === (focusedPin || selectedPinId))
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      markPin(padPoints[Math.max(0, index)].pin.id)
    }
    const step = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : 0
    if (step) {
      event.preventDefault()
      setFocusedPin(padPoints[(index < 0 ? 0 : (index + step + padPoints.length) % padPoints.length)].pin.id)
    }
  }
  const tapPad = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const candidates = (visible.pins ? padPoints : []).map(({ pin, x, y }) => ({
      pin, distance: Math.hypot(event.clientX - rect.left - x * rect.width / top.width, event.clientY - rect.top - y * rect.height / top.height),
    })).filter(({ distance }) => distance <= 12).sort((a, b) => a.distance - b.distance)
    if (candidates.length === 1 || candidates[0]?.distance <= 4) markPin(candidates[0].pin.id)
    else {
      setNearby(candidates.map(({ pin }) => pin))
      if (!candidates.length && event.target instanceof Element) {
        const ref = event.target.closest('[data-board-part-ref]')?.getAttribute('data-board-part-ref')
        if (ref) { setTypeFilter(''); onSelectComponent(ref) }
      }
    }
  }
  const changeZoom = (next: number) => {
    setZoom(Math.min(4, Math.max(1, next)))
    setNearby([])
  }
  return <section className="top-board" aria-label="Mặt board 2D">
    <div className="top-board-tools">
      <div role="group" aria-label="Lớp hiển thị">{layers.map(([id, label]) =>
        <button type="button" key={id} aria-pressed={visible[id]} onClick={() => setLayer(id)}>{label}</button>
      )}</div>
      <div role="group" aria-label="Thu phóng mặt board">
        <button type="button" aria-label="Thu nhỏ mặt board" disabled={zoom === 1} onClick={() => changeZoom(zoom - 0.5)}>−</button>
        <button type="button" aria-label="Phóng to mặt board" disabled={zoom === 4} onClick={() => changeZoom(zoom + 0.5)}>+</button>
        <button type="button" onClick={() => { changeZoom(1); viewport.current?.scrollTo(0, 0) }}>Vừa khung</button>
      </div>
    </div>
    <div className="top-board-layout">
      <div className="top-board-display">
        <div className="top-board-viewport" ref={viewport}>
          <svg width={top.width} height={top.height} viewBox={`0 0 ${top.width} ${top.height}`}
            style={{ width: `${zoom * 100}%` }} role="img" aria-label="Vị trí pad trên board" tabIndex={0}
            onKeyDown={keyPin} onPointerUp={tapPad}>
            {!visible.back && <image href={top.image} width={top.width} height={top.height} />}
            {visible.parts && parts.map(part => {
              if (!part.bboxMm) return null
              const { x, y, w, h } = part.bboxMm
              const center = projectPcb(x, y)
              const corner = projectPcb(x - w / 2, y - h / 2)
              const firstPad = part.pin1 && projectPcb(part.pin1.xMm, part.pin1.yMm)
              if (!center || !corner) return null
              return <g key={part.ref} data-board-part-ref={part.ref} className={part.ref === featureRef ? 'top-board-part top-board-part-selected' : 'top-board-part'}>
                <title>{part.ref} · {part.value}</title>
                <rect x={center.x - Math.abs(center.x - corner.x)} y={corner.y} width={2 * Math.abs(center.x - corner.x)}
                  height={2 * Math.abs(center.y - corner.y)} />
                {firstPad && <circle cx={firstPad.x} cy={firstPad.y} r={4} />}
                <text x={center.x} y={center.y - 8}>{part.ref}</text>
              </g>
            })}
            {visible.pins && padPoints.map(({ pin, x, y }) => <g key={pin.id} data-board-pad={pin.id} className="top-board-pad" data-active={pin.id === selectedPinId || pin.id === focusedPin}>
              <title>{padName(pin)}</title>
              <circle cx={x} cy={y} r={7} />
              {(visible.labels || pin.id === selectedPinId) && <text x={x} y={y - 13}>{pin.label}</text>}
            </g>)}
          </svg>
        </div>
        <p className="top-board-hint" aria-live="polite">
          {focusedPin ? padName(pins.find(pin => pin.id === focusedPin) ?? pins[0]) : 'Phím mũi tên chọn chân, Enter xác nhận.'}
        </p>
        {nearby.length > 1 && <div className="top-board-nearby" role="group" aria-label="Các chân gần điểm chạm">
          {nearby.map(pin => <button type="button" key={pin.id} onClick={() => markPin(pin.id)}>{padName(pin)}</button>)}
        </div>}
      </div>
      <div className="top-board-inspector" aria-live="polite">
        {selected ? <>
          <h3>{selected.label}</h3>
          <dl><dt>Pad</dt><dd>{selected.headerReference ?? '—'} · {selected.padNumber ?? '—'}</dd>
            <dt>Net CAD</dt><dd>{selectedPad?.net ?? selected.netName ?? 'Chưa gán'}</dd><dt>Chức năng</dt><dd>{selected.technicalRole}</dd>
            <dt>Loại điện</dt><dd>{electricalNames[selectedPad?.electricalType ?? 'unspecified']} ({selectedPad?.electricalType ?? 'unspecified'})</dd>
            {selected.functions.length > 0 && <><dt>Chức năng phụ</dt><dd>{selected.functions.join(' · ')}</dd></>}</dl>
          <button type="button" onClick={() => requestGuideOpen(`Chân ${selected.label} trên ${top.revision} làm gì?`)}>Hỏi Mở về chân này</button>
        </> : inspected ? <>
          <h3>{inspected.ref} · {inspected.value || inspected.footprint}</h3>
          <dl><dt>Reference</dt><dd>{inspected.ref}</dd><dt>Value</dt><dd>{inspected.value || 'Chưa ghi'}</dd><dt>Footprint</dt><dd>{inspected.footprint}</dd><dt>Mặt</dt><dd>{inspected.side === 'front' ? 'Trên' : 'Dưới'}</dd>
            <dt>MPN</dt><dd>{inspected.mpn ?? 'Chưa xác minh'}</dd><dt>Mô tả</dt><dd>{inspected.description || 'Chưa ghi'}</dd>
            <dt>Datasheet</dt><dd>{inspected.datasheetUrl ? <a href={inspected.datasheetUrl} target="_blank" rel="noreferrer">Mở tài liệu hãng</a> : 'Chưa có nguồn cho footprint này'}</dd>
            <dt>Nguồn</dt><dd>{inspected.source.revision} · {inspected.source.license}</dd></dl>
          {inspected.pads.length > 0 && <><label>Loại điện trên bảng pad<select value={typeFilter} onChange={event=>setTypeFilter(event.target.value as BoardPad['electricalType'] | '')}><option value="">Tất cả</option>{[...new Set(inspected.pads.map(pad=>pad.electricalType))].map(type=><option value={type} key={type}>{electricalNames[type]} ({type})</option>)}</select></label><div className="top-board-pad-table"><table>
            <caption>Pad và net CAD</caption>
            <thead><tr><th scope="col">Pad</th><th scope="col">Tên</th><th scope="col">Loại điện</th><th scope="col">Net</th><th scope="col">Chức năng phụ</th></tr></thead>
            <tbody>{inspected.pads.filter(pad=>!typeFilter||pad.electricalType===typeFilter).map((pad, index) => <tr key={`${pad.padNumber}:${index}`}>
              <th scope="row">{pad.pinId ? <button type="button" onClick={() => markPin(pad.pinId!)}>{pad.padNumber}</button> : pad.padNumber || '—'}</th>
              <td>{pad.name}</td><td>{electricalNames[pad.electricalType]} ({pad.electricalType})</td><td>{pad.net ?? '—'}</td>
              <td>{(pad.pinId && padFunctions.get(pad.pinId)) || '—'}</td>
            </tr>)}</tbody>
          </table></div></>}
        </> : <p>Chọn chân hoặc linh kiện để xem thuộc tính CAD.</p>}
        {loading ? <p role="status">Đang tải dữ liệu linh kiện…</p> : !boardData && <p>Chưa có dữ liệu linh kiện cho board này.</p>}
        {parts.length > 0 && <label>Linh kiện trên board
          <select value={inspected?.ref ?? ''} onChange={event => { setTypeFilter(''); onSelectComponent(event.target.value) }}>
            <option value="">Chọn linh kiện</option>
            {parts.map(part => <option key={part.ref} value={part.ref}>{part.ref} · {part.value || part.footprint}</option>)}
          </select>
        </label>}
        {padPoints.length > 0 && <label>Chân header
          <select value={selectedPinId} onChange={event => markPin(event.target.value)}>
            <option value="">Chọn chân</option>
            {padPoints.map(({ pin }) => <option key={pin.id} value={pin.id}>{padName(pin)}</option>)}
          </select>
        </label>}
      </div>
    </div>
  </section>
}
