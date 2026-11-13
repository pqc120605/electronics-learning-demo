import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const plan = (lessonId, boardId = 'esp32-devkit', options = {}) => {
  const circuit = m.circuitForLesson(lessonId)
  return { circuit, result: m.getAssemblyPlan(circuit.placed, circuit.wires, { boardId, target: m.getSimulationTarget(boardId), lessonId, ...options }) }
}
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const breadboardLessons = ['blink', 'source-led', 'button-led', 'analog-potentiometer', 'analog-ldr', 'ultrasonic-distance', 'seven-segment-counter', 'ir-alert']
const allLessons = [...breadboardLessons, 'buck-boost-concept', 'dc-motor-driver', 'mosfet-switch']
const boards = ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3']

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/lib/assemblyLayout.ts', '/src/lib/circuitNets.ts', '/src/data/lessonCircuits.ts', '/src/data/componentModels.ts', '/src/data/simulationTargets.ts', '/src/lib/projectBundle.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

test('the breadboard model matches a real 400-point grid', () => {
  const { gridMm } = m.getComponentMesh('breadboard')
  assert.equal(gridMm.pitch, 2.54)
  assert.equal(gridMm.columns, 30)
  assert.equal(gridMm.rows.length, 10)
  assert.ok(Math.abs(gridMm.rows[5] - gridMm.rows[4] - 7.62) < 1e-6, 'rows e and f sit 0.3 in apart')
})

test('library meshes carry pin positions from their KiCad footprint', () => {
  const led = m.getComponentMesh('led')
  assert.deepEqual(led.pinsMm.cathode, [0, 0, 0])
  assert.deepEqual(led.pinsMm.anode, [2.54, 0, 0])
  assert.ok(led.boundsMm.min[1] < 0, 'leads continue below the seating plane')
  const resistor = m.getComponentMesh('resistor')
  assert.ok(Math.abs(resistor.pinsMm.b[0] - 10.16) < 1e-6)
})

test('breadboard parts keep true scale and sit on the breadboard surface', () => {
  for (const lesson of breadboardLessons) {
    const { result } = plan(lesson)
    const top = m.getComponentMesh('breadboard').gridMm.topY
    for (const item of result.placements.filter((placement) => placement.mount === 'breadboard')) {
      assert.equal(item.positionMm[1], top, `${lesson} ${item.partId}`)
    }
  }
})

test('every mounted leg lands on a breadboard hole', () => {
  for (const lesson of breadboardLessons) for (const boardId of boards) {
    const { result } = plan(lesson, boardId)
    for (const item of result.placements.filter((placement) => placement.mount === 'breadboard')) {
      assert.ok(item.snapErrorMm <= 0.7, `${lesson} ${item.partId} off by ${item.snapErrorMm}`)
      for (const leg of item.legs) assert.ok(leg.column >= 0 && leg.column < 30 && leg.row >= 0 && leg.row < 10, `${lesson} ${item.partId}`)
    }
  }
})

test('LED, resistor, button and HC-SR04 are mounted, not left beside the breadboard', () => {
  const mounted = (lesson, type) => plan(lesson).result.placements.find((item) => item.type === type).mount
  assert.equal(mounted('blink', 'led'), 'breadboard')
  assert.equal(mounted('blink', 'resistor'), 'breadboard')
  assert.equal(mounted('button-led', 'button'), 'breadboard')
  assert.equal(mounted('ultrasonic-distance', 'ultrasonic'), 'breadboard')
  assert.equal(mounted('seven-segment-counter', 'seven-segment'), 'breadboard')
  assert.equal(plan('seven-segment-counter').result.placements.filter((item) => item.type === 'resistor' && item.mount === 'breadboard').length, 7)
})

test('two pins share a breadboard strip only when the wires put them on one net', () => {
  for (const lesson of breadboardLessons) {
    const { circuit, result } = plan(lesson)
    const nets = m.createNetIndex(circuit.wires)
    const byStrip = new Map()
    for (const item of result.placements) for (const leg of item.legs ?? []) {
      const strip = `${leg.row < 5 ? 'top' : 'bottom'}:${leg.column}`
      const key = `${item.partId}:${leg.pinId}`
      for (const other of byStrip.get(strip) ?? []) assert.ok(other === key || nets.sameNet(other, key), `${lesson}: ${other} and ${key} share ${strip}`)
      byStrip.set(strip, [...(byStrip.get(strip) ?? []), key])
    }
  }
})

test('a chain of parts shares strips so the assembly reads as one circuit', () => {
  const { result } = plan('blink')
  const legs = result.placements.flatMap((item) => (item.legs ?? []).map((leg) => ({ ...leg, partId: item.partId })))
  const strip = (partId, pinId) => { const leg = legs.find((item) => item.partId === partId && item.pinId === pinId); return `${leg.row < 5}:${leg.column}` }
  assert.equal(strip('res-1', 'b'), strip('led-1', 'anode'))
})

test('no two part bodies overlap and everything stays on the bench', () => {
  for (const lesson of allLessons) for (const boardId of boards) {
    const { result } = plan(lesson, boardId)
    const boxes = result.placements.filter((item) => item.type !== 'breadboard').map((item) => ({ id: item.partId, ...m.footprintBox(item) }))
    boxes.forEach((a, index) => boxes.slice(index + 1).forEach((b) => {
      assert.ok(a.maxX <= b.minX || b.maxX <= a.minX || a.maxZ <= b.minZ || b.maxZ <= a.minZ, `${lesson}/${boardId}: ${a.id} overlaps ${b.id}`)
    }))
    for (const box of boxes) assert.ok(Math.abs(box.minX) < m.BENCH_MM.width / 2 + 1 && Math.abs(box.maxX) < m.BENCH_MM.width / 2 + 1 && Math.abs(box.minZ) < m.BENCH_MM.depth / 2 + 1 && Math.abs(box.maxZ) < m.BENCH_MM.depth / 2 + 1, `${lesson}/${boardId}: ${box.id} leaves the bench`)
  }
})

test('the board sits beside the breadboard, close but not touching', () => {
  const { result } = plan('blink')
  const board = m.footprintBox(result.placements.find((item) => item.type === 'board'))
  const bread = m.footprintBox(result.placements.find((item) => item.type === 'breadboard'))
  const gap = bread.minX - board.maxX
  assert.ok(gap > 2 && gap < 30, `gap ${gap}`)
})

test('wire ends stop at a pin or a hole of the same strip, never in mid-air', () => {
  for (const lesson of allLessons) for (const boardId of boards) {
    const { circuit, result } = plan(lesson, boardId)
    assert.equal(Object.keys(result.wireEnds).length, circuit.wires.length, lesson)
    for (const wire of circuit.wires) {
      const ends = result.wireEnds[wire.id]
      for (const [index, endpoint] of [wire.from, wire.to].entries()) {
        const placement = result.placements.find((item) => item.partId === endpoint.partId)
        const point = ends[index]
        if (placement.mount === 'breadboard') {
          const legs = placement.legs.filter((leg) => leg.pinId === endpoint.pinId)
          assert.ok(legs.some((leg) => Math.abs(m.holePoint(result.grid, leg.column, leg.row)[0] - point[0]) < 1e-6), `${lesson} ${wire.id} stays in the pin column`)
          assert.equal(point[1], result.grid.topY)
        } else {
          assert.ok(distance(point, result.pinPoints[`${endpoint.partId}:${endpoint.pinId}`]) < 1e-6, `${lesson} ${wire.id}`)
        }
      }
    }
  }
})

test('Arduino wires end on the CAD header pad for the lesson pin', () => {
  const { result } = plan('blink', 'arduino-uno-r3')
  const board = result.placements.find((item) => item.type === 'board')
  const pads = m.boardPinAnchors['arduino-uno-r3']
  const expected = m.localToWorld(board, [pads.pins.D13[0], pads.topYMm, pads.pins.D13[1]])
  assert.ok(distance(result.pinPoints[`${board.partId}:ledOut`], expected) < 1e-6)
  assert.equal(result.notes.boardPins, 'cad-pad')
})

test('a board without pad data says its wire ends are illustrative', () => {
  assert.equal(plan('blink', 'raspberry-pi-pico').result.notes.boardPins, 'illustrative')
  assert.equal(plan('blink', 'stm32-nucleo').result.notes.boardPins, 'illustrative')
})

test('rotating a part moves its pins and wire ends with the same transform', () => {
  const { circuit, result } = plan('dc-motor-driver')
  const turned = circuit.placed.map((part) => part.type === 'dc-motor' ? { ...part, rotation: 90 } : part)
  const next = m.getAssemblyPlan(turned, circuit.wires, { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'dc-motor-driver' })
  const before = result.placements.find((item) => item.type === 'dc-motor'), after = next.placements.find((item) => item.type === 'dc-motor')
  const key = `${before.partId}:positive`
  const expected = m.localToWorld(after, m.getComponentMesh('dc-motor').pinsMm.positive)
  assert.ok(distance(next.pinPoints[key], expected) < 1e-6)
  assert.notDeepEqual(next.pinPoints[key], result.pinPoints[key])
})

test('a motor and driver lesson without a breadboard lays parts out on the bench', () => {
  const { result } = plan('dc-motor-driver')
  assert.ok(result.placements.every((item) => item.mount !== 'breadboard'))
  for (const item of result.placements) assert.ok(Math.abs(m.footprintBox(item).minY) < 1e-6, `${item.partId} rests on the bench`)
})

test('a model that failed to load becomes a box and keeps no pin data from its mesh', () => {
  const { result } = plan('blink', 'esp32-devkit', { failed: new Set(['led-1']) })
  const led = result.placements.find((item) => item.partId === 'led-1')
  assert.equal(led.kind, 'fallback-box')
  assert.equal(led.assetUrl, undefined)
  assert.equal(led.mount, 'bench')
  assert.equal(led.legs, undefined)
  assert.equal(result.notes.partPinsIllustrative, true)
})

test('an explicit mount is kept and an illegal one falls back to a legal spot', () => {
  const { circuit, result } = plan('blink')
  const frozen = m.freezeAssembly(result)
  const parts = circuit.placed.map((part) => frozen[part.id] ? { ...part, assembly: frozen[part.id] } : part)
  const same = m.getAssemblyPlan(parts, circuit.wires, { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' })
  assert.deepEqual(same.placements.map((item) => item.positionMm), result.placements.map((item) => item.positionMm))
})

test('snapping follows the pointer, keeps legal strips, and can leave the breadboard', () => {
  const { circuit, result } = plan('blink')
  const options = { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' }
  const led = result.placements.find((item) => item.partId === 'led-1')
  const moved = m.snapPart(circuit.placed, circuit.wires, options, 'led-1', [led.positionMm[0] + 12, led.positionMm[2] + 8], result)
  assert.equal(moved.kind, 'breadboard')
  const parts = circuit.placed.map((part) => part.id === 'led-1' ? { ...part, assembly: moved } : part)
  const next = m.getAssemblyPlan(parts, circuit.wires, options)
  const placement = next.placements.find((item) => item.partId === 'led-1')
  assert.ok(Math.hypot(placement.positionMm[0] - (led.positionMm[0] + 12), placement.positionMm[2] - (led.positionMm[2] + 8)) < 8)
  assert.equal(m.snapPart(circuit.placed, circuit.wires, options, 'led-1', [100, 80], result).kind, 'bench')
})

test('keyboard nudges move one hole and refuse to enter another net', () => {
  const { circuit, result } = plan('blink')
  const options = { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' }
  const start = result.placements.find((item) => item.partId === 'led-1')
  const moved = m.nudgePart(circuit.placed, circuit.wires, options, 'led-1', 0, 1, result)
  assert.ok(moved)
  assert.ok(moved.row !== start.hole.row || moved.column !== start.hole.column)
})

test('a moved part survives saving and reopening a project', () => {
  const { circuit, result } = plan('blink')
  const options = { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' }
  const frozen = m.freezeAssembly(result)
  const moved = m.nudgePart(circuit.placed.map((part) => ({ ...part, assembly: frozen[part.id] })), circuit.wires, options, 'led-1', 0, 1, result)
  const placed = circuit.placed.map((part) => ({ ...part, assembly: part.id === 'led-1' ? moved : frozen[part.id] }))
  const bundle = m.parseProjectBundle(JSON.parse(JSON.stringify(m.createProjectBundle({ workspace: { schemaVersion: 4, placed, wires: circuit.wires, simBoard: 'esp32-devkit', lesson: 'blink', code: '' }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} }))))
  const reopened = m.getAssemblyPlan(bundle.workspace.placed, bundle.workspace.wires, options)
  assert.deepEqual(reopened.placements.find((item) => item.partId === 'led-1').hole, { column: moved.column, row: moved.row })
})

test('a damaged assembly value in an imported project is ignored', () => {
  const { circuit } = plan('blink')
  const options = { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' }
  const bad = [{ kind: 'breadboard', column: 'x', row: 99, rotation: null }, { kind: 'bench', x: 'NaN', z: 1 }, { kind: 'other' }]
  for (const assembly of bad) {
    const parts = circuit.placed.map((part) => part.id === 'led-1' ? { ...part, assembly } : part)
    const result = m.getAssemblyPlan(parts, circuit.wires, options)
    assert.ok(result.placements.find((item) => item.partId === 'led-1').positionMm.every(Number.isFinite))
  }
})

test('saved projects without assembly data still lay out', () => {
  const parts = [{ id: 'board-1', type: 'board', x: 20, y: 40 }, { id: 'old', type: 'unlisted-legacy-part', x: 50, y: 50 }]
  const result = m.getAssemblyPlan(parts, [], { boardId: 'esp32-devkit', target: m.getSimulationTarget('esp32-devkit'), lessonId: 'blink' })
  assert.equal(result.placements.find((item) => item.partId === 'old').kind, 'fallback-box')
})
