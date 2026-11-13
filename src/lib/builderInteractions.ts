import { getComponentDefinition, type ComponentId } from '../data/componentRegistry'
import type { CircuitConnection, CircuitPart } from '../types/circuitTopology'

export type CanvasDropPoint = { x: number; y: number }
export type CanvasRect = { left: number; top: number; width: number; height: number }
export type PartDropIssue = 'board-exists' | 'workspace-limit'
export type WireCreationIssue = 'invalid-pin' | 'same-pin' | 'duplicate'

export function canStartComponentMove(startedOnPin: boolean): boolean {
  return !startedOnPin
}

export function canvasDropPosition(clientX: number, clientY: number, rect: CanvasRect): CanvasDropPoint | undefined {
  if (![clientX, clientY, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) return
  return {
    x: Math.max(5, Math.min(90, ((clientX - rect.left) / rect.width) * 100)),
    y: Math.max(8, Math.min(88, ((clientY - rect.top) / rect.height) * 100)),
  }
}

export type WireDragPreview = {
  pointerId: number; fromKey: string; clientStartX: number; clientStartY: number
  x: number; y: number; dragging: boolean
}

export function startWireGesture(pointerId: number, fromKey: string, client: CanvasDropPoint, anchor: CanvasDropPoint): WireDragPreview {
  return { pointerId, fromKey, clientStartX: client.x, clientStartY: client.y, ...anchor, dragging: false }
}

export function moveWireGesture(active: WireDragPreview, pointerId: number, clientX: number, clientY: number, rect: CanvasRect): WireDragPreview | undefined {
  if (pointerId !== active.pointerId || !canvasDropPosition(clientX, clientY, rect)) return
  if (!active.dragging && Math.hypot(clientX - active.clientStartX, clientY - active.clientStartY) < 8) return
  // Preview can reach edge pins; placement bounds apply to component bodies only.
  return { ...active, dragging: true,
    x: Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100)),
    y: Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100)),
  }
}

export function addDroppedPart<T extends CircuitPart>(
  placed: readonly T[],
  type: ComponentId,
  position: CanvasDropPoint,
  id: string,
): { placed?: T[]; issue?: PartDropIssue } {
  if (type === 'board' && placed.some(part => part.type === 'board')) return { issue: 'board-exists' }
  if (placed.length >= 100) return { issue: 'workspace-limit' }
  return { placed: [...placed, { id, type, x: position.x, y: position.y } as T] }
}

function parseStableEndpoint(key: string, placed: readonly CircuitPart[]): CircuitConnection['from'] | undefined {
  const separator = key.lastIndexOf(':')
  if (separator < 1) return
  const partId = key.slice(0, separator)
  const pinId = key.slice(separator + 1)
  const part = placed.find(candidate => candidate.id === partId)
  if (!part || !getComponentDefinition(part.type)?.pins.some(pin => pin.id === pinId)) return
  return { partId, pinId }
}

export function createWireFromKeys(
  fromKey: string,
  toKey: string,
  placed: readonly CircuitPart[],
  wires: readonly CircuitConnection[],
  id: string,
): { wire?: CircuitConnection; issue?: WireCreationIssue } {
  const from = parseStableEndpoint(fromKey, placed)
  const to = parseStableEndpoint(toKey, placed)
  if (!from || !to) return { issue: 'invalid-pin' }
  if (from.partId === to.partId && from.pinId === to.pinId) return { issue: 'same-pin' }
  const duplicate = wires.some(wire =>
    (wire.from.partId === from.partId && wire.from.pinId === from.pinId && wire.to.partId === to.partId && wire.to.pinId === to.pinId) ||
    (wire.from.partId === to.partId && wire.from.pinId === to.pinId && wire.to.partId === from.partId && wire.to.pinId === from.pinId),
  )
  if (duplicate) return { issue: 'duplicate' }
  return { wire: { id, from, to } }
}
