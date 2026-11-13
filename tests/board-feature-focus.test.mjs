import assert from 'node:assert/strict'
import { test } from 'node:test'

test('feature camera target encloses all selectable mesh bounds for the chosen feature', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  const { getFeatureFocusBounds } = await server.ssrLoadModule('/src/lib/boardFeatureFocus.ts')
  await server.close()
  const result = getFeatureFocusBounds([
    { nodeName: 'u1-body', center: [0, 0, 0], radius: 1, min: [-1, -1, -1], max: [1, 1, 1] },
    { nodeName: 'u1-shield', center: [3, 0, 0], radius: 0.5, min: [2.5, -0.5, -0.5], max: [3.5, 0.5, 0.5] },
    { nodeName: 'r1-body', center: [20, 0, 0], radius: 2, min: [18, -2, -2], max: [22, 2, 2] },
  ], ['u1-body', 'u1-shield'])

  assert.deepEqual(result?.center, [1.25, 0, 0])
  assert.ok(result.radius >= 2.25, 'the sphere includes the far edge of both selected feature meshes')
  assert.ok(Math.hypot(20 - result.center[0], 0, 0) - 2 > result.radius, 'unrelated mesh bounds do not distort the focused view')
})

test('feature camera target is unavailable when CAD has no selectable mesh body', async () => {
  const server = await import('vite').then(({ createServer }) => createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } }))
  const { getFeatureFocusBounds } = await server.ssrLoadModule('/src/lib/boardFeatureFocus.ts')
  await server.close()
  const bounds = [{ nodeName: 'pcb', center: [0, 0, 0], radius: 10, min: [-10, -1, -10], max: [10, 1, 10] }]
  assert.equal(getFeatureFocusBounds(bounds, []), null)
  assert.equal(getFeatureFocusBounds(bounds, ['missing-footprint-body']), null)
})
