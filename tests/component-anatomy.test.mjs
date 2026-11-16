import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let anatomy
let components

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  anatomy = await server.ssrLoadModule('/src/data/componentAnatomy.ts')
  components = await server.ssrLoadModule('/src/data/components.ts')
})

after(async () => { await server?.close() })

test('every anatomy diagram maps to a catalog component and keeps parts on the board', () => {
  const catalogIds = new Set(JSON.stringify(components).match(/"id":"[a-z0-9-]+"/g).map(item => item.slice(6, -1)))
  for (const [id, item] of Object.entries(anatomy.componentAnatomies)) {
    assert.equal(item.id, id)
    assert.ok(catalogIds.has(id), `${id} có trong thư viện linh kiện`)
    assert.ok(item.parts.length >= 4, `${id} có đủ linh kiện con`)
    assert.ok(item.pins.length >= 3, `${id} có nhãn chân`)
    assert.ok(item.sources.length >= 1)
    const ids = new Set()
    for (const part of item.parts) {
      assert.ok(!ids.has(part.id), `${id}/${part.id} không trùng`); ids.add(part.id)
      assert.ok(part.x >= 0 && part.y >= 0 && part.x + part.w <= item.board.w && part.y + part.h <= item.board.h, `${id}/${part.id} nằm trong board`)
      assert.ok(part.name && part.role.length > 10, `${id}/${part.id} có vai trò`)
    }
  }
})

test('aliases resolve to the same diagram', () => {
  assert.equal(anatomy.getComponentAnatomy('ultrasonic')?.id, 'hc-sr04')
  assert.equal(anatomy.getComponentAnatomy('h-bridge')?.id, 'h-bridge-l298n')
  assert.equal(anatomy.getComponentAnatomy('led'), undefined)
})
