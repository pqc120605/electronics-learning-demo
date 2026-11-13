import { getComponentDefinition } from '../data/componentRegistry'
import type { CircuitConnection, CircuitEndpoint, CircuitPart } from '../types/circuitTopology'

type PartRef = Pick<CircuitPart, 'id' | 'type'>
export type PartPinConnection = { pinId: string; peers: CircuitEndpoint[]; wireIds: string[] }
export type WireNet = { endpoints: Set<string>; wireIds: Set<string> }
export type WireNetGroup = { key: string; endpoints: string[]; wireIds: string[] }
export type NetIndex = { netOf: (key: string) => WireNet | undefined; wiresOn: (keys: string[]) => string[]; sameNet: (left: string, right: string) => boolean; nets: WireNet[] }
export type LedSeriesPath = { sourceFrom: string; sourceTo: string; resistorId: string; anode: string; cathode: string }

export const endpointKey = (endpoint: CircuitEndpoint) => `${endpoint.partId}:${endpoint.pinId}`

/** A net here means endpoints joined by wires. It says nothing about current or voltage. */
export function createNetIndex(wires: CircuitConnection[]): NetIndex {
  const byKey = new Map<string, WireNet>()
  for (const wire of wires) {
    const from = endpointKey(wire.from), to = endpointKey(wire.to)
    const left = byKey.get(from), right = byKey.get(to)
    const net = left ?? right ?? { endpoints: new Set<string>(), wireIds: new Set<string>() }
    if (left && right && left !== right) {
      for (const key of right.endpoints) { net.endpoints.add(key); byKey.set(key, net) }
      for (const id of right.wireIds) net.wireIds.add(id)
    }
    net.endpoints.add(from).add(to)
    net.wireIds.add(wire.id)
    byKey.set(from, net)
    byKey.set(to, net)
  }
  return {
    netOf: (key) => byKey.get(key),
    wiresOn: (keys) => keys.flatMap((key) => [...(byKey.get(key)?.wireIds ?? [])]),
    sameNet: (left, right) => left === right || (byKey.has(left) && byKey.get(left) === byKey.get(right)),
    nets: [...new Set(byKey.values())],
  }
}

/** Stable display groups for the schematic. A group is only a set of endpoints joined by explicit workspace wires. */
export function getWireNetGroups(wires: CircuitConnection[]): WireNetGroup[] {
  return createNetIndex(wires).nets
    .map((net) => {
      const endpoints = [...net.endpoints].sort((left, right) => left.localeCompare(right, 'en'))
      return { key: JSON.stringify(endpoints), endpoints, wireIds: [...net.wireIds].sort((left, right) => left.localeCompare(right, 'en')) }
    })
    .sort((left, right) => left.key.localeCompare(right.key, 'en'))
}

export function getPartConnections(partId: string, pinIds: string[], wires: CircuitConnection[]): PartPinConnection[] {
  const { netOf } = createNetIndex(wires)
  return pinIds.map((pinId) => {
    const key = `${partId}:${pinId}`
    const net = netOf(key)
    const peers = [...(net?.endpoints ?? [])].filter((item) => item !== key && !item.startsWith(`${partId}:`)).map((item) => {
      const split = item.lastIndexOf(':')
      return { partId: item.slice(0, split), pinId: item.slice(split + 1) }
    })
    return { pinId, peers, wireIds: [...(net?.wireIds ?? [])] }
  })
}

const ledSourcePins: Record<string, [string, string]> = { board: ['ledOut', 'gnd'], battery: ['positive', 'negative'], 'buck-converter': ['outPlus', 'outMinus'], 'boost-converter': ['outPlus', 'outMinus'] }

/** Finds source → resistor → LED → return in either series order. `reversed` swaps the LED legs. */
export function findLedSeriesPath(parts: PartRef[], led: PartRef, sameNet: NetIndex['sameNet'], reversed = false): LedSeriesPath | undefined {
  const pins = getComponentDefinition(led.type)?.pins
  const positive = pins?.find((pin) => pin.polarity === 'positive'), negative = pins?.find((pin) => pin.polarity === 'negative')
  if (!positive || !negative) return undefined
  const anode = `${led.id}:${(reversed ? negative : positive).id}`, cathode = `${led.id}:${(reversed ? positive : negative).id}`
  for (const source of parts) {
    const sourcePins = ledSourcePins[source.type]
    if (!sourcePins) continue
    const sourceFrom = `${source.id}:${sourcePins[0]}`, sourceTo = `${source.id}:${sourcePins[1]}`
    for (const resistor of parts) {
      if (resistor.type !== 'resistor') continue
      const a = `${resistor.id}:a`, b = `${resistor.id}:b`
      const series = (sameNet(sourceFrom, a) && sameNet(b, anode) && sameNet(cathode, sourceTo))
        || (sameNet(sourceFrom, b) && sameNet(a, anode) && sameNet(cathode, sourceTo))
        || (sameNet(sourceFrom, anode) && sameNet(cathode, a) && sameNet(b, sourceTo))
        || (sameNet(sourceFrom, anode) && sameNet(cathode, b) && sameNet(a, sourceTo))
      if (series) return { sourceFrom, sourceTo, resistorId: resistor.id, anode, cathode }
    }
  }
  return undefined
}
