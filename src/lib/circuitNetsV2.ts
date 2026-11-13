import { componentRegistry } from '../data/componentRegistry'
import { getComponentMesh } from '../data/componentModels'
import { footprintHoles, resolvePartGeometry, type CircuitRegistryEntry } from './mountResolve'
import { formatHole, holeNet, parseHole, RAIL_IDS, snapNearest, type BreadboardHole } from './breadboardGrid'
import type { CircuitDocV2, CircuitEndpointV2 } from './circuitDocV2'

export type CircuitNetV2 = {
  key: string
  /** Stable partId:pinId keys, compatible with the v1 net index. */
  endpoints: Set<string>
  /** Canonical breadboard hole IDs belonging to this electrical net. */
  holes: Set<string>
  wireIds: Set<string>
}

export type CircuitNetIndexV2 = {
  netOf: (key: string) => CircuitNetV2 | undefined
  netsList: () => CircuitNetV2[]
}

function endpointKey(endpoint: CircuitEndpointV2): string | null {
  if (endpoint.kind === 'pin') return `${endpoint.partId}:${endpoint.pinId}`
  const hole = parseHole(endpoint.holeId)
  return hole ? formatHole(hole) : null
}

function holeId(hole: BreadboardHole): string {
  return formatHole(hole) ?? ''
}

/** Builds deterministic electrical connectivity for a CircuitDocV2 without inferring voltage or current. */
export function createNetIndexV2(doc: CircuitDocV2, registry: readonly CircuitRegistryEntry[] = componentRegistry): CircuitNetIndexV2 {
  const parent = new Map<string, string>()
  const rank = new Map<string, number>()
  const holeKeys = new Set<string>()

  const add = (key: string) => {
    if (parent.has(key)) return
    parent.set(key, key)
    rank.set(key, 0)
  }
  const find = (key: string): string => {
    const current = parent.get(key)
    if (current === undefined) {
      add(key)
      return key
    }
    if (current !== key) parent.set(key, find(current))
    return parent.get(key) ?? key
  }
  const union = (left: string, right: string) => {
    if (!parent.has(left) || !parent.has(right)) return
    let rootLeft = find(left)
    let rootRight = find(right)
    if (rootLeft === rootRight) return
    const rankLeft = rank.get(rootLeft) ?? 0
    const rankRight = rank.get(rootRight) ?? 0
    if (rankLeft < rankRight) [rootLeft, rootRight] = [rootRight, rootLeft]
    parent.set(rootRight, rootLeft)
    if (rankLeft === rankRight) rank.set(rootLeft, rankLeft + 1)
  }

  const parts = Array.isArray(doc?.parts) ? doc.parts : []
  const wires = Array.isArray(doc?.wires) ? doc.wires : []
  const boards = Array.isArray(doc?.breadboards) ? doc.breadboards : []

  // Keep every declared pin in the index, including pins that intentionally remain open.
  for (const part of parts) {
    const definition = registry.find(item => item.id === part.type)
    for (const pin of definition?.pins ?? []) add(`${part.id}:${pin.id}`)
  }

  // Materialize the logical holes only when this document includes its breadboard.
  const breadboard = boards.find(board => board.id === 'bb1')
  if (breadboard) {
    const holes: BreadboardHole[] = []
    for (let column = 1; column <= 30; column++) {
      for (const row of 'abcdefghij') holes.push({ kind: 'grid', board: 'bb1', column, row })
    }
    for (const rail of RAIL_IDS) {
      for (let hole = 1; hole <= 25; hole++) holes.push({ kind: 'rail', board: 'bb1', rail, hole })
    }
    const byStrip = new Map<string, string>()
    for (const hole of holes) {
      const key = holeId(hole)
      const strip = holeNet(hole, { railSplit: breadboard.railSplit })
      add(key)
      holeKeys.add(key)
      if (strip) {
        const previous = byStrip.get(strip)
        if (previous) union(previous, key)
        else byStrip.set(strip, key)
      }
    }
  }

  // Explicit wires join pin or hole endpoints. Invalid hole strings are left for G4 to report.
  for (const wire of wires) {
    const from = endpointKey(wire.from)
    const to = endpointKey(wire.to)
    if (!from || !to) continue
    add(from)
    add(to)
    union(from, to)
  }

  // Component legs join their stable pin IDs to the physical holes they occupy.
  for (const part of parts) {
    const geometry = resolvePartGeometry(part.type, doc.lessonId, registry)
    const legs = geometry?.legsMm ?? []
    const holes = footprintHoles(part, registry) ?? []
    for (const [index, hole] of holes.entries()) {
      const pinId = legs[index]?.pinId
      const key = holeId(hole)
      if (!pinId || !key || !parent.has(key)) continue
      const pinKey = `${part.id}:${pinId}`
      add(pinKey)
      union(pinKey, key)
    }

    // Breadboard catalog pins are aliases for their represented rail/strip positions.
    if (part.type === 'breadboard' && breadboard) {
      const grid = getComponentMesh('breadboard')?.gridMm
      for (const [pinId, point] of Object.entries(geometry?.pinsMm ?? {})) {
        if (!grid) continue
        const hole = snapNearest(point, grid)
        const key = hole && holeId(hole)
        if (!key || !parent.has(key)) continue
        const pinKey = `${part.id}:${pinId}`
        add(pinKey)
        union(pinKey, key)
      }
    }
  }

  // Multiple GND aliases on one controller board describe its same internal ground plane.
  for (const part of parts.filter(item => item.type === 'board')) {
    const grounds = (registry.find(item => item.id === part.type)?.pins ?? [])
      .filter(pin => pin.electricalType === 'ground')
      .map(pin => `${part.id}:${pin.id}`)
    for (const key of grounds.slice(1)) union(grounds[0], key)
  }

  const netByRoot = new Map<string, CircuitNetV2>()
  const netByKey = new Map<string, CircuitNetV2>()
  for (const key of parent.keys()) {
    const root = find(key)
    let net = netByRoot.get(root)
    if (!net) {
      net = { key, endpoints: new Set(), holes: new Set(), wireIds: new Set() }
      netByRoot.set(root, net)
    }
    if (holeKeys.has(key)) net.holes.add(key)
    else net.endpoints.add(key)
    net.key = [...net.endpoints, ...net.holes].sort((left, right) => left.localeCompare(right, 'en'))[0] ?? key
    netByKey.set(key, net)
  }

  for (const wire of wires) {
    const from = endpointKey(wire.from)
    const to = endpointKey(wire.to)
    const net = (from ? netByKey.get(from) : undefined) ?? (to ? netByKey.get(to) : undefined)
    net?.wireIds.add(wire.id)
  }

  return {
    netOf: key => {
      const hole = parseHole(key)
      return netByKey.get(hole ? (formatHole(hole) ?? key) : key)
    },
    netsList: () => [...new Set(netByRoot.values())]
      .sort((left, right) => left.key.localeCompare(right.key, 'en')),
  }
}
