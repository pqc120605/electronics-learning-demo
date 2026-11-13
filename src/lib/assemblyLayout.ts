import anchorsJson from '../data/board-pin-anchors.json'
import { getInputAlias, type BuilderLessonId } from '../data/builderLessons'
import { getComponentDefinition } from '../data/componentRegistry'
import { getComponentMesh, type BreadboardGrid, type ComponentLeg } from '../data/componentModels'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import type { SimulationTarget } from '../data/simulationTargets'
import type { CircuitDocV2, CircuitEndpointV2 } from './circuitDocV2'
import { holeToMm, parseHole } from './breadboardGrid'
import type { AssemblyMount, CircuitConnection, CircuitPart } from '../types/circuitTopology'
import { createNetIndex } from './circuitNets'

export type Vec3 = [number, number, number]
export type Bounds = { min: Vec3; max: Vec3 }
export type AssemblyModelKind = 'board-cad' | 'component-cad' | 'component-parametric' | 'fallback-box'
export type MountedLeg = { pinId: string; column: number; row: number }
export type AssemblyPlacement = {
  partId: string
  type: string
  kind: AssemblyModelKind
  mount: 'breadboard' | 'bench'
  assetUrl?: string
  boundsMm: Bounds
  /** The model-space point that lands on positionMm. */
  originMm: Vec3
  positionMm: Vec3
  rotationDeg: number
  legs?: MountedLeg[]
  hole?: { column: number; row: number }
  snapErrorMm: number
}
export type PlacedGrid = BreadboardGrid & { originX: number; originZ: number }
export type AssemblyPlan = {
  placements: AssemblyPlacement[]
  pinPoints: Record<string, Vec3>
  wireEnds: Record<string, [Vec3, Vec3]>
  wireEvidence?: Record<string, { from: { kind: 'pin' | 'hole'; evidence: 'cad' | 'parametric' | 'unknown'; sourceKey: string }; to: { kind: 'pin' | 'hole'; evidence: 'cad' | 'parametric' | 'unknown'; sourceKey: string } }>
  diagnostics?: Array<{ code: 'UNRESOLVED_ENDPOINT'; wireId: string; message: string }>
  grid?: PlacedGrid
  notes: { boardPins: 'cad-pad' | 'illustrative'; partPinsIllustrative: boolean; unmounted: string[] }
}
export type AssemblyOptions = { boardId: string; target: SimulationTarget; lessonId: BuilderLessonId; failed?: ReadonlySet<string> }
export type CalloutCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type Callout = { id: string; x: number; y: number; corner: CalloutCorner }
type Part = CircuitPart
type BoardAnchors = { boundsMm: Bounds; topYMm?: number; pins: Record<string, number[]> }

export const BENCH_MM = { width: 280, depth: 190 }
export const boardPinAnchors = anchorsJson as unknown as Record<string, BoardAnchors>

const BOARD_GAP_MM = 12
const SHELF_GAP_MM = 8
const MAX_SNAP_ERROR_MM = 0.7
const LEFT_OF_BOARD = 8
const CALLOUT_MIN_WIDTH = 640

const boardAssets: Record<string, string> = {
  'esp32-devkit': '/models/esp32-devkit-v1-30pin.glb?v=2.0.0',
  'arduino-uno-r3': '/models/arduino-uno-r3.glb',
  'arduino-nano-classic': '/models/arduino-nano-classic.glb',
  'arduino-mega-2560-r3': '/models/arduino-mega-2560-r3.glb',
  'raspberry-pi-pico': '/models/raspberry-pi-pico.glb?v=1.0.1',
  'raspberry-pi-pico-w': '/models/raspberry-pi-pico-w.glb?v=1.0.1',
  'raspberry-pi-pico-2': '/models/raspberry-pi-pico-2.glb?v=1.0.1',
}

const normalizeDeg = (deg: number) => ((Math.round(deg) % 360) + 360) % 360

/** Rotation about Y. Everything that moves with a part goes through this one function. */
export function rotateXZ(x: number, z: number, deg: number): [number, number] {
  const angle = normalizeDeg(deg)
  if (angle === 0) return [x, z]
  if (angle === 90) return [z, -x]
  if (angle === 180) return [-x, -z]
  if (angle === 270) return [-z, x]
  const c = Math.cos(angle * Math.PI / 180), s = Math.sin(angle * Math.PI / 180)
  return [x * c + z * s, -x * s + z * c]
}

export function localToWorld(placement: Pick<AssemblyPlacement, 'originMm' | 'positionMm' | 'rotationDeg'>, local: readonly number[]): Vec3 {
  const { originMm: o, positionMm: p } = placement
  const [x, z] = rotateXZ(local[0] - o[0], local[2] - o[2], placement.rotationDeg)
  return [p[0] + x, p[1] + local[1] - o[1], p[2] + z]
}

/** Column-major model matrix in metres; the same transform as localToWorld. */
export function placementMatrix(placement: Pick<AssemblyPlacement, 'originMm' | 'positionMm' | 'rotationDeg'>): number[] {
  const [c, s] = rotateXZ(1, 0, placement.rotationDeg)
  const zero = localToWorld(placement, [0, 0, 0])
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, zero[0] / 1000, zero[1] / 1000, zero[2] / 1000, 1]
}

export function footprintBox(placement: Pick<AssemblyPlacement, 'boundsMm' | 'originMm' | 'positionMm' | 'rotationDeg'>) {
  const { min, max } = placement.boundsMm
  const corners = [[min[0], min[2]], [min[0], max[2]], [max[0], min[2]], [max[0], max[2]]].map(([x, z]) => localToWorld(placement, [x, 0, z]))
  return { minX: Math.min(...corners.map((c) => c[0])), maxX: Math.max(...corners.map((c) => c[0])), minZ: Math.min(...corners.map((c) => c[2])), maxZ: Math.max(...corners.map((c) => c[2])), minY: placement.positionMm[1] + min[1] - placement.originMm[1], maxY: placement.positionMm[1] + max[1] - placement.originMm[1] }
}

export const holePoint = (grid: PlacedGrid, column: number, row: number): Vec3 => [grid.originX + grid.firstColumnX + column * grid.pitch, grid.topY, grid.originZ + grid.rows[row]]
const stripOf = (column: number, row: number) => `${row < 5 ? 'top' : 'bottom'}:${column}`
type Box = ReturnType<typeof footprintBox>
const overlaps = (a: Box, b: Box) => a.minX < b.maxX - 0.05 && b.minX < a.maxX - 0.05 && a.minZ < b.maxZ - 0.05 && b.minZ < a.maxZ - 0.05

function centeredBox(sizeMm: readonly number[]): Bounds {
  return { min: [-sizeMm[0] / 2, 0, -sizeMm[2] / 2], max: [sizeMm[0] / 2, sizeMm[1], sizeMm[2] / 2] }
}

function modelFor(type: string, boardId: string, failed: boolean): Pick<AssemblyPlacement, 'kind' | 'assetUrl' | 'boundsMm'> & { legs?: ComponentLeg[] } {
  if (type === 'board') {
    const anchors = boardPinAnchors[boardId]
    if (anchors && !failed) return { kind: 'board-cad', assetUrl: boardAssets[boardId], boundsMm: anchors.boundsMm }
    const size = anchors ? anchors.boundsMm.max.map((value, axis) => value - anchors.boundsMm.min[axis]) : [52, 6, 28]
    return { kind: 'fallback-box', boundsMm: centeredBox(size) }
  }
  const mesh = getComponentMesh(type)
  if (mesh && failed) return { kind: 'fallback-box', boundsMm: centeredBox(mesh.sizeMm) }
  if (mesh) return { kind: mesh.kind === 'source-cad-mesh' ? 'component-cad' : 'component-parametric', assetUrl: `${mesh.file}?v=${mesh.sha256.slice(0, 8)}`, boundsMm: mesh.boundsMm as Bounds, legs: mesh.mount === 'breadboard' ? mesh.legsMm : undefined }
  const [width, depth, height] = getComponentDefinition(type)?.visual.dimensionsMm ?? [8, 6, 4]
  return { kind: 'fallback-box', boundsMm: centeredBox([width, height, depth]) }
}

const baseOrigin = ({ min, max }: Bounds): Vec3 => [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2]

/** Header pad for a workspace pin. Labels follow the board's lesson profile, not every clone. */
function boardPinLocal(boardId: string, target: SimulationTarget, lessonId: BuilderLessonId, pinId: string): Vec3 | undefined {
  if (boardId === 'esp32-devkit') {
    const anchor = getBoardPinAnchors(boardId, target, lessonId)[pinId]
    return anchor ? [anchor[0] * 1000, anchor[1] * 1000, anchor[2] * 1000] : undefined
  }
  const pads = boardPinAnchors[boardId]
  if (!pads?.topYMm || !Object.keys(pads.pins).length) return undefined
  const input = getInputAlias(target, lessonId).label.split(' ')[0]
  const segment = /^seg(\d)$/.exec(pinId)
  const nextDigital = input.startsWith('D') ? `D${Number(input.slice(1)) + 1}` : undefined
  const label = pinId === 'ledOut' ? `D${target.codePin}` : pinId === 'input' || pinId === 'trig' ? input : pinId === 'echo' ? nextDigital : pinId === 'gnd' ? 'GND' : pinId === 'vcc' ? (target.logicLevel.includes('5') ? '5V' : '3V3') : segment ? `D${target.sevenSegmentPins?.[Number(segment[1])]}` : undefined
  const pad = label ? pads.pins[label] : undefined
  return pad ? [pad[0], pads.topYMm, pad[1]] : undefined
}

/** Only the ESP32 model has header pads mapped to GPIO numbers through the board data. */
export function getBoardPinAnchors(boardId: string, target: SimulationTarget, lessonId: BuilderLessonId, pins = esp32DevkitModel.pins): Record<string, Vec3> {
  if (boardId !== 'esp32-devkit') return {}
  const byGpio = (gpio: number | undefined) => pins.find((pin) => pin.gpio === gpio)?.anchor as Vec3 | undefined
  const byLabel = (label: string) => pins.find((pin) => pin.label === label)?.anchor as Vec3 | undefined
  const input = getInputAlias(target, lessonId).pin
  const entries: Array<[string, Vec3 | undefined]> = [['ledOut', byGpio(target.codePin)], ['input', byGpio(input)], ['trig', byGpio(input)], ['echo', byGpio(input + 1)], ['vcc', byLabel('3V3')], ['gnd', byLabel('GND')], ...(target.sevenSegmentPins ?? []).map((gpio, index): [string, Vec3 | undefined] => [`seg${index}`, byGpio(gpio)])]
  return Object.fromEntries(entries.filter((entry): entry is [string, Vec3] => Boolean(entry[1])))
}

/** For models with no pin data: spread pins along one top edge and say so in the notes. */
function illustrativePin(placement: AssemblyPlacement, pinId: string): Vec3 {
  const pins = getComponentDefinition(placement.type)?.pins ?? []
  const index = Math.max(0, pins.findIndex((pin) => pin.id === pinId))
  const spread = pins.length > 1 ? index / (pins.length - 1) - 0.5 : 0
  const { min, max } = placement.boundsMm
  return [(min[0] + max[0]) / 2 + spread * (max[0] - min[0]) * 0.8, max[1], (min[2] + max[2]) / 2 + (max[2] - min[2]) * 0.4]
}

type MountAttempt = { x: number; z: number; rotation: number; legs: MountedLeg[]; error: number }

function tryMount(legs: ComponentLeg[], grid: PlacedGrid, column: number, row: number, rotation: number): MountAttempt | undefined {
  const turned = legs.map((leg) => ({ pinId: leg.pinId, offset: rotateXZ(leg.x, leg.z, rotation) }))
  const [ax, az] = turned[0].offset
  const hole = holePoint(grid, column, row)
  const baseX = hole[0] - ax, baseZ = hole[2] - az
  const snapped = turned.map(({ pinId, offset }) => {
    const x = baseX + offset[0], z = baseZ + offset[1]
    const nearestColumn = Math.round((x - grid.originX - grid.firstColumnX) / grid.pitch)
    const nearestRow = grid.rows.reduce((best, value, index) => Math.abs(grid.originZ + value - z) < Math.abs(grid.originZ + grid.rows[best] - z) ? index : best, 0)
    return { pinId, column: nearestColumn, row: nearestRow, dx: holePoint(grid, nearestColumn, nearestRow)[0] - x, dz: holePoint(grid, nearestColumn, nearestRow)[2] - z }
  })
  if (snapped.some((leg) => leg.column < 0 || leg.column >= grid.columns)) return undefined
  if (new Set(snapped.map((leg) => `${leg.column}:${leg.row}`)).size !== snapped.length) return undefined
  // Spread any pitch mismatch evenly, as a real part flexes into its holes.
  const shiftX = snapped.reduce((sum, leg) => sum + leg.dx, 0) / snapped.length, shiftZ = snapped.reduce((sum, leg) => sum + leg.dz, 0) / snapped.length
  const error = Math.max(...snapped.map((leg) => Math.hypot(leg.dx - shiftX, leg.dz - shiftZ)))
  if (error > MAX_SNAP_ERROR_MM) return undefined
  return { x: baseX + shiftX, z: baseZ + shiftZ, rotation, legs: snapped.map(({ pinId, column: c, row: r }) => ({ pinId, column: c, row: r })), error }
}

type BoardState = { grid: PlacedGrid; holes: Set<string>; strips: Map<string, unknown>; boxes: Box[]; netOf: (key: string) => unknown }

function isLegal(state: BoardState, partId: string, attempt: MountAttempt, box: Box) {
  const own = new Map<string, unknown>()
  for (const leg of attempt.legs) {
    if (state.holes.has(`${leg.column}:${leg.row}`)) return false
    const strip = stripOf(leg.column, leg.row), net = state.netOf(`${partId}:${leg.pinId}`)
    if (state.strips.has(strip) && state.strips.get(strip) !== net) return false
    if (own.has(strip) && own.get(strip) !== net) return false
    own.set(strip, net)
  }
  return !state.boxes.some((other) => overlaps(other, box))
}

function commit(state: BoardState, partId: string, placement: AssemblyPlacement, attempt: MountAttempt) {
  for (const leg of attempt.legs) {
    state.holes.add(`${leg.column}:${leg.row}`)
    state.strips.set(stripOf(leg.column, leg.row), state.netOf(`${partId}:${leg.pinId}`))
  }
  state.boxes.push(footprintBox(placement))
}

function mountedPlacement(base: Omit<AssemblyPlacement, 'mount' | 'positionMm' | 'rotationDeg' | 'originMm' | 'snapErrorMm'>, grid: PlacedGrid, attempt: MountAttempt): AssemblyPlacement {
  return { ...base, mount: 'breadboard', originMm: [0, 0, 0], positionMm: [attempt.x, grid.topY, attempt.z], rotationDeg: attempt.rotation, legs: attempt.legs, hole: { column: attempt.legs[0].column, row: attempt.legs[0].row }, snapErrorMm: attempt.error }
}

/** Project files are user input, so a mount is only trusted after this check. */
function isValidMount(mount: AssemblyMount) {
  if (mount.kind === 'bench') return Number.isFinite(mount.x) && Number.isFinite(mount.z) && Math.abs(mount.x) <= BENCH_MM.width / 2 && Math.abs(mount.z) <= BENCH_MM.depth / 2
  return mount.kind === 'breadboard' && Number.isInteger(mount.column) && Number.isInteger(mount.row) && mount.column >= 0 && mount.column < 30 && mount.row >= 0 && mount.row < 10 && Number.isFinite(mount.rotation)
}

const rotationOrder = (preferred: number) => [...new Set([preferred, preferred + 180, preferred + 90, preferred + 270].map(normalizeDeg))]

/** Lays every part out from wires and pin data. 2D canvas positions are not used in 3D. */
export function getAssemblyPlan(rawParts: Part[], wires: CircuitConnection[], options: AssemblyOptions): AssemblyPlan {
  const { boardId, failed } = options
  const parts = rawParts.map((part) => part.assembly && !isValidMount(part.assembly) ? { ...part, assembly: undefined } : part)
  const nets = createNetIndex(wires)
  const netOf = (key: string) => nets.netOf(key) ?? key
  const breadboardPart = parts.find((part) => part.type === 'breadboard')
  const boardPart = parts.find((part) => part.type === 'board')
  const gridData = getComponentMesh('breadboard')?.gridMm
  const boardModel = boardPart ? modelFor('board', boardId, failed?.has(boardPart.id) ?? false) : undefined
  const boardWidth = boardModel ? boardModel.boundsMm.max[0] - boardModel.boundsMm.min[0] : 0
  const breadboardBounds = getComponentMesh('breadboard')?.boundsMm as Bounds | undefined
  const breadWidth = breadboardBounds ? breadboardBounds.max[0] - breadboardBounds.min[0] : 83
  const hasBreadboard = Boolean(breadboardPart && gridData)
  const groupWidth = boardWidth + (hasBreadboard ? BOARD_GAP_MM + breadWidth : 0)
  const groupLeft = boardPart || hasBreadboard ? -groupWidth / 2 : -BENCH_MM.width / 2 + 10
  const breadCenter = groupLeft + boardWidth + (boardPart ? BOARD_GAP_MM : 0) + breadWidth / 2
  const placements = new Map<string, AssemblyPlacement>()
  const unmounted: string[] = []

  if (boardPart && boardModel) {
    const { legs: _legs, ...model } = boardModel
    placements.set(boardPart.id, { partId: boardPart.id, type: 'board', ...model, mount: 'bench', originMm: baseOrigin(model.boundsMm), positionMm: [groupLeft + boardWidth / 2, 0, 0], rotationDeg: 0, snapErrorMm: 0 })
  }

  let grid: PlacedGrid | undefined
  let state: BoardState | undefined
  if (breadboardPart && gridData && breadboardBounds) {
    grid = { ...gridData, originX: breadCenter, originZ: 0 }
    state = { grid, holes: new Set(), strips: new Map(), boxes: [], netOf }
    const { legs: _legs, ...model } = modelFor('breadboard', boardId, failed?.has(breadboardPart.id) ?? false)
    placements.set(breadboardPart.id, { partId: breadboardPart.id, type: 'breadboard', ...model, mount: 'bench', originMm: model.kind === 'fallback-box' ? [0, 0, 0] : baseOrigin(model.boundsMm), positionMm: [breadCenter, 0, 0], rotationDeg: 0, snapErrorMm: 0 })
  }

  const rest = parts.filter((part) => part.type !== 'board' && part.type !== 'breadboard')
  const legCount = (part: Part) => modelFor(part.type, boardId, false).legs?.length ?? 0
  const movable = rest.filter((part) => !failed?.has(part.id) && part.assembly?.kind !== 'bench' && legCount(part) > 0)
  const fixed = movable.filter((part) => part.assembly?.kind === 'breadboard')
  const auto = movable.filter((part) => part.assembly?.kind !== 'breadboard').sort((a, b) => legCount(b) - legCount(a))

  const placeOnBreadboard = (part: Part) => {
    if (!grid || !state) return false
    const { legs, ...model } = modelFor(part.type, boardId, false)
    if (!legs?.length) return false
    const base = { partId: part.id, type: part.type, ...model }
    const preferred = normalizeDeg(part.rotation ?? 0)
    const explicit = part.assembly?.kind === 'breadboard' ? part.assembly : undefined
    if (explicit && (explicit.partRotation ?? 0) === preferred) {
      const attempt = tryMount(legs, grid, explicit.column, explicit.row, explicit.rotation)
      if (attempt) {
        const placement = mountedPlacement(base, grid, attempt)
        if (isLegal(state, part.id, attempt, footprintBox(placement))) { commit(state, part.id, placement, attempt); placements.set(part.id, placement); return true }
      }
    }
    const rotations = explicit ? rotationOrder(explicit.rotation + preferred - (explicit.partRotation ?? 0)) : rotationOrder(preferred)
    let best: { attempt: MountAttempt; placement: AssemblyPlacement; score: number } | undefined
    const wiredColumns = (pinId: string) => { const net = netOf(`${part.id}:${pinId}`); return [...state!.strips].filter(([, value]) => value === net).map(([strip]) => Number(strip.split(':')[1])) }
    for (const rotation of rotations) for (let column = 0; column < grid.columns; column += 1) for (let row = 0; row < grid.rows.length; row += 1) {
      const attempt = tryMount(legs, grid, column, row, rotation)
      if (!attempt) continue
      const placement = mountedPlacement(base, grid, attempt)
      if (!isLegal(state, part.id, attempt, footprintBox(placement))) continue
      let score = explicit ? -Math.hypot(column - explicit.column, row - explicit.row) * 10 : -Math.abs(column - LEFT_OF_BOARD) * 0.4
      if (!explicit) for (const leg of attempt.legs) {
        const net = netOf(`${part.id}:${leg.pinId}`), strip = stripOf(leg.column, leg.row)
        if (state.strips.get(strip) === net && typeof net !== 'string') score += 1000
        const columns = wiredColumns(leg.pinId)
        if (columns.length) score -= Math.min(...columns.map((value) => Math.abs(value - leg.column))) * 3
      }
      if (rotation !== preferred) score -= 0.5
      if (!best || score > best.score) best = { attempt, placement, score }
    }
    if (!best) return false
    commit(state, part.id, best.placement, best.attempt)
    placements.set(part.id, best.placement)
    return true
  }

  for (const part of [...fixed, ...auto]) if (!placeOnBreadboard(part) && hasBreadboard) unmounted.push(part.id)

  // Everything else stands on the bench in a shelf row, in front of the breadboard or beside the board.
  const benchBase = (part: Part): AssemblyPlacement => {
    const { legs: _legs, ...model } = modelFor(part.type, boardId, failed?.has(part.id) ?? false)
    return { partId: part.id, type: part.type, ...model, mount: 'bench', originMm: baseOrigin(model.boundsMm), positionMm: [0, 0, 0], rotationDeg: normalizeDeg(part.rotation ?? 0), snapErrorMm: 0 }
  }
  const shelf = rest.filter((part) => !placements.has(part.id))
  const bounds = [...placements.values()].map(footprintBox)
  let cursorX = groupLeft, cursorZ = Math.max(0, ...bounds.map((box) => box.maxZ)) + SHELF_GAP_MM, rowDepth = 0
  for (const part of shelf) {
    const placement = benchBase(part)
    if (part.assembly?.kind === 'bench') { placements.set(part.id, { ...placement, positionMm: [part.assembly.x, 0, part.assembly.z] }); continue }
    const size = footprintBox({ ...placement, positionMm: [0, 0, 0] })
    const width = size.maxX - size.minX, depth = size.maxZ - size.minZ
    if (cursorX + width > BENCH_MM.width / 2 - 4) { cursorX = groupLeft; cursorZ += rowDepth + SHELF_GAP_MM; rowDepth = 0 }
    placements.set(part.id, { ...placement, positionMm: [cursorX + width / 2, 0, cursorZ + depth / 2] })
    cursorX += width + SHELF_GAP_MM
    rowDepth = Math.max(rowDepth, depth)
  }

  const ordered = parts.flatMap((part) => { const placement = placements.get(part.id); return placement ? [placement] : [] })
  const pinPoints: Record<string, Vec3> = {}
  const used = new Set<string>()
  for (const placement of ordered) for (const leg of placement.legs ?? []) used.add(`${leg.column}:${leg.row}`)
  let illustrativeParts = false
  let boardPinsFound = false
  const pinPoint = (partId: string, pinId: string): Vec3 | undefined => {
    const key = `${partId}:${pinId}`
    if (pinPoints[key]) return pinPoints[key]
    const placement = placements.get(partId)
    if (!placement) return undefined
    const leg = placement.legs?.find((item) => item.pinId === pinId)
    let point: Vec3
    if (leg && grid) point = holePoint(grid, leg.column, leg.row)
    else if (placement.type === 'breadboard' && grid) point = pinId === 'railPlus' ? [grid.originX + grid.firstColumnX, grid.topY, grid.originZ + grid.rails[0]] : pinId === 'railMinus' ? [grid.originX + grid.firstColumnX, grid.topY, grid.originZ + grid.rails[1]] : holePoint(grid, 0, pinId === 'rowA' ? 0 : 9)
    else {
      const local = placement.kind === 'fallback-box' ? undefined : placement.type === 'board' ? boardPinLocal(boardId, options.target, options.lessonId, pinId) : getComponentMesh(placement.type)?.pinsMm?.[pinId]
      if (placement.type === 'board' && local) boardPinsFound = true
      if (!local && placement.type !== 'board') illustrativeParts = true
      point = localToWorld(placement, local ?? illustrativePin(placement, pinId))
    }
    pinPoints[key] = point
    return point
  }
  /** A jumper ends in a free hole of the pin's strip, beside the lead. */
  const jumperEnd = (partId: string, pinId: string): Vec3 | undefined => {
    const placement = placements.get(partId)
    const leg = placement?.legs?.find((item) => item.pinId === pinId)
    if (!leg || !grid) return pinPoint(partId, pinId)
    const rows = leg.row < 5 ? [4, 3, 2, 1, 0] : [5, 6, 7, 8, 9]
    const free = rows.find((row) => !used.has(`${leg.column}:${row}`))
    if (free === undefined) return holePoint(grid, leg.column, leg.row)
    used.add(`${leg.column}:${free}`)
    return holePoint(grid, leg.column, free)
  }
  const wireEnds: AssemblyPlan['wireEnds'] = {}
  for (const wire of wires) {
    pinPoint(wire.from.partId, wire.from.pinId)
    pinPoint(wire.to.partId, wire.to.pinId)
    const from = jumperEnd(wire.from.partId, wire.from.pinId), to = jumperEnd(wire.to.partId, wire.to.pinId)
    if (from && to) wireEnds[wire.id] = [from, to]
  }
  for (const placement of ordered) for (const pin of getComponentDefinition(placement.type)?.pins ?? []) pinPoint(placement.partId, pin.id)
  const boardHasPads = boardId === 'esp32-devkit' || Object.keys(boardPinAnchors[boardId]?.pins ?? {}).length > 0
  return { placements: ordered, pinPoints, wireEnds, grid, notes: { boardPins: boardHasPads && boardPinsFound && !failed?.has(boardPart?.id ?? '') ? 'cad-pad' : 'illustrative', partPinsIllustrative: illustrativeParts, unmounted } }
}

/** Projects CircuitDocV2 wires to the existing assembly. Exact hole IDs are kept; unresolved geometry is omitted, never guessed. */
export function getAssemblyPlanV2(doc: CircuitDocV2, options: AssemblyOptions): AssemblyPlan {
  const parts: CircuitPart[] = doc.parts.map((part, index) => {
    const mount: AssemblyMount | undefined = part.mount.kind === 'breadboard'
      ? { kind: 'breadboard', column: part.mount.col - 1, row: part.mount.row, rotation: part.mount.rotation }
      : part.type === 'board' || part.type === 'breadboard'
        ? undefined
        : { kind: 'bench', x: part.mount.lane === 'left' ? -65 : part.mount.lane === 'right' ? 65 : 0, z: part.mount.order * 18 }
    const value = part.value?.label ?? (part.value?.ohm !== undefined ? `${part.value.ohm} Ω` : part.value?.farad !== undefined ? `${part.value.farad} F` : undefined)
    return { id: part.id, type: part.type, x: index * 10, y: 50, rotation: part.mount.kind === 'breadboard' ? part.mount.rotation : 0, ...(value ? { value } : {}), ...(mount ? { assembly: mount } : {}) }
  })
  const legacyWires: CircuitConnection[] = doc.wires.flatMap(wire => wire.from.kind === 'pin' && wire.to.kind === 'pin'
    ? [{ id: wire.id, from: { partId: wire.from.partId, pinId: wire.from.pinId }, to: { partId: wire.to.partId, pinId: wire.to.pinId } }]
    : [])
  const plan = getAssemblyPlan(parts, legacyWires, options)
  const wireEnds: AssemblyPlan['wireEnds'] = {}
  const wireEvidence: NonNullable<AssemblyPlan['wireEvidence']> = {}
  const diagnostics: NonNullable<AssemblyPlan['diagnostics']> = []
  const docPartById = new Map(doc.parts.map(part => [part.id, part]))
  const meshByType = new Map(doc.parts.map(part => [part.type, getComponentMesh(part.type)]))
  const resolveEndpoint = (endpoint: CircuitEndpointV2): { point: Vec3; evidence: 'cad' | 'parametric' | 'unknown'; sourceKey: string } | undefined => {
    if (endpoint.kind === 'hole') {
      const hole = parseHole(endpoint.holeId)
      if (!hole || !plan.grid) return undefined
      const local = holeToMm(hole, plan.grid)
      if (!local) return undefined
      return { point: [plan.grid.originX + local[0], local[1], plan.grid.originZ + local[2]], evidence: hole.kind === 'rail' ? 'unknown' : 'parametric', sourceKey: endpoint.holeId }
    }
    const point = plan.pinPoints[`${endpoint.partId}:${endpoint.pinId}`]
    const part = docPartById.get(endpoint.partId)
    const placement = plan.placements.find(item => item.partId === endpoint.partId)
    if (!point || !part || !placement || placement.kind === 'fallback-box') return undefined
    if (part.type === 'board' && plan.notes.boardPins !== 'cad-pad') return undefined
    const mesh = meshByType.get(part.type)
    if (placement.mount === 'breadboard' && placement.legs?.some(leg => leg.pinId === endpoint.pinId)) {
      return { point, evidence: placement.kind === 'component-cad' ? 'cad' : 'parametric', sourceKey: `${endpoint.partId}:${endpoint.pinId}` }
    }
    if (part.type === 'board') return { point, evidence: 'cad', sourceKey: `${endpoint.partId}:${endpoint.pinId}` }
    if (!mesh?.pinsMm?.[endpoint.pinId]) return undefined
    return { point, evidence: placement.kind === 'component-cad' ? 'cad' : 'parametric', sourceKey: `${endpoint.partId}:${endpoint.pinId}` }
  }
  for (const wire of doc.wires) {
    const from = resolveEndpoint(wire.from), to = resolveEndpoint(wire.to)
    if (!from || !to) {
      diagnostics.push({ code: 'UNRESOLVED_ENDPOINT', wireId: wire.id, message: `Không vẽ dây ${wire.id}: thiếu vị trí endpoint có nguồn hình học được hỗ trợ.` })
      continue
    }
    wireEnds[wire.id] = [from.point, to.point]
    wireEvidence[wire.id] = {
      from: { kind: wire.from.kind, evidence: from.evidence, sourceKey: from.sourceKey },
      to: { kind: wire.to.kind, evidence: to.evidence, sourceKey: to.sourceKey },
    }
  }
  return { ...plan, wireEnds, wireEvidence, diagnostics }
}

/** Pins the current layout so moving one part does not reshuffle the others. */
export function freezeAssembly(plan: AssemblyPlan, partRotation: (partId: string) => number = () => 0): Record<string, AssemblyMount> {
  const result: Record<string, AssemblyMount> = {}
  for (const placement of plan.placements) {
    if (placement.type === 'board' || placement.type === 'breadboard') continue
    result[placement.partId] = placement.mount === 'breadboard' && placement.hole
      ? { kind: 'breadboard', column: placement.hole.column, row: placement.hole.row, rotation: placement.rotationDeg, partRotation: partRotation(placement.partId) }
      : { kind: 'bench', x: placement.positionMm[0], z: placement.positionMm[2] }
  }
  return result
}

function othersState(wires: CircuitConnection[], partId: string, plan: AssemblyPlan): BoardState | undefined {
  if (!plan.grid) return undefined
  const nets = createNetIndex(wires)
  const state: BoardState = { grid: plan.grid, holes: new Set(), strips: new Map(), boxes: [], netOf: (key) => nets.netOf(key) ?? key }
  for (const placement of plan.placements) {
    if (placement.partId === partId || placement.type === 'breadboard') continue
    if (placement.mount === 'breadboard') commit(state, placement.partId, placement, { x: 0, z: 0, rotation: 0, legs: placement.legs ?? [], error: 0 })
    else state.boxes.push(footprintBox(placement))
  }
  return state
}

function legalAt(parts: Part[], options: AssemblyOptions, state: BoardState, partId: string, column: number, row: number, rotation: number) {
  const part = parts.find((item) => item.id === partId)
  const model = part && modelFor(part.type, options.boardId, false)
  if (!part || !model?.legs?.length) return undefined
  const attempt = tryMount(model.legs, state.grid, column, row, rotation)
  if (!attempt) return undefined
  const { legs: _legs, ...rest } = model
  const placement = mountedPlacement({ partId, type: part.type, ...rest }, state.grid, attempt)
  return isLegal(state, partId, attempt, footprintBox(placement)) ? placement : undefined
}

const benchMount = (x: number, z: number): AssemblyMount => ({ kind: 'bench', x: Math.max(-BENCH_MM.width / 2 + 12, Math.min(BENCH_MM.width / 2 - 12, x)), z: Math.max(-BENCH_MM.depth / 2 + 12, Math.min(BENCH_MM.depth / 2 - 12, z)) })

/** Nearest legal mount to where the part is dropped; off the breadboard it stands on the bench. */
export function snapPart(parts: Part[], wires: CircuitConnection[], options: AssemblyOptions, partId: string, targetMm: [number, number], plan: AssemblyPlan): AssemblyMount | undefined {
  const part = parts.find((item) => item.id === partId), current = plan.placements.find((item) => item.partId === partId)
  if (!part || !current) return undefined
  const state = othersState(wires, partId, plan)
  const grid = plan.grid
  const breadboard = plan.placements.find((item) => item.type === 'breadboard')
  const box = breadboard && footprintBox(breadboard)
  const over = box && targetMm[0] > box.minX - 4 && targetMm[0] < box.maxX + 4 && targetMm[1] > box.minZ - 4 && targetMm[1] < box.maxZ + 4
  if (!state || !grid || !over || !modelFor(part.type, options.boardId, false).legs?.length) return benchMount(targetMm[0], targetMm[1])
  let best: { placement: AssemblyPlacement; distance: number } | undefined
  for (const rotation of rotationOrder(current.rotationDeg)) for (let column = 0; column < grid.columns; column += 1) for (let row = 0; row < grid.rows.length; row += 1) {
    const placement = legalAt(parts, options, state, partId, column, row, rotation)
    if (!placement) continue
    const distance = Math.hypot(placement.positionMm[0] - targetMm[0], placement.positionMm[2] - targetMm[1]) + (rotation === current.rotationDeg ? 0 : 3)
    if (!best || distance < best.distance) best = { placement, distance }
  }
  const hole = best?.placement.hole
  return best && hole ? { kind: 'breadboard', column: hole.column, row: hole.row, rotation: best.placement.rotationDeg, partRotation: normalizeDeg(part.rotation ?? 0) } : benchMount(targetMm[0], targetMm[1])
}

/** One keyboard step: the next legal hole in that direction, or 5 mm on the bench. */
export function nudgePart(parts: Part[], wires: CircuitConnection[], options: AssemblyOptions, partId: string, columns: number, rows: number, plan: AssemblyPlan): AssemblyMount | undefined {
  const part = parts.find((item) => item.id === partId), current = plan.placements.find((item) => item.partId === partId)
  if (!part || !current) return undefined
  if (current.mount !== 'breadboard' || !current.hole || !plan.grid) return benchMount(current.positionMm[0] + columns * 5, current.positionMm[2] + rows * 5)
  const state = othersState(wires, partId, plan)
  if (!state) return undefined
  for (let step = 1; step <= 8; step += 1) {
    const column = current.hole.column + columns * step, row = current.hole.row + rows * step
    if (column < 0 || column >= plan.grid.columns || row < 0 || row >= plan.grid.rows.length) return undefined
    const placement = legalAt(parts, options, state, partId, column, row, current.rotationDeg)
    if (placement?.hole) return { kind: 'breadboard', column: placement.hole.column, row: placement.hole.row, rotation: current.rotationDeg, partRotation: normalizeDeg(part.rotation ?? 0) }
  }
  return undefined
}

const corners: CalloutCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

/** Up to four cards in the canvas corners, so the middle of the scene stays clear. */
export function assignCallouts(anchors: Array<{ id: string; x: number; y: number }>, selectedId: string, width: number, height: number): Callout[] {
  if (width < CALLOUT_MIN_WIDTH) return []
  const free = new Set(corners)
  const quadrant = (item: { x: number; y: number }): CalloutCorner => `${item.y < height / 2 ? 'top' : 'bottom'}-${item.x < width / 2 ? 'left' : 'right'}`
  const ordered = [...anchors.filter((item) => item.id === selectedId), ...anchors.filter((item) => item.id !== selectedId)]
  const result: Callout[] = []
  for (const item of ordered) {
    if (!free.size) break
    const preferred = quadrant(item)
    if (!free.has(preferred) && item.id !== selectedId) continue
    const corner = free.has(preferred) ? preferred : [...free][0]
    free.delete(corner)
    result.push({ ...item, corner })
  }
  for (const item of ordered) {
    if (!free.size) break
    if (result.some((callout) => callout.id === item.id)) continue
    const corner = [...free][0]
    free.delete(corner)
    result.push({ ...item, corner })
  }
  return result
}
