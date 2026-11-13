import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { componentRegistry, getComponentDefinition, type ComponentId } from '../data/componentRegistry'
import { getBoardCapability } from '../data/boardCapabilityRegistry'
import { analogPercentExpression, builderLessons, getBuilderLesson, getInputAlias, type BuilderLessonId } from '../data/builderLessons'
import { getSimulationTarget, normalizeSimulationTargetId, simulationTargets } from '../data/simulationTargets'
import { deriveOutputState, initialEduState, type EduState } from '../lib/educationalSimulator'
import { validateCircuit } from '../lib/circuitValidation'
import { parseEducationalProgram, type EducationalProgram } from '../lib/educationalProgram'
import { resolveSimulationProvider } from '../lib/simulationProviders'
import type { LdrDividerResult } from '../lib/analogDivider'
import { createCalculatorSpiceHandoff, serializeCalculatorSpiceHandoff } from '../lib/calculatorSpice'
import { compileWorkspaceSpice, getLdrDividerSpiceBlockReason, storeWorkspaceSpiceHandoff } from '../lib/workspaceSpice'
import { canExportArduinoSketch, findProgramTargetMismatch, prepareArduinoSketchExport } from '../lib/arduinoSketchExport'
import { downloadSchematic } from '../lib/exportSchematic'
import { getLessonCircuitDoc } from '../data/lessonCircuitDocs'
import { addWire as addCircuitWire, editWireEndpoint, removeWire as removeCircuitWire, setWireRole } from '../lib/circuitDocEdits'
import type { CircuitDocV2, CircuitEndpointV2 } from '../lib/circuitDocV2'
import { acceptV4Migration, readWorkspace, saveWorkspaceV5, type CircuitWorkspaceV5, type WorkspaceReadResult } from '../lib/circuitStorageV5'
import { Pcb2DViewer } from '../components/pcb/Pcb2DViewer'
import { SchematicView } from '../components/builder/SchematicView'
import { BreadboardEditor } from '../components/builder/BreadboardEditor'
import { CircuitSchematicV2 } from '../components/builder/CircuitSchematicV2'
import { ComponentVisual } from '../components/ComponentVisual'
import type { CircuitConnection, CircuitPart } from '../types/circuitTopology'
import type { LessonPart } from '../data/lessonCircuits'
import { BuilderStepper, type BuilderStep } from '../components/builder/BuilderStepper'
import { BuilderStepIntro } from '../components/builder/BuilderStepIntro'
import { BuilderToolbar } from '../components/builder/BuilderToolbar'
import { BuilderLessonPicker } from '../components/builder/BuilderLessonPicker'
import { BuilderGuidancePanel } from '../components/builder/BuilderGuidancePanel'
import { BuilderLessonBrief } from '../components/builder/BuilderLessonBrief'
import { InputOutputChallenge } from '../components/builder/InputOutputChallenge'
import { SevenSegmentChallenge } from '../components/builder/SevenSegmentChallenge'
import { ScenarioPredictionChallenge } from '../components/builder/ScenarioPredictionChallenge'
import { getPracticeChallengeKinds } from '../lib/practiceChallengeCoverage'
import { BuilderPinPanel } from '../components/builder/BuilderPinPanel'
import { CapabilityLegend } from '../components/CapabilityBadge'
import { BlockCodeWorkspace } from '../components/lesson/BlockCodeWorkspace'
import { AnalogBlockWorkspace, analogBlockOrder, type AnalogBlockId } from '../components/lesson/AnalogBlockWorkspace'
import { InputBranchBlockWorkspace, inputBranchBlockOrder, type InputBranchBlockId } from '../components/lesson/InputBranchBlockWorkspace'
import { CppPracticeEditor } from '../components/lesson/CppPracticeEditor'
import { generateLedCpp, starterLedProgram, type LedProgramIr } from '../lib/lessonProgramIr'
import { curriculumLessons } from '../data/curriculumSchema'
import { createProjectBundle, normalizeProjectBundle, parseProjectBundle } from '../lib/projectBundle'
import { addSavedProject, MissingSavedProjectError, replaceWorkspaceWithBundle } from '../lib/savedProjects'
import { PROJECT_IMPORT_MAX_BYTES } from '../lib/projectLimits'
import { trackEvent } from '../lib/analytics'
import { recordLessonOpened, recordLessonSimulationStarted } from '../lib/learningProgress'
import { useProductRoute } from '../lib/useProductRoute'
import { planWorkspaceEntry } from '../lib/workspaceEntry'
import { getBuilderGuidance, getCircuitStatus, groupDiagnostics, type GuidanceAction } from '../lib/builderGuidance'
import { getPartConnections, getWireNetGroups } from '../lib/circuitNets'
import { addDroppedPart, canStartComponentMove, canvasDropPosition, createWireFromKeys, startWireGesture, moveWireGesture, type WireDragPreview } from '../lib/builderInteractions'
import { getLessonBoardPinIds, getVisibleBoardPins } from '../lib/lessonBoardPins'
import { getCircuitPartDisplayLabel } from '../lib/componentDisplayLabel'
import { LessonProgressToggle } from '../components/LessonProgressToggle'
import { getLogicFlow, getLogicTraceWireIds } from '../lib/logicTrace'
import { getLessonEntryRoute, getNextLessonId } from '../data/learningPath'
import { circuitForLesson, defaults, defaultWires, legacyEndpoint, partTypeFromId } from '../data/lessonCircuits'
import { backupDamagedValue, getBrowserStorage } from '../lib/workspaceStorage'
import { saveDraft } from '../lib/draftStorage'
import { createSimulationRunId, createWorkspaceSimulationFingerprint, isCurrentSimulationRun } from '../lib/workspaceSimulationSession'
import { createFirmwareLoadGuard, fetchFirmwareText, arduinoBlinkSamplePath, arduinoBlinkSampleName, downloadFirmwareTrace } from '../lib/firmwareWorkflow'
import { canRunAtmega328pFirmware, getAtmega328pFirmwareTarget } from '../lib/firmwareTarget'
import { inspectIntelHex } from '../lib/intelHex'
import type { Atmega328pSnapshot } from '../lib/avr8jsRunner'
import type { AVR8jsWorkerResponse } from '../simulation/avr8jsProtocol'
import type { SimulationSessionStatus } from '../simulation/contracts'
import { clearWorkspaceSpiceObservation, readWorkspaceSpiceObservation, type WorkspaceSpiceObservation } from '../lib/workspaceSpice'
import { SimulationInstrumentsPanel, type BuilderSimulationRuntime } from '../components/builder/SimulationInstrumentsPanel'

const AssemblyStage = lazy(() => import('../components/builder/AssemblyStage').then(module => ({ default: module.AssemblyStage })))
export { circuitForLesson }
type PartId = ComponentId
type PlacedPart = LessonPart
type PaletteItem = { type: PartId; label: string; emoji: string; pinNames: string[]; pinIds: string[]; role: string }
const palette: PaletteItem[] = componentRegistry.map((part) => ({ type: part.id, label: part.label, emoji: part.emoji, pinNames: part.pins.map((item) => item.label), pinIds: part.pins.map((item) => item.id), role: `${part.explanation} ${part.safetyNotes}` }))
const labels: Record<PartId,string> = Object.fromEntries(palette.map((part)=>[part.type,part.label])) as Record<PartId,string>
type Wire = CircuitConnection

type TopologySnapshot = { placed: PlacedPart[]; wires: Wire[] }
type TopologyHistory = { context: string; current: string | null; past: string[]; future: string[]; lastChangeKind: 'layout' | 'edit' | null }
const MAX_TOPOLOGY_HISTORY = 80
function isLayoutOnlyTopologyChange(previous: TopologySnapshot, next: TopologySnapshot) {
  return previous.wires.length === next.wires.length && previous.wires.every((wire, index) => wire.id === next.wires[index]?.id && wire.from.partId === next.wires[index]?.from.partId && wire.from.pinId === next.wires[index]?.from.pinId && wire.to.partId === next.wires[index]?.to.partId && wire.to.pinId === next.wires[index]?.to.pinId) &&
    previous.placed.length === next.placed.length && previous.placed.every((part, index) => {
      const other = next.placed[index]
      return other && part.id === other.id && part.type === other.type && part.value === other.value
    })
}
function resolveEndpoint(value:string,placed:PlacedPart[]=[]):{partId:string;pinId:string}|undefined { const split=value.lastIndexOf(':');if(split<1)return;const partId=value.slice(0,split),pinRef=value.slice(split+1),type=partTypeFromId(partId,placed),definition=type?getComponentDefinition(type):undefined;const direct=definition?.pins.find(item=>item.id===pinRef);if(direct)return {partId,pinId:direct.id};const fallback=legacyEndpoint(value,placed);return fallback?{partId,pinId:fallback.pinId}:undefined }
function endpointIndex(endpoint:{partId:string;pinId:string},placed:PlacedPart[]) { const part=placed.find(item=>item.id===endpoint.partId);return part?getComponentDefinition(part.type)?.pins.findIndex(pin=>pin.id===endpoint.pinId)??-1:-1 }
function wireColor(wire:Wire,placed:PlacedPart[]):string { const endpoints=[wire.from,wire.to].map(endpoint=>{const part=placed.find(item=>item.id===endpoint.partId);const type=part?.type??partTypeFromId(endpoint.partId,placed);return type?getComponentDefinition(type)?.pins.find(pin=>pin.id===endpoint.pinId):undefined});if(endpoints.some(pin=>pin?.electricalType==='ground'||pin?.polarity==='negative'||/gnd|ground/i.test(pin?.label??'')))return '#101820';if(endpoints.some(pin=>pin?.electricalType==='power'||pin?.polarity==='positive'||/vcc|vin|\+|power/i.test(pin?.label??'')))return '#e4483e';return '#287fbc' }
function partLabel(part:PlacedPart|undefined, boardName?:string) { return !part?'Linh kiện':part.type==='board'&&boardName?boardName:getCircuitPartDisplayLabel(part,labels[part.type]??part.type) }
function describeEndpoint(endpoint:{partId:string;pinId:string},placed:PlacedPart[],boardName:string) { const part=placed.find(item=>item.id===endpoint.partId);const pin=part?getComponentDefinition(part.type)?.pins.find(item=>item.id===endpoint.pinId):undefined;return `${partLabel(part,boardName)}.${pin?.label??endpoint.pinId}` }
const digitSegments: Record<number,string[]> = {0:['a','b','c','d','e','f'],1:['b','c'],2:['a','b','d','e','g'],3:['a','b','c','d','g'],4:['b','c','f','g'],5:['a','c','d','f','g'],6:['a','c','d','e','f','g'],7:['a','b','c'],8:['a','b','c','d','e','f','g'],9:['a','b','c','d','f','g']}
function SevenSegmentDisplay({digit,bits,lit}:{digit:number;bits?:number[];lit:boolean}) { const segmentIds=['a','b','c','d','e','f','g'];const active=new Set(!lit?[]:bits?segmentIds.filter((_id,index)=>bits[index]===1):digitSegments[digit]??[]);const segments:{id:string;points:string}[]=[{id:'a',points:'28,8 68,8 63,16 33,16'},{id:'b',points:'70,10 77,16 73,40 66,44 62,38'},{id:'c',points:'74,47 80,51 76,76 69,82 65,75'},{id:'d',points:'28,78 63,78 68,86 28,86 23,82'},{id:'e',points:'20,51 27,47 32,53 28,74 21,80 16,76'},{id:'f',points:'24,16 31,10 37,16 32,38 25,44 19,40'},{id:'g',points:'29,43 35,39 61,39 67,44 61,49 34,49'}];return <svg className="seven-segment-display" viewBox="0 0 92 94" role="img" aria-label={lit?`LED 7 đoạn hiển thị số ${digit}`:'LED 7 đoạn đang tắt'}>{segments.map(segment=><polygon key={segment.id} points={segment.points} className={active.has(segment.id)?'segment-on':'segment-off'}/>)}<circle cx="79" cy="80" r="4" className="segment-off"/></svg> }
function migrateWire(value:unknown,placed:PlacedPart[],index:number):Wire|undefined { if(!value||typeof value!=='object')return;const raw=value as {id?:unknown;a?:unknown;b?:unknown;from?:{partId?:unknown;pinId?:unknown};to?:{partId?:unknown;pinId?:unknown}};if(typeof raw.id!=='string')return;let from:Wire['from']|undefined,to:Wire['to']|undefined;if(typeof raw.a==='string'&&typeof raw.b==='string'){from=legacyEndpoint(raw.a,placed);to=legacyEndpoint(raw.b,placed)}else if(raw.from&&raw.to&&typeof raw.from.partId==='string'&&typeof raw.from.pinId==='string'&&typeof raw.to.partId==='string'&&typeof raw.to.pinId==='string'){from={partId:raw.from.partId,pinId:raw.from.pinId};to={partId:raw.to.partId,pinId:raw.to.pinId}}if(!from||!to)return;const known=(end:Wire['from'])=>{const part=placed.find(item=>item.id===end.partId);return Boolean(part&&getComponentDefinition(part.type)?.pins.some(pin=>pin.id===end.pinId))};return known(from)&&known(to)?{id:typeof raw.a==='string'?`${raw.id}-${index}`:raw.id,from,to}:undefined }
function restoreBlockProgram(value:unknown, fallbackPin:number):LedProgramIr|undefined {
  if(!value||typeof value!=='object')return
  const candidate=value as Partial<LedProgramIr>
  if(!Number.isInteger(candidate.pin)||!Array.isArray(candidate.setup)||!Array.isArray(candidate.loop))return
  const validAction=(action:unknown)=>{if(!action||typeof action!=='object')return false;const item=action as {kind?:unknown;pin?:unknown;value?:unknown;milliseconds?:unknown};return item.kind==='pinMode'?Number.isInteger(item.pin):item.kind==='write'?Number.isInteger(item.pin)&&(item.value==='HIGH'||item.value==='LOW'):item.kind==='delay'?Number.isFinite(item.milliseconds)&&Number(item.milliseconds)>0:false}
  if(!candidate.setup.every(validAction)||!candidate.loop.every(validAction))return
  return {...candidate,pin:fallbackPin,setup:candidate.setup.map(action=>({...action,pin:fallbackPin})),loop:candidate.loop.map(action=>action.kind==='write'?{...action,pin:fallbackPin}:action)} as LedProgramIr
}
type BuilderWorkspace = { placed: PlacedPart[]; wires: Wire[]; board: string; code?: string; lesson?: BuilderLessonId; codeMode?: 'blocks'|'cpp'; blockProgram?: LedProgramIr; analogCppDraft?: string; analogMode?: 'blocks'|'cpp'; analogThreshold?: number; analogBlockOrder?: AnalogBlockId[]; projectId?: string; projectName?: string; libraryEntryId?: string; libraryEntryName?: string; recovered: boolean; hasSavedData: boolean; backupFailed?: boolean }
function createFreshWorkspace(initialLesson?: BuilderLessonId): BuilderWorkspace {
  const board = 'esp32-devkit'
  const lesson = initialLesson ?? 'blink'
  const circuit = initialLesson ? circuitForLesson(initialLesson) : { placed: defaults, wires: defaultWires }
  return { ...circuit, board, lesson, codeMode: lesson === 'blink' ? 'blocks' : 'cpp', analogMode: 'blocks', analogThreshold: 50, analogBlockOrder: [...analogBlockOrderDefault], recovered: false, hasSavedData: false }
}
function loadWorkspace(storage: Storage, storageKey: string, initialLesson?: BuilderLessonId): BuilderWorkspace {
  const fresh = createFreshWorkspace(initialLesson)
  try {
    const raw = storage.getItem(storageKey)
    if (!raw) return fresh
    const data = JSON.parse(raw) as { placed?: PlacedPart[]; wires?: unknown[]; simBoard?: string; code?: string; lesson?: BuilderLessonId; codeMode?: 'blocks'|'cpp'; blockProgram?: unknown; analogCppDraft?: unknown; analogMode?: unknown; analogThreshold?: unknown; analogBlockOrder?: unknown; projectId?: unknown; projectName?: unknown; libraryEntryId?: unknown; libraryEntryName?: unknown }
    if (!Array.isArray(data.placed) || data.placed.length < 1 || data.placed.length > 100 || data.placed.some((part) => !part || typeof part !== 'object' || typeof part.id !== 'string' || !componentRegistry.some(definition => definition.id === part.type) || !Number.isFinite(part.x) || !Number.isFinite(part.y))) throw new Error('Workspace linh kiện không hợp lệ.')
    const placed = data.placed as PlacedPart[]
    if (!placed.some(part => part.type === 'board')) throw new Error('Workspace thiếu board.')
    if (data.wires !== undefined && (!Array.isArray(data.wires) || data.wires.length > 500)) throw new Error('Workspace dây nối không hợp lệ.')
    const usedWireIds = new Set<string>()
    const migrated = (Array.isArray(data.wires) ? data.wires : []).flatMap((wire, index) => { const item = migrateWire(wire, placed, index); if(!item)return []; const base=item.id;let serial=0;while(usedWireIds.has(item.id))item.id=`${base}-recovered-${++serial}`;usedWireIds.add(item.id);return [item] })
    const lesson = builderLessons.some(item => item.id === data.lesson) ? data.lesson : fresh.lesson
    const recovered = Array.isArray(data.wires) && migrated.length !== data.wires.length
    let backupFailed = false
    if (recovered) { try { backupDamagedValue(storage, storageKey, raw) } catch { backupFailed = true } }
    const board = normalizeSimulationTargetId(data.simBoard)
    const analogBlockOrder = Array.isArray(data.analogBlockOrder) && data.analogBlockOrder.length === analogBlockOrderDefault.length && data.analogBlockOrder.every(item => analogBlockOrderDefault.includes(item as AnalogBlockId)) ? data.analogBlockOrder as AnalogBlockId[] : [...analogBlockOrderDefault]
    return {
      placed,
      wires: Array.isArray(data.wires) ? migrated : fresh.wires,
      board,
      code: typeof data.code === 'string' ? data.code : undefined,
      lesson,
      codeMode: data.codeMode === 'blocks' || data.codeMode === 'cpp' ? data.codeMode : typeof data.code === 'string' ? 'cpp' : lesson === 'blink' ? 'blocks' : 'cpp',
      blockProgram: restoreBlockProgram(data.blockProgram, getSimulationTarget(board).codePin),
      analogCppDraft: typeof data.analogCppDraft === 'string' ? data.analogCppDraft : lesson === 'analog-potentiometer' && typeof data.code === 'string' ? data.code : undefined,
      analogMode: data.analogMode === 'cpp' ? 'cpp' : 'blocks',
      analogThreshold: typeof data.analogThreshold === 'number' ? Math.max(0, Math.min(100, data.analogThreshold)) : 50,
      analogBlockOrder,
      projectId: typeof data.projectId === 'string' ? data.projectId : undefined,
      projectName: typeof data.projectName === 'string' ? data.projectName : undefined,
      libraryEntryId: typeof data.libraryEntryId === 'string' && data.libraryEntryId ? data.libraryEntryId : undefined,
      libraryEntryName: typeof data.libraryEntryName === 'string' ? data.libraryEntryName : undefined,
      recovered,
      hasSavedData: true,
      backupFailed,
    }
  } catch {
    let backupFailed = false
    try { const damaged=storage.getItem(storageKey);if(damaged)backupDamagedValue(storage,storageKey,damaged) } catch { backupFailed = true }
    return { ...fresh, recovered: true, backupFailed }
  }
}
const analogBlockOrderDefault:AnalogBlockId[]=[...analogBlockOrder]
type BranchLessonId='button-led'|'ir-alert'
type BranchDrafts=Record<string,string>
function loadBranchSession(storage:Storage,storageKey:string):{mode:'blocks'|'cpp';drafts?:BranchDrafts;order:InputBranchBlockId[]} { try { const raw=storage.getItem(storageKey);if(raw){const saved=JSON.parse(raw) as {mode?:unknown;drafts?:unknown;order?:unknown};const drafts=Object.fromEntries(Object.entries(saved.drafts&&typeof saved.drafts==='object'?saved.drafts:{}).filter(([,text])=>typeof text==='string')) as BranchDrafts;const order=Array.isArray(saved.order)&&saved.order.length===inputBranchBlockOrder.length&&saved.order.every(item=>inputBranchBlockOrder.includes(item as InputBranchBlockId))?saved.order as InputBranchBlockId[]:[...inputBranchBlockOrder];return {mode:saved.mode==='cpp'?'cpp':'blocks',drafts,order}} } catch {} return {mode:'blocks',order:[...inputBranchBlockOrder]} }
type LessonDrafts=Partial<Record<BuilderLessonId,Record<string,string>>>
function loadLessonDrafts(storage: Storage, storageKey: string): LessonDrafts {
  try {
    const value = JSON.parse(storage.getItem(storageKey) ?? '{}') as Record<string, unknown>
    return Object.fromEntries(Object.entries(value).flatMap(([lesson, boards]) => (
      boards && typeof boards === 'object' && !Array.isArray(boards)
        ? [[lesson, Object.fromEntries(Object.entries(boards).filter(([, draft]) => typeof draft === 'string'))]]
        : []
    )))
  } catch { return {} }
}

export function CircuitBuilderPage() {
  const productRoute=useProductRoute()
  const location=useLocation()
  const navigate=useNavigate()
  const [searchParams,setSearchParams] = useSearchParams()
  const requestedLesson = searchParams.get('lesson')
  const validRequestedLesson = builderLessons.some(item => item.id === requestedLesson) ? requestedLesson as BuilderLessonId : undefined
  const guidedLesson = validRequestedLesson
  const requestedBoard = searchParams.has('board') ? normalizeSimulationTargetId(searchParams.get('board') ?? undefined) : undefined
  const workspaceStorage:Storage = getBrowserStorage(guidedLesson ? 'sessionStorage' : 'localStorage')
  const workspaceStorageKey = guidedLesson ? `machmo-guided-workspace-${guidedLesson}` : 'machmo-builder-session'
  const lessonDraftsStorageKey = guidedLesson ? `machmo-guided-lesson-drafts-${guidedLesson}` : 'machmo-lesson-drafts'
  const branchStorageKey = guidedLesson ? `machmo-guided-branch-session-${guidedLesson}` : 'machmo-branch-session'
  const [v2Read] = useState<WorkspaceReadResult>(() => guidedLesson ? { status: 'empty' } : readWorkspace(workspaceStorage))
  const v2MigrationNeedsDecision = v2Read.status === 'v4' || v2Read.status === 'invalid-v4'
  const [workspace]=useState(()=>{
    const legacy=loadWorkspace(workspaceStorage,workspaceStorageKey,guidedLesson)
    const fields=v2Read.status==='v5'?v2Read.value.workspaceFields:{}
    const v5Lesson=v2Read.status==='v5'&&builderLessons.some(item=>item.id===v2Read.value.lessonId)?v2Read.value.lessonId as BuilderLessonId:legacy.lesson
    const saved={...legacy,...(v2Read.status==='v5'?{board:normalizeSimulationTargetId(v2Read.value.boardId),lesson:v5Lesson,code:typeof fields.code==='string'?fields.code:legacy.code,codeMode:fields.codeMode==='blocks'||fields.codeMode==='cpp'?fields.codeMode:legacy.codeMode,hasSavedData:true}: {})}
    const entry=planWorkspaceEntry({requestedLesson:guidedLesson,requestedBoard,hasSavedWorkspace:saved.hasSavedData,savedBoard:saved.board})
    return {...saved,board:entry.board,pendingBoard:entry.pendingBoard}
  })
  const [, setV2Envelope] = useState<CircuitWorkspaceV5 | null>(() => v2Read.status === 'v5' ? v2Read.value : null)
  const v2EnvelopeRef = useRef<CircuitWorkspaceV5 | null>(v2Read.status === 'v5' ? v2Read.value : null)
  const [v2Doc, setV2Doc] = useState<CircuitDocV2>(() => v2Read.status === 'v5' ? v2Read.value.circuit : v2Read.status === 'v4' ? v2Read.preview.candidate.circuit : getLessonCircuitDoc(workspace.lesson ?? 'blink') ?? getLessonCircuitDoc('blink')!)
  const [v2Editable, setV2Editable] = useState(() => v2Read.status === 'v5')
  const [v2LessonPreview, setV2LessonPreview] = useState(() => v2Read.status === 'empty' && workspace.board === 'esp32-devkit' && Boolean(getLessonCircuitDoc(workspace.lesson ?? 'blink')))
  const [v2SelectedWireId, setV2SelectedWireId] = useState<string | null>(null)
  const [v2PendingEndpoint, setV2PendingEndpoint] = useState<CircuitEndpointV2 | null>(null)
  const [v2Notice, setV2Notice] = useState('')

  useEffect(()=>{if(guidedLesson)recordLessonOpened(guidedLesson)},[guidedLesson])
  const [placed, setPlaced] = useState<PlacedPart[]>(workspace.placed)
  const [wires, setWires] = useState<Wire[]>(workspace.wires)
  const topologyHistoryRef = useRef<TopologyHistory>({ context: '', current: null, past: [], future: [], lastChangeKind: null })
  const [topologyHistoryAvailability, setTopologyHistoryAvailability] = useState({ canUndo: false, canRedo: false })
  const [pending, setPending] = useState<string|null>(null)
  const [mode, setMode] = useState<'place'|'wire'>('place')
  const [saveStatus,setSaveStatus]=useState<'saved'|'error'>('saved')
  const [running, setRunning] = useState(false)
  const [ledPrediction, setLedPrediction] = useState<boolean | null>(null)
  const [ledPredictionFeedback, setLedPredictionFeedback] = useState('')
  const [pressed, setPressed] = useState(false)
  const [detected, setDetected] = useState(false)
  const [distanceCm, setDistanceCm] = useState(35)
  const [potPercent, setPotPercent] = useState(25)
  const [lightPercent, setLightPercent] = useState(25)
  const [conceptValue, setConceptValue] = useState(5)
  const [converterMode, setConverterMode] = useState<'buck'|'boost'>('buck')
  const [motorCommand, setMotorCommand] = useState<'forward'|'reverse'|'stop'>('forward')
  const [displayDigit, setDisplayDigit] = useState(0)
  const elapsedRef = useRef(0)
  const digitRef = useRef(0)
  const touchDragRef = useRef<{pointerId:number;partId:string;lastX:number;lastY:number}|null>(null)
  const wireDragRef = useRef<WireDragPreview | null>(null)
  const suppressPinClickRef = useRef(false)
  const [wireDragPreview, setWireDragPreview] = useState<WireDragPreview | null>(null)
  const [paletteSearch, setPaletteSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [board, setBoard] = useState(workspace.board)
  const [showAllBoardPins, setShowAllBoardPins] = useState(false)
  const [workspaceView, setWorkspaceView] = useState<'assembly'|'breadboard-v2'|'assembly-3d'|'schematic'|'pcb'>(() => v2Read.status === 'v5' || v2MigrationNeedsDecision || v2LessonPreview ? 'breadboard-v2' : 'assembly')
  const schematicExportRef = useRef<HTMLDivElement | null>(null)
  const [pendingBoard,setPendingBoard]=useState(workspace.pendingBoard)
  const [selectedPartId, setSelectedPartId] = useState(() => v2Doc.parts.find(part => part.type === 'board')?.id ?? 'board-1')
  const [selectedWireId, setSelectedWireId] = useState('')
  const [highlightedNetKey, setHighlightedNetKey] = useState<string | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [tracedPin, setTracedPin] = useState('')
  const [lessonId, setLessonId] = useState<BuilderLessonId>(workspace.lesson??'blink')
  const [builderStep, setBuilderStep] = useState<BuilderStep>(guidedLesson ? 'assemble' : 'choose')
  const stepHeadingRef=useRef<HTMLHeadingElement>(null)
  const guidanceRef=useRef<HTMLElement>(null)
  const stepMounted=useRef(false)
  const [codeMode, setCodeMode] = useState<'blocks'|'cpp'>(workspace.codeMode??'cpp')
  const [analogMode, setAnalogMode] = useState<'blocks'|'cpp'>(workspace.analogMode??'blocks')
  const [analogThreshold, setAnalogThreshold] = useState(workspace.analogThreshold??50)
  const [analogBlocks, setAnalogBlocks] = useState<AnalogBlockId[]>(workspace.analogBlockOrder??[...analogBlockOrder])
  const [blockProgram, setBlockProgram] = useState<LedProgramIr>(()=>workspace.blockProgram??({...starterLedProgram,pin:getSimulationTarget(workspace.board).codePin,setup:starterLedProgram.setup.map(action=>({...action,pin:getSimulationTarget(workspace.board).codePin})),loop:starterLedProgram.loop.map(action=>({...action,pin:getSimulationTarget(workspace.board).codePin}))}))
  const [activeBlockAction,setActiveBlockAction]=useState(0)
  const [activeCppLine,setActiveCppLine]=useState<number|null>(null)
  const [sim, setSim] = useState<EduState>(()=>initialEduState(getSimulationTarget(workspace.board).codePin))
  const target = getSimulationTarget(board)
  const firmwareTarget=getAtmega328pFirmwareTarget(target.boardId)
  const [simulationRuntime,setSimulationRuntime]=useState<BuilderSimulationRuntime>('lesson')
  const [firmwareSource,setFirmwareSource]=useState('')
  const [firmwareFileName,setFirmwareFileName]=useState('')
  const [firmwareConfirmed,setFirmwareConfirmed]=useState(false)
  const [firmwareError,setFirmwareError]=useState('')
  const [firmwareRunning,setFirmwareRunning]=useState(false)
  const [firmwareStatus,setFirmwareStatus]=useState<SimulationSessionStatus>('ready')
  const [firmwareFrame,setFirmwareFrame]=useState<Atmega328pSnapshot>()
  const [workspaceSpiceObservation,setWorkspaceSpiceObservation]=useState<WorkspaceSpiceObservation>()
  const avrWorkerRef=useRef<Worker|null>(null)
  const avrRunIdRef=useRef('')
  const avrTimeoutRef=useRef<number|undefined>(undefined)
  const firmwareLoadGuard=useRef(createFirmwareLoadGuard())
  const [firmwareLoading,setFirmwareLoading]=useState(false)
  const workspaceFingerprintRef=useRef<string|null>(null)
  const workspaceSpiceObservationIdRef=useRef<string|null>(null)
  const consumedWorkspaceSpiceResultRef=useRef('')
  const topologySnapshot = useMemo(() => JSON.stringify({ placed, wires }), [placed, wires])
  useEffect(() => {
    const history = topologyHistoryRef.current
    const context = `${board}:${lessonId}`
    if (history.context !== context || history.current === null) {
      history.context = context
      history.current = topologySnapshot
      history.past = []
      history.future = []
      history.lastChangeKind = null
      setTopologyHistoryAvailability({ canUndo: false, canRedo: false })
      return
    }
    if (history.current === topologySnapshot) return
    const previous = JSON.parse(history.current) as TopologySnapshot
    const next = JSON.parse(topologySnapshot) as TopologySnapshot
    const layoutOnly = isLayoutOnlyTopologyChange(previous, next)
    if (!layoutOnly || history.lastChangeKind !== 'layout') {
      history.past.push(history.current)
      if (history.past.length > MAX_TOPOLOGY_HISTORY) history.past.shift()
    }
    history.current = topologySnapshot
    history.future = []
    history.lastChangeKind = layoutOnly ? 'layout' : 'edit'
    setTopologyHistoryAvailability({ canUndo: history.past.length > 0, canRedo: false })
  }, [board, lessonId, topologySnapshot])
  const undoTopology = useCallback(() => {
    const history = topologyHistoryRef.current
    const snapshot = history.past.pop()
    if (!snapshot || !history.current) return
    history.future.push(history.current)
    history.current = snapshot
    history.lastChangeKind = null
    const restored = JSON.parse(snapshot) as TopologySnapshot
    setPlaced(restored.placed)
    setWires(restored.wires)
    setPending(null)
    setSelectedPartId(current => restored.placed.some(part => part.id === current) ? current : restored.placed.find(part => part.type === 'board')?.id ?? restored.placed[0]?.id ?? '')
    setSelectedWireId(current => restored.wires.some(wire => wire.id === current) ? current : '')
    setHighlightedNetKey(null)
    setTracedPin('')
    setTopologyHistoryAvailability({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 })
    setNotice('Đã hoàn tác thay đổi linh kiện, vị trí hoặc dây nối.')
  }, [])
  const redoTopology = useCallback(() => {
    const history = topologyHistoryRef.current
    const snapshot = history.future.pop()
    if (!snapshot || !history.current) return
    history.past.push(history.current)
    if (history.past.length > MAX_TOPOLOGY_HISTORY) history.past.shift()
    history.current = snapshot
    history.lastChangeKind = null
    const restored = JSON.parse(snapshot) as TopologySnapshot
    setPlaced(restored.placed)
    setWires(restored.wires)
    setPending(null)
    setSelectedPartId(current => restored.placed.some(part => part.id === current) ? current : restored.placed.find(part => part.type === 'board')?.id ?? restored.placed[0]?.id ?? '')
    setSelectedWireId(current => restored.wires.some(wire => wire.id === current) ? current : '')
    setHighlightedNetKey(null)
    setTracedPin('')
    setTopologyHistoryAvailability({ canUndo: history.past.length > 0, canRedo: history.future.length > 0 })
    setNotice('Đã làm lại thay đổi linh kiện, vị trí hoặc dây nối.')
  }, [])
  useEffect(() => {
    function handleTopologyShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]')) return
      const key = event.key.toLocaleLowerCase()
      const redo = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey && !event.metaKey)
      if (redo ? !topologyHistoryRef.current.future.length : key !== 'z' || !topologyHistoryRef.current.past.length) return
      event.preventDefault()
      if (redo) redoTopology()
      else undoTopology()
    }
    window.addEventListener('keydown', handleTopologyShortcut)
    return () => window.removeEventListener('keydown', handleTopologyShortcut)
  }, [redoTopology, undoTopology])
  useEffect(()=>{setShowAllBoardPins(false)},[board,lessonId])
  const providerResolution = resolveSimulationProvider(board, lessonId)
  const simulationProvider = providerResolution.provider
  const selectedPart = placed.find(part=>part.id===selectedPartId)
  const selectedDefinition = selectedPart ? getComponentDefinition(selectedPart.type) : undefined
  const boardCapability=getBoardCapability(target.boardId)
  const lesson = getBuilderLesson(lessonId)
  const learningContract=curriculumLessons.find(item=>item.id===lessonId)
  const diagnostics=useMemo(()=>validateCircuit({parts:placed,wires},lessonId,boardCapability),[placed,wires,lessonId,boardCapability])
  const hasCircuitErrors=diagnostics.some(item=>item.severity==='error')
  const inputAlias = getInputAlias(target,lessonId)
  const [code, setCode] = useState(workspace.code??lesson.code(target,inputAlias.pin))
  const [initialDrafts] = useState(() => normalizeProjectBundle({
    format: 'mach-mo-project', version: 1, exportedAt: '',
    workspace: { placed: workspace.placed, wires: workspace.wires, lesson: workspace.lesson, simBoard: workspace.board, code: workspace.code },
    lessonDrafts: loadLessonDrafts(workspaceStorage, lessonDraftsStorageKey), branchSession: {}, branchDrafts: {},
  }))
  const [lessonDrafts,setLessonDrafts]=useState<LessonDrafts>(()=>initialDrafts.bundle.lessonDrafts as LessonDrafts)
  const [draftSaveFailed,setDraftSaveFailed]=useState(false)
  const failedDraftKeys=useRef(new Set<string>())
  const [analogCppDraft, setAnalogCppDraft] = useState(workspace.analogCppDraft??(workspace.lesson==='analog-potentiometer'?workspace.code:undefined)??getBuilderLesson('analog-potentiometer').code(target,getInputAlias(target,'analog-potentiometer').pin))
  const [branchSession] = useState(()=>loadBranchSession(workspaceStorage,branchStorageKey))
  const [branchMode,setBranchMode]=useState<'blocks'|'cpp'>(branchSession.mode)
  const persistedBranchKeys = useRef(new Set(Object.keys(branchSession.drafts ?? {})))
  const [branchDrafts,setBranchDrafts]=useState<BranchDrafts>(()=>({
    'button-led':branchSession.drafts?.['button-led']??getBuilderLesson('button-led').code(target,getInputAlias(target,'button-led').pin),
    'ir-alert':branchSession.drafts?.['ir-alert']??getBuilderLesson('ir-alert').code(target,getInputAlias(target,'ir-alert').pin),
    ...branchSession.drafts,
  }))
  const [branchBlocks,setBranchBlocks]=useState<InputBranchBlockId[]>(branchSession.order)
  const [educationalProgram,setEducationalProgram]=useState<EducationalProgram|null>(null)
  const [notice, setNotice] = useState(workspace.backupFailed?'Workspace đã lưu có dữ liệu không đọc được và chưa sao lưu được, nên tự động lưu đang tạm dừng để giữ bản gốc. Hãy giải phóng bộ nhớ trình duyệt rồi tải lại trang.':workspace.recovered?'Workspace đã lưu có dữ liệu không đọc được. Bản gốc được giữ lại; có thể tải bản sao ở trang Dự án.':workspace.lesson?`Đã nạp bài “${getBuilderLesson(workspace.lesson).title}” từ workspace đã lưu.`:'Chọn một bài thực hành để nạp sẵn mạch, code và luồng hoạt động.')
  const projectFileInput = useRef<HTMLInputElement>(null)
  const [projectName,setProjectName]=useState(()=>workspace.libraryEntryName??workspace.projectName??getBuilderLesson(workspace.lesson??'blink').title)
  const [portableProjectId,setPortableProjectId]=useState(workspace.projectId)
  const [documentName,setDocumentName]=useState(workspace.projectName)
  const [libraryEntryId,setLibraryEntryId]=useState(workspace.libraryEntryId)
  const [librarySaveError,setLibrarySaveError]=useState('')
  const [librarySaveNotice,setLibrarySaveNotice]=useState('')
  const [missingLibraryEntry,setMissingLibraryEntry]=useState(false)
  const importRequest = useRef(0)
  const readImportRecovery = useRef<() => ReturnType<typeof createCurrentProjectBundle> | undefined>(() => undefined)
  useLayoutEffect(() => () => { importRequest.current++ }, [workspaceStorageKey])
  const [draftRecoveryAvailable,setDraftRecoveryAvailable]=useState(()=>{try{return Boolean(getBrowserStorage('localStorage').getItem('machmo-draft-recovery'))}catch{return false}})
  const selectedPalette = useMemo(()=>palette.filter(part=>`${part.label} ${part.role} ${part.pinNames.join(' ')}`.toLocaleLowerCase('vi-VN').includes(paletteSearch.trim().toLocaleLowerCase('vi-VN'))),[paletteSearch])
  const pin = target.codePin
  const ledPathDiagnosticCodes = new Set(['led-series-path','ldr-led-path-open','potentiometer-led-path-open'])
  const ledPathValid = placed.some(part=>part.type==='led')&&placed.some(part=>part.type==='resistor')&&!diagnostics.some(item=>item.severity==='error'&&(ledPathDiagnosticCodes.has(item.code)||item.code.startsWith('led-no-series-resistor-')||item.code.startsWith('led-reversed-')))
  const sevenSegmentPathValid = lessonId==='seven-segment-counter'&&!diagnostics.some(item=>item.severity==='error'&&item.code.startsWith('segment-'))
  const analogGeneratedCode=`const int ledPin = ${target.codePin};\nconst int potPin = ${inputAlias.pin};\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(potPin, INPUT);\n}\n\nvoid loop() {\n  int potPercent = ${analogPercentExpression(target,'potPin')};\n  if (potPercent > ${analogThreshold}) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(50);\n}`
  const analogBlockOrderValid=analogBlocks.length===analogBlockOrder.length&&analogBlocks.every((item,index)=>item===analogBlockOrder[index])
  const branchLesson=lessonId==='button-led'||lessonId==='ir-alert'?lessonId:null
  const branchGeneratedCode=branchLesson?getBuilderLesson(branchLesson).code(target,inputAlias.pin):''
  const branchOrderValid=branchBlocks.length===inputBranchBlockOrder.length&&branchBlocks.every((item,index)=>item===inputBranchBlockOrder[index])
  const effectiveCode=lessonId==='blink'&&codeMode==='blocks'?generateLedCpp(blockProgram):lessonId==='analog-potentiometer'?(analogMode==='blocks'?analogGeneratedCode:analogCppDraft):branchLesson?(branchMode==='blocks'?branchGeneratedCode:branchDrafts[branchLesson]):code
  const workspaceFingerprint=useMemo(()=>createWorkspaceSimulationFingerprint({boardId:target.boardId,lessonId,code:effectiveCode,parts:placed.map(part=>({id:part.id,type:part.type,value:part.value})),wires}),[target.boardId,lessonId,effectiveCode,placed,wires])
  const workspaceSpiceResultId=searchParams.get('workspaceSpiceResult')
  const parsedLesson=useMemo(()=>parseEducationalProgram(effectiveCode,lessonId),[effectiveCode,lessonId])
  const programFrame=useMemo(()=>parsedLesson.ok&&simulationProvider?simulationProvider.evaluate(parsedLesson.program,{pressed,detected,distanceCm,potPercent,lightPercent,elapsedMs:sim.elapsedMs,digit:displayDigit,conceptValue,converterMode,motorCommand}):null,[parsedLesson,simulationProvider,pressed,detected,distanceCm,potPercent,lightPercent,sim.elapsedMs,displayDigit,conceptValue,converterMode,motorCommand])
  const blockOrderIssue=lessonId==='analog-potentiometer'&&analogMode==='blocks'&&!analogBlockOrderValid?'Thứ tự khối chưa đúng. Hãy sắp xếp theo luồng đọc → so sánh → bật LED → ngược lại → tắt LED.':branchLesson&&branchMode==='blocks'&&!branchOrderValid?'Thứ tự khối chưa đúng. Hãy sắp xếp theo luồng đọc tín hiệu → kiểm tra điều kiện → bật LED → ngược lại tắt LED.':undefined
  const codeIssue=blockOrderIssue??(parsedLesson.ok?findProgramTargetMismatch(parsedLesson.program,target,lessonId):`Dòng ${parsedLesson.line}: ${parsedLesson.message}`)
  const practiceChallengeKinds=getPracticeChallengeKinds(lessonId)
  const supportsLedPrediction=practiceChallengeKinds.includes('led-prediction')
  useEffect(()=>{setLedPrediction(null);setLedPredictionFeedback('')},[lessonId,effectiveCode,pressed,detected,distanceCm,potPercent,lightPercent])
  function checkLedPrediction(){
    if(ledPrediction===null||!programFrame){setLedPredictionFeedback('Chọn một dự đoán và kiểm tra code/mạch trước.');return}
    if(hasCircuitErrors){setLedPredictionFeedback('Mạch đang có lỗi nên LED không sáng theo code. Hãy sửa mạch rồi kiểm tra lại dự đoán.');return}
    setLedPredictionFeedback(ledPrediction===programFrame.ledOn?'Chính xác. Hãy chạy hoặc chạy từng bước để theo dõi tín hiệu.':'Chưa khớp. Hãy lần theo đầu vào → điều kiện trong code → GPIO → LED, rồi thử lại.')
  }
  const lessonOutput=programFrame?.ledOn??false
  // A parsed program describes a possible output before it has run. Keep the
  // canvas idle until Run or Step has produced a simulation frame.
  const simulationActive=running||tick>0
  const circuitValid=!hasCircuitErrors&&(lessonId!=='seven-segment-counter'||sevenSegmentPathValid)
  const {gpioHigh,ledLit}=deriveOutputState({active:simulationActive,gpioHigh:programFrame?.level==='HIGH',ledOn:lessonOutput,circuitValid})
  const physicalSignalActive=Boolean(simulationActive&&circuitValid&&(lessonId==='blink'||lessonId==='source-led')&&parsedLesson.ok)
  const activeFlow=simulationActive?(programFrame?.trace??(parsedLesson.ok?[]:[parsedLesson.message])):parsedLesson.ok?['Chạy mô phỏng hoặc chạy từng bước để tạo luồng hoạt động.']:[parsedLesson.message]
  const ldrDivider = programFrame && 'divider' in programFrame ? programFrame.divider as LdrDividerResult | undefined : undefined
  const inputOutputChallenge = parsedLesson.ok && programFrame ? (() => {
    const program = parsedLesson.program
    if (program.kind === 'analog-threshold' && 'analogPercent' in programFrame && typeof programFrame.analogPercent === 'number') {
      return {
        title: 'Tìm hai phía của ngưỡng',
        inputLabel: program.sensor === 'ldr' ? 'Analog sau bộ chia LDR' : 'Tín hiệu biến trở',
        inputReading: `${programFrame.analogPercent.toFixed(1)}%`,
        instruction: 'Thay đổi đầu vào, ghi nhận một mức làm LED tắt và một mức làm LED sáng. Đối chiếu quan sát với điều kiện trong code.',
        rule: `analog > ${program.threshold}% → ${program.above === 'HIGH' ? 'LED sáng' : 'LED tắt'}; ngược lại → ${program.below === 'HIGH' ? 'LED sáng' : 'LED tắt'}`,
      }
    }
    if (program.kind === 'ultrasonic') {
      return {
        title: 'Tìm hai phía của ngưỡng khoảng cách',
        inputLabel: 'Khoảng cách ảo',
        inputReading: `${distanceCm.toFixed(1)} cm`,
        instruction: 'Thay đổi khoảng cách ảo, ghi nhận một mức làm LED tắt và một mức làm LED sáng. Đối chiếu quan sát với điều kiện trong code.',
        rule: `khoảng cách < ${program.thresholdCm} cm → ${program.whenNear === 'HIGH' ? 'LED sáng' : 'LED tắt'}; ngược lại → ${program.whenFar === 'HIGH' ? 'LED sáng' : 'LED tắt'}`,
      }
    }
    if (program.kind === 'input-branch') {
      const inputLabel = program.source === 'button' ? 'Nút nhấn ảo' : 'Cảm biến hồng ngoại ảo'
      const inputReading = program.source === 'button' ? (pressed ? 'Đang nhấn' : 'Đang nhả') : (detected ? 'Phát hiện vật' : 'Không phát hiện vật')
      return {
        title: 'Lần theo đầu vào tới LED',
        inputLabel,
        inputReading,
        instruction: `Thử hai trạng thái của ${inputLabel.toLocaleLowerCase('vi-VN')}, rồi ghi nhận một trạng thái làm LED tắt và một trạng thái làm LED sáng.`,
        rule: `digitalRead(GPIO ${program.inputPin}) = ${program.condition} → GPIO ${program.whenTrue}; ngược lại → GPIO ${program.whenFalse}`,
      }
    }
    return undefined
  })() : undefined
  const scenarioPrediction = parsedLesson.ok && parsedLesson.program.kind === 'concept' && programFrame ? (() => {
    const program = parsedLesson.program
    if (program.lesson === 'buck-boost-concept' && 'converter' in programFrame && programFrame.converter) {
      const { input, output, mode } = programFrame.converter
      const expected = output < input ? 'lower' : output > input ? 'higher' : 'same'
      const relation = expected === 'lower' ? 'thấp hơn' : expected === 'higher' ? 'cao hơn' : 'bằng'
      return {
        title: 'So sánh đầu vào và đầu ra mục tiêu',
        prompt: `Theo mô hình hiện tại, điện áp mục tiêu ở đầu ra ${mode === 'buck' ? 'buck' : 'boost'} sẽ thế nào so với đầu vào?`,
        label: 'Dự đoán quan hệ điện áp của bộ chuyển đổi',
        options: [{ value: 'lower', label: 'Thấp hơn' }, { value: 'same', label: 'Bằng nhau' }, { value: 'higher', label: 'Cao hơn' }],
        expected,
        observed: `Mục tiêu ${input.toFixed(1)} V → ${output.toFixed(1)} V, tức ${relation} đầu vào.`,
      }
    }
    if (program.lesson === 'dc-motor-driver' && 'motor' in programFrame && programFrame.motor) {
      const expected = programFrame.motor.direction === 'Thuận chiều' ? 'forward' : programFrame.motor.direction === 'Đảo chiều' ? 'reverse' : 'stop'
      return {
        title: 'Dự đoán trạng thái motor',
        prompt: 'Với lệnh điều khiển đang chọn, motor sẽ quay thuận, đảo chiều hay dừng?',
        label: 'Dự đoán chiều motor trong kịch bản',
        options: [{ value: 'forward', label: 'Quay thuận' }, { value: 'reverse', label: 'Đảo chiều' }, { value: 'stop', label: 'Dừng' }],
        expected,
        observed: `${programFrame.motor.direction}; PWM logic ${programFrame.motor.pwm}%.`,
      }
    }
    if (program.lesson === 'mosfet-switch' && 'loadEnabled' in programFrame) {
      const expected = programFrame.loadEnabled ? 'on' : 'off'
      return {
        title: 'Theo dõi Gate tới tải',
        prompt: 'Với mức Gate ảo hiện tại, tải sẽ được đóng cắt hay ngắt?',
        label: 'Dự đoán trạng thái tải qua MOSFET',
        options: [{ value: 'on', label: 'Đóng cắt tải' }, { value: 'off', label: 'Ngắt tải' }],
        expected,
        observed: programFrame.loadEnabled ? 'Tải đang đóng cắt theo giả định logic HIGH.' : 'Tải đang ngắt theo giả định logic LOW.',
      }
    }
    return undefined
  })() : undefined
  const workspaceSpice = useMemo(() => compileWorkspaceSpice({ parts: placed, connections: wires, boardLogicLevel: target.logicLevel, boardId: target.boardId, boardPinLabels: { input: inputAlias.label } }), [placed, wires, target.logicLevel, target.boardId, inputAlias.label])
  const openWorkspaceInSpice = () => {
    if (!workspaceSpice.ok) return
    const returnTo = productRoute(`${location.pathname}${location.search}`)
    const id = storeWorkspaceSpiceHandoff(getBrowserStorage('sessionStorage'), workspaceSpice, getBuilderLesson(lessonId).title, Date.now(), undefined, returnTo, workspaceFingerprint)
    if (!id) {
      setNotice('Không lưu được netlist SPICE trong phiên tab này. Hãy kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.')
      return
    }
    navigate(productRoute(`/tools/spice?workspaceSpice=${encodeURIComponent(id)}`))
  }

  function persistCircuitDocV2(next: CircuitDocV2) {
    const currentEnvelope = v2EnvelopeRef.current
    if (!v2Editable || !currentEnvelope) { setV2Notice('Hãy tạo bản nháp v5 hoặc chấp nhận bản xem trước trước khi chỉnh sửa.'); return }
    const candidate: CircuitWorkspaceV5 = { ...currentEnvelope, circuit: next, updatedAt: Date.now() }
    const result = saveWorkspaceV5(workspaceStorage, candidate)
    if (result.status !== 'saved') { setV2Notice(result.reason); return }
    setV2Doc(result.value.circuit)
    setV2Envelope(result.value)
    v2EnvelopeRef.current = result.value
    setV2SelectedWireId(current => current && result.value.circuit.wires.some(wire => wire.id === current) ? current : null)
    setV2Notice('Đã lưu bản nháp v5 trên thiết bị. Bản schema 4 vẫn được giữ nguyên.')
  }

  function acceptV2Migration() {
    if (v2Read.status !== 'v4') return
    const result = acceptV4Migration(workspaceStorage, v2Read.preview)
    if (result.status !== 'saved') { setV2Notice(result.reason); return }
    setV2Envelope(result.value)
    v2EnvelopeRef.current = result.value
    setV2Doc(result.value.circuit)
    setV2Editable(true)
    setMode('place')
    setPending(null)
    setV2Notice('Đã tạo bản v5 sau khi kiểm tra preview. Bản schema 4 được giữ nguyên byte.')
  }

  function startV2LessonDraft() {
    if (v2Read.status === 'invalid-v5') { setV2Notice(v2Read.reason); return }
    const sourceFields = v2Read.status === 'v4' ? v2Read.preview.candidate.workspaceFields : {}
    const preservedFields = {
      ...sourceFields,
      code,
      codeMode,
      blockProgram,
      analogCppDraft,
      analogMode,
      analogThreshold,
      analogBlockOrder: analogBlocks,
      projectId: portableProjectId,
      projectName: portableName,
      libraryEntryId,
      libraryEntryName: projectName,
    }
    const candidate: CircuitWorkspaceV5 = {
      schemaVersion: 5,
      circuit: v2Doc,
      layout: Object.fromEntries(v2Doc.parts.map((part, index) => [part.id, { x: 20 + (index % 4) * 20, y: 30 + Math.floor(index / 4) * 20 }])),
      boardId: board,
      lessonId: v2Doc.lessonId,
      workspaceFields: preservedFields,
      source: { key: 'machmo-builder-session', schemaVersion: 4 },
      updatedAt: Date.now(),
    }
    const result = saveWorkspaceV5(workspaceStorage, candidate)
    if (result.status !== 'saved') { setV2Notice(result.reason); return }
    setV2Envelope(result.value)
    v2EnvelopeRef.current = result.value
    setV2Doc(result.value.circuit)
    setV2LessonPreview(false)
    setV2Editable(true)
    setMode('place')
    setPending(null)
    setV2Notice('Đã tạo bản nháp mạch v5. Bản schema 4 được giữ nguyên để khôi phục.')
  }

  function commitV2Wire(from: CircuitEndpointV2, to: CircuitEndpointV2, role: 'power' | 'ground' | 'signal') {
    let serial = v2Doc.wires.length + 1
    while (v2Doc.wires.some(wire => wire.id === `wire-v2-${serial}`)) serial += 1
    const result = addCircuitWire(v2Doc, { id: `wire-v2-${serial}`, from, to, role })
    if (result.doc === v2Doc) { setV2Notice(result.issues.find(issue => issue.severity === 'error')?.message ?? 'Không thể tạo dây theo các cổng CircuitDocV2.'); return }
    persistCircuitDocV2(result.doc)
    setV2SelectedWireId(`wire-v2-${serial}`)
    setV2PendingEndpoint(null)
  }

  function editV2WireEndpoint(id: string, end: 'from' | 'to', endpoint: CircuitEndpointV2) {
    const result = editWireEndpoint(v2Doc, id, end, endpoint)
    if (result.doc === v2Doc) { setV2Notice(result.issues.find(issue => issue.severity === 'error')?.message ?? 'Thay đổi endpoint không vượt qua kiểm tra.'); return }
    persistCircuitDocV2(result.doc)
  }

  function changeV2WireRole(id: string, role: 'power' | 'ground' | 'signal') {
    const result = setWireRole(v2Doc, id, role)
    if (result.doc === v2Doc) { setV2Notice(result.issues.find(issue => issue.severity === 'error')?.message ?? 'Không thể đổi vai trò dây.'); return }
    persistCircuitDocV2(result.doc)
  }

  function removeV2Wire(id: string) {
    const result = removeCircuitWire(v2Doc, id)
    if (result.doc === v2Doc) { setV2Notice(result.issues.find(issue => issue.severity === 'error')?.message ?? 'Không thể xóa dây.'); return }
    persistCircuitDocV2(result.doc)
  }
  const ldrSpiceBlockReason = lessonId === 'analog-ldr' ? getLdrDividerSpiceBlockReason({
    lessonId,
    boardLogicLevel: target.logicLevel,
    hasCircuitErrors,
    placedParts: placed,
  }) : undefined
  const openLdrDividerInSpice = () => {
    const handoff = {
      ...createCalculatorSpiceHandoff('ldr-divider', { lightPercent }),
      returnTo: productRoute(`${location.pathname}${location.search}`),
    }
    const encoded = serializeCalculatorSpiceHandoff(handoff)
    if (!encoded) {
      setNotice('Không thể tạo bản nháp SPICE hợp lệ từ bộ chia áp LDR hiện tại.')
      return
    }
    navigate(`${productRoute('/tools/spice')}?calculatorSpice=${encodeURIComponent(encoded)}`)
  }
  function stopFirmwareSimulation(status:SimulationSessionStatus='stopped') {
    const worker=avrWorkerRef.current
    const runId=avrRunIdRef.current
    if(worker&&runId){try{worker.postMessage({type:'stop',runId})}catch{}}
    worker?.terminate()
    avrWorkerRef.current=null
    avrRunIdRef.current=''
    if(avrTimeoutRef.current!==undefined)window.clearTimeout(avrTimeoutRef.current)
    avrTimeoutRef.current=undefined
    setFirmwareRunning(false)
    if(runId)setFirmwareStatus(status)
  }
  async function handleFirmwareFile(file?:File, sample=false) {
    const request=firmwareLoadGuard.current.start()
    setFirmwareLoading(false)
    stopFirmwareSimulation()
    setFirmwareSource('');setFirmwareFileName('');setFirmwareConfirmed(false);setFirmwareFrame(undefined);setFirmwareError('');setFirmwareStatus('ready')
    if(!file&&!sample){setFirmwareLoading(false);return}
    if(!firmwareTarget){setFirmwareError('Chỉ hỗ trợ firmware AVR8js trên Arduino Uno R3 và Nano classic dùng ATmega328P.');setFirmwareStatus('unsupported');return}
    if(file&&file.size>2*1024*1024){setFirmwareError('Tệp HEX vượt giới hạn 2 MiB.');setFirmwareStatus('invalid');return}
    try {
      setFirmwareLoading(true)
      const source=sample?await fetchFirmwareText(arduinoBlinkSamplePath,request.signal):await file!.text()
      if(!request.isCurrent())return
      const image=inspectIntelHex(source,{maxInputCharacters:2*1024*1024,maxBytes:firmwareTarget.flashBytes})
      if(image.segments.some(segment=>segment.address+segment.data.length>firmwareTarget.flashBytes))throw new Error(`Firmware vượt bộ nhớ flash ${firmwareTarget.flashBytes/1024} KB của ATmega328P.`)
      setFirmwareSource(source);setFirmwareFileName(sample?arduinoBlinkSampleName:file!.name);setFirmwareStatus('ready')
    } catch(error) {
      if(!request.isCurrent())return
      setFirmwareError(error instanceof Error?error.message:'Không đọc được tệp Intel HEX.');setFirmwareStatus('invalid')
    } finally { if(request.isCurrent())setFirmwareLoading(false) }
  }
  function runFirmwareSimulation() {
    if(!firmwareTarget){setFirmwareStatus('unsupported');setFirmwareError('Board đang chọn chưa có firmware emulator AVR8js.');return}
    if(!firmwareSource||!canRunAtmega328pFirmware(target.boardId,firmwareConfirmed)){setFirmwareStatus('invalid');setFirmwareError('Chọn tệp HEX hợp lệ và xác nhận tệp được biên dịch cho ATmega328P trước khi chạy.');return}
    stopFirmwareSimulation('stopped')
    setRunning(false);setTick(0);setEducationalProgram(null);setFirmwareFrame(undefined);setFirmwareError('');setFirmwareStatus('running');setFirmwareRunning(true)
    const runId=createSimulationRunId()
    avrRunIdRef.current=runId
    let worker:Worker
    try { worker=new Worker(new URL('../workers/avr8js.worker.ts',import.meta.url),{type:'module'}) }
    catch { avrRunIdRef.current='';setFirmwareRunning(false);setFirmwareStatus('failed');setFirmwareError('Trình duyệt không hỗ trợ khởi chạy Web Worker cho AVR8js.');return }
    avrWorkerRef.current=worker
    avrTimeoutRef.current=window.setTimeout(()=>{
      if(!isCurrentSimulationRun(runId,avrRunIdRef.current))return
      worker.terminate();if(avrWorkerRef.current===worker)avrWorkerRef.current=null
      avrRunIdRef.current='';avrTimeoutRef.current=undefined;setFirmwareRunning(false);setFirmwareStatus('timeout');setFirmwareError('Đã dừng firmware sau 30 giây chờ thực tế để bảo vệ workspace. Thử lại hoặc kiểm tra HEX nếu worker không phản hồi.')
    },30_000)
    worker.onmessage=(event:MessageEvent<AVR8jsWorkerResponse>)=>{
      const message=event.data
      if(!isCurrentSimulationRun(message.runId,avrRunIdRef.current))return
      if('frame'in message)setFirmwareFrame(message.frame)
      if(message.type==='error'){setFirmwareError(message.message);setFirmwareStatus('failed')}
      if(message.type==='complete')setFirmwareStatus('completed')
      if(message.type==='complete'||message.type==='error'||message.type==='stopped'){
        setFirmwareRunning(false);avrRunIdRef.current=''
        if(avrTimeoutRef.current!==undefined)window.clearTimeout(avrTimeoutRef.current)
        avrTimeoutRef.current=undefined;worker.terminate();if(avrWorkerRef.current===worker)avrWorkerRef.current=null
      }
    }
    worker.onerror=()=>{
      if(!isCurrentSimulationRun(runId,avrRunIdRef.current))return
      setFirmwareError('Worker AVR gặp lỗi. Hãy kiểm tra firmware và thử lại.');setFirmwareStatus('failed');setFirmwareRunning(false);avrRunIdRef.current=''
      if(avrTimeoutRef.current!==undefined)window.clearTimeout(avrTimeoutRef.current)
      avrTimeoutRef.current=undefined;worker.terminate();if(avrWorkerRef.current===worker)avrWorkerRef.current=null
    }
    worker.postMessage({type:'start',runId,hex:firmwareSource,targetId:firmwareTarget.boardId})
    if (!recordLessonSimulationStarted(lessonId, target.boardId, target.name, 'avr8js-firmware')) {
      setNotice('Firmware đã bắt đầu, nhưng không lưu được lịch sử thực hành vào trình duyệt này.')
    }
  }
  function changeSimulationRuntime(next:BuilderSimulationRuntime) {
    if(next===simulationRuntime)return
    firmwareLoadGuard.current.cancel();setFirmwareLoading(false)
    stopFirmwareSimulation()
    setRunning(false);setTick(0);setEducationalProgram(null);elapsedRef.current=0;digitRef.current=0;setDisplayDigit(0);setSim(initialEduState(target.codePin))
    setFirmwareFrame(undefined);setFirmwareError('');setFirmwareStatus('ready')
    dismissWorkspaceSpiceObservation()
    setSimulationRuntime(next)
  }
  function dismissWorkspaceSpiceObservation() {
    clearWorkspaceSpiceObservation(getBrowserStorage('sessionStorage'),workspaceSpiceObservationIdRef.current)
    workspaceSpiceObservationIdRef.current=null
    setWorkspaceSpiceObservation(undefined)
  }
  useEffect(()=>{
    const previous=workspaceFingerprintRef.current
    workspaceFingerprintRef.current=workspaceFingerprint
    if(previous===null||previous===workspaceFingerprint)return
    firmwareLoadGuard.current.cancel();setFirmwareLoading(false)
    stopFirmwareSimulation()
    setFirmwareFrame(undefined);setFirmwareError('');setFirmwareStatus('ready')
    setRunning(false);setTick(0);elapsedRef.current=0;digitRef.current=0;setDisplayDigit(0);setEducationalProgram(null);setSim(initialEduState(target.codePin))
    dismissWorkspaceSpiceObservation()
  },[workspaceFingerprint,target.codePin])
  useEffect(()=>()=>{
    firmwareLoadGuard.current.cancel()
    avrWorkerRef.current?.terminate();avrWorkerRef.current=null
    if(avrTimeoutRef.current!==undefined)window.clearTimeout(avrTimeoutRef.current)
  },[])
  useEffect(()=>{
    if(!workspaceSpiceResultId||consumedWorkspaceSpiceResultRef.current===workspaceSpiceResultId)return
    consumedWorkspaceSpiceResultRef.current=workspaceSpiceResultId
    const observation=readWorkspaceSpiceObservation(getBrowserStorage('sessionStorage'),workspaceSpiceResultId,workspaceFingerprint)
    if(observation){workspaceSpiceObservationIdRef.current=workspaceSpiceResultId;setWorkspaceSpiceObservation(observation);clearWorkspaceSpiceObservation(getBrowserStorage('sessionStorage'),workspaceSpiceResultId);setNotice('Đã nhận waveform SPICE cho đúng revision của mạch workspace.')}
    else {clearWorkspaceSpiceObservation(getBrowserStorage('sessionStorage'),workspaceSpiceResultId);setNotice('Kết quả SPICE không còn hợp lệ, đã hết hạn hoặc thuộc revision workspace khác. Hãy chạy lại SPICE từ mạch hiện tại.')}
    const next=new URLSearchParams(searchParams);next.delete('workspaceSpiceResult');setSearchParams(next,{replace:true})
  },[workspaceSpiceResultId,workspaceFingerprint,searchParams,setSearchParams])
  useEffect(()=>{
    firmwareLoadGuard.current.cancel();setFirmwareLoading(false)
    setFirmwareConfirmed(false);setFirmwareFrame(undefined);setFirmwareError('');setFirmwareStatus('ready')
    setFirmwareSource('');setFirmwareFileName('')
    if(!firmwareTarget&&simulationRuntime==='firmware')setSimulationRuntime('lesson')
  },[target.boardId])
  useEffect(()=>{
    if(!running||!educationalProgram||educationalProgram.kind==='concept')return
    const period=educationalProgram.kind==='seven-segment'?educationalProgram.stepMs:educationalProgram.kind==='ultrasonic'||educationalProgram.kind==='analog-threshold'?educationalProgram.sampleMs:educationalProgram.kind==='input-branch'?Math.max(100,educationalProgram.debounceMs):educationalProgram.kind==='blink'?Math.max(50,Math.min(1000,Math.min(educationalProgram.onMs,educationalProgram.offMs))):500
    const timer=window.setInterval(()=>{
      const nextElapsed=elapsedRef.current+period
      elapsedRef.current=nextElapsed
      const nextDigit=educationalProgram.kind==='seven-segment'?(digitRef.current+1)%10:digitRef.current
      digitRef.current=nextDigit
      const frame=simulationProvider?.evaluate(educationalProgram,{pressed,detected,distanceCm,potPercent,lightPercent,elapsedMs:nextElapsed,digit:nextDigit,conceptValue,converterMode,motorCommand})
      if(!frame)return
      if(educationalProgram.kind==='seven-segment')setDisplayDigit(nextDigit)
      setTick(value=>value+1)
      setSim(current=>({...current,ledOn:frame.ledOn,elapsedMs:nextElapsed,messages:frame.trace,halted:false}))
    },Math.max(50,period))
    return()=>window.clearInterval(timer)
  },[running,educationalProgram,simulationProvider,pressed,detected,distanceCm,potPercent,lightPercent,conceptValue,converterMode,motorCommand])
  const nextLessonId=getNextLessonId(lessonId)
  const nextLesson=curriculumLessons.find(item=>item.id===nextLessonId)
  const v2DocumentPreview = v2LessonPreview || (v2Read.status === 'v4' && !v2Editable)
  const v2CircuitActive = v2Editable || v2DocumentPreview
  const circuitStatus=getCircuitStatus({wireCount:wires.length,errorCount:diagnostics.filter(item=>item.severity==='error').length,running,hasRun:tick>0})
  const circuitStatusLabel = v2CircuitActive ? 'Chưa có trace cho mạch v5' : circuitStatus.label
  const simulationCapabilityMessage = v2CircuitActive
    ? 'Provider bài học hiện chưa nhận topology CircuitDocV2. Trace của workspace cũ được giữ trống để không tô sáng sai mạch v5.'
    : providerResolution.message
  const v2SelectedPart = v2Doc.parts.find(part => part.id === selectedPartId)
  const v2SelectedDefinition = v2SelectedPart && componentRegistry.find(item => item.id === v2SelectedPart.type)
  const guidance=v2CircuitActive
    ? { tone: 'info' as const, title: v2Editable ? 'Mạch v5 chưa có trace mô phỏng' : 'Đang xem trước topology mạch v5', detail: simulationCapabilityMessage }
    : getBuilderGuidance({step:builderStep,lessonTitle:lesson.title,lockReason:providerResolution.available?undefined:providerResolution.message,fallbackBoardName:getSimulationTarget('esp32-devkit').name,diagnostics,codeIssue,running,hasRun:tick>0,wireMode:mode==='wire',pendingPin:pending!==null,awaitingPrediction:supportsLedPrediction&&ledPrediction===null&&!simulationActive,nextLessonTitle:nextLesson?.title})
  const simulationInstrumentStatus:SimulationSessionStatus=simulationRuntime==='firmware'
    ? !firmwareTarget?'unsupported':firmwareStatus==='ready'&&!firmwareSource?'invalid':firmwareStatus
    : v2CircuitActive?'unsupported':hasCircuitErrors||Boolean(codeIssue)?'invalid':!providerResolution.available?'unsupported':running?'running':tick>0?'completed':'ready'
  const simulationInstrumentStatusMessage=simulationRuntime==='firmware'
    ? !firmwareTarget
      ? 'Firmware emulator hiện chỉ hỗ trợ Uno R3 và Nano classic với ATmega328P.'
      : firmwareStatus==='running'
        ? 'AVR8js đang thực thi HEX trong Web Worker; mốc chạy giới hạn một giây mô phỏng.'
        : firmwareStatus==='completed'
          ? 'Đã chạy một giây mô phỏng ATmega328P. Chỉ quan sát LED tích hợp D13/PB5 và byte UART0; không nối sang LED ngoài trên canvas.'
          : firmwareError || (!firmwareSource ? 'Chọn tệp Intel HEX hợp lệ để bắt đầu.' : !firmwareConfirmed ? 'Xác nhận MCU đích ATmega328P trước khi chạy.' : 'Sẵn sàng chạy firmware AVR trong worker cô lập.')
    : v2CircuitActive
      ? simulationCapabilityMessage
      : hasCircuitErrors
      ? `Mạch có ${diagnostics.filter(item=>item.severity==='error').length} lỗi; hãy sửa topology trước khi chạy.`
      : !providerResolution.available ? providerResolution.message : codeIssue ? codeIssue : running ? 'Provider bài học đang tạo trace từ đầu vào ảo.' : tick>0 ? 'Trace giáo dục đã cập nhật; đây không phải phép đo điện.' : 'Chạy hoặc chạy từng bước để tạo trace từ provider bài học.'
  const diagnosticGroups=groupDiagnostics(diagnostics)
  useEffect(()=>{
    if(!stepMounted.current){stepMounted.current=true;return}
    stepHeadingRef.current?.focus({preventScroll:true})
    document.getElementById('builder-stepper')?.scrollIntoView({block:'start',behavior:'instant'})
  },[builderStep])
  function revealGuidance(){guidanceRef.current?.focus({preventScroll:true});guidanceRef.current?.scrollIntoView({block:'center',behavior:'instant'})}
  useEffect(()=>{if(!running||!hasCircuitErrors)return;setRunning(false);setNotice(`Đã dừng mô phỏng vì mạch đang lỗi: ${diagnostics.find(item=>item.severity==='error')?.message??'kiểm tra lại dây nối.'}`)},[running,hasCircuitErrors,diagnostics])
  const portableName = guidedLesson ? projectName : documentName
  // Read-only lesson and V4 previews can export their preserved schema-4 source.
  // Do not serialize a user-edited V2 document or fall back from invalid storage.
  const v2ExportUnsupported = v2Editable || v2Read.status === 'invalid-v4' || v2Read.status === 'invalid-v5'
  useEffect(()=>{
    // A fresh lesson preview has no V5 edits to persist yet, but keep the
    // legacy workspace key alive for linked project metadata and recovery.
    // Never touch a V4 source while it is awaiting a migration decision.
    if(v2DocumentPreview && v2Read.status !== 'empty'){setSaveStatus('saved');return}
    if(v2Editable){
      const current=v2EnvelopeRef.current
      if(!current){setSaveStatus('error');return}
      const candidate:CircuitWorkspaceV5={...current,circuit:v2Doc,boardId:board,lessonId:v2Doc.lessonId,workspaceFields:{...current.workspaceFields,code,codeMode,blockProgram,analogCppDraft,analogMode,analogThreshold,analogBlockOrder:analogBlocks,projectId:portableProjectId,projectName:portableName,libraryEntryId,libraryEntryName:projectName},updatedAt:Date.now()}
      const saved=saveWorkspaceV5(workspaceStorage,candidate)
      if(saved.status==='saved'){v2EnvelopeRef.current=saved.value;setSaveStatus('saved')}
      else {setSaveStatus('error');setV2Notice(saved.reason)}
      return
    }
    // Keep a schema-4 source byte-identical until the user accepts its v5 preview.
    if(v2MigrationNeedsDecision){setSaveStatus('saved');return}
    if(workspace.backupFailed){setSaveStatus('error');return}
    try {
      workspaceStorage.setItem(workspaceStorageKey,JSON.stringify({
        schemaVersion:4,placed,wires,simBoard:board,code,lesson:lessonId,codeMode,blockProgram,analogCppDraft,analogMode,analogThreshold,analogBlockOrder:analogBlocks,
        projectId:portableProjectId,projectName:portableName,libraryEntryId,libraryEntryName:projectName,
      }))
      setSaveStatus('saved')
    } catch {setSaveStatus('error')}
  },[workspace.backupFailed,workspaceStorage,workspaceStorageKey,placed,wires,board,code,lessonId,codeMode,blockProgram,analogCppDraft,analogMode,analogThreshold,analogBlocks,portableProjectId,portableName,libraryEntryId,projectName,v2Editable,v2DocumentPreview,v2Doc,v2MigrationNeedsDecision])
  const saveDraftWithStatus=useCallback((key:string,value:string)=>saveDraft(workspaceStorage,key,value,()=>{failedDraftKeys.current.add(key);setDraftSaveFailed(true)},()=>{failedDraftKeys.current.delete(key);setDraftSaveFailed(failedDraftKeys.current.size>0)}),[workspaceStorage])
  useEffect(()=>{saveDraftWithStatus(lessonDraftsStorageKey,JSON.stringify(lessonDrafts))},[saveDraftWithStatus,lessonDraftsStorageKey,lessonDrafts])
  useEffect(()=>{saveDraftWithStatus(branchStorageKey,JSON.stringify({mode:branchMode,drafts:serializedBranchDrafts(),order:branchBlocks}))},[saveDraftWithStatus,branchStorageKey,branchMode,branchDrafts,branchBlocks])
  function serializedBranchDrafts() { return Object.fromEntries([...persistedBranchKeys.current].map(id=>[id,branchDrafts[id]])) }
  function updateBranchDraft(id:BranchLessonId,value:string) { persistedBranchKeys.current.add(id);setBranchDrafts(current=>({...current,[id]:value})) }
  function updateCurrentCode(value:string) { setCode(value);setLessonDrafts(current=>({...current,[lessonId]:{...current[lessonId],[board]:value}})) }
  function exportProject() {
    if(v2ExportUnsupported){const message='Project schema 4 chưa thể biểu diễn CircuitDocV2 đầy đủ. Bản v5 được giữ trên thiết bị; không xuất một tệp có thể làm mất endpoint hoặc thông tin mạch.';setNotice(message);setV2Notice(message);return}
    const bundle=createCurrentProjectBundle()
    const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}))
    const link=document.createElement('a');link.href=url;link.download=`mach-mo-${lessonId}-${new Date().toISOString().slice(0,10)}.machmo.json`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
    setNotice('Đã xuất project Mạch Mở. Tệp này dùng để lưu trữ, chia sẻ hoặc làm cầu nối sang app khi app hỗ trợ định dạng project.')
  }

  async function exportSchematic(format: 'svg' | 'png') {
    if (!schematicExportRef.current) return
    try {
      await downloadSchematic(schematicExportRef.current, placed.length, format)
      setNotice(`Đã xuất sơ đồ ${format.toUpperCase()} từ topology hiện tại.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể xuất sơ đồ.')
    }
  }
  function createCurrentProjectBundle() {
    if(v2ExportUnsupported) throw new Error('Project schema 4 chưa thể biểu diễn CircuitDocV2 đầy đủ; bản v5 vẫn được giữ nguyên.')
    const rawWorkspace = v2Read.status === 'v4' ? JSON.parse(v2Read.raw) as Record<string, unknown> : {}
    const {libraryEntryId: _localEntryId,libraryEntryName: _localEntryName,...sourceWorkspace} = rawWorkspace
    return createProjectBundle({
      workspace:{...sourceWorkspace,schemaVersion:4,placed,wires,simBoard:board,code,lesson:lessonId,codeMode,blockProgram,analogCppDraft,analogMode,analogThreshold,analogBlockOrder:analogBlocks,projectId:portableProjectId,projectName:portableName},
      lessonDrafts,
      branchSession:{mode:branchMode,order:branchBlocks},
      branchDrafts:serializedBranchDrafts(),
    })
  }
  // File reading can outlive this render. Use the latest committed draft at confirmation.
  useLayoutEffect(() => {
    readImportRecovery.current = guidedLesson || v2ExportUnsupported ? () => undefined : createCurrentProjectBundle
  })
  function saveNamedProject(createNew = false) {
    setLibrarySaveNotice('')
    setLibrarySaveError('')
    if(v2ExportUnsupported){setLibrarySaveError('Project schema 4 chưa thể lưu CircuitDocV2 đầy đủ. Bản v5 vẫn được lưu trên thiết bị.');return}
    try {
      const saved = addSavedProject(projectName, createCurrentProjectBundle(), getBrowserStorage('localStorage'), createNew ? undefined : libraryEntryId)
      setLibraryEntryId(saved.id)
      setProjectName(saved.name)
      setMissingLibraryEntry(false)
      setLibrarySaveNotice(`Đã lưu “${saved.name}” vào thư viện trong trình duyệt này.`)
    } catch (error) {
      if (error instanceof MissingSavedProjectError) setMissingLibraryEntry(true)
      setLibrarySaveError(error instanceof Error ? error.message : 'Không lưu được vào thư viện. Bản đang mở vẫn còn.')
    }
  }
  function exportArduinoSketch() {
    const result=prepareArduinoSketchExport({code:effectiveCode,lessonId,target})
    if(!result.ok){setNotice(result.message);return}
    const url=URL.createObjectURL(new Blob([result.contents],{type:'text/x-c++src'}))
    const link=document.createElement('a');link.href=url;link.download=result.fileName;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
    setNotice(`Đã xuất ${result.fileName}. Mở trong Arduino IDE, chọn đúng board/core, biên dịch và kiểm tra pinout trước khi nạp phần cứng.`)
  }
  async function importProject(event:React.ChangeEvent<HTMLInputElement>) {
    const request = ++importRequest.current
    const file=event.target.files?.[0];event.target.value='';if(!file)return
    try {
      if(file.size>PROJECT_IMPORT_MAX_BYTES)throw new Error('Tệp project vượt giới hạn 5 MiB.')
      const text = await file.text()
      if (request !== importRequest.current) return
      const bundle=parseProjectBundle(JSON.parse(text))
      const raw=bundle.workspace as Record<string,unknown>
      if(!Array.isArray(raw.placed)||raw.placed.length<1||raw.placed.length>100)throw new Error('Danh sách linh kiện trong project không hợp lệ.')
      const validParts=raw.placed.every((item)=>{if(!item||typeof item!=='object')return false;const part=item as Record<string,unknown>;return typeof part.id==='string'&&typeof part.type==='string'&&componentRegistry.some(definition=>definition.id===part.type)&&Number.isFinite(part.x)&&Number.isFinite(part.y)&&Number(part.x)>=0&&Number(part.x)<=100&&Number(part.y)>=0&&Number(part.y)<=100})
      if(!validParts||!raw.placed.some((item)=>item&&typeof item==='object'&&(item as Record<string,unknown>).type==='board'))throw new Error('Project chứa linh kiện hoặc tọa độ không hợp lệ, hoặc thiếu board.')
      if(!Array.isArray(raw.wires)||raw.wires.length>500)throw new Error('Danh sách dây nối trong project không hợp lệ.')
      const knownBoard=normalizeSimulationTargetId(typeof raw.simBoard==='string'?raw.simBoard:undefined)
      if(typeof raw.simBoard!=='string'||knownBoard!==raw.simBoard)throw new Error('Project chọn board không có trong phiên bản này.')
      const knownLesson=builderLessons.some(item=>item.id===raw.lesson)
      if(!knownLesson)throw new Error('Project chọn bài học không hợp lệ.')
      const stagedStorage={getItem:()=>JSON.stringify(raw),setItem:()=>undefined} as unknown as Storage
      const restored=loadWorkspace(stagedStorage,'imported')
      if(restored.recovered||restored.placed.length!==raw.placed.length||restored.wires.length!==raw.wires.length)throw new Error('Không thể khôi phục đầy đủ linh kiện hoặc dây nối trong project.')
      const stagedDraftStorage={getItem:()=>JSON.stringify(bundle.lessonDrafts),setItem:()=>undefined} as unknown as Storage
      const drafts=loadLessonDrafts(stagedDraftStorage,'drafts')
      const stagedBranchStorage={getItem:()=>JSON.stringify({...bundle.branchSession,drafts:bundle.branchDrafts}),setItem:()=>undefined} as unknown as Storage
      const branch=loadBranchSession(stagedBranchStorage,'branch')
      const canonicalWorkspace={schemaVersion:4,projectId:restored.projectId,projectName:restored.projectName,placed:restored.placed,wires:restored.wires,simBoard:restored.board,code:restored.code,lesson:restored.lesson,codeMode:restored.codeMode,blockProgram:restored.blockProgram,analogCppDraft:restored.analogCppDraft,analogMode:restored.analogMode,analogThreshold:restored.analogThreshold,analogBlockOrder:restored.analogBlockOrder}
      if(!window.confirm('Nhập project sẽ thay workspace chính trên trình duyệt này. Workspace hiện tại sẽ được sao lưu để khôi phục. Tiếp tục?'))return
      const importedBundle=createProjectBundle({workspace:canonicalWorkspace,lessonDrafts:drafts,branchSession:{mode:branch.mode,order:branch.order},branchDrafts:branch.drafts??bundle.branchDrafts})
      replaceWorkspaceWithBundle(importedBundle,{storage:getBrowserStorage('localStorage'),recoveryBundle:readImportRecovery.current()})
      setDraftRecoveryAvailable(true)
      window.location.assign(productRoute('/build'))
    } catch(error) { if (request === importRequest.current) setLibrarySaveError(error instanceof Error?`Không nhập được project: ${error.message}`:'Không nhập được project. Hãy kiểm tra tệp JSON.') }
  }
  function changeBoard(nextBoard:string) {
    if(v2Editable || v2Read.status === 'v4'){setV2Notice('Hãy hoàn tất bản CircuitDocV2 hiện tại trước khi đổi board để giữ đúng pin map và dữ liệu mạch.');return}
    const nextTarget=getSimulationTarget(nextBoard),nextInput=getInputAlias(nextTarget,lessonId),savedDraft=lessonDrafts[lessonId]?.[nextBoard]
    const nextCode=savedDraft??getBuilderLesson(lessonId).code(nextTarget,nextInput.pin)
    setBoard(nextBoard);setCode(nextCode);setLessonDrafts(current=>({...current,[lessonId]:{...current[lessonId],[nextBoard]:nextCode}}))
    if(v2LessonPreview && nextBoard !== 'esp32-devkit'){setV2LessonPreview(false);setWorkspaceView('assembly')}
    else if(nextBoard === 'esp32-devkit' && v2Read.status === 'empty' && getLessonCircuitDoc(lessonId)){setV2Doc(getLessonCircuitDoc(lessonId)!);setV2LessonPreview(true);setWorkspaceView('breadboard-v2')}
    const analogSample=getBuilderLesson('analog-potentiometer').code(target,getInputAlias(target,'analog-potentiometer').pin)
    if(analogCppDraft.trim()===analogSample.trim())setAnalogCppDraft(getBuilderLesson('analog-potentiometer').code(nextTarget,getInputAlias(nextTarget,'analog-potentiometer').pin))
    if((lessonId==='button-led'||lessonId==='ir-alert')&&!persistedBranchKeys.current.has(lessonId))setBranchDrafts(current=>({...current,[lessonId]:getBuilderLesson(lessonId).code(nextTarget,nextInput.pin)}))
    elapsedRef.current=0;setTick(0)
    setBlockProgram(current=>({...current,pin:nextTarget.codePin,setup:current.setup.map(action=>({...action,pin:nextTarget.codePin})),loop:current.loop.map(action=>action.kind==='pinMode'?{...action,pin:nextTarget.codePin}:action.kind==='write'?{...action,pin:nextTarget.codePin}:action)}));setSim(initialEduState(nextTarget.codePin));setRunning(false);setNotice(`${nextTarget.name}: đã nạp nháp đã lưu cho board hoặc code mẫu tương ứng. Alias đầu vào ${nextInput.label}; hãy kiểm tra revision và pinout thật.`)
  }
  const backupFailedNotice='Không sao lưu được bản hiện tại nên chưa thay đổi gì. Hãy xuất project hoặc giải phóng bộ nhớ trình duyệt rồi thử lại.'
  function saveDraftRecovery():boolean{try{getBrowserStorage('localStorage').setItem('machmo-draft-recovery',JSON.stringify(createCurrentProjectBundle()));setDraftRecoveryAvailable(true);return true}catch{return false}}
  function restoreDraftRecovery() {
    try {
      const raw = getBrowserStorage('localStorage').getItem('machmo-draft-recovery')
      if (!raw) return
      const bundle = parseProjectBundle(JSON.parse(raw))
      const asStorage = (value: unknown) => ({ getItem: () => JSON.stringify(value), setItem: () => undefined }) as unknown as Storage
      const restored = loadWorkspace(asStorage(bundle.workspace), 'recovery')
      if (restored.recovered) throw new Error('Bản sao lưu không hợp lệ.')
      const restoredLesson = restored.lesson ?? 'blink'
      const restoredTarget = getSimulationTarget(restored.board)
      const branch = loadBranchSession(asStorage({ ...bundle.branchSession, drafts: bundle.branchDrafts }), 'recovery-branch')
      setPlaced(restored.placed)
      setWires(restored.wires)
      setBoard(restored.board)
      setLessonId(restoredLesson)
      setCodeMode(restored.codeMode ?? 'cpp')
      setAnalogBlocks(restored.analogBlockOrder ?? [...analogBlockOrder])
      setBuilderStep('assemble')
      setRunning(false)
      setTick(0)
      setLessonDrafts(loadLessonDrafts(asStorage(bundle.lessonDrafts), 'recovery-drafts'))
      setBranchMode(branch.mode)
      setBranchBlocks(branch.order)
      persistedBranchKeys.current = new Set(Object.keys(branch.drafts ?? {}))
      setBranchDrafts({
        'button-led': getBuilderLesson('button-led').code(restoredTarget, getInputAlias(restoredTarget, 'button-led').pin),
        'ir-alert': getBuilderLesson('ir-alert').code(restoredTarget, getInputAlias(restoredTarget, 'ir-alert').pin),
        ...branch.drafts,
      })
      setCode(restored.code ?? getBuilderLesson(restoredLesson).code(restoredTarget, getInputAlias(restoredTarget, restoredLesson).pin))
      setDocumentName(restored.projectName)
      setProjectName(restored.projectName ?? getBuilderLesson(restoredLesson).title)
      setPortableProjectId(restored.projectId)
      // Recovery bundles have no verified local library link.
      setLibraryEntryId(undefined)
      setMissingLibraryEntry(false)
      setLibrarySaveNotice('')
      setLibrarySaveError('')
      setAnalogCppDraft(restored.analogCppDraft ?? getBuilderLesson('analog-potentiometer').code(restoredTarget, getInputAlias(restoredTarget, 'analog-potentiometer').pin))
      setAnalogMode(restored.analogMode ?? 'blocks')
      setAnalogThreshold(restored.analogThreshold ?? 50)
      if (restored.blockProgram) setBlockProgram(restored.blockProgram)
      setNotice('Đã khôi phục bản sao lưu cục bộ.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không khôi phục được bản sao lưu.')
    }
  }
  function restoreCurrentSample() { if(!window.confirm('Khôi phục code mẫu sẽ thay bản nháp đang mở. Bản nháp được sao lưu để khôi phục. Tiếp tục?'))return;if(!saveDraftRecovery()){setNotice(backupFailedNotice);return}const sample=getBuilderLesson(lessonId).code(target,inputAlias.pin);if(lessonId==='analog-potentiometer'&&analogMode==='cpp')setAnalogCppDraft(sample);else if(branchLesson)updateBranchDraft(branchLesson,sample);else updateCurrentCode(sample);setNotice(`Đã khôi phục code mẫu ${lesson.title} cho ${target.name}. Bản nháp trước được sao lưu tại trình duyệt nếu còn dung lượng.`) }
  function wirePoint(endpoint:{partId:string;pinId:string}) { const part=placed.find(item=>item.id===endpoint.partId);if(!part)return {x:0,y:0};const pinIndexNumber=endpointIndex(endpoint,placed);const offsets=part.type==='board'?[-4,-2,0,2,4,6,...Array.from({length:7},(_,index)=>-6+index*2)]:part.type==='breadboard'?[-5,-1,3,7]:part.type==='seven-segment'?[-4,-3,-2,-1,0,1,2,3,-2,2]:[-2,2,0,0];const angle=(part.rotation??0)*Math.PI/180;const dx=offsets[pinIndexNumber]??0,dy=pinIndexNumber%2===0?-3:3;return {x:Math.max(3,Math.min(97,part.x+dx*Math.cos(angle)-dy*Math.sin(angle))),y:Math.max(5,Math.min(95,part.y+dx*Math.sin(angle)+dy*Math.cos(angle)))} }
  const logicInput=useMemo(()=>({lessonId,parts:placed,wires,frame:programFrame,active:simulationActive,hasCircuitErrors,inputs:{pressed,detected,potPercent,lightPercent},tick}),[lessonId,placed,wires,programFrame,simulationActive,hasCircuitErrors,pressed,detected,potPercent,lightPercent,tick])
  const logicTraceWires=useMemo(()=>getLogicTraceWireIds(logicInput),[logicInput])
  const logicFlows=useMemo(()=>getLogicFlow(logicInput),[logicInput])
  const partConnections=selectedPart&&selectedDefinition?getPartConnections(selectedPart.id,selectedDefinition.pins.map(item=>item.id),wires):[]
  const highlightedNetWireIds=useMemo(()=>new Set(getWireNetGroups(wires).find(group=>group.key===highlightedNetKey)?.wireIds??[]),[wires,highlightedNetKey])
  const boardPartId=placed.find(part=>part.type==='board')?.id??'board-1'
  const lessonBoardPinIds=getLessonBoardPinIds(lessonId,boardPartId,wires)
  const visibleSelectedPins=selectedDefinition?(selectedPart?.type==='board'?getVisibleBoardPins(selectedDefinition.pins,lessonBoardPinIds,showAllBoardPins):selectedDefinition.pins):[]
  const tracedConnection=partConnections.find(item=>`${selectedPart?.id}:${item.pinId}`===tracedPin)
  function shownPinLabel(type:string,index:number,fallback:string){if(type!=='board')return fallback;if(index===0)return target.pinLabel;if(index===3)return inputAlias.label;if(index===4)return `TRIG · ${inputAlias.label}`;if(index===5)return `ECHO · ${inputAlias.label}+1`;return index>=6&&target.sevenSegmentPins?String(target.sevenSegmentPins[index-6]):fallback}
  function handlePanelPin(key:string,connected:boolean){setSelectedEndpoint(key);if(mode==='wire'){connect(key);return}if(!connected)setNotice('Chân này chưa nối với linh kiện khác.');setTracedPin(tracedPin===key?'':key)}
  const isWireHighlighted=useCallback((wire:Wire)=>highlightedNetWireIds.has(wire.id)||Boolean(tracedConnection?.wireIds.includes(wire.id))||logicTraceWires.has(wire.id),[highlightedNetWireIds,tracedConnection,logicTraceWires])
  const isPartHighlighted=useCallback((part:{id:string})=>wires.some(wire=>isWireHighlighted(wire)&&(wire.from.partId===part.id||wire.to.partId===part.id)),[wires,isWireHighlighted])
  const isLogicPartActive=isPartHighlighted
  function add(type:PartId, position?:{x:number;y:number}) { const i=placed.length;const at=position??{x:22+(i*13)%58,y:26+(i*17)%54};const id=`${type}-${Date.now()}-${i}`;const result=addDroppedPart(placed,type,at,id);if(!result.placed){setNotice(result.issue==='board-exists'?'Mỗi workspace chỉ có một board. Dùng bộ chọn Board phía trên để đổi profile.':'Workspace đã đạt giới hạn 100 linh kiện. Hãy xóa bớt linh kiện trước khi thêm.');return}setPlaced(result.placed);setSelectedPartId(id);setNotice(`${labels[type]} đã được đặt lên bàn. ${palette.find(item=>item.type===type)?.role??'Linh kiện mô hình.'}`) }
  function rotate(id:string) { setPlaced(current=>current.map(part=>part.id===id?{...part,rotation:((part.rotation??0)+90)%360}:part));setNotice('Đã xoay linh kiện 90°. Các dây vẫn tham chiếu theo mã chân ổn định.') }
  function removeWire(id:string) { setWires(current=>current.filter(wire=>wire.id!==id));setSelectedWireId(current=>current===id?'':current);setNotice('Đã xóa dây nối.') }
  function connect(key:string) { if(!pending){setPending(key);setNotice('Đã chọn chân thứ nhất. Chọn chân thứ hai để tạo dây.');return}if(pending===key){setPending(null);return}const result=createWireFromKeys(pending,key,placed,wires,`wire-${Date.now()}`);if(!result.wire){setPending(null);setNotice(result.issue==='duplicate'?'Hai chân này đã có dây nối.':'Không xác định được hai chân khác nhau; hãy chọn lại.');return}setWires([...wires,result.wire]);setPending(null);setNotice('Đã nối hai chân. Dây lưu theo mã chân ổn định; kiểm tra chỉ áp dụng cho topology bài học.') }
  function selectLesson(nextId:BuilderLessonId, force=false) {
    if((v2Editable || (v2Read.status === 'v4' && !v2Editable)) && nextId !== v2Doc.lessonId){setV2Notice('Đang mở bản CircuitDocV2 hoặc bản xem trước cần chuyển đổi. Hãy hoàn tất bản hiện tại trước khi đổi bài để không làm lệch dữ liệu.');return}
    const currentPreset=circuitForLesson(lessonId)
    const hasCustomCircuit=JSON.stringify({placed,wires})!==JSON.stringify(currentPreset)
    if(!force&&hasCustomCircuit&&!window.confirm('Đổi bài sẽ thay mạch đang lắp. Mạch và code hiện tại sẽ được sao lưu để khôi phục. Tiếp tục?'))return
    if(!force&&hasCustomCircuit&&!saveDraftRecovery()){setNotice(backupFailedNotice);return}
    const next=getBuilderLesson(nextId),circuit=circuitForLesson(nextId),input=getInputAlias(target,nextId)
    const nextCode=lessonDrafts[nextId]?.[board]??next.code(target,input.pin)
    elapsedRef.current=0;digitRef.current=0
    setLessonId(nextId);if(!libraryEntryId && !portableProjectId && !documentName)setProjectName(next.title);setBuilderStep('assemble');setPlaced(circuit.placed);setWires(circuit.wires);setCode(nextCode)
    if(v2LessonPreview){const nextDoc=getLessonCircuitDoc(nextId);if(nextDoc){setV2Doc(nextDoc);setV2Notice('Đang xem trước topology của bài này. Tạo bản nháp v5 để sửa dây.')}else{setV2LessonPreview(false);setWorkspaceView('assembly')}}
    recordLessonOpened(nextId)
    if(!lessonDrafts[nextId]?.[board])setLessonDrafts(current=>({...current,[nextId]:{...current[nextId],[board]:nextCode}}))
    setRunning(false);setPressed(false);setDetected(false);setDistanceCm(35);setPotPercent(25);setLightPercent(25);setConceptValue(5);setConverterMode('buck');setMotorCommand('forward');setDisplayDigit(0);setTick(0);setSim(initialEduState(target.codePin))
    setNotice(`Đã nạp bài “${next.title}” với nháp đã lưu cho board đang chọn.`)
  }
  function resetCurrentLesson() {
    if(!window.confirm('Đặt lại sẽ thay mạch và code hiện tại. Bản hiện tại được sao lưu để khôi phục. Đặt lại bài?'))return
    if(!saveDraftRecovery()){setNotice(backupFailedNotice);return}
    const id=lessonId
    selectLesson(id,true)
    const sample=getBuilderLesson(id).code(target,getInputAlias(target,id).pin)
    if(id==='blink') { setBlockProgram({...starterLedProgram,pin:target.codePin,setup:starterLedProgram.setup.map(action=>({...action,pin:target.codePin})),loop:starterLedProgram.loop.map(action=>({...action,pin:target.codePin}))});setCodeMode('blocks');updateCurrentCode(sample) }
    if(id==='analog-potentiometer') { setAnalogMode('blocks');setAnalogThreshold(50);setAnalogBlocks([...analogBlockOrder]);setAnalogCppDraft(sample) }
    if(id==='button-led'||id==='ir-alert') { setBranchMode('blocks');setBranchBlocks([...inputBranchBlockOrder]);updateBranchDraft(id,sample) }
    if(id!=='blink'&&id!=='analog-potentiometer'&&id!=='button-led'&&id!=='ir-alert')updateCurrentCode(sample)
    setNotice(`Đã đặt lại “${getBuilderLesson(id).title}”. Bản trước được sao lưu tại trình duyệt nếu còn dung lượng.`)
  }
  function simulate() {
    if(simulationRuntime==='firmware'){if(firmwareRunning)stopFirmwareSimulation();else runFirmwareSimulation();return}
    if(running){setRunning(false);setNotice('Đã tạm dừng mô phỏng.');return}
    if(!providerResolution.available){setNotice(providerResolution.message);revealGuidance();return}
    if(blockOrderIssue){setRunning(false);setNotice(blockOrderIssue);revealGuidance();return}
    const parsed=parseEducationalProgram(effectiveCode,lessonId);if(!parsed.ok){setNotice(`Lỗi cú pháp ở dòng ${parsed.line}: ${parsed.message}`);revealGuidance();return}
    if(hasCircuitErrors){setNotice(diagnostics.find(item=>item.severity==='error')?.message??'Mạch có lỗi topology.');revealGuidance();return}
    const mismatch=findProgramTargetMismatch(parsed.program,target,lessonId);if(mismatch){setNotice(mismatch);revealGuidance();return}
    if(parsed.program.kind==='seven-segment'&&!sevenSegmentPathValid){setNotice('Mạch LED 7 đoạn chưa đủ kết nối: mỗi chân A–G cần điện trở riêng và hai chân COM về GND.');revealGuidance();return}
    trackEvent('builder_run')
    const recorded=recordLessonSimulationStarted(lessonId,target.boardId,target.name,'lesson-model')
    const historyNotice=recorded?'':' Lịch sử lượt chạy chưa được lưu vào trình duyệt này.'
    elapsedRef.current=0;digitRef.current=0;setEducationalProgram(parsed.program);setTick(0);setDisplayDigit(0);setSim(initialEduState(target.codePin));if(parsed.program.kind==='concept'){setTick(1);setRunning(false);setNotice(`Đã mở luồng khái niệm. Dùng “Chạy từng bước” để lần theo đường nguồn, driver, tải và GND; đây là mô hình bài học, không thực thi firmware.${historyNotice}`);return}setRunning(true);setNotice(`Code đã được phân tích thành chương trình giáo dục giới hạn; mô phỏng đầu vào ảo, không thực thi firmware MCU trong chế độ bài học.${historyNotice}`)
  }
  function step() {
    if(!providerResolution.available){setNotice(providerResolution.message);return}
    if(lessonId==='analog-potentiometer'&&analogMode==='blocks'&&!analogBlockOrderValid){setNotice('Thứ tự khối chưa đúng. Hãy sắp xếp theo luồng đọc → so sánh → bật LED → ngược lại → tắt LED.');return}
    if(branchLesson&&branchMode==='blocks'&&!branchOrderValid){setNotice('Thứ tự khối chưa đúng. Hãy sắp xếp theo luồng đọc tín hiệu → kiểm tra điều kiện → bật LED → ngược lại tắt LED.');return}
    const parsed=parseEducationalProgram(effectiveCode,lessonId);if(!parsed.ok){setNotice(`Lỗi cú pháp ở dòng ${parsed.line}: ${parsed.message}`);return}
    const mismatch=findProgramTargetMismatch(parsed.program,target,lessonId);if(mismatch){setNotice(mismatch);return}
    if(hasCircuitErrors){setNotice(diagnostics.find(item=>item.severity==='error')?.message??'Mạch chưa hợp lệ.');return}
    if(parsed.program.kind==='seven-segment'&&!sevenSegmentPathValid){setNotice('Mạch LED 7 đoạn chưa đủ điện trở và chân COM.');return}
    const nextDigit=parsed.program.kind==='seven-segment'?(digitRef.current+1)%10:digitRef.current
    const blinkCycle=parsed.program.kind==='blink'?parsed.program.onMs+parsed.program.offMs:0
    const blinkPhase=parsed.program.kind==='blink'?elapsedRef.current%blinkCycle:0
    const period=parsed.program.kind==='seven-segment'?parsed.program.stepMs:parsed.program.kind==='ultrasonic'||parsed.program.kind==='analog-threshold'?parsed.program.sampleMs:parsed.program.kind==='input-branch'?Math.max(100,parsed.program.debounceMs):parsed.program.kind==='blink'?(blinkPhase<parsed.program.onMs?parsed.program.onMs-blinkPhase:blinkCycle-blinkPhase):500
    const nextElapsed=elapsedRef.current+period
    const frame=simulationProvider?.evaluate(parsed.program,{pressed,detected,distanceCm,potPercent,lightPercent,elapsedMs:nextElapsed,digit:nextDigit,conceptValue,converterMode,motorCommand})
    if(!frame){setNotice(providerResolution.message);return}
    const recorded=tick===0?recordLessonSimulationStarted(lessonId,target.boardId,target.name,'lesson-model'):true
    const historyNotice=recorded?'':' Lịch sử lượt chạy chưa được lưu vào trình duyệt này.'
    elapsedRef.current=nextElapsed;digitRef.current=nextDigit;setRunning(false);setEducationalProgram(parsed.program);setDisplayDigit(nextDigit);setSim(current=>({...current,ledOn:frame.ledOn,elapsedMs:nextElapsed,messages:frame.trace,halted:false}));setTick(value=>value+1);setNotice(`Bước ${tick+1}: ${frame.trace.join(' ')}${historyNotice}`)
  }
  function restoreLessonCode() {
    const usesBlocks=(lessonId==='blink'&&codeMode==='blocks')||(lessonId==='analog-potentiometer'&&analogMode==='blocks')||(branchLesson!==null&&branchMode==='blocks')
    if(!usesBlocks){restoreCurrentSample();return}
    if(!window.confirm('Khôi phục các khối mẫu sẽ thay chương trình đang mở. Bản hiện tại được sao lưu để khôi phục. Tiếp tục?'))return
    if(!saveDraftRecovery()){setNotice(backupFailedNotice);return}
    if(lessonId==='blink')setBlockProgram({...starterLedProgram,pin:target.codePin,setup:starterLedProgram.setup.map(action=>({...action,pin:target.codePin})),loop:starterLedProgram.loop.map(action=>({...action,pin:target.codePin}))})
    else if(lessonId==='analog-potentiometer')setAnalogBlocks([...analogBlockOrder])
    else setBranchBlocks([...inputBranchBlockOrder])
  }
  function handleGuidanceAction(action:GuidanceAction) {
    if(action==='next-step')setBuilderStep(builderStep==='choose'?'assemble':builderStep==='assemble'?'code':'run')
    else if(action==='toggle-wire'){setWorkspaceView('assembly');setMode('wire')}
    else if(action==='switch-board')changeBoard('esp32-devkit')
    else if(action==='restore-code')restoreLessonCode()
    else if(action==='back-assemble')setBuilderStep('assemble')
    else if(action==='back-code')setBuilderStep('code')
    else if(action==='run')simulate()
    else if(action==='next-lesson'){if(nextLesson)navigate(productRoute(getLessonEntryRoute(nextLesson,target.boardId)))}
    else document.querySelector<HTMLElement>('.led-prediction button')?.focus()
  }
  function duplicate(id:string) {
    const source=placed.find(part=>part.id===id)
    if(!source||source.type==='board'){setNotice('Board không thể sao chép trong cùng workspace.');return}
    if(placed.length>=100){setNotice('Workspace đạt giới hạn 100 linh kiện. Hãy xóa bớt trước khi sao chép.');return}
    const suffix=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const copy:CircuitPart={
      id:`${source.type}-${suffix}`,
      type:source.type,
      x:Math.max(5,Math.min(90,source.x+(source.x>82?-5:5))),
      y:Math.max(8,Math.min(88,source.y+(source.y>80?-5:5))),
      ...(source.rotation===undefined?{}:{rotation:source.rotation}),
      ...(source.value===undefined?{}:{value:source.value}),
    }
    setPlaced(current=>[...current,copy])
    setSelectedPartId(copy.id)
    setNotice(`${partLabel(copy,target.name)} đã được sao chép mà không kèm dây. Nối các chân cần dùng riêng.`)
  }
  function remove(id:string) { if(id==='board-1'){setNotice('Board là nền tảng của bài thực hành và không thể xóa.');return}setPlaced(placed.filter(part=>part.id!==id));setWires(wires.filter(wire=>wire.from.partId!==id&&wire.to.partId!==id));setNotice('Đã xóa linh kiện khỏi canvas.') }
  function drag(event:React.DragEvent,id:string) { const origin=Boolean(wireDragRef.current)||event.target instanceof Element&&Boolean(event.target.closest('[data-wire-endpoint]'));if(!canStartComponentMove(origin)){event.preventDefault();return}event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('partId',id) }
  function dragPalette(event:React.DragEvent,type:PartId) { event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('partType',type);event.dataTransfer.setData('text/plain',labels[type]) }
  function drop(event:React.DragEvent) { event.preventDefault();const rect=(event.currentTarget as HTMLElement).getBoundingClientRect();const position=canvasDropPosition(event.clientX,event.clientY,rect);if(!position)return;const id=event.dataTransfer.getData('partId');if(id){setPlaced(current=>current.map(part=>part.id===id?{...part,...position}:part));return}const type=event.dataTransfer.getData('partType');if(componentRegistry.some(part=>part.id===type)){add(type as PartId,position);return}setNotice('Không nhận dạng được linh kiện được kéo. Hãy kéo từ danh sách Linh kiện.') }
  function wirePointerMove(event:React.PointerEvent<HTMLDivElement>) {
    const active=wireDragRef.current
    if(!active)return
    const next=moveWireGesture(active,event.pointerId,event.clientX,event.clientY,event.currentTarget.getBoundingClientRect())
    if(next){wireDragRef.current=next;setWireDragPreview(next)}
  }
  function wirePointerUp(event:React.PointerEvent<HTMLDivElement>) { const active=wireDragRef.current;if(!active||active.pointerId!==event.pointerId)return;wireDragRef.current=null;setWireDragPreview(null);if(!active.dragging)return;suppressPinClickRef.current=true;window.setTimeout(()=>{suppressPinClickRef.current=false},0);const targetKey=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-wire-endpoint]')?.dataset.wireEndpoint;if(!targetKey){setNotice('Chưa nối dây: hãy thả đầu dây vào một chân linh kiện.');return}const result=createWireFromKeys(active.fromKey,targetKey,placed,wires,`wire-${Date.now()}`);if(!result.wire){setNotice(result.issue==='duplicate'?'Hai chân này đã có dây nối.':result.issue==='same-pin'?'Hãy thả vào một chân khác chân bắt đầu.':'Không tìm thấy chân đích hợp lệ.');return}setWires(current=>[...current,result.wire!]);setPending(null);setSelectedEndpoint(targetKey);setNotice(`Đã kéo dây ${describeEndpoint(result.wire.from,placed,target.name)} → ${describeEndpoint(result.wire.to,placed,target.name)}.`) }

  function cancelWireGesture() {
    wireDragRef.current=null;setWireDragPreview(null);setPending(null)
  }
  useEffect(()=>{
    function cancelOnEscape(event:KeyboardEvent) {
      if(event.key==='Escape'&&(wireDragRef.current||pending)){
        event.preventDefault();cancelWireGesture();setNotice('Đã hủy dây đang nối.')
      }
    }
    window.addEventListener('keydown',cancelOnEscape)
    return ()=>window.removeEventListener('keydown',cancelOnEscape)
  },[pending])
  useEffect(()=>{cancelWireGesture()},[board,lessonId,workspaceView])
  function startWiringPractice() {
    if(!wires.length||!window.confirm('Xóa toàn bộ dây để tự nối lại? Linh kiện và code được giữ. Có thể Hoàn tác.'))return
    cancelWireGesture();setWires([]);setSelectedWireId('');setSelectedEndpoint('');setHighlightedNetKey(null)
    setMode('wire');setBuilderStep('assemble')
    setNotice('Đã gỡ dây để bạn tự nối. Chọn hai chân hoặc kéo giữa hai chân; dùng Hoàn tác để khôi phục.')
  }

  let codeEditor: ReactNode
  if(lessonId==='blink'&&codeMode==='blocks') codeEditor=<><p className="builder-code-note">Kéo hoặc thêm khối, đổi mức HIGH/LOW và thời gian chờ. Code bên dưới được tạo tự động và dùng cho luồng minh họa.</p><BlockCodeWorkspace program={blockProgram} onChange={program=>setBlockProgram({...program,pin:target.codePin,setup:program.setup.map(action=>({...action,pin:target.codePin})),loop:program.loop.map(action=>action.kind==='pinMode'||action.kind==='write'?{...action,pin:target.codePin}:action)})} activeActionIndex={activeBlockAction} onActiveAction={setActiveBlockAction}/></>
  else if(lessonId==='blink') codeEditor=<><p className="builder-code-note">C++ tự luyện. Sửa code không làm thay đổi các khối; chỉ cú pháp LED được hỗ trợ mới tạo luồng mô phỏng.</p><CppPracticeEditor source={code} onSource={updateCurrentCode} onImport={program=>{setBlockProgram(program);setCodeMode('blocks');setNotice('Đã nhập cú pháp được hỗ trợ vào khối.')}} onResetSample={()=>updateCurrentCode(getBuilderLesson('blink').code(target,inputAlias.pin))} onActiveLine={setActiveCppLine} activeLine={activeCppLine??undefined}/></>
  else if(lessonId==='analog-potentiometer'&&analogMode==='blocks') codeEditor=<><p className="builder-code-note">Bắt đầu từ luồng cảm biến → điều kiện → đầu ra. Kéo thả hoặc dùng nút mũi tên; ngưỡng áp dụng ngay cho code và mô phỏng.</p><AnalogBlockWorkspace order={analogBlocks} onOrderChange={setAnalogBlocks} threshold={analogThreshold} onThresholdChange={value=>{setAnalogThreshold(value);setTick(0);setRunning(false)}} inputPin={inputAlias.pin} outputPin={target.codePin} activeIndex={tick>0?Math.max(0,(tick-1)%analogBlocks.length):-1} code={analogGeneratedCode}/><p className="builder-code-note">Đầu vào 0–100% là thang chuẩn hóa phục vụ học nguyên lý. Chương trình mô phỏng chỉ xử lý mẫu analogRead và if/else được hỗ trợ.</p></>
  else if(lessonId==='analog-potentiometer') codeEditor=<><label htmlFor="builder-analog-code">C++ tự luyện · bản nháp riêng, không đồng bộ sang block</label><textarea id="builder-analog-code" spellCheck={false} value={analogCppDraft} onChange={event=>setAnalogCppDraft(event.target.value)} aria-label="Bản nháp C++ bài biến trở"/><div className="builder-code-actions"><button type="button" onClick={restoreCurrentSample}>Khôi phục code mẫu</button></div><p className="builder-code-note">Chỉ mẫu C++ analogRead/if/else parser giới hạn chấp nhận mới tạo trace. analogRead trong simulator chuẩn hóa 0–100; không phải điện áp hay số đếm ADC thật.</p></>
  else if(lessonId==='analog-ldr') codeEditor=<><label htmlFor="builder-ldr-code">C++ tự luyện · mẫu đọc LDR theo ngưỡng</label><textarea id="builder-ldr-code" spellCheck={false} value={code} onChange={event=>updateCurrentCode(event.target.value)} aria-label="Bản nháp C++ bài LDR"/><div className="builder-code-actions"><button type="button" onClick={restoreCurrentSample}>Khôi phục code mẫu</button></div><p className="builder-code-note">Parser chỉ hỗ trợ mẫu analogRead(ldrPin) → lightPercent → if/else điều khiển LED. Vout được tính từ bộ chia áp giáo dục với R và VCC giả định; không tính lux, đặc tuyến LDR thật hay số đếm ADC vật lý.</p></>
  else if(branchLesson&&branchMode==='blocks') codeEditor=<><p className="builder-code-note">Theo dõi tín hiệu đầu vào, điều kiện HIGH/LOW và trạng thái LED. Thử đầu vào ảo ở bảng mô phỏng để thấy kết quả.{branchLesson==='ir-alert'?' Bài đang tham chiếu Grove v1.2: phát hiện vật → OUT LOW; module khác có thể đảo mức.':''}</p><InputBranchBlockWorkspace order={branchBlocks} onOrderChange={setBranchBlocks} sensorName={branchLesson==='button-led'?'buttonPin':'sensorPin'} sourceName={branchLesson==='button-led'?'Nút INPUT_PULLUP':'Chân OUT cảm biến IR'} expectedLevel="LOW" outputPin={target.codePin} activeIndex={tick>0?Math.max(0,(tick-1)%branchBlocks.length):-1} code={branchGeneratedCode}/></>
  else if(branchLesson) codeEditor=<><label htmlFor="builder-branch-code">C++ tự luyện · bản nháp riêng cho bài {branchLesson==='button-led'?'nút nhấn':'hồng ngoại'}</label><textarea id="builder-branch-code" spellCheck={false} value={branchDrafts[branchLesson]} onChange={event=>updateBranchDraft(branchLesson,event.target.value)} aria-label="Bản nháp C++ bài cảm biến"/><div className="builder-code-actions"><button type="button" onClick={restoreCurrentSample}>Khôi phục code mẫu</button></div><p className="builder-code-note">Chỉ cấu trúc digitalRead và if/else thuộc mẫu giáo dục được hỗ trợ mới tạo trace. Bản nháp riêng được giữ khi đổi bài hoặc tải lại trang.</p></>
  else codeEditor=<><label htmlFor="builder-code-editor">Bài này dùng {lessonId==='source-led'?'code mẫu có parser giới hạn.':'kịch bản mô phỏng định sẵn; code tùy chỉnh chưa được thực thi.'}</label><textarea id="builder-code-editor" spellCheck={false} value={code} onChange={event=>updateCurrentCode(event.target.value)} aria-label="Code C++ mẫu cho bài thực hành"/><div className="builder-code-actions"><button type="button" onClick={restoreCurrentSample}>Khôi phục code mẫu</button></div><p>Mở <Link to={productRoute('/learn/esp32-led')}>bài học LED và editor khối lệnh riêng ↗</Link></p></>
  return <div className="catalog-page circuit-builder-page"><section className={`catalog-page-heading${guidedLesson?' builder-guided-heading':''}`}><p className="eyebrow">PHÒNG THỬ MẠCH · MÔ PHỎNG GIÁO DỤC</p><h1>{guidedLesson?lesson.title:'Lắp thử một mạch'}</h1><p>Chọn bài mẫu để nạp mạch, code và luồng tín hiệu. Có thể đổi đầu vào ảo để quan sát cảm biến tác động tới đầu ra.</p><p className="builder-return-links"><Link to={productRoute(guidedLesson?'/topics':'/')}>{guidedLesson ? '← Trở lại lộ trình' : '← Bắt đầu học'}</Link><span> / Phòng thử</span><button type="button" onClick={()=>document.getElementById('builder-quick-help')?.scrollIntoView({behavior:'smooth',block:'start'})}>Hướng dẫn sử dụng</button></p>{guidedLesson?<details className="builder-capability-details"><summary>Mức mô phỏng trong phòng thử</summary><CapabilityLegend ids={['behavior-simulation', 'concept-illustration', 'electrical-simulation', 'firmware-execution']} title="Mức mô phỏng trong phòng thử" /></details>:<CapabilityLegend ids={['behavior-simulation', 'concept-illustration', 'electrical-simulation', 'firmware-execution']} title="Mức mô phỏng trong phòng thử" />}</section>
    {guidedLesson&&<section className="builder-guided-session" aria-label="Phiên thực hành riêng theo lộ trình"><span aria-hidden="true">i</span><p><strong>Phiên thực hành theo lộ trình</strong> Mạch và bản nháp của phiên này được lưu riêng trong tab, không thay đổi workspace chính ở <Link to={productRoute('/build')}>{productRoute('/build')}</Link>.</p></section>}
    <section className={`content-section builder-content${guidedLesson?' builder-guided-content':''}`} data-step={builderStep}>
      {pendingBoard&&<section className="builder-guided-session" aria-label="Đổi board từ liên kết"><span aria-hidden="true">i</span><p><strong>Liên kết này gợi ý board {getSimulationTarget(pendingBoard).name}.</strong> Workspace đang lưu giữ nguyên trên {target.name}. <button type="button" onClick={()=>{changeBoard(pendingBoard);setPendingBoard(undefined)}}>Chuyển board</button> <button type="button" onClick={()=>setPendingBoard(undefined)}>Giữ board hiện tại</button></p></section>}
      {typeof lessonDrafts[lessonId]?.[board]==='string'&&lessonDrafts[lessonId]?.[board]!==code&&<p role="status">Code hiện tại và bản nháp đã lưu khác nhau; cả hai được giữ nguyên.</p>}
      <BuilderStepper step={builderStep} onChange={setBuilderStep} completed={{choose:builderStep!=='choose',assemble:placed.length>0&&!hasCircuitErrors,code:!codeIssue,run:tick>0}} />
      <BuilderStepIntro title={builderStep==='choose'?'Chọn bài và board':builderStep==='assemble'?'Lắp mạch và tìm hiểu linh kiện':builderStep==='code'?'Chọn cách viết chương trình':'Dự đoán, chạy thử và quan sát luồng'} instruction={builderStep==='choose'?'Chọn một bài mẫu; mạch, code và các bước thực hành sẽ được nạp sẵn.':builderStep==='assemble'?'Khám phá mạch mẫu, chọn linh kiện để đọc vai trò hoặc chuyển sang nối dây.':builderStep==='code'?'Người mới có thể bắt đầu bằng khối; bạn cũng có thể tự viết C++ để luyện tập.':'Chọn trạng thái LED bạn dự đoán trước; sau đó chạy mô phỏng hoặc chạy từng bước để so sánh và lần theo luồng logic.'} helper={builderStep==='choose'?'Có thể chuyển bước bất cứ lúc nào; workspace sẽ lưu trên thiết bị này.':undefined} headingRef={stepHeadingRef} />
      <BuilderGuidancePanel ref={guidanceRef} guidance={guidance} statusLabel={circuitStatusLabel} onAction={handleGuidanceAction} />
      {builderStep!=='choose'&&learningContract&&<BuilderLessonBrief lesson={learningContract} target={target} defaultOpen={!guidedLesson} />}
      <BuilderToolbar board={board} onBoardChange={changeBoard} saveStatus={saveStatus==='error'||draftSaveFailed?'error':'saved'} target={target} outputAlias={target.codePin} inputAlias={inputAlias.label} onToggleWire={()=>setMode(mode==='place'?'wire':'place')} wireMode={mode==='wire'} runDisabled={v2CircuitActive} circuitDocV2Active={v2CircuitActive} onRun={()=>simulationRuntime==='firmware'?(firmwareRunning?stopFirmwareSimulation():runFirmwareSimulation()):simulate()} running={running||firmwareRunning} canUndo={topologyHistoryAvailability.canUndo} canRedo={topologyHistoryAvailability.canRedo} onUndo={undoTopology} onRedo={redoTopology} lessonId={lessonId} onReset={resetCurrentLesson} onStartWiringPractice={startWiringPractice} canClearWires={wires.length>0} />
      {guidedLesson?<details className="builder-lesson-switcher"><summary>Đổi bài thực hành · {lesson.title}</summary><BuilderLessonPicker lessons={curriculumLessons} selectedId={lessonId} target={target} onSelect={selectLesson} /></details>:<BuilderLessonPicker lessons={curriculumLessons} selectedId={lessonId} target={target} onSelect={selectLesson} />}
      {guidedLesson?<details className="builder-preparation-switcher"><summary>Board, dụng cụ và lưu ý an toàn</summary><section className="builder-choose-panel" aria-label="Board và chuẩn bị"><div><strong>Board đang chọn</strong><p>{target.name} · {target.logicLevel}</p><small>Profile dùng alias học tập; hãy kiểm tra đúng revision và pinout của board thực tế.</small></div><div><strong>Chuẩn bị</strong><div className="builder-preparation-tags"><span>Máy tính</span><span>Cáp USB dữ liệu</span><span>{lesson.inputLabel}</span><span>Không cần tài khoản</span></div></div></section></details>:<section className="builder-choose-panel" aria-label="Board và chuẩn bị"><div><strong>Board đang chọn</strong><p>{target.name} · {target.logicLevel}</p><small>Profile dùng alias học tập; hãy kiểm tra đúng revision và pinout của board thực tế.</small></div><div><strong>Chuẩn bị</strong><div className="builder-preparation-tags"><span>Máy tính</span><span>Cáp USB dữ liệu</span><span>{lesson.inputLabel}</span><span>Không cần tài khoản</span></div></div></section>}
      <div className="builder-grid"><section className="builder-palette" aria-label="Thư viện linh kiện"><div className="builder-section-title"><strong>Linh kiện</strong><span>{selectedPalette.length}/{palette.length}</span></div><p>Bấm để thêm hoặc kéo linh kiện vào bàn.</p><label className="builder-search"><span aria-hidden="true">⌕</span><input value={paletteSearch} onChange={event=>setPaletteSearch(event.target.value)} placeholder="Tìm linh kiện hoặc chân…" aria-label="Tìm linh kiện"/></label>{selectedPalette.map(part=><button key={part.type} type="button" title={part.role} onClick={()=>add(part.type)} draggable onDragStart={event=>dragPalette(event,part.type)}><span>{part.emoji}</span>{part.type==='board'?target.name:part.label}<b>+</b></button>)}{selectedPalette.length===0&&<p>Không tìm thấy linh kiện phù hợp.</p>}<p className="builder-palette-note">{lesson.summary}</p></section>
        <div className="builder-main"><div className="builder-view-switch" role="group" aria-label="Chọn chế độ xem workspace"><button type="button" aria-pressed={workspaceView==='assembly'} onClick={()=>setWorkspaceView('assembly')} disabled={v2CircuitActive||v2MigrationNeedsDecision} title={v2CircuitActive||v2MigrationNeedsDecision?'Hãy xử lý bản xem trước v4 trước; dữ liệu gốc được giữ nguyên cho tới khi tạo v5.':undefined}>Mạch lắp thử · logic</button><button type="button" aria-pressed={workspaceView==='breadboard-v2'} onClick={()=>setWorkspaceView('breadboard-v2')}>Lắp dây · breadboard</button><button type="button" aria-pressed={workspaceView==='schematic'} onClick={()=>setWorkspaceView('schematic')}>Sơ đồ nguyên lý</button><button type="button" aria-pressed={workspaceView==='assembly-3d'} onClick={()=>setWorkspaceView('assembly-3d')}>Lắp mạch · 3D</button><button type="button" aria-pressed={workspaceView==='pcb'} onClick={()=>setWorkspaceView('pcb')}>PCB 2D · đường đồng</button><Link to={productRoute(`/boards?board=${encodeURIComponent(board)}`)}>Hồ sơ board ↗</Link>{workspaceView==='schematic'&&<><button type="button" aria-label="Xuất sơ đồ dạng SVG" onClick={()=>void exportSchematic('svg')}>Xuất SVG</button><button type="button" aria-label="Xuất sơ đồ dạng PNG" onClick={()=>void exportSchematic('png')}>Xuất PNG</button></>}</div>{v2DocumentPreview&&<div className="circuit-v2-preview-banner" role="status"><div><strong>{v2Read.status==='v4'?'Đang xem trước bản mạch cũ an toàn':'Topology bài học đang dùng chung giữa các chế độ xem'}</strong><span>{v2Read.status==='v4'?'Các chế độ xem dùng bản chuyển đổi tạm; dữ liệu gốc chưa bị ghi đè.':workspace.hasSavedData?'Đây là bài mẫu CircuitDocV2 chỉ đọc. Bản nháp cũ vẫn được giữ nguyên và có thể mở lại.':'Đây là bản xem trước chỉ đọc; dây và vị trí linh kiện lấy từ cùng một CircuitDocV2.'}</span></div><button type="button" onClick={v2Read.status==='v4'?acceptV2Migration:startV2LessonDraft}>{v2Read.status==='v4'?'Chấp nhận preview và tạo v5':'Tạo bản nháp để chỉnh sửa'}</button>{v2LessonPreview&&workspace.hasSavedData&&<button type="button" onClick={()=>{setV2LessonPreview(false);setWorkspaceView('assembly')}}>Mở bản nháp đang lưu</button>}</div>}{workspaceView==='breadboard-v2'&&<section className="circuit-v2-gate" aria-label="Lưu và chỉnh mạch phiên bản 5">{!v2CircuitActive?<><h2>Bản mạch tương tác</h2><p>{v2Read.status==='v4'?'Có bản schema 4 ở chế độ chỉ đọc. Hãy xem trước và chấp nhận để tạo v5; dữ liệu gốc được giữ nguyên byte.':v2Read.status==='invalid-v4'?`${v2Read.reason} Có thể tạo một bản bài học mới mà không ghi đè bản gốc.`:v2Read.status==='invalid-v5'?v2Read.reason:'Tạo bản v5 để lưu endpoint lỗ breadboard và giữ nguyên các trường workspace hiện có.'}</p>{v2Read.status==='v4'&&<button type="button" onClick={acceptV2Migration}>Chấp nhận preview và tạo v5</button>}{v2Read.status!=='invalid-v5'&&<button type="button" onClick={startV2LessonDraft}>{v2Read.status==='v4'?'Tạo bản mạch bài LED riêng':'Tạo bản nháp v5'}</button>}</>:<><p role="note">{v2Read.status==='v4'?'Có bản schema 4 đang ở chế độ xem trước; dữ liệu gốc chưa bị ghi đè. ':'Provider đang chạy trace của workspace schema 4; khi v5 hoạt động, nút chạy bị khóa để không hiển thị tín hiệu giả trên topology mới.'}</p>{v2Read.status==='v4'&&!v2Editable&&<button type="button" onClick={acceptV2Migration}>Chấp nhận preview và tạo v5</button>}<BreadboardEditor doc={v2Doc} selectedWireId={v2SelectedWireId} pendingEndpoint={v2PendingEndpoint} onSelectEndpoint={endpoint=>{setV2PendingEndpoint(endpoint);if(endpoint.kind==='pin')setSelectedPartId(endpoint.partId)}} onSelectWire={id=>{setV2SelectedWireId(id);setSelectedWireId(id)}} onCommitWire={commitV2Wire} onEditWireEndpoint={editV2WireEndpoint} onSetWireRole={changeV2WireRole} onRemoveWire={removeV2Wire} notice={v2Notice} readOnly={!v2Editable}/></>}</section>}<div className="builder-spice-bridge"><div><strong>SPICE · mạch analog</strong><small>{workspaceSpice.ok ? 'Dùng dây workspace và phần tử analog có model; không lấy firmware hoặc đường đồng PCB.' : workspaceSpice.issues[0]}</small></div><button type="button" className="electronics-spice-action" disabled={!workspaceSpice.ok||v2CircuitActive} onClick={openWorkspaceInSpice}>Chuyển mạch sang SPICE ↗</button>{v2CircuitActive&&<p role="note">SPICE chưa nhận CircuitDocV2; thao tác chuyển bị khóa để tránh chạy topology schema 4 cũ.</p>}{!workspaceSpice.ok&&workspaceSpice.issues.length>1&&<details><summary>Xem các điều kiện còn lại</summary><ul>{workspaceSpice.issues.slice(1).map(issue=><li key={issue}>{issue}</li>)}</ul></details>}</div>{workspaceView==='assembly'&&<><div className="builder-canvas-wrap"><div className="builder-canvas" onDragOver={event=>event.preventDefault()} onDrop={drop} onPointerMove={wirePointerMove} onPointerUp={wirePointerUp} onContextMenu={event=>{if(wireDragRef.current||pending){event.preventDefault();cancelWireGesture();setNotice("Đã hủy dây đang nối.")}}} onPointerCancel={event=>{if(wireDragRef.current?.pointerId===event.pointerId){wireDragRef.current=null;setWireDragPreview(null)}}} onClickCapture={event=>{if(suppressPinClickRef.current){event.preventDefault();event.stopPropagation();suppressPinClickRef.current=false}}} aria-label="Bàn lắp mạch tương tác"><div className="canvas-grid-label">MẠCH MẪU · {lesson.title.toLocaleUpperCase('vi-VN')}</div><p className="builder-canvas-help" id="builder-canvas-help">Kéo linh kiện từ thư viện vào bàn. Kéo từ một chân sang chân khác để nối; hoặc bật “Nối dây” rồi chọn lần lượt hai chân. Escape hoặc chuột phải để hủy.</p><svg className="builder-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Các dây nối logic trong mạch mẫu">{wires.map(wire=>{const a=wirePoint(wire.from);const b=wirePoint(wire.to);const active=isWireHighlighted(wire);const selected=selectedWireId===wire.id;const midX=(a.x+b.x)/2;const path=`M ${a.x} ${a.y} H ${midX} V ${b.y} H ${b.x}`;return <g key={wire.id} className={selected?'builder-wire-selected':''} role="button" tabIndex={0} aria-label={`Chọn dây ${describeEndpoint(wire.from,placed,target.name)} đến ${describeEndpoint(wire.to,placed,target.name)}`} onClick={()=>setSelectedWireId(wire.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedWireId(wire.id)}}}><path d={path} fill="none" stroke="transparent" strokeWidth="14" vectorEffect="non-scaling-stroke"/><path className={active?'builder-wire-active':''} d={path} fill="none" stroke={selected?'#fff3a6':active?'#20a995':wireColor(wire,placed)} strokeWidth={selected?'1.45':active?'1.2':'.75'} strokeDasharray={active?'none':'1.5 1'} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/></g>})}{wireDragPreview&&(()=>{const endpoint=resolveEndpoint(wireDragPreview.fromKey,placed);const a=endpoint?wirePoint(endpoint):{x:wireDragPreview.x,y:wireDragPreview.y};const midX=(a.x+wireDragPreview.x)/2;return <path className="builder-wire-preview" d={"M "+a.x+" "+a.y+" H "+midX+" V "+wireDragPreview.y+" H "+wireDragPreview.x} fill="none" stroke="#168fbd" strokeWidth="1.25" strokeDasharray="2 1" strokeLinecap="round" vectorEffect="non-scaling-stroke" pointerEvents="none"/>})()}</svg>
            {placed.map(part=>{const meta=palette.find(item=>item.type===part.type);const definition=getComponentDefinition(part.type);const partPins=getVisibleBoardPins((meta?.pinNames??[]).map((pinName,index)=>({id:definition?.pins[index]?.id??String(index),pinName,index})),lessonBoardPinIds,part.type!=='board'||showAllBoardPins);return <div key={part.id} role="group" aria-label={partLabel(part,target.name)} onPointerDown={event=>{if(event.pointerType!=='touch'||(event.target as HTMLElement).closest('button,.part-pin'))return;touchDragRef.current={pointerId:event.pointerId,partId:part.id,lastX:event.clientX,lastY:event.clientY};event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={event=>{const active=touchDragRef.current;if(!active||active.pointerId!==event.pointerId)return;const canvas=(event.currentTarget as HTMLElement).closest('.builder-canvas');if(!canvas)return;const rect=canvas.getBoundingClientRect();const dx=(event.clientX-active.lastX)/rect.width*100;const dy=(event.clientY-active.lastY)/rect.height*100;if(dx||dy)setPlaced(current=>current.map(item=>item.id===active.partId?{...item,x:Math.max(5,Math.min(95,item.x+dx)),y:Math.max(8,Math.min(92,item.y+dy))}:item));active.lastX=event.clientX;active.lastY=event.clientY}} onPointerUp={event=>{if(touchDragRef.current?.pointerId===event.pointerId)touchDragRef.current=null}} onPointerCancel={event=>{if(touchDragRef.current?.pointerId===event.pointerId)touchDragRef.current=null}} draggable onDragStart={event=>drag(event,part.id)} onClick={()=>setSelectedPartId(part.id)} className={`placed-part placed-${part.type} ${selectedPartId===part.id?'part-selected':''} ${isLogicPartActive(part)?'placed-part-active':''} ${part.type==='led'&&ledLit?'placed-led-on':''}`} style={{left:`clamp(var(--part-half,0px),${part.x}%,calc(100% - var(--part-half,0px)))`,top:`${part.y}%`,transform:`translate(-50%,-50%) rotate(${part.rotation??0}deg)`}} title={meta?.role}><button type="button" className="placed-part-select" aria-pressed={selectedPartId===part.id} aria-label={`${partLabel(part,target.name)} tại vị trí ${Math.round(part.x)}, ${Math.round(part.y)}. Enter để chọn, phím mũi tên để di chuyển.`} onKeyDown={event=>{const delta=event.shiftKey?5:1;const moves:Record<string,[number,number]>={ArrowUp:[0,-delta],ArrowDown:[0,delta],ArrowLeft:[-delta,0],ArrowRight:[delta,0]};const move=moves[event.key];if(move){event.preventDefault();setPlaced(current=>current.map(item=>item.id===part.id?{...item,x:Math.max(5,Math.min(95,item.x+move[0])),y:Math.max(8,Math.min(92,item.y+move[1]))}:item))}}}>{part.type==='seven-segment'?<SevenSegmentDisplay digit={displayDigit} bits={programFrame?.segments} lit={simulationActive&&circuitValid}/>:<span>{meta?.emoji}</span>}<strong>{partLabel(part,target.name)}{part.type==='seven-segment'?` · ${displayDigit}`:''}</strong></button><div className="part-pins">{partPins.map(({pinName,index})=>{const endpoint=`${part.id}:${definition?.pins[index]?.id??index}`;const shownPin=shownPinLabel(part.type,index,pinName);return <span key={pinName+"-"+index} data-wire-endpoint={endpoint} role="button" tabIndex={0} aria-describedby="builder-canvas-help" aria-label={partLabel(part,target.name)+" chân "+shownPin+". Kéo tới chân khác để nối dây."} title={shownPin+": "+meta?.role} onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});const point=wirePoint({partId:part.id,pinId:definition?.pins[index]?.id??String(index)});suppressPinClickRef.current=false;wireDragRef.current=startWireGesture(event.pointerId,endpoint,{x:event.clientX,y:event.clientY},point);try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}}} onPointerCancel={event=>{if(wireDragRef.current?.pointerId===event.pointerId){wireDragRef.current=null;setWireDragPreview(null)}}} onDragStart={event=>event.preventDefault()} onClick={event=>{event.stopPropagation();if(suppressPinClickRef.current)return;if(mode==="wire")connect(endpoint);else setNotice(partLabel(part,target.name)+" · "+shownPin+". "+meta?.role)}} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();if(mode==="wire")connect(endpoint);else setNotice(partLabel(part,target.name)+" · "+shownPin+". "+meta?.role)}}} className={"part-pin"+(pending===endpoint?" pin-pending":"")}>{shownPin}</span>})}</div></div>})}
          <div className="canvas-legend"><span><i className="legend-red"/>Nguồn +</span><span><i className="legend-black"/>GND</span><span><i className="legend-blue"/>Tín hiệu</span><span><i className={running||tick>0?'logic-flow-indicator':''}/>{running||tick>0?'Luồng logic đang chạy':'Nét đứt · preset'}</span></div>
        </div><details className="builder-wire-list"><summary>{wires.length} dây nối trong sơ đồ · chọn hoặc xóa kết nối</summary><div>{wires.map(wire=><div key={wire.id} className={selectedWireId===wire.id?'wire-row-selected':''}><button type="button" className="wire-select" aria-pressed={selectedWireId===wire.id} onClick={()=>setSelectedWireId(wire.id)}>{describeEndpoint(wire.from,placed,target.name)} ↔ {describeEndpoint(wire.to,placed,target.name)}</button><button type="button" aria-label={`Xóa dây ${describeEndpoint(wire.from,placed,target.name)} đến ${describeEndpoint(wire.to,placed,target.name)}`} onClick={()=>removeWire(wire.id)}>Xóa</button></div>)}</div></details><div className="builder-message" aria-live="polite">{notice}</div></div></>}{workspaceView==='schematic'&&v2CircuitActive&&<CircuitSchematicV2 doc={v2Doc} selectedKey={selectedPartId} selectedWireId={v2SelectedWireId} onSelectPart={id=>setSelectedPartId(id)} onSelectWire={id=>{setV2SelectedWireId(id);setSelectedWireId(id)}} onSelectNet={setHighlightedNetKey} onExportTarget={element=>{schematicExportRef.current=element}}/>}{workspaceView==='schematic'&&!v2CircuitActive&&<SchematicView parts={placed} wires={wires} definitions={componentRegistry} selectedPartId={selectedPartId} selectedWireId={selectedWireId} pending={pending} highlightedNetKey={highlightedNetKey} nameFor={part=>partLabel(part,target.name)} colorWire={wire=>wireColor(wire,placed)} active={isWireHighlighted} activePart={isLogicPartActive} onSelect={setSelectedPartId} onSelectWire={setSelectedWireId} onSelectNet={setHighlightedNetKey} onPinClick={endpoint=>{setSelectedEndpoint(endpoint);if(mode==='wire')connect(endpoint);else{setSelectedPartId(endpoint.split(':')[0]);setNotice(`Chọn “Nối dây” rồi chọn hai chân. ${endpoint}`)}}} onDrop={(id,x,y)=>setPlaced(current=>current.map(part=>part.id===id?{...part,x,y}:part))} onRotate={rotate} onRemove={remove} onRemoveWire={removeWire} onExportTarget={element=>{schematicExportRef.current=element}}/>} {workspaceView==='assembly-3d'&&<><Suspense fallback={<p className="builder-code-note" role="status">Đang mở cảnh lắp mạch 3D…</p>}><AssemblyStage parts={placed} wires={wires} circuitDocV2={v2CircuitActive ? v2Doc : undefined} selectedWireId={v2SelectedWireId} layoutReadOnly={v2CircuitActive} definitions={componentRegistry} target={target} lessonId={lessonId} lessonMode={learningContract?.simulationMode??'code-subset'} code={effectiveCode} selectedPartId={selectedPartId} flows={v2CircuitActive?new Map():logicFlows} running={v2CircuitActive?false:running} litPartIds={ledLit?placed.filter(part=>part.type==='led').map(part=>part.id):[]} connections={partConnections} lockReason={providerResolution.available?undefined:providerResolution.message} nameFor={part=>partLabel(part,target.name)} describe={endpoint=>describeEndpoint(endpoint,placed,target.name)} pinLabel={shownPinLabel} colorWire={wire=>wireColor(wire,placed)} active={isWireHighlighted} activePart={isPartHighlighted} pinPoint={wirePoint} pending={pending} onSelect={setSelectedPartId} onPinClick={endpoint=>{if(mode==='wire')connect(endpoint);else setNotice(`Đã chọn chân ${endpoint}. Bật “Nối dây” để tạo kết nối.`)}} onRemove={remove} onRotate={rotate} onDrop={(id,x,y)=>setPlaced(current=>current.map(part=>part.id===id?{...part,x,y}:part))} tracedPin={tracedPin} onAssemblyChange={mounts=>setPlaced(current=>current.map(part=>{if(mounts===null){const {assembly:_cleared,...rest}=part;return rest}return mounts[part.id]?{...part,assembly:mounts[part.id]}:part}))}/></Suspense>{v2CircuitActive&&<details className="circuit-v2-assembly-wires"><summary>{v2Doc.wires.length} dây trong mạch v5 · chọn để tô sáng</summary>{v2Doc.wires.map(wire=><button key={wire.id} type="button" aria-pressed={v2SelectedWireId===wire.id} onClick={()=>{setV2SelectedWireId(wire.id);setSelectedWireId(wire.id)}}>{wire.id} · {wire.role ?? 'tín hiệu'}</button>)}</details>}<div className="builder-message" aria-live="polite">{notice}</div></>}{workspaceView==='pcb'&&<Pcb2DViewer boardId={target.boardId} lessonId={lessonId} codePin={parsedLesson.ok&&parsedLesson.program.kind==='blink'?parsedLesson.program.pin:undefined} signalActive={physicalSignalActive} signalRunning={physicalSignalActive}/>}
        <p className="sr-only" aria-live="polite">{selectedPart?`${partLabel(selectedPart,target.name)} được chọn.`:'Chưa chọn linh kiện.'}</p>
        {!v2CircuitActive&&workspaceView!=='pcb'&&<BuilderPinPanel key={`${lessonId}:${selectedPart?.id??'none'}`} parts={placed} part={selectedPart} definition={selectedDefinition} connections={partConnections} wireMode={mode==='wire'} pending={pending} tracedPin={tracedPin} lessonBoardPinIds={lessonBoardPinIds} showAllBoardPins={showAllBoardPins} onToggleBoardPins={()=>setShowAllBoardPins(value=>!value)} nameFor={item=>partLabel(item,target.name)} describe={endpoint=>describeEndpoint(endpoint,placed,target.name)} pinLabel={(type,index,fallback)=>shownPinLabel(type,index,fallback)} onSelectPart={setSelectedPartId} onPin={handlePanelPin} onToggleWire={()=>{setMode(mode==='wire'?'place':'wire');setPending(null)}} onRotate={rotate} onDuplicate={duplicate} onRemove={remove}/>}
        {!v2CircuitActive&&workspaceView!=='assembly-3d'&&<section className="builder-part-inspector" aria-label="Thông tin linh kiện đang chọn"><p className="eyebrow">LINH KIỆN ĐANG CHỌN</p><h3>{selectedPart?(partLabel(selectedPart,target.name)):'Chọn linh kiện trên bàn mạch'}</h3>{selectedDefinition&&<><ComponentVisual key={selectedDefinition.id} illustrationId={selectedDefinition.id} modelId={selectedDefinition.id} name={selectedDefinition.label} className="builder-component-illustration"/><p>{selectedDefinition.explanation}</p>{selectedEndpoint.startsWith(`${selectedPart?.id}:`)&&<p className="selected-pin-note">Chân đang xem: <strong>{selectedDefinition.pins.find(pin=>pin.id===selectedEndpoint.split(":")[1])?.label??selectedEndpoint.split(":")[1]}</strong></p>}<dl><div><dt>Chân trong bài</dt><dd>{visibleSelectedPins.map(item=>shownPinLabel(selectedPart?.type??'',selectedDefinition.pins.indexOf(item),item.label)).join(' · ')||'Mạch mẫu chưa dùng chân của linh kiện này.'}</dd></div><div><dt>Lưu ý an toàn</dt><dd>{selectedDefinition.safetyNotes}</dd></div></dl>{selectedPart&&['resistor','capacitor','ldr','battery'].includes(selectedPart.type)&&<label className="builder-spice-value">Trị số dùng khi xuất SPICE<input aria-label={`Trị số SPICE của ${partLabel(selectedPart,target.name)}`} value={selectedPart.value??''} placeholder={selectedPart.type==='battery'?'5 V · mặc định 5 V':selectedPart.type==='ldr'?'Nhập trị số, ví dụ 10 kΩ':'Để trống dùng trị số danh mục'} onChange={event=>setPlaced(current=>current.map(part=>part.id===selectedPart.id?{...part,value:event.target.value}:part))}/><small>Chỉ ảnh hưởng netlist tương đương analog; không thay đổi code hoặc hành vi firmware. LDR cần nhập trị số rõ ràng.</small></label>}<small>{selectedDefinition.simulation==='supported'?'Có hành vi trong bài học tương ứng; không phải mô phỏng điện.':'Chưa mô phỏng điện.'}</small></>}</section>}
        {v2CircuitActive&&<section className="builder-part-inspector" aria-label="Thông tin linh kiện CircuitDocV2"><p className="eyebrow">MẠCH V5 · LINH KIỆN ĐANG CHỌN</p><h3>{v2SelectedDefinition?.label??v2SelectedPart?.type??'Chọn linh kiện'}</h3>{v2SelectedPart&&v2SelectedDefinition&&<><p>{v2SelectedDefinition.explanation}</p><dl><div><dt>ID ổn định</dt><dd>{v2SelectedPart.id}</dd></div><div><dt>Giá trị bài học</dt><dd>{v2SelectedPart.value?.ohm!==undefined?`${v2SelectedPart.value.ohm} Ω`:v2SelectedPart.value?.farad!==undefined?`${v2SelectedPart.value.farad} F`:v2SelectedPart.value?.label??'Chưa khai báo'}</dd></div><div><dt>Chân</dt><dd>{v2SelectedDefinition.pins.map(pin=>`${pin.id} · ${pin.label}`).join(' | ')}</dd></div><div><dt>Lưu ý</dt><dd>{v2SelectedDefinition.safetyNotes}</dd></div><div><dt>Hình học</dt><dd>{v2SelectedPart.geometrySource==='cad'?'CAD được khai báo':v2SelectedPart.geometrySource==='parametric'?'Hình học tham số':'Nguồn hình học chưa xác minh'}</dd></div></dl></>}</section>}
<section className="builder-code" aria-label="Trình soạn chương trình">
          <div className="builder-code-heading"><h3>{lessonId==='blink'?'Viết code cho LED':lessonId==='analog-potentiometer'?'Điều khiển bằng biến trở':lessonId==='analog-ldr'?'Điều khiển bằng quang trở LDR':branchLesson?(branchLesson==='button-led'?'Lập trình nút nhấn':'Lập trình cảm biến hồng ngoại'):'Code của bài thực hành'}</h3>
            {(lessonId==='blink'||lessonId==='analog-potentiometer'||branchLesson!==null)&&<div role="group" aria-label="Chọn cách viết code"><button type="button" aria-pressed={lessonId==='blink'?codeMode==='blocks':lessonId==='analog-potentiometer'?analogMode==='blocks':branchMode==='blocks'} onClick={()=>lessonId==='blink'?setCodeMode('blocks'):lessonId==='analog-potentiometer'?setAnalogMode('blocks'):setBranchMode('blocks')}>Khối kéo thả</button><button type="button" aria-pressed={lessonId==='blink'?codeMode==='cpp':lessonId==='analog-potentiometer'?analogMode==='cpp':branchMode==='cpp'} onClick={()=>lessonId==='blink'?setCodeMode('cpp'):lessonId==='analog-potentiometer'?setAnalogMode('cpp'):setBranchMode('cpp')}>Tự viết C++</button></div>}
          </div>
          {codeEditor}
        </section></div>
        <section className="builder-inspector" aria-label="Trạng thái mô phỏng"><p className="eyebrow">{simulationRuntime==='firmware'?'TRẠNG THÁI FIRMWARE AVR8js':`TRẠNG THÁI MÔ PHỎNG · BƯỚC ${tick}`}</p><h2>{simulationRuntime==='firmware'?(!firmwareTarget?'Chưa hỗ trợ board':firmwareRunning?'Firmware đang chạy':firmwareStatus==='completed'?'Firmware đã chạy xong':firmwareStatus==='failed'?'Lỗi firmware':firmwareStatus==='timeout'?'Đã dừng do timeout':firmwareStatus==='stopped'?'Firmware đã dừng':!firmwareSource?'Chọn firmware HEX':!firmwareConfirmed?'Xác nhận firmware':'Sẵn sàng AVR8js'):v2CircuitActive?'Trace chưa hỗ trợ mạch v5':circuitStatus.label}</h2>
          <SimulationInstrumentsPanel lessonTitle={lesson.title} providerName={v2CircuitActive?undefined:simulationProvider?.name} accuracyLabel={v2CircuitActive?undefined:simulationProvider?.accuracyLabel} status={simulationInstrumentStatus} statusMessage={simulationInstrumentStatusMessage} runtime={simulationRuntime} targetName={firmwareTarget?.name??target.name} firmwareAvailable={Boolean(firmwareTarget)} firmwareUnavailableReason="AVR8js trong workspace hiện chỉ hỗ trợ Arduino Uno R3 và Nano classic dùng ATmega328P." firmwareSketchAvailable={canExportArduinoSketch(board,lessonId)} firmwareToolRoute={productRoute("/tools/firmware-hex")} onDownloadSketch={exportArduinoSketch} onSwitchToSupportedBoard={()=>changeBoard("arduino-uno-r3")} firmwareLoading={firmwareLoading} onLoadFirmwareSample={()=>handleFirmwareFile(undefined,true)} onExportFirmwareTrace={()=>{if(firmwareFrame)downloadFirmwareTrace(firmwareFrame)}} firmwareFileName={firmwareFileName} firmwareError={firmwareError} firmwareRunning={firmwareRunning} firmwareConfirmed={firmwareConfirmed} firmwareFrame={firmwareFrame} lessonTrace={simulationActive?activeFlow:[]} logicFlows={simulationActive?[...logicFlows].map(([wireId,flow])=>({wireId,...flow})):[]} spiceObservation={workspaceSpiceObservation} onRuntimeChange={changeSimulationRuntime} onFirmwareFile={file=>void handleFirmwareFile(file)} onFirmwareConfirmation={setFirmwareConfirmed} onFirmwareRun={runFirmwareSimulation} onFirmwareStop={()=>stopFirmwareSimulation()} onDismissSpice={dismissWorkspaceSpiceObservation}/>
          {v2CircuitActive&&<p className="diagnostic-warning" role="note">{simulationCapabilityMessage}</p>}
          <div hidden={simulationRuntime==='firmware'||v2CircuitActive}><section className="circuit-diagnostics" aria-live="polite"><strong>Kiểm tra kết nối bài học</strong>{diagnosticGroups.actionable.map(item=><p key={item.code} className={`diagnostic-${item.severity}`}>{item.message}{item.suggestedFix&&<small>{item.suggestedFix}</small>}</p>)}{diagnosticGroups.notes.length>0&&<details className="diagnostic-notes"><summary>Ghi chú thêm ({diagnosticGroups.notes.length})</summary>{diagnosticGroups.notes.map(item=><p key={item.code} className={`diagnostic-${item.severity}`}>{item.message}{item.suggestedFix&&<small>{item.suggestedFix}</small>}</p>)}</details>}</section><details className="simulation-provider-details"><summary>{simulationCapabilityMessage}</summary>{providerResolution.provider?<ul>{providerResolution.provider.limitations.map(item=><li key={item}>{item}</li>)}</ul>:<p>Chọn một board và bài học có hỗ trợ hoặc tiếp tục ở chế độ xem tham khảo.</p>}</details>{lessonId==='seven-segment-counter'?<><div className="sim-state"><span>LED 7 đoạn · cathode chung</span><strong className={sevenSegmentPathValid?'sim-on':''}>{displayDigit}</strong></div><div className="sim-state"><span>Kết nối bài mẫu</span><strong>{sevenSegmentPathValid?'Đủ 7 đoạn + COM':'Chưa đủ dây'}</strong></div></>:<><div className="sim-state"><span>{target.pinLabel} · alias {pin}</span><strong>{gpioHigh?'HIGH':'LOW'}</strong></div><div className="sim-state"><span>LED ngoài</span><strong className={ledLit?'sim-on':''}>{ledPathValid?(ledLit?'Sáng':'Tắt'):'Mạch chưa nối đúng'}</strong></div></>}
          {lessonId==='analog-potentiometer'&&<><label className="sim-range">Xoay biến trở ảo <b>{potPercent}%</b><input aria-label="Giá trị biến trở mô phỏng từ 0 đến 100 phần trăm" type="range" min="0" max="100" value={potPercent} onChange={event=>setPotPercent(Number(event.target.value))}/><small>Thang chuẩn hóa để học nguyên lý; không đại diện số đếm ADC thật.</small></label><div className="sim-state"><span>Đầu vào analog mô phỏng</span><strong>{potPercent}/100</strong><small>Ngưỡng trong code: &gt; {parsedLesson.ok&&parsedLesson.program.kind==='analog-threshold'?parsedLesson.program.threshold:analogThreshold} · LED {programFrame?.ledOn?'bật':'tắt'}</small></div></>}
          {lessonId==='analog-ldr'&&<><label className="sim-range">Mức sáng ảo <b>{lightPercent}%</b><input aria-label="Mức sáng LDR mô phỏng từ 0 đến 100 phần trăm" type="range" min="0" max="100" value={lightPercent} onChange={event=>setLightPercent(Number(event.target.value))}/><small>Mô hình giả định LDR 100 kΩ khi tối → 1 kΩ khi sáng, R cố định 10 kΩ và VCC 3,3 V. Đây là đường cong minh họa, không phải đặc tuyến/lux của cảm biến thật.</small></label><div className="sim-state"><span>Điện trở LDR · giả định</span><strong>{ldrDivider?`${Math.round(ldrDivider.ldrResistanceOhms).toLocaleString('vi-VN')} Ω`:'—'}</strong></div><div className="sim-state"><span>Điểm giữa · Vout mô hình</span><strong>{ldrDivider?`${ldrDivider.outputVoltageVolts.toFixed(2)} V`:'—'}</strong><small>Chia cho VCC 3,3 V → analog {ldrDivider?ldrDivider.normalizedPercent.toFixed(1):'—'}/100 · ngưỡng &gt; {parsedLesson.ok&&parsedLesson.program.kind==='analog-threshold'?parsedLesson.program.threshold:'—'} · LED {programFrame?.ledOn?'bật':'tắt'}</small></div><div className="builder-spice-handoff"><button type="button" className="electronics-spice-action" disabled={Boolean(ldrSpiceBlockReason)} onClick={openLdrDividerInSpice}>Mở bộ chia áp LDR trong SPICE ↗</button><small id="ldr-spice-handoff-note">{ldrSpiceBlockReason??'Chỉ chuyển nhánh bộ chia áp LDR tương đương; không chuyển nhánh LED, dây canvas hoặc firmware.'}</small></div></>}
          {lessonId==='button-led'&&<label className="sim-input"><input type="checkbox" checked={pressed} onChange={event=>setPressed(event.target.checked)}/> Nhấn nút ảo · INPUT_PULLUP</label>}
          {lessonId==='ir-alert'&&<label className="sim-input"><input type="checkbox" checked={detected} onChange={event=>setDetected(event.target.checked)}/> Có vật cản trước cảm biến · OUT {detected?'LOW':'HIGH'} (tham chiếu Grove v1.2)</label>}
          {lessonId==='ultrasonic-distance'&&<label className="sim-range">Khoảng cách mô phỏng <b>{distanceCm} cm</b><input aria-label="Khoảng cách ảo từ cảm biến đến vật" type="range" min="2" max="200" value={distanceCm} onChange={event=>setDistanceCm(Number(event.target.value))}/><small>LED bật khi vật gần hơn 20 cm.</small></label>}
          {lessonId==='buck-boost-concept'&&<><label className="sim-range">Loại bộ chuyển đổi <select aria-label="Chọn buck hoặc boost" value={converterMode} onChange={event=>{const mode=event.target.value as 'buck'|'boost';setConverterMode(mode);setPlaced(current=>current.map(part=>part.id==='converter-1'?{...part,type:mode==='buck'?'buck-converter':'boost-converter'}:part))}}><option value="buck">Buck · hạ áp</option><option value="boost">Boost · tăng áp</option></select></label><label className="sim-range">Nguồn đầu vào minh họa <b>{conceptValue.toFixed(1)} V</b><input aria-label="Nguồn đầu vào khái niệm" type="range" min="3" max="12" step="0.5" value={conceptValue} onChange={event=>setConceptValue(Number(event.target.value))}/><small>Đầu ra mục tiêu được so sánh theo khái niệm; không phải tính toán bộ chuyển đổi thật.</small></label>{converterMode==='boost'&&conceptValue*2>(target.logicLevel.includes('3.3')?3.3:5)&&<p className="diagnostic-warning">Cảnh báo khái niệm: mục tiêu minh họa cao hơn mức logic của board đang chọn. Đo VOUT và đối chiếu thông số board thật trước khi kết nối.</p>}</>}
          {lessonId==='dc-motor-driver'&&<label className="sim-range">Lệnh điều khiển <select aria-label="Lệnh motor ảo" value={motorCommand} onChange={event=>setMotorCommand(event.target.value as 'forward'|'reverse'|'stop')}><option value="forward">Quay thuận</option><option value="reverse">Đảo chiều</option><option value="stop">Dừng</option></select></label>}
          {lessonId==='mosfet-switch'&&<label className="sim-input"><input type="checkbox" checked={pressed} onChange={event=>setPressed(event.target.checked)}/> Gate HIGH · bật MOSFET ảo</label>}
          {programFrame&&'converter' in programFrame&&programFrame.converter&&<div className="sim-state"><span>Khối chuyển đổi · minh họa</span><strong>{programFrame.converter.mode==='buck'?'Hạ áp (buck)':'Tăng áp (boost)'}</strong><small>{simulationActive?`${programFrame.converter.input.toFixed(1)} V → mục tiêu ${programFrame.converter.output.toFixed(1)} V`:'Chạy mô hình để xem quan hệ đầu vào/đầu ra mục tiêu.'}</small></div>}
          {programFrame&&'motor' in programFrame&&programFrame.motor&&<div className="sim-state"><span>Motor · logic TB6612</span><strong className={simulationActive&&programFrame.motor.enabled?'sim-on':''}>{simulationActive?`${programFrame.motor.direction} · PWM ${programFrame.motor.pwm}%`:'Chạy mô hình để xem trạng thái motor.'}</strong></div>}
          {programFrame&&'loadEnabled' in programFrame&&<div className="sim-state"><span>Tải qua MOSFET</span><strong className={simulationActive&&programFrame.loadEnabled?'sim-on':''}>{simulationActive?(programFrame.loadEnabled?'Đang đóng cắt':'Đang ngắt'):'Chạy mô hình để xem trạng thái tải.'}</strong></div>}
          {builderStep==='run'&&supportsLedPrediction&&<section className="led-prediction" aria-labelledby="led-prediction-title"><strong id="led-prediction-title">Dự đoán trước khi chạy</strong><p>Với đầu vào hiện tại, bạn nghĩ LED sẽ sáng hay tắt?</p><div role="group" aria-label="Dự đoán trạng thái LED"><button type="button" aria-pressed={ledPrediction===true} onClick={()=>{setLedPrediction(true);setLedPredictionFeedback('')}}>Sáng</button><button type="button" aria-pressed={ledPrediction===false} onClick={()=>{setLedPrediction(false);setLedPredictionFeedback('')}}>Tắt</button></div><button type="button" onClick={checkLedPrediction} disabled={ledPrediction===null||!programFrame}>Kiểm tra dự đoán</button>{ledPredictionFeedback&&<p aria-live="polite">{ledPredictionFeedback}</p>}</section>}
          {builderStep==='run'&&practiceChallengeKinds.includes('scenario-prediction')&&scenarioPrediction&&<ScenarioPredictionChallenge key={`${workspaceFingerprint}:${pressed}:${converterMode}:${conceptValue}:${motorCommand}`} {...scenarioPrediction} canRun={providerResolution.available&&!hasCircuitErrors&&circuitValid&&parsedLesson.ok} hasRun={simulationActive}/>}
          {builderStep==='run'&&practiceChallengeKinds.includes('seven-segment')&&parsedLesson.ok&&parsedLesson.program.kind==='seven-segment'&&<SevenSegmentChallenge key={workspaceFingerprint} expectedDigits={parsedLesson.program.digits} canPractice={providerResolution.available&&!hasCircuitErrors&&circuitValid}/>}
          {builderStep==='run'&&practiceChallengeKinds.includes('input-output')&&inputOutputChallenge&&<InputOutputChallenge key={workspaceFingerprint} {...inputOutputChallenge} ledOn={Boolean(programFrame?.ledOn)} canObserve={providerResolution.available&&!hasCircuitErrors&&circuitValid&&parsedLesson.ok} hasRun={simulationActive}/>}
          <button className="step-tick" type="button" onClick={step}>{lessonId==='buck-boost-concept'||lessonId==='dc-motor-driver'||lessonId==='mosfet-switch'?'Bước tiếp theo →':'Chạy từng bước →'}</button><div className="sim-flow"><strong>Luồng hoạt động · {lesson.title}</strong><ol>{activeFlow.map((item,index)=><li key={`${tick}-${index}`} className={index===Math.min(Math.max(0,tick-1)%Math.max(1,activeFlow.length),Math.max(0,activeFlow.length-1))?'flow-current':''}>{item}</li>)}</ol></div>
          {builderStep==='run'&&learningContract&&<LessonProgressToggle lessonId={lessonId} />}{builderStep==='run'&&learningContract&&<details className="builder-learning builder-run-challenge" open><summary>Thử thách gỡ lỗi</summary><div><p>{learningContract.debugChallenge}</p><p>Thử đổi một kết nối hoặc linh kiện trên canvas, rồi đọc lại chẩn đoán mạch. Đây là bài tự luyện, không phải chứng nhận kết quả phần cứng.</p><strong>Trước khi lắp thật</strong><p>{learningContract.hardwareTransition}</p></div></details>}
          <p className="builder-caveat">Mô phỏng đầu vào là ảo. Bài IR tham chiếu Grove v1.2 active LOW khi phát hiện; module/clone khác có thể khác. HC-SR04 thường dùng VCC 5 V và ECHO có thể vượt mức GPIO 3,3 V—cần chia áp trước khi nối board 3,3 V. LED 7 đoạn chỉ đếm theo kịch bản code mẫu. Buck/boost chỉ so sánh mục tiêu điện áp; motor thể hiện chiều/PWM logic; MOSFET thể hiện đóng/ngắt khái niệm. Không tính điện áp thực, dòng, ripple, tổn hao, RPM, mô-men, nhiệt hoặc xung áp.</p>
          <p className="builder-caveat">{simulationTargets.length} profile chỉ dùng alias cho bài học. Mô hình bài học không phải firmware emulator, compiler, netlist checker hay SPICE. Chế độ firmware riêng chỉ chạy HEX trên Uno R3/Nano classic ATmega328P và quan sát D13/UART0; luôn kiểm tra schematic/datasheet trước khi đấu mạch thật.</p></div>
        </section></div>
      <div className="builder-step-actions">{builderStep!=='choose'&&<button type="button" onClick={()=>setBuilderStep(builderStep==='run'?'code':builderStep==='code'?'assemble':'choose')}>← Quay lại</button>}{builderStep!=='run'?<button className="button-primary" type="button" onClick={()=>setBuilderStep(builderStep==='choose'?'assemble':builderStep==='assemble'?'code':'run')}>{builderStep==='choose'?'Tiếp tục lắp mạch':builderStep==='assemble'?'Tiếp tục viết code':'Chạy và quan sát →'}</button>:<button className="button-primary" type="button" onClick={simulate}>{firmwareRunning?'Dừng firmware':running?'Tạm dừng mô phỏng':'▶ Chạy mô phỏng'}</button>}</div>
      <div className="builder-project-tools">
        <div><strong>Project của bạn</strong><small>Lưu vào danh sách Dự án trên thiết bị này, hoặc xuất tệp để chia sẻ/chuyển máy.</small></div>
        <div className="builder-project-actions">
          <input value={projectName} onChange={event=>setProjectName(event.target.value)} maxLength={80} aria-label="Tên project cần lưu" placeholder="Tên project"/>
          <button type="button" onClick={()=>saveNamedProject()}>{guidedLesson ? 'Lưu project' : libraryEntryId ? 'Cập nhật bản đã lưu' : 'Lưu vào thư viện'}</button>
          {missingLibraryEntry&&<button type="button" onClick={()=>saveNamedProject(true)}>Lưu thành mục mới</button>}
          {draftRecoveryAvailable&&<button type="button" onClick={restoreDraftRecovery}>Khôi phục bản sao lưu</button>}
          <button type="button" onClick={exportProject}>Xuất tệp</button>
          {canExportArduinoSketch(board,lessonId)&&<button type="button" onClick={exportArduinoSketch}>Xuất sketch .ino</button>}
          <button type="button" onClick={()=>{importRequest.current++;projectFileInput.current?.click()}}>Nhập tệp</button>
          <input ref={projectFileInput} type="file" accept=".json,.machmo.json,application/json" onChange={importProject} hidden aria-label="Chọn tệp project Mạch Mở để nhập"/>
        </div>
        <div role="status">{librarySaveNotice}</div>
        {librarySaveError&&<p role="alert">{librarySaveError}</p>}
      </div>
      <details className="builder-learning" id="builder-quick-help"><summary>Hướng dẫn nhanh cho người mới</summary><div><p><b>1.</b> Chọn bài thực hành để nạp sơ đồ, dây nối và code mẫu; workspace tự chuyển sang bước lắp mạch.</p><p><b>2.</b> Ở bước Lắp mạch, chọn linh kiện để đọc vai trò; chọn “Nối dây” rồi nhấn lần lượt hai chân.</p><p><b>3.</b> Ở bước Viết code, bài LED, biến trở, nút nhấn và hồng ngoại có editor khối riêng hoặc C++ theo bài; LDR dùng mẫu C++ giới hạn. Các khối chỉ sinh cú pháp trong phạm vi parser.</p><p><b>4.</b> Ở bước Dự đoán &amp; chạy, dự đoán trạng thái LED trước khi kiểm tra, thử đầu vào ảo, rồi theo dõi luồng logic và chẩn đoán.</p><p><b>5.</b> Mở thử thách gỡ lỗi và kiểm tra hướng dẫn trước khi lắp thật. Mô hình bài học không chạy firmware MCU hoặc tính toán điện; chế độ AVR8js riêng nhận HEX Uno/Nano ATmega328P và chỉ quan sát D13/UART0.</p></div></details>
      <details className="builder-learning builder-source-guide"><summary>Chọn nguồn thấp áp: điểm cần kiểm tra</summary><div className="source-guide-grid"><article><strong>USB / power bank</strong><p>Tiện cho board và mạch USB-compatible. Kiểm tra cáp, cổng, giới hạn dòng và yêu cầu board.</p></article><article><strong>Pin / battery pack</strong><p>Điện áp thay đổi theo hóa học, số cell và trạng thái pin. Xem đúng polarity và không sạc sai loại.</p></article><article><strong>Nguồn DC điều chỉnh</strong><p>Chỉnh giới hạn dòng và điện áp trước khi nối. Dùng đồng hồ đo lại tại đầu ra.</p></article><article><strong>Module buck / boost</strong><p>Đo VOUT khi chưa gắn MCU. Boost có thể nâng lên mức gây hỏng GPIO/board; thông số phụ thuộc đúng module.</p></article></div><p className="builder-caveat">Các mô tả này không quy định một dải điện áp chung: hãy tra datasheet của board, nguồn, converter và tải cụ thể. Không thực hành điện lưới.</p></details>
      <details className="builder-learning"><summary>Chọn cách điều khiển tải: GPIO, MOSFET hay cầu H?</summary><div className="source-guide-grid"><article><strong>GPIO trực tiếp</strong><p>Chỉ dành cho tín hiệu hoặc tải rất nhỏ trong giới hạn datasheet; không điều khiển motor trực tiếp.</p></article><article><strong>MOSFET low-side</strong><p>Phù hợp đóng/ngắt một chiều cho tải DC khi chọn đúng MOSFET, driver gate, diode tải cảm và nguồn.</p></article><article><strong>Cầu H như TB6612FNG</strong><p>Điều khiển hai chiều motor DC bằng cặp đầu vào và PWM; cần kiểm tra VCC logic, VM, STBY, dòng và GND chung.</p></article><article><strong>Đừng dùng thay thế tùy ý</strong><p>Khối giả lập chỉ so sánh nguyên lý. Nguồn, dòng khởi động, nhiệt và chân module thật phải được xác nhận riêng.</p></article></div></details>
    </section>
  </div>
}

