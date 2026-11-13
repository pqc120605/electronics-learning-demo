import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let getButtonLedLessonTrace, getButtonLedLessonFrame, getLessonCircuitDoc, getBuilderLesson, getInputAlias, getSimulationTarget, addWire, removeWire

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [trace, fixtures, lessons, targets, edits] = await Promise.all([
    server.ssrLoadModule('/src/lib/buttonLedLessonTrace.ts'),
    server.ssrLoadModule('/src/data/lessonCircuitDocs.ts'),
    server.ssrLoadModule('/src/data/builderLessons.ts'),
    server.ssrLoadModule('/src/data/simulationTargets.ts'),
    server.ssrLoadModule('/src/lib/circuitDocEdits.ts'),
  ])
  ;({ getButtonLedLessonTrace, getButtonLedLessonFrame } = trace)
  ;({ getLessonCircuitDoc } = fixtures)
  ;({ getBuilderLesson, getInputAlias } = lessons)
  ;({ getSimulationTarget } = targets)
  ;({ addWire, removeWire } = edits)
})

after(async () => { await server?.close() })

function context(pressed = false) {
  const target = getSimulationTarget('esp32-devkit')
  return {
    doc: getLessonCircuitDoc('button-led'), pressed, boardId: target.boardId,
    code: getBuilderLesson('button-led').code(target, getInputAlias(target, 'button-led').pin),
  }
}

function assertBlocked(result, status) {
  assert.equal(result.status, status)
  assert.deepEqual(result.events, [])
  assert.equal(result.wireFlows.size, 0)
  assert.equal(result.activeKeys.size, 0)
}

test('maps read and write events to the canonical input and LED path in both input states', () => {
  for (const [pressed, readLevel, branch, outputLevel] of [[false, 'HIGH', 'else', 'LOW'], [true, 'LOW', 'if', 'HIGH']]) {
    const current = context(pressed)
    const result = getButtonLedLessonTrace(current, current)
    assert.equal(result.status, 'ready')
    assert.deepEqual(result.events.map(event => event.kind), ['read', 'branch', 'write'])
    assert.equal(result.events[0].level, readLevel)
    assert.equal(result.events[1].branch, branch)
    assert.equal(result.events[2].level, outputLevel)
    assert.equal(result.wireFlows.get('w-input-to-button').signal, readLevel.toLowerCase())
    assert.equal(result.wireFlows.get('w-gpio-to-resistor').signal, outputLevel.toLowerCase())
    assert.deepEqual([...result.wireFlows.keys()].sort(), current.doc.wires.map(wire => wire.id).sort())
    for (const key of ['board-1:input', 'button-1:contactA', 'button-1:contactB', 'board-1:ledOut', 'res-1:a', 'res-1:b', 'led-1:anode', 'led-1:cathode']) {
      assert.ok(result.activeKeys.has(key), key)
    }
  }
})

test('does not highlight unrelated wires or infer voltage on the resistor output net', () => {
  const original = context()
  const { doc, issues } = addWire(original.doc, { id: 'unrelated-wire', from: { kind: 'hole', holeId: 'bb1:1g' }, to: { kind: 'hole', holeId: 'bb1:2g' } })
  assert.deepEqual(issues.filter(issue => issue.severity === 'error'), [])
  const current = { ...original, doc }
  const result = getButtonLedLessonTrace(current, current)
  assert.equal(result.status, 'ready')
  assert.equal(result.wireFlows.has('unrelated-wire'), false)
  assert.equal(result.activeKeys.has('bb1:1g'), false)
})

test('clears previous results when a draft, topology, or input changes before evaluation', () => {
  const old = context()
  for (const current of [{ ...old, pressed: true }, { ...old, code: old.code.replace('== LOW', '== HIGH') }, { ...old, doc: structuredClone(old.doc) }]) {
    assertBlocked(getButtonLedLessonTrace(current, old), 'stale')
  }
  assertBlocked(getButtonLedLessonTrace(old, null), 'stale')
})

test('rejects malformed code, mismatched profiles, and topology with missing or shorted paths', () => {
  const old = context()
  for (const current of [{ ...old, code: 'unsupported' }, { ...old, boardId: 'arduino-uno-r3' }, { ...old, boardId: 'unregistered-board' }]) {
    assertBlocked(getButtonLedLessonTrace(current, old), 'unsupported')
  }
  const { doc: broken } = removeWire(old.doc, 'w-input-to-button')
  assertBlocked(getButtonLedLessonTrace({ ...old, doc: broken }, old), 'invalid')

  const { doc: shorted, issues } = addWire(old.doc, { id: 'bridge-button-contacts', from: { kind: 'hole', holeId: 'bb1:20h' }, to: { kind: 'hole', holeId: 'bb1:22h' } })
  assert.deepEqual(issues.filter(issue => issue.severity === 'error'), [])
  assertBlocked(getButtonLedLessonTrace({ ...old, doc: shorted }, old), 'invalid')
})

test('projects one read or branch frame onto only the input net, including mounted holes', () => {
  assert.equal(typeof getButtonLedLessonFrame, 'function', 'per-event projection is available')
  for (const pressed of [false, true]) {
    const current = context(pressed)
    for (const step of [0, 1]) {
      const frame = getButtonLedLessonFrame(current, current, step)
      assert.equal(frame.event.kind, step === 0 ? 'read' : 'branch')
      assert.deepEqual([...frame.wireFlows.keys()], ['w-input-to-button'])
      assert.deepEqual([...frame.activePartIds].sort(), ['board-1', 'button-1'])
      for (const key of ['board-1:input', 'button-1:contactA', 'bb1:20g', 'bb1:20f', 'bb1:20e']) assert.ok(frame.activeKeys.has(key), key)
      for (const key of ['board-1:ledOut', 'button-1:contactB', 'led-1:anode', 'board-1:gnd']) assert.equal(frame.activeKeys.has(key), false, key)
      assert.equal(frame.wireFlows.get('w-input-to-button').signal, pressed ? 'low' : 'high')
      assert.equal(frame.wireFlows.get('w-input-to-button').direction, 'none')
    }
  }
})

test('projects the write frame onto only the output and resistor series nets', () => {
  assert.equal(typeof getButtonLedLessonFrame, 'function')
  for (const pressed of [false, true]) {
    const current = context(pressed)
    const frame = getButtonLedLessonFrame(current, current, 2)
    assert.equal(frame.event.kind, 'write')
    assert.deepEqual([...frame.wireFlows.keys()], ['w-gpio-to-resistor'])
    assert.deepEqual([...frame.activePartIds].sort(), ['board-1', 'led-1', 'res-1'])
    for (const key of ['board-1:ledOut', 'res-1:a', 'res-1:b', 'led-1:anode', 'bb1:10a', 'bb1:10c', 'bb1:14c', 'bb1:14d']) assert.ok(frame.activeKeys.has(key), key)
    for (const key of ['board-1:input', 'button-1:contactA', 'led-1:cathode', 'board-1:gnd']) assert.equal(frame.activeKeys.has(key), false, key)
    assert.equal(frame.wireFlows.get('w-gpio-to-resistor').signal, pressed ? 'high' : 'low')
    assert.equal(frame.wireFlows.get('w-gpio-to-resistor').direction, 'none')
  }
})

test('clears every frame highlight for stale, unsupported, invalid, disconnected or out-of-range contexts', () => {
  assert.equal(typeof getButtonLedLessonFrame, 'function')
  const old = context()
  const { doc: disconnected } = removeWire(old.doc, 'w-input-to-button')
  const invalid = { ...old, doc: { ...old.doc, lessonId: 'blink' } }
  for (const [current, requested, step] of [
    [old, null, 0], [{ ...old, pressed: true }, old, 1],
    [{ ...old, code: `${old.code}\n// edited` }, old, 2],
    [{ ...old, boardId: 'arduino-uno-r3' }, old, 0],
    [{ ...old, code: 'unsupported' }, old, 0], [invalid, invalid, 0],
    [{ ...old, doc: disconnected }, old, 0],
    ...[-1, 3, 0.5, NaN, Infinity].map(step => [old, old, step]),
  ]) {
    const frame = getButtonLedLessonFrame(current, requested, step)
    assert.equal(frame.event, null)
    assert.equal(frame.activeKeys.size, 0)
    assert.equal(frame.wireFlows.size, 0)
    assert.equal(frame.activePartIds.size, 0)
  }
})
