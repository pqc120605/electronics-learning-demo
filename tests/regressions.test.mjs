import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

function memoryStorage(initial = {}, failOn) {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => { if (failOn?.(key)) throw new DOMException('full', 'QuotaExceededError'); data.set(key, String(value)) },
    removeItem: (key) => { data.delete(key) },
    keys: () => [...data.keys()],
  }
}

const workspace = (lesson = 'blink') => ({
  schemaVersion: 4,
  placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }],
  wires: [],
  simBoard: 'esp32-devkit',
  lesson,
})
const bundle = (overrides = {}) => ({ format: 'mach-mo-project', version: 1, exportedAt: '2026-11-01T00:00:00.000Z', workspace: workspace(), lessonDrafts: {}, branchSession: {}, branchDrafts: {}, ...overrides })
const blink = (loop, setup = 'pinMode(ledPin, OUTPUT);') => `const int ledPin = 23;\nvoid setup() {\n  ${setup}\n}\nvoid loop() {\n  ${loop}\n}`

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const loaded = await Promise.all(['/src/data/builderLessons.ts', '/src/data/simulationTargets.ts', '/src/lib/educationalProgram.ts', '/src/lib/educationalSimulator.ts', '/src/lib/circuitValidation.ts', '/src/lib/simulationProviders.ts', '/src/lib/arduinoSketchExport.ts', '/src/lib/projectBundle.ts', '/src/lib/savedProjects.ts', '/src/lib/workspaceEntry.ts', '/src/lib/workspaceStorage.ts'].map((path) => server.ssrLoadModule(path)))
  m = Object.assign({}, ...loaded)
})

after(async () => { await server?.close() })

// H1, H2
test('a lesson deep link uses a guided session and never seeds over saved guided work', () => {
  assert.deepEqual(m.planWorkspaceEntry({ requestedLesson: 'blink', hasSavedWorkspace: true, savedBoard: 'esp32-devkit' }), { guided: true, seedLesson: undefined, board: 'esp32-devkit', pendingBoard: undefined })
  assert.deepEqual(m.planWorkspaceEntry({ requestedLesson: 'blink', hasSavedWorkspace: false, savedBoard: 'esp32-devkit', requestedBoard: 'arduino-uno-r3' }), { guided: true, seedLesson: 'blink', board: 'arduino-uno-r3', pendingBoard: undefined })
})

test('a board link keeps the saved main workspace and only offers the board change', () => {
  assert.deepEqual(m.planWorkspaceEntry({ requestedBoard: 'arduino-uno-r3', hasSavedWorkspace: true, savedBoard: 'esp32-devkit' }), { guided: false, seedLesson: undefined, board: 'esp32-devkit', pendingBoard: 'arduino-uno-r3' })
  assert.deepEqual(m.planWorkspaceEntry({ requestedBoard: 'arduino-uno-r3', hasSavedWorkspace: false, savedBoard: 'esp32-devkit' }), { guided: false, seedLesson: undefined, board: 'arduino-uno-r3', pendingBoard: undefined })
  assert.equal(m.planWorkspaceEntry({ requestedBoard: 'esp32-devkit', hasSavedWorkspace: true, savedBoard: 'esp32-devkit' }).pendingBoard, undefined)
})

// H3
test('blink parser rejects loops whose order the educational model cannot represent', () => {
  for (const loop of [
    'digitalWrite(ledPin, HIGH);\n  digitalWrite(ledPin, LOW);\n  delay(100);\n  delay(900);',
    'delay(100);\n  digitalWrite(ledPin, HIGH);\n  delay(900);\n  digitalWrite(ledPin, LOW);',
    'digitalWrite(ledPin, HIGH);\n  delay(100);\n  digitalWrite(ledPin, LOW);\n  delay(100);\n  ledPin = 5;',
  ]) {
    const parsed = m.parseEducationalProgram(blink(loop), 'blink')
    assert.equal(parsed.ok, false, loop)
    assert.match(parsed.message, /thứ tự|ghi mức/i)
  }
  assert.equal(m.parseEducationalProgram(blink('digitalWrite(ledPin, HIGH);\n  delay(100);\n  digitalWrite(ledPin, LOW);\n  delay(900);'), 'blink').ok, true)
})

test('parser rejects output logic placed in setup', () => {
  const parsed = m.parseEducationalProgram(blink('', 'pinMode(ledPin, OUTPUT);\n  digitalWrite(ledPin, HIGH);\n  delay(100);\n  digitalWrite(ledPin, LOW);\n  delay(100);'), 'blink')
  assert.equal(parsed.ok, false)
  assert.match(parsed.message, /setup\(\)/)
})

test('parser reports non-string sources instead of throwing', () => {
  assert.equal(m.parseEducationalProgram(123, 'button-led').ok, false)
})

test('button lesson requires INPUT_PULLUP because the preset has no external resistor', () => {
  const target = m.getSimulationTarget('esp32-devkit')
  const sample = m.getBuilderLesson('button-led').code(target, m.getInputAlias(target, 'button-led').pin)
  assert.equal(m.parseEducationalProgram(sample, 'button-led').ok, true)
  assert.equal(m.parseEducationalProgram(sample.replace('INPUT_PULLUP', 'INPUT'), 'button-led').ok, false)
})

// H4
test('analog samples scale with long arithmetic for the verified ADC range of each board', () => {
  for (const [boardId, fullScale] of [['arduino-uno-r3', 1023], ['arduino-nano-classic', 1023], ['arduino-mega-2560-r3', 1023], ['esp32-devkit', 4095]]) {
    const target = m.getSimulationTarget(boardId)
    for (const id of ['analog-potentiometer', 'analog-ldr']) {
      const source = m.getBuilderLesson(id).code(target, m.getInputAlias(target, id).pin)
      assert.match(source, new RegExp(`map\\(analogRead\\([a-zA-Z]+\\), 0, ${fullScale}, 0, 100\\)`))
      const parsed = m.parseEducationalProgram(source, id)
      assert.equal(parsed.ok, true, parsed.message)
      assert.equal(parsed.program.adcFullScale, fullScale)
      assert.equal(m.findProgramTargetMismatch(parsed.program, target, id), undefined)
    }
  }
})

test('analog parser rejects the overflow-prone expression and unscaled reads', () => {
  const target = m.getSimulationTarget('arduino-uno-r3')
  const sample = m.getBuilderLesson('analog-potentiometer').code(target, m.getInputAlias(target, 'analog-potentiometer').pin)
  const legacy = m.parseEducationalProgram(sample.replace('map(analogRead(potPin), 0, 1023, 0, 100)', 'analogRead(potPin) * 100 / 1023'), 'analog-potentiometer')
  assert.equal(legacy.ok, false)
  assert.match(legacy.message, /tràn|map\(/)
  assert.equal(m.parseEducationalProgram(sample.replace('map(analogRead(potPin), 0, 1023, 0, 100)', 'analogRead(potPin)'), 'analog-potentiometer').ok, false)
})

test('an ADC scale that does not match the board is reported as a mismatch', () => {
  const uno = m.getSimulationTarget('arduino-uno-r3')
  const sample = m.getBuilderLesson('analog-ldr').code(uno, m.getInputAlias(uno, 'analog-ldr').pin)
  const parsed = m.parseEducationalProgram(sample.replace('1023', '4095'), 'analog-ldr')
  assert.match(m.findProgramTargetMismatch(parsed.program, uno, 'analog-ldr'), /ADC/)
})

test('analog lessons are locked on boards without a verified ADC range', () => {
  for (const boardId of ['raspberry-pi-pico', 'stm32-nucleo', 'arduino-uno-r4-minima']) {
    const support = m.getLessonBoardSupport(m.getSimulationTarget(boardId), 'analog-potentiometer')
    assert.equal(support.supported, false, boardId)
    assert.match(support.reason, /ADC/)
    assert.equal(m.resolveSimulationProvider(boardId, 'analog-potentiometer').available, false)
    assert.match(m.resolveSimulationProvider(boardId, 'analog-potentiometer').message, /ADC/)
  }
  assert.equal(m.resolveSimulationProvider('esp32-devkit', 'analog-ldr').available, true)
})

// H5
test('LED output depends on the circuit while GPIO state follows the program', () => {
  assert.deepEqual(m.deriveOutputState({ active: true, gpioHigh: true, ledOn: true, circuitValid: false }), { gpioHigh: true, ledLit: false })
  assert.deepEqual(m.deriveOutputState({ active: true, gpioHigh: true, ledOn: true, circuitValid: true }), { gpioHigh: true, ledLit: true })
  assert.deepEqual(m.deriveOutputState({ active: false, gpioHigh: true, ledOn: true, circuitValid: true }), { gpioHigh: false, ledLit: false })
})

test('a reversed LED is reported as polarity, not as a missing resistor', () => {
  const parts = [{ id: 'board-1', type: 'board', x: 1, y: 1 }, { id: 'led-1', type: 'led', x: 1, y: 1 }, { id: 'res-1', type: 'resistor', x: 1, y: 1 }]
  const wire = (id, a, ap, b, bp) => ({ id, from: { partId: a, pinId: ap }, to: { partId: b, pinId: bp } })
  const codes = m.validateCircuit({ parts, wires: [wire('1', 'board-1', 'ledOut', 'res-1', 'a'), wire('2', 'res-1', 'b', 'led-1', 'cathode'), wire('3', 'led-1', 'anode', 'board-1', 'gnd')] }, 'blink').filter((item) => item.severity === 'error').map((item) => item.code)
  assert.ok(!codes.some((code) => code.startsWith('led-no-series-resistor')), codes.join())
  assert.ok(codes.length > 0)
})

// H6
test('saving keeps projects the current version cannot read', () => {
  const storage = memoryStorage()
  m.addSavedProject('A', m.parseProjectBundle(bundle()), storage)
  const stored = JSON.parse(storage.getItem(m.SAVED_PROJECTS_KEY))
  const future = { ...stored[0], id: 'future', name: 'Tương lai', bundle: { ...stored[0].bundle, version: 2 } }
  storage.setItem(m.SAVED_PROJECTS_KEY, JSON.stringify([...stored, future]))

  assert.deepEqual(m.readSavedProjects(storage).map((item) => item.name), ['A'])
  assert.equal(m.readSavedProjectLibrary(storage).unreadable.length, 1)
  m.addSavedProject('B', m.parseProjectBundle(bundle()), storage)
  m.removeSavedProject(m.readSavedProjects(storage).find((item) => item.name === 'A').id, storage)
  const after = JSON.parse(storage.getItem(m.SAVED_PROJECTS_KEY))
  assert.deepEqual(after.map((item) => item.name).sort(), ['B', 'Tương lai'])
  assert.equal(after.find((item) => item.id === 'future').bundle.version, 2)
})

test('saving keeps a project revision that can no longer be parsed', () => {
  const storage = memoryStorage()
  const saved = m.addSavedProject('A', m.parseProjectBundle(bundle()), storage)
  const stored = JSON.parse(storage.getItem(m.SAVED_PROJECTS_KEY))
  stored[0].revisions = [{ id: 'old', updatedAt: '2026-01-01', bundle: { version: 9 } }]
  storage.setItem(m.SAVED_PROJECTS_KEY, JSON.stringify(stored))
  m.updateSavedProjectTags(saved.id, ['x'], storage)
  assert.equal(JSON.parse(storage.getItem(m.SAVED_PROJECTS_KEY))[0].unreadableRevisions[0].id, 'old')
})

test('damaged library JSON is backed up before the next save', () => {
  const storage = memoryStorage({ [m.SAVED_PROJECTS_KEY]: '[{"broken"' })
  assert.equal(m.readSavedProjectLibrary(storage).damaged, true)
  m.addSavedProject('Mới', m.parseProjectBundle(bundle()), storage)
  const backup = storage.keys().find((key) => key.startsWith(`${m.SAVED_PROJECTS_KEY}-damaged-`))
  assert.equal(storage.getItem(backup), '[{"broken"')
})

test('a save that cannot back up damaged data leaves it untouched', () => {
  const storage = memoryStorage({ [m.SAVED_PROJECTS_KEY]: 'oops' }, (key) => key.includes('-damaged-'))
  assert.throws(() => m.addSavedProject('Mới', m.parseProjectBundle(bundle()), storage), /sao lưu/)
  assert.equal(storage.getItem(m.SAVED_PROJECTS_KEY), 'oops')
})

test('a full browser storage produces a Vietnamese error and keeps existing data', () => {
  const storage = memoryStorage({}, (key) => key === m.SAVED_PROJECTS_KEY)
  assert.throws(() => m.addSavedProject('A', m.parseProjectBundle(bundle()), storage), /bộ nhớ trình duyệt/i)
})

test('opening a project keeps a recovery copy of the current workspace', () => {
  const current = { ...workspace('button-led'), code: 'draft cũ' }
  const storage = memoryStorage({ 'machmo-builder-session': JSON.stringify(current) })
  m.restoreSavedProject({ id: 'p', name: 'P', bundle: m.parseProjectBundle(bundle()) }, storage)
  const recovery = JSON.parse(storage.getItem('machmo-draft-recovery'))
  assert.equal(recovery.workspace.code, 'draft cũ')
})

// H7
test('bundle validation rejects drafts with the wrong type or size', () => {
  assert.throws(() => m.parseProjectBundle(bundle({ branchDrafts: { 'button-led': 123 } })), /nháp/)
  assert.throws(() => m.parseProjectBundle(bundle({ lessonDrafts: { blink: { 'esp32-devkit': 5 } } })), /nháp/)
  assert.throws(() => m.parseProjectBundle(bundle({ workspace: { ...workspace(), code: 42 } })), /code/i)
  assert.throws(() => m.parseProjectBundle(bundle({ workspace: { ...workspace(), code: 'x'.repeat(300_000) } })), /giới hạn/)
  assert.throws(() => m.parseProjectBundle(bundle({ workspace: { ...workspace(), placed: [{ id: 'b', type: 'board', x: 1, y: 1, rotation: 'x' }] } })), /linh kiện/)
})

test('quarantine moves workspace data aside without touching saved projects', () => {
  const local = memoryStorage({ 'machmo-builder-session': '{"a":1}', 'machmo-branch-session': '{}', 'machmo-lesson-drafts': '{}', 'machmo-saved-projects': '[1]' })
  const session = memoryStorage({ 'machmo-guided-workspace-blink': '{"b":2}', other: 'x' })
  m.quarantineWorkspaceData(local, session, 123)
  assert.equal(local.getItem('machmo-builder-session'), null)
  assert.equal(local.getItem('machmo-builder-session-recovery-123'), '{"a":1}')
  assert.equal(local.getItem('machmo-saved-projects'), '[1]')
  assert.equal(session.getItem('machmo-guided-workspace-blink'), null)
  assert.equal(session.getItem('machmo-guided-workspace-blink-recovery-123'), '{"b":2}')
  assert.equal(session.getItem('other'), 'x')
})

test('repeated recovery of the same damaged data keeps one backup', () => {
  const storage = memoryStorage({ 'machmo-builder-session': 'hỏng' })
  m.backupDamagedValue(storage, 'machmo-builder-session', 'hỏng', 1)
  m.backupDamagedValue(storage, 'machmo-builder-session', 'hỏng', 2)
  assert.equal(storage.keys().filter((key) => key.includes('-recovery-')).length, 1)
  m.backupDamagedValue(storage, 'machmo-builder-session', 'khác', 3)
  assert.equal(storage.keys().filter((key) => key.includes('-recovery-')).length, 2)
})

test('quarantine keeps originals when the backup fails', () => {
  const local = memoryStorage({ 'machmo-builder-session': '{}' }, (key) => key.includes('-recovery-'))
  assert.throws(() => m.quarantineWorkspaceData(local, memoryStorage(), 1), /sao lưu/)
  assert.equal(local.getItem('machmo-builder-session'), '{}')
})

// H8
test('seven-segment pins avoid ESP32 flash, strapping, UART and input-only GPIO', () => {
  const pins = m.getSimulationTarget('esp32-devkit').sevenSegmentPins
  assert.equal(pins.length, 7)
  const forbidden = new Set([0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 15, 34, 35, 36, 37, 38, 39])
  assert.deepEqual(pins.filter((pin) => forbidden.has(pin)), [])
  assert.equal(m.getSimulationTarget('esp32-devkit').codePin, 23)
  assert.ok(!pins.includes(23))
})

test('seven-segment sample uses board pins and is locked without a verified map', () => {
  const esp32 = m.getSimulationTarget('esp32-devkit')
  const uno = m.getSimulationTarget('arduino-uno-r3')
  const sample = (target) => m.getBuilderLesson('seven-segment-counter').code(target, 0)
  assert.match(sample(esp32), new RegExp(`\\{${esp32.sevenSegmentPins.join(', ')}\\}`))
  assert.match(sample(uno), /\{2, 3, 4, 5, 6, 7, 8\}/)
  const parsed = m.parseEducationalProgram(sample(esp32), 'seven-segment-counter')
  assert.equal(m.findProgramTargetMismatch(parsed.program, esp32, 'seven-segment-counter'), undefined)
  const oldPins = m.parseEducationalProgram(sample(uno), 'seven-segment-counter')
  assert.match(m.findProgramTargetMismatch(oldPins.program, esp32, 'seven-segment-counter'), /GPIO|chân/)
  assert.equal(m.getLessonBoardSupport(m.getSimulationTarget('raspberry-pi-pico'), 'seven-segment-counter').supported, false)
  assert.equal(m.getLessonBoardSupport(esp32, 'seven-segment-counter').supported, true)
})

test('lessons are locked when an input alias collides with the LED pin', () => {
  for (const [boardId, lessonId] of [['raspberry-pi-pico', 'ultrasonic-distance'], ['raspberry-pi-pico-w', 'ultrasonic-distance'], ['raspberry-pi-pico-2', 'ultrasonic-distance'], ['esp32-s3-devkitc-1', 'analog-ldr'], ['esp32-s2-devkitc-1', 'analog-potentiometer']]) {
    const support = m.getLessonBoardSupport(m.getSimulationTarget(boardId), lessonId)
    assert.equal(support.supported, false, `${boardId}/${lessonId}`)
  }
})

test('every lesson runs on the Release 1 reference boards', () => {
  for (const boardId of ['esp32-devkit', 'arduino-uno-r3']) {
    const target = m.getSimulationTarget(boardId)
    for (const lesson of m.builderLessons) {
      assert.equal(m.getLessonBoardSupport(target, lesson.id).supported, true, `${boardId}/${lesson.id}`)
      const parsed = m.parseEducationalProgram(lesson.code(target, m.getInputAlias(target, lesson.id).pin), lesson.id)
      assert.equal(parsed.ok, true, `${boardId}/${lesson.id}: ${parsed.message}`)
      assert.equal(m.findProgramTargetMismatch(parsed.program, target, lesson.id), undefined, `${boardId}/${lesson.id}`)
    }
  }
})

test('Uno R4 digital input alias is labelled as an Arduino pin', () => {
  assert.deepEqual(m.getInputAlias(m.getSimulationTarget('arduino-uno-r4-minima'), 'button-led'), { pin: 2, label: 'D2' })
})

test('new exports materialize only the current code draft, including an empty code string', () => {
  for (const code of ['// mã riêng\n', '']) {
    const result = m.createProjectBundle({ workspace: { ...workspace(), code }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} })
    assert.deepEqual(result.lessonDrafts, { blink: { 'esp32-devkit': code } })
    assert.deepEqual(result.branchDrafts, {})
  }
})

test('normalization preserves conflicting current code and supplied drafts and reports the conflict', () => {
  assert.equal(typeof m.normalizeProjectBundle, 'function', 'the normalization contract must be implemented')
  for (const [code, draft] of [['// workspace\n', '// supplied conflicting draft\n'], ['', '// draft\n'], ['// code\n', '']]) {
    const input = bundle({ workspace: { ...workspace(), code, projectId: 'portable-id' }, lessonDrafts: { blink: { 'esp32-devkit': draft } } })
    const result = m.normalizeProjectBundle(input)
    assert.deepEqual(result.bundle, input)
    assert.deepEqual(result.issues, [{ code: 'current-draft-conflict', lessonId: 'blink', boardId: 'esp32-devkit' }])
    assert.deepEqual(m.normalizeProjectBundle(result.bundle), result)
  }
})

test('normalization is pure and idempotent without changing identities, timestamps or layout', () => {
  assert.equal(typeof m.normalizeProjectBundle, 'function')
  const input = bundle({ workspace: { ...workspace(), code: '', projectId: 'portable-id', placed: [{ id: 'board-1', type: 'board', x: 17, y: 39, rotation: 90 }], blockProgram: { pin: 23, setup: [], loop: [] }, analogBlockOrder: ['read', 'compare'], analogThreshold: 42 }, branchSession: { mode: 'cpp', order: ['read', 'if', 'else'] } })
  const before = structuredClone(input)
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value) } }
  freeze(input)
  const result = m.normalizeProjectBundle(input)
  assert.deepEqual(input, before)
  assert.deepEqual(result.bundle.workspace, before.workspace)
  assert.equal(result.bundle.exportedAt, '2026-11-01T00:00:00.000Z')
  assert.deepEqual(result.bundle.lessonDrafts, { blink: { 'esp32-devkit': '' } })
  assert.deepEqual(result.bundle.branchSession, before.branchSession)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(m.normalizeProjectBundle(result.bundle), result)
  assert.deepEqual(m.normalizeProjectBundle(input), result)
})

test('normalization retains all supplied lesson/board and template-equal branch drafts', () => {
  assert.equal(typeof m.normalizeProjectBundle, 'function')
  const template = m.getBuilderLesson('button-led').code(m.getSimulationTarget('esp32-devkit'), m.getInputAlias(m.getSimulationTarget('esp32-devkit'), 'button-led').pin)
  const input = bundle({ workspace: { ...workspace(), code: '// LED ESP32\n' }, lessonDrafts: { blink: { 'esp32-devkit': '// LED ESP32\n', 'arduino-uno-r3': '  // LED Uno\n' }, 'button-led': { 'esp32-devkit': '// nút ESP32\n', 'arduino-uno-r3': '' } }, branchDrafts: { 'button-led': template, 'ir-alert': '' } })
  assert.deepEqual(m.normalizeProjectBundle(input), { bundle: input, issues: [] })
})

test('parsing and exporting share the current-draft normalization rule', () => {
  const input = bundle({ workspace: { ...workspace(), code: '// imported\n', projectId: 'opaque-id' } })
  const parsed = m.parseProjectBundle(input)
  assert.deepEqual(parsed.lessonDrafts, { blink: { 'esp32-devkit': '// imported\n' } })
  assert.equal(parsed.workspace.projectId, 'opaque-id')
  assert.deepEqual(input.lessonDrafts, {})
})
