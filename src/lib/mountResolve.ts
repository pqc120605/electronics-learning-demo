import type { ComponentDefinition } from '../data/componentRegistry'
import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh, type ComponentLeg } from '../data/componentModels'
import { getInputAlias } from '../data/builderLessons'
import { getSimulationTarget } from '../data/simulationTargets'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { BREADBOARD_ELECTRICAL_SPEC, holeNet, holeToMm, parseHole, type BreadboardHole, type GridHole } from './breadboardGrid'
import type { CircuitDocV2, CircuitPartV2, CircuitMountV2 } from './circuitDocV2'

export type GeometrySource = 'cad' | 'parametric' | 'unknown'
export type ResolvedPartGeometry = {
  legsMm: ComponentLeg[]
  pinsMm: Record<string, number[]>
  geometrySource: GeometrySource
  mount: 'breadboard' | 'bench'
}
export type CircuitRegistryEntry = ComponentDefinition & Partial<{
  legsMm: ComponentLeg[]
  pinsMm: Record<string, number[]>
  mount: 'breadboard' | 'bench'
  geometrySource: 'cad' | 'parametric' | 'unknown'
}>
type MountGate = 'G2' | 'G4'
type MountResult = { ok: true } | { ok: false; code: MountGate; reason: string }
const mountFailure = (code: MountGate, reason: string): MountResult => ({ ok: false, code, reason })

const ROWS = 'abcdefghij'
const ROTATIONS = [0, 90, 180, 270]
const MAX_SNAP_ERROR_MM = 0.7

function boardPinsMm(lessonId: string): Record<string, number[]> {
  const target = getSimulationTarget('esp32-devkit')
  const input = getInputAlias(target, lessonId as Parameters<typeof getInputAlias>[1]).pin
  const byGpio = (gpio: number | undefined) => {
    const anchor = esp32DevkitModel.pins.find(pin => pin.gpio === gpio)?.anchor
    return anchor?.map(value => value * 1000)
  }
  const byLabel = (label: string) => {
    const anchor = esp32DevkitModel.pins.find(pin => pin.label === label)?.anchor
    return anchor?.map(value => value * 1000)
  }
  const pins: Record<string, number[] | undefined> = {
    ledOut: byGpio(target.codePin), input: byGpio(input), trig: byGpio(input), echo: byGpio(input + 1),
    vcc: byLabel('3V3'), gnd: byLabel('GND'),
    ...Object.fromEntries((target.sevenSegmentPins ?? []).map((gpio, index) => [`seg${index}`, byGpio(gpio)])),
  }
  return Object.fromEntries(Object.entries(pins).filter((entry): entry is [string, number[]] => Array.isArray(entry[1])))
}

function breadboardPinsMm(): Record<string, number[]> {
  const grid = getComponentMesh('breadboard')?.gridMm
  if (!grid) return {}
  const endpoints = {
    railPlus: parseHole('bb1:T+:1'), railMinus: parseHole('bb1:T-:1'),
    rowA: parseHole('bb1:1a'), rowB: parseHole('bb1:1f'),
  }
  return Object.fromEntries(Object.entries(endpoints).flatMap(([pinId, hole]) => {
    const point = hole && holeToMm(hole, grid)
    return point ? [[pinId, point]] : []
  }))
}

export function resolvePartGeometry(type: string, lessonId = 'blink', registry: readonly CircuitRegistryEntry[] = componentRegistry): ResolvedPartGeometry | null {
  if (type === 'board') return { legsMm: [], pinsMm: boardPinsMm(lessonId), geometrySource: 'unknown', mount: 'bench' }
  if (type === 'breadboard') return { legsMm: [], pinsMm: breadboardPinsMm(), geometrySource: 'parametric', mount: 'bench' }
  const model = getComponentMesh(type)
  if (!model) return null
  const override = registry.find(item => item.id === type)
  return {
    legsMm: override?.legsMm ?? model.legsMm,
    pinsMm: override?.pinsMm ?? model.pinsMm,
    geometrySource: override?.geometrySource ?? (model.kind === 'source-cad-mesh' ? 'cad' : model.kind === 'parametric-mesh' ? 'parametric' : 'unknown'),
    mount: override?.mount ?? model.mount,
  }
}

export function footprintHoles(part: CircuitPartV2, registry: readonly CircuitRegistryEntry[] = componentRegistry): GridHole[] | null {
  if (!part || !part.mount || part.mount.kind !== 'breadboard') return []
  const geometry = resolvePartGeometry(part.type, 'blink', registry)
  const grid = getComponentMesh('breadboard')?.gridMm
  const legs = geometry?.legsMm
  const mount = part.mount
  if (!grid || !legs?.length || !Number.isInteger(mount.col) || !Number.isInteger(mount.row)
    || mount.col < 1 || mount.col > BREADBOARD_ELECTRICAL_SPEC.columns
    || mount.row < 0 || mount.row >= grid.rows.length
    || !ROTATIONS.includes(mount.rotation)) return null
  const radians = mount.rotation * Math.PI / 180
  const rotate = (x: number, z: number): [number, number] => [x * Math.cos(radians) + z * Math.sin(radians), -x * Math.sin(radians) + z * Math.cos(radians)]
  const offsets = legs.map(leg => rotate(leg.x, leg.z))
  const [firstX, firstZ] = offsets[0]
  const baseX = grid.firstColumnX + (mount.col - 1) * grid.pitch - firstX
  const baseZ = grid.rows[mount.row] - firstZ
  const snapped = offsets.map(([offsetX, offsetZ]) => {
    const x = baseX + offsetX
    const z = baseZ + offsetZ
    const column = Math.round((x - grid.firstColumnX) / grid.pitch) + 1
    const row = grid.rows.reduce((best, value, index) => Math.abs(value - z) < Math.abs(grid.rows[best] - z) ? index : best, 0)
    return { column, row, dx: grid.firstColumnX + (column - 1) * grid.pitch - x, dz: grid.rows[row] - z }
  })
  if (snapped.some(({ column, row }) => column < 1 || column > grid.columns || !ROWS[row])) return null

  // Match the assembly fit by distributing pitch mismatch across all legs.
  const shiftX = snapped.reduce((sum, leg) => sum + leg.dx, 0) / snapped.length
  const shiftZ = snapped.reduce((sum, leg) => sum + leg.dz, 0) / snapped.length
  if (!snapped.every(leg => Math.hypot(leg.dx - shiftX, leg.dz - shiftZ) <= MAX_SNAP_ERROR_MM)) return null
  return snapped.map(({ column, row }) => ({ kind: 'grid', board: 'bb1', column, row: ROWS[row] }))
}

function holeId(hole: BreadboardHole): string {
  return hole.kind === 'grid' ? `bb1:${hole.column}${hole.row}` : `bb1:${hole.rail}:${hole.hole}`
}

export function occupancy(doc: Pick<CircuitDocV2, 'parts' | 'wires'>, lessonId = 'blink', registry: readonly CircuitRegistryEntry[] = componentRegistry): Record<string, { legs: Array<{ partId: string; pinId: string }>; wireEndpoints: Array<{ wireId: string; end: 'from' | 'to' }> }> {
  const result: Record<string, { legs: Array<{ partId: string; pinId: string }>; wireEndpoints: Array<{ wireId: string; end: 'from' | 'to' }> }> = {}
  const entry = (key: string) => result[key] ??= { legs: [], wireEndpoints: [] }
  for (const part of Array.isArray(doc?.parts) ? doc.parts : []) {
    const holes = footprintHoles(part, registry)
    const legs = resolvePartGeometry(part.type, lessonId, registry)?.legsMm ?? []
    if (!holes) continue
    holes.forEach((hole, index) => entry(holeId(hole)).legs.push({ partId: part.id, pinId: legs[index]?.pinId ?? '' }))
  }
  for (const wire of Array.isArray(doc?.wires) ? doc.wires : []) {
    for (const end of ['from', 'to'] as const) {
      const endpoint = wire?.[end]
      if (endpoint?.kind !== 'hole') continue
      const hole = parseHole(endpoint.holeId)
      if (hole) entry(holeId(hole)).wireEndpoints.push({ wireId: wire.id, end })
    }
  }
  return result
}

export function canMount(part: CircuitPartV2, mount: CircuitMountV2, doc: CircuitDocV2, registry: readonly CircuitRegistryEntry[] = componentRegistry): MountResult {
  if (!part || !mount || !doc || !Array.isArray(doc.parts)) return mountFailure('G2', 'Thiếu linh kiện, vị trí hoặc tài liệu mạch hợp lệ.')
  const definition = registry.find(item => item.id === part.type)
  if (!definition) return mountFailure('G2', `Không có loại linh kiện “${part.type}” trong registry.`)
  const geometry = resolvePartGeometry(part.type, doc.lessonId, registry)
  if (!geometry) return mountFailure('G2', `Thiếu hình học cho linh kiện “${part.type}”.`)
  if (mount.kind === 'breadboard') {
    if (geometry.mount !== 'breadboard') return mountFailure('G2', `Linh kiện “${part.type}” không được manifest cho phép cắm breadboard.`)
    if (!geometry.legsMm.length) return mountFailure('G2', `Linh kiện “${part.type}” thiếu legsMm để cắm vào lỗ.`)
    if (geometry.legsMm.some(leg => !definition.pins.some(pin => pin.id === leg.pinId))) return mountFailure('G2', `Linh kiện “${part.type}” có legsMm trỏ tới pin không tồn tại trong registry.`)
    if (!doc.breadboards?.some(board => board.id === mount.board)) return mountFailure('G2', `Không tìm thấy breadboard “${mount.board}” trong tài liệu.`)
    const candidate = footprintHoles({ ...part, mount }, registry)
    if (!candidate?.length) return mountFailure('G4', 'Chân linh kiện rơi ngoài lưới lỗ breadboard.')
    const keys = candidate.map(holeId)
    if (new Set(keys).size !== keys.length) return mountFailure('G4', 'Hai chân của cùng linh kiện chiếm cùng một lỗ.')
    const strips = new Map<string, Set<string>>()
    for (const [index, hole] of candidate.entries()) {
      const net = holeNet(hole)
      const pinId = geometry.legsMm[index]?.pinId
      if (!net || !pinId) return mountFailure('G2', 'Không thể xác định dải nối hoặc chân linh kiện.')
      const pins = strips.get(net) ?? new Set<string>()
      pins.add(pinId)
      strips.set(net, pins)
    }
    if (!part.intentionalShort && [...strips.values()].some(pins => pins.size > 1)) return mountFailure('G4', 'Hai chân khác nhau của linh kiện rơi cùng một dải nối; chỉ khai báo intentionalShort khi đó là nối nội bộ có chủ đích.')
    const used = occupancy(doc, doc.lessonId, registry)
    for (const key of keys) {
      if (used[key]?.legs.some(leg => leg.partId !== part.id)) return mountFailure('G4', `Lỗ ${key} đã có chân linh kiện khác.`)
    }
    return { ok: true }
  }
  if (mount.kind !== 'bench' || !['left', 'right', 'bottom'].includes(mount.lane) || !Number.isInteger(mount.order) || mount.order < 0) return mountFailure('G2', 'Vị trí bench phải có làn hợp lệ và thứ tự không âm.')
  if (geometry.mount !== 'bench') return mountFailure('G2', `Linh kiện “${part.type}” được manifest dành cho breadboard.`)
  if (!Object.keys(geometry.pinsMm).length) return mountFailure('G2', `Linh kiện “${part.type}” thiếu pinsMm cho vị trí bench.`)
  return { ok: true }
}

export function registryMissingBreadboardLegs(registry: readonly CircuitRegistryEntry[] = componentRegistry): string[] {
  return registry.flatMap(part => {
    const geometry = resolvePartGeometry(part.id, 'blink', registry)
    return geometry?.mount === 'breadboard' && !geometry.legsMm.length ? [part.id] : []
  })
}
