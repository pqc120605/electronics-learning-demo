import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import { getInputAlias, type BuilderLessonId } from '../data/builderLessons'
import { getSimulationTarget } from '../data/simulationTargets'
import type { CircuitDocV2, CircuitEndpointV2 } from './circuitDocV2'
import { BREADBOARD_ELECTRICAL_SPEC, RAIL_IDS, formatHole, holeNet, holeToMm, parseHole, railX } from './breadboardGrid'
import { footprintHoles, resolvePartGeometry } from './mountResolve'
import { routeWires, type RouterWire } from './wireRouter'
import {projectTopViewPoint,type BoardDiagramPresentation} from './boardTopView'

export type DiagramPoint = { x: number; y: number }
export type DiagramHole = DiagramPoint & { id: string; kind: 'grid' | 'rail'; net: string | null }
export type DiagramPin = DiagramPoint & { partId: string; pinId: string; key: string; label: string; holeId?: string; side?: 'left' | 'right' | 'top' | 'bottom' }
export type DiagramPart = { id: string; type: string; label: string; value: string; mount: 'breadboard' | 'bench'; pins: DiagramPin[]; center: DiagramPoint; rotation: number; width: number; height: number }
export type DiagramWire = { id: string; role: 'signal' | 'power' | 'ground'; fromKey: string; toKey: string; from: DiagramPoint; to: DiagramPoint; points: DiagramPoint[]; path: string }
export type BreadboardDiagram = { width: number; height: number; board: { x: number; y: number; width: number; height: number }; breadboard: { x: number; y: number; width: number; height: number }; holes: DiagramHole[]; boardPins: DiagramPin[]; parts: DiagramPart[]; wires: DiagramWire[]; diagnostics: string[]; railVerified: false }

const SCALE = 9.2
const BREADBOARD_BOUNDS = { minX: -41.5, minZ: -27.5, width: 83, depth: 55 }
const BOARD_BOX = { x: 30, y: 190, width: 238, height: 218 }
const BREADBOARD_BOX = { x: 322, y: 34, width: 83 * SCALE, height: 55 * SCALE }
const endpointKey = (endpoint: CircuitEndpointV2) => endpoint.kind === 'hole' ? endpoint.holeId : `${endpoint.partId}:${endpoint.pinId}`
const valueText = (part: CircuitDocV2['parts'][number]) => part.value?.label ?? (part.value?.ohm !== undefined ? `${part.value.ohm} Ω` : part.value?.farad !== undefined ? `${part.value.farad} F` : '')

/** Returns the adjacent physical hole for arrow-key navigation; no wrapping across board edges. */
export function adjacentBreadboardHole(holeId: string, key: string): string | null {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) return null
  const hole = parseHole(holeId)
  if (!hole) return null
  if (hole.kind === 'grid') {
    const rows = 'abcdefghij'
    let column = hole.column
    let row = rows.indexOf(hole.row)
    if (key === 'ArrowLeft') column -= 1
    else if (key === 'ArrowRight') column += 1
    else if (key === 'ArrowUp') row -= 1
    else row += 1
    if (column < 1 || column > BREADBOARD_ELECTRICAL_SPEC.columns || row < 0 || row >= rows.length) return null
    return formatHole({ kind: 'grid', board: 'bb1', column, row: rows[row] })
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const nextHole = hole.hole + (key === 'ArrowRight' ? 1 : -1)
    return formatHole({ ...hole, hole: nextHole })
  }
  const railColumn = hole.rail.endsWith('+') ? 0 : 1
  const nextRow = (hole.rail.startsWith('T') ? 0 : 1) + (key === 'ArrowDown' ? 1 : -1)
  if (nextRow < 0 || nextRow > 1) return null
  const rail = `${nextRow === 0 ? 'T' : 'B'}${railColumn === 0 ? '+' : '-'}` as typeof hole.rail
  return formatHole({ ...hole, rail })
}

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

/** Top-down teaching diagram geometry. Electrical identity always comes from CircuitDocV2. */
export function buildBreadboardDiagram(doc: CircuitDocV2, presentation?: BoardDiagramPresentation): BreadboardDiagram {
  const diagnostics: string[] = []
  const art=presentation?.topView
  const boardBox=art?{x:30,y:34,width:(art.boundsMm.maxX-art.boundsMm.minX)*SCALE,height:(art.boundsMm.maxZ-art.boundsMm.minZ)*SCALE}:BOARD_BOX
  const offsetX=art?boardBox.x+boardBox.width+50-BREADBOARD_BOX.x:0
  const breadboardBox={...BREADBOARD_BOX,x:BREADBOARD_BOX.x+offsetX}
  const pointOf=(id:string)=>{const point=holePoint(id);return point?{x:point.x+offsetX,y:point.y}:null}
  const rows = 'abcdefghij'
  const holes: DiagramHole[] = []
  for (const row of doc.breadboards.length ? rows : '') for (let column = 1; column <= BREADBOARD_ELECTRICAL_SPEC.columns; column += 1) {
    const id = `bb1:${column}${row}`, point = pointOf(id), hole = parseHole(id)
    if (point && hole) holes.push({ ...point, id, kind: 'grid', net: holeNet(hole) })
  }
  for (const rail of doc.breadboards.length ? RAIL_IDS : []) for (let hole = 1; hole <= BREADBOARD_ELECTRICAL_SPEC.railHoles; hole += 1) {
    const id = `bb1:${rail}:${hole}`, point = pointOf(id), parsed = parseHole(id)
    if (point && parsed) holes.push({ ...point, id, kind: 'rail', net: holeNet(parsed) })
  }

  const boardPart = doc.parts.find(part => part.type === 'board')
  const boardDefinition = componentRegistry.find(item => item.id === 'board')
  const target = getSimulationTarget('esp32-devkit')
  const inputAlias = getInputAlias(target, doc.lessonId as BuilderLessonId)
  const boardPinLabel = (pinId: string, fallback: string) => {
    if (presentation) return presentation.pinLabels[pinId] ?? fallback
    if (pinId === 'ledOut') return target.pinLabel
    if (pinId === 'input' || pinId === 'trig') return inputAlias.label
    if (pinId === 'echo') return `GPIO ${inputAlias.pin + 1}`
    if (pinId === 'vcc') return '3V3'
    if (pinId === 'v5') return '5V'
    const segment = /^seg(\d)$/.exec(pinId)
    const segmentPin = segment ? target.sevenSegmentPins?.[Number(segment[1])] : undefined
    return segmentPin === undefined ? fallback : `GPIO ${segmentPin}`
  }
  const boardPinDefinitions = boardDefinition?.pins ?? []
  const missingBoardPins:string[]=[]
  const leftPinCount = Math.ceil(boardPinDefinitions.length / 2)
  const boardPins: DiagramPin[] = boardPart ? boardPinDefinitions.flatMap((pin, index):DiagramPin[] => {
    let side:DiagramPin['side'] = index < leftPinCount ? 'left' : 'right'
    const row = side === 'left' ? index : index - leftPinCount
    const count = side === 'left' ? leftPinCount : boardPinDefinitions.length - leftPinCount
    let position={x:side==='left'?BOARD_BOX.x+4:BOARD_BOX.x+BOARD_BOX.width-4,y:BOARD_BOX.y+92+row*(112/Math.max(1,count-1))}
    if(presentation){
      const anchor=presentation.pinAnchors[pin.id]
      const projected=art&&anchor?projectTopViewPoint(art.boundsMm,boardBox,anchor):null
      if(!projected){missingBoardPins.push(pin.id);return []}
      position=projected
      const edges:Array<[NonNullable<DiagramPin['side']>,number]>=[['left',position.x-boardBox.x],['right',boardBox.x+boardBox.width-position.x],['top',position.y-boardBox.y],['bottom',boardBox.y+boardBox.height-position.y]]
      side=edges.sort((a,b)=>a[1]-b[1])[0][0]
    }
    return [{
      partId: boardPart.id, pinId: pin.id, key: `${boardPart.id}:${pin.id}`, label: boardPinLabel(pin.id, pin.label), side,
      ...position,
    }]
  }) : []
  if(missingBoardPins.length)diagnostics.push(`${boardPart?.id}: chưa có tọa độ chân đủ nguồn cho ${missingBoardPins.join(', ')}; các chân này chỉ có trong danh sách logic, không đặt ước lượng lên ảnh.`)
  const pinPoints = new Map<string, DiagramPoint>(boardPins.map(pin => [pin.key, pin]))
  const pinByKey = new Map<string, DiagramPin>(boardPins.map(pin => [pin.key, pin]))
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
      const holeId = `bb1:${footprint[index].column}${footprint[index].row}`, point = pointOf(holeId)
      const pin = def.pins.find(item => item.id === leg.pinId)
      if (!point || !pin) return []
      const value = { ...point, partId: part.id, pinId: leg.pinId, key: `${part.id}:${leg.pinId}`, label: pin.label, holeId }
      pinPoints.set(value.key, point)
      pinByKey.set(value.key, value)
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
    diagramParts.push({ id: part.id, type: part.type, label: def.label, value: valueText(part), mount: 'breadboard', pins, center, rotation, width: Math.max(24, span * 0.68), height: 28 })
  }

  const benchParts = doc.parts.filter(part => part.type !== 'board' && part.type !== 'breadboard' && part.mount.kind === 'bench')
    .sort((a, b) => a.mount.kind === 'bench' && b.mount.kind === 'bench' ? a.mount.order - b.mount.order || a.id.localeCompare(b.id) : a.id.localeCompare(b.id))
  benchParts.forEach((part, index) => {
    const def = componentRegistry.find(item => item.id === part.type)
    const geometry = resolvePartGeometry(part.type, doc.lessonId)
    const definitions = def?.pins ?? []
    const coordinates = definitions.map(pin => geometry?.pinsMm[pin.id]).filter((point): point is number[] => Array.isArray(point) && point.length >= 3 && point.every(Number.isFinite))
    if (!def || !geometry || coordinates.length !== definitions.length || !definitions.length) {
      diagnostics.push(`${part.id}: chưa có tọa độ chân bench đủ để vẽ đầu nối.`)
      return
    }
    const center = { x: boardBox.x + boardBox.width / 2, y: Math.max(482,boardBox.y+boardBox.height+50) + index * 68 }
    const minX = Math.min(...coordinates.map(point => point[0])), maxX = Math.max(...coordinates.map(point => point[0]))
    const minZ = Math.min(...coordinates.map(point => point[2])), maxZ = Math.max(...coordinates.map(point => point[2]))
    const midpointX = (minX + maxX) / 2, midpointZ = (minZ + maxZ) / 2
    const pins: DiagramPin[] = definitions.flatMap(pin => {
      const pointMm = geometry.pinsMm[pin.id]
      const definition = def.pins.find(item => item.id === pin.id)
      if (!pointMm || !definition) return []
      // Bench terminals are shown on opposite sides of the device body. This view does not claim a breadboard hole.
      const point = { x: center.x + (pointMm[2] - midpointZ) * SCALE, y: center.y + (pointMm[0] - midpointX) * SCALE }
      const value: DiagramPin = { ...point, partId: part.id, pinId: pin.id, key: `${part.id}:${pin.id}`, label: definition.label, side: point.x < center.x ? 'left' : 'right' }
      pinPoints.set(value.key, point)
      pinByKey.set(value.key, value)
      return [value]
    })
    const span = pins.length > 1 ? Math.hypot(pins.at(-1)!.x - pins[0].x, pins.at(-1)!.y - pins[0].y) : 0
    diagramParts.push({ id: part.id, type: part.type, label: def.label, value: valueText(part), mount: 'bench', pins, center, rotation: 0, width: Math.max(58, span + 18), height: 54 })
  })

  const wireCandidates: Array<{ wire: CircuitDocV2['wires'][number]; fromKey: string; toKey: string; from: DiagramPoint; to: DiagramPoint }> = []
  doc.wires.forEach(wire => {
    const fromKey = endpointKey(wire.from), toKey = endpointKey(wire.to)
    const from = wire.from.kind === 'hole' ? pointOf(wire.from.holeId) : pinPoints.get(fromKey)
    const to = wire.to.kind === 'hole' ? pointOf(wire.to.holeId) : pinPoints.get(toKey)
    if (!from || !to) {
      diagnostics.push(`${wire.id}: không vẽ dây vì thiếu vị trí của endpoint ${!from ? fromKey : toKey}.`)
      return
    }
    wireCandidates.push({ wire, fromKey, toKey, from, to })
  })

  const obstacleBoxes: Array<{ id: string; x: number; y: number; width: number; height: number }> = [
    ...(boardPart ? [{ id:boardPart.id, ...boardBox }] : []),
    ...diagramParts.map(part => {
      const radians = part.rotation * Math.PI / 180
      const width = Math.abs(part.width * Math.cos(radians)) + Math.abs(part.height * Math.sin(radians))
      const height = Math.abs(part.width * Math.sin(radians)) + Math.abs(part.height * Math.cos(radians))
      return { id: part.id, x: part.center.x - width / 2, y: part.center.y - height / 2, width, height }
    }),
  ]
  const obstacleAt = (point: DiagramPoint) => obstacleBoxes
    .filter(box => point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height)
    .sort((a, b) => a.width * a.height - b.width * b.height)[0]?.id
  const sideToExit = (side: DiagramPin['side']): RouterWire['fromExit'] => side === 'left' ? 'W' : side === 'right' ? 'E' : side==='top'?'N':side==='bottom'?'S':undefined
  const toRouterPoint = (point: DiagramPoint): RouterWire['from'] => [point.x / SCALE, point.y / SCALE]
  const routerWires: RouterWire[] = wireCandidates.map(({ wire, fromKey, toKey, from, to }) => {
    const fromPin = pinByKey.get(fromKey), toPin = pinByKey.get(toKey)
    const fromObstacleId = fromPin ? fromPin.partId : obstacleAt(from)
    const toObstacleId = toPin ? toPin.partId : obstacleAt(to)
    return {
      id: wire.id,
      from: toRouterPoint(from),
      to: toRouterPoint(to),
      ...(fromPin?.side ? { fromExit: sideToExit(fromPin.side) } : {}),
      ...(toPin?.side ? { toExit: sideToExit(toPin.side) } : {}),
      ...(fromObstacleId ? { fromObstacleId } : {}),
      ...(toObstacleId ? { toObstacleId } : {}),
      role: wire.role,
    }
  })
  const routed = routeWires(routerWires, obstacleBoxes.map(box => ({ id: box.id, x: box.x / SCALE, y: box.y / SCALE, width: box.width / SCALE, height: box.height / SCALE })), { clearanceMm: 0.6 })
  routed.errors.forEach(error => diagnostics.push(`${error.wireId}: không thể định tuyến dây vuông góc: ${error.reason}`))
  const routesById = new Map(routed.routes.map(route => [route.id, route]))
  const wires: DiagramWire[] = wireCandidates.flatMap(({ wire, fromKey, toKey, from, to }) => {
    const route = routesById.get(wire.id)
    if (!route) return []
    const points = route.points.map(([x, y]) => ({ x: x * SCALE, y: y * SCALE }))
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    return [{ id: wire.id, role: wire.role ?? 'signal', fromKey, toKey, from, to, points, path }]
  })

  // Keep rail geometry visibly marked as an educational 400-tie-point assumption.
  const railCenterX = railX(13, getComponentMesh('breadboard')?.gridMm ?? { pitch: 2.54, firstColumnX: -36.83, columns: 30 })
  if (railCenterX === null) diagnostics.push('Không thể xác định vị trí lỗ ray; hình học ray giữ ở trạng thái chưa xác minh.')

  const height = Math.max(570,boardBox.y+boardBox.height+60)+(benchParts.length?Math.max(1,benchParts.length)*68:0)
  return { width: doc.breadboards.length ? breadboardBox.x+breadboardBox.width+34 : Math.max(330,boardBox.x+boardBox.width+30), height, board:boardBox, breadboard:breadboardBox, holes, boardPins, parts: diagramParts, wires, diagnostics, railVerified: false }
}

export { wireColor as breadboardDiagramWireColor }
