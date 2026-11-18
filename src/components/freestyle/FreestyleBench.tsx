import { lazy, Suspense, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BreadboardEditor } from '../builder/BreadboardEditor'
import { getFreestyleBoardId, getFreestylePartId } from '../../lib/catalogPracticeLinks'
import type { WireSignalLabel } from '../builder/BreadboardDiagram'
import { SignalFlowPanel } from '../builder/SignalFlowPanel'
import { componentRegistry } from '../../data/componentRegistry'
import { parseHole } from '../../lib/breadboardGrid'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'
import { setWireRole, editWireEndpoint, removeWire } from '../../lib/circuitDocEdits'
import type { CircuitDocV2, CircuitEndpointV2 } from '../../lib/circuitDocV2'
import type { FlowLegendEntry, SerialEntry } from '../../lib/signalFlow'
import type { LivePinState } from '../../lib/avrLiveMachine'
import { getBrowserStorage } from '../../lib/workspaceStorage'
import {
  FREESTYLE_STORAGE_KEY, SIGNAL_PINS, SIGNAL_PIN_LABELS, addFreestyleWire, availablePins, buildSampleCircuit, controlsFor, createEmptyFreestyleDoc, blankFreestyleWorkspace, isBreadboardPart,
  workspaceWithFreestyleBoard, evaluateFreestyleCircuit, freestyleBoards, freestyleSamples, getFreestyleBoard, getMotorProtection, movePart,
  parseFreestyleWorkspace, pinDisplayName, placePart, placeableParts, removePartAndWires, rotatePart, sampleCode,
  type ControlState, type FreestyleLanguage, type FreestyleSampleId, type FreestyleWorkspace, type PinMap, type SignalPin,
} from '../../lib/freestyle/freestyleCircuit'
import { chooseEngine, detectLocalTools, startFreestyleRun, type LocalTools, type RuntimeController } from '../../lib/freestyle/freestyleRuntime'
import { FreestyleDraftsDialog } from './FreestyleDraftsDialog'
import { archiveFreestyle } from '../../lib/freestyle/freestyleDrafts'
import { FreestyleToolsDrawer } from './FreestyleToolsDrawer'
import './FreestyleBench.css'
import { GuideContextBridge } from '../guide/GuideContext'
import { freestylePresentation } from '../../lib/freestyle/freestylePresentation'
import { appendTrace, type TraceSample } from '../../lib/freestyle/freestyleTrace'
import { FreestyleWaveform } from './FreestyleWaveform'
import { CircuitSchematicV2 } from '../builder/CircuitSchematicV2'
const FreestyleAssemblyView = lazy(() => import('./FreestyleAssemblyView').then(m=>({default:m.FreestyleAssemblyView})))

/**
 * Bàn lắp mạch tự do (2026-11-14): Chọn board → Thêm linh kiện → Viết code & Chạy.
 * Tái dùng BreadboardEditor (CircuitDocV2), SignalFlowPanel và các engine chạy code của dự án.
 */
type Step = 'board' | 'parts' | 'code' | 'observe'
type View = 'breadboard' | 'schematic' | '3d' | 'wave'
const steps: Array<{ id: Step; label: string }> = [
  { id: 'board', label: 'Chọn board' },
  { id: 'parts', label: 'Thêm linh kiện' },
  { id: 'code', label: 'Viết code & Chạy' },
  { id: 'observe', label: 'Quan sát' },
]
const MAX_SERIAL = 8_000
const rows = 'abcdefghij'

function loadDraft(): {raw:string; workspace:FreestyleWorkspace|null}|null {
  try { const raw=getBrowserStorage('localStorage').getItem(FREESTYLE_STORAGE_KEY);return raw?{raw,workspace:parseFreestyleWorkspace(raw)}:null } catch { return null }
}

export function FreestyleBench({ variant = 'home' }: { variant?: 'home' | 'full' }) {
  const [draft] = useState(loadDraft)
  const [workspace, setWorkspace] = useState<FreestyleWorkspace>(()=>variant==='full' && typeof window!=='undefined' && new URLSearchParams(window.location.search).get('resume')==='1' && draft?.workspace ? draft.workspace : blankFreestyleWorkspace())
  const saveAllowed=useRef(false), saveAttempted=useRef(false)
  const [started,setStarted]=useState(()=>variant==='full' && typeof window!=='undefined' && new URLSearchParams(window.location.search).get('resume')==='1' && Boolean(draft?.workspace))
  const rootRef=useRef<HTMLElement>(null),expandButton=useRef<HTMLButtonElement>(null)
  const [view,setView]=useState<View>('breadboard')
  const [panelOpen,setPanelOpen]=useState(true)
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{if(expanded)rootRef.current?.focus()},[expanded])
  const [preparing,setPreparing]=useState(false)
  const generation=useRef(0)
  // Capture identity changes only when trace clears; Stop/error retain cursor timestamps.
  const traceCapture=useRef(0)
  const traceRef=useRef<TraceSample[]>([])
  const [trace,setTrace]=useState<TraceSample[]>([])
  const { boardId, doc, pinMap, language, code } = workspace
  const board = getFreestyleBoard(boardId)
  const [step, setStep] = useState<Step>('board')
  const [tools, setTools] = useState<LocalTools | null>(null)
  const [toolsChecked, setToolsChecked] = useState(false)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<{ message: string; line?: number }>()
  const [pins, setPins] = useState<Record<number, LivePinState>>()
  const [serial, setSerial] = useState('')
  const [simMs, setSimMs] = useState(0)
  const [controls, setControls] = useState<ControlState>({})
  const [notice, setNotice] = useState('')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
  const [pendingEndpoint, setPendingEndpoint] = useState<CircuitEndpointV2 | null>(null)
  const [moving, setMoving] = useState(false)
  const [sampleId, setSampleId] = useState<FreestyleSampleId>(workspace.sampleId ?? 'blink')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [draftsOpen,setDraftsOpen]=useState(false)
  const [sessionOnly,setSessionOnly]=useState(false)
  const [partFilter, setPartFilter] = useState('')
  const controllerRef = useRef<RuntimeController | null>(null)
  const latestFrame = useRef<{ pins: Record<number, LivePinState>; serial: string; simMs: number } | null>(null)
  const sentInputs = useRef('')

  useEffect(() => { let alive = true; detectLocalTools().then(result => { if (alive) { setTools(result); setToolsChecked(true) } }); return () => { alive = false } }, [])
  useEffect(() => () => {generation.current++;controllerRef.current?.stop()}, [])
  // Lưu ngay mỗi lần đổi để nút "Mở toàn màn hình" luôn mang theo mạch mới nhất.
  useEffect(() => {
    if(!saveAllowed.current)return
    try { getBrowserStorage('localStorage').setItem(FREESTYLE_STORAGE_KEY, JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() })) } catch { setSessionOnly(true);setNotice('Chưa lưu được vào trình duyệt. Mạch vẫn còn trong phiên; bản lưu trước được giữ nếu thao tác ghi thất bại.') }
  }, [workspace])
  // Gộp khung trạng thái từ engine (tới ~60 lần/s) thành ~12 lần/s cho giao diện.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(publishBufferedFrame, 80)
    return () => clearInterval(timer)
  }, [running])

  const engine = chooseEngine(boardId, language, tools)
  const evaluation = useMemo(() => evaluateFreestyleCircuit(doc, pinMap, running ? pins : undefined, controls), [doc, pinMap, pins, controls, running])
  const controlSpecs = useMemo(() => controlsFor(doc), [doc])
  const releaseMomentary = () => setControls(current=>{const pressed=controlSpecs.filter(spec=>spec.kind==='press' && current[spec.partId]);return pressed.length?{...current,...Object.fromEntries(pressed.map(spec=>[spec.partId,false]))}:current})
  useEffect(()=>{window.addEventListener('blur',releaseMomentary);return()=>window.removeEventListener('blur',releaseMomentary)},[controlSpecs])
  useEffect(()=>{releaseMomentary()},[view,boardId])

  // Đẩy mức đầu vào của mạch (nút, biến trở…) vào firmware khi thay đổi.
  useEffect(() => {
    const controller = controllerRef.current
    if (!controller || !running) return
    const key = JSON.stringify(evaluation.inputs)
    if (key === sentInputs.current) return
    sentInputs.current = key
    for (const input of evaluation.inputs) {
      controller.setDigital(input.pin, input.digital)
      controller.setAnalog(input.pin, input.analog)
    }
  }, [evaluation.inputs, running])

  function update(patch: Partial<FreestyleWorkspace>) {
    traceCapture.current++
    stop();setPins(undefined);setSerial('');setSimMs(0);setError(undefined);setStatus('');traceRef.current=[];setTrace([]);latestFrame.current=null;setPendingEndpoint(null)
    if(!saveAttempted.current){
      saveAttempted.current=true
      try {
        const storage=getBrowserStorage('localStorage'), old=storage.getItem(FREESTYLE_STORAGE_KEY)
        if(old&&!archiveFreestyle(storage,old).ok)throw Error('backup failed')
        saveAllowed.current=true
      }catch{setSessionOnly(true);setNotice('Chưa sao lưu được nháp cũ. Bàn mới chỉ dùng trong phiên; nháp cũ chưa bị ghi đè.')}
    }
    setStarted(true);setWorkspace(current=>({...current,...patch,updatedAt:new Date().toISOString()}))
  }
  const updateDoc = (next: CircuitDocV2) => update({ doc: next })

  function publishBufferedFrame() {
    const frame=latestFrame.current
    if(!frame)return
    setPins(frame.pins);setSimMs(frame.simMs);setTrace(traceRef.current)
    if(frame.serial){const chunk=frame.serial;frame.serial='';setSerial(current=>(current+chunk).slice(-MAX_SERIAL))}
  }
  function archiveBeforeReplace(): boolean {
    if(!workspace.doc.parts.length&&!workspace.doc.breadboards.length&&!workspace.code)return true
    try { if(archiveFreestyle(getBrowserStorage('localStorage'),JSON.stringify(workspace)).ok)return true }catch{/* current work remains in memory */}
    setSessionOnly(true);setNotice('Chưa sao lưu được công việc hiện tại nên chưa thay mạch. Mở Bản nháp để tải file trước.')
    return false
  }
  function stop() {
    publishBufferedFrame()
    generation.current++;setPreparing(false)
    controllerRef.current?.stop()
    controllerRef.current = null
    setRunning(false)
  }

  async function run() {
    stop()
    if(!boardId || !code.trim())return
    const runId=generation.current
    traceCapture.current++
    setPreparing(true);traceRef.current=[];setTrace([])
    setError(undefined)
    setSerial('')
    setSimMs(0)
    setPins(undefined)
    sentInputs.current = ''
    latestFrame.current = { pins: {}, serial: '', simMs: 0 }
    setStatus('Đang chuẩn bị…')
    const checked = toolsChecked ? tools : await detectLocalTools()
    if(runId!==generation.current)return
    let active = true
    const controller = await startFreestyleRun({
      boardId, language, code, tools: checked,
      onFrame: frame => {
        if(runId!==generation.current)return
        traceRef.current=appendTrace(traceRef.current,frame)
        const latest = latestFrame.current ?? { pins: {}, serial: '', simMs: 0 }
        latestFrame.current = { pins: frame.pins, serial: (latest.serial + frame.serial).slice(-MAX_SERIAL), simMs: frame.simulatedMilliseconds }
      },
      onStatus: value=>{if(runId===generation.current)setStatus(value)},
      onError: (message, line) => { if(runId!==generation.current)return;publishBufferedFrame();active=false;generation.current++;setError({message,...(line?{line}:{})});setRunning(false);setPreparing(false);setStatus('Lượt chạy đã dừng do lỗi.');controllerRef.current?.stop();controllerRef.current=null },
      onStopped: reason => { if (!active || runId!==generation.current) return; publishBufferedFrame();active = false; setStatus(reason); setRunning(false) },
    })
    if(runId!==generation.current){controller?.stop();return}
    setPreparing(false)
    if (!controller) { setRunning(false); return }
    controllerRef.current = controller
    setRunning(true)
  }

  // 2026-11-15: thư viện mở bàn bằng ?board=<id> hoặc ?part=<loại>; áp dụng một lần rồi xoá khỏi URL.
  const [searchParams, setSearchParams] = useSearchParams()
  const intentApplied = useRef(false)
  useEffect(() => {
    if (intentApplied.current) return
    const boardParam = searchParams.get('board')
    const partParam = searchParams.get('part')
    if (!boardParam && !partParam) return
    intentApplied.current = true
    let intended=workspace,changed=false
    if(boardParam){
      const canonicalBoard = getFreestyleBoardId(boardParam)
      if(canonicalBoard){intended=workspaceWithFreestyleBoard(intended,canonicalBoard);changed=true;setStep('board')}
      else setNotice(`Board ${boardParam.slice(0,100)} chưa có trên bàn tự do; không đổi mạch hiện tại.`)
    }
    const canonicalPart = partParam && (placeableParts.some(item=>item.id===partParam) ? partParam : getFreestylePartId(partParam))
    if(canonicalPart){
      const mountingDoc=isBreadboardPart(canonicalPart)&&!intended.doc.breadboards.length?{...intended.doc,breadboards:createEmptyFreestyleDoc().breadboards}:intended.doc
      const added=placePart(mountingDoc,canonicalPart)
      if(added.partId){intended={...intended,doc:added.doc,sampleId:undefined};changed=true;setSelectedPartId(added.partId);setStep('parts')}
      else setNotice(added.error??'Chưa thêm được linh kiện.')
    }
    if(changed && (!boardParam || !workspace.boardId || archiveBeforeReplace()))update(intended)
    const next = new URLSearchParams(searchParams)
    next.delete('board'); next.delete('part')
    setSearchParams(next, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function chooseBoard(nextId: string) {
    if(boardId && boardId!==nextId && !archiveBeforeReplace())return
    const next=workspaceWithFreestyleBoard(workspace,nextId)
    update(next)
    if(!next.sampleId && code.trim())setNotice('Đã giữ nguyên code tự viết và dây nối. Kiểm tra lại ngôn ngữ, số chân và giới hạn của board mới trước khi chạy.')
  }

  function loadSample(id: FreestyleSampleId) {
    if(!boardId){setNotice('Chọn board trước khi dựng mạch mẫu.');setStep('board');return}
    if(!archiveBeforeReplace())return
    stop()
    const { doc: sampleDoc, pinMap: samplePins } = buildSampleCircuit(id, boardId)
    setControls({})
    setSelectedPartId(null)
    setSelectedWireId(null)
    update({ doc: sampleDoc, pinMap: samplePins, sampleId: id, code: sampleCode(id, boardId, language, samplePins) })
    setNotice(`Đã dựng mạch mẫu “${freestyleSamples.find(item => item.id === id)?.title}”. Bấm ▶ Chạy để xem.`)
  }

  function chooseLanguage(next: FreestyleLanguage) {
    stop()
    const sample=workspace.sampleId && code===sampleCode(workspace.sampleId,boardId,language,pinMap) ? workspace.sampleId : undefined
    update({ language: next, ...(sample?{code:sampleCode(sample,boardId,next,pinMap)}:{}) })
  }

  function setPin(signal: SignalPin, pin: number) { update({ pinMap: { ...pinMap, [signal]: pin } as PinMap }) }

  function addPart(type: string, at?: { col: number; row: number }) {
    const mountingDoc=isBreadboardPart(type)&&!doc.breadboards.length?{...doc,breadboards:createEmptyFreestyleDoc().breadboards}:doc
    const result = placePart(mountingDoc, type, at)
    if (!result.partId) { setNotice(result.error ?? 'Không thêm được linh kiện.'); return }
    setSelectedPartId(result.partId)
    setNotice(`Đã thêm ${result.partId}. Nối dây: chọn chân/lỗ đầu rồi chọn điểm đích (hoặc kéo giữa hai điểm).`)
    update({ doc: result.doc, sampleId: undefined })
  }

  function dropPart(event: DragEvent<HTMLDivElement>) {
    const type = event.dataTransfer.getData('application/x-machmo-part')
    if (!type) return
    event.preventDefault()
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement | SVGElement>('[data-circuit-endpoint]')
    const hole = parseHole(target?.getAttribute('data-circuit-endpoint') ?? '')
    addPart(type, hole?.kind === 'grid' ? { col: hole.column, row: rows.indexOf(hole.row) } : undefined)
  }

  function selectEndpoint(endpoint: CircuitEndpointV2) {
    if (moving && selectedPartId && endpoint.kind === 'hole') {
      const hole = parseHole(endpoint.holeId)
      if (hole?.kind === 'grid') {
        const result = movePart(doc, selectedPartId, { col: hole.column, row: rows.indexOf(hole.row) })
        if (result.error) setNotice(result.error)
        else { updateDoc(result.doc); setNotice(`Đã chuyển ${selectedPartId} tới ${endpoint.holeId}.`) }
      }
      setMoving(false)
      setPendingEndpoint(null)
      return
    }
    setPendingEndpoint(endpoint)
    if (endpoint.kind === 'pin') setSelectedPartId(endpoint.partId)
  }

  const selectedPart = doc.parts.find(part => part.id === selectedPartId)
  const selectedDefinition = componentRegistry.find(item => item.id === selectedPart?.type)
  const wiredSignals = useMemo(() => {
    const index = createNetIndexV2(doc)
    return SIGNAL_PINS.filter(signal => signal === 'ledOut' || signal === 'input' || (index.netOf(`board:${signal}`)?.wireIds.size ?? 0) > 0)
  }, [doc])

  const wireSignals = useMemo(() => {
    const map = new Map<string, WireSignalLabel>()
    if (!running) return map
    const index = createNetIndexV2(doc)
    for (const wire of doc.wires) {
      const key = wire.from.kind === 'pin' ? index.netOf(`${wire.from.partId}:${wire.from.pinId}`)?.key : index.netOf(wire.from.holeId)?.key
      const level = key ? evaluation.netLevels.get(key) : undefined
      if (!level || level.level === 'divider' || level.level === 'float') continue
      if (level.rail) map.set(wire.id, { text: level.rail === 'gnd' ? 'GND' : 'VCC', tone: level.rail === 'gnd' ? 'ground' : 'power', flowing: false })
      else map.set(wire.id, { text: level.pwm !== undefined ? `PWM ${Math.round(level.pwm * 100)}%` : level.level === 'high' ? 'HIGH' : 'LOW', tone: level.level === 'high' ? 'high' : 'low', flowing: level.level === 'high' })
    }
    return map
  }, [doc, evaluation.netLevels, running])

  const legend: FlowLegendEntry[] = useMemo(() => [...wireSignals.entries()].filter(([, label]) => label.tone === 'high' || label.tone === 'low').slice(0, 8).map(([wireId, label]) => ({ wireId, label: `${wireId} · ${label.text}`, signal: label.tone === 'high' ? 'high' : 'low', direction: 'none' })), [wireSignals])
  const serialEntries: SerialEntry[] = useMemo(() => serial.split(/\r?\n/).filter(Boolean).slice(-12).map((text, index) => ({ atMs: index, text })), [serial])
  const outputPins = pins ? Object.entries(pins).filter(([, state]) => state.mode === 'output').map(([pin, state]) => ({ pin: Number(pin), ...state })).sort((a, b) => a.pin - b.pin) : []
  const lineCount = code.split('\n').length
  const motorProtection = useMemo(() => getMotorProtection(doc), [doc])
  const visibleParts = placeableParts.filter(part => !partFilter || `${part.label} ${part.category}`.toLowerCase().includes(partFilter.toLowerCase()))
  const HeadingTag = variant === 'full' ? 'h1' : 'h2'

  return <section className={`freestyle-bench freestyle-${variant}${expanded?' is-expanded':''}${panelOpen?'':' panel-closed'}${draft&&!started?' has-draft':''}`} ref={rootRef} tabIndex={-1} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} onKeyDown={event=>{if(!expanded||(event.target instanceof Element&&event.target.closest('dialog[open]')))return;if(event.key==='Escape'){event.preventDefault();setExpanded(false);expandButton.current?.focus()}if(event.key==='Tab'){const items=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a,input,select,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length>0);const first=items[0],last=items.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}} data-view={view} data-step={step} aria-labelledby="freestyle-title">
    <GuideContextBridge snapshot={{owner:"freestyle",priority:70,lesson:workspace.sampleId?freestyleSamples.find(item=>item.id===workspace.sampleId)?.title??"Mạch tự do":"Mạch tự do",board:boardId?{id:boardId,name:board.name}:undefined,part:selectedPart&&selectedDefinition?{id:selectedPart.id,type:selectedPart.type,name:selectedPart.type==="resistor"?"Điện trở":selectedDefinition.label,summary:selectedDefinition.explanation,pins:selectedDefinition.pins.map(pin=>pin.label),note:selectedDefinition.safetyNotes}:undefined,status:running?"Runtime đang chạy":status||"Chưa chạy",issues:[...(error?[error.message]:[]),...evaluation.warnings].slice(0,3)}} />
    <header className="freestyle-head">
      <div className="freestyle-title">
        <p className="eyebrow">BÀN LẮP MẠCH TỰ DO</p>
        <HeadingTag id="freestyle-title">Tự lắp mạch, tự viết code, bấm Chạy</HeadingTag>
        {!doc.parts.length&&notice&&<p className="freestyle-notice" role="status">{notice}</p>}
        {sessionOnly&&<p className="freestyle-save-status" role="status">Chưa lưu vào trình duyệt · công việc trong phiên vẫn được giữ. Hãy tải bản nháp để sao lưu.</p>}
      </div>
      <div className="freestyle-head-actions">
        <label className="freestyle-sample">Mạch mẫu
          <select value={sampleId} onChange={event => setSampleId(event.target.value as FreestyleSampleId)}>{freestyleSamples.map(sample => <option key={sample.id} value={sample.id}>{sample.title}</option>)}</select>
        </label>
        <button type="button" className="freestyle-button" disabled={!boardId} onClick={() => loadSample(sampleId)}>Dựng mạch mẫu</button>
        <button type="button" className="freestyle-button" onClick={() => { if(!archiveBeforeReplace())return;setControls({});setSelectedPartId(null);setSelectedWireId(null);update(blankFreestyleWorkspace());setStep('board');setView('breadboard');setPanelOpen(true);setNotice('Bàn mới trống. Chọn board hoặc thêm breadboard để bắt đầu.') }}>Bàn trống</button>
        <button type="button" className="freestyle-button" onClick={() => setDraftsOpen(true)}>Bản nháp</button>
        <button type="button" className="freestyle-button" onClick={() => setToolsOpen(true)}>Công cụ</button>
        {variant === 'home' ? sessionOnly ? <button className="freestyle-button" onClick={()=>setExpanded(true)}>Mở toàn màn hình <span aria-hidden="true">↗</span></button> : <Link className="freestyle-button" to={started?'/build/freestyle?resume=1':'/build/freestyle'}>Mở toàn màn hình <span aria-hidden="true">↗</span></Link> : <Link className="freestyle-button" to="/">Về trang chủ</Link>}
      </div>
    </header>

    <div className="freestyle-steps" role="tablist" aria-label="Các bước dùng bàn lắp mạch">
      {steps.map((item, index) => <button key={item.id} id={`freestyle-step-${item.id}`} type="button" role="tab" aria-selected={step === item.id} aria-controls={item.id==='observe'?'freestyle-observe-panel':'freestyle-step-panel'} tabIndex={step === item.id ? 0 : -1} onClick={() => {setStep(item.id);setPanelOpen(true)}} onKeyDown={event => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (!delta) return
        event.preventDefault()
        const next = steps[(index + delta + steps.length) % steps.length]
        setStep(next.id);setPanelOpen(true)
        document.getElementById(`freestyle-step-${next.id}`)?.focus()
      }}><span className="freestyle-step-index">{index + 1}</span>{item.label}</button>)}
    </div>

    {draft && !started && <div className="freestyle-draft" role="status"><span>{draft.workspace?'Có một bản nháp đã lưu trên máy này. Bàn hiện tại bắt đầu trống.':'Bản lưu cũ chưa đọc được; dữ liệu gốc được giữ nguyên.'}</span>{draft.workspace&&<button className="freestyle-button" onClick={()=>{stop();setWorkspace(draft.workspace!);setStarted(true);setNotice('Đã mở bản nháp, giữ nguyên mạch và code.');setStep('parts')}}>Mở bản nháp đã lưu</button>}</div>}
    <div className="freestyle-workbar">
      <div className="freestyle-view-tabs" role="group" aria-label="Chế độ xem mạch">{([['breadboard','Lắp mạch 2D'],['schematic','Schematic'],['3d','Lắp mạch 3D'],['wave','Dạng sóng']] as const).map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>{setView(id);setPanelOpen(false)}}>{label}</button>)}</div>
      <div className="freestyle-work-actions"><button className="freestyle-button" aria-expanded={panelOpen} onClick={()=>setPanelOpen(!panelOpen)}>{panelOpen?'Ẩn bảng thao tác':'Mở bảng thao tác'}</button><button ref={expandButton} className="freestyle-button" aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Thu gọn bàn':'Mở rộng bàn'}</button><button type="button" disabled={!boardId||!code.trim()} className={`freestyle-run-button ${running?'is-running':''}`} onClick={running||preparing?stop:run}>{running||preparing?'■ Dừng':'▶ Chạy'}</button></div>
        {controlSpecs.length > 0 && <div className="freestyle-card freestyle-input-dock"><h3>Đầu vào</h3>{controlSpecs.map(spec => {
          if (spec.kind === 'slider') {
            const value = typeof controls[spec.partId] === 'number' ? Number(controls[spec.partId]) : 0.5
            return <label key={spec.partId} className="freestyle-slider">{spec.label} · {Math.round(value * 100)} %<input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={event => setControls(current => ({ ...current, [spec.partId]: Number(event.target.value) / 100 }))} /></label>
          }
          if (spec.kind === 'toggle') return <label key={spec.partId} className="freestyle-toggle"><input type="checkbox" checked={Boolean(controls[spec.partId])} onChange={event => setControls(current => ({ ...current, [spec.partId]: event.target.checked }))} />{spec.label}</label>
          const press = (pressed: boolean) => setControls(current => ({ ...current, [spec.partId]: pressed }))
          return <button key={spec.partId} type="button" className="freestyle-press" aria-pressed={Boolean(controls[spec.partId])} onPointerDown={() => press(true)} onPointerUp={() => press(false)} onPointerLeave={() => press(false)} onPointerCancel={() => press(false)} onBlur={() => press(false)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); press(true) } }} onKeyUp={() => press(false)}>{spec.label}</button>
        })}</div>}
    </div>
    <div className="freestyle-layout">
      <div id="freestyle-step-panel" role="tabpanel" aria-labelledby={`freestyle-step-${step}`} className="freestyle-panel" hidden={step==='observe'}>
        {step === 'board' && <div className="freestyle-board-step">
          <fieldset className="freestyle-board-list">
            <legend>Board / MCU</legend>
            {freestyleBoards.map(item => <label key={item.id} className={item.id === boardId ? 'is-selected' : ''}>
              <input type="radio" name="freestyle-board" value={item.id} checked={item.id === boardId} onChange={() => chooseBoard(item.id)} />
              <span><strong>{item.name}</strong><small>{item.logic} · {item.realEngine === 'avr' ? 'biên dịch thật (arduino-cli)' : item.realEngine === 'micropython' ? 'MicroPython thật' : 'trình thông dịch'}</small></span>
            </label>)}
          </fieldset>
          {boardId && <><div className="freestyle-pinmap">
            <h3>Chân board dùng trong mạch</h3>
            <p>Dây nối vào chân “GPIO LED”, “GPIO IN”… của board. Chọn số chân thật tương ứng trong code.</p>
            {wiredSignals.map(signal => <label key={signal}>{SIGNAL_PIN_LABELS[signal]}
              <select value={pinMap[signal]} onChange={event => setPin(signal, Number(event.target.value))}>{availablePins(boardId).map(pin => <option key={pin} value={pin}>{pinDisplayName(boardId, pin)}</option>)}</select>
            </label>)}
          </div>
          <p className="freestyle-note">{board.limitation}</p></>}
        </div>}

        {step === 'parts' && <div className="freestyle-parts-step">
          <button className="freestyle-button" disabled={doc.breadboards.length>0} onClick={()=>{const bb=createEmptyFreestyleDoc();updateDoc({...doc,breadboards:bb.breadboards})}}>Thêm breadboard</button>
          <label className="freestyle-filter">Tìm linh kiện<input type="search" value={partFilter} onChange={event => setPartFilter(event.target.value)} placeholder="LED, nút, biến trở…" /></label>
          <p className="freestyle-hint">Kéo linh kiện thả vào một lỗ breadboard, hoặc bấm “Thêm” để tự đặt chỗ trống.</p>
          <ul className="freestyle-library" aria-label="Thư viện linh kiện">
            {visibleParts.map(part => <li key={part.id} draggable onDragStart={event => { event.dataTransfer.setData('application/x-machmo-part', part.id); event.dataTransfer.effectAllowed = 'copy' }}>
              <span aria-hidden="true" className="freestyle-part-emoji">{part.emoji}</span>
              <span className="freestyle-part-name">{part.label}<small>{part.category}</small></span>
              <button type="button" onClick={() => addPart(part.id)} aria-label={`Thêm ${part.label}`}>Thêm</button>
            </li>)}
          </ul>
          {selectedPart && selectedPart.type !== 'board' && <div className="freestyle-selected" aria-label={`Linh kiện đang chọn ${selectedPart.id}`}>
            <h3>{selectedDefinition?.label ?? selectedPart.type} <code>{selectedPart.id}</code></h3>
            <p>{selectedDefinition?.safetyNotes}</p>
            <div className="freestyle-selected-actions">
              {selectedPart.mount.kind === 'breadboard' && <button type="button" aria-pressed={moving} onClick={() => { setMoving(!moving); setNotice(moving ? '' : `Chọn một lỗ breadboard để chuyển ${selectedPart.id} tới đó.`) }}>Di chuyển</button>}
              {selectedPart.mount.kind === 'breadboard' && <button type="button" onClick={() => { const result = rotatePart(doc, selectedPart.id); if (result.error) setNotice(result.error); else updateDoc(result.doc) }}>Xoay 180°</button>}
              <button type="button" onClick={() => { updateDoc(removePartAndWires(doc, selectedPart.id)); setSelectedPartId(null) }}>Xóa linh kiện</button>
            </div>
          </div>}
        </div>}

        {step === 'code' && <div className="freestyle-code-step">
          <div className="freestyle-code-toolbar">
            {board.languages.length > 1 && <label>Ngôn ngữ<select value={language} onChange={event => chooseLanguage(event.target.value as FreestyleLanguage)}>{board.languages.map(item => <option key={item} value={item}>{item === 'micropython' ? 'MicroPython' : 'Arduino C++'}</option>)}</select></label>}
            <span className="freestyle-code-board">{boardId?board.short:'Chưa chọn board'} · {language === 'micropython' ? 'MicroPython' : 'Arduino C++'}</span>
          </div>
          <div className="freestyle-editor">
            <pre className="freestyle-gutter" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index} className={error?.line === index + 1 ? 'is-error' : undefined}>{index + 1}</span>)}</pre>
            <textarea value={code} spellCheck={false} wrap="off" rows={lineCount + 1} aria-label={language === 'micropython' ? 'Mã nguồn MicroPython' : 'Mã nguồn Arduino C++'} aria-invalid={error ? true : undefined} aria-describedby={error ? 'freestyle-error' : undefined} onChange={event => { update({ code: event.target.value, sampleId:undefined }); setError(undefined) }} />
          </div>
        </div>}
      </div>

      <div className="freestyle-stage" onDragOver={event => { if (event.dataTransfer.types.includes('application/x-machmo-part')) event.preventDefault() }} onDrop={dropPart}>
        {workspace.sampleId === 'motor' && <p className="freestyle-note" role="note">{motorProtection.independentSupply && motorProtection.commonGround && motorProtection.flyback ? 'Mạch này có nguồn tải lý tưởng riêng, GND chung và diode mắc ngược song song motor.' : 'Bản nháp motor này chưa có đủ nguồn tải riêng, GND chung hoặc diode đúng chiều. Mạch đang được giữ nguyên. Hãy tải bản nháp trước khi chọn “Dựng mạch mẫu” để dùng mẫu mới.'} Hoạt cảnh chỉ minh họa đóng/ngắt; chưa tính dòng tải, sụt áp, xung ngược, nhiệt hoặc chọn định mức linh kiện thật.</p>}
        {!doc.parts.length&&!doc.breadboards.length&&view!=='wave' ? <div className="freestyle-blank"><span aria-hidden="true">＋</span><h3>Bàn của bạn, bắt đầu từ trống</h3><p>Chọn board, thêm breadboard và linh kiện; tự nối dây và viết code. Không có mạch nào được dựng sẵn.</p><button className="freestyle-run-button" onClick={()=>{setStep('board');setPanelOpen(true)}}>Chọn board</button><button className="freestyle-button" onClick={()=>{const bb=createEmptyFreestyleDoc();updateDoc({...doc,breadboards:bb.breadboards});setStep('parts');setPanelOpen(true)}}>Thêm breadboard</button></div> : view==='3d' ? <Suspense fallback={<p>Đang mở cảnh 3D…</p>}><FreestyleAssemblyView key={boardId} doc={doc} boardId={boardId} pinMap={pinMap} selectedPartId={selectedPartId} wireSignals={wireSignals} litPartIds={evaluation.litPartIds} onSelectPart={setSelectedPartId}/></Suspense> : view==='wave' ? <FreestyleWaveform captureKey={traceCapture.current} preferredPins={wiredSignals.map(role=>pinMap[role])} samples={trace} boardId={boardId} source={boardId?engine.label:'Chưa chọn runtime'} running={running}/> : view==='schematic' ? <><p className="freestyle-note">{boardId?board.name:'Chưa chọn board'} · {wiredSignals.map(role=>`${SIGNAL_PIN_LABELS[role]} = ${pinDisplayName(boardId,pinMap[role])}`).join(' · ')}</p><CircuitSchematicV2 doc={doc} boardLabel={boardId?board.short:undefined} boardPinLabels={boardId?freestylePresentation(boardId,pinMap).pinLabels:undefined} selectedKey={selectedPartId} selectedWireId={selectedWireId} onSelectPart={setSelectedPartId} onSelectWire={setSelectedWireId}/></> : <BreadboardEditor
          compact
          presentation={boardId?freestylePresentation(boardId,pinMap):undefined}
          doc={doc}
          selectedWireId={selectedWireId}
          selectedPartId={selectedPartId}
          pendingEndpoint={pendingEndpoint}
          onSelectEndpoint={selectEndpoint}
          onSelectPart={id => setSelectedPartId(id)}
          onSelectWire={setSelectedWireId}
          onCommitWire={(from, to, role) => { updateDoc(addFreestyleWire(doc, from, to, role)); setPendingEndpoint(null) }}
          onEditWireEndpoint={(id, end, endpoint) => updateDoc(editWireEndpoint(doc, id, end, endpoint).doc)}
          onSetWireRole={(id, role) => updateDoc(setWireRole(doc, id, role).doc)}
          onRemoveWire={id => { updateDoc(removeWire(doc, id).doc); setSelectedWireId(null) }}
          notice={notice}
          activeWireIds={running ? evaluation.activeWireIds : new Set()}
          litPartIds={evaluation.litPartIds}
          wireSignals={wireSignals}
        />}
        {view!=='wave' && trace.length>0 && <details className="freestyle-trace-dock"><summary>Dạng sóng đã thu · {trace.length} mẫu</summary><FreestyleWaveform captureKey={traceCapture.current} preferredPins={wiredSignals.map(role=>pinMap[role])} samples={trace} boardId={boardId} source={engine.label} running={running}/></details>}
      </div>

      <div id="freestyle-observe-panel" role="tabpanel" aria-labelledby="freestyle-step-observe" className="freestyle-observe" hidden={step!=='observe'} aria-label="Chạy và quan sát">
        <div className="freestyle-run">
          <button type="button" className={`freestyle-run-button ${running ? 'is-running' : ''}`} disabled={!boardId||!code.trim()} onClick={running||preparing ? stop : run}>{running||preparing ? '■ Dừng' : '▶ Chạy'}</button>
          <div className="freestyle-engine">
            <strong>{boardId?engine.label:'Chưa chọn runtime'}</strong>
            <span aria-live="polite">{running ? `${(simMs / 1000).toFixed(2)} s mô phỏng` : status || 'Chưa chạy'}</span>
          </div>
        </div>
        <p className="freestyle-engine-note">{boardId?engine.note:'Chọn board và viết code trước khi chạy.'}</p>
        {running && status && <p className="freestyle-status" role="status">{status}</p>}
        {error && <p id="freestyle-error" className="freestyle-error" role="alert">{error.line ? `Dòng ${error.line}: ` : ''}{error.message}</p>}
        {evaluation.warnings.map(warning => <p key={warning} className="freestyle-warning">{warning}</p>)}



        <div className="freestyle-card">
          <h3>Kết quả trên mạch</h3>
          {evaluation.outputs.length === 0 && <p className="freestyle-empty">Thêm LED, buzzer hoặc động cơ để thấy kết quả.</p>}
          <ul className="freestyle-outputs">{evaluation.outputs.map(output => {
            if (output.kind === 'led') return <li key={output.partId} data-part={output.partId} className={output.on ? 'is-on' : ''}><span className="freestyle-led" style={{ ['--brightness' as string]: String(output.brightness) }} aria-hidden="true" />{output.partId}: {output.on ? `sáng${output.brightness < 1 ? ` ${Math.round(output.brightness * 100)} %` : ''}` : 'tắt'}</li>
            if (output.kind === 'rgb') return <li key={output.partId}><span className="freestyle-led" style={{ background: `rgb(${output.color.map(value => Math.round(value * 255)).join(',')})` }} aria-hidden="true" />{output.partId}: R{Math.round(output.color[0] * 100)} G{Math.round(output.color[1] * 100)} B{Math.round(output.color[2] * 100)} %</li>
            if (output.kind === 'motor') return <li key={output.partId} className={output.direction ? 'is-on' : ''}><span className={`freestyle-motor ${output.direction ? 'is-spinning' : ''}`} style={{ ['--speed' as string]: String(output.speed || 0.01) }} aria-hidden="true">⚙</span>{output.partId}: {output.direction === 0 ? 'đứng yên' : `quay ${output.direction > 0 ? 'thuận' : 'ngược'} ${Math.round(output.speed * 100)} %`}</li>
            if (output.kind === 'buzzer') return <li key={output.partId} className={output.on ? 'is-on' : ''}><span aria-hidden="true">{output.on ? '♪' : '·'}</span>{output.partId}: {output.on ? 'đang kêu' : 'im'}</li>
            if (output.kind === 'servo') return <li key={output.partId}><span aria-hidden="true">⟳</span>{output.partId}: {output.angle === undefined ? 'chưa nhận xung servo' : `${output.angle}°`}</li>
            return <li key={output.partId}><span aria-hidden="true">▥</span>{output.partId}: đoạn sáng {output.lit.join(', ') || 'không'}</li>
          })}</ul>
          {outputPins.length > 0 && <p className="freestyle-pins">Chân OUTPUT: {outputPins.map(pin => `${pinDisplayName(boardId, pin.pin)} ${pin.pwm !== undefined ? `PWM ${Math.round(pin.pwm * 100)}%` : pin.level ? 'HIGH' : 'LOW'}`).join(' · ')}</p>}
        </div>

        <div className="freestyle-card freestyle-serial-card">
          <h3>Serial Monitor</h3>
          <pre className="freestyle-serial" aria-label="Đầu ra Serial" tabIndex={0}>{serial || 'Chưa có dữ liệu Serial.'}</pre>
        </div>
        <SignalFlowPanel code={code} serial={serialEntries} legend={legend} running={running} illustrative={false} />
        <p className="freestyle-disclaimer">Kết quả là mô phỏng logic trên máy tính, không phải đo trên mạch thật.</p>
      </div>
    </div>
    <FreestyleDraftsDialog current={workspace} open={draftsOpen} onClose={()=>setDraftsOpen(false)} onRestore={restored=>{if(!archiveBeforeReplace())return;update(restored);setDraftsOpen(false);setStep('parts');setPanelOpen(true);setNotice('Đã khôi phục bản nháp; công việc trước đó được sao lưu.')}} />
    <FreestyleToolsDrawer open={toolsOpen} onClose={() => setToolsOpen(false)} />
  </section>
}
