import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let routeWires

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ routeWires } = await server.ssrLoadModule('/src/lib/wireRouter.ts'))
})

after(async () => { await server?.close() })

const pointsInside = (route, obstacle, pitch = 1.27) => route.points.slice(1, -1).some(([x, y]) => {
  const cx = Math.round(x / pitch) * pitch, cy = Math.round(y / pitch) * pitch
  return cx > obstacle.x && cx < obstacle.x + obstacle.width && cy > obstacle.y && cy < obstacle.y + obstacle.height
})

test('routes orthogonally with a one-cell lead at each endpoint', () => {
  const result = routeWires([{ id: 'wire-1', from: [0, 0], to: [10.16, 5.08], fromExit: 'E', toExit: 'W' }])
  assert.deepEqual(result.errors, [])
  const [route] = result.routes
  assert.deepEqual(route.points[0], [0, 0])
  assert.equal(route.points[1][1], 0)
  assert.ok(Math.abs(route.points[1][0]) >= 1.27)
  assert.deepEqual(route.points.at(-1), [10.16, 5.08])
  for (let i = 1; i < route.points.length; i += 1) assert.ok(route.points[i][0] === route.points[i - 1][0] || route.points[i][1] === route.points[i - 1][1])
})

test('routes around a footprint and reports a blocker when no route can be found', () => {
  const obstacle = { id: 'part', x: 2.54, y: -1.27, width: 5.08, height: 3.81 }
  const result = routeWires([{ id: 'wire-1', from: [0, 0], to: [10.16, 0], fromExit: 'E', toExit: 'W' }], [obstacle])
  assert.deepEqual(result.errors, [])
  assert.ok(!pointsInside(result.routes[0], obstacle))
  const enclosed = routeWires([{ id: 'wire-2', from: [0, 0], to: [10.16, 0] }], [
    { id: 'left', x: -2.54, y: -2.54, width: 1.27, height: 5.08 },
    { id: 'right', x: 1.27, y: -2.54, width: 1.27, height: 5.08 },
    { id: 'top', x: -1.27, y: -2.54, width: 3.81, height: 1.27 },
    { id: 'bottom', x: -1.27, y: 1.27, width: 3.81, height: 1.27 },
  ], { maxExpandedNodes: 500 })
  assert.equal(enclosed.routes.length, 0)
  assert.equal(enclosed.errors.length, 1)
})

test('does not route through an endpoint footprint or silently snap off-grid endpoints', () => {
  const throughPart = routeWires([{ id: 'wire-1', from: [2.54, 0], to: [10.16, 0], fromExit: 'E', toExit: 'W', fromObstacleId: 'part' }], [
    { id: 'part', x: 0, y: -1.27, width: 5.08, height: 2.54 },
  ])
  assert.equal(throughPart.errors.length, 0)
  const route = throughPart.routes[0]
  assert.ok(route.points[1][0] >= 6.35, 'endpoint lead exits the part before routing')
  assert.equal(routeWires([{ id: 'off-grid', from: [0.1, 0], to: [10.16, 0] }]).errors[0].wireId, 'off-grid')
})

test('sorts wires and resolves ties deterministically', () => {
  const wires = [
    { id: 'b', from: [0, 0], to: [10.16, 0], fromExit: 'E', toExit: 'W' },
    { id: 'a', from: [0, 2.54], to: [10.16, 2.54], fromExit: 'E', toExit: 'W' },
  ]
  const first = routeWires(wires)
  const second = routeWires([...wires].reverse())
  assert.deepEqual(first.routes, second.routes)
  assert.deepEqual(first.routes.map(route => route.id), ['a', 'b'])
})

test('routes a 16-wire seven-segment-like layout under the 200 ms target', () => {
  const wires = Array.from({ length: 16 }, (_, index) => ({
    id: `wire-${String(index).padStart(2, '0')}`,
    from: [0, index * 2.54],
    to: [60.96, index * 2.54 + 1.27],
    fromExit: 'E',
    toExit: 'W',
  }))
  const result = routeWires(wires, [{ id: 'small-footprint', x: 25.4, y: 0, width: 10.16, height: 5.08 }])
  assert.equal(result.errors.length, 0, result.errors.map(error => error.reason).join('; '))
  assert.equal(result.routes.length, 16)
  assert.ok(result.elapsedMs < 200, `routing took ${result.elapsedMs.toFixed(2)} ms`)
})
