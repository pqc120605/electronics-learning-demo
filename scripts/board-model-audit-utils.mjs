export function featuresWithoutMesh(features, hotspots, nodeNames) {
  return features.filter((feature) => {
    const hotspot = hotspots.find((item) => item.featureId === feature.id)
    return !hotspot?.nodeNames.some((name) => nodeNames.has(name))
  }).map((feature) => feature.id)
}

export function countPinsOutsideBounds(pins, pinPicking, isOutside) {
  if (!pinPicking) return null
  return pins.filter(isOutside).length
}

/** Compare a source STEP body in millimeters with an isolated GLB node in meters. */
export function compareStepBodyToModelBounds(sourceBoundsMm, modelBoundsMeters, modelAxisOrder, toleranceMeters = 0.000005) {
  const validBounds = (bounds) => bounds && Array.isArray(bounds.min) && Array.isArray(bounds.max)
    && bounds.min.length === 3 && bounds.max.length === 3
    && [...bounds.min, ...bounds.max].every(Number.isFinite)
    && bounds.max.every((value, axis) => value > bounds.min[axis])
  const validAxes = Array.isArray(modelAxisOrder) && modelAxisOrder.length === 3
    && [...modelAxisOrder].sort().every((axis, index) => axis === index)
  if (!validBounds(sourceBoundsMm) || !validBounds(modelBoundsMeters) || !validAxes || !Number.isFinite(toleranceMeters) || toleranceMeters < 0) {
    return { status: 'invalid', expectedMeters: [], actualMeters: [], deltaMeters: [], maxDeltaMeters: Infinity, toleranceMeters }
  }

  const sourceSizeMm = sourceBoundsMm.max.map((value, axis) => value - sourceBoundsMm.min[axis])
  const expectedMeters = modelAxisOrder.map((sourceAxis) => sourceSizeMm[sourceAxis] / 1000)
  const actualMeters = modelBoundsMeters.max.map((value, axis) => value - modelBoundsMeters.min[axis])
  const deltaMeters = actualMeters.map((value, axis) => Math.abs(value - expectedMeters[axis]))
  const maxDeltaMeters = Math.max(...deltaMeters)
  return { status: maxDeltaMeters <= toleranceMeters ? 'match' : 'mismatch', expectedMeters, actualMeters, deltaMeters, maxDeltaMeters, toleranceMeters }
}
