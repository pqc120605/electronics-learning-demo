import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, circuits, profiles, validator, diagram, schematic, assembly
before(async () => {
  server = await createServer({ logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  ;[circuits, profiles, validator, diagram, schematic, assembly] = await Promise.all([
    'lib/freestyle/freestyleCircuit', 'data/kitPartProfiles', 'lib/circuitDocV2', 'lib/breadboardDiagram',
    'lib/schematicLayoutV2', 'lib/freestyle/freestyleAssembly',
  ].map(name => server.ssrLoadModule(`/src/${name}.ts`)))
})
after(async () => { await server?.close() })

const boardId = 'arduino-uno-r3'
const pin = (partId, pinId) => ({ kind: 'pin', partId, pinId })

test('new parts use sourced pin labels and add only 2D geometry', () => {
  for (const type of ['dht11', 'dht22-bare', 'keypad-4x4', 'seven-segment-anode']) {
    const profile = profiles.getKitPartProfile(type)
    assert.match(profile.url, /^https:\/\//)
    assert.ok(profile.revision)
    const { doc, partId } = circuits.placePart(circuits.createEmptyFreestyleDoc(), type)
    assert.ok(partId, type)
    const issues = validator.validateCircuitDoc(doc)
    assert.deepEqual(issues.filter(issue => issue.severity === 'error'), [])
    assert.equal(diagram.buildBreadboardDiagram(doc).parts.find(part => part.id === partId).pins.length, profile.pins.length)
    assert.equal(schematic.layoutSchematicV2(doc).parts.find(part => part.partId === partId).symbolKind, 'kit-module')
    assert.ok(!assembly.freestyleAssembly(doc, boardId, circuits.getFreestyleBoard(boardId).defaultPins).placements.some(part => part.partId === partId))
  }
  assert.deepEqual(profiles.getKitPartProfile('dht11').pins.map(pin => pin.physicalPin), [1, 2, 4])
  assert.deepEqual(profiles.getKitPartProfile('dht22-bare').pins.map(pin => pin.physicalPin), [1, 2, 4])
})

test('keypad closes only the chosen row and column in the educational circuit', () => {
  const placement = circuits.placePart(circuits.createEmptyFreestyleDoc(), 'keypad-4x4')
  const id = placement.partId
  let doc = circuits.addFreestyleWire(placement.doc, pin('board', 'gnd'), pin(id, 'r2'), 'ground')
  doc = circuits.addFreestyleWire(doc, pin('board', 'input'), pin(id, 'c2'))
  const { defaultPins } = circuits.getFreestyleBoard(boardId)
  const read = controls => circuits.evaluateFreestyleCircuit(doc, defaultPins, { [defaultPins.input]: { mode: 'input_pullup', level: true } }, controls).inputs.find(entry => entry.pin === defaultPins.input).digital
  assert.equal(read({}), true)
  assert.equal(read({ [id]: 5 }), false)
  assert.equal(read({ [id]: 6 }), true)
  assert.equal(profiles.keypadContact(16), null)
})

test('common-anode segment lights with a low output and the cathode model stays separate', () => {
  const placement = circuits.placePart(circuits.createEmptyFreestyleDoc(), 'seven-segment-anode')
  const id = placement.partId
  let doc = circuits.addFreestyleWire(placement.doc, pin('board', 'vcc'), pin(id, 'com2'), 'power')
  doc = circuits.addFreestyleWire(doc, pin('board', 'ledOut'), pin(id, 'a'))
  const { defaultPins } = circuits.getFreestyleBoard(boardId)
  const lit = level => circuits.evaluateFreestyleCircuit(doc, defaultPins, { [defaultPins.ledOut]: { mode: 'output', level } }, {}).outputs.find(entry => entry.partId === id).lit
  assert.deepEqual(lit(false), ['a'])
  assert.deepEqual(lit(true), [])
  assert.equal(profiles.getKitPartProfile('seven-segment').pins.find(pin => pin.id === 'com1').role, 'ground')
})
