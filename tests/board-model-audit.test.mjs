import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareStepBodyToModelBounds, featuresWithoutMesh, countPinsOutsideBounds } from '../scripts/board-model-audit-utils.mjs'

test('reports CAD features with no actual GLB node instead of missing hotspot records', () => {
  const features = [{ id: 'mesh' }, { id: 'empty' }, { id: 'missing' }, { id: 'invalid-node' }]
  const hotspots = [
    { featureId: 'mesh', nodeNames: ['U1'] },
    { featureId: 'empty', nodeNames: [] },
    { featureId: 'invalid-node', nodeNames: ['NOT_IN_GLB'] },
  ]
  assert.deepEqual(featuresWithoutMesh(features, hotspots, new Set(['U1'])), ['empty', 'missing', 'invalid-node'])
})

test('does not report pin anchor positions for scenes with pin picking disabled', () => {
  const pins = [{ anchor: [8, 8, 8] }]
  const outside = (pin) => pin.anchor.some((value) => value < 0 || value > 1)
  assert.equal(countPinsOutsideBounds(pins, false, outside), null)
  assert.equal(countPinsOutsideBounds(pins, true, outside), 1)
})

test('compares an isolated STEP PCB body with its transformed GLB node in meters', () => {
  const source = { min: [10, 20, 30], max: [30.955, 21.25, 47.78] }
  const model = { min: [-0.0104775, -0.000625, -0.00889], max: [0.0104775, 0.000625, 0.00889] }
  const result = compareStepBodyToModelBounds(source, model, [0, 1, 2])
  assert.equal(result.status, 'match')
  assert.deepEqual(result.expectedMeters.map(value => +value.toFixed(8)), [0.020955, 0.00125, 0.01778])
  assert.ok(result.maxDeltaMeters < 1e-15)
})

test('maps a proper CAD axis rotation and detects a scaled or clipped GLB board body', () => {
  const source = { min: [-25.4, -11.43, -0.785], max: [25.4, 11.43, 0.785] }
  const rotatedModel = { min: [-0.0254, -0.000785, -0.01143], max: [0.0254, 0.000785, 0.01143] }
  assert.equal(compareStepBodyToModelBounds(source, rotatedModel, [0, 2, 1]).status, 'match')
  const clipped = { ...rotatedModel, max: [0.024, 0.000785, 0.01143] }
  const result = compareStepBodyToModelBounds(source, clipped, [0, 2, 1])
  assert.equal(result.status, 'mismatch')
  assert.ok(result.maxDeltaMeters > result.toleranceMeters)
})

test('rejects ambiguous axis mappings and malformed source/body bounds', () => {
  const bounds = { min: [0, 0, 0], max: [1, 2, 3] }
  assert.equal(compareStepBodyToModelBounds(bounds, bounds, [0, 0, 2]).status, 'invalid')
  assert.equal(compareStepBodyToModelBounds({ ...bounds, max: [1, 2, Infinity] }, bounds, [0, 1, 2]).status, 'invalid')
})
