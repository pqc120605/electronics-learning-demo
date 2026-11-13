export type PcbBounds = { width: number; height: number }
export type PcbPan = { x: number; y: number }
export type PcbViewBox = { x: number; y: number; width: number; height: number }

/** Fits the complete CAD board, with a small breathing margin, at its physical aspect ratio. */
export function fitPcbViewBox(bounds: PcbBounds, zoom = 1, pan: PcbPan = { x: 0, y: 0 }, padding = 0.045): PcbViewBox {
  if (![bounds.width, bounds.height, zoom, pan.x, pan.y, padding].every(Number.isFinite)
    || bounds.width <= 0 || bounds.height <= 0 || zoom <= 0 || padding < 0) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }
  const width = bounds.width * (1 + padding * 2) / zoom
  const height = bounds.height * (1 + padding * 2) / zoom
  return { x: (bounds.width - width) / 2 + pan.x, y: (bounds.height - height) / 2 + pan.y, width, height }
}

export function formatPcbViewBox(view: PcbViewBox): string {
  return `${view.x} ${view.y} ${view.width} ${view.height}`
}
