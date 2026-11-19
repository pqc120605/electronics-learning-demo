import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, share, circuits
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  ;[share, circuits] = await Promise.all([
    server.ssrLoadModule('/src/lib/freestyle/freestyleShare.ts'),
    server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts'),
  ])
})
after(async () => { await server?.close() })

test('twenty distinct sample mạch round-trip with exact topology, code and board', async () => {
  const fixtures = ['arduino-uno-r3', 'arduino-nano', 'arduino-mega-2560', 'esp32-devkit', 'raspberry-pi-pico'].flatMap(board =>
    circuits.freestyleSamples.map(sample => circuits.defaultFreestyleWorkspace(board, sample.id)))
  assert.equal(fixtures.length, 20)
  for (const workspace of fixtures) {
    const encoded = await share.encodeFreestyleShare(workspace)
    assert.ok(encoded.startsWith('#s=1.'), workspace.sampleId)
    assert.ok(encoded.length <= 8192, workspace.sampleId)
    const restored = await share.readFreestyleShare(encoded)
    assert.equal(restored.boardId, workspace.boardId)
    assert.equal(restored.code, workspace.code)
    assert.deepEqual(JSON.parse(JSON.stringify(restored.doc.parts)), JSON.parse(JSON.stringify(workspace.doc.parts)))
    assert.deepEqual(JSON.parse(JSON.stringify(restored.doc.wires)), JSON.parse(JSON.stringify(workspace.doc.wires)))
    assert.deepEqual(restored.pinMap, workspace.pinMap)
  }
})

test('invalid, oversized or altered fragments yield a domain error', async () => {
  for (const hash of ['#s=', '#s=99.X.abc', '#s=1.invalid', '#s=' + 'a'.repeat(9000)]) {
    await assert.rejects(share.readFreestyleShare(hash), /Liên kết mạch/)
  }
  const encoded = await share.encodeFreestyleShare(circuits.defaultFreestyleWorkspace())
  const tweaked = encoded.replace(/^#s=1\.(\w)/, (_, char) => '#s=1.' + (char === 'a' ? 'b' : 'a'))
  await assert.rejects(share.readFreestyleShare(tweaked), /Liên kết mạch/)
})

test('snapshot does not carry notes, timestamps, or library metadata from the sender', async () => {
  const workspace = circuits.defaultFreestyleWorkspace()
  workspace.updatedAt = 'private timestamp'
  workspace.owner = 'private owner'
  workspace.doc.parts[0].notes = 'private notes'
  const restored = await share.readFreestyleShare(await share.encodeFreestyleShare(workspace))
  assert.equal(restored.updatedAt, new Date(0).toISOString())
  assert.equal(Object.hasOwn(restored, 'owner'), false)
  assert.equal(Object.hasOwn(restored.doc.parts[0], 'notes'), false)
})
