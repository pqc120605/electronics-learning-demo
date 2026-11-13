import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let evaluateProgram, parseEducationalProgram, getBuilderLesson, getInputAlias, getSimulationTarget

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const [programs, lessons, targets] = await Promise.all([
    server.ssrLoadModule('/src/lib/educationalProgram.ts'),
    server.ssrLoadModule('/src/data/builderLessons.ts'),
    server.ssrLoadModule('/src/data/simulationTargets.ts'),
  ])
  ;({ evaluateProgram, parseEducationalProgram } = programs)
  ;({ getBuilderLesson, getInputAlias } = lessons)
  ;({ getSimulationTarget } = targets)
})

after(async () => { await server?.close() })

function sample(lesson, boardId = 'esp32-devkit') {
  const target = getSimulationTarget(boardId)
  return getBuilderLesson(lesson).code(target, getInputAlias(target, lesson).pin)
}

function parse(source, lesson, boardId) {
  const result = parseEducationalProgram(source, lesson, boardId)
  assert.equal(result.ok, true, result.message)
  return result.program
}

test('button press and release produce ordered events and preserve the localized trace', () => {
  const program = parse(sample('button-led'), 'button-led')
  const released = evaluateProgram(program, { pressed: false })
  assert.deepEqual(released.events, [
    { kind: 'read', pin: 18, level: 'HIGH', line: 10 },
    { kind: 'branch', condition: 'LOW', level: 'HIGH', branch: 'else', line: 10 },
    { kind: 'write', pin: 23, level: 'LOW', line: 13 },
  ])
  assert.deepEqual(released.trace, [
    'digitalRead(GPIO 18) → HIGH từ đầu vào ảo.',
    'So sánh với LOW → sai; nhánh else đặt LED LOW.',
  ])
  const pressed = evaluateProgram(program, { pressed: true })
  assert.deepEqual(pressed.events, [
    { kind: 'read', pin: 18, level: 'LOW', line: 10 },
    { kind: 'branch', condition: 'LOW', level: 'LOW', branch: 'if', line: 10 },
    { kind: 'write', pin: 23, level: 'HIGH', line: 11 },
  ])
  assert.deepEqual(pressed.trace, [
    'digitalRead(GPIO 18) → LOW từ đầu vào ảo.',
    'So sánh với LOW → đúng; nhánh if đặt LED HIGH.',
  ])
  assert.equal(released.ledOn, false)
  assert.equal(pressed.ledOn, true)
})

test('reversing the comparison keeps the sampled level and reverses the branch on the selected board', () => {
  const boardId = 'arduino-uno-r3'
  const code = sample('button-led', boardId).replace('== LOW', '== HIGH')
  const program = parse(code, 'button-led', boardId)
  for (const [pressed, level, branch, output, line] of [
    [false, 'HIGH', 'if', 'HIGH', 11],
    [true, 'LOW', 'else', 'LOW', 13],
  ]) {
    assert.deepEqual(evaluateProgram(program, { pressed }).events, [
      { kind: 'read', pin: 2, level, line: 10 },
      { kind: 'branch', condition: 'HIGH', level, branch, line: 10 },
      { kind: 'write', pin: 13, level: output, line },
    ])
  }
})

test('IR input retains active-low behavior and uses distinct source lines for read and condition', () => {
  const program = parse(sample('ir-alert'), 'ir-alert', 'esp32-devkit')
  for (const [detected, level, branch, output, line] of [
    [false, 'HIGH', 'else', 'LOW', 14],
    [true, 'LOW', 'if', 'HIGH', 12],
  ]) {
    assert.deepEqual(evaluateProgram(program, { detected }).events, [
      { kind: 'read', pin: 18, level, line: 10 },
      { kind: 'branch', condition: 'LOW', level, branch, line: 11 },
      { kind: 'write', pin: 23, level: output, line },
    ])
  }
})

test('source lines refer to the original code across CRLF, comments, and a split condition', () => {
  const code = sample('button-led')
    .replace('if (digitalRead', 'if (\n    /* digitalWrite(ledPin, HIGH);\n    ignored */\n    digitalRead')
    .replace('digitalWrite(ledPin, LOW);', 'digitalWrite(ledPin, LOW); // digitalRead(buttonPin)')
    .replaceAll('\n', '\r\n')
  const program = parse(code, 'button-led')
  assert.deepEqual(evaluateProgram(program, { pressed: false }).events, [
    { kind: 'read', pin: 18, level: 'HIGH', line: 13 },
    { kind: 'branch', condition: 'LOW', level: 'HIGH', branch: 'else', line: 10 },
    { kind: 'write', pin: 23, level: 'LOW', line: 16 },
  ])
})

test('the two-argument parser keeps custom input aliases while explicit profiles require their registered aliases', () => {
  const code = sample('button-led').replace('buttonPin = 18', 'buttonPin = 17')
  const program = parse(code, 'button-led')
  assert.equal(program.inputPin, 17)
  assert.deepEqual(evaluateProgram(program, { pressed: true }).events[0], {
    kind: 'read', pin: 17, level: 'LOW', line: 10,
  })
  for (const boardId of ['esp32-devkit', 'unregistered-board']) {
    const result = parseEducationalProgram(code, 'button-led', boardId)
    assert.equal(result.ok, false, boardId)
    assert.equal(Object.hasOwn(result, 'program'), false)
  }
})

test('a line comment continued across a newline cannot hide the parsed input branch', () => {
  for (const newline of ['\n', '\r\n']) {
    const code = sample('button-led')
      .replace('  if (', '  // This comment hides the condition in C++ ' + '\\' + '\n  if (')
      .replaceAll('\n', newline)
    const result = parseEducationalProgram(code, 'button-led', 'esp32-devkit')
    assert.equal(result.ok, false)
    assert.equal(Object.hasOwn(result, 'program'), false)
  }
})

test('malformed patterns, unsupported syntax and unsupported profiles cannot produce a program', () => {
  const code = sample('button-led')
  const invalid = [
    [code.replace('== LOW', '!= LOW'), 'button-led'],
    [code.replace('digitalRead(buttonPin)', 'digitalRead(ledPin)'), 'button-led'],
    [code.replace('delay(20);', 'delay(20)'), 'button-led'],
    [code.replace('digitalWrite(ledPin, HIGH);', 'digitalWrite(ledPin, HIGH)'), 'button-led'],
    [code.replace('delay(20);', 'Serial.println(buttonPin);'), 'button-led'],
    [code, 'unregistered-lesson'],
    [code, 'button-led', 'unregistered-board'],
    [code, 'button-led', 'arduino-uno-r3'],
    [code.replace('buttonPin = 18', 'buttonPin = 999'), 'button-led', 'esp32-devkit'],
    [sample('seven-segment-counter'), 'unregistered-lesson'],
  ]
  for (const args of invalid) {
    const result = parseEducationalProgram(...args)
    assert.equal(result.ok, false, `Expected rejection for ${args[1]}/${args[2] ?? 'any'}:\n${args[0]}`)
    assert.equal(Object.hasOwn(result, 'program'), false)
  }
})

test('existing non-input programs keep their output and trace without input events', () => {
  const program = parse(sample('blink'), 'blink')
  assert.deepEqual(evaluateProgram(program, { elapsedMs: 0 }), {
    pin: 23, level: 'HIGH', ledOn: true, digit: 0,
    trace: ['GPIO 23 → HIGH', `Giữ trạng thái ${program.onMs} ms theo delay trong code.`],
  })
})
