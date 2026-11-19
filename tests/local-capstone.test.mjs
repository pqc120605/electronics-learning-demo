import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite, capstone, validateCircuitDoc, layoutSchematicV2
before(async () => {
  vite = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  capstone = await vite.ssrLoadModule('/src/lib/localCapstone.ts')
  ;({ validateCircuitDoc } = await vite.ssrLoadModule('/src/lib/circuitDocV2.ts'))
  ;({ layoutSchematicV2 } = await vite.ssrLoadModule('/src/lib/schematicLayoutV2.ts'))
})
after(async () => { await vite?.close() })

function settings(boardId = 'arduino-uno-r3', changes = {}) {
  return { boardId, threshold: 50, inputPercent: 51, pressed: true, gndConnected: true, ...changes }
}

test('project skills require matching predictions, exact board and threshold, and repair in order', () => {
  const sample = (changes = {}, prediction = 'off') => {
    const context = settings('arduino-uno-r3', changes)
    return { ...context, prediction, result: capstone.observeCapstone(context) }
  }
  const released = sample({ pressed: false })
  const boundary = sample({ inputPercent: 50 })
  const wrongFaultGuess = sample({ gndConnected: false }, 'on')
  const fault = sample({ gndConnected: false })
  const fixed = sample({}, 'on')
  const report = { ...capstone.emptyCapstone(), settings: settings() }
  const progress = observations => capstone.getCapstoneSkillSteps({ ...report, observations })
  assert.deepEqual(progress([released, boundary, wrongFaultGuess, fixed]).map(step => step.verified), [true, true, false])
  assert.deepEqual(progress([released, boundary, fixed, fault]).map(step => step.verified), [true, true, false])
  assert.deepEqual(progress([released, boundary, fault, fixed]).map(step => step.verified), [true, true, true])
  assert.equal(capstone.getCapstoneSkillSteps({ ...report, settings: settings('arduino-nano'), observations: [released, boundary, fault, fixed] }).some(step => step.verified), false)
  assert.equal(capstone.getCapstoneSkillSteps({ ...report, settings: settings('arduino-uno-r3', { threshold: 51 }), observations: [released, boundary, fault, fixed] }).some(step => step.verified), false)
})

test('each projected board has valid connected and disconnected topologies and exact code aliases', () => {
  assert.equal(capstone.getCapstoneCircuit(settings('esp32-devkit')), null)
  for (const [boardId, analogPin] of [['arduino-uno-r3', 14], ['arduino-nano', 14], ['arduino-mega-2560', 54]]) {
    const good = capstone.getCapstoneCircuit(settings(boardId))
    const faulty = capstone.getCapstoneCircuit(settings(boardId, { gndConnected: false }))
    assert.deepEqual([good.pinMap.ledOut, good.pinMap.trig, good.pinMap.input], [9, 2, analogPin])
    for (const circuit of [good, faulty]) assert.deepEqual(validateCircuitDoc(circuit.doc).filter(issue => issue.severity === 'error'), [])
    assert.equal(good.doc.wires.length, faulty.doc.wires.length + 1)
    assert.match(good.code, /LED_PIN = 9;[\s\S]+BUTTON_PIN = 2;[\s\S]+SENSOR_PIN = A0;[\s\S]+TRIP_ADC = 512;/)
    const layout = layoutSchematicV2(good.doc)
    const sensor = layout.parts.find(part => part.partId === good.sensorId)
    assert.equal(sensor.symbolKind, 'potentiometer')
    assert.deepEqual(sensor.terminals.map(terminal => [terminal.key.split(':').at(-1), terminal.x - sensor.x, terminal.y - sensor.y]), [['vcc', 0, -50], ['wiper', 56, 0], ['gnd', 0, 50]])
    assert.ok(layout.nets.some(net => net.endpoints.includes(`${good.sensorId}:wiper`) && net.endpoints.includes('board:input')))
    assert.ok(layout.nets.some(net => net.endpoints.includes(`${good.sensorId}:vcc`) && net.endpoints.includes('board:vcc')))
    assert.ok(layout.nets.some(net => net.endpoints.includes(`${good.sensorId}:gnd`) && net.endpoints.includes('board:gnd')))
  }
})

test('watch the exact threshold, switch state, and broken return through circuit nets', () => {
  const observed = changes => capstone.observeCapstone(settings('arduino-uno-r3', changes))
  assert.deepEqual([49, 50, 51].map(inputPercent => observed({ inputPercent }).ledOn), [false, false, true])
  assert.equal(observed({ pressed: false }).ledOn, false)
  const fault = observed({ gndConnected: false })
  assert.equal(fault.buttonHigh, true)
  assert.equal(fault.inputAdc, 522)
  assert.equal(fault.ledOn, false)
  assert.equal(observed({}).buttonHigh, false)
  assert.ok(observed({}).activeWireIds.length > 0)
})

test('portable report preserves notes, board, circuit, code and reproducible results', () => {
  const context = settings('arduino-mega-2560')
  const observation = { ...context, prediction: 'off', result: capstone.observeCapstone(context) }
  const report = { ...capstone.emptyCapstone(), settings: { ...context, inputPercent: 21 }, notes: '<b>Gắn lại GND</b>', observations: [observation] }
  const file = capstone.encodeCapstone(report)
  const parsed = capstone.decodeCapstone(file)
  assert.deepEqual(parsed, { ok: true, report })
  const bundle = JSON.parse(file)
  assert.equal(bundle.artifacts.code, capstone.getCapstoneCircuit(report.settings).code)
  assert.deepEqual(bundle.artifacts.doc, capstone.getCapstoneCircuit(report.settings).doc)

  const tampered = (edit) => {
    const copy = JSON.parse(file)
    edit(copy)
    return capstone.decodeCapstone(JSON.stringify(copy))
  }
  assert.equal(tampered(copy => { copy.report.observations[0].result.ledOn = false }).ok, false)
  assert.equal(tampered(copy => { copy.artifacts.doc.wires.pop() }).ok, false)
  assert.equal(tampered(copy => { copy.artifacts.code += '// changed' }).ok, false)
  assert.equal(tampered(copy => { copy.version += 1 }).ok, false)
  assert.equal(tampered(copy => { copy.report.settings.boardId = 'unknown' }).ok, false)
  assert.equal(tampered(copy => { copy.report.projectId = 'unknown' }).ok, false)
  const duplicated = capstone.decodeCapstone(capstone.encodeCapstone({ ...report, projectId: capstone.newCapstoneId() }))
  assert.equal(duplicated.ok, true)
  assert.notEqual(duplicated.report.projectId, report.projectId)
  assert.deepEqual(duplicated.report.observations, report.observations)
  assert.equal(capstone.decodeCapstone('[').ok, false)
})
