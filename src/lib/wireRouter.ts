export type RouterPoint = readonly [x: number, y: number]
export type RouterObstacle = { id: string; x: number; y: number; width: number; height: number }
export type RouterWire = { id: string; from: RouterPoint; to: RouterPoint; fromExit?: 'N' | 'E' | 'S' | 'W'; toExit?: 'N' | 'E' | 'S' | 'W'; fromObstacleId?: string; toObstacleId?: string; role?: 'power' | 'ground' | 'signal' }
export type RoutedWire = { id: string; points: RouterPoint[]; bends: number; warning?: string }
export type WireRouteResult = { routes: RoutedWire[]; errors: Array<{ wireId: string; reason: string }>; elapsedMs: number }
export type WireRouterOptions = { pitchMm?: number; clearanceMm?: number; maxExpandedNodes?: number }

type Direction = 0 | 1 | 2 | 3
type Cell = { x: number; y: number; direction: Direction | -1; g: number; f: number; parent?: string }
type OccupiedEdges = { all: Set<string>; horizontal: Set<string>; vertical: Set<string> }
const DIRECTIONS: ReadonlyArray<{ name: 'N' | 'E' | 'S' | 'W'; dx: number; dy: number }> = [
  { name: 'N', dx: 0, dy: -1 }, { name: 'E', dx: 1, dy: 0 }, { name: 'S', dx: 0, dy: 1 }, { name: 'W', dx: -1, dy: 0 },
]
const keyOf = (x: number, y: number, direction: number) => `${x},${y},${direction}`
const compare = (a: Cell, b: Cell) => a.f - b.f || b.g - a.g || a.direction - b.direction || a.y - b.y || a.x - b.x
const manhattan = (x: number, y: number, goalX: number, goalY: number) => Math.abs(goalX - x) + Math.abs(goalY - y)
const samePoint = (a: RouterPoint, b: RouterPoint) => Math.abs(a[0] - b[0]) < 1e-8 && Math.abs(a[1] - b[1]) < 1e-8

function heapPush(heap: Cell[], value: Cell): void {
  let index = heap.push(value) - 1
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    if (compare(heap[parent], value) <= 0) break
    heap[index] = heap[parent]
    index = parent
  }
  heap[index] = value
}

function heapPop(heap: Cell[]): Cell | undefined {
  const first = heap[0]
  const last = heap.pop()
  if (!first || !last || heap.length === 0) return first
  let index = 0
  while (true) {
    const left = index * 2 + 1, right = left + 1
    if (left >= heap.length) break
    const child = right < heap.length && compare(heap[right], heap[left]) < 0 ? right : left
    if (compare(last, heap[child]) <= 0) break
    heap[index] = heap[child]
    index = child
  }
  heap[index] = last
  return first
}

function inside(point: RouterPoint, obstacle: RouterObstacle, padding: number): boolean {
  return point[0] >= obstacle.x - padding && point[0] <= obstacle.x + obstacle.width + padding
    && point[1] >= obstacle.y - padding && point[1] <= obstacle.y + obstacle.height + padding
}

function blocked(x: number, y: number, pitch: number, obstacles: readonly RouterObstacle[], padding: number): boolean {
  const point: RouterPoint = [x * pitch, y * pitch]
  return obstacles.some(obstacle => inside(point, obstacle, padding))
}

const hKey = (x: number, y: number) => `h:${x}:${y}`
const vKey = (x: number, y: number) => `v:${x}:${y}`

function edgeCost(x: number, y: number, dx: number, dy: number, occupied: OccupiedEdges): number | null {
  if (dx !== 0) {
    const key = hKey(Math.min(x, x + dx), y)
    if (occupied.all.has(key)) return null
    const crossings = [x, x + dx].reduce((count, px) => count + (occupied.vertical.has(vKey(px, y - 1)) || occupied.vertical.has(vKey(px, y)) ? 1 : 0), 0)
    return 1 + crossings * 5
  }
  const key = vKey(x, Math.min(y, y + dy))
  if (occupied.all.has(key)) return null
  const crossings = [y, y + dy].reduce((count, py) => count + (occupied.horizontal.has(hKey(x - 1, py)) || occupied.horizontal.has(hKey(x, py)) ? 1 : 0), 0)
  return 1 + crossings * 5
}

function addOccupiedSegment(occupied: OccupiedEdges, a: RouterPoint, b: RouterPoint, pitch: number): void {
  const ax = Math.round(a[0] / pitch), ay = Math.round(a[1] / pitch)
  const bx = Math.round(b[0] / pitch), by = Math.round(b[1] / pitch)
  const dx = Math.sign(bx - ax), dy = Math.sign(by - ay)
  const length = Math.abs(bx - ax) + Math.abs(by - ay)
  for (let index = 0; index < length; index += 1) {
    const x = ax + dx * index, y = ay + dy * index
    const key = dx ? hKey(Math.min(x, x + dx), y) : vKey(x, Math.min(y, y + dy))
    occupied.all.add(key)
    if (dx) occupied.horizontal.add(key)
    else occupied.vertical.add(key)
  }
}

function leadOverlaps(point: RouterPoint, exit: { cell: [number, number] }, occupied: OccupiedEdges, pitch: number): boolean {
  const startX = Math.round(point[0] / pitch), startY = Math.round(point[1] / pitch)
  const dx = Math.sign(exit.cell[0] - startX), dy = Math.sign(exit.cell[1] - startY)
  const length = Math.abs(exit.cell[0] - startX) + Math.abs(exit.cell[1] - startY)
  for (let index = 0; index < length; index += 1) {
    const x = startX + dx * index, y = startY + dy * index
    const key = dx ? hKey(Math.min(x, x + dx), y) : vKey(x, Math.min(y, y + dy))
    if (occupied.all.has(key)) return true
  }
  return false
}

function simplify(points: RouterPoint[]): RouterPoint[] {
  const output: RouterPoint[] = []
  for (const point of points) {
    const last = output.at(-1)
    if (last && samePoint(last, point)) continue
    const before = output.at(-2)
    if (before && last && (Math.abs(before[0] - last[0]) < 1e-8 && Math.abs(last[0] - point[0]) < 1e-8
      || Math.abs(before[1] - last[1]) < 1e-8 && Math.abs(last[1] - point[1]) < 1e-8)) output.pop()
    output.push(point)
  }
  return output
}

function bendsOf(points: readonly RouterPoint[]): number {
  let bends = 0
  for (let index = 2; index < points.length; index += 1) {
    const a = points[index - 2], b = points[index - 1], c = points[index]
    if (Math.abs(a[0] - b[0]) > 1e-8 && Math.abs(b[0] - c[0]) > 1e-8
      || Math.abs(a[1] - b[1]) > 1e-8 && Math.abs(b[1] - c[1]) > 1e-8) bends += 1
  }
  return bends
}

function exitCell(point: RouterPoint, preferred: RouterWire['fromExit'], obstacleId: string | undefined, obstacles: readonly RouterObstacle[], padding: number, pitch = 1.27): { cell: [number, number]; lead: RouterPoint } | null {
  const x = Math.round(point[0] / pitch), y = Math.round(point[1] / pitch)
  const selected = preferred ? DIRECTIONS.findIndex(direction => direction.name === preferred) : -1
  const order = selected >= 0 ? [selected] : [0, 1, 2, 3]
  for (const index of order) {
    const direction = DIRECTIONS[index as Direction]
    for (let step = 1; step <= 32; step += 1) {
      const cell: [number, number] = [x + direction.dx * step, y + direction.dy * step]
      const position: RouterPoint = [cell[0] * pitch, cell[1] * pitch]
      const obstructions = obstacles.filter(obstacle => inside(position, obstacle, padding))
      if (obstructions.length === 0) return { cell, lead: position }
      if (!obstacleId || obstructions.some(obstacle => obstacle.id !== obstacleId)) break
    }
  }
  return null
}

function findPath(start: [number, number], goal: [number, number], pitch: number, obstacles: readonly RouterObstacle[], padding: number, occupied: OccupiedEdges, maxExpanded: number): RouterPoint[] | null {
  const endpointBounds = { minX: Math.min(start[0], goal[0]), maxX: Math.max(start[0], goal[0]), minY: Math.min(start[1], goal[1]), maxY: Math.max(start[1], goal[1]) }
  const nearby = obstacles.filter(obstacle => obstacle.x / pitch <= endpointBounds.maxX + 4 && (obstacle.x + obstacle.width) / pitch >= endpointBounds.minX - 4
    && obstacle.y / pitch <= endpointBounds.maxY + 4 && (obstacle.y + obstacle.height) / pitch >= endpointBounds.minY - 4)
  const minX = Math.floor(Math.min(endpointBounds.minX, ...nearby.map(item => item.x / pitch))) - 2
  const maxX = Math.ceil(Math.max(endpointBounds.maxX, ...nearby.map(item => (item.x + item.width) / pitch))) + 2
  const minY = Math.floor(Math.min(endpointBounds.minY, ...nearby.map(item => item.y / pitch))) - 2
  const maxY = Math.ceil(Math.max(endpointBounds.maxY, ...nearby.map(item => (item.y + item.height) / pitch))) + 2
  const open: Cell[] = [{ x: start[0], y: start[1], direction: -1, g: 0, f: manhattan(start[0], start[1], goal[0], goal[1]) }]
  const best = new Map<string, number>([[keyOf(start[0], start[1], -1), 0]])
  const parents = new Map<string, string>()
  let expanded = 0
  while (open.length && expanded < maxExpanded) {
    const current = heapPop(open)!
    const currentKey = keyOf(current.x, current.y, current.direction)
    if (current.g !== best.get(currentKey)) continue
    expanded += 1
    if (current.x === goal[0] && current.y === goal[1]) {
      const cells: RouterPoint[] = []
      let key = currentKey
      while (true) {
        const [x, y] = key.split(',').map(Number)
        cells.push([x * pitch, y * pitch])
        const parent = parents.get(key)
        if (!parent) break
        key = parent
      }
      return cells.reverse()
    }
    for (const [direction, vector] of DIRECTIONS.entries()) {
      const x = current.x + vector.dx, y = current.y + vector.dy
      if (x < minX || x > maxX || y < minY || y > maxY) continue
      if (blocked(x, y, pitch, obstacles, padding) && (x !== goal[0] || y !== goal[1])) continue
      const edge = edgeCost(current.x, current.y, vector.dx, vector.dy, occupied)
      if (edge === null) continue
      const turnCost = current.direction >= 0 && current.direction !== direction ? 3 : 0
      const g = current.g + edge + turnCost
      const key = keyOf(x, y, direction)
      if (g >= (best.get(key) ?? Infinity)) continue
      best.set(key, g)
      parents.set(key, currentKey)
      const next = { x, y, direction: direction as Direction, g, f: g + manhattan(x, y, goal[0], goal[1]) }
      heapPush(open, next)
    }
  }
  return null
}

/** A* orthogonal router. A failed wire is returned as an error; it is never drawn as a guessed straight line. */
export function routeWires(wires: readonly RouterWire[], obstacles: readonly RouterObstacle[] = [], options: WireRouterOptions = {}): WireRouteResult {
  const started = performance.now()
  const pitch = options.pitchMm ?? 1.27
  const padding = options.clearanceMm ?? 0
  const maxExpanded = options.maxExpandedNodes ?? 100_000
  if (!Number.isFinite(pitch) || pitch <= 0) return { routes: [], errors: wires.map(wire => ({ wireId: wire.id, reason: 'pitchMm phải lớn hơn 0.' })), elapsedMs: performance.now() - started }
  const errors: WireRouteResult['errors'] = []
  const routes: RoutedWire[] = []
  const occupied: OccupiedEdges = { all: new Set(), horizontal: new Set(), vertical: new Set() }
  for (const wire of [...wires].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
    const coordinates = [...wire.from, ...wire.to]
    if (!wire.id || coordinates.some(value => !Number.isFinite(value))) { errors.push({ wireId: wire.id, reason: 'Dây thiếu id hoặc tọa độ không hữu hạn.' }); continue }
    if (coordinates.some(value => Math.abs(value / pitch - Math.round(value / pitch)) > 1e-6)) { errors.push({ wireId: wire.id, reason: 'Endpoint không nằm trên lưới định tuyến.' }); continue }
    const from = exitCell(wire.from, wire.fromExit, wire.fromObstacleId, obstacles, padding, pitch)
    const to = exitCell(wire.to, wire.toExit, wire.toObstacleId, obstacles, padding, pitch)
    if (!from || !to) { errors.push({ wireId: wire.id, reason: 'Không thoát được khỏi footprint theo một đoạn vuông góc.' }); continue }
    if (leadOverlaps(wire.from, from, occupied, pitch) || leadOverlaps(wire.to, to, occupied, pitch)) { errors.push({ wireId: wire.id, reason: 'Đoạn thoát của dây sẽ chồng lên dây đã định tuyến.' }); continue }
    const routeOccupied: OccupiedEdges = { all: new Set(occupied.all), horizontal: new Set(occupied.horizontal), vertical: new Set(occupied.vertical) }
    addOccupiedSegment(routeOccupied, wire.from, from.lead, pitch)
    addOccupiedSegment(routeOccupied, wire.to, to.lead, pitch)
    const path = findPath(from.cell, to.cell, pitch, obstacles, padding, routeOccupied, maxExpanded)
    if (!path) { errors.push({ wireId: wire.id, reason: 'Không tìm thấy đường orthogonal tránh footprint và dây chồng.' }); continue }
    const points = simplify([wire.from, from.lead, ...path.slice(1, -1), to.lead, wire.to])
    const bends = bendsOf(points)
    routes.push({ id: wire.id, points, bends, ...(bends > 3 ? { warning: 'Dây có hơn 3 góc rẽ.' } : {}) })
    for (let index = 1; index < points.length; index += 1) addOccupiedSegment(occupied, points[index - 1], points[index], pitch)
  }
  return { routes, errors, elapsedMs: performance.now() - started }
}
