import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'

let server, assembly, fixtures, targets, meshes
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[assembly, fixtures, targets, meshes] = await Promise.all([
    '/src/lib/assemblyLayout.ts', '/src/data/lessonCircuitDocs.ts', '/src/data/simulationTargets.ts', '/src/data/componentModels.ts',
  ].map(path => server.ssrLoadModule(path)))
})
after(async () => { await server?.close() })
const planFor = doc => assembly.getAssemblyPlanV2(doc, { boardId: 'esp32-devkit', target: targets.getSimulationTarget('esp32-devkit'), lessonId: 'blink' })

test('V2 rejects an unknown board pin even when other board pins have CAD anchors', () => {
  const doc = fixtures.getLessonCircuitDoc('blink')
  doc.wires.push({ id: 'unknown-board-pin', from: { kind: 'pin', partId: 'board-1', pinId: 'UNKNOWN' }, to: { kind: 'pin', partId: 'led-1', pinId: 'anode' }, role: 'signal' })
  const plan = planFor(doc)
  assert.equal(plan.wireEnds['unknown-board-pin'], undefined)
  assert.ok(plan.diagnostics.some(item => item.wireId === 'unknown-board-pin'))
})

test('V2 keeps declared LED holes and rotation even when body envelopes overlap', () => {
  const doc = fixtures.getLessonCircuitDoc('blink')
  doc.parts.push({ id: 'led-2', type: 'led', mount: { ...doc.parts.find(part => part.type === 'led').mount, row: 7 } })
  const plan = planFor(doc)
  for (const part of doc.parts.filter(part => part.type === 'led')) {
    const placement = plan.placements.find(item => item.partId === part.id)
    assert.equal(placement.rotationDeg, part.mount.rotation)
    assert.deepEqual(placement.hole, { column: part.mount.col - 1, row: part.mount.row })
    for (const [pinId, local] of Object.entries(meshes.getComponentMesh('led').pinsMm)) {
      assert.deepEqual(plan.pinPoints[`${part.id}:${pinId}`], assembly.localToWorld(placement, local))
    }
  }
})

test('LED anode and cathode endpoints follow the source footprint at every quarter turn', () => {
  for (const rotation of [0, 90, 180, 270]) {
    const doc = fixtures.getLessonCircuitDoc('blink')
    const led = doc.parts.find(part => part.type === 'led')
    led.mount = { ...led.mount, row: 2, rotation }
    doc.parts = doc.parts.filter(part => part.type !== 'resistor')
    doc.wires = ['anode', 'cathode'].map(pinId => ({ id: pinId, from: { kind: 'pin', partId: led.id, pinId }, to: { kind: 'hole', holeId: 'bb1:20a' }, role: 'signal' }))
    const plan = planFor(doc)
    const placement = plan.placements.find(part => part.partId === led.id)
    assert.equal(placement.rotationDeg, rotation)
    for (const pinId of ['anode', 'cathode']) {
      const expected = assembly.localToWorld(placement, meshes.getComponentMesh('led').pinsMm[pinId])
      assert.ok(Math.hypot(...plan.wireEnds[pinId][0].map((value, axis) => value - expected[axis])) < 1e-9, `${rotation}° ${pinId}`)
      assert.equal(plan.wireEvidence[pinId].from.evidence, 'cad')
    }
    assert.notDeepEqual(plan.wireEnds.anode[0], plan.wireEnds.cathode[0])
  }
})
