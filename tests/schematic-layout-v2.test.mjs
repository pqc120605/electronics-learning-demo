import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let layoutSchematicV2
let getLessonCircuitDoc

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [layout, fixture] = await Promise.all([
    server.ssrLoadModule('/src/lib/schematicLayoutV2.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
  ])
  layoutSchematicV2 = layout.layoutSchematicV2
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
})

after(async () => { await server?.close() })

test('button teaching layout keeps distinct terminals, exact net membership and role-derived ground', async () => {
  const doc = getLessonCircuitDoc('button-led')
  const { createNetIndexV2 } = await server.ssrLoadModule('/src/lib/circuitNetsV2.ts')
  const index = createNetIndexV2(doc)
  const result = layoutSchematicV2(doc)
  assert.deepEqual(result, layoutSchematicV2(doc))
  for (const part of result.parts) {
    assert.equal(new Set(part.terminals.map(t => `${t.x},${t.y}`)).size, part.terminals.length)
    for (const terminal of part.terminals) assert.ok(terminal.label)
  }
  for (const net of result.nets) {
    assert.deepEqual(net.endpoints, [...index.netOf(net.key).endpoints].sort((a, b) => a.localeCompare(b, 'en')))
    assert.deepEqual(net.holes, [...index.netOf(net.key).holes].sort((a, b) => a.localeCompare(b, 'en')))
    assert.ok(net.segments.every(s => s.from[0] === s.to[0] || s.from[1] === s.to[1]))
    assert.ok(net.junctions.every(([x, y]) => net.segments.filter(s =>
      (s.from[0] === x && s.from[1] === y) || (s.to[0] === x && s.to[1] === y)).length >= 3))
  }
  const ground = result.nets.find(n => n.endpoints.includes('board-1:gnd'))
  assert.equal(ground.role, 'ground')
  assert.ok(ground.junctions.length > 0)
  assert.ok(result.nets.some(n => n.crossings.length > 0))
  assert.ok(result.nets.every(n => n.crossings.every(c => !n.junctions.some(j => j[0] === c[0] && j[1] === c[1]))))
  for (const net of result.nets) for (const [x, y] of net.crossings) {
    assert.ok(net.segments.some(s => s.from[1] === y && s.to[1] === y && Math.min(s.from[0], s.to[0]) < x && x < Math.max(s.from[0], s.to[0])))
    assert.ok(result.nets.some(other => other.key !== net.key && other.segments.some(s => s.from[0] === x && s.to[0] === x && Math.min(s.from[1], s.to[1]) <= y && y <= Math.max(s.from[1], s.to[1]))))
  }
})

test('wire roles never infer a supply and conflicts are diagnosed without a marker', () => {
  const doc = getLessonCircuitDoc('button-led')
  doc.wires.forEach(w => { delete w.role })
  assert.ok(layoutSchematicV2(doc).nets.every(n => n.role === null))
  doc.wires[0].role = 'power'
  assert.equal(layoutSchematicV2(doc).nets.find(n => n.wireIds.includes(doc.wires[0].id)).role, 'power')
  doc.wires[1].role = 'ground'
  doc.wires[2].role = 'power'
  const result = layoutSchematicV2(doc)
  assert.equal(result.nets.find(n => n.wireIds.includes(doc.wires[1].id)).role, null)
  assert.ok(result.diagnostics.some(d => d.code === 'CONFLICTING_ROLES'))
})

test('unsupported parts retain a visible fallback without overlapping the supported lesson symbols', () => {
  const doc = getLessonCircuitDoc('button-led')
  doc.parts.push({ id: 'unknown-1', type: 'unknown-part', mount: { kind: 'bench', lane: 'bottom', order: 1 } })
  const result = layoutSchematicV2(doc)
  const unknown = result.parts.find(p => p.partId === 'unknown-1')
  assert.equal(unknown.symbolKind, 'unsupported')
  assert.ok(result.parts.filter(p => p !== unknown).every(p => Math.abs(p.y - unknown.y) > (p.height + unknown.height) / 2 || Math.abs(p.x - unknown.x) > (p.width + unknown.width) / 2))
})

test('schematic projection uses conventional symbols and the canonical net partition', () => {
  const doc = getLessonCircuitDoc('blink')
  const result = layoutSchematicV2(doc)
  assert.deepEqual(result.parts.filter(part => ['res-1', 'led-1'].includes(part.partId)).map(part => part.symbolKind).sort(), ['led', 'resistor'])
  assert.ok(result.parts.find(part => part.partId === 'board-1').terminals.some(terminal => terminal.key === 'board-1:ledOut' && terminal.label === 'GPIO LED'))
  assert.equal(result.nets.length, 3)
  assert.ok(result.nets.every(net => net.segments.length > 0))
  assert.ok(result.nets.some(net => net.endpoints.includes('res-1:a') && net.endpoints.includes('board-1:ledOut')))
  assert.ok(result.nets.some(net => net.holes.includes('bb1:10a')))
})

test('layout is deterministic, bounded and marks branches separately from crossings', () => {
  const doc = getLessonCircuitDoc('blink')
  doc.parts.push({ id: 'button-1', type: 'button', mount: { kind: 'bench', lane: 'bottom', order: 0 } })
  doc.wires.push({ id: 'w-branch', from: { kind: 'pin', partId: 'button-1', pinId: 'contactA' }, to: { kind: 'hole', holeId: 'bb1:10b' }, role: 'signal' })
  doc.expect.partCount += 1
  doc.expect.wireCount += 1
  const first = layoutSchematicV2(doc)
  const second = layoutSchematicV2(doc)
  assert.deepEqual(first, second)
  assert.ok(first.parts.every(part => part.x >= 0 && part.x <= first.width && part.y >= 0 && part.y <= first.height))
  assert.ok(first.nets.some(net => net.junctions.length > 0))
  assert.ok(first.diagnostics.every(item => typeof item.code === 'string' && typeof item.message === 'string'))
})
