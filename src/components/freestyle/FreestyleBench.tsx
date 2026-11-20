import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BreadboardEditor } from '../builder/BreadboardEditor'
import { getFreestyleBoardId, getFreestylePartId } from '../../lib/catalogPracticeLinks'
import type { WireSignalLabel } from '../builder/BreadboardDiagram'
import { SignalFlowPanel } from '../builder/SignalFlowPanel'
import { componentRegistry } from '../../data/componentRegistry'
import { parseHole } from '../../lib/breadboardGrid'
import { createNetIndexV2 } from '../../lib/circuitNetsV2'
import { addWire, setWireRole, editWireEndpoint, removeWire, setPartValue } from '../../lib/circuitDocEdits'
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
import { SerialPlotter } from './SerialPlotter'
import { appendSerialPlot, createSerialPlot } from '../../lib/freestyle/serialPlot'
import { CircuitSchematicV2 } from '../builder/CircuitSchematicV2'
import { pushWireHistory, readWireLayout, type WireBend, type WireHistoryEntry } from '../../lib/freestyle/freestyleWireLayout'
import { encodeFreestyleShare } from '../../lib/freestyle/freestyleShare'
import { parseFreestyleProject, projectFileLimit } from '../../lib/freestyle/freestyleTransfer'
import { KitPartExample } from './KitPartExample'
import { isEsp32Target } from '../../lib/esp32Firmware'
import { findFreestyleSample, sampleLanguage } from '../../lib/freestyle/freestyleSampleLibrary'
import { keypadKeys } from '../../data/kitPartProfiles'
import { editParts, emptyCircuitHistory, recordCircuitEdit, takeCircuitHistory } from '../../lib/freestyle/freestyleEditHistory'
const FreestyleAssemblyView = lazy(() => import('./FreestyleAssemblyView').then(m=>({default:m.FreestyleAssemblyView})))
const Esp32UsbDialog = lazy(() => import('./Esp32UsbDialog').then(m => ({default:m.Esp32UsbDialog})))

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

function loadDraft(storageKey: string): {raw:string; workspace:FreestyleWorkspace|null}|null {
  try { const raw=getBrowserStorage('localStorage').getItem(storageKey);return raw?{raw,workspace:parseFreestyleWorkspace(raw)}:null } catch { return null }
}

type BenchProps = {
  variant?: 'home' | 'full'
  initialWorkspace?: FreestyleWorkspace
  readOnly?: boolean
  storageKey?: string
  onCopy?: () => void
}

export function FreestyleBench({ variant = 'home', initialWorkspace, readOnly = false, storageKey = FREESTYLE_STORAGE_KEY, onCopy }: BenchProps) {
  const [usbOpen, setUsbOpen] = useState(false)
  const [editorHistory, setEditorHistory] = useState(emptyCircuitHistory)
  const [selection, setSelection] = useState<string[]>([])
  const [shortcutHelp, setShortcutHelp] = useState(false)
  const [draft] = useState(() => readOnly ? null : loadDraft(storageKey))
  const [workspace, setWorkspace] = useState<FreestyleWorkspace>(() => initialWorkspace ?? (variant==='full' && typeof window!=='undefined' && new URLSearchParams(window.location.search).get('resume')==='1' && draft?.workspace ? draft.workspace : blankFreestyleWorkspace()))
  const dedicatedDraft = storageKey !== FREESTYLE_STORAGE_KEY && Boolean(draft?.workspace)
  const saveAllowed=useRef(dedicatedDraft && !readOnly), saveAttempted=useRef(dedicatedDraft)
  const lastSavedRaw = useRef(draft?.raw ?? null)
  const [started,setStarted]=useState(()=>Boolean(initialWorkspace) || (variant==='full' && typeof window!=='undefined' && new URLSearchParams(window.location.search).get('resume')==='1' && Boolean(draft?.workspace)))
  const rootRef=useRef<HTMLElement>(null),expandButton=useRef<HTMLButtonElement>(null)
  const workbarRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const selectedPartRef = useRef<HTMLDivElement>(null)
  const boardPointer = useRef(false)
  const [view,setView]=useState<View>('breadboard')
  const [panelOpen,setPanelOpen]=useState(readOnly || !started)
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{if(expanded)rootRef.current?.focus()},[expanded])
  const [preparing,setPreparing]=useState(false)
  const generation=useRef(0)
  // Capture identity changes only when trace clears; Stop/error retain cursor timestamps.
  const traceCapture=useRef(0)
  const traceRef=useRef<TraceSample[]>([])
  const [trace,setTrace]=useState<TraceSample[]>([])
  const [tracePopout, setTracePopout] = useState(false)
  const { boardId, doc, pinMap, language, code } = workspace
  const board = getFreestyleBoard(boardId)
  const [step, setStep] = useState<Step>(readOnly ? 'code' : started ? 'parts' : 'board')
  const activeSteps = readOnly ? steps.filter(item => item.id === 'code' || item.id === 'observe') : steps
  const [tools, setTools] = useState<LocalTools | null>(null)
  const [toolsChecked, setToolsChecked] = useState(false)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<{ message: string; line?: number }>()
  const [pins, setPins] = useState<Record<number, LivePinState>>()
  const [serial, setSerial] = useState('')
  const serialPlotRef = useRef(createSerialPlot())
  const [serialPlot, setSerialPlot] = useState(serialPlotRef.current)
  const [serialPlotOpen, setSerialPlotOpen] = useState(false)
  const [simMs, setSimMs] = useState(0)
  const [controls, setControls] = useState<ControlState>({})
  const [notice, setNotice] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [shareStatus, setShareStatus] = useState('')
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null)
  const [wireHistory, setWireHistory] = useState<WireHistoryEntry[]>([])
  const draftImportRequest = useRef(0)
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

  const useLocalRuntime = !readOnly || language === 'micropython'
  useEffect(() => {
    if (!useLocalRuntime) return
    let alive = true
    void detectLocalTools().then(result => { if (alive) { setTools(result); setToolsChecked(true) } })
    return () => { alive = false }
  }, [useLocalRuntime])
  useEffect(() => () => {generation.current++;controllerRef.current?.stop()}, [])
  // Lưu ngay mỗi lần đổi để nút "Mở toàn màn hình" luôn mang theo mạch mới nhất.
  useEffect(() => {
    if(!saveAllowed.current)return
    try {
      const storage = getBrowserStorage('localStorage')
      if (storage.getItem(storageKey) !== lastSavedRaw.current) {
        saveAllowed.current = false
        setSessionOnly(true)
        setNotice('Bản nháp đã đổi ở tab khác. Tải mạch đang mở trong Bản nháp để giữ công việc của tab này.')
        return
      }
      const raw = JSON.stringify(workspace)
      storage.setItem(storageKey, raw)
      lastSavedRaw.current = raw
      setSessionOnly(false)
    } catch { setSessionOnly(true);setNotice('Chưa lưu được vào trình duyệt. Mạch vẫn còn trong phiên; bản lưu trước được giữ nếu thao tác ghi thất bại.') }
  }, [workspace])
  // Gộp khung trạng thái từ engine (tới ~60 lần/s) thành ~12 lần/s cho giao diện.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(publishBufferedFrame, 80)
    return () => clearInterval(timer)
  }, [running])

  const engine = chooseEngine(boardId, language, useLocalRuntime ? tools : null)
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

  function update(patch: Partial<FreestyleWorkspace>, options: { wireAction?: boolean; renderOnly?: boolean; historyReplay?: boolean } = {}) {
    if (readOnly) return
    draftImportRequest.current++
    if (!options.historyReplay) {
      if (patch.boardId!==undefined || patch.code!==undefined || patch.language!==undefined) {
        setEditorHistory(emptyCircuitHistory())
        setSelection([])
      }
      else if ((patch.doc && patch.doc!==doc) || Object.hasOwn(patch,'wireLayout')) setEditorHistory(previous => recordCircuitEdit(previous,workspace))
    }
    if (!options.wireAction && (patch.doc || patch.boardId !== undefined)) setWireHistory([])
    if (!options.renderOnly) {
      traceCapture.current++
      setTracePopout(false)
      stop();setPins(undefined);setSerial('');setSimMs(0);setError(undefined);setStatus('');traceRef.current=[];setTrace([]);latestFrame.current=null;setPendingEndpoint(null)
      serialPlotRef.current = createSerialPlot();setSerialPlot(serialPlotRef.current)
    }
    if(!saveAttempted.current){
      saveAttempted.current=true
      try {
        const storage=getBrowserStorage('localStorage'), old=storage.getItem(storageKey)
        if (old !== lastSavedRaw.current) throw Error('previous draft changed')
        if(old&&!archiveFreestyle(storage,old).ok)throw Error('backup failed')
        saveAllowed.current=true
      }catch{setSessionOnly(true);setNotice('Chưa sao lưu được nháp cũ. Bàn mới chỉ dùng trong phiên; nháp cũ chưa bị ghi đè.')}
    }
    setStarted(true);setWorkspace(current=>({...current,...patch,
      ...(patch.doc ? { wireLayout: readWireLayout(Object.hasOwn(patch, 'wireLayout') || patch.version ? patch.wireLayout : current.wireLayout, patch.doc.wires) } : {}),
      updatedAt:new Date().toISOString()}))
  }
  const updateDoc = (next: CircuitDocV2) => update({ doc: next })

  function selectParts(ids: string[]) {
    setSelection(ids)
    setSelectedPartId(ids.at(-1) ?? null)
    setSelectedWireId(null)
  }

  function choosePart(id: string, extend = false) {
    if (!extend) { selectParts([id]); return }
    const current = selection.length ? selection : selectedPartId ? [selectedPartId] : []
    selectParts(current.includes(id) ? current.filter(item=>item!==id) : [...current,id])
  }

  function replayCircuit(direction: 'undo' | 'redo') {
    const result = takeCircuitHistory(editorHistory,workspace,direction)
    if (!result) return
    setEditorHistory(result.history)
    selectParts([])
    setSelectedWireId(null);setPendingEndpoint(null);setWireHistory([])
    update(result.entry,{historyReplay:true,renderOnly:result.entry.doc===doc})
    setNotice(direction==='undo'?'Đã hoàn tác thay đổi mạch.':'Đã làm lại thay đổi mạch.')
  }

  function changeSelected(action: Parameters<typeof editParts>[2]) {
    const ids = selection.length ? selection : selectedPartId ? [selectedPartId] : []
    const result = editParts(doc,ids,action)
    if (result.error) { setNotice(result.error); return }
    if (result.doc===doc) return
    updateDoc(result.doc)
    selectParts(result.ids)
  }

  function benchKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('dialog[open]'))) return
    if (expanded && event.key==='Escape') { event.preventDefault();setExpanded(false);expandButton.current?.focus();return }
    if (expanded && event.key==='Tab') {
      const items=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a,input,select,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length>0)
      const first=items[0],last=items.at(-1)
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    }
    if (readOnly || event.altKey || (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]'))) return
    const key=event.key.toLowerCase(), mod=event.ctrlKey||event.metaKey
    if (mod && key==='z') { event.preventDefault();replayCircuit(event.shiftKey?'redo':'undo');return }
    if (mod && key==='d' && selectedPartId) { event.preventDefault();changeSelected('duplicate');return }
    if (mod) return
    if (key==='?') { event.preventDefault();setShortcutHelp(previous=>!previous);return }
    if (key==='delete' && selectedWireId) { event.preventDefault();updateWireDoc(removeWire(doc,selectedWireId).doc);setSelectedWireId(null);return }
    if (!selectedPartId) return
    if (key==='delete'||key==='r') { event.preventDefault();changeSelected(key==='delete'?'remove':'rotate');return }
    const directions: Record<string,{column:number;row:number}> = {arrowleft:{column:-1,row:0},arrowright:{column:1,row:0},arrowup:{column:0,row:-1},arrowdown:{column:0,row:1}}
    const direction = directions[key]
    if (direction) { event.preventDefault();changeSelected(direction) }
  }

  async function createShare() {
    setShareUrl('')
    setShareStatus('')
    try {
      const target = new URL('/app/lab/freestyle', window.location.origin)
      target.hash = await encodeFreestyleShare(workspace)
      setShareUrl(target.href)
    } catch (reason) {
      setShareStatus(reason instanceof Error ? reason.message : 'Chưa tạo được liên kết mạch.')
    }
  }

  function updateWireDoc(next: CircuitDocV2) {
    if (next === doc || JSON.stringify(next.wires) === JSON.stringify(doc.wires)) return
    setWireHistory(current => pushWireHistory(current, doc, workspace.wireLayout))
    update({ doc: next }, { wireAction: true })
  }

  function changeWireBend(id: string, bend: WireBend | null) {
    if (!doc.wires.some(wire => wire.id === id)) return
    if (JSON.stringify(workspace.wireLayout?.[id] ?? null) === JSON.stringify(bend)) return
    const wireLayout = { ...workspace.wireLayout }
    if (bend) wireLayout[id] = bend
    else delete wireLayout[id]
    setWireHistory(current => pushWireHistory(current, doc, workspace.wireLayout))
    update({ wireLayout: readWireLayout(wireLayout, doc.wires) }, { wireAction: true, renderOnly: true })
  }

  function undoWire() {
    const previous = wireHistory.at(-1)
    if (!previous) return
    const renderOnly = previous.doc === doc
    setWireHistory(current => current.slice(0, -1))
    update({ ...(renderOnly ? {} : { doc: previous.doc }), wireLayout: previous.wireLayout }, { wireAction: true, renderOnly })
    setSelectedWireId(null);setPendingEndpoint(null)
    setNotice('Đã hoàn tác thao tác dây gần nhất. Code giữ nguyên. Lịch sử tối đa 30 thao tác trong phiên này.')
  }

  async function importDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const request = ++draftImportRequest.current
    if (file.size > projectFileLimit) { setNotice('File nháp quá lớn (tối đa 2 MiB). Mạch hiện tại được giữ.'); return }
    try {
      const restored = parseFreestyleProject(await file.text())
      if (draftImportRequest.current !== request) return
      if (!restored) { setNotice('Không đọc được file nháp. Mạch hiện tại được giữ.'); return }
      if (!archiveBeforeReplace()) return
      update({ ...restored, wireLayout: restored.wireLayout })
      setSelectedWireId(null);setSelectedPartId(null);setView('breadboard');setStep('parts');setPanelOpen(false)
      setNotice('Đã nhập bản nháp cùng đường đi dây. Công việc trước đó đã được sao lưu trên máy này.')
    } catch { if (draftImportRequest.current === request) setNotice('Không đọc được file nháp. Mạch hiện tại được giữ.') }
  }

  function publishBufferedFrame() {
    const frame=latestFrame.current
    if(!frame)return
    setPins(frame.pins);setSimMs(frame.simMs);setTrace(traceRef.current)
    setSerialPlot(serialPlotRef.current)
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
    if(findFreestyleSample(workspace.sampleId)?.mode === 'wiring') { setNotice('Mẫu này dùng để xem cách lắp và đọc sketch. Runtime hiện tại chưa chạy được bài này.'); return }
    const runId=generation.current
    setTracePopout(view !== 'wave')
    traceCapture.current++
    setPreparing(true);traceRef.current=[];setTrace([])
    setError(undefined)
    setSerial('')
    serialPlotRef.current = createSerialPlot();setSerialPlot(serialPlotRef.current)
    setSimMs(0)
    setPins(undefined)
    sentInputs.current = ''
    latestFrame.current = { pins: {}, serial: '', simMs: 0 }
    setStatus('Đang chuẩn bị…')
    // Shared Arduino code stays in the browser's restricted interpreter until copied explicitly.
    const checked = !useLocalRuntime ? null : toolsChecked ? tools : await detectLocalTools()
    if(runId!==generation.current)return
    let active = true
    const controller = await startFreestyleRun({
      boardId, language, code, tools: checked,
      onFrame: frame => {
        if(runId!==generation.current)return
        traceRef.current=appendTrace(traceRef.current,frame)
        serialPlotRef.current = appendSerialPlot(serialPlotRef.current, frame.serial)
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
    if (intentApplied.current || initialWorkspace || readOnly) return
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
    if (changed && (!boardParam || !workspace.boardId || archiveBeforeReplace())) {
      update(intended)
      revealMobileCircuit()
    }
    const next = new URLSearchParams(searchParams)
    next.delete('board'); next.delete('part')
    setSearchParams(next, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function revealMobileCircuit() {
    if (!panelOpen || !window.matchMedia('(max-width: 767px)').matches) return
    setView('breadboard')
    setTracePopout(false)
    setPanelOpen(false)
    requestAnimationFrame(() => {
      stageRef.current?.focus({ preventScroll: true })
      workbarRef.current?.scrollIntoView({ block: 'start' })
    })
  }

  function chooseBoard(nextId: string, reveal: boolean) {
    if(boardId && boardId!==nextId && !archiveBeforeReplace())return
    const next=workspaceWithFreestyleBoard(workspace,nextId)
    update(next)
    if (reveal) revealMobileCircuit()
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
    const nextLanguage=sampleLanguage(id,language)
    update({ doc: sampleDoc, wireLayout: undefined, pinMap: samplePins, sampleId: id, language:nextLanguage, code: sampleCode(id, boardId, nextLanguage, samplePins) })
    const sample=findFreestyleSample(id)
    setNotice(`Đã dựng mạch mẫu “${sample?.title}”. ${sample?.mode==='wiring'?'Xem cách lắp và sketch tham khảo.':'Bấm ▶ Chạy để xem.'}`)
  }

  function chooseLanguage(next: FreestyleLanguage) {
    stop()
    const sample=workspace.sampleId && code===sampleCode(workspace.sampleId,boardId,language,pinMap) ? workspace.sampleId : undefined
    if (sample && sampleLanguage(sample,next)!==next) { setNotice('Mạch mẫu này có sketch Arduino C++. Mở bàn mới để viết chương trình MicroPython.'); return }
    update({ language: next, ...(sample?{code:sampleCode(sample,boardId,next,pinMap)}:{}) })
  }

  function setPin(signal: SignalPin, pin: number) { update({ pinMap: { ...pinMap, [signal]: pin } as PinMap }) }

  function addPart(type: string, at?: { col: number; row: number }) {
    const mountingDoc=isBreadboardPart(type)&&!doc.breadboards.length?{...doc,breadboards:createEmptyFreestyleDoc().breadboards}:doc
    const result = placePart(mountingDoc, type, at)
    if (!result.partId) { setNotice(result.error ?? 'Không thêm được linh kiện.'); return false }
    setSelectedPartId(result.partId)
    setNotice(`Đã thêm ${result.partId}. Nối dây: chọn chân/lỗ đầu rồi chọn điểm đích (hoặc kéo giữa hai điểm).`)
    update({ doc: result.doc, sampleId: undefined })
    return true
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
  const preferredTracePins = wiredSignals.map(role => pinMap[role])
  if (pendingEndpoint?.kind === 'pin' && doc.parts.some(part => part.id === pendingEndpoint.partId && part.type === 'board')) {
    const role = SIGNAL_PINS.find(pin => pin === pendingEndpoint.pinId)
    if (role) preferredTracePins.unshift(pinMap[role])
  }
  const HeadingTag = variant === 'full' ? 'h1' : 'h2'
  const activeSample = findFreestyleSample(workspace.sampleId)
  const readyToRun = Boolean(boardId && code.trim() && activeSample?.mode !== 'wiring')

  const serialPlotVisible = panelOpen && step === 'observe' && serialPlotOpen
  const showTracePopout = tracePopout && view !== 'wave' && trace.length > 0 && !serialPlotVisible

  return <section className={`freestyle-bench freestyle-${variant}${expanded?' is-expanded':''}${panelOpen?'':' panel-closed'}${draft&&!started?' has-draft':''}`} ref={rootRef} tabIndex={-1} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} onKeyDown={benchKeyDown} data-view={view} data-step={step} aria-labelledby="freestyle-title">
    <GuideContextBridge snapshot={{owner:"freestyle",priority:70,lesson:workspace.sampleId?freestyleSamples.find(item=>item.id===workspace.sampleId)?.title??"Mạch tự do":"Mạch tự do",board:boardId?{id:boardId,name:board.name}:undefined,part:selectedPart&&selectedDefinition?{id:selectedPart.id,type:selectedPart.type,name:selectedPart.type==="resistor"?"Điện trở":selectedDefinition.label,summary:selectedDefinition.explanation,pins:selectedDefinition.pins.map(pin=>pin.label),note:selectedDefinition.safetyNotes}:undefined,status:running?"Runtime đang chạy":status||"Chưa chạy",issues:[...(error?[error.message]:[]),...evaluation.warnings].slice(0,3)}} />
    <header className="freestyle-head">
      <div className="freestyle-title">
        <p className="eyebrow">BÀN LẮP MẠCH TỰ DO</p>
        <HeadingTag id="freestyle-title">{readOnly ? 'Mạch chia sẻ · chỉ đọc' : 'Tự lắp mạch, tự viết code, bấm Chạy'}</HeadingTag>
        {!doc.parts.length&&notice&&<p className="freestyle-notice" role="status">{notice}</p>}
        {sessionOnly&&<p className="freestyle-save-status" role="status">Chưa lưu vào trình duyệt · công việc trong phiên vẫn được giữ. Hãy tải bản nháp để sao lưu.</p>}
      </div>
      <div className="freestyle-head-actions">
        {readOnly ? <button type="button" className="freestyle-button" onClick={onCopy}>Mở bản sao để sửa</button> : <>
        <label className="freestyle-sample">Mạch mẫu
          <select value={sampleId} onChange={event => setSampleId(event.target.value as FreestyleSampleId)}>{[...new Set(freestyleSamples.map(sample=>sample.level))].map(level=><optgroup label={level} key={level}>{freestyleSamples.filter(sample=>sample.level===level).map(sample => <option key={sample.id} value={sample.id}>{sample.title}</option>)}</optgroup>)}</select>
        </label>
        <button type="button" className="freestyle-button" disabled={!boardId} onClick={() => loadSample(sampleId)}>Dựng mạch mẫu</button>
        <button type="button" className="freestyle-button" onClick={() => { if(!archiveBeforeReplace())return;setControls({});setSelectedPartId(null);setSelectedWireId(null);update(blankFreestyleWorkspace());setStep('board');setView('breadboard');setPanelOpen(true);setNotice('Bàn mới trống. Chọn board hoặc thêm breadboard để bắt đầu.') }}>Bàn trống</button>
        <button type="button" className="freestyle-button" onClick={() => setDraftsOpen(true)}>Bản nháp</button>
        <button type="button" className="freestyle-button" onClick={() => setToolsOpen(true)}>Công cụ</button>
        <button type="button" className="freestyle-button" disabled={!boardId} onClick={() => void createShare()}>Chia sẻ mạch</button>
        </>}
        {variant === 'home' ? sessionOnly ? <button className="freestyle-button" onClick={()=>setExpanded(true)}>Mở toàn màn hình <span aria-hidden="true">↗</span></button> : <Link className="freestyle-button" to={started?'/build/freestyle?resume=1':'/build/freestyle'}>Mở toàn màn hình <span aria-hidden="true">↗</span></Link> : <Link className="freestyle-button" to="/">Về trang chủ</Link>}
      </div>
    </header>
    {!readOnly && (shareUrl || shareStatus) && <div className="freestyle-card freestyle-share-link">
      {shareUrl && <>
        <label>Liên kết chỉ đọc<input readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} /></label>
        <button type="button" className="freestyle-button" onClick={async () => {
          try { await navigator.clipboard.writeText(shareUrl); setShareStatus('Đã sao chép liên kết mạch.') }
          catch { setShareStatus('Chọn liên kết rồi sao chép bằng bàn phím.') }
        }}>Sao chép liên kết</button>
      </>}
      {shareStatus && <p role="status">{shareStatus}</p>}
    </div>}

    <div className="freestyle-steps" role="tablist" aria-label="Các bước dùng bàn lắp mạch">
      {activeSteps.map((item, index) => <button key={item.id} id={`freestyle-step-${item.id}`} type="button" role="tab" aria-selected={step === item.id} aria-controls={item.id==='observe'?'freestyle-observe-panel':'freestyle-step-panel'} tabIndex={step === item.id ? 0 : -1} onClick={() => {setStep(item.id);setPanelOpen(true)}} onKeyDown={event => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (!delta) return
        event.preventDefault()
        const next = activeSteps[(index + delta + activeSteps.length) % activeSteps.length]
        setStep(next.id);setPanelOpen(true)
        document.getElementById(`freestyle-step-${next.id}`)?.focus()
      }}><span className="freestyle-step-index">{index + 1}</span>{readOnly && item.id === 'code' ? 'Xem code' : item.label}</button>)}
    </div>

    {draft && !started && <div className="freestyle-draft" role="status"><span>{draft.workspace?'Có một bản nháp đã lưu trên máy này. Bàn hiện tại bắt đầu trống.':'Bản lưu cũ chưa đọc được; dữ liệu gốc được giữ nguyên.'}</span>{draft.workspace&&<button className="freestyle-button" onClick={()=>{stop();setWorkspace(draft.workspace!);setStarted(true);setNotice('Đã mở bản nháp, giữ nguyên mạch và code.');setStep('parts');setView('breadboard');setPanelOpen(false)}}>Mở bản nháp đã lưu</button>}</div>}
    <div className="freestyle-workbar" ref={workbarRef}>
      <div className="freestyle-view-tabs" role="group" aria-label="Chế độ xem mạch">{([['breadboard','Lắp mạch 2D'],['schematic','Schematic'],['3d','Lắp mạch 3D'],['wave','Dạng sóng']] as const).map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>{setTracePopout(false);setView(id);setPanelOpen(false)}}>{label}</button>)}</div>
      <div className="freestyle-work-actions"><button className="freestyle-button" aria-expanded={panelOpen} onClick={()=>setPanelOpen(!panelOpen)}>{panelOpen?'Ẩn bảng thao tác':'Mở bảng thao tác'}</button><button ref={expandButton} className="freestyle-button" aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Thu gọn bàn':'Mở rộng bàn'}</button><button type="button" disabled={!readyToRun} className={`freestyle-run-button ${running?'is-running':''}`} onClick={running||preparing?stop:run}>{running||preparing?'■ Dừng':'▶ Chạy'}</button></div>
        {controlSpecs.length > 0 && <div className="freestyle-card freestyle-input-dock"><h3>Đầu vào</h3>{controlSpecs.map(spec => {
          if (spec.kind === 'slider') {
            const value = typeof controls[spec.partId] === 'number' ? Number(controls[spec.partId]) : 0.5
            return <label key={spec.partId} className="freestyle-slider">{spec.label} · {Math.round(value * 100)} %<input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={event => setControls(current => ({ ...current, [spec.partId]: Number(event.target.value) / 100 }))} /></label>
          }
          if (spec.kind === 'toggle') return <label key={spec.partId} className="freestyle-toggle"><input type="checkbox" checked={Boolean(controls[spec.partId])} onChange={event => setControls(current => ({ ...current, [spec.partId]: event.target.checked }))} />{spec.label}</label>
          if (spec.kind === 'keypad') return <label key={spec.partId}>{spec.label}<select value={typeof controls[spec.partId] === 'number' ? String(controls[spec.partId]) : ''} onChange={event => setControls(current => ({ ...current, [spec.partId]: event.target.value === '' ? false : Number(event.target.value) }))}>
            <option value="">Thả tất cả</option>{keypadKeys.map((key,index)=><option key={key} value={index}>{key}</option>)}
          </select></label>
          const press = (pressed: boolean) => setControls(current => ({ ...current, [spec.partId]: pressed }))
          return <button key={spec.partId} type="button" className="freestyle-press" aria-pressed={Boolean(controls[spec.partId])} onPointerDown={() => press(true)} onPointerUp={() => press(false)} onPointerLeave={() => press(false)} onPointerCancel={() => press(false)} onBlur={() => press(false)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); press(true) } }} onKeyUp={() => press(false)}>{spec.label}</button>
        })}</div>}
      {!readOnly && <div className="freestyle-wire-actions" aria-label="Bản nháp và thao tác dây" role="group">
        <label className="freestyle-button freestyle-import-draft">Nhập bản nháp<input type="file" accept=".json,application/json" aria-label="Nhập bản nháp từ file" onChange={importDraft} /></label>
        <button type="button" className="freestyle-button" disabled={!wireHistory.length} onClick={undoWire}>Hoàn tác dây</button>
        <button type="button" className="freestyle-button" disabled={!editorHistory.past.length} onClick={()=>replayCircuit('undo')}>Hoàn tác mạch</button>
        <button type="button" className="freestyle-button" disabled={!editorHistory.future.length} onClick={()=>replayCircuit('redo')}>Làm lại mạch</button>
        <button type="button" className="freestyle-button" aria-expanded={shortcutHelp} onClick={()=>setShortcutHelp(!shortcutHelp)}>Phím tắt</button>
        {selectedPart && selectedPart.type!=='board' && <button type="button" className="freestyle-button" onClick={()=>changeSelected('duplicate')}>Nhân bản linh kiện đang chọn</button>}
      </div>}
      {shortcutHelp && <p className="freestyle-note" role="note">Shift + chọn hoặc Shift + kéo vùng để chọn nhiều. Ctrl/Cmd + Z hoàn tác, thêm Shift để làm lại. Ctrl/Cmd + D nhân bản linh kiện. Delete xóa; R xoay 180°; mũi tên di chuyển một lỗ; ? mở bảng này.</p>}
    </div>
    <div className="freestyle-layout">
      <div id="freestyle-step-panel" role="tabpanel" aria-labelledby={`freestyle-step-${step}`} className="freestyle-panel" hidden={step==='observe'}>
        {step === 'board' && <div className="freestyle-board-step">
          <fieldset className="freestyle-board-list">
            <legend>Board / MCU</legend>
            {freestyleBoards.map(item => <label key={item.id} className={item.id === boardId ? 'is-selected' : ''}
              onPointerDown={() => { boardPointer.current = true }} onPointerCancel={() => { boardPointer.current = false }} onKeyDown={() => { boardPointer.current = false }}>
              <input type="radio" name="freestyle-board" value={item.id} checked={item.id === boardId} onChange={() => {
                const reveal = boardPointer.current
                boardPointer.current = false
                chooseBoard(item.id, reveal)
              }} />
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
          <button className="freestyle-button" disabled={doc.breadboards.length>0} onClick={()=>{const bb=createEmptyFreestyleDoc();updateDoc({...doc,breadboards:bb.breadboards});revealMobileCircuit()}}>Thêm breadboard</button>
          <label className="freestyle-filter">Tìm linh kiện<input type="search" value={partFilter} onChange={event => setPartFilter(event.target.value)} placeholder="LED, nút, biến trở…" /></label>
          <p className="freestyle-hint">Kéo linh kiện thả vào một lỗ breadboard, hoặc bấm “Thêm” để tự đặt chỗ trống.</p>
          <ul className="freestyle-library" aria-label="Thư viện linh kiện">
            {visibleParts.map(part => <li key={part.id} draggable onDragStart={event => { event.dataTransfer.setData('application/x-machmo-part', part.id); event.dataTransfer.effectAllowed = 'copy' }}>
              <span aria-hidden="true" className="freestyle-part-emoji">{part.emoji}</span>
              <span className="freestyle-part-name">{part.label}<small>{part.category}</small></span>
              <button type="button" onClick={() => { if (addPart(part.id)) revealMobileCircuit() }} aria-label={`Thêm ${part.label}`}>Thêm</button>
            </li>)}
          </ul>
          {selectedPart && selectedPart.type !== 'board' && <div className="freestyle-selected" ref={selectedPartRef} tabIndex={-1} aria-label={`Linh kiện đang chọn ${selectedPart.id}`}>
            <h3>{selectedDefinition?.label ?? selectedPart.type} <code>{selectedPart.id}</code></h3>
            <p>{selectedDefinition?.safetyNotes}</p>
            <KitPartExample key={selectedPart.id} type={selectedPart.type}
              keypadIndex={typeof controls[selectedPart.id] === 'number' ? Number(controls[selectedPart.id]) : undefined}
              onKeypad={index => setControls(current => {
                const next = { ...current }
                if (index === undefined) delete next[selectedPart.id]
                else next[selectedPart.id] = index
                return next
              })} />
            <div className="freestyle-selected-actions">
              {selectedPart.mount.kind === 'breadboard' && <button type="button" aria-pressed={moving} onClick={() => { setMoving(!moving); setNotice(moving ? '' : `Chọn một lỗ breadboard để chuyển ${selectedPart.id} tới đó.`) }}>Di chuyển</button>}
              {selectedPart.mount.kind === 'breadboard' && <button type="button" onClick={() => { const result = rotatePart(doc, selectedPart.id); if (result.error) setNotice(result.error); else updateDoc(result.doc) }}>Xoay 180°</button>}
              <button type="button" onClick={() => { updateDoc(removePartAndWires(doc, selectedPart.id)); setSelectedPartId(null) }}>Xóa linh kiện</button>
            </div>
          </div>}
        </div>}

        {step === 'code' && <div className="freestyle-code-step">
          <div className="freestyle-code-toolbar">
            {!readOnly && board.languages.length > 1 && <label>Ngôn ngữ<select value={language} onChange={event => chooseLanguage(event.target.value as FreestyleLanguage)}>{board.languages.map(item => <option key={item} value={item}>{item === 'micropython' ? 'MicroPython' : 'Arduino C++'}</option>)}</select></label>}
            <span className="freestyle-code-board">{boardId?board.short:'Chưa chọn board'} · {language === 'micropython' ? 'MicroPython' : 'Arduino C++'}</span>
            {!readOnly && isEsp32Target(boardId) && <button type="button" className="freestyle-button" onClick={() => setUsbOpen(true)}>Nạp mẫu qua USB</button>}
          </div>
          <div className="freestyle-editor">
            <pre className="freestyle-gutter" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index} className={error?.line === index + 1 ? 'is-error' : undefined}>{index + 1}</span>)}</pre>
            <textarea readOnly={readOnly} value={code} spellCheck={false} wrap="off" rows={lineCount + 1} aria-label={language === 'micropython' ? 'Mã nguồn MicroPython' : 'Mã nguồn Arduino C++'} aria-invalid={error ? true : undefined} aria-describedby={error ? 'freestyle-error' : undefined} onChange={event => { update({ code: event.target.value, sampleId:undefined }); setError(undefined) }} />
          </div>
        </div>}
      </div>

      <div className="freestyle-stage" ref={stageRef} tabIndex={-1} aria-label="Mạch đang lắp" onDragOver={event => { if (!readOnly && event.dataTransfer.types.includes('application/x-machmo-part')) event.preventDefault() }} onDrop={readOnly ? undefined : dropPart}>
        {activeSample && <details className="freestyle-note"><summary>{activeSample.title}{activeSample.mode==='wiring'?' · nối dây và đọc sketch':''}</summary><p>{activeSample.summary}</p><p>Thử {activeSample.challenge.charAt(0).toLocaleLowerCase('vi-VN')+activeSample.challenge.slice(1)}</p>{activeSample.mode==='wiring'&&<p>Máy mô phỏng hiện tại chưa chạy giao thức hoặc ngoại vi của mẫu này. Có thể tải sketch và đối chiếu tài liệu phần cứng.</p>}</details>}
        {workspace.sampleId === 'motor' && <p className="freestyle-note" role="note">{motorProtection.independentSupply && motorProtection.commonGround && motorProtection.flyback ? 'Mạch này có nguồn tải lý tưởng riêng, GND chung và diode mắc ngược song song motor.' : 'Bản nháp motor này chưa có đủ nguồn tải riêng, GND chung hoặc diode đúng chiều. Mạch đang được giữ nguyên. Hãy tải bản nháp trước khi chọn “Dựng mạch mẫu” để dùng mẫu mới.'} Hoạt cảnh chỉ minh họa đóng/ngắt; chưa tính dòng tải, sụt áp, xung ngược, nhiệt hoặc chọn định mức linh kiện thật.</p>}
        {!readOnly && !panelOpen && selectedPart && selectedPart.type !== 'board' && <button type="button" className="freestyle-button freestyle-reopen-selection" onClick={() => {
          setStep('parts')
          setPanelOpen(true)
          requestAnimationFrame(() => selectedPartRef.current?.focus())
        }}>Xem linh kiện {selectedDefinition?.label ?? selectedPart.type}</button>}
        {!doc.parts.length&&!doc.breadboards.length&&view!=='wave' ? <div className="freestyle-blank"><span aria-hidden="true">＋</span><h3>Bàn của bạn, bắt đầu từ trống</h3><p>Chọn board, thêm breadboard và linh kiện; tự nối dây và viết code. Không có mạch nào được dựng sẵn.</p><button className="freestyle-run-button" onClick={()=>{setStep('board');setPanelOpen(true)}}>Chọn board</button><button className="freestyle-button" onClick={()=>{const bb=createEmptyFreestyleDoc();updateDoc({...doc,breadboards:bb.breadboards});setStep('parts');setPanelOpen(true)}}>Thêm breadboard</button></div> : view==='3d' ? <Suspense fallback={<p>Đang mở cảnh 3D…</p>}><FreestyleAssemblyView key={boardId} doc={doc} boardId={boardId} pinMap={pinMap} selectedPartId={selectedPartId} wireSignals={wireSignals} litPartIds={evaluation.litPartIds} onSelectPart={setSelectedPartId}/></Suspense> : view==='wave' ? <FreestyleWaveform captureKey={traceCapture.current} preferredPins={preferredTracePins} samples={trace} boardId={boardId} source={boardId?engine.label:'Chưa chọn runtime'} running={running}/> : view==='schematic' ? <><p className="freestyle-note">{boardId?board.name:'Chưa chọn board'} · {wiredSignals.map(role=>`${SIGNAL_PIN_LABELS[role]} = ${pinDisplayName(boardId,pinMap[role])}`).join(' · ')}</p><CircuitSchematicV2 doc={doc} boardLabel={boardId?board.short:undefined} boardPinLabels={boardId?freestylePresentation(boardId,pinMap).pinLabels:undefined} selectedKey={selectedPartId} selectedWireId={selectedWireId} onSelectPart={setSelectedPartId} onSelectWire={setSelectedWireId}/></> : <BreadboardEditor
          compact
          readOnly={readOnly}
          presentation={boardId?freestylePresentation(boardId,pinMap):undefined}
          doc={doc}
          wireLayout={workspace.wireLayout}
          onWireBendChange={changeWireBend}
          selectedWireId={selectedWireId}
          selectedPartId={selectedPartId}
          selectedPartIds={new Set(selection)}
          onSelectParts={readOnly ? undefined : selectParts}
          pendingEndpoint={pendingEndpoint}
          onSelectEndpoint={selectEndpoint}
          onSelectPart={(id,extend) => choosePart(id,!readOnly&&extend)}
          onSelectWire={setSelectedWireId}
          onCommitWire={(from, to, role) => {
            const wire = addFreestyleWire(doc, from, to, role).wires.at(-1)!
            const result = addWire(doc, wire)
            if (result.doc === doc) { setNotice(result.issues[0]?.message ?? 'Không thể nối hai điểm này.'); return false }
            updateWireDoc(result.doc)
            setSelectedWireId(wire.id)
            setNotice(`Đã nối ${wire.id}.`)
            return true
          }}
          onEditWireEndpoint={(id, end, endpoint) => {
            const result = editWireEndpoint(doc, id, end, endpoint)
            if (result.doc === doc) { setNotice(result.issues[0]?.message ?? 'Không thể chuyển đầu dây.'); return false }
            updateWireDoc(result.doc)
            setNotice(`Đã chuyển đầu dây ${id}.`)
            return true
          }}
          onChangePartValue={(id, value) => {
            const result = setPartValue(doc, id, value)
            if (result.doc === doc) { setNotice(result.issues[0]?.message ?? 'Không thể đổi trị số.'); return false }
            updateDoc(result.doc)
            return true
          }}
          onSetWireRole={(id, role) => updateWireDoc(setWireRole(doc, id, role).doc)}
          onRemoveWire={id => { updateWireDoc(removeWire(doc, id).doc); setSelectedWireId(null) }}
          notice={notice}
          activeWireIds={running ? evaluation.activeWireIds : new Set()}
          litPartIds={evaluation.litPartIds}
          wireSignals={wireSignals}
        />}
        {view!=='wave' && trace.length>0 && !showTracePopout && <details className="freestyle-trace-dock"><summary>Dạng sóng đã thu · {trace.length} mẫu</summary><FreestyleWaveform captureKey={traceCapture.current} preferredPins={preferredTracePins} samples={trace} boardId={boardId} source={engine.label} running={running}/></details>}
      </div>

      <div id="freestyle-observe-panel" role="tabpanel" aria-labelledby="freestyle-step-observe" className="freestyle-observe" hidden={step!=='observe'} aria-label="Chạy và quan sát">
        <div className="freestyle-run">
          <button type="button" className={`freestyle-run-button ${running ? 'is-running' : ''}`} disabled={!readyToRun} onClick={running||preparing ? stop : run}>{running||preparing ? '■ Dừng' : '▶ Chạy'}</button>
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
          <SerialPlotter state={serialPlot} source={boardId ? engine.label : 'Chưa chọn runtime'} expanded={serialPlotOpen} onToggle={() => {
            if (!serialPlotOpen) setTracePopout(false)
            setSerialPlotOpen(!serialPlotOpen)
          }} />
        </div>
        <SignalFlowPanel code={code} serial={serialEntries} legend={legend} running={running} illustrative={false} />
        <p className="freestyle-disclaimer">Kết quả là mô phỏng logic trên máy tính, không phải đo trên mạch thật.</p>
      </div>
    </div>
    {showTracePopout && <aside className="freestyle-wave-popout" role="region" aria-label="Cửa sổ dạng sóng" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); setTracePopout(false) }
    }}>
      <div className="freestyle-wave-popout-bar"><strong>Tín hiệu vừa thu</strong><button className="freestyle-button" type="button" onClick={() => setTracePopout(false)}>Đóng dạng sóng</button></div>
      <FreestyleWaveform captureKey={traceCapture.current} preferredPins={preferredTracePins} samples={trace} boardId={boardId} source={engine.label} running={running} />
    </aside>}
    {usbOpen && isEsp32Target(boardId) && <Suspense fallback={<p role="status">Đang mở bảng USB…</p>}><Esp32UsbDialog board={boardId} code={code} lesson={workspace.sampleId} onClose={() => setUsbOpen(false)} /></Suspense>}
    <FreestyleDraftsDialog current={workspace} open={draftsOpen} onClose={()=>setDraftsOpen(false)} onRestore={restored=>{if(!archiveBeforeReplace())return;update(restored);setDraftsOpen(false);setView('breadboard');setStep('parts');setPanelOpen(false);setNotice('Đã khôi phục bản nháp; công việc trước đó được sao lưu.')}}
      drawing={view === 'breadboard' || view === 'schematic' ? {kind:view, get:()=>stageRef.current?.querySelector<SVGSVGElement>(view === 'breadboard' ? '.breadboard-diagram-svg' : '.circuit-schematic-svg') ?? null} : undefined} />
    <FreestyleToolsDrawer open={toolsOpen} onClose={() => setToolsOpen(false)} />
  </section>
}
