import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getAssemblyPlanV2
let getLessonCircuitDoc
let holeToMm
let getSimulationTarget
let footprintHoles

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [assembly, fixture, grid, targets, mount] = await Promise.all([
    server.ssrLoadModule('/src/lib/assemblyLayout.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/breadboardGrid.ts'),
    server.ssrLoadModule('/src/data/simulationTargets.ts'),
    server.ssrLoadModule('/src/lib/mountResolve.ts'),
  ])
  getAssemblyPlanV2 = assembly.getAssemblyPlanV2
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
  holeToMm = grid.holeToMm
  getSimulationTarget = targets.getSimulationTarget
  footprintHoles = mount.footprintHoles
})

after(async () => { await server?.close() })

const options = { boardId: 'esp32-devkit', target: null, lessonId: 'blink' }

test('V2 assembly keeps wire IDs and resolves exact hole endpoints in the placed breadboard coordinate frame', () => {
  const doc = getLessonCircuitDoc('blink')
  const plan = getAssemblyPlanV2(doc, { ...options, target: getSimulationTarget(options.boardId) })
  assert.deepEqual(Object.keys(plan.wireEnds).sort(), doc.wires.map(wire => wire.id).sort())
  const wire = doc.wires.find(item => item.id === 'w-gpio-to-resistor')
  const point = holeToMm({ kind: 'grid', board: 'bb1', column: 10, row: 'a' }, plan.grid)
  const expected = [plan.grid.originX + point[0], point[1], plan.grid.originZ + point[2]]
  assert.deepEqual(plan.wireEnds[wire.id][1], expected)
  assert.equal(plan.wireEvidence[wire.id].to.kind, 'hole')
})

test('unresolved V2 endpoints produce diagnostics instead of a fabricated wire segment', () => {
  const doc = getLessonCircuitDoc('blink')
  doc.wires[0].from = { kind: 'pin', partId: 'missing-part', pinId: 'GPIO0' }
  const plan = getAssemblyPlanV2(doc, { ...options, target: getSimulationTarget(options.boardId) })
  assert.equal(plan.wireEnds[doc.wires[0].id], undefined)
  assert.ok(plan.diagnostics.some(item => item.wireId === doc.wires[0].id && item.code === 'UNRESOLVED_ENDPOINT'))
})

test('V2 assembly keeps the 6 mm button on the bench when its CAD pins do not fit the breadboard grid', () => {
  const doc = getLessonCircuitDoc('button-led')
  assert.ok(doc)
  const button = doc.parts.find(part => part.type === 'button')
  const plan = getAssemblyPlanV2(doc, { ...options, target: getSimulationTarget(options.boardId), lessonId: doc.lessonId })
  const placement = plan.placements.find(part => part.partId === button.id)
  assert.equal(placement?.mount, 'bench')
  assert.equal(placement.legs?.length ?? 0, 0)
  assert.deepEqual(footprintHoles(button), [])
  assert.ok(plan.wireEnds['w-input-to-button'])
  assert.ok(plan.wireEnds['w-button-to-gnd'])
  assert.deepEqual(plan.diagnostics, [])
})
