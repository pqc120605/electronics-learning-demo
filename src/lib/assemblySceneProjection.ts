import { componentRegistry } from '../data/componentRegistry'
import { createNetIndexV2 } from './circuitNetsV2'
import type { PartPinConnection } from './circuitNets'
import type { CircuitDocV2 } from './circuitDocV2'
import type { CircuitEndpoint, CircuitPart } from '../types/circuitTopology'

export type AssemblySceneProjection = {
  parts: CircuitPart[]
  connectionsFor: (partId: string) => PartPinConnection[]
  describeEndpoint: (endpoint: CircuitEndpoint) => string
}

/** Derives 3D inventory and pin inspection from the exact CircuitDocV2 shown in the scene. */
export function getAssemblySceneProjection(doc: CircuitDocV2): AssemblySceneProjection {
  const parts: CircuitPart[] = doc.parts.map((part, index) => {
    const value = part.value?.label
      ?? (part.value?.ohm !== undefined ? `${part.value.ohm} Ω` : undefined)
      ?? (part.value?.farad !== undefined ? `${part.value.farad} F` : undefined)
    return {
      id: part.id,
      type: part.type,
      x: index * 10,
      y: 50,
      ...(value ? { value } : {}),
      ...(part.mount.kind === 'breadboard' ? { rotation: part.mount.rotation } : {}),
    }
  })
  const index = createNetIndexV2(doc)
  const ids = [...doc.parts.map(part => part.id)].sort((left, right) => right.length - left.length)

  const endpointFor = (key: string): CircuitEndpoint | null => {
    for (const id of ids) {
      if (key.startsWith(`${id}:`)) return { partId: id, pinId: key.slice(id.length + 1) }
    }
    return key.startsWith('bb1:') ? { partId: 'bb1', pinId: key } : null
  }

  return {
    parts,
    connectionsFor(partId) {
      const part = doc.parts.find(item => item.id === partId)
      const pins = componentRegistry.find(item => item.id === part?.type)?.pins ?? []
      return pins.map(pin => {
        const key = `${partId}:${pin.id}`
        const net = index.netOf(key)
        const peers = [...(net?.endpoints ?? [])]
          .filter(candidate => candidate !== key && !candidate.startsWith(`${partId}:`))
          .flatMap(candidate => {
            const endpoint = endpointFor(candidate)
            return endpoint ? [endpoint] : []
          })
        for (const hole of net?.holes ?? []) peers.push({ partId: 'bb1', pinId: hole })
        const uniquePeers = [...new Map(peers.map(peer => [`${peer.partId}:${peer.pinId}`, peer])).values()]
        return { pinId: pin.id, peers: uniquePeers, wireIds: [...(net?.wireIds ?? [])] }
      })
    },
    describeEndpoint(endpoint) {
      if (endpoint.partId === 'bb1') return `Lỗ ${endpoint.pinId}`
      const part = doc.parts.find(item => item.id === endpoint.partId)
      const pin = componentRegistry.find(item => item.id === part?.type)?.pins.find(item => item.id === endpoint.pinId)
      return `${part?.id ?? endpoint.partId}.${pin?.label ?? endpoint.pinId}`
    },
  }
}
