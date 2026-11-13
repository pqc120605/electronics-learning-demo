import { useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { componentRegistry } from '../../data/componentRegistry'
import { BREADBOARD_ELECTRICAL_SPEC, RAIL_IDS, holeNet, parseHole, type RailId } from '../../lib/breadboardGrid'
import { occupancy } from '../../lib/mountResolve'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import { BreadboardDiagram } from './BreadboardDiagram'
import './BreadboardEditor.css'

type WireRole = NonNullable<CircuitDocV2['wires'][number]['role']>
type WireEnd = 'from' | 'to'
type LessonGesture = { kind: 'select' } | { kind: 'connect'; from: CircuitEndpointV2 | null } | { kind: 'edit'; wireId: string; end: WireEnd }
type WireDrag = { pointerId: number; from: CircuitEndpointV2; startX: number; startY: number; x: number; y: number; moved: boolean }
type Props = {
  doc: CircuitDocV2
  selectedWireId: string | null
  pendingEndpoint: CircuitEndpointV2 | null
  onSelectEndpoint: (endpoint: CircuitEndpointV2) => void
  onSelectPart?: (partId: string) => void
  onSelectWire: (id: string) => void
  onCommitWire: (from: CircuitEndpointV2, to: CircuitEndpointV2, role: WireRole) => void | boolean
  onEditWireEndpoint: (id: string, end: WireEnd, endpoint: CircuitEndpointV2) => void | boolean
  onSetWireRole: (id: string, role: WireRole) => void
  onRemoveWire: (id: string) => void
  notice?: string
  activeWireIds?: ReadonlySet<string>
  lessonWiring?: { selectedEndpointId?: string; noticeIsError: boolean; onClearNotice: () => void }
  readOnly?: boolean
}

const rows = 'abcdefghij'.split('')
const rails: RailId[] = [...RAIL_IDS]
const toEndpoint = (id: string): CircuitEndpointV2 => ({ kind: 'hole', holeId: id })
const endpointId = (endpoint: CircuitEndpointV2): string => endpoint.kind === 'pin' ? `${endpoint.partId}:${endpoint.pinId}` : endpoint.holeId
const gridHoles = rows.flatMap(row => Array.from({ length: BREADBOARD_ELECTRICAL_SPEC.columns }, (_, index) => `bb1:${index + 1}${row}`))
export const wireRoleLabels = { signal: 'Tín hiệu', power: 'Nguồn dương', ground: 'GND' } as const
const lessonRoleOptions = Object.entries(wireRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)
const wireEndLabel = (end: WireEnd) => end === 'from' ? 'điểm bắt đầu' : 'điểm kết thúc'

function endpointFromId(id: string): CircuitEndpointV2 {
  if (id.startsWith('bb1:')) return toEndpoint(id)
  const separator = id.lastIndexOf(':')
  return { kind: 'pin', partId: id.slice(0, separator), pinId: id.slice(separator + 1) }
}

function endpointLabel(endpoint: CircuitEndpointV2, doc: CircuitDocV2): string {
  if (endpoint.kind === 'hole') return `Lỗ ${endpoint.holeId}`
  const part = doc.parts.find(item => item.id === endpoint.partId)
  const pin = componentRegistry.find(item => item.id === part?.type)?.pins.find(item => item.id === endpoint.pinId)
  return `${part?.id ?? endpoint.partId} · ${pin?.label ?? endpoint.pinId}`
}

export function BreadboardEditor(props: Props) {
  const { doc, selectedWireId, pendingEndpoint, onSelectEndpoint, onSelectPart, onSelectWire, onCommitWire, onEditWireEndpoint, onSetWireRole, onRemoveWire, notice, lessonWiring, activeWireIds = new Set<string>(), readOnly = false } = props
  const [clickStart, setClickStart] = useState<CircuitEndpointV2 | null>(pendingEndpoint)
  const [editingEnd, setEditingEnd] = useState<WireEnd | null>(null)
  const [gesture, setGesture] = useState<LessonGesture>({ kind: 'select' })
  const [newRole, setNewRole] = useState<WireRole>('signal')
  const [focusedHoles, setFocusedHoles] = useState<Record<string, string>>({})
  const [drag, setDrag] = useState<WireDrag | null>(null)
  const dragRef = useRef<WireDrag | null>(null)
  const suppressClickRef = useRef(false)
  const editorRef = useRef<HTMLElement>(null)
  const selectModeRef = useRef<HTMLButtonElement>(null)
  const wirePickerRef = useRef<HTMLSelectElement>(null)
  const gridHelpId = useId()
  const selectedWire = doc.wires.find(wire => wire.id === selectedWireId)
  const [previousWireId, setPreviousWireId] = useState(selectedWireId)
  if (previousWireId !== selectedWireId) {
    setPreviousWireId(selectedWireId)
    if (gesture.kind === 'edit') setGesture({ kind: 'select' })
  }
  const occupied = useMemo(() => occupancy(doc, doc.lessonId), [doc])
  const netIndex = useMemo(() => createNetIndexV2(doc), [doc])
  const selectedNet = selectedWire ? netIndex.netOf(endpointId(selectedWire.from)) : undefined
  const connecting = gesture.kind === 'connect'
  const lessonEdit = gesture.kind === 'edit' && selectedWire?.id === gesture.wireId ? gesture.end : null
  const activePending = lessonWiring ? connecting ? gesture.from : null : clickStart ?? pendingEndpoint
  const usedBySelected = (endpoint: CircuitEndpointV2) => {
    const net = netIndex.netOf(endpointId(endpoint))
    return Boolean(selectedNet && net?.key === selectedNet.key)
  }

  function changeGesture(next: LessonGesture) {
    lessonWiring?.onClearNotice()
    setGesture(next)
  }

  function cancelGesture() {
    changeGesture({ kind: 'select' })
    selectModeRef.current?.focus()
  }

  function commitLessonWire(from: CircuitEndpointV2, to: CircuitEndpointV2) {
    if (onCommitWire(from, to, newRole) !== false) setGesture({ kind: 'select' })
    else setGesture({ kind: 'connect', from })
  }

  function choose(endpoint: CircuitEndpointV2) {
    if (readOnly) { onSelectEndpoint(endpoint); return }
    if (lessonWiring) {
      if (selectedWire && lessonEdit) {
        if (onEditWireEndpoint(selectedWire.id, lessonEdit, endpoint) !== false) setGesture({ kind: 'select' })
      } else if (connecting) {
        if (gesture.from) commitLessonWire(gesture.from, endpoint)
        else changeGesture({ kind: 'connect', from: endpoint })
      } else {
        onSelectEndpoint(endpoint)
      }
      return
    }
    onSelectEndpoint(endpoint)
    if (selectedWire && editingEnd) {
      onEditWireEndpoint(selectedWire.id, editingEnd, endpoint)
      setEditingEnd(null)
      setClickStart(null)
      return
    }
    if (!clickStart) {
      setClickStart(endpoint)
      return
    }
    if (endpointId(endpoint) === endpointId(clickStart)) {
      setClickStart(null)
      return
    }
    onCommitWire(clickStart, endpoint, 'signal')
    setClickStart(null)
  }

  function activateEndpoint(event: MouseEvent<HTMLButtonElement>, endpoint: CircuitEndpointV2) {
    if (suppressClickRef.current && event.detail > 0) {
      event.preventDefault()
      suppressClickRef.current = false
      return
    }
    choose(endpoint)
  }

  function clearDrag() {
    dragRef.current = null
    setDrag(null)
  }

  function startDrag(event: PointerEvent<HTMLElement>, endpoint: CircuitEndpointV2) {
    if (readOnly || event.button !== 0 || !event.isPrimary) return
    suppressClickRef.current = false
    if (lessonWiring && (!connecting || gesture.from || event.pointerType === 'touch')) return
    dragRef.current = { pointerId: event.pointerId, from: endpoint, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false }
    if (!lessonWiring) setDrag(dragRef.current)
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* detached target during rerender */ }
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = dragRef.current
    if (!current || current.pointerId !== event.pointerId) return
    const x = lessonWiring ? current.startX : current.x
    const y = lessonWiring ? current.startY : current.y
    const moved = current.moved || Math.hypot(event.clientX - x, event.clientY - y) > 5
    if (lessonWiring && !moved) return
    dragRef.current = { ...current, x: event.clientX, y: event.clientY, moved }
    setDrag(dragRef.current)
  }

  function finishDrag(event: PointerEvent<HTMLElement>) {
    const current = dragRef.current
    if (!current || current.pointerId !== event.pointerId) return
    clearDrag()
    const x = lessonWiring ? current.startX : current.x
    const y = lessonWiring ? current.startY : current.y
    if (!current.moved && Math.hypot(event.clientX - x, event.clientY - y) <= 5) return
    suppressClickRef.current = true
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-circuit-endpoint]')
    const id = target?.dataset.circuitEndpoint
    if (!id || (lessonWiring && (!connecting || !editorRef.current?.contains(target)))) return
    const to = endpointFromId(id)
    if (lessonWiring) commitLessonWire(current.from, to)
    else if (endpointId(current.from) !== id) onCommitWire(current.from, to, 'signal')
  }

  const renderHole = (id: string, kind: 'grid' | 'rail', tabIndex?: number) => {
    const hole = parseHole(id)
    if (!hole) return null
    const endpoint = toEndpoint(id)
    const use = occupied[id]
    const active = usedBySelected(endpoint)
    const pending = activePending?.kind === 'hole' && activePending.holeId === id
    return <button
      key={id}
      type="button"
      className={`breadboard-hole ${kind === 'rail' ? 'breadboard-hole-rail' : ''} ${active ? 'breadboard-hole-active' : ''} ${pending ? 'breadboard-hole-pending' : ''} ${use?.legs.length ? 'breadboard-hole-occupied' : ''}`}
      data-hole-id={id}
      data-breadboard-control-endpoint={id}
      data-occupied={use?.legs.length || use?.wireEndpoints.length ? 'true' : 'false'}
      aria-label={`${kind === 'rail' ? 'Lỗ ray nguồn' : 'Lỗ breadboard'} ${id}. ${holeNet(hole) ?? 'không rõ dải'}${use?.legs.length ? `; chân ${use.legs.map(leg => `${leg.partId}:${leg.pinId}`).join(', ')}` : ''}${use?.wireEndpoints.length ? `; dây ${use.wireEndpoints.map(wire => wire.wireId).join(', ')}` : ''}`}
      aria-pressed={lessonWiring ? pending || (!connecting && id === lessonWiring.selectedEndpointId) : pending || active}
      tabIndex={tabIndex}
      title={`${id} · ${holeNet(hole) ?? 'không rõ dải'}`}
      onClick={event => activateEndpoint(event, endpoint)}
      onPointerDown={event => startDrag(event, endpoint)}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={clearDrag}
    />
  }

  const pinButtons = doc.parts.flatMap(part => componentRegistry.find(def => def.id === part.type)?.pins.map(pin => ({ partId: part.id, pinId: pin.id, label: pin.label })) ?? [])

  return <section className={`breadboard-editor${lessonWiring ? ' breadboard-editor-lesson' : ''}`} ref={editorRef} aria-label="Lắp mạch trên breadboard" onKeyDown={event => {
    if (!lessonWiring || event.key !== 'Escape' || (!connecting && !lessonEdit)) return
    if (event.target instanceof HTMLSelectElement) return
    event.preventDefault()
    clearDrag()
    cancelGesture()
  }}>
    {lessonWiring ? renderLessonWiring() : <><header className="breadboard-editor-heading">
      <div><p className="breadboard-editor-eyebrow">LẮP MẠCH · ĐIỂM CẮM THẬT TRONG MÔ HÌNH</p><h2>Breadboard và dây nối</h2></div>
      <p>Chọn một chân hoặc lỗ để bắt đầu; chọn đích để nối. Có thể kéo trực tiếp giữa hai điểm.</p>
    </header>
    {renderModelNote()}</>}
    <div className="breadboard-pin-picker" role="group" aria-label="Chân linh kiện và board">
      {pinButtons.map(pin => {
        const endpoint: CircuitEndpointV2 = { kind: 'pin', partId: pin.partId, pinId: pin.pinId }
        const key = endpointId(endpoint)
        const pending = activePending?.kind === 'pin' && endpointId(activePending) === key
        return <button key={key} type="button" className={`breadboard-pin-target ${pending ? 'is-pending' : ''}`} data-breadboard-control-endpoint={key}
          aria-pressed={pending || (!connecting && lessonWiring?.selectedEndpointId === key)} aria-label={lessonWiring ? `${pin.partId} · ${pin.label}; Chân ${key}` : `Chọn chân ${pin.partId} ${pin.label}`}
          onClick={event => activateEndpoint(event, endpoint)} onPointerDown={event => startDrag(event, endpoint)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={clearDrag}>{pin.partId} · {pin.label}</button>
      })}
    </div>
    <BreadboardDiagram doc={doc} selectedWireId={selectedWireId} selectedEndpointId={lessonWiring?.selectedEndpointId ?? (pendingEndpoint ? endpointId(pendingEndpoint) : clickStart ? endpointId(clickStart) : null)} activeWireIds={activeWireIds} onChooseEndpoint={choose} onSelectWire={onSelectWire} onSelectPart={partId => onSelectPart?.(partId)} />
    <details className="breadboard-grid-details">
      <summary>Mở lưới lỗ chi tiết để kiểm tra vị trí endpoint</summary>
      <div className="breadboard-editor-scroll" aria-label="Lưới lỗ breadboard">
        <div className="breadboard-board">
          <div className="breadboard-rail-block"><strong>RAIL +</strong>{renderHoleGroup(rails.slice(0, 2))}</div>
          <div className="breadboard-main-grid">
            {renderHoleGroup(gridHoles.slice(0, BREADBOARD_ELECTRICAL_SPEC.columns * 5), 'grid', 'Nửa trên, mỗi dải nối 5 lỗ')}
            <div className="breadboard-center-trench" role="separator" aria-label="Rãnh giữa, hai nửa không nối điện"><span>RÃNH GIỮA</span></div>
            {renderHoleGroup(gridHoles.slice(BREADBOARD_ELECTRICAL_SPEC.columns * 5), 'grid', 'Nửa dưới, mỗi dải nối 5 lỗ')}
          </div>
          <div className="breadboard-rail-block"><strong>RAIL −</strong>{renderHoleGroup(rails.slice(2))}</div>
        </div>
      </div>
    </details>
    {drag && <div className="breadboard-wire-preview" aria-hidden="true" style={{ left: drag.x, top: drag.y }}>Đang nối từ {endpointLabel(drag.from, doc)}</div>}
    {!lessonWiring && <>{notice && <p className="breadboard-editor-notice" role="status">{notice}</p>}
    {selectedWire && <section className="breadboard-selected-wire" aria-label={`Chỉnh dây ${selectedWire.id}`}>
      <h3>Đang chọn dây {selectedWire.id}</h3>
      <p>{endpointLabel(selectedWire.from, doc)} ↔ {endpointLabel(selectedWire.to, doc)}</p>
      <div className="breadboard-wire-actions">
        <button type="button" aria-label={`Chỉnh đầu dây ${selectedWire.id}`} aria-pressed={editingEnd === 'from'} onClick={() => setEditingEnd(editingEnd === 'from' ? null : 'from')}>Đổi điểm bắt đầu</button>
        <button type="button" aria-label={`Chỉnh cuối dây ${selectedWire.id}`} aria-pressed={editingEnd === 'to'} onClick={() => setEditingEnd(editingEnd === 'to' ? null : 'to')}>Đổi điểm kết thúc</button>
        <label>Loại dây <select aria-label="Đổi loại dây" value={selectedWire.role ?? 'signal'} onChange={event => onSetWireRole(selectedWire.id, event.currentTarget.value as WireRole)}><option value="signal">Tín hiệu · xanh</option><option value="power">Nguồn dương · đỏ</option><option value="ground">GND · đen</option></select></label>
        <button type="button" aria-label={`Xóa dây ${selectedWire.id}`} onClick={() => onRemoveWire(selectedWire.id)}>Xóa dây</button>
      </div>
      {editingEnd && <p role="status">Chọn một chân hoặc lỗ mới để đổi {editingEnd === 'from' ? 'điểm bắt đầu' : 'điểm kết thúc'}.</p>}
    </section>}
    <details className="breadboard-wire-list"><summary>{doc.wires.length} dây · danh sách endpoint</summary><ol>{doc.wires.map(wire => <li key={wire.id}><button type="button" className={activeWireIds.has(wire.id) ? 'breadboard-wire-flow-active' : ''} aria-pressed={wire.id === selectedWireId} onClick={() => onSelectWire(wire.id)}>{wire.id}: {endpointLabel(wire.from, doc)} ↔ {endpointLabel(wire.to, doc)}{activeWireIds.has(wire.id) ? ' · đường lệnh đang xem' : ''}</button></li>)}</ol></details></>}
    {lessonWiring && renderModelNote()}
    <p className="breadboard-editor-help" role="note">Mỗi dải 5 lỗ ở cùng một nửa được mô hình hóa là một net; hai nửa bị ngăn bởi rãnh giữa. Dải ray được ghi rõ là giả định cho đến khi có nguồn xác minh.</p>
  </section>

  function renderModelNote() {
    return <p className="breadboard-model-note" role="note">Lưới 30 × 10 theo mô hình giáo dục. Số lỗ và cách nối ray nguồn là giả định 400 tie-point, chưa xác minh trên mẫu vật lý.</p>
  }

  function renderHoleGroup(group: string[], kind: 'grid' | 'rail' = 'rail', label = group.join(' và ')) {
    const columns = kind === 'grid' ? BREADBOARD_ELECTRICAL_SPEC.columns : BREADBOARD_ELECTRICAL_SPEC.railHoles
    const ids = kind === 'grid' ? group : group.flatMap(rail => Array.from({ length: columns }, (_, index) => `bb1:${rail}:${index + 1}`))
    const tabbable = focusedHoles[label] ?? ids[0]
    return <div className={kind === 'grid' ? 'breadboard-grid-half' : 'breadboard-rail-holes'} aria-label={label}
      role={lessonWiring ? 'group' : undefined} aria-describedby={lessonWiring ? gridHelpId : undefined}
      onFocus={lessonWiring ? event => {
        const id = (event.target as HTMLElement).dataset.holeId
        if (id && id !== tabbable) setFocusedHoles(current => ({ ...current, [label]: id }))
      } : undefined}
      onKeyDown={lessonWiring ? event => moveHoleFocus(event, columns) : undefined}>
      {ids.map(id => renderHole(id, kind, lessonWiring ? id === tabbable ? 0 : -1 : undefined))}
    </div>
  }

  function renderLessonWiring() {
    const selectionId = lessonWiring?.selectedEndpointId
    const inspection = selectionId ? `Đang chọn ${selectionId}. Net ${netIndex.netOf(selectionId)?.key ?? 'chưa xác định'}.` : 'Chọn chân, lỗ hoặc dây để xem kết nối.'
    const from = connecting && gesture.from ? endpointId(gesture.from) : null
    let instruction = inspection
    if (connecting) instruction = from ? `Điểm bắt đầu ${from}. Chọn điểm kết thúc.` : 'Chọn điểm bắt đầu hoặc kéo dây bằng chuột.'
    else if (lessonEdit && selectedWire) instruction = `Chọn ${wireEndLabel(lessonEdit)} mới cho dây ${selectedWire.id}. Điểm hiện tại ${endpointId(selectedWire[lessonEdit])}.`
    else if (selectedWire) instruction = `Dây ${selectedWire.id}. Điểm bắt đầu ${endpointId(selectedWire.from)}. Điểm kết thúc ${endpointId(selectedWire.to)}.`

    return <div className="breadboard-wiring-panel">
      <div className="breadboard-wiring-toolbar">
        <div className="breadboard-mode" role="group" aria-label="Thao tác breadboard">
          <button type="button" ref={selectModeRef} aria-pressed={!connecting && !lessonEdit} onClick={() => changeGesture({ kind: 'select' })}>Chọn</button>
          <button type="button" aria-pressed={connecting} disabled={readOnly} onClick={() => { if (!connecting) changeGesture({ kind: 'connect', from: null }) }}>Nối dây</button>
        </div>
        <select ref={wirePickerRef} aria-label="Chọn dây" value={selectedWireId ?? ''} onChange={event => {
          changeGesture({ kind: 'select' })
          onSelectWire(event.currentTarget.value)
        }}>
          <option value="" disabled>Dây nối ({doc.wires.length})</option>
          {doc.wires.map(wire => <option key={wire.id} value={wire.id}>{wire.id} · {endpointId(wire.from)} ↔ {endpointId(wire.to)} · {wireRoleLabels[wire.role ?? 'signal']} · Net {netIndex.netOf(endpointId(wire.from))?.key ?? 'chưa xác định'}</option>)}
        </select>
      </div>
      <p className={`breadboard-interaction-status${selectedWire && !connecting && !lessonEdit ? ' breadboard-status-announcement' : ''}`} role="status" aria-atomic="true">{instruction}</p>
      {connecting && <div className="breadboard-wire-actions">
        <label>Loại dây mới <select value={newRole} onChange={event => setNewRole(event.currentTarget.value as WireRole)}>{lessonRoleOptions}</select></label>
        <button type="button" onClick={cancelGesture}>Hủy nối dây</button>
      </div>}
      {selectedWire && !connecting && !readOnly && <section className="breadboard-selected-wire" aria-label={`Chỉnh dây ${selectedWire.id}`}>
        <h2><code>{selectedWire.id}</code></h2>
        <dl className="breadboard-wire-identifiers">
          <div><dt>Điểm bắt đầu</dt><dd><code>{endpointId(selectedWire.from)}</code></dd></div>
          <div><dt>Điểm kết thúc</dt><dd><code>{endpointId(selectedWire.to)}</code></dd></div>
          <div><dt>Net</dt><dd><code>{selectedNet?.key ?? 'chưa xác định'}</code></dd></div>
        </dl>
        <div className="breadboard-wire-actions">
          {(['from', 'to'] as const).map(end => <button key={end} type="button" aria-pressed={lessonEdit === end}
            onClick={() => changeGesture(lessonEdit === end ? { kind: 'select' } : { kind: 'edit', wireId: selectedWire.id, end })}>Đổi {wireEndLabel(end)}</button>)}
          <label>Loại dây <select aria-label="Đổi loại dây" value={selectedWire.role ?? 'signal'} onChange={event => {
            setGesture({ kind: 'select' })
            onSetWireRole(selectedWire.id, event.currentTarget.value as WireRole)
          }}>{lessonRoleOptions}</select></label>
          <button type="button" className="breadboard-remove-wire" aria-label={`Xóa dây ${selectedWire.id}`} onClick={() => {
            setGesture({ kind: 'select' })
            onRemoveWire(selectedWire.id)
            wirePickerRef.current?.focus()
          }}>Xóa dây</button>
        </div>
        {lessonEdit && <button type="button" className="breadboard-cancel-edit" onClick={cancelGesture}>Hủy đổi điểm</button>}
      </section>}
      {notice && <p className="breadboard-editor-notice" role={lessonWiring?.noticeIsError ? 'alert' : 'status'}>{notice}</p>}
      <p id={gridHelpId} className="breadboard-status-announcement">Dùng phím mũi tên để chuyển lỗ. Nhấn Enter hoặc Space để chọn lỗ.</p>
    </div>
  }
}

function moveHoleFocus(event: KeyboardEvent<HTMLDivElement>, columns: number) {
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-hole-id]')]
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0) return
  const column = index % columns
  let target: number
  switch (event.key) {
    case 'ArrowLeft': target = column > 0 ? index - 1 : index; break
    case 'ArrowRight': target = column < columns - 1 ? index + 1 : index; break
    case 'ArrowUp': target = index - columns; break
    case 'ArrowDown': target = index + columns; break
    case 'Home': target = index - column; break
    case 'End': target = index - column + columns - 1; break
    default: return
  }
  event.preventDefault()
  buttons[target]?.focus()
}
