import type { BreadboardGrid } from '../data/componentModels'
import { getR2cBreadboard, LEGACY_BREADBOARD, type BreadboardSpec } from '../data/catalogR2cBoards'

export type GridHole = { kind: 'grid'; board: 'bb1'; column: number; row: string }
export type RailId = 'T+' | 'T-' | 'B+' | 'B-'
export type RailHole = { kind: 'rail'; board: 'bb1'; rail: RailId; hole: number }
export type BreadboardHole = GridHole | RailHole
export type HolePointMm = [number, number, number]

/** The legacy 400-point profile retains its original geometry and optional rail split. */
export const BREADBOARD_ELECTRICAL_SPEC = {
  columns: 30,
  rows: 10,
  railHoles: 25,
  railGroup: 5,
  source: 'assumption-400-tie',
} as const
export type BreadboardElectricalSpec = typeof BREADBOARD_ELECTRICAL_SPEC

export const railVerified = false as const
export const RAIL_IDS: readonly RailId[] = ['T+', 'T-', 'B+', 'B-']
const ROWS = 'abcdefghij'
const DEFAULT_RAIL_GRID = { pitch: 2.54, firstColumnX: -36.83, columns: 30 }
const RAIL_Z_INDEX: Record<RailId, number> = { 'T+': 0, 'T-': 1, 'B+': 2, 'B-': 3 }

export function breadboardCounts(spec: BreadboardSpec = LEGACY_BREADBOARD) {
  const board = getR2cBreadboard(spec)
  return board ? { columns: board.grid.columns, railHoles: board.railHoles } : BREADBOARD_ELECTRICAL_SPEC
}

export function breadboardRowsInView(spec: BreadboardSpec = LEGACY_BREADBOARD): string {
  return spec === LEGACY_BREADBOARD ? ROWS : 'jihgfedcba'
}

function isRailId(value: unknown): value is RailId {
  return typeof value === 'string' && (RAIL_IDS as readonly string[]).includes(value)
}

function validGrid(grid: BreadboardGrid): boolean {
  return Boolean(grid)
    && Number.isFinite(grid.pitch) && grid.pitch > 0
    && Number.isInteger(grid.columns) && grid.columns > 0
    && Number.isFinite(grid.topY)
    && Number.isFinite(grid.firstColumnX)
    && Array.isArray(grid.rows) && grid.rows.length === ROWS.length
    && grid.rows.every(Number.isFinite)
    && Array.isArray(grid.rails) && grid.rails.length === (breadboardCounts(grid.spec).railHoles ? RAIL_IDS.length : 0)
    && grid.rails.every(Number.isFinite)
}

function normalizeHole(value: unknown, spec: BreadboardSpec): BreadboardHole | null {
  if (!value || typeof value !== 'object') return null
  const hole = value as Record<string, unknown>
  if (hole.board !== 'bb1') return null
  const counts = breadboardCounts(spec)
  if (hole.kind === 'grid'
    && Number.isInteger(hole.column) && Number(hole.column) >= 1 && Number(hole.column) <= counts.columns
    && typeof hole.row === 'string' && hole.row.length === 1 && ROWS.includes(hole.row)) {
    return { kind: 'grid', board: 'bb1', column: Number(hole.column), row: hole.row }
  }
  if (hole.kind === 'rail'
    && isRailId(hole.rail)
    && Number.isInteger(hole.hole) && Number(hole.hole) >= 1 && Number(hole.hole) <= counts.railHoles) {
    return { kind: 'rail', board: 'bb1', rail: hole.rail, hole: Number(hole.hole) }
  }
  return null
}

export function parseHole(id: unknown, spec: BreadboardSpec = LEGACY_BREADBOARD): BreadboardHole | null {
  if (typeof id !== 'string') return null
  const grid = /^bb1:([1-9]\d?)([a-j])$/.exec(id)
  if (grid) return normalizeHole({ kind: 'grid', board: 'bb1', column: Number(grid[1]), row: grid[2] }, spec)
  const rail = /^bb1:(T\+|T-|B\+|B-):([1-9]\d?)$/.exec(id)
  return rail ? normalizeHole({ kind: 'rail', board: 'bb1', rail: rail[1], hole: Number(rail[2]) }, spec) : null
}

export function formatHole(value: unknown, spec: BreadboardSpec = LEGACY_BREADBOARD): string | null {
  const hole = normalizeHole(value, spec)
  if (!hole) return null
  return hole.kind === 'grid'
    ? 'bb1:' + hole.column + hole.row
    : 'bb1:' + hole.rail + ':' + hole.hole
}

export function railX(index: number, grid: Pick<BreadboardGrid, 'pitch' | 'firstColumnX' | 'columns' | 'spec'> = DEFAULT_RAIL_GRID): number | null {
  const { railHoles } = breadboardCounts(grid.spec)
  if (!Number.isInteger(index) || index < 1 || index > railHoles
    || !Number.isFinite(grid.pitch) || grid.pitch <= 0
    || !Number.isFinite(grid.firstColumnX) || !Number.isInteger(grid.columns) || grid.columns < railHoles) return null
  const railIndex = index - 1
  const slot = grid.spec === 'adafruit-239-r2c-1'
    ? 2 + 6 * Math.floor(railIndex / 5) + railIndex % 5
    : (grid.columns - railHoles) / 2 + railIndex
  return grid.firstColumnX + slot * grid.pitch
}

export function holeToMm(value: unknown, grid: BreadboardGrid): HolePointMm | null {
  const spec = grid?.spec ?? LEGACY_BREADBOARD
  const hole = normalizeHole(value, spec)
  if (!hole || !validGrid(grid)) return null
  const x = hole.kind === 'grid' ? grid.firstColumnX + (hole.column - 1) * grid.pitch : railX(hole.hole, grid)
  const z = hole.kind === 'grid' ? grid.rows[ROWS.indexOf(hole.row)] : grid.rails[RAIL_Z_INDEX[hole.rail]]
  if (x === null || !Number.isFinite(z) || (hole.kind === 'grid' && hole.column > grid.columns)) return null
  return [spec === LEGACY_BREADBOARD ? x : Math.round(x * 100) / 100, grid.topY, z]
}

export function holeNet(value: unknown, opts: { spec?: BreadboardSpec; railSplit?: boolean } = {}): string | null {
  const spec = opts.spec ?? LEGACY_BREADBOARD
  const hole = typeof value === 'string' ? parseHole(value, spec) : normalizeHole(value, spec)
  if (!hole) return null
  if (hole.kind === 'grid') {
    const isUpper = breadboardRowsInView(spec).indexOf(hole.row) < 5
    return 'bb1:strip:' + hole.column + ':' + (isUpper ? 'upper' : 'lower')
  }
  if (spec === LEGACY_BREADBOARD && opts.railSplit) {
    const half = hole.hole <= Math.floor(BREADBOARD_ELECTRICAL_SPEC.railHoles / 2) ? 'left' : 'right'
    return 'bb1:rail:' + hole.rail + ':' + half
  }
  return 'bb1:rail:' + hole.rail
}

export function stripHoles(value: unknown, spec: BreadboardSpec = LEGACY_BREADBOARD): BreadboardHole[] {
  const hole = typeof value === 'string' ? parseHole(value, spec) : normalizeHole(value, spec)
  if (!hole) return []
  if (hole.kind === 'rail') return railHoles(hole.rail, spec) ?? []
  const start = ROWS.indexOf(hole.row) < 5 ? 0 : 5
  return Array.from({ length: 5 }, (_, index) => ({ kind: 'grid', board: 'bb1', column: hole.column, row: ROWS[start + index] }))
}

export function railHoles(railId: unknown, spec: BreadboardSpec = LEGACY_BREADBOARD): RailHole[] | null {
  const count = breadboardCounts(spec).railHoles
  if (!isRailId(railId) || !count) return null
  return Array.from({ length: count }, (_, index) => ({ kind: 'rail', board: 'bb1', rail: railId, hole: index + 1 }))
}

export function allBreadboardHoles(spec: BreadboardSpec = LEGACY_BREADBOARD): BreadboardHole[] {
  const holes: BreadboardHole[] = []
  for (let column = 1; column <= breadboardCounts(spec).columns; column++) {
    for (const row of ROWS) holes.push({ kind: 'grid', board: 'bb1', column, row })
  }
  for (const rail of RAIL_IDS) holes.push(...(railHoles(rail, spec) ?? []))
  return holes
}

/** Return the nearest logical hole in x/z; ties preserve central-grid, then rail order. */
export function snapNearest(pointMm: unknown, grid: BreadboardGrid): BreadboardHole | null {
  if (!Array.isArray(pointMm) || pointMm.length !== 3 || !pointMm.every(Number.isFinite) || !validGrid(grid)) return null
  let best: BreadboardHole | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const hole of allBreadboardHoles(grid.spec)) {
    const point = holeToMm(hole, grid)
    if (!point) continue
    const distance = (point[0] - pointMm[0]) ** 2 + (point[2] - pointMm[2]) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = hole
    }
  }
  return best
}
