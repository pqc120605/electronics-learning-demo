import type { NodeBounds } from '../components/board/glbParser'

export type FeatureFocusBounds = { center: [number, number, number]; radius: number }

/** Avoid framing PCB-wide geometry or pads when the user asks to focus a component. */
export function isFocusableFeatureNode(nodeName: string): boolean {
  return !(/^(?:board|pcb)$/i.test(nodeName) || /(?:^|_)(?:board|soldermask|silkscreen|dielectric|pad)$/i.test(nodeName))
}

export function getFeatureFocusBounds(bounds: NodeBounds[], nodeNames: string[]): FeatureFocusBounds | null {
  const selectedNames = new Set(nodeNames.filter(isFocusableFeatureNode))
  const selectedBounds = bounds.filter((bound) => selectedNames.has(bound.nodeName))
  if (!selectedBounds.length) return null

  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const bound of selectedBounds) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], bound.min[axis])
      max[axis] = Math.max(max[axis], bound.max[axis])
    }
  }
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ]
  const radius = Math.max(...selectedBounds.map((bound) => Math.hypot(
    bound.center[0] - center[0],
    bound.center[1] - center[1],
    bound.center[2] - center[2],
  ) + bound.radius))
  if (!Number.isFinite(radius) || radius <= 0) return null
  return { center, radius }
}
