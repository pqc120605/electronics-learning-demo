import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getBuilderLesson, getInputAlias } from '../../data/builderLessons'
import { componentRegistry, getComponentDefinition } from '../../data/componentRegistry'
import { getComponentMesh } from '../../data/componentModels'
import { getLessonCircuitDoc } from '../../data/lessonCircuitDocs'
import { getSimulationTarget, type SimulationTarget } from '../../data/simulationTargets'
import { buttonLedEndpointKey, getButtonLedLessonFrame, getButtonLedLessonTrace, type ButtonLedTraceContext } from '../../lib/buttonLedLessonTrace'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import { addWire, editWireEndpoint, removeWire, setWireRole, type CircuitDocEditResult } from '../../lib/circuitDocEdits'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'
import type { LessonPreflight, PreflightBoardNotice } from '../../lib/lessonPreflight'
import { occupancy } from '../../lib/mountResolve'
import type { useLearningProgress } from '../../lib/useLearningProgress'
import type { CircuitEndpoint } from '../../types/circuitTopology'
import { LessonProgressToggle } from '../LessonProgressToggle'
import { LearningActivity } from '../LearningActivity'
import { BreadboardEditor, wireRoleLabels } from '../builder/BreadboardEditor'
import { CircuitSchematicV2 } from '../builder/CircuitSchematicV2'
import './ButtonLedLessonLab.css'

const AssemblyStage = lazy(() => import('../builder/AssemblyStage').then(module => ({ default: module.AssemblyStage })))
const stageViews = [['breadboard', 'Breadboard'], ['schematic', 'Sơ đồ'], ['assembly', '3D']] as const
const inspectorTabs = [['overview', 'Tổng quan'], ['parts', 'Linh kiện'], ['code', 'Code'], ['trace', 'Trace']] as const
const mobileViews = [['circuit', 'Mạch'], ['schematic', 'Sơ đồ'], ['code', 'Code'], ['details', 'Chi tiết']] as const
const noOp = () => {}
const modelPinFallback = () => ({ x: 0, y: 0 })
const traceLimits = 'Trace chỉ mô tả mức logic theo code bài học. Chạy firmware, đo dòng hoặc điện áp và nảy tiếp điểm nằm ngoài phạm vi.'

type StageView = typeof stageViews[number][0]
type InspectorTab = typeof inspectorTabs[number][0]
type MobileView = typeof mobileViews[number][0]
type Selection = { kind: 'part' | 'pin' | 'hole' | 'wire' | 'net'; key: string }
type LessonWire = CircuitDocV2['wires'][number]
type Props = {
  preflight: LessonPreflight
  boardId: string
  boardNotice?: PreflightBoardNotice
  boardOptions: readonly string[]
  onBoardChange: (id: string) => void
  position: number
  total: number
  stage?: string
  previous?: { title: string; to: string }
  next?: { title: string; to: string }
  progress: ReturnType<typeof useLearningProgress>
  routeFor: (route: string) => string
}

function sampleCode(target: SimulationTarget) {
  return getBuilderLesson('button-led').code(target, getInputAlias(target, 'button-led').pin)
}

function endpointConflict(wire: LessonWire, wires: readonly LessonWire[]) {
  const from = buttonLedEndpointKey(wire.from)
  const to = buttonLedEndpointKey(wire.to)
  if (from === to) return `Chọn hai điểm khác nhau. Dây này có cả hai đầu tại ${from}.`
  const duplicate = wires.find(other => {
    if (other.id === wire.id) return false
    const otherFrom = buttonLedEndpointKey(other.from)
    const otherTo = buttonLedEndpointKey(other.to)
    return (otherFrom === from && otherTo === to) || (otherFrom === to && otherTo === from)
  })
  return duplicate ? `Dây ${duplicate.id} đã nối ${from} với ${to}.` : undefined
}

export function ButtonLedLessonLab({ preflight, boardId, boardNotice, boardOptions, onBoardChange, position, total, stage, previous, next, progress, routeFor }: Props) {
  const { lesson, target } = preflight
  const [doc, setDoc] = useState(() => getLessonCircuitDoc('button-led')!)
  const [code, setCode] = useState(() => sampleCode(target))
  const [pressed, setPressed] = useState(false)
  const [run, setRun] = useState<ButtonLedTraceContext | null>(() => ({ doc, code, pressed, boardId }))
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [view, setView] = useState<StageView>('breadboard')
  const [tab, setTab] = useState<InspectorTab>('overview')
  const [mobileView, setMobileView] = useState<MobileView>('circuit')
  const [selection, setSelection] = useState<Selection>({ kind: 'part', key: 'button-1' })
  const [partId, setPartId] = useState('button-1')
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null)
  const [editorVersion, setEditorVersion] = useState(0)
  const nextWireNumber = useRef(0)
  const mountedBoardId = useRef(boardId)

  useEffect(() => {
    if (mountedBoardId.current !== boardId) {
      mountedBoardId.current = boardId
      setRun(null)
      setPlaying(false)
    }
  }, [boardId])

  const trace = useMemo(() => getButtonLedLessonTrace({ doc, code, boardId, pressed }, run), [doc, code, boardId, pressed, run])
  const frame = useMemo(() => getButtonLedLessonFrame({ doc, code, boardId, pressed }, run, step), [doc, code, boardId, pressed, run, step])
  const isPlaying = playing && trace.status === 'ready' && !reduceMotion
  useEffect(() => {
    const preference = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!preference) return
    const update = () => { setReduceMotion(preference.matches); if (preference.matches) setPlaying(false) }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!isPlaying || step >= trace.events.length - 1) { setPlaying(false); return }
    const timer = window.setTimeout(() => setStep(value => value + 1), 1200)
    return () => window.clearTimeout(timer)
  }, [isPlaying, step, trace.events.length])
  const netIndex = useMemo(() => createNetIndexV2(doc), [doc])
  const part = doc.parts.find(item => item.id === partId)
  const definition = part && getComponentDefinition(part.type)
  const mesh = part && getComponentMesh(part.type)
  const selectedWire = selection.kind === 'wire' ? doc.wires.find(wire => wire.id === selection.key) : undefined
  const selectedNet = selection.kind === 'part' ? undefined : netIndex.netOf(selectedWire ? buttonLedEndpointKey(selectedWire.from) : selection.key)
  const selectedWireId = selectedWire?.id ?? null
  const projectedWireId = selectedWireId ?? selectedNet?.wireIds.values().next().value ?? null
  const projectedPin = selection.kind === 'pin' ? selection.key : selectedNet?.endpoints.values().next().value ?? ''
  const selectedEndpoints = useMemo(() => {
    if (selectedNet) return new Set([...selectedNet.endpoints, ...selectedNet.holes])
    if (selection.kind !== 'part') return new Set([selection.key])
    const keys = new Set(definition?.pins.map(pin => `${selection.key}:${pin.id}`))
    for (const [holeId, entry] of Object.entries(occupancy(doc))) {
      if (entry.legs.some(leg => leg.partId === selection.key)) keys.add(holeId)
    }
    return keys
  }, [definition, doc, selectedNet, selection])
  const activeWireIds = useMemo(() => new Set(frame.wireFlows.keys()), [frame.wireFlows])
  const assemblyParts = useMemo(() => doc.parts.map((item, index) => ({
    id: item.id, type: item.type, x: index * 10, y: 50,
    value: item.value?.label ?? (item.value?.ohm === undefined ? undefined : `${item.value.ohm} Ω`),
  })), [doc.parts])
  const [read, branch, write] = trace.events
  const summary = read?.kind === 'read' && branch?.kind === 'branch' && write?.kind === 'write'
    ? `${read.level} → ${branch.branch} → LED ${write.level === 'HIGH' ? 'sáng' : 'tắt'}` : trace.message
  const event = frame.event
  const action = event?.kind === 'read' ? `Đọc GPIO ${event.pin}: ${event.level}`
    : event?.kind === 'branch' ? `So sánh với ${event.condition}: nhánh ${event.branch}`
      : event?.kind === 'write' ? `Ghi GPIO ${event.pin}: ${event.level}` : ''
  const snippet = event?.line === undefined ? '' : code.split(/\r?\n/)[event.line - 1]?.trim() ?? ''

  const partLabel = (item: { type: string }) => item.type === 'board'
    ? (boardNotice ? `${target.name} · mạch tham chiếu` : target.name)
    : getComponentDefinition(item.type)?.label ?? item.type
  const pinLabel = (type: string, pinId: string, fallback: string) => {
    if (type === 'board' && pinId === 'input') return getInputAlias(target, 'button-led').label
    if (type === 'board' && pinId === 'ledOut') return target.pinLabel
    return fallback
  }
  const describe = (endpoint: CircuitEndpoint) => {
    const item = doc.parts.find(candidate => candidate.id === endpoint.partId)
    const type = item?.type ?? ''
    const label = getComponentDefinition(type)?.pins.find(pin => pin.id === endpoint.pinId)?.label ?? endpoint.pinId
    return `${endpoint.partId} · ${pinLabel(type, endpoint.pinId, label)}`
  }

  function selectPart(id: string) {
    setNotice(null)
    setPartId(id)
    setSelection({ kind: 'part', key: id })
    setTab('parts')
  }
  function selectEndpoint(endpoint: CircuitEndpointV2) {
    setNotice(null)
    if (endpoint.kind === 'pin') setPartId(endpoint.partId)
    setSelection({ kind: endpoint.kind, key: buttonLedEndpointKey(endpoint) })
    setTab('parts')
  }
  function selectConnection(kind: 'net' | 'wire', key: string) {
    setNotice(null)
    setSelection({ kind, key })
    setTab('parts')
  }

  function chooseView(id: StageView) {
    setView(id)
    setMobileView(id === 'schematic' ? 'schematic' : 'circuit')
  }
  function chooseMobileView(id: MobileView) {
    setMobileView(id)
    if (id === 'schematic') setView('schematic')
    if (id === 'circuit' && view === 'schematic') setView('breadboard')
    if (id === 'code') setTab('code')
    if (id === 'details' && tab === 'code') setTab('parts')
  }
  function requestRun(nextPressed = pressed) {
    setPressed(nextPressed)
    setRun({ doc, code, boardId, pressed: nextPressed })
    setStep(0)
    setPlaying(false)
  }
  function invalidateRun() {
    setRun(null)
    setPlaying(false)
    setStep(0)
  }
  function changeInput(value: boolean) {
    setPressed(value)
    invalidateRun()
  }
  function moveStep(value: number) {
    setPlaying(false)
    setStep(value)
  }
  function changeCode(value: string) {
    setCode(value)
    invalidateRun()
  }
  function updateCircuit(result: CircuitDocEditResult, wire?: LessonWire) {
    const error = result.issues.find(issue => issue.severity === 'error')?.message ?? (wire && endpointConflict(wire, doc.wires))
    if (error) {
      setNotice({ message: error, error: true })
      return false
    }
    setDoc(result.doc)
    invalidateRun()
    if (wire) {
      setSelection({ kind: 'wire', key: wire.id })
      setTab('parts')
    } else if (selection.kind === 'wire' && !result.doc.wires.some(item => item.id === selection.key)) {
      setSelection({ kind: 'part', key: partId })
    }
    setNotice({ message: 'Đã cập nhật dây trong phiên bài học.', error: false })
    return true
  }
  function commitWire(from: CircuitEndpointV2, to: CircuitEndpointV2, role: LessonWire['role']) {
    const wire = { id: `lesson-wire-${nextWireNumber.current + 1}`, from, to, role }
    const changed = updateCircuit(addWire(doc, wire), wire)
    if (changed) nextWireNumber.current++
    return changed
  }
  function changeWireEndpoint(id: string, end: 'from' | 'to', endpoint: CircuitEndpointV2) {
    const wire = doc.wires.find(item => item.id === id)
    if (wire && buttonLedEndpointKey(wire[end]) === buttonLedEndpointKey(endpoint)) {
      setNotice({ message: `Điểm ${buttonLedEndpointKey(endpoint)} đang là đầu dây này. Hãy chọn điểm khác.`, error: true })
      return false
    }
    return updateCircuit(editWireEndpoint(doc, id, end, endpoint), wire && { ...wire, [end]: endpoint })
  }
  function resetCircuit() {
    setDoc(getLessonCircuitDoc('button-led')!)
    invalidateRun()
    setPartId('button-1')
    setSelection({ kind: 'part', key: 'button-1' })
    setEditorVersion(version => version + 1)
    nextWireNumber.current = 0
    setNotice({ message: 'Đã khôi phục mạch mẫu.', error: false })
  }

  return <div className="button-lab" data-mobile-view={mobileView}>
    <aside className="button-lab-rail" aria-label="Bài học và tiến độ">
      <Link className="button-lab-path" to={routeFor('/topics')}>Lộ trình</Link>
      <h1>{lesson.title}</h1>
      <div className="button-lab-progress"><span>Bài {position}/{total}</span><progress aria-label="Vị trí bài trong lộ trình" value={position} max={total} /></div>
      <p className="button-lab-stage-name">{stage} · {lesson.durationMinutes} phút</p>
      <nav className="button-lab-neighbours" aria-label="Bài trước và bài sau">
        {previous && <Link to={previous.to} title={previous.title}><small>Bài trước</small><span>{previous.title}</span></Link>}
        {next && <Link to={next.to} title={next.title}><small>Bài sau</small><span>{next.title}</span></Link>}
      </nav>
    </aside>

    <nav className="button-lab-mobile-switch" aria-label="Chế độ xem trên điện thoại">
      {mobileViews.map(([id, label]) => <button key={id} type="button" aria-pressed={mobileView === id} onClick={() => chooseMobileView(id)}>{label}</button>)}
    </nav>

    <section className="button-lab-stage" aria-label="Chế độ xem mạch">
      <div className="button-lab-stage-top">
        <div className="button-lab-view-switch" role="group" aria-label="Chọn hình chiếu mạch">
          {stageViews.map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} disabled={id === 'assembly' && Boolean(boardNotice)} onClick={() => chooseView(id)}>{label}</button>)}
        </div>
        <button type="button" className="button-lab-text-button" onClick={resetCircuit}>Khôi phục mạch</button>
      </div>
      <div className="button-lab-stage-scroll" tabIndex={0} aria-label="Vùng mạch cuộn được">
        {boardNotice && <p className="button-lab-board-notice" role="note">{boardNotice.message} Mạch mẫu theo {target.name}; chế độ 3D tạm khóa.</p>}
        <div hidden={view !== 'breadboard'}>
          <BreadboardProjection doc={doc} activeKeys={frame.activeKeys} activeWireIds={activeWireIds} selectedEndpoints={selectedEndpoints}
            selectedWireIds={selectedWireId ? new Set([selectedWireId]) : selectedNet?.wireIds}>
            <BreadboardEditor key={editorVersion} doc={doc} selectedWireId={selectedWireId} pendingEndpoint={null} activeWireIds={activeWireIds}
              onSelectEndpoint={selectEndpoint} onSelectWire={id => selectConnection('wire', id)}
              onCommitWire={commitWire} onEditWireEndpoint={changeWireEndpoint}
              onSetWireRole={(id, role) => updateCircuit(setWireRole(doc, id, role))}
              onRemoveWire={id => updateCircuit(removeWire(doc, id))} notice={notice?.message}
              lessonWiring={{ selectedEndpointId: selection.kind === 'pin' || selection.kind === 'hole' ? selection.key : undefined,
                noticeIsError: notice?.error ?? false, onClearNotice: () => setNotice(null) }} />
          </BreadboardProjection>
        </div>
        {view === 'schematic' && <SchematicProjection doc={doc} selectedNetKey={selectedNet?.key}>
          <CircuitSchematicV2 doc={doc} selectedKey={partId} selectedWireId={projectedWireId} activeKeys={frame.activeKeys}
            onSelectPart={selectPart} onSelectWire={id => selectConnection('wire', id)} onSelectNet={id => selectConnection('net', id)} />
        </SchematicProjection>}
        {view === 'assembly' && !boardNotice && <Suspense fallback={<p role="status">Đang mở cảnh 3D…</p>}>
          <AssemblyStage parts={assemblyParts} wires={[]} definitions={componentRegistry} target={target} lessonId="button-led" lessonMode="code-subset" code={code}
            circuitDocV2={doc} selectedPartId={partId} selectedWireId={projectedWireId} layoutReadOnly flows={frame.wireFlows} running={false}
            connections={[]} litPartIds={event?.kind === 'write' && event.level === 'HIGH' ? ['led-1'] : []}
            lockReason={trace.message || traceLimits}
            nameFor={partLabel} describe={describe} pinLabel={(type, index, fallback) => pinLabel(type, getComponentDefinition(type)?.pins[index]?.id ?? '', fallback)}
            colorWire={() => '#137078'} active={wire => activeWireIds.has(wire.id)} activePart={item => frame.activePartIds.has(item.id)}
            pinPoint={modelPinFallback} pending={null} tracedPin={frame.activeKeys.has(projectedPin) ? projectedPin : ''}
            onSelect={selectPart} onPinClick={key => { const [partId, pinId] = key.split(':'); selectEndpoint({ kind: 'pin', partId, pinId }) }}
            onRemove={noOp} onRotate={noOp} onDrop={noOp} onAssemblyChange={noOp} />
        </Suspense>}
      </div>
      <div className="button-lab-stage-caption"><span><i className="button-lab-dot" /> Đường theo trace</span><span>{doc.parts.length} linh kiện · {doc.wires.length} dây</span></div>
    </section>

    <aside className="button-lab-inspector" aria-label="Chi tiết bài và mạch">
      <div className="button-lab-tabs" role="group" aria-label="Chọn nội dung bài học">
        {inspectorTabs.map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => { setTab(id); setMobileView(id === 'code' ? 'code' : 'details') }}>{label}</button>)}
      </div>
      <div className="button-lab-inspector-scroll" tabIndex={0} aria-label="Nội dung cuộn được">
        <div className="button-lab-pane" hidden={tab !== 'overview'}>
          <h2>Thử nút nhấn</h2>
          <p>Đoán LED sẽ sáng khi nào, rồi đổi trạng thái nút. So sánh mức đọc với điều kiện trong code.</p>
          <ol className="button-lab-steps"><li>Đọc mức của nút ở GPIO IN.</li><li>So sánh mức đọc với <code>LOW</code>.</li><li>Xem nhánh nào đặt mức cho LED.</li></ol>
          <label className="button-lab-board">Board của bạn<select value={boardId} onChange={event => { invalidateRun(); onBoardChange(event.currentTarget.value) }}>
            {boardNotice && <option value={boardId}>Board chưa hỗ trợ</option>}
            {boardOptions.map(id => <option key={id} value={id}>{getSimulationTarget(id).name}</option>)}
          </select></label>
          {boardNotice && <p>{boardNotice.message}{boardNotice.boardRoute && <> <Link to={routeFor(boardNotice.boardRoute)}>Hồ sơ board</Link></>}</p>}
          <details><summary>Nguồn board và giới hạn</summary><p>{preflight.revision} · {preflight.confidence}</p><p>{lesson.boardProfile}</p>
            {preflight.licenseName && <p>Giấy phép mô hình · {preflight.licenseName}</p>}
            {preflight.sourceUrl && <p><a href={preflight.sourceUrl} target="_blank" rel="noreferrer">Nguồn board</a></p>}
            {preflight.hasBoardViewer && <p><Link to={routeFor(preflight.boardRoute)}>Hồ sơ board và CAD</Link></p>}
          </details>
          <details><summary>Trước khi lắp thật</summary><ul>{lesson.safetyNotes.map(note => <li key={note}>{note}</li>)}<li>{lesson.hardwareTransition}</li></ul></details>
          <details><summary>Tiến độ tự khai báo</summary><LessonProgressToggle lessonId="button-led" /><LearningActivity attempts={progress.simulationAttempts} lessonId="button-led" routeFor={routeFor} /></details>
          {!boardNotice && preflight.support.supported && <p><Link to={routeFor(preflight.startRoute)}>Mở phòng lắp mạch</Link></p>}
          <p className="button-lab-small">Mạch chỉnh sửa và code giữ trong lần mở bài này.</p>
        </div>

        <div className="button-lab-pane" hidden={tab !== 'parts'}>
          <h2>Linh kiện và chân</h2>
          <div className="button-lab-list" role="group" aria-label="Chọn linh kiện">
            {doc.parts.map(item => <button key={item.id} type="button" aria-pressed={item.id === partId} onClick={() => selectPart(item.id)}>{partLabel(item)}<small>{item.id}</small></button>)}
          </div>
          {part && <div className="button-lab-part"><h3>{partLabel(part)}</h3><p>{definition?.explanation}</p>
            {part.type === 'button' && <p>Hai tiếp điểm gồm bốn chân kim loại. Trong mô hình, mỗi cặp chân cùng tên thuộc một tiếp điểm. Nút ảo đổi mức đọc trong bài.</p>}
            {part.value?.ohm !== undefined && <p>Giá trị trong bài · {part.value.ohm} Ω</p>}
            {mesh && <small>{mesh.kind === 'source-cad-mesh' ? 'Hình học CAD tham chiếu' : 'Hình học tham số tham chiếu'}</small>}
            <ul className="button-lab-pins">{definition?.pins.map(pin => <li key={pin.id}>
              <button type="button" aria-pressed={selection.key === `${part.id}:${pin.id}`} onClick={() => selectEndpoint({ kind: 'pin', partId: part.id, pinId: pin.id })}>{pinLabel(part.type, pin.id, pin.label)} <code>{part.id}:{pin.id}</code></button>
            </li>)}</ul>
          </div>}
          {selection.kind !== 'part' && <div className="button-lab-selection"><strong>Đang chọn</strong><code data-testid="button-lab-selection">{selection.key}</code>
            {selectedNet && <><small>Net · {selectedNet.key}</small><p>{[...selectedNet.endpoints].join(' · ') || 'Không có chân linh kiện.'}</p></>}
          </div>}
          <details open><summary>Dây nối và net</summary><ul className="button-lab-pins">{doc.wires.map(wire => <li key={wire.id}>
            <button type="button" aria-pressed={selectedWireId === wire.id} data-active={activeWireIds.has(wire.id)} onClick={() => selectConnection('wire', wire.id)}>
              <code>{wire.id}</code><small>{buttonLedEndpointKey(wire.from)} ↔ {buttonLedEndpointKey(wire.to)}</small>
              <small>{wireRoleLabels[wire.role ?? 'signal']} · Net <code>{netIndex.netOf(buttonLedEndpointKey(wire.from))?.key ?? 'chưa xác định'}</code></small>
            </button>
          </li>)}</ul></details>
        </div>

        <div className="button-lab-pane button-lab-code-pane" hidden={tab !== 'code'}>
          <h2><label htmlFor="button-lab-code">Code bài nút nhấn</label></h2>
          <textarea id="button-lab-code" value={code} onChange={event => changeCode(event.currentTarget.value)} spellCheck={false} autoCapitalize="off" autoComplete="off" />
          <button type="button" className="button-lab-text-button" disabled={Boolean(boardNotice)} onClick={() => changeCode(sampleCode(target))}>Khôi phục code mẫu</button>
        </div>

        <div className="button-lab-pane" hidden={tab !== 'trace'}>
          <h2>Trace đọc, rẽ nhánh và ghi</h2>
          <p className="button-lab-small">Bộ diễn giải code giới hạn của bài học</p>
          <p className="button-lab-small">{traceLimits}</p>
          {trace.events.length ? <ol className="button-lab-events">{trace.events.map((event, index) => <li key={event.kind} aria-current={index === step ? 'step' : undefined}>
            <strong>{event.kind === 'read' ? `Đọc GPIO ${event.pin}` : event.kind === 'branch' ? `So sánh với ${event.condition}` : `Ghi GPIO ${event.pin}`}</strong>
            <code>{event.kind === 'branch' ? `${event.level} → ${event.branch}` : event.level}</code>
            {event.line !== undefined && <small>Dòng {event.line}</small>}
          </li>)}</ol> : <p>{trace.message}</p>}
        </div>
      </div>
    </aside>

    <div className="button-lab-console">
      <fieldset className="button-lab-input"><legend>Nút ảo</legend>
        <label><input type="radio" name="button-lab-input" checked={!pressed} onChange={() => changeInput(false)} /><span>Thả nút</span></label>
        <label><input type="radio" name="button-lab-input" checked={pressed} onChange={() => changeInput(true)} /><span>Nhấn nút</span></label>
      </fieldset>
      <div className="button-lab-result" role="status" aria-live="polite" aria-atomic="true" data-state={trace.status} data-event={event?.kind ?? ''}>
        <span>Bộ diễn giải code giới hạn</span><strong>{summary}</strong>
        {event && <><span>Bước {step + 1}/{trace.events.length} · {action} · Dòng {event.line ?? 'chưa xác định'}</span><code title={snippet}>{snippet}</code></>}
        <small>Mức logic bài học; không đo điện hay chạy firmware.</small>
      </div>
      <button type="button" className="button-lab-run" onClick={() => requestRun()}>Chạy lại</button>
      <div className="button-lab-playback" role="group" aria-label="Điều khiển từng bước trace">
        <button type="button" disabled={!event || step === 0} onClick={() => moveStep(step - 1)}>Bước trước</button>
        <button type="button" disabled={!event || reduceMotion} onClick={() => {
          if (!isPlaying && step === trace.events.length - 1) setStep(0)
          setPlaying(!isPlaying)
        }}>{isPlaying ? 'Tạm dừng trace' : 'Phát trace'}</button>
        <button type="button" disabled={!event || step === trace.events.length - 1} onClick={() => moveStep(step + 1)}>Bước sau</button>
        <button type="button" disabled={!event} onClick={() => moveStep(0)}>Về bước đầu</button>
        {reduceMotion && <small>Giảm chuyển động: dùng bước trước/sau.</small>}
      </div>
    </div>
  </div>
}

function SchematicProjection({ doc, selectedNetKey, children }: { doc: ButtonLedTraceContext['doc']; selectedNetKey?: string; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    for (const net of container.current?.querySelectorAll<HTMLElement>('[data-net-key]') ?? []) {
      net.toggleAttribute('data-lesson-net-selected', net.dataset.netKey === selectedNetKey)
    }
  }, [doc, selectedNetKey])

  return <div className="button-lab-schematic" ref={container} onKeyDownCapture={event => {
    const target = event.target
    if (!(target instanceof SVGElement) || target.getAttribute('role') !== 'button'
      || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    if (!event.repeat) target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }}>{children}</div>
}

function BreadboardProjection({ doc, activeKeys, activeWireIds, selectedEndpoints, selectedWireIds, children }: {
  doc: ButtonLedTraceContext['doc']
  activeKeys: ReadonlySet<string>
  activeWireIds: ReadonlySet<string>
  selectedEndpoints: ReadonlySet<string>
  selectedWireIds?: ReadonlySet<string>
  children: ReactNode
}) {
  const container = useRef<HTMLDivElement>(null)
  const [paths, setPaths] = useState<Array<{ id: string; d: string; role: NonNullable<LessonWire['role']> }>>([])

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const elements = new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-circuit-endpoint]'), element => [element.dataset.circuitEndpoint, element]))
    for (const [key, element] of elements) {
      element.toggleAttribute('data-lesson-active', Boolean(key && activeKeys.has(key)))
      element.toggleAttribute('data-lesson-selected', Boolean(key && selectedEndpoints.has(key)))
    }
    const grid = root.querySelector('.breadboard-editor-scroll')
    let pending = 0
    const draw = () => {
      const bounds = root.getBoundingClientRect()
      const point = (endpoint: CircuitEndpointV2) => {
        const element = elements.get(buttonLedEndpointKey(endpoint))
        const rect = element?.getBoundingClientRect()
        if (!rect?.width || !rect.height) return undefined
        const x = rect.left + rect.width / 2
        const viewport = element?.closest('.breadboard-editor-scroll, .breadboard-pin-picker')?.getBoundingClientRect()
        if (viewport && (x < viewport.left || x > viewport.right)) return undefined
        return [x - bounds.left, rect.top + rect.height / 2 - bounds.top]
      }
      setPaths(doc.wires.flatMap(wire => {
        const from = point(wire.from), to = point(wire.to)
        if (!from || !to) return []
        const middle = (from[1] + to[1]) / 2
        return [{ id: wire.id, role: wire.role ?? 'signal', d: `M${from[0]},${from[1]} C${from[0]},${middle} ${to[0]},${middle} ${to[0]},${to[1]}` }]
      }))
    }
    const schedule = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(draw) }
    const resize = new ResizeObserver(schedule)
    resize.observe(root)
    if (grid) resize.observe(grid)
    root.addEventListener('scroll', schedule, true)
    draw()
    return () => { resize.disconnect(); cancelAnimationFrame(pending); root.removeEventListener('scroll', schedule, true) }
  }, [doc.wires, activeKeys, selectedEndpoints])

  return <div className="button-lab-breadboard" ref={container}>
    {children}
    <svg className="button-lab-wire-overlay" aria-hidden="true" width="100%" height="100%">
      {paths.map(path => <path key={path.id} d={path.d} data-wire-id={path.id} data-active={activeWireIds.has(path.id)} data-role={path.role} data-selected={selectedWireIds?.has(path.id) ?? false} />)}
    </svg>
  </div>
}
