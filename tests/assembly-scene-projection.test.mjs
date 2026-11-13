import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getAssemblySceneProjection
let getLessonCircuitDoc

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ getAssemblySceneProjection } = await server.ssrLoadModule('/src/lib/assemblySceneProjection.ts'))
  ;({ getLessonCircuitDoc } = await server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'))
})

after(async () => { await server?.close() })

test('3D inventory and pin inspector project the same canonical CircuitDocV2, including breadboard holes', () => {
  const doc = getLessonCircuitDoc('blink')
  const projection = getAssemblySceneProjection(doc)

  assert.deepEqual(projection.parts.map(part => part.id), ['board-1', 'bb-1', 'res-1', 'led-1'])
  assert.equal(projection.parts.find(part => part.id === 'res-1')?.value, '220 Ω')
  assert.ok(projection.connectionsFor('res-1').find(pin => pin.pinId === 'a')?.peers.some(peer => peer.partId === 'bb1' && peer.pinId.startsWith('bb1:10')))
  assert.ok(projection.connectionsFor('res-1').find(pin => pin.pinId === 'b')?.peers.some(peer => peer.partId === 'led-1' && peer.pinId === 'anode'))
})
