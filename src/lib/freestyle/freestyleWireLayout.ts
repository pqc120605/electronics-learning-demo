import type { CircuitDocV2 } from '../circuitDocV2'

/** Presentation coordinates only; never part of electrical connectivity. */
export type WireBend = { x: number; y: number }
export type FreestyleWireLayout = Record<string, WireBend>
export type WireHistoryEntry = { doc: CircuitDocV2; wireLayout?: FreestyleWireLayout }
const MAX_LAYOUT_WIRES = 500
const MAX_COORDINATE = 10_000
export const MAX_WIRE_HISTORY = 30

/** Optional corrupt presentation data is ignored; the original draft stays recoverable. */
export function readWireLayout(value: unknown, wires: CircuitDocV2['wires']): FreestyleWireLayout | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const entries = Object.entries(value)
  if (entries.length > MAX_LAYOUT_WIRES) return undefined
  const ids = new Set(wires.map(wire => wire?.id))
  const valid = entries.filter((entry): entry is [string, WireBend] => {
    const [id, point] = entry
    return ids.has(id) && Boolean(point) && typeof point === 'object' && !Array.isArray(point)
      && typeof point.x === 'number' && typeof point.y === 'number'
      && Number.isFinite(point.x) && Number.isFinite(point.y)
      && point.x >= 0 && point.y >= 0 && point.x <= MAX_COORDINATE && point.y <= MAX_COORDINATE
  })
  return valid.length ? Object.fromEntries(valid.map(([id, point]) => [id, { x: point.x, y: point.y }])) : undefined
}

export function pushWireHistory(history: WireHistoryEntry[], doc: CircuitDocV2, wireLayout?: FreestyleWireLayout): WireHistoryEntry[] {
  return [...history.slice(-(MAX_WIRE_HISTORY - 1)), { doc, wireLayout }]
}
