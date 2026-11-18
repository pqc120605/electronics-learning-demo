import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
let server, api
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  api = Object.assign({}, ...await Promise.all(['/src/lib/circuitDiagnosticNavigation.ts', '/src/lib/circuitGates.ts', '/src/data/lessonCircuitDocs.ts', '/src/lib/circuitNetsV2.ts'].map(path => server.ssrLoadModule(path))))
})
after(async () => { await server?.close() })
function fixture() {
  const doc = api.getLessonCircuitDoc('blink')
  doc.wires = doc.wires.filter(wire => wire.id !== 'w-resistor-to-led')
  const report = api.evaluateCircuitGates(doc)
  const action = report.gates.find(gate => gate.id === 'G7').diagnosticActions.find(action => action.target.endpoint.partId === 'led-1')
  const current = { doc, report, boardId: 'esp32-devkit', lessonId: 'blink' }
  return { current, request: { ...current, gateId: 'G7', action } }
}
test('resolves an exact endpoint without changing document or report', () => {
  const { current, request } = fixture()
  const before = JSON.stringify(current)
  assert.deepEqual(api.resolveCircuitDiagnostic(current, request), { kind: 'endpoint', endpointKey: 'led-1:anode', partId: 'led-1' })
  assert.equal(JSON.stringify(current), before)
})
test('rejects stale report document board lesson and actions outside the current gate', () => {
  const { current, request } = fixture()
  for (const next of [{ ...current, report: structuredClone(current.report) }, { ...current, doc: structuredClone(current.doc) }, { ...current, boardId: 'arduino-uno' }, { ...current, lessonId: 'button-led' }]) assert.equal(api.resolveCircuitDiagnostic(next, request), null)
  assert.equal(api.resolveCircuitDiagnostic(current, { ...request, action: { ...request.action, target: { kind: 'part', partId: 'board-1' } } }), null)
  current.doc.parts = current.doc.parts.filter(part => part.id !== 'led-1')
  assert.equal(api.resolveCircuitDiagnostic(current, request), null)
})
test('resolves wire net from current topology and rejects a removed wire', () => {
  const doc = api.getLessonCircuitDoc('blink')
  doc.wires.push({ ...structuredClone(doc.wires[0]), id: 'duplicate' })
  const report = api.evaluateCircuitGates(doc)
  const action = report.gates.find(gate => gate.id === 'G6').diagnosticActions.find(action => action.target.wireId === 'duplicate')
  const current = { doc, report, boardId: 'esp32-devkit', lessonId: 'blink' }
  const request = { ...current, gateId: 'G6', action }
  const result = api.resolveCircuitDiagnostic(current, request)
  assert.equal(result.kind, 'wire')
  assert.equal(result.wireId, 'duplicate')
  const wire = doc.wires.find(wire => wire.id === 'duplicate')
  const key = wire.from.kind === 'pin' ? `${wire.from.partId}:${wire.from.pinId}` : wire.from.holeId
  assert.equal(result.netKey, api.createNetIndexV2(doc).netOf(key).key)
  doc.wires = doc.wires.filter(wire => wire.id !== 'duplicate')
  assert.equal(api.resolveCircuitDiagnostic(current, request), null)
})
test('resolves a LED warning to its exact part', () => {
  const { current } = fixture()
  const action = current.report.gates.find(gate => gate.id === 'G8').diagnosticActions[0]
  assert.deepEqual(api.resolveCircuitDiagnostic(current, { ...current, gateId: 'G8', action }), { kind: 'part', partId: 'led-1' })
})
