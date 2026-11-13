import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getLessonCircuitDoc
let validateCircuitDoc
let createNetIndexV2
let componentRegistry

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [fixture, validator, nets, registry] = await Promise.all([
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/lib/circuitDocV2.ts'),
    server.ssrLoadModule('/src/lib/circuitNetsV2.ts'),
    server.ssrLoadModule('/src/data/componentRegistry.ts'),
  ])
  getLessonCircuitDoc = fixture.getLessonCircuitDoc
  validateCircuitDoc = validator.validateCircuitDoc
  createNetIndexV2 = nets.createNetIndexV2
  componentRegistry = registry.componentRegistry
})

after(async () => { await server?.close() })

test('the canonical ESP32 blink lesson doc contains a valid, explicitly wired 220 ohm LED circuit', () => {
  const doc = getLessonCircuitDoc('blink')
  assert.ok(doc)
  assert.equal(doc.schema, 2)
  assert.equal(doc.lessonId, 'blink')
  assert.deepEqual(doc.parts.map(part => part.id), ['board-1', 'bb-1', 'res-1', 'led-1'])
  assert.deepEqual(doc.wires.map(wire => wire.id), ['w-gpio-to-resistor', 'w-led-cathode-to-rail', 'w-rail-to-gnd'])
  assert.equal(doc.parts.find(part => part.id === 'res-1').value.ohm, 220)
  assert.equal(doc.wires.length, 3)

  const ids = [...doc.breadboards.map(board => board.id), ...doc.parts.map(part => part.id), ...doc.wires.map(wire => wire.id)]
  assert.equal(new Set(ids).size, ids.length, 'part, breadboard and wire IDs are unique')
  assert.deepEqual(validateCircuitDoc(doc, componentRegistry).filter(issue => issue.severity === 'error'), [])
})

test('the canonical blink doc resolves GPIO, resistor, LED and return to the intended breadboard nets', () => {
  const doc = getLessonCircuitDoc('blink')
  const index = createNetIndexV2(doc, componentRegistry)
  const sameNet = (...keys) => keys.slice(1).forEach(key => assert.equal(index.netOf(key), index.netOf(keys[0]), `${key} should share ${keys[0]}`))
  const differentNets = (left, right) => assert.notEqual(index.netOf(left), index.netOf(right), `${left} must differ from ${right}`)

  sameNet('board-1:ledOut', 'res-1:a', ...'abcde'.split('').map(row => `bb1:10${row}`))
  sameNet('res-1:b', 'led-1:anode', ...'abcde'.split('').map(row => `bb1:14${row}`))
  sameNet('led-1:cathode', 'board-1:gnd', ...'abcde'.split('').map(row => `bb1:15${row}`), ...Array.from({ length: 25 }, (_, index) => `bb1:T-:${index + 1}`))
  differentNets('res-1:a', 'res-1:b')
  differentNets('led-1:anode', 'led-1:cathode')
})

test('getLessonCircuitDoc returns an independent deep copy on each call', () => {
  const first = getLessonCircuitDoc('blink')
  const second = getLessonCircuitDoc('blink')
  assert.notEqual(first, second)
  assert.notEqual(first.parts, second.parts)
  assert.notEqual(first.parts[2].value, second.parts[2].value)
  first.parts[2].value.ohm = 10000
  first.wires[0].to.holeId = 'bb1:1a'
  assert.equal(second.parts[2].value.ohm, 220)
  assert.equal(second.wires[0].to.holeId, 'bb1:10a')
  assert.equal(getLessonCircuitDoc('unknown'), null)
})

test('the canonical button-led document is valid and independently cloned', () => {
  const doc = getLessonCircuitDoc('button-led')
  const blink = getLessonCircuitDoc('blink')
  assert.ok(doc)
  assert.equal(doc.schema, 2)
  assert.equal(doc.lessonId, 'button-led')
  assert.deepEqual(doc.breadboards, blink.breadboards)
  assert.deepEqual(doc.parts.slice(0, 4), blink.parts)
  assert.deepEqual(doc.wires.slice(0, 3), blink.wires)
  assert.deepEqual(doc.parts.map(part => part.id), ['board-1', 'bb-1', 'res-1', 'led-1', 'button-1'])
  assert.deepEqual(doc.wires.slice(3).map(wire => wire.id), ['w-input-to-button', 'w-button-to-gnd-rail'])
  assert.deepEqual(doc.expect, { partCount: 5, wireCount: 5, netCount: 4 })
  const ids = [...doc.breadboards, ...doc.parts, ...doc.wires].map(item => item.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(validateCircuitDoc(doc, componentRegistry).filter(issue => issue.severity === 'error'), [])

  const pristine = structuredClone(doc)
  doc.parts[4].mount.col = 1
  doc.wires[3].from.pinId = 'ledOut'
  assert.deepEqual(getLessonCircuitDoc('button-led'), pristine)
  assert.deepEqual(getLessonCircuitDoc('blink'), blink)
})

test('the button-led document has separate input, ground, LED output and LED anode nets', () => {
  const doc = getLessonCircuitDoc('button-led')
  assert.ok(doc)
  const index = createNetIndexV2(doc, componentRegistry)
  const groups = [
    ['board-1:input', 'button-1:contactA', 'bb1:20f', 'bb1:20e'],
    ['board-1:gnd', 'button-1:contactB', 'bb1:22f', 'bb1:22e', 'led-1:cathode'],
    ['board-1:ledOut', 'res-1:a'],
    ['res-1:b', 'led-1:anode'],
  ]
  const nets = groups.map(([first, ...rest]) => {
    const net = index.netOf(first)
    assert.ok(net, `${first} should resolve to a net`)
    for (const key of rest) assert.equal(index.netOf(key), net, `${key} should share ${first}`)
    return net
  })
  assert.equal(new Set(nets).size, 4)
  assert.equal(index.netsList().filter(net => net.endpoints.size > 1 || net.wireIds.size > 0).length, doc.expect.netCount)
})
