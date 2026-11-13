import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import { footprintHoles, resolvePartGeometry } from './mountResolve'
import { holeToMm, type GridHole } from './breadboardGrid'
import type { CircuitDocV2, CircuitPartV2 } from './circuitDocV2'

export type Layout2DPlacement = {
  partId: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  lane: 'board' | 'breadboard' | 'mounted' | 'left' | 'right' | 'bottom'
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}
export type Layout2DResult = { placements: Layout2DPlacement[]; bounds: { minX: number; minY: number; maxX: number; maxY: number }; unplaced: string[] }

const GAP_MM = 4
const CORE_BOARD_GAP_MM = 12
const SIZE_FALLBACK: readonly [number, number, number] = [8, 6, 4]
const centered = (x: number, y: number, width: number, height: number) => ({ minX: x - width / 2, minY: y - height / 2, maxX: x + width / 2, maxY: y + height / 2 })
const rotate = (x: number, y: number, degrees: number): [number, number] => {
  const angle = degrees * Math.PI / 180
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)]
}

function footprintSize(type: string): [number, number] {
  const mesh = getComponentMesh(type)
  const definition = componentRegistry.find(item => item.id === type)
  const size = mesh?.boundsMm
    ? [mesh.boundsMm.max[0] - mesh.boundsMm.min[0], mesh.boundsMm.max[2] - mesh.boundsMm.min[2]]
    : definition?.visual.dimensionsMm ? [definition.visual.dimensionsMm[0], definition.visual.dimensionsMm[2]] : [SIZE_FALLBACK[0], SIZE_FALLBACK[2]]
  return [Math.max(1, size[0]), Math.max(1, size[1])]
}

function entry(part: CircuitPartV2, x: number, y: number, lane: Layout2DPlacement['lane'], rotation = 0): Layout2DPlacement {
  const [rawWidth, rawHeight] = footprintSize(part.type)
  const turned = Math.abs(rotation % 180) === 90
  const width = turned ? rawHeight : rawWidth
  const height = turned ? rawWidth : rawHeight
  return { partId: part.id, type: part.type, x, y, width, height, rotation, lane, bounds: centered(x, y, width, height) }
}

function anchorHole(part: CircuitPartV2): GridHole | null {
  if (part.mount.kind !== 'breadboard') return null
  return { kind: 'grid', board: 'bb1', column: part.mount.col, row: 'abcdefghij'[part.mount.row] as GridHole extends { kind: 'grid'; row: infer R } ? R : never }
}

/** Deterministic top-view layout in millimetres; electrical identities remain partId/pinId. */
export function layout2D(doc: CircuitDocV2): Layout2DResult {
  const placements: Layout2DPlacement[] = []
  const unplaced: string[] = []
  const boardPart = doc.parts.find(part => part.type === 'board')
  const breadboardPart = doc.parts.find(part => part.type === 'breadboard')
  const breadboardSize = footprintSize('breadboard')
  const boardSize = boardPart ? footprintSize('board') : [0, 0]
  const centerGroupWidth = boardPart ? boardSize[0] + CORE_BOARD_GAP_MM + breadboardSize[0] : breadboardSize[0]
  const groupLeft = -centerGroupWidth / 2
  const boardCenterX = boardPart ? groupLeft + boardSize[0] / 2 : 0
  const breadboardCenterX = groupLeft + (boardPart ? boardSize[0] + CORE_BOARD_GAP_MM : 0) + breadboardSize[0] / 2

  if (boardPart) placements.push(entry(boardPart, boardCenterX, 0, 'board'))
  if (breadboardPart) placements.push(entry(breadboardPart, breadboardCenterX, 0, 'breadboard'))

  const breadMesh = getComponentMesh('breadboard')
  const grid = breadMesh?.gridMm
  for (const part of doc.parts.filter(part => part.mount.kind === 'breadboard')) {
    if (part.type === 'breadboard') continue
    const mount = part.mount
    if (mount.kind !== 'breadboard') continue
    const geometry = resolvePartGeometry(part.type, doc.lessonId)
    const lead = geometry?.legsMm[0]
    const anchor = anchorHole(part)
    const anchorMm = anchor && grid ? holeToMm(anchor, grid) : null
    const mesh = getComponentMesh(part.type)
    const localCenterX = mesh ? (mesh.boundsMm.min[0] + mesh.boundsMm.max[0]) / 2 : 0
    const localCenterY = mesh ? (mesh.boundsMm.min[2] + mesh.boundsMm.max[2]) / 2 : 0
    if (!anchorMm || !lead || !mesh) { unplaced.push(part.id); continue }
    const offset = rotate(localCenterX - lead.x, localCenterY - lead.z, mount.rotation)
    placements.push(entry(part, breadboardCenterX + anchorMm[0] + offset[0], anchorMm[1] + offset[1], 'mounted', mount.rotation))
    if (!footprintHoles(part)) unplaced.push(part.id)
  }

  const bench = doc.parts.filter(part => !placements.some(item => item.partId === part.id))
  const lanes = {
    left: bench.filter(part => part.mount.kind === 'bench' && part.mount.lane === 'left').sort((a, b) => a.mount.kind === 'bench' && b.mount.kind === 'bench' ? a.mount.order - b.mount.order || a.id.localeCompare(b.id) : a.id.localeCompare(b.id)),
    right: bench.filter(part => part.mount.kind === 'bench' && part.mount.lane === 'right').sort((a, b) => a.mount.kind === 'bench' && b.mount.kind === 'bench' ? a.mount.order - b.mount.order || a.id.localeCompare(b.id) : a.id.localeCompare(b.id)),
    bottom: bench.filter(part => part.mount.kind === 'bench' && part.mount.lane === 'bottom').sort((a, b) => a.mount.kind === 'bench' && b.mount.kind === 'bench' ? a.mount.order - b.mount.order || a.id.localeCompare(b.id) : a.id.localeCompare(b.id)),
  }
  const leftEdge = groupLeft - GAP_MM
  const rightEdge = -groupLeft + GAP_MM
  let leftY = 0, rightY = 0
  for (const part of lanes.left) {
    const [width, height] = footprintSize(part.type)
    leftY += height / 2
    placements.push(entry(part, leftEdge - width / 2, leftY, 'left'))
    leftY += height / 2 + GAP_MM
  }
  for (const part of lanes.right) {
    const [width, height] = footprintSize(part.type)
    rightY += height / 2
    placements.push(entry(part, rightEdge + width / 2, rightY, 'right'))
    rightY += height / 2 + GAP_MM
  }
  const bottomY = Math.max(breadboardSize[1], boardSize[1]) / 2 + GAP_MM
  let bottomX = groupLeft
  for (const part of lanes.bottom) {
    const [width, height] = footprintSize(part.type)
    bottomX += width / 2
    placements.push(entry(part, bottomX, bottomY + height / 2, 'bottom'))
    bottomX += width / 2 + GAP_MM
  }

  const allBounds = placements.map(item => item.bounds)
  const bounds = allBounds.length
    ? { minX: Math.min(...allBounds.map(item => item.minX)), minY: Math.min(...allBounds.map(item => item.minY)), maxX: Math.max(...allBounds.map(item => item.maxX)), maxY: Math.max(...allBounds.map(item => item.maxY)) }
    : { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { placements, bounds, unplaced }
}
