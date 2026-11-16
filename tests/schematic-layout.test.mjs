import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, resolveSchematicLayout, cardsOverlap, circuitForLesson, builderLessons
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ resolveSchematicLayout, cardsOverlap } = await server.ssrLoadModule('/src/lib/schematicLayout.ts'))
  ;({ circuitForLesson } = await server.ssrLoadModule('/src/data/lessonCircuits.ts'))
  ;({ builderLessons } = await server.ssrLoadModule('/src/data/builderLessons.ts'))
})
after(async () => { await server?.close() })

// Card sizes close to the rendered ones: the board card is taller because of its pin list.
const sizeOf = (type) => type === 'board' ? { width: 220, height: 150 } : { width: 220, height: 112 }

for (const width of [700, 950, 1200]) test(`legacy schematic presets never overlap at ${width}px`, () => {
  for (const lesson of builderLessons) {
    const { placed } = circuitForLesson(lesson.id)
    const cards = placed.map(part => ({ id: part.id, x: part.x, y: part.y, ...sizeOf(part.type) }))
    const layout = resolveSchematicLayout(cards, width, 540)
    const rects = cards.map(card => { const { left, top } = layout.positions[card.id]; const cx = left / 100 * width; return { left: cx - card.width / 2, right: cx + card.width / 2, top: top - card.height / 2, bottom: top + card.height / 2 } })
    assert.equal(cardsOverlap(rects), false, `${lesson.id} @ ${width}px`)
    for (const rect of rects) assert.ok(rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= layout.height, `${lesson.id} card inside canvas`)
  }
})

test('cards that do not collide keep their preset position', () => {
  const layout = resolveSchematicLayout([{ id: 'a', x: 20, y: 30, width: 100, height: 80 }, { id: 'b', x: 80, y: 70, width: 100, height: 80 }], 1000, 500)
  assert.deepEqual(layout.positions.a, { left: 20, top: 150 })
  assert.deepEqual(layout.positions.b, { left: 80, top: 350 })
  assert.equal(layout.height, 500)
})
