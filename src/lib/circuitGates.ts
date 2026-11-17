import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import { getSimulationTarget } from '../data/simulationTargets'
import { compileSpiceConnections } from './compileSpiceConnections'
import { validateCircuitDoc, type CircuitDocV2, type CircuitDocDiagnostic } from './circuitDocV2'
import { createNetIndexV2 } from './circuitNetsV2'
import { layout2D } from './layout2D'
import { buildBreadboardDiagram } from './breadboardDiagram'
import { footprintHoles, resolvePartGeometry } from './mountResolve'
import { routeWires, type RouterObstacle, type RouterWire } from './wireRouter'
import { compileWorkspaceSpice } from './workspaceSpice'
import { getAssemblyPlanV2, footprintBox, rotateXZ } from './assemblyLayout'
import { formatHole, holeToMm } from './breadboardGrid'
import { BENCH_MM } from './assemblyLayout'
import type { BuilderLessonId } from '../data/builderLessons'
import type { BoardDiagramPresentation } from './boardTopView'

export type CircuitGateId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7' | 'G8' | 'G9' | 'G10'
export type CircuitGateStatus = 'pass' | 'fail' | 'warning' | 'not_applicable'
export type CircuitGateResult = { id: CircuitGateId; status: CircuitGateStatus; diagnostics: string[] }
export type CircuitGateReport = { lessonId: string; gates: CircuitGateResult[] }

const GATE_IDS: readonly CircuitGateId[] = ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']
const EPSILON_MM = 1e-6

function makeGate(id: CircuitGateId, status: CircuitGateStatus, diagnostics: string[] = []): CircuitGateResult {
  return { id, status, diagnostics }
}

function gateFromValidation(id: 'G1' | 'G2' | 'G3' | 'G4', issues: readonly CircuitDocDiagnostic[]): CircuitGateResult {
  const matching = issues.filter(issue => issue.code === id)
  const errors = matching.filter(issue => issue.severity === 'error').map(issue => issue.message)
  const warnings = matching.filter(issue => issue.severity === 'warning').map(issue => issue.message)
  return makeGate(id, errors.length ? 'fail' : warnings.length ? 'warning' : 'pass', [...errors, ...warnings])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function endpointNetKey(index: ReturnType<typeof createNetIndexV2>, endpoint: CircuitDocV2['wires'][number]['from']): string | undefined {
  const key = endpoint.kind === 'pin' ? `${endpoint.partId}:${endpoint.pinId}` : endpoint.holeId
  return index.netOf(key)?.key
}

function evaluateG5(doc: CircuitDocV2): CircuitGateResult {
  const layout = layout2D(doc)
  const issues: string[] = []
  if (layout.unplaced.length) issues.push(`Không đặt được linh kiện: ${layout.unplaced.join(', ')}.`)
  const breadboard = layout.placements.find(item => item.type === 'breadboard')
  const mounted = new Set(doc.parts.filter(part => part.mount.kind === 'breadboard').map(part => part.id))
  const placements = layout.placements

  for (const placement of placements) {
    const { minX, maxX, minY, maxY } = placement.bounds
    if (minX < -BENCH_MM.width / 2 || maxX > BENCH_MM.width / 2 || minY < -BENCH_MM.depth / 2 || maxY > BENCH_MM.depth / 2) {
      issues.push(`“${placement.partId}” nằm ngoài khung bàn ${BENCH_MM.width} × ${BENCH_MM.depth} mm.`)
    }
    if (mounted.has(placement.partId) && breadboard
      && (minX < breadboard.bounds.minX - EPSILON_MM || maxX > breadboard.bounds.maxX + EPSILON_MM
        || minY < breadboard.bounds.minY - EPSILON_MM || maxY > breadboard.bounds.maxY + EPSILON_MM)) {
      issues.push(`Footprint “${placement.partId}” vượt mép breadboard.`)
    }
  }

  for (let left = 0; left < placements.length; left += 1) for (let right = left + 1; right < placements.length; right += 1) {
    const a = placements[left], b = placements[right]
    if (a.type === 'breadboard' || b.type === 'breadboard') continue
    if (mounted.has(a.partId) !== mounted.has(b.partId)) continue
    const gap = 0.5
    const overlaps = a.bounds.minX < b.bounds.maxX + gap && b.bounds.minX < a.bounds.maxX + gap
      && a.bounds.minY < b.bounds.maxY + gap && b.bounds.minY < a.bounds.maxY + gap
    if (overlaps) issues.push(`Footprint “${a.partId}” và “${b.partId}” chồng hoặc cách nhau dưới 0,5 mm.`)
  }
  return makeGate('G5', issues.length ? 'fail' : 'pass', issues)
}

function pointInside(point: readonly [number, number], obstacle: RouterObstacle): boolean {
  return point[0] >= obstacle.x && point[0] <= obstacle.x + obstacle.width
    && point[1] >= obstacle.y && point[1] <= obstacle.y + obstacle.height
}

function evaluateG6(doc: CircuitDocV2, presentation?: BoardDiagramPresentation): CircuitGateResult {
  const issues: string[] = []
  const warnings: string[] = []
  const target = getSimulationTarget(presentation?.id ?? 'esp32-devkit')
  let plan: ReturnType<typeof getAssemblyPlanV2>
  try {
    plan = getAssemblyPlanV2(doc, { boardId: target.boardId, target, lessonId: doc.lessonId as BuilderLessonId })
  } catch (error) {
    return makeGate('G6', 'fail', [`Không dựng được vị trí hai đầu dây: ${String(error)}`])
  }
  for (const diagnostic of plan.diagnostics ?? []) issues.push(diagnostic.message)

  for (const wire of doc.wires) {
    const withoutWire = createNetIndexV2({ ...doc, wires: doc.wires.filter(candidate => candidate.id !== wire.id) })
    const fromNet = endpointNetKey(withoutWire, wire.from)
    const toNet = endpointNetKey(withoutWire, wire.to)
    if (fromNet && fromNet === toNet) issues.push(`Dây “${wire.id}” dư: hai đầu vẫn cùng net khi bỏ riêng dây này.`)
    if (!plan.wireEnds[wire.id]) issues.push(`Dây “${wire.id}” không có đủ tọa độ hai đầu từ hình học đã khai báo.`)
  }
  if (issues.length) return makeGate('G6', 'fail', issues)

  // The displayed CAD projection is a different geometry from the 3D plan.
  // When a caller displays it, validate those exact routes and all wire IDs;
  // an omitted visual wire must never be hidden behind a green routing gate.
  if (presentation) {
    const diagram = buildBreadboardDiagram(doc, presentation)
    issues.push(...diagram.diagnostics)
    for (const wire of doc.wires) {
      if (!diagram.wires.some(route => route.id === wire.id)) issues.push(`Dây “${wire.id}” thiếu đường vẽ trong khung breadboard đang hiển thị.`)
    }
    for (const route of diagram.wires) {
      const bends = route.points.slice(2).filter((point, index) => {
        const a = route.points[index], b = route.points[index + 1]
        return Math.abs((b.x - a.x) * (point.y - b.y) - (b.y - a.y) * (point.x - b.x)) > EPSILON_MM
      }).length
      if (bends > 3) warnings.push(`Dây “${route.id}” trên breadboard có ${bends} góc rẽ; hơn 3 là cảnh báo theo R8.`)
    }
    if (issues.length) return makeGate('G6', 'fail', issues)
    // Continue the 3D routing checks too; a correct 2D projection does not
    // replace the previous assembly-space checks when the view is switched.
  }

  const obstacles: RouterObstacle[] = plan.placements
    .filter(placement => placement.type !== 'breadboard' && placement.kind !== 'fallback-box')
    .map(placement => {
      const bounds = footprintBox(placement)
      return { id: placement.partId, x: bounds.minX, y: bounds.minZ, width: bounds.maxX - bounds.minX, height: bounds.maxZ - bounds.minZ }
    })
  const partById = new Map(doc.parts.map(part => [part.id, part]))
  const pinExit = (endpoint: typeof doc.wires[number]['from'], point: RouterWire['from']): RouterWire['fromExit'] => {
    if (endpoint.kind !== 'pin') return undefined
    const obstacle = obstacles.find(item => item.id === endpoint.partId)
    if (!obstacle) return 'N'
    const distances: Array<[NonNullable<RouterWire['fromExit']>, number]> = [
      ['N', Math.abs(point[1] - obstacle.y)],
      ['E', Math.abs(obstacle.x + obstacle.width - point[0])],
      ['S', Math.abs(obstacle.y + obstacle.height - point[1])],
      ['W', Math.abs(point[0] - obstacle.x)],
    ]
    return distances.sort((a, b) => a[1] - b[1])[0][0]
  }
  const routerWires: RouterWire[] = doc.wires.flatMap(wire => {
    const ends = plan.wireEnds[wire.id]
    if (!ends) return []
    const from: [number, number] = [ends[0][0], ends[0][2]]
    const to: [number, number] = [ends[1][0], ends[1][2]]
    const owner = (endpoint: typeof wire.from, point: readonly [number, number]) => {
      if (endpoint.kind === 'pin') return endpoint.partId
      return obstacles.filter(obstacle => pointInside(point, obstacle)).sort((a, b) => a.width * a.height - b.width * b.height)[0]?.id
    }
    const fromObstacleId = owner(wire.from, from)
    const toObstacleId = owner(wire.to, to)
    // pin endpoint ownership is more reliable than testing whether its rendered jumper lead is inside the model bounds.
    const fromPart = wire.from.kind === 'pin' ? partById.get(wire.from.partId) : undefined
    const toPart = wire.to.kind === 'pin' ? partById.get(wire.to.partId) : undefined
    return [{
      id: wire.id, from, to, role: wire.role,
      ...(fromObstacleId ? { fromObstacleId } : {}), ...(toObstacleId ? { toObstacleId } : {}),
      ...(fromPart ? { fromExit: pinExit(wire.from, from) } : {}), ...(toPart ? { toExit: pinExit(wire.to, to) } : {}),
    }]
  })
  const pitch = 1.27
  const phase = (value: number) => value - Math.round(value / pitch) * pitch
  if (!plan.grid) return makeGate('G6', 'fail', ['Thiếu lưới breadboard để neo pha định tuyến.'])
  const phaseX = phase(plan.grid.originX + plan.grid.firstColumnX)
  const phaseY = phase(plan.grid.originZ + plan.grid.rows[0])
  const toRouterPoint = (point: RouterWire['from']): [number, number] => [point[0] - phaseX, point[1] - phaseY]
  const translatedWires = routerWires.map(wire => ({ ...wire, from: toRouterPoint(wire.from), to: toRouterPoint(wire.to) }))
  const translatedObstacles = obstacles.map(obstacle => ({ ...obstacle, x: obstacle.x - phaseX, y: obstacle.y - phaseY }))
  const routed = routeWires(translatedWires, translatedObstacles)
  for (const error of routed.errors) issues.push(`Dây “${error.wireId}”: ${error.reason}`)
  for (const route of routed.routes) if (route.bends > 3) warnings.push(`Dây “${route.id}” có ${route.bends} góc rẽ; hơn 3 là cảnh báo theo R8.`)
  return makeGate('G6', issues.length ? 'fail' : warnings.length ? 'warning' : 'pass', [...issues, ...warnings])
}

function evaluateG7(doc: CircuitDocV2, nets: ReturnType<typeof createNetIndexV2>): CircuitGateResult {
  const issues: string[] = []
  const declaredOpen = new Map((doc.openPins ?? []).map(pin => [`${pin.partId}:${pin.pinId}`, pin.reason.trim()]))
  for (const part of doc.parts) {
    const definition = componentRegistry.find(item => item.id === part.type)
    for (const pin of definition?.pins ?? []) {
      const key = `${part.id}:${pin.id}`
      const net = nets.netOf(key)
      const hasElectricalPeer = Boolean(net && (net.wireIds.size > 0 || net.endpoints.size > 1))
      const openReason = declaredOpen.get(key)
      if (!hasElectricalPeer && !openReason) issues.push(`Chân “${key}” chưa có kết nối điện và thiếu lý do trong openPins.`)
      if (hasElectricalPeer && openReason) issues.push(`Chân “${key}” vừa được nối điện vừa khai báo hở trong openPins.`)
      if (!net && !openReason) issues.push(`Chân “${key}” không có net và không có khai báo openPins.`)
    }
  }
  return makeGate('G7', issues.length ? 'fail' : 'pass', issues)
}

function resistorBetweenNets(doc: CircuitDocV2, nets: ReturnType<typeof createNetIndexV2>, start: string, goal: string): boolean {
  const graph = new Map<string, Array<{ net: string; resistorId: string }>>()
  for (const part of doc.parts.filter(item => item.type === 'resistor')) {
    const a = nets.netOf(`${part.id}:a`)?.key
    const b = nets.netOf(`${part.id}:b`)?.key
    if (!a || !b || a === b) continue
    graph.set(a, [...(graph.get(a) ?? []), { net: b, resistorId: part.id }])
    graph.set(b, [...(graph.get(b) ?? []), { net: a, resistorId: part.id }])
  }
  const queue: Array<{ net: string; sawResistor: boolean }> = [{ net: start, sawResistor: false }]
  const visited = new Set<string>()
  while (queue.length) {
    const current = queue.shift()!
    const stateKey = `${current.net}:${current.sawResistor}`
    if (visited.has(stateKey)) continue
    visited.add(stateKey)
    if (current.net === goal && current.sawResistor) return true
    for (const edge of graph.get(current.net) ?? []) queue.push({ net: edge.net, sawResistor: true })
  }
  return false
}

function evaluateG8(doc: CircuitDocV2, nets: ReturnType<typeof createNetIndexV2>): CircuitGateResult {
  const errors: string[] = []
  const warnings: string[] = []
  const connected = (key: string) => {
    const net = nets.netOf(key)
    return Boolean(net && (net.wireIds.size > 0 || net.endpoints.size > 1))
  }
  const supplies = doc.parts.flatMap(part => {
    const definition = componentRegistry.find(item => item.id === part.type)
    return (definition?.pins ?? []).filter(pin => (pin.electricalType === 'power' && pin.polarity !== 'negative') || pin.electricalType === 'output')
      .filter(pin => connected(`${part.id}:${pin.id}`)).map(pin => `${part.id}:${pin.id}`)
  })
  const grounds = doc.parts.flatMap(part => {
    const definition = componentRegistry.find(item => item.id === part.type)
    return (definition?.pins ?? []).filter(pin => pin.electricalType === 'ground').filter(pin => connected(`${part.id}:${pin.id}`)).map(pin => `${part.id}:${pin.id}`)
  })
  if (!supplies.length) errors.push('Không có chân nguồn hoặc ngõ ra đang nối vào mạch.')
  if (!grounds.length) errors.push('Không có chân GND đang nối vào mạch.')
  for (const led of doc.parts.filter(part => part.type === 'led')) {
    const anode = nets.netOf(`${led.id}:anode`)?.key
    const hasLimiter = Boolean(anode && supplies.some(source => {
      const sourceNet = nets.netOf(source)?.key
      return sourceNet && resistorBetweenNets(doc, nets, sourceNet, anode)
    }))
    if (!hasLimiter) warnings.push(`LED “${led.id}” chưa chứng minh được điện trở nối tiếp từ nguồn/ngõ ra; cần kiểm tra đường dòng.`)
  }
  return makeGate('G8', errors.length ? 'fail' : warnings.length ? 'warning' : 'pass', [...errors, ...warnings])
}

function evaluateG9(doc: CircuitDocV2): CircuitGateResult {
  const analog = doc.lessonId.startsWith('analog-') || doc.parts.some(part => ['potentiometer','ldr','thermistor'].includes(part.type))
  if (!analog) return makeGate('G9', 'not_applicable', ['Bài này không khai báo mạch analog cần chuyển sang SPICE.'])
  const target = getSimulationTarget('esp32-devkit')
  try {
    const result = compileWorkspaceSpice({
      parts: doc.parts.map(part => ({
        id: part.id,
        type: part.type,
        ...(part.value?.ohm !== undefined ? { value: `${part.value.ohm}` } : part.value?.farad !== undefined ? { value: `${part.value.farad}` } : part.value?.label ? { value: part.value.label } : {}),
      })),
      connections: compileSpiceConnections(doc),
      boardLogicLevel: target.logicLevel,
      boardId: target.boardId,
    })
    return result.ok ? makeGate('G9', 'pass') : makeGate('G9', 'fail', result.issues)
  } catch (error) {
    return makeGate('G9', 'fail', [`Không biên dịch được topology sang workspaceSpice: ${String(error)}`])
  }
}

function evaluateG10(doc: CircuitDocV2): CircuitGateResult {
  const mountedParts = doc.parts.filter(part => part.mount.kind === 'breadboard')
  if (!mountedParts.length) return makeGate('G10', 'not_applicable', ['Không có part cắm breadboard để so tọa độ giữa các view.'])
  const issues: string[] = []
  const target = getSimulationTarget('esp32-devkit')
  const diagram = buildBreadboardDiagram(doc)
  const gridMm = getComponentMesh('breadboard')?.gridMm
  if (!gridMm) return makeGate('G10', 'fail', ['Thiếu gridMm để kiểm parity.'])
  let threeD: ReturnType<typeof getAssemblyPlanV2>
  try {
    threeD = getAssemblyPlanV2(doc, { boardId: target.boardId, target, lessonId: doc.lessonId as BuilderLessonId })
  } catch (error) {
    return makeGate('G10', 'fail', [`Không dựng được view 3D: ${String(error)}`])
  }
  for (const part of mountedParts) {
    const physical = threeD.placements.find(item => item.partId === part.id)
    const holes = footprintHoles(part)
    const geometry = resolvePartGeometry(part.type, doc.lessonId)
    const diagramPart = diagram.parts.find(item => item.id === part.id)
    if (!physical || !holes || !geometry || !threeD.grid || !diagramPart) {
      issues.push(`Thiếu vị trí/chân ở 2D hoặc 3D cho “${part.id}”.`)
      continue
    }
    for (const [index, leg] of geometry.legsMm.entries()) {
      const hole = holes[index]
      const localHole = hole && holeToMm(hole, gridMm)
      const holeId = hole && formatHole(hole)
      const marker = holeId && diagram.holes.find(item => item.id === holeId)
      const diagramPin = holeId && diagramPart.pins.find(item => item.pinId === leg.pinId && item.holeId === holeId)
      const mountedLeg = physical.legs?.[index]
      const physicalLeg = physical.legs?.[index]
      const expected3D = localHole && [threeD.grid.originX + localHole[0], threeD.grid.originZ + localHole[2]]
      const projectedLeg = physicalLeg && [
        physical.positionMm[0] + rotateXZ(leg.x, leg.z, physical.rotationDeg)[0],
        physical.positionMm[2] + rotateXZ(leg.x, leg.z, physical.rotationDeg)[1],
      ]
      const threeDPin = threeD.pinPoints[`${part.id}:${leg.pinId}`]
      if (!holeId || !marker || !diagramPin || !expected3D || !projectedLeg || !physicalLeg) {
        issues.push(`Không giải được lỗ/chân ${part.id}:${leg.pinId} ở cả hai view.`)
        continue
      }
      const markerError = Math.hypot(marker.x - diagramPin.x, marker.y - diagramPin.y)
      const isFirstSamePin = geometry.legsMm.findIndex(item => item.pinId === leg.pinId) === index
      const pinPointMismatch = isFirstSamePin && (Math.abs(threeDPin[0] - expected3D[0]) > EPSILON_MM || Math.abs(threeDPin[2] - expected3D[1]) > EPSILON_MM)
      const projectedMismatch = Math.abs(projectedLeg[0] - expected3D[0]) > EPSILON_MM || Math.abs(projectedLeg[1] - expected3D[1]) > EPSILON_MM
      if (markerError > EPSILON_MM || projectedMismatch || pinPointMismatch
        || physicalLeg.column !== mountedLeg?.column || physicalLeg.row !== mountedLeg?.row) {
        issues.push(`Lệch parity tọa độ tại ${part.id}:${leg.pinId}; 2D marker=${markerError.toExponential(2)} mm, chiếu chân 3D=${projectedMismatch ? `${(projectedLeg[0] - expected3D[0]).toFixed(6)},${(projectedLeg[1] - expected3D[1]).toFixed(6)} mm` : '≤1e-6 mm'}, pin 3D=${pinPointMismatch ? `${(threeDPin[0] - expected3D[0]).toFixed(6)},${(threeDPin[2] - expected3D[1]).toFixed(6)} mm` : '≤1e-6 mm'}.`)
      }
    }
  }
  return makeGate('G10', issues.length ? 'fail' : 'pass', issues)
}

/** Evaluates the ten SIM v2 circuit gates without changing the document. */
export function evaluateCircuitGates(value: unknown, options: { presentation?: BoardDiagramPresentation } = {}): CircuitGateReport {
  const doc = value as CircuitDocV2
  const lessonId = isRecord(value) && typeof value.lessonId === 'string' ? value.lessonId : '(không rõ bài)'
  const validation = validateCircuitDoc(value)
  const netIndex = createNetIndexV2(doc)
  const g1 = gateFromValidation('G1', validation)
  const netCount = netIndex.netsList().filter(net => net.endpoints.size > 1).length
  if (isRecord(value) && isRecord(value.expect) && value.expect.netCount !== netCount) {
    g1.status = 'fail'
    g1.diagnostics.push(`expect.netCount=${String(value.expect.netCount)} nhưng số net có ít nhất hai chân là ${netCount}.`)
  }
  const gates: CircuitGateResult[] = [
    g1,
    gateFromValidation('G2', validation),
    gateFromValidation('G3', validation),
    gateFromValidation('G4', validation),
  ]
  try { gates.push(evaluateG5(doc)) } catch (error) { gates.push(makeGate('G5','fail',[`Không tính được bố cục: ${String(error)}`])) }
  try { gates.push(evaluateG6(doc, options.presentation)) } catch (error) { gates.push(makeGate('G6','fail',[`Không kiểm được định tuyến: ${String(error)}`])) }
  try { gates.push(evaluateG7(doc, netIndex)) } catch (error) { gates.push(makeGate('G7','fail',[`Không kiểm được chân hở: ${String(error)}`])) }
  try { gates.push(evaluateG8(doc, netIndex)) } catch (error) { gates.push(makeGate('G8','fail',[`Không kiểm được nguồn/GND: ${String(error)}`])) }
  try { gates.push(evaluateG9(doc)) } catch (error) { gates.push(makeGate('G9','fail',[`Không kiểm được cầu SPICE: ${String(error)}`])) }
  try { gates.push(evaluateG10(doc)) } catch (error) { gates.push(makeGate('G10','fail',[`Không kiểm được parity: ${String(error)}`])) }
  return { lessonId, gates: GATE_IDS.map(id => gates.find(gate => gate.id === id) ?? makeGate(id, 'fail', ['Cổng chưa được đánh giá.'])) }
}

/** Evaluates a caller-supplied corpus and preserves one report for every input document. */
export function evaluateCircuitCorpus(docs: readonly unknown[]): CircuitGateReport[] {
  return docs.map(doc => evaluateCircuitGates(doc))
}
