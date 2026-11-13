import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { arduinoBoardModels } from '../../data/arduinoBoardModels'
import { getBoardModelEvidence } from '../../data/boardModelSources'
import type { BuilderLessonId } from '../../data/builderLessons'
import type { ComponentDefinition } from '../../data/componentRegistry'
import type { CurriculumLesson } from '../../data/curriculumSchema'
import { esp32DevkitModel } from '../../data/esp32DevkitModel'
import { raspberryPiBoardModels } from '../../data/raspberryPiBoardModels'
import type { SimulationTarget } from '../../data/simulationTargets'
import { assignCallouts, freezeAssembly, getAssemblyPlan, getAssemblyPlanV2, nudgePart, snapPart, type Callout } from '../../lib/assemblyLayout'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import type { PartPinConnection } from '../../lib/circuitNets'
import type { WireFlow } from '../../lib/logicTrace'
import { assemblyModelLabels, getFeatureInfo, getPartInfo } from '../../lib/partInfo'
import type { AssemblyMount, CircuitConnection, CircuitEndpoint, CircuitPart } from '../../types/circuitTopology'
import { Assembly3DView } from './Assembly3DView'
import { AssemblyScene, type SceneWireStyle } from './AssemblyScene'
import { PartInfoPanel } from './PartInfoPanel'
import { getAssemblySceneProjection } from '../../lib/assemblySceneProjection'
import './AssemblyStage.css'

type Props = {
  parts: CircuitPart[]
  wires: CircuitConnection[]
  definitions: ComponentDefinition[]
  target: SimulationTarget
  lessonId: BuilderLessonId
  lessonMode: CurriculumLesson['simulationMode']
  code: string
  selectedPartId: string
  flows: Map<string, WireFlow>
  running: boolean
  litPartIds: string[]
  connections: PartPinConnection[]
  lockReason?: string
  nameFor: (part: CircuitPart) => string
  describe: (endpoint: CircuitEndpoint) => string
  pinLabel: (type: string, index: number, fallback: string) => string
  colorWire: (wire: CircuitConnection) => string
  active: (wire: CircuitConnection) => boolean
  activePart: (part: CircuitPart) => boolean
  pinPoint: (endpoint: CircuitEndpoint) => { x: number; y: number }
  pending: string | null
  tracedPin: string
  onSelect: (id: string) => void
  onPinClick: (endpoint: string) => void
  onRemove: (id: string) => void
  onRotate: (id: string) => void
  onDrop: (id: string, x: number, y: number) => void
  onAssemblyChange: (mounts: Record<string, AssemblyMount> | null) => void
  circuitDocV2?: CircuitDocV2
  selectedWireId?: string | null
  layoutReadOnly?: boolean
}

type Overlay = { width: number; height: number; points: Record<string, { x: number; y: number; visible: boolean }>; chips: Array<{ id: string; label: string; x: number; y: number; signal: string }>; pin?: { x: number; y: number; label: string } }
type Drag = { pointerId: number; x: number; y: number; moved: boolean; partId?: string; grabX?: number; grabZ?: number; heightMm?: number; startParts?: CircuitPart[] }

const FEATURE_LIST_LIMIT = 40
const FEATURE_MARKER_LIMIT = 10
const manifests = [esp32DevkitModel, ...arduinoBoardModels, ...raspberryPiBoardModels]
const boardManifest = (boardId: string) => boardId === 'esp32-devkit' ? esp32DevkitModel : manifests.find((item) => item.id === boardId)
const signalColors: Record<WireFlow['signal'], [number, number, number]> = { power: [0.86, 0.22, 0.18], ground: [0.56, 0.6, 0.62], high: [0.12, 0.72, 0.62], low: [0.34, 0.4, 0.46], pulse: [0.56, 0.36, 0.86], analog: [0.92, 0.62, 0.2], active: [0.12, 0.72, 0.62] }
const hexToColor = (hex: string): [number, number, number] => { const value = parseInt(hex.slice(1), 16); return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255] }
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export function AssemblyStage(props: Props) {
  const { parts, wires, definitions, target, lessonId, lessonMode, code, selectedPartId, flows, running, litPartIds, connections, lockReason, nameFor, describe, pinLabel, colorWire, active, activePart, tracedPin, pending, onSelect, onRotate, onRemove, onDrop, onAssemblyChange, circuitDocV2, selectedWireId, layoutReadOnly = false } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<AssemblyScene | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [graphics, setGraphics] = useState<'ready' | 'unsupported' | 'lost'>('ready')
  const [generation, setGeneration] = useState(0)
  const [assets, setAssets] = useState<{ loading: number; failedUrls: string[] }>({ loading: 0, failedUrls: [] })
  const [dragParts, setDragParts] = useState<CircuitPart[] | null>(null)
  const [moveStatus, setMoveStatus] = useState('')
  const [featureId, setFeatureId] = useState('')
  const [query, setQuery] = useState('')
  const [overlay, setOverlay] = useState<Overlay>({ width: 0, height: 0, points: {}, chips: [] })
  const [boardNodes, setBoardNodes] = useState<Set<string>>(new Set())
  const manifest = boardManifest(target.boardId)
  const hotspots = manifest?.scenes[0]?.hotspots ?? []
  const circuitProjection = useMemo(() => circuitDocV2 ? getAssemblySceneProjection(circuitDocV2) : null, [circuitDocV2])
  const sceneParts = circuitProjection?.parts ?? parts
  const shownParts = circuitProjection?.parts ?? dragParts ?? parts
  const scenePending = circuitProjection ? null : pending
  // Lesson callers pass a trace derived from this same CircuitDocV2. Builder preview
  // callers suppress legacy trace explicitly before they reach this projection.
  const sceneTracedPin = circuitProjection && flows.size === 0 ? '' : tracedPin
  const boardPart = sceneParts.find((part) => part.type === 'board')
  const sceneSelectedPartId = sceneParts.some((part) => part.id === selectedPartId)
    ? selectedPartId
    : boardPart?.id ?? sceneParts[0]?.id ?? selectedPartId
  const baseOptions = useMemo(() => ({ boardId: target.boardId, target, lessonId }), [target, lessonId])
  const failedUrls = useMemo(() => new Set(assets.failedUrls), [assets.failedUrls])
  const basePlan = useMemo(() => circuitDocV2 ? getAssemblyPlanV2(circuitDocV2, baseOptions) : getAssemblyPlan(shownParts, wires, baseOptions), [circuitDocV2, shownParts, wires, baseOptions])
  const failedParts = useMemo(() => new Set(basePlan.placements.filter((item) => item.assetUrl && failedUrls.has(item.assetUrl)).map((item) => item.partId)), [basePlan, failedUrls])
  const options = useMemo(() => ({ ...baseOptions, failed: failedParts }), [baseOptions, failedParts])
  const plan = useMemo(() => circuitDocV2 ? getAssemblyPlanV2(circuitDocV2, options) : getAssemblyPlan(shownParts, wires, options), [circuitDocV2, shownParts, wires, options])
  const planRef = useRef(plan)
  planRef.current = plan
  const features = useMemo(() => hotspots.filter((hotspot) => hotspot.nodeNames.some((name) => boardNodes.has(name))).flatMap((hotspot) => { const feature = manifest?.features.find((item) => item.id === hotspot.featureId); return feature ? [{ feature, nodeNames: hotspot.nodeNames.filter((name) => boardNodes.has(name)) }] : [] }), [hotspots, boardNodes, manifest])
  const nodeToFeature = useMemo(() => new Map(features.flatMap(({ feature, nodeNames }) => nodeNames.map((name) => [name, feature.id]))), [features])
  const activeFeature = sceneSelectedPartId === boardPart?.id ? features.find((item) => item.feature.id === featureId) : undefined
  const flowsRef = useRef(flows)
  flowsRef.current = flows

  function refreshOverlay() {
    const scene = sceneRef.current, canvas = canvasRef.current
    if (!scene || !canvas) return
    const points: Overlay['points'] = {}
    for (const part of sceneParts) { const top = scene.partTop(part.id); if (top) points[part.id] = scene.project(top) }
    for (const { feature, nodeNames } of features) { const top = scene.nodeTop(boardPart?.id ?? '', nodeNames[0]); if (top) points[`feature:${feature.id}`] = scene.project(top) }
    const seen = new Set<string>(), chips: Overlay['chips'] = []
    for (const [id, flow] of circuitProjection ? [] : flowsRef.current) {
      if (!flow.label || seen.has(flow.label + flow.signal) || chips.length >= 8) continue
      const middle = scene.wireMiddle(id)
      if (!middle) continue
      const point = scene.project(middle)
      if (!point.visible) continue
      seen.add(flow.label + flow.signal)
      chips.push({ id, label: flow.label, x: point.x, y: point.y, signal: flow.signal })
    }
    const pinKey = scenePending ?? sceneTracedPin
    const pinWorld = pinKey ? planRef.current.pinPoints[pinKey] : undefined
    const pinScreen = pinWorld ? scene.project(pinWorld.map((value) => value / 1000) as [number, number, number]) : undefined
    const [pinPart, pinId] = pinKey ? [pinKey.slice(0, pinKey.lastIndexOf(':')), pinKey.slice(pinKey.lastIndexOf(':') + 1)] : ['', '']
    setOverlay({ width: canvas.clientWidth, height: canvas.clientHeight, points, chips, pin: pinScreen?.visible ? { x: pinScreen.x, y: pinScreen.y, label: circuitProjection?.describeEndpoint({ partId: pinPart, pinId }) ?? describe({ partId: pinPart, pinId }) } : undefined })
  }
  const refreshRef = useRef(refreshOverlay)
  refreshRef.current = refreshOverlay

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const lost = (event: Event) => { event.preventDefault(); setGraphics('lost') }
    const restored = () => { setGraphics('ready'); setAssets({ loading: 0, failedUrls: [] }); setGeneration((value) => value + 1) }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let scene: AssemblyScene
    try { scene = AssemblyScene.create(canvas) } catch { setGraphics('unsupported'); return }
    sceneRef.current = scene
    scene.onViewChange = () => refreshRef.current()
    scene.onAssets = (status) => {
      setAssets(status)
      const board = planRef.current.placements.find((item) => item.type === 'board')
      setBoardNodes(board ? scene.nodeNames(board.partId) : new Set())
    }
    scene.update(planRef.current)
    const observer = new ResizeObserver(() => scene.resize())
    observer.observe(canvas)
    const wheel = (event: WheelEvent) => { event.preventDefault(); scene.zoom(event.deltaY < 0 ? 1 : -1) }
    canvas.addEventListener('wheel', wheel, { passive: false })
    return () => { observer.disconnect(); canvas.removeEventListener('wheel', wheel); scene.dispose(); sceneRef.current = null }
  }, [generation])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.update(plan)
    if (boardPart) setBoardNodes(scene.nodeNames(boardPart.id))
    refreshRef.current()
  }, [plan, boardPart, sceneParts])

  const hasDirectedFlow = !circuitProjection && [...flows.values()].some((flow) => flow.direction !== 'none')
  useEffect(() => {
    const styles = new Map<string, SceneWireStyle>()
    for (const wire of circuitDocV2?.wires ?? wires) {
      const flow = circuitProjection ? undefined : flows.get(wire.id)
      const traced = !circuitDocV2 && ('from' in wire && 'partId' in wire.from && 'partId' in wire.to ? active(wire as CircuitConnection) : Boolean(flow))
      const roleColor = 'role' in wire ? wire.role === 'ground' ? '#101820' : wire.role === 'power' ? '#e4483e' : '#287fbc' : '#287fbc'
      const base = flow ? signalColors[flow.signal] : hexToColor('role' in wire ? roleColor : colorWire(wire as CircuitConnection))
      const color: [number, number, number] = !flow && base.every((value) => value < 0.2) ? signalColors.ground : base
      styles.set(wire.id, { color: selectedWireId === wire.id ? [1, 0.88, 0.32] : traced && !flow ? signalColors.active : color, stripes: Boolean(flow && flow.direction !== 'none'), direction: flow?.direction === 'forward' ? 1 : flow?.direction === 'reverse' ? -1 : 0, selected: selectedWireId === wire.id })
    }
    sceneRef.current?.setWireStyles(styles, hasDirectedFlow && running && !reducedMotion())
    refreshRef.current()
  }, [wires, circuitDocV2, circuitProjection, selectedWireId, flows, active, colorWire, running, hasDirectedFlow, generation])

  useEffect(() => { sceneRef.current?.setSelection(sceneSelectedPartId, activeFeature?.nodeNames ?? []); refreshRef.current() }, [sceneSelectedPartId, activeFeature, generation, scenePending, sceneTracedPin])
  useEffect(() => { sceneRef.current?.setHighlights(circuitProjection ? [] : parts.filter(activePart).map((part) => part.id), circuitProjection ? [] : litPartIds) }, [parts, activePart, litPartIds, circuitProjection, generation])

  const commitMount = useCallback((partId: string, mount: AssemblyMount) => {
    const frozen = freezeAssembly(planRef.current, (id) => parts.find((part) => part.id === id)?.rotation ?? 0)
    onAssemblyChange({ ...frozen, [partId]: mount })
  }, [parts, onAssemblyChange])

  function selectPart(id: string) { onSelect(id); setFeatureId('') }
  function selectFromScene(event: ReactPointerEvent<HTMLCanvasElement>) {
    const hit = sceneRef.current?.pick(event.clientX, event.clientY)
    if (!hit) return
    onSelect(hit.partId)
    setFeatureId(hit.partId === boardPart?.id ? nodeToFeature.get(hit.nodeName) ?? '' : '')
  }
  function pointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0 || dragRef.current) return
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* the pointer already ended */ }
    const hit = sceneRef.current?.pick(event.clientX, event.clientY)
    const placement = !layoutReadOnly && hit && hit.partId === selectedPartId ? plan.placements.find((item) => item.partId === hit.partId && item.type !== 'board' && item.type !== 'breadboard') : undefined
    const grab = placement && sceneRef.current?.planePoint(event.clientX, event.clientY, placement.positionMm[1])
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false, ...(placement && grab ? { partId: placement.partId, grabX: placement.positionMm[0] - grab[0], grabZ: placement.positionMm[2] - grab[1], heightMm: placement.positionMm[1], startParts: parts.map((part) => ({ ...part, assembly: freezeAssembly(plan, (id) => parts.find((item) => item.id === id)?.rotation ?? 0)[part.id] ?? part.assembly })) } : {}) }
  }
  function pointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
    if (!drag.moved) return
    if (drag.partId && drag.startParts) {
      const point = sceneRef.current?.planePoint(event.clientX, event.clientY, drag.heightMm ?? 0)
      if (!point) return
      const startPlan = getAssemblyPlan(drag.startParts, wires, options)
      const mount = snapPart(drag.startParts, wires, options, drag.partId, [point[0] + (drag.grabX ?? 0), point[1] + (drag.grabZ ?? 0)], startPlan)
      if (mount) setDragParts(drag.startParts.map((part) => part.id === drag.partId ? { ...part, assembly: mount } : part))
      return
    }
    sceneRef.current?.rotate(dx * 0.01, dy * 0.008)
    drag.x = event.clientX
    drag.y = event.clientY
  }
  function pointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    if (!drag.moved) { selectFromScene(event); return }
    const moved = dragParts?.find((part) => part.id === drag.partId)?.assembly
    if (drag.partId && moved) commitMount(drag.partId, moved)
    setDragParts(null)
  }
  function pointerCancel(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragParts(null)
  }
  function nudge(columns: number, rows: number) {
    if (layoutReadOnly) return
    const part = parts.find((item) => item.id === selectedPartId)
    if (!part) return
    const frozenParts = parts.map((item) => ({ ...item, assembly: freezeAssembly(plan, (id) => parts.find((entry) => entry.id === id)?.rotation ?? 0)[item.id] ?? item.assembly }))
    const mount = nudgePart(frozenParts, wires, options, part.id, columns, rows, plan)
    if (!mount) { setMoveStatus(`${nameFor(part)} không còn chỗ hợp lệ theo hướng này.`); return }
    commitMount(part.id, mount)
    setMoveStatus(mount.kind === 'breadboard' ? `${nameFor(part)}: cột ${mount.column + 1}, hàng ${'abcdefghij'[mount.row]}.` : `${nameFor(part)} đã di chuyển trên bàn.`)
  }

  if (graphics === 'unsupported' && circuitDocV2) return <p className="assembly-stage-note" role="status">Trình duyệt này chưa mở được WebGL 2. Mạch v5 vẫn giữ nguyên; hãy dùng breadboard 2D hoặc schematic. Không hiển thị topology schema 4 thay thế.</p>
  if (graphics === 'unsupported') return <><p className="assembly-stage-note" role="status">Trình duyệt này chưa mở được WebGL 2, nên đang dùng khối minh họa thay cho model 3D.</p><Assembly3DView parts={parts} wires={wires} definitions={definitions} nameFor={nameFor} pinPoint={props.pinPoint} colorWire={colorWire} onSelect={onSelect} onPinClick={props.onPinClick} onRemove={onRemove} onRotate={onRotate} onDrop={onDrop} pending={pending} active={active} activePart={activePart} /></>

  const selectedPart = sceneParts.find((part) => part.id === sceneSelectedPartId)
  const selectedPlacement = plan.placements.find((item) => item.partId === sceneSelectedPartId)
  const movable = selectedPart && selectedPart.type !== 'board' && selectedPart.type !== 'breadboard'
  const selectedDefinition = selectedPart && definitions.find((item) => item.id === selectedPart.type)
  const evidence = selectedPart?.type === 'board' ? getBoardModelEvidence(target.boardId) : undefined
  const info = selectedPart && selectedDefinition ? getPartInfo({ part: selectedPart, definition: selectedDefinition, code: circuitProjection ? '' : code, lessonMode, boardEvidence: evidence, title: nameFor(selectedPart), modelFailed: failedParts.has(selectedPart.id) }) : undefined
  const featureInfo = activeFeature ? getFeatureInfo(activeFeature.feature, getBoardModelEvidence(target.boardId)) : undefined
  const anchorList = sceneParts.filter((part) => part.type !== 'breadboard' || part.id === sceneSelectedPartId).flatMap((part) => { const point = overlay.points[part.id]; return point?.visible ? [{ id: part.id, x: point.x, y: point.y }] : [] })
  const callouts: Callout[] = assignCallouts(anchorList, sceneSelectedPartId, overlay.width, overlay.height)
  const kinds = [...new Set(plan.placements.map((item) => item.kind))]
  const needle = query.trim().toLocaleLowerCase('vi-VN')
  const matches = (text: string) => !needle || text.toLocaleLowerCase('vi-VN').includes(needle)
  const listParts = sceneParts.filter((part) => matches(nameFor(part)))
  const matchingFeatures = features.filter(({ feature }) => matches(`${feature.name} ${feature.designator ?? ''}`))
  const listFeatures = matchingFeatures.slice(0, FEATURE_LIST_LIMIT)
  const flowRows = [...new Map((circuitProjection ? [] : wires).flatMap((wire) => {
    const flow = flows.get(wire.id)
    if (!flow?.label) return []
    const end = wire.to.partId === boardPart?.id ? wire.to : wire.from
    const name = describe(end)
    return [[name, { name, flow }] as const]
  })).values()].slice(0, 8)
  const concept = lessonMode === 'fixed-scenario'
  const placedDots: Array<{ x: number; y: number }> = []
  const dotIsFree = (point?: { x: number; y: number; visible: boolean }, keep = false) => {
    if (!point?.visible) return false
    // Buttons are square, so two dots clash when both axes are close, not by straight-line distance.
    if (!keep && placedDots.some((other) => Math.abs(other.x - point.x) < 26 && Math.abs(other.y - point.y) < 26)) return false
    placedDots.push(point)
    return true
  }
  const partDots = [...sceneParts].sort((a, b) => Number(b.id === sceneSelectedPartId) - Number(a.id === sceneSelectedPartId)).filter((part) => dotIsFree(overlay.points[part.id], part.id === sceneSelectedPartId))
  const featureDots = (sceneSelectedPartId === boardPart?.id ? features : []).filter(({ feature }) => dotIsFree(overlay.points[`feature:${feature.id}`], feature.id === featureId)).slice(0, FEATURE_MARKER_LIMIT)
  const hiddenDots = sceneParts.length + (sceneSelectedPartId === boardPart?.id ? features.length : 0) - partDots.length - featureDots.length
  const boardNote = plan.notes.boardPins === 'cad-pad' ? 'Đầu dây ở board nằm trên pad theo CAD; tên chân theo profile bài học.' : 'Đầu dây ở board là vị trí minh họa, vì chưa có dữ liệu pad đáng tin.'
  const displayedConnections = selectedPart && circuitProjection ? circuitProjection.connectionsFor(selectedPart.id) : connections
  const describeDisplayedEndpoint = circuitProjection ? circuitProjection.describeEndpoint : describe

  return <div className="assembly-stage">
    {graphics === 'lost' && <p className="assembly-stage-warning" role="alert">Trình duyệt vừa tạm mất kết nối đồ họa. Cảnh 3D sẽ tự dựng lại khi kết nối trở lại; mạch của bạn không bị ảnh hưởng.</p>}
    <div className="assembly-stage-view">
      <canvas ref={canvasRef} aria-label="Cảnh lắp mạch 3D. Dùng danh sách linh kiện bên dưới để chọn bằng bàn phím." role="img" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} />
      <div className="assembly-stage-overlay">
        <svg aria-hidden="true" width={overlay.width} height={overlay.height}>{callouts.map((item) => { const left = item.corner.endsWith('left'), top = item.corner.startsWith('top'); return <line key={item.id} x1={left ? 186 : overlay.width - 186} y1={top ? 34 : overlay.height - 88} x2={item.x} y2={item.y} className={item.id === sceneSelectedPartId ? 'assembly-leader assembly-leader-selected' : 'assembly-leader'} /> })}</svg>
        {partDots.map((part) => { const point = overlay.points[part.id]; return <button key={part.id} type="button" aria-label={`Chọn ${nameFor(part)}`} title={nameFor(part)} aria-pressed={part.id === sceneSelectedPartId && !activeFeature} className="assembly-dot" style={{ left: point.x, top: point.y }} onClick={() => selectPart(part.id)}><i /></button> })}
        {featureDots.map(({ feature }) => { const point = overlay.points[`feature:${feature.id}`]; return <button key={feature.id} type="button" aria-label={`Chọn ${feature.name} trên board`} title={feature.name} aria-pressed={feature.id === featureId} className="assembly-dot assembly-dot-feature" style={{ left: point.x, top: point.y }} onClick={() => setFeatureId(feature.id)}><i /></button> })}
        {overlay.chips.map((chip) => <span key={chip.id} aria-hidden="true" className={`assembly-chip assembly-chip-${chip.signal}`} style={{ left: chip.x, top: chip.y }}>{chip.label}</span>)}
        {overlay.pin && <span aria-hidden="true" className="assembly-pin-marker" style={{ left: overlay.pin.x, top: overlay.pin.y }}>{overlay.pin.label}</span>}
        {callouts.map((item) => { const part = sceneParts.find((entry) => entry.id === item.id); return part ? <button key={item.id} type="button" className={`assembly-callout assembly-callout-${item.corner}`} aria-pressed={item.id === sceneSelectedPartId} aria-label={`Chọn ${nameFor(part)}`} onClick={() => selectPart(item.id)}><strong>{nameFor(part)}</strong><small>{definitions.find((entry) => entry.id === part.type)?.category}</small></button> : null })}
      </div>
      <div className="assembly-stage-controls" role="group" aria-label="Điều khiển góc nhìn">
        <button type="button" aria-label="Xoay sang trái" onClick={() => sceneRef.current?.rotate(-0.35, 0)}>←</button>
        <button type="button" aria-label="Xoay sang phải" onClick={() => sceneRef.current?.rotate(0.35, 0)}>→</button>
        <button type="button" aria-label="Nhìn thấp hơn" onClick={() => sceneRef.current?.rotate(0, -0.2)}>↓</button>
        <button type="button" aria-label="Nhìn cao hơn" onClick={() => sceneRef.current?.rotate(0, 0.2)}>↑</button>
        <button type="button" aria-label="Thu nhỏ" onClick={() => sceneRef.current?.zoom(-1)}>−</button>
        <button type="button" aria-label="Phóng to" onClick={() => sceneRef.current?.zoom(1)}>+</button>
        <button type="button" onClick={() => sceneRef.current?.resetView()}>Đặt lại</button>
      </div>
      {assets.loading > 0 && <p className="assembly-stage-loading" role="status">Đang tải {assets.loading} model…</p>}
    </div>

    {failedParts.size > 0 && <p className="assembly-stage-warning" role="alert">Không tải được model của {[...failedParts].map((id) => { const part = sceneParts.find((entry) => entry.id === id); return part ? nameFor(part) : id }).join(', ')}. Mục này đang là khối thay thế và đầu dây của nó chỉ là minh họa.<button type="button" onClick={() => sceneRef.current?.retryFailed()}>Thử tải lại</button></p>}

    {movable && !layoutReadOnly && <div className="assembly-move" role="group" aria-label={`Di chuyển ${selectedPart ? nameFor(selectedPart) : ''}`}>
      <strong>Di chuyển</strong>
      <button type="button" aria-label="Sang trái một lỗ" onClick={() => nudge(-1, 0)}>←</button>
      <button type="button" aria-label="Sang phải một lỗ" onClick={() => nudge(1, 0)}>→</button>
      <button type="button" aria-label="Lên một hàng" onClick={() => nudge(0, -1)}>↑</button>
      <button type="button" aria-label="Xuống một hàng" onClick={() => nudge(0, 1)}>↓</button>
      <span aria-live="polite">{moveStatus || (selectedPlacement?.mount === 'breadboard' && selectedPlacement.hole ? `Đang ở cột ${selectedPlacement.hole.column + 1}, hàng ${'abcdefghij'[selectedPlacement.hole.row]}.` : 'Đang đặt trên bàn.')}</span>
      <button type="button" onClick={() => { onAssemblyChange(null); setMoveStatus('Đã xếp lại toàn bộ mạch.') }}>Xếp lại tự động</button>
    </div>}

    <div className="assembly-stage-flow">
      <strong>Luồng logic minh họa</strong>
      <p>{lockReason ?? (circuitProjection ? 'Bản xem trước CircuitDocV2 chỉ trình bày cấu trúc nối dây; chưa có trace thực thi cho tài liệu này.' : flows.size ? (concept ? 'Bài khái niệm: chỉ tô các nhóm dây theo từng bước, không có mức logic hay hướng.' : 'Mức logic và hướng lấy từ chương trình và sơ đồ bài học; không phải dòng điện hay điện áp đo được.') : 'Chưa chạy, nên chưa có trạng thái nào. Bấm chạy mô phỏng để xem.')}</p>
      {flowRows.length > 0 && <ul>{flowRows.map(({ name, flow }) => <li key={name}><i className={`assembly-swatch assembly-chip-${flow.signal}`} aria-hidden="true" />{name}: <b>{flow.label}</b></li>)}</ul>}
    </div>

    <p className="assembly-stage-note">{kinds.map((kind) => assemblyModelLabels[kind]).join(' · ')}. Board và linh kiện giữ đúng tỉ lệ. Chân mesh CAD theo footprint KiCad; chân mesh tham số là vị trí minh họa. {boardNote} {circuitProjection ? 'Vị trí linh kiện và dây lấy từ tài liệu CircuitDocV2 đang xem; endpoint thiếu dữ liệu hình học được ẩn thay vì tự đoán. Đây là hình chiếu học tập, chưa kiểm tra trên mạch thật.' : 'Mạch Mở tự xếp linh kiện lên breadboard và chỉ để các chân cùng net vào chung một dải; đây là một cách lắp gợi ý, chưa kiểm tra trên mạch thật.'}{plan.notes.partPinsIllustrative ? ' Có linh kiện chưa có dữ liệu chân, đầu dây của chúng là minh họa.' : ''}{plan.notes.unmounted.length ? ` ${plan.notes.unmounted.length} linh kiện không còn chỗ trên breadboard nên đang đặt trên bàn.` : ''} Lựa chọn dùng chung với view lắp mạch và sơ đồ; view PCB chưa liên kết với lựa chọn này.{hiddenDots > 0 ? ` ${hiddenDots} điểm chọn nằm quá gần nhau nên được ẩn trên cảnh; vẫn chọn được trong danh sách.` : ''}</p>

    <div className="assembly-stage-details">
      <section className="assembly-parts" aria-label="Danh sách linh kiện trong cảnh">
        <h3>Linh kiện trong mạch</h3>
        {sceneParts.length + features.length > 8 && <label className="assembly-search">Tìm linh kiện<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
        <ul>{listParts.map((part) => <li key={part.id}><button type="button" aria-pressed={part.id === sceneSelectedPartId && !activeFeature} onClick={() => selectPart(part.id)}>{nameFor(part)}</button></li>)}</ul>
        {listFeatures.length > 0 && <><h4>Trên {target.name}</h4><ul>{listFeatures.map(({ feature }) => <li key={feature.id}><button type="button" aria-pressed={activeFeature?.feature.id === feature.id} onClick={() => { if (boardPart) onSelect(boardPart.id); setFeatureId(feature.id) }}>{feature.designator ? `${feature.designator} · ` : ''}{feature.name}</button></li>)}</ul></>}
        {matchingFeatures.length > FEATURE_LIST_LIMIT && <p>Đang hiện {FEATURE_LIST_LIMIT}/{matchingFeatures.length} mục. Gõ vào ô tìm để thấy phần còn lại.</p>}
        {!listParts.length && !listFeatures.length && <p>Không tìm thấy linh kiện phù hợp.</p>}
      </section>
      {info && selectedPart && selectedDefinition ? <PartInfoPanel key={`${selectedPart.id}:${activeFeature?.feature.id ?? ''}`} info={info} feature={featureInfo} definition={selectedDefinition} connections={displayedConnections} describe={describeDisplayedEndpoint} pinLabel={(index, fallback) => circuitProjection ? fallback : pinLabel(selectedPart.type, index, fallback)} pinEvidence={selectedPart.type === 'board' ? 'Tên chân là alias học tập theo board đang chọn; đối chiếu pinout của board thật.' : circuitProjection ? 'Kết nối suy ra từ net, chân linh kiện và lỗ trong CircuitDocV2; đây là topology khai báo, không phải kết quả đo.' : 'Kết nối lấy từ dây trong mạch này, không phải kết quả đo.'} /> : <p className="assembly-stage-note">Chọn một linh kiện để xem thông tin.</p>}
    </div>
  </div>
}
