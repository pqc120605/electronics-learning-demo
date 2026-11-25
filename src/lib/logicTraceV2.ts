import { createNetIndexV2 } from './circuitNetsV2'
import type { CircuitDocV2 } from './circuitDocV2'
import { getLogicFlow, getLogicTraceWireIds, type LogicTraceInput, type WireFlow } from './logicTrace'
import type { CircuitConnection, CircuitEndpoint } from '../types/circuitTopology'

const supportedLessons = new Set(['blink', 'button-led'])

export type LogicTraceV2Input = Omit<LogicTraceInput, 'parts' | 'wires'> & { doc: CircuitDocV2 }

export type LogicTraceV2Result = {
  supported: boolean
  reason?: string
  /** Actual declared CircuitDocV2 wire IDs on the active teaching trace. */
  wireIds: Set<string>
  /** Teaching labels projected onto declared wire IDs; never measured voltage/current. */
  flows: Map<string, WireFlow>
  /** Stable pin IDs on nets participating in the active trace, for schematic cross-highlighting. */
  activePinKeys: Set<string>
}

function endpointFor(key: string, holes: ReadonlySet<string>, allocatePartId: (base: string) => string): CircuitEndpoint | null {
  if (holes.has(key)) return { partId: allocatePartId('__v2_hole__'), pinId: key }
  const separator = key.lastIndexOf(':')
  if (separator <= 0 || separator === key.length - 1) return null
  return { partId: key.slice(0, separator), pinId: key.slice(separator + 1) }
}

function empty(supported: boolean, reason?: string): LogicTraceV2Result {
  return { supported, ...(reason ? { reason } : {}), wireIds: new Set(), flows: new Map(), activePinKeys: new Set() }
}

/**
 * Adapts the existing lesson logic model to CircuitDocV2 connectivity. Net membership
 * comes from the V2 document (including breadboard strips and mounted legs); virtual
 * edges exist only inside this adapter and never become saved wires or measured values.
 */
export function traceCircuitDocV2(input: LogicTraceV2Input): LogicTraceV2Result {
  const { doc, lessonId, frame, active, hasCircuitErrors, inputs, tick } = input
  if (!supportedLessons.has(doc.lessonId)) return empty(false, 'Bài học này chưa hỗ trợ quan sát tín hiệu trên mạch.')
  if (doc.lessonId !== lessonId) return empty(false, 'Mạch đang mở thuộc một bài học khác.')
  if (!active || !frame || hasCircuitErrors) return empty(true)

  const nets = createNetIndexV2(doc)
  const usedIds = new Set(doc.parts.map(part => part.id))
  let generatedId = 0
  const allocatePartId = (base: string) => {
    let candidate = base
    while (usedIds.has(candidate)) candidate = `${base}${++generatedId}`
    usedIds.add(candidate)
    return candidate
  }

  const syntheticWires: CircuitConnection[] = []
  const netBySyntheticWire = new Map<string, ReturnType<typeof nets.netsList>[number]>()
  for (const [netIndex, net] of nets.netsList().entries()) {
    const keys = [...net.endpoints, ...net.holes].sort((left, right) => left.localeCompare(right, 'en'))
    if (keys.length < 2 || net.wireIds.size === 0) continue
    const hub: CircuitEndpoint = { partId: allocatePartId(`__v2_net_${netIndex}__`), pinId: 'junction' }
    for (const [nodeIndex, key] of keys.entries()) {
      const endpoint = endpointFor(key, net.holes, allocatePartId)
      if (!endpoint) continue
      const id = `__v2_trace_${netIndex}_${nodeIndex}__`
      syntheticWires.push({ id, from: hub, to: endpoint })
      netBySyntheticWire.set(id, net)
    }
  }

  const logicInput: LogicTraceInput = {
    lessonId,
    parts: doc.parts.map(({ id, type }) => ({ id, type })),
    wires: syntheticWires,
    frame,
    active,
    hasCircuitErrors,
    inputs,
    tick,
  }
  const tracedSynthetic = getLogicTraceWireIds(logicInput)
  const flowsSynthetic = getLogicFlow(logicInput)
  const wireIds = new Set<string>()
  const flows = new Map<string, WireFlow>()
  const activePinKeys = new Set<string>()

  for (const id of tracedSynthetic) {
    const net = netBySyntheticWire.get(id)
    if (!net) continue
    for (const wireId of net.wireIds) wireIds.add(wireId)
    for (const endpoint of net.endpoints) activePinKeys.add(endpoint)
  }

  for (const [id, flow] of flowsSynthetic) {
    const net = netBySyntheticWire.get(id)
    if (!net) continue
    // Synthetic hub orientation is an implementation detail, so never expose it as direction.
    const educationalFlow = { ...flow, direction: 'none' as const }
    for (const wireId of net.wireIds) flows.set(wireId, educationalFlow)
  }

  return { supported: true, wireIds, flows, activePinKeys }
}
