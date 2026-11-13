import { componentRegistry } from '../data/componentRegistry'
import { createNetIndexV2 } from './circuitNetsV2'
import type { CircuitDocV2 } from './circuitDocV2'

export type SchematicSymbolKind = 'board' | 'resistor' | 'led' | 'diode' | 'button' | 'unsupported'
export type SchematicTerminalV2 = { key: string; label: string; x: number; y: number }
export type SchematicPartV2 = { partId: string; type: string; label: string; value: string; x: number; y: number; width: number; height: number; rotation: number; symbolKind: SchematicSymbolKind; terminals: SchematicTerminalV2[] }
export type SchematicSegmentV2 = { from: [number, number]; to: [number, number] }
export type SchematicNetV2 = { key: string; endpoints: string[]; holes: string[]; wireIds: string[]; role: 'ground' | 'power' | 'signal' | null; segments: SchematicSegmentV2[]; junctions: Array<[number, number]>; crossings: Array<[number, number]>; marker: [number, number] | null }
export type SchematicDiagnosticV2 = { code: 'UNSUPPORTED_SYMBOL' | 'UNRESOLVED_ENDPOINT' | 'CONFLICTING_ROLES'; message: string; partId?: string }
export type SchematicLayoutV2 = { width: number; height: number; parts: SchematicPartV2[]; nets: SchematicNetV2[]; diagnostics: SchematicDiagnosticV2[] }

const SYMBOLS: Record<string, SchematicSymbolKind> = { board: 'board', resistor: 'resistor', led: 'led', diode: 'diode', button: 'button' }
const fmtValue = (part: CircuitDocV2['parts'][number]) => part.value?.label ?? (part.value?.ohm !== undefined ? `${part.value.ohm} Ω` : part.value?.farad !== undefined ? `${part.value.farad} F` : '')
const sorted = (items: Set<string>) => [...items].sort((a, b) => a.localeCompare(b, 'en'))

/** Layout only: graph identity is authoritative; roles imply neither voltage/current nor ERC. */
export function layoutSchematicV2(doc: CircuitDocV2): SchematicLayoutV2 {
  const index = createNetIndexV2(doc, componentRegistry)
  const connectedNets = index.netsList().filter(net => net.wireIds.size > 0 || net.endpoints.size > 1)
  const diagnostics: SchematicDiagnosticV2[] = []
  const pinPositions = new Map<string, [number, number]>()
  const escapeDirections = new Map<string, number>()
  const counts = new Map<string, number>()
  const parts: SchematicPartV2[] = doc.parts.filter(p => p.type !== 'breadboard').map(part => {
    const definition = componentRegistry.find(item => item.id === part.type)
    const symbolKind = definition ? SYMBOLS[part.type] ?? 'unsupported' : 'unsupported'
    if (symbolKind === 'unsupported') diagnostics.push({ code: 'UNSUPPORTED_SYMBOL', message: `${part.id} (${part.type}): chưa có symbol nguyên lý được hỗ trợ; khối này chỉ giữ nhãn linh kiện.`, partId: part.id })
    const ordinalKey = symbolKind === 'unsupported' ? '__unsupported' : part.type
    const ordinal = counts.get(ordinalKey) ?? 0
    counts.set(ordinalKey, ordinal + 1)
    const x = part.type === 'board' ? 130 : ['led', 'diode'].includes(part.type) ? 680 : 440
    const y = (symbolKind === 'unsupported' ? 530 : part.type === 'button' ? 320 : part.type === 'board' ? 230 : 140) + ordinal * 210
    // Show only connected board aliases, never inferred physical pin numbers.
    const pins = (definition?.pins ?? []).filter(pin => part.type !== 'board' || connectedNets.some(net => net.endpoints.has(`${part.id}:${pin.id}`)))
    const height = part.type === 'board' ? Math.max(260, pins.length * 90 + 20) : Math.max(100, Math.ceil(pins.length / 2) * 36)
    const width = part.type === 'board' ? 150 : 112
    const terminals = pins.map((pin, i) => {
      const right = part.type === 'board' || i % 2 === 1
      const tx = x + (right ? 1 : -1) * width / 2
      const ty = part.type === 'board' ? y - (pins.length - 1) * 45 + i * 90 : y + Math.floor(i / 2) * 36
      const key = `${part.id}:${pin.id}`
      pinPositions.set(key, [tx, ty])
      escapeDirections.set(key, right ? 1 : -1)
      return { key, label: pin.label, x: tx, y: ty }
    })
    return { partId: part.id, type: part.type, label: definition?.label ?? part.type, value: fmtValue(part), x, y, width, height, rotation: 0, symbolKind, terminals }
  })
  const contentBottom = Math.max(400, ...parts.map(p => p.y + p.height / 2 + 50))
  const nets: SchematicNetV2[] = connectedNets.map((net, netPosition) => {
    const endpoints = sorted(net.endpoints)
    const holes = sorted(net.holes)
    const wireIds = [...net.wireIds].sort()
    const roles = new Set(doc.wires.filter(w => net.wireIds.has(w.id) && w.role).map(w => w.role!))
    const role = roles.size === 1 ? [...roles][0] : null
    if (roles.size > 1) diagnostics.push({ code: 'CONFLICTING_ROLES', message: `Net ${net.key}: xung đột vai trò dây (${[...roles].sort().join(', ')}); không gán dấu nguồn/GND.` })
    const points = endpoints.flatMap(key => {
      const point = pinPositions.get(key)
      if (!point && !doc.parts.some(p => p.type === 'breadboard' && key.startsWith(`${p.id}:`))) diagnostics.push({ code: 'UNRESOLVED_ENDPOINT', message: `Net ${net.key}: chưa có vị trí symbol cho ${key}.` })
      return point ? [{ key, point }] : []
    })
    // Separate routing lanes; escapes leave symbol bodies before turning.
    const busY = role === 'ground' ? contentBottom + netPosition * 28 : 44 + netPosition * 26
    const taps = points.map(({ key, point }, i) => ({ point, x: point[0] + (escapeDirections.get(key) ?? 1) * (24 + netPosition * 12 + i * 8) }))
    const tapXs = [...new Set(taps.map(t => t.x))].sort((a, b) => a - b)
    const segments: SchematicSegmentV2[] = []
    const add = (from: [number, number], to: [number, number]) => {
      if (from[0] !== to[0] || from[1] !== to[1]) segments.push({ from, to })
    }
    taps.forEach(t => { add(t.point, [t.x, t.point[1]]); add([t.x, t.point[1]], [t.x, busY]) })
    // Split at taps so junction dots have three actual incident branches.
    tapXs.slice(1).forEach((x, i) => add([tapXs[i], busY], [x, busY]))
    const junctions: Array<[number, number]> = tapXs.slice(1, -1).map(x => [x, busY])
    const marker: [number, number] | null = taps.length && (role === 'ground' || role === 'power') ? [tapXs[0], busY] : null
    return { key: net.key, endpoints, holes, wireIds, role, segments, junctions, crossings: [], marker }
  })
  // A bridge belongs to the horizontal net, never an inferred electrical junction.
  for (const net of nets) for (const other of nets) {
    if (net === other) continue
    for (const h of net.segments.filter(s => s.from[1] === s.to[1])) for (const v of other.segments.filter(s => s.from[0] === s.to[0])) {
      const x = v.from[0], y = h.from[1]
      if (Math.min(h.from[0], h.to[0]) < x && x < Math.max(h.from[0], h.to[0]) && Math.min(v.from[1], v.to[1]) <= y && y <= Math.max(v.from[1], v.to[1])
        && !net.crossings.some(p => p[0] === x && p[1] === y)) net.crossings.push([x, y])
    }
  }
  // Reserve a clear sheet margin for the drawing frame and title block.
  return { width: Math.max(1080, ...nets.flatMap(n => n.segments.flatMap(s => [s.from[0] + 320, s.to[0] + 320]))), height: Math.max(contentBottom + 155, ...nets.flatMap(n => n.segments.flatMap(s => [s.from[1] + 155, s.to[1] + 155]))), parts, nets, diagnostics }
}
