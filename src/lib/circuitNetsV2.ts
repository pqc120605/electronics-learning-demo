import { componentRegistry } from '../data/componentRegistry'
import { getBreadboardGrid } from '../data/componentModels'
import { footprintHoles, resolvePartGeometry, type CircuitRegistryEntry } from './mountResolve'
import { isBreadboardSpec, LEGACY_BREADBOARD } from '../data/catalogR2cBoards'
import { allBreadboardHoles, formatHole, holeNet, parseHole, snapNearest } from './breadboardGrid'
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
  const breadboard = boards.find(board => board?.id === 'bb1' && isBreadboardSpec(board.spec))
  const spec = breadboard?.spec ?? LEGACY_BREADBOARD
  const endpointKey = (endpoint: CircuitEndpointV2): string | null => endpoint.kind === 'pin'
    ? endpoint.partId + ':' + endpoint.pinId
    : holeKeys.has(endpoint.holeId) ? endpoint.holeId : null
  if (breadboard) {
    const holes = allBreadboardHoles(spec)
    const byStrip = new Map<string, string>()
    for (const hole of holes) {
      const key = formatHole(hole, spec)!
      const strip = holeNet(hole, breadboard)
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
    const holes = footprintHoles(part, registry, spec) ?? []
    for (const [index, hole] of holes.entries()) {
      const pinId = legs[index]?.pinId
      const key = formatHole(hole, spec)!
      if (!pinId || !key || !parent.has(key)) continue
      const pinKey = `${part.id}:${pinId}`
      add(pinKey)
      union(pinKey, key)
    }

    // Breadboard catalog pins are aliases for their represented rail/strip positions.
    if (part.type === 'breadboard' && breadboard && spec === LEGACY_BREADBOARD) {
      const grid = getBreadboardGrid(spec)
      for (const [pinId, point] of Object.entries(geometry?.pinsMm ?? {})) {
        if (!grid) continue
        const hole = snapNearest(point, grid)
        const key = hole && formatHole(hole, spec)
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
  for (const part of parts) if (part.type === 'seven-segment-anode') union(`${part.id}:com1`, `${part.id}:com2`)

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
    if (key.localeCompare(net.key, 'en') < 0) net.key = key
    netByKey.set(key, net)
  }

  for (const wire of wires) {
    const from = endpointKey(wire.from)
    const to = endpointKey(wire.to)
    const net = from && to ? netByKey.get(from) : undefined
    net?.wireIds.add(wire.id)
  }

  return {
    netOf: key => {
      const hole = parseHole(key, spec)
      return netByKey.get(hole ? (formatHole(hole, spec) ?? key) : key)
    },
    netsList: () => [...new Set(netByRoot.values())]
      .sort((left, right) => left.key.localeCompare(right.key, 'en')),
  }
}
