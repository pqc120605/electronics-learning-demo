import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, flow, builder, program, targets
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  flow = await server.ssrLoadModule('/src/lib/signalFlow.ts')
  builder = await server.ssrLoadModule('/src/data/builderLessons.ts')
  program = await server.ssrLoadModule('/src/lib/educationalProgram.ts')
  targets = await server.ssrLoadModule('/src/data/simulationTargets.ts')
})
after(async () => { await server?.close() })

const lessonCode = (id) => { const target = targets.getSimulationTarget('esp32-devkit'); return builder.getBuilderLesson(id).code(target, builder.getInputAlias(target, id).pin) }

test('blink highlights the digitalWrite that produced the frame level', () => {
  const code = lessonCode('blink'), lines = code.split('\n')
  const high = flow.activeCodeLine(code, { pin: 23, level: 'HIGH', ledOn: true }, 'blink')
  const low = flow.activeCodeLine(code, { pin: 23, level: 'LOW', ledOn: false }, 'blink')
  assert.match(lines[high - 1], /digitalWrite\(ledPin, HIGH\)/)
  assert.match(lines[low - 1], /digitalWrite\(ledPin, LOW\)/)
})

test('input-branch uses the parser source line of the executed write', () => {
  const code = lessonCode('button-led')
  const parsed = program.parseEducationalProgram(code, 'button-led')
  assert.ok(parsed.ok)
  for (const pressed of [true, false]) {
    const frame = program.evaluateProgram(parsed.program, { pressed })
    assert.ok(frame.events.find(event => event.kind === 'write').line, 'parser must report the write line')
    const line = flow.activeCodeLine(code, frame, 'button-led')
    assert.match(code.split('\n')[line - 1], new RegExp(`digitalWrite\\(ledPin, ${pressed ? 'HIGH' : 'LOW'}\\)`))
  }
})

test('ultrasonic never highlights the TRIG pulse as the output write', () => {
  const code = lessonCode('ultrasonic-distance')
  const line = flow.activeCodeLine(code, { pin: 23, level: 'HIGH', ledOn: true }, 'ultrasonic-distance')
  assert.match(code.split('\n')[line - 1], /digitalWrite\(ledPin, HIGH\)/)
})

test('concept lessons are marked illustrative and get no code line', () => {
  for (const id of ['buck-boost-concept', 'dc-motor-driver', 'mosfet-switch']) {
    assert.equal(flow.isIllustrativeLesson(id), true)
    assert.equal(flow.activeCodeLine('x', { level: 'HIGH' }, id), undefined)
  }
  assert.match(flow.describeSignalFrame({ motor: { direction: 'Thuận chiều', enabled: true, pwm: 65 } }, 'dc-motor-driver'), /^\[minh họa\]/)
})

test('serial log appends only on change and keeps the newest lines', () => {
  let log = []
  log = flow.appendSerial(log, 0, 'a')
  const same = flow.appendSerial(log, 100, 'a')
  assert.equal(same, log)
  for (let index = 0; index < 20; index += 1) log = flow.appendSerial(log, index, `e${index}`, 5)
  assert.deepEqual(log.map(entry => entry.text), ['e15', 'e16', 'e17', 'e18', 'e19'])
  assert.equal(flow.describeSignalFrame({ pin: 23, level: 'HIGH', ledOn: true }, 'blink'), 'digitalWrite(23, HIGH) · LED sáng')
})

test('legend lists each labelled net once', () => {
  const flows = new Map([['w1', { signal: 'power', label: '5V', direction: 'none' }], ['w2', { signal: 'power', label: '5V', direction: 'none' }], ['w3', { signal: 'high', label: 'HIGH', direction: 'forward' }], ['w4', { signal: 'active', direction: 'none' }]])
  assert.deepEqual(flow.flowLegend(flows).map(row => row.label), ['5V', 'HIGH'])
})
