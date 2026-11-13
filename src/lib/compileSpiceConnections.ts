import type { CircuitConnection } from '../types/circuitTopology'
import { createNetIndexV2 } from './circuitNetsV2'
import type { CircuitDocV2 } from './circuitDocV2'

/**
 * Compiles v2 electrical nets into a deterministic pin-to-pin spanning forest.
 * This is only a topology adapter; it does not infer electrical behavior or values.
 */
export function compileSpiceConnections(doc: CircuitDocV2): CircuitConnection[] {
  const index = createNetIndexV2(doc)
  const usedIds = new Set(doc.wires.map(wire => wire.id))
  const output: CircuitConnection[] = []
  let netOrdinal = 0

  for (const net of index.netsList()) {
    const endpoints = [...net.endpoints].sort((left, right) => left.localeCompare(right, 'en'))
    if (endpoints.length < 2) continue
    const [firstPartId, firstPinId] = endpoints[0].split(/:(.+)/s)
    if (!firstPartId || !firstPinId) continue
    for (const endpoint of endpoints.slice(1)) {
      const [partId, pinId] = endpoint.split(/:(.+)/s)
      if (!partId || !pinId) continue
      let id = `v2-net-${netOrdinal}-${output.length}`
      while (usedIds.has(id)) id += '-generated'
      usedIds.add(id)
      output.push({ id, from: { partId: firstPartId, pinId: firstPinId }, to: { partId, pinId } })
    }
    netOrdinal += 1
  }
  return output
}
