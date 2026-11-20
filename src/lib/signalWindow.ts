export function signalWindow(total: number, zoom = 1, position = 0) {
  const count = Math.min(total, Math.max(2, Math.ceil(total / zoom)))
  const start = Math.round((total - count) * position)
  return { start, end: start + count }
}
