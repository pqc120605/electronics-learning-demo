import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import type { CircuitDocV2, CircuitEndpointV2 } from './circuitDocV2'
import { BREADBOARD_ELECTRICAL_SPEC, RAIL_IDS, holeNet, holeToMm, parseHole, railX } from './breadboardGrid'
import { footprintHoles, resolvePartGeometry } from './mountResolve'

export type DiagramPoint = { x: number; y: number }
export type DiagramHole = DiagramPoint & { id: string; kind: 'grid' | 'rail'; net: string | null }
export type DiagramPin = DiagramPoint & { partId: string; pinId: string; key: string; label: string; holeId?: string }
export type DiagramPart = { id: string; type: string; label: string; value: string; pins: DiagramPin[]; center: DiagramPoint; rotation: number; width: number; height: number }
export type DiagramWire = { id: string; role: 'signal' | 'power' | 'ground'; fromKey: string; toKey: string; from: DiagramPoint; to: DiagramPoint; path: string }
export type BreadboardDiagram = { width: number; height: number; board: { x: number; y: number; width: number; height: number }; breadboard: { x: number; y: number; width: number; height: number }; holes: DiagramHole[]; boardPins: DiagramPin[]; parts: DiagramPart[]; wires: DiagramWire[]; diagnostics: string[]; railVerified: false }

const SCALE = 9.2
const BREADBOARD_BOUNDS = { minX: -41.5, minZ: -27.5, width: 83, depth: 55 }
const BOARD_BOX = { x: 30, y: 190, width: 238, height: 218 }
const BREADBOARD_BOX = { x: 322, y: 34, width: 83 * SCALE, height: 55 * SCALE }
const endpointKey = (endpoint: CircuitEndpointV2) => endpoint.kind === 'hole' ? endpoint.holeId : `${endpoint.partId}:${endpoint.pinId}`
const valueText = (part: CircuitDocV2['parts'][number]) => part.value?.label ?? (part.value?.ohm !== undefined ? `${part.value.ohm} Ω` : part.value?.farad !== undefined ? `${part.value.farad} F` : '')

function holePoint(id: string): DiagramPoint | null {
  const hole = parseHole(id)
  const grid = getComponentMesh('breadboard')?.gridMm
  if (!hole || !grid) return null
  const mm = holeToMm(hole, grid)
  return mm ? { x: BREADBOARD_BOX.x + (mm[0] - BREADBOARD_BOUNDS.minX) * SCALE, y: BREADBOARD_BOX.y + (mm[2] - BREADBOARD_BOUNDS.minZ) * SCALE } : null
}

function wireColor(role: DiagramWire['role']) {
  return role === 'power' ? '#d94b3d' : role === 'ground' ? '#26333a' : '#2579b8'
}

function routeWire(from: DiagramPoint, to: DiagramPoint, index: number): string {
  const span = Math.max(40, Math.abs(to.x - from.x) * 0.34)
  const lift = 22 + (index % 4) * 10
  return `M ${from.x} ${from.y} C ${from.x + span} ${from.y - lift} ${to.x - span} ${to.y - lift} ${to.x} ${to.y}`
}

/** Top-down teaching diagram geometry. Electrical identity always comes from CircuitDocV2. */
export function buildBreadboardDiagram(doc: CircuitDocV2): BreadboardDiagram {
  const diagnostics: string[] = []
  const rows = 'abcdefghij'
  const holes: DiagramHole[] = []
  for (const row of rows) for (let column = 1; column <= BREADBOARD_ELECTRICAL_SPEC.columns; column += 1) {
    const id = `bb1:${column}${row}`, point = holePoint(id), hole = parseHole(id)
    if (point && hole) holes.push({ ...point, id, kind: 'grid', net: holeNet(hole) })
  }
  for (const rail of RAIL_IDS) for (let hole = 1; hole <= BREADBOARD_ELECTRICAL_SPEC.railHoles; hole += 1) {
    const id = `bb1:${rail}:${hole}`, point = holePoint(id), parsed = parseHole(id)
    if (point && parsed) holes.push({ ...point, id, kind: 'rail', net: holeNet(parsed) })
  }

  const boardPart = doc.parts.find(part => part.type === 'board')
  const usedBoardPinIds = new Set(doc.wires.flatMap(wire => [wire.from, wire.to].filter((endpoint): endpoint is Extract<CircuitEndpointV2, { kind: 'pin' }> => endpoint.kind === 'pin' && endpoint.partId === boardPart?.id).map(endpoint => endpoint.pinId)))
  const boardDefinition = componentRegistry.find(item => item.id === 'board')
  const boardPins: DiagramPin[] = boardPart ? (boardDefinition?.pins ?? []).filter(pin => usedBoardPinIds.has(pin.id)).map((pin, index, pins) => ({
    partId: boardPart.id, pinId: pin.id, key: `${boardPart.id}:${pin.id}`, label: pin.label,
    x: BOARD_BOX.x + BOARD_BOX.width - 4, y: BOARD_BOX.y + 92 + index * Math.min(36, 112 / Math.max(1, pins.length - 1)),
  })) : []
  const pinPoints = new Map<string, DiagramPoint>(boardPins.map(pin => [pin.key, pin]))
  const diagramParts: DiagramPart[] = []

  for (const part of doc.parts) {
    if (part.type === 'board' || part.type === 'breadboard' || part.mount.kind !== 'breadboard') continue
    const def = componentRegistry.find(item => item.id === part.type)
    const geometry = resolvePartGeometry(part.type, doc.lessonId)
    const footprint = footprintHoles(part)
    if (!def || !geometry?.legsMm.length || !footprint || footprint.length !== geometry.legsMm.length) {
      diagnostics.push(`${part.id}: chưa có hình học chân đủ để vẽ đúng vị trí trên breadboard.`)
      continue
    }
    const pins: DiagramPin[] = geometry.legsMm.flatMap((leg, index) => {
      const holeId = `bb1:${footprint[index].column}${footprint[index].row}`, point = holePoint(holeId)
      const pin = def.pins.find(item => item.id === leg.pinId)
      if (!point || !pin) return []
      const value = { ...point, partId: part.id, pinId: leg.pinId, key: `${part.id}:${leg.pinId}`, label: pin.label, holeId }
      pinPoints.set(value.key, point)
      return [value]
    })
    if (pins.length !== geometry.legsMm.length) {
      diagnostics.push(`${part.id}: một hoặc nhiều chân không thể ánh xạ tới lỗ của breadboard.`)
      continue
    }
    const center = pins.reduce((sum, pin) => ({ x: sum.x + pin.x / pins.length, y: sum.y + pin.y / pins.length }), { x: 0, y: 0 })
    const first = pins[0], last = pins[pins.length - 1]
    const rotation = Math.atan2(last.y - first.y, last.x - first.x) * 180 / Math.PI
    const span = Math.hypot(last.x - first.x, last.y - first.y)
    diagramParts.push({ id: part.id, type: part.type, label: def.label, value: valueText(part), pins, center, rotation, width: Math.max(part.type === 'button' ? 48 : 24, span * (part.type === 'button' ? 1.8 : 0.68)), height: part.type === 'button' ? 46 : 28 })
  }

  const wires: DiagramWire[] = []
  doc.wires.forEach((wire, index) => {
    const fromKey = endpointKey(wire.from), toKey = endpointKey(wire.to)
    const from = wire.from.kind === 'hole' ? holePoint(wire.from.holeId) : pinPoints.get(fromKey)
    const to = wire.to.kind === 'hole' ? holePoint(wire.to.holeId) : pinPoints.get(toKey)
    if (!from || !to) {
      diagnostics.push(`${wire.id}: không vẽ dây vì thiếu vị trí của endpoint ${!from ? fromKey : toKey}.`)
      return
    }
    const role = wire.role ?? 'signal'
    wires.push({ id: wire.id, role, fromKey, toKey, from, to, path: routeWire(from, to, index) })
  })

  // Keep rail geometry visibly marked as an educational 400-tie-point assumption.
  const railCenterX = railX(13, getComponentMesh('breadboard')?.gridMm ?? { pitch: 2.54, firstColumnX: -36.83, columns: 30 })
  if (railCenterX === null) diagnostics.push('Không thể xác định vị trí lỗ ray; hình học ray giữ ở trạng thái chưa xác minh.')

  return { width: 1120, height: 570, board: BOARD_BOX, breadboard: BREADBOARD_BOX, holes, boardPins, parts: diagramParts, wires, diagnostics, railVerified: false }
}

export { wireColor as breadboardDiagramWireColor }
