import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let fitPcbViewBox

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const module = await server.ssrLoadModule('/src/lib/pcbViewBox.ts')
  fitPcbViewBox = module.fitPcbViewBox
})

after(async () => { await server?.close() })

test('PCB viewBox preserves board aspect, centers the board and leaves a small margin', () => {
  const bounds = { width: 47.0596, height: 29.2346 }
  const view = fitPcbViewBox(bounds, 1, { x: 0, y: 0 })
  assert.ok(Math.abs(view.width / view.height - bounds.width / bounds.height) < 1e-12)
  assert.ok(view.width > bounds.width && view.height > bounds.height)
  assert.ok(Math.abs((view.x + view.width / 2) - bounds.width / 2) < 1e-12)
  assert.ok(Math.abs((view.y + view.height / 2) - bounds.height / 2) < 1e-12)
})

test('PCB viewBox applies zoom and pan without changing the physical aspect ratio', () => {
  const view = fitPcbViewBox({ width: 80, height: 40 }, 2, { x: 3, y: -4 })
  assert.equal(view.width / view.height, 2)
  assert.equal(view.x + view.width / 2, 43)
  assert.equal(view.y + view.height / 2, 16)
})
