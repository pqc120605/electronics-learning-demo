type PinoutEntry = { label: string; sourceBacked: boolean }

/**
 * Joins an exact D0–D10 CAD net label to a separately sourced board pin map.
 * It intentionally does not infer functions for power or anonymous nets.
 */
export function getDocumentedPinForNet(net: string | null | undefined, pinMap: Record<string, PinoutEntry>): PinoutEntry | null {
  if (!net) return null
  const key = net.trim().toLowerCase()
  if (!/^d(?:[0-9]|10)$/.test(key)) return null
  const pin = pinMap[key]
  return pin?.sourceBacked ? pin : null
}
