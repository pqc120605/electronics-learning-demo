import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, assembly, circuit, presentation, layout
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;[assembly, circuit, presentation, layout] = await Promise.all(['/src/lib/freestyle/freestyleAssembly.ts', '/src/lib/freestyle/freestyleCircuit.ts', '/src/lib/freestyle/freestylePresentation.ts', '/src/lib/assemblyLayout.ts'].map(path => server.ssrLoadModule(path)))
})
test('all eight freestyle boards use only their own mapped anchors and omit unsupported board geometry', () => {
  for (const board of circuit.freestyleBoards) {
    const { doc, pinMap } = circuit.buildSampleCircuit('blink', board.id)
    const view = presentation.freestylePresentation(board.id, pinMap)
    const plan = assembly.freestyleAssembly(doc, board.id, pinMap)
    const placedBoard = plan.placements.find(part => part.type === 'board')
    assert.equal(placedBoard.assetUrl, view.model.assetUrl)
    for (const wire of doc.wires) for (const [index, end] of ['from', 'to'].entries()) {
      const endpoint = wire[end]
      if (endpoint.kind !== 'pin' || endpoint.partId !== placedBoard.partId) continue
      const anchor = presentation.freestylePinAnchor(view, pinMap, endpoint.pinId)
      if (anchor) assert.deepEqual(plan.wireEnds[wire.id][index], layout.localToWorld(placedBoard, anchor), board.id)
      else {
        assert.equal(plan.wireEnds[wire.id], undefined, board.id)
        assert.ok(plan.diagnostics.some(item => item.wireId === wire.id), board.id)
      }
    }
  }
})
after(async () => { await server?.close() })
test('freestyle retains geometry evidence, including the reference rail assumption', () => {
  const { doc, pinMap } = circuit.buildSampleCircuit('blink', 'esp32-devkit')
  const plan = assembly.freestyleAssembly(doc, 'esp32-devkit', pinMap)
  for (const [id] of Object.entries(plan.wireEnds)) {
    assert.ok(plan.wireEvidence?.[id], id)
    for (const end of ['from', 'to']) {
      const endpoint = doc.wires.find(wire => wire.id === id)[end]
      assert.equal(plan.wireEvidence[id][end].kind, endpoint.kind)
      if (endpoint.kind === 'hole' && /[+-]:/.test(endpoint.holeId)) assert.equal(plan.wireEvidence[id][end].evidence, 'unknown')
    }
  }
})

test('Mega shares source-backed GPIO and ADC anchors with its rendered assembly', () => {
  const board = circuit.getFreestyleBoard('arduino-mega-2560')
  const seen = new Set()
  for (let pin = 0; pin < 70; pin++) {
    const pinMap = { ...board.defaultPins, ledOut: pin }
    const view = presentation.freestylePresentation(board.id, pinMap)
    const source = presentation.freestylePinAnchor(view, pinMap, 'ledOut')
    assert.ok(source?.every(Number.isFinite), view.pinLabels.ledOut)
    assert.ok(!seen.has(JSON.stringify(source)), view.pinLabels.ledOut)
    seen.add(JSON.stringify(source))
  }
  const view = presentation.freestylePresentation(board.id, board.defaultPins)
  // XIO0 header face is at 10.095 mm in this GLB; the pad projection is unchanged.
  assert.deepEqual(view.pinAnchors.seg0, [191.707, 10.095, 83.401])
  assert.deepEqual(view.pinAnchors.seg6, [191.707, 10.095, 91.021])
})
