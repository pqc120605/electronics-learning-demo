import type { BreadboardGrid } from '../data/componentModels'

export type GridHole = { kind: 'grid'; board: 'bb1'; column: number; row: string }
export type RailId = 'T+' | 'T-' | 'B+' | 'B-'
export type RailHole = { kind: 'rail'; board: 'bb1'; rail: RailId; hole: number }
export type BreadboardHole = GridHole | RailHole
export type HolePointMm = [number, number, number]

export type BreadboardElectricalSpec = {
  columns: number
  rows: number
  railHoles: 25
  railGroup: 5
  source: 'assumption-400-tie'
}

/**
 * Electrical topology is kept separate from the visual mesh. Rail count and
 * layout are assumptions for a 400 tie-point board; no mesh inspection has
 * verified the rail holes yet.
 */
export const BREADBOARD_ELECTRICAL_SPEC: BreadboardElectricalSpec = {
  columns: 30,
  rows: 10,
  railHoles: 25,
  railGroup: 5,
  source: 'assumption-400-tie',
}

export const railVerified = false as const
export const RAIL_IDS: readonly RailId[] = ['T+', 'T-', 'B+', 'B-']
const ROWS = 'abcdefghij'
const DEFAULT_RAIL_GRID = { pitch: 2.54, firstColumnX: -36.83, columns: 30 }
const RAIL_Z_INDEX: Record<RailId, number> = { 'T+': 0, 'T-': 1, 'B+': 2, 'B-': 3 }

function isRailId(value: unknown): value is RailId {
  return typeof value === 'string' && (RAIL_IDS as readonly string[]).includes(value)
}

function validGrid(grid: BreadboardGrid): boolean {
  return Boolean(grid)
    && Number.isFinite(grid.pitch) && grid.pitch > 0
    && Number.isInteger(grid.columns) && grid.columns > 0
    && Number.isFinite(grid.topY)
    && Number.isFinite(grid.firstColumnX)
    && Array.isArray(grid.rows) && grid.rows.length === BREADBOARD_ELECTRICAL_SPEC.rows
    && grid.rows.every(Number.isFinite)
    && Array.isArray(grid.rails) && grid.rails.length === RAIL_IDS.length
    && grid.rails.every(Number.isFinite)
}

function normalizeHole(value: unknown): BreadboardHole | null {
  if (!value || typeof value !== 'object') return null
  const hole = value as Record<string, unknown>
  if (hole.board !== 'bb1') return null
  if (hole.kind === 'grid'
    && Number.isInteger(hole.column) && Number(hole.column) >= 1 && Number(hole.column) <= BREADBOARD_ELECTRICAL_SPEC.columns
    && typeof hole.row === 'string' && hole.row.length === 1 && ROWS.includes(hole.row)) {
    return { kind: 'grid', board: 'bb1', column: Number(hole.column), row: hole.row }
  }
  if (hole.kind === 'rail'
    && isRailId(hole.rail)
    && Number.isInteger(hole.hole) && Number(hole.hole) >= 1 && Number(hole.hole) <= BREADBOARD_ELECTRICAL_SPEC.railHoles) {
    return { kind: 'rail', board: 'bb1', rail: hole.rail, hole: Number(hole.hole) }
  }
  return null
}

export function parseHole(id: unknown): BreadboardHole | null {
  if (typeof id !== 'string') return null
  const grid = /^bb1:(\d{1,2})([a-j])$/.exec(id)
  if (grid) {
    const column = Number(grid[1])
    return String(column) === grid[1] && column >= 1 && column <= BREADBOARD_ELECTRICAL_SPEC.columns
      ? { kind: 'grid', board: 'bb1', column, row: grid[2] }
      : null
  }
  const rail = /^bb1:(T\+|T-|B\+|B-):(\d{1,2})$/.exec(id)
  if (!rail || !isRailId(rail[1])) return null
  const hole = Number(rail[2])
  return String(hole) === rail[2] && hole >= 1 && hole <= BREADBOARD_ELECTRICAL_SPEC.railHoles
    ? { kind: 'rail', board: 'bb1', rail: rail[1], hole }
    : null
}

export function formatHole(value: unknown): string | null {
  const hole = normalizeHole(value)
  if (!hole) return null
  return hole.kind === 'grid'
    ? `bb1:${hole.column}${hole.row}`
    : `bb1:${hole.rail}:${hole.hole}`
}

/** Map a 1..25 rail hole onto 25 equally spaced x positions centered on the 30-column grid. railGroup is metadata only; this model has no gap between groups. */
export function railX(index: number, grid: Pick<BreadboardGrid, 'pitch' | 'firstColumnX' | 'columns'> = DEFAULT_RAIL_GRID): number | null {
  if (!Number.isInteger(index) || index < 1 || index > BREADBOARD_ELECTRICAL_SPEC.railHoles
    || !Number.isFinite(grid.pitch) || grid.pitch <= 0
    || !Number.isFinite(grid.firstColumnX) || !Number.isInteger(grid.columns) || grid.columns < BREADBOARD_ELECTRICAL_SPEC.railHoles) return null
  const railIndex = index - 1
  const centeredStartColumn = (grid.columns - BREADBOARD_ELECTRICAL_SPEC.railHoles) / 2
  return grid.firstColumnX + (centeredStartColumn + railIndex) * grid.pitch
}

export function holeToMm(value: unknown, gridMm: BreadboardGrid): HolePointMm | null {
  const hole = normalizeHole(value)
  if (!hole || !validGrid(gridMm)) return null
  if (hole.kind === 'grid') {
    const columnIndex = hole.column - 1
    const rowIndex = ROWS.indexOf(hole.row)
    if (columnIndex >= gridMm.columns || rowIndex < 0) return null
    return [gridMm.firstColumnX + columnIndex * gridMm.pitch, gridMm.topY, gridMm.rows[rowIndex]]
  }
  const railIndex = RAIL_Z_INDEX[hole.rail]
  const x = railX(hole.hole, gridMm)
  const z = gridMm.rails[railIndex]
  return x === null || !Number.isFinite(z) ? null : [x, gridMm.topY, z]
}

export function holeNet(value: unknown, opts: { railSplit?: boolean } = {}): string | null {
  const hole = typeof value === 'string' ? parseHole(value) : normalizeHole(value)
  if (!hole) return null
  if (hole.kind === 'grid') {
    const rowIndex = ROWS.indexOf(hole.row)
    const half = rowIndex < 5 ? 'upper' : 'lower'
    return `bb1:strip:${hole.column}:${half}`
  }
  if (opts.railSplit) {
    const half = hole.hole <= Math.floor(BREADBOARD_ELECTRICAL_SPEC.railHoles / 2) ? 'left' : 'right'
    return `bb1:rail:${hole.rail}:${half}`
  }
  return `bb1:rail:${hole.rail}`
}

export function stripHoles(value: unknown): BreadboardHole[] {
  const hole = typeof value === 'string' ? parseHole(value) : normalizeHole(value)
  if (!hole) return []
  if (hole.kind === 'rail') return railHoles(hole.rail) ?? []
  const rowIndex = ROWS.indexOf(hole.row)
  const start = rowIndex < 5 ? 0 : 5
  return Array.from({ length: 5 }, (_, index) => ({ kind: 'grid', board: 'bb1', column: hole.column, row: ROWS[start + index] }))
}

export function railHoles(railId: unknown): RailHole[] | null {
  if (!isRailId(railId)) return null
  return Array.from({ length: BREADBOARD_ELECTRICAL_SPEC.railHoles }, (_, index) => ({ kind: 'rail', board: 'bb1', rail: railId, hole: index + 1 }))
}

/** Return the nearest logical hole in x/z; ties preserve central-grid, then rail order. */
export function snapNearest(pointMm: unknown, gridMm: BreadboardGrid): BreadboardHole | null {
  if (!Array.isArray(pointMm) || pointMm.length !== 3 || !pointMm.every(Number.isFinite) || !validGrid(gridMm)) return null
  let best: BreadboardHole | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  const consider = (hole: BreadboardHole) => {
    const point = holeToMm(hole, gridMm)
    if (!point) return
    const distance = (point[0] - pointMm[0]) ** 2 + (point[2] - pointMm[2]) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = hole
    }
  }
  for (let column = 1; column <= BREADBOARD_ELECTRICAL_SPEC.columns; column++) {
    for (const row of ROWS) consider({ kind: 'grid', board: 'bb1', column, row })
  }
  for (const rail of RAIL_IDS) for (let hole = 1; hole <= BREADBOARD_ELECTRICAL_SPEC.railHoles; hole++) consider({ kind: 'rail', board: 'bb1', rail, hole })
  return best
}
