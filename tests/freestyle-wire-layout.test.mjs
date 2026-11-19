import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
let server, circuit, layout
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  circuit = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
})
after(async () => { await server?.close() })

test('version 1 roundtrip retains render-only bends and stable topology', () => {
  const workspace = circuit.defaultFreestyleWorkspace()
  const id = workspace.doc.wires[0].id
  workspace.wireLayout = { [id]: { x: 320, y: 250 } }
  const parsed = circuit.parseFreestyleWorkspace(JSON.stringify(workspace))
  assert.deepEqual(parsed.wireLayout, workspace.wireLayout)
  assert.deepEqual(parsed.doc, workspace.doc)
  assert.ok(parsed.doc.expect.netCount > 0)
  assert.equal(parsed.code, workspace.code)
})

test('invalid optional layouts are discarded without losing legacy circuit/code', async () => {
  layout = await server.ssrLoadModule('/src/lib/freestyle/freestyleWireLayout.ts')
  const workspace = circuit.defaultFreestyleWorkspace()
  const id = workspace.doc.wires[0].id
  for (const invalid of [null, [], { [id]: { x: '2', y: 4 } }, { [id]: { x: Infinity, y: 4 } }, { [id]: { x: -1, y: 4 } }, { [id]: { x: 999999, y: 4 } }, { missing: { x: 12, y: 12 } }, Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`wire-${i}`, { x: 1, y: 1 }]))]) {
    const result = circuit.parseFreestyleWorkspace(JSON.stringify({ ...workspace, wireLayout: invalid }))
    assert.ok(result)
    assert.equal(result.wireLayout, undefined)
    assert.equal(result.code, workspace.code)
  }
  assert.deepEqual(circuit.parseFreestyleWorkspace(JSON.stringify(workspace)), workspace)
  assert.equal(circuit.parseFreestyleWorkspace(JSON.stringify({ ...workspace, doc: { ...workspace.doc, wires: [null] } })), null)
})

test('bounded undo restores wire data only, without restoring old code or parts', async () => {
  layout = await server.ssrLoadModule('/src/lib/freestyle/freestyleWireLayout.ts')
  const workspace = circuit.defaultFreestyleWorkspace()
  let history = []
  for (let i = 0; i < 45; i++) history = layout.pushWireHistory(history, workspace.doc, { wire: { x: i, y: 30 } })
  assert.equal(history.length, 30)
  assert.equal(history[0].wireLayout.wire.x, 15)
  const next = { ...workspace.doc, wires: workspace.doc.wires.slice(1) }
  assert.notDeepEqual(history.at(-1).doc.wires, next.wires)
  assert.equal(history.at(-1).doc.expect.netCount, workspace.doc.expect.netCount)
  assert.deepEqual(Object.keys(history.at(-1)).sort(), ['doc', 'wireLayout'])
})
