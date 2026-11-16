/** A schematic card: preset centre in % of the canvas, and its rendered size in px. */
export type SchematicCard = { id: string; x: number; y: number; width: number; height: number }
export type SchematicLayout = { positions: Record<string, { left: number; top: number }>; height: number }

const GAP = 14

/**
 * Keeps each card at its preset position when it does not collide with an earlier card;
 * otherwise moves it to the nearest free spot. `left` is a % of width, `top` is in px.
 * Canvas height grows so no card is clipped. Deterministic for the same input.
 */
export function resolveSchematicLayout(cards: readonly SchematicCard[], canvasWidth: number, baseHeight: number): SchematicLayout {
  const placed: Array<{ cx: number; cy: number; w: number; h: number }> = []
  const positions: SchematicLayout['positions'] = {}
  const collides = (cx: number, cy: number, w: number, h: number) => placed.some(box =>
    Math.abs(box.cx - cx) < (box.w + w) / 2 + GAP && Math.abs(box.cy - cy) < (box.h + h) / 2 + GAP)
  let bottom = baseHeight
  for (const card of cards) {
    const w = Math.min(card.width, canvasWidth), h = card.height
    const clampX = (value: number) => Math.min(canvasWidth - w / 2 - 4, Math.max(w / 2 + 4, value))
    const clampY = (value: number) => Math.max(h / 2 + 8, value)
    const preset = { cx: clampX(card.x / 100 * canvasWidth), cy: clampY(card.y / 100 * baseHeight) }
    let spot = preset
    if (collides(spot.cx, spot.cy, w, h)) {
      const candidates: Array<{ cx: number; cy: number; d: number }> = []
      const stepX = Math.max(24, w / 4), stepY = 24
      for (let row = -12; row <= 40; row += 1) for (let col = -16; col <= 16; col += 1) {
        const cx = clampX(preset.cx + col * stepX), cy = clampY(preset.cy + row * stepY)
        candidates.push({ cx, cy, d: Math.hypot(cx - preset.cx, (cy - preset.cy) * 1.4) })
      }
      candidates.sort((a, b) => a.d - b.d)
      spot = candidates.find(candidate => !collides(candidate.cx, candidate.cy, w, h)) ?? { cx: preset.cx, cy: Math.max(...placed.map(box => box.cy + box.h / 2), 0) + GAP + h / 2 }
    }
    placed.push({ cx: spot.cx, cy: spot.cy, w, h })
    positions[card.id] = { left: spot.cx / canvasWidth * 100, top: spot.cy }
    bottom = Math.max(bottom, spot.cy + h / 2 + 16)
  }
  return { positions, height: Math.ceil(bottom) }
}

/** True when any two cards overlap (used by tests and the e2e check). */
export function cardsOverlap(rects: ReadonlyArray<{ left: number; top: number; right: number; bottom: number }>) {
  return rects.some((a, index) => rects.slice(index + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top))
}
