import type { CircuitPart } from '../types/circuitTopology'

/** Workspaces and projects saved before parts carried a value still name the preset part that differs from the default. */
const presetPartValues: Record<string, string> = { 'resistor-ldr-1': '10 kΩ' }

/** Resolve a displayed part value from the saved circuit instance before using its library default. */
export function getCircuitPartDisplayLabel(part: Pick<CircuitPart, 'id' | 'type' | 'value'>, defaultLabel: string): string {
  const value = part.value ?? presetPartValues[part.id]
  if (!value) return defaultLabel
  if (part.type === 'resistor') return `Điện trở ${value}`
  return `${defaultLabel} · ${value}`
}
