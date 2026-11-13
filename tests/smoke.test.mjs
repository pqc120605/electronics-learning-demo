import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let modules

before(async () => {
  server = await createServer({
    configFile: 'vite.config.ts',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  const [lessons, targets, parser, simulator, validation, components, curriculum, boardCapabilities, boards, programIr] = await Promise.all([
    server.ssrLoadModule('/src/data/builderLessons.ts'),
    server.ssrLoadModule('/src/data/simulationTargets.ts'),
    server.ssrLoadModule('/src/lib/educationalProgram.ts'),
    server.ssrLoadModule('/src/lib/educationalSimulator.ts'),
    server.ssrLoadModule('/src/lib/circuitValidation.ts'),
    server.ssrLoadModule('/src/data/componentRegistry.ts'),
    server.ssrLoadModule('/src/data/curriculumSchema.ts'),
    server.ssrLoadModule('/src/data/boardCapabilityRegistry.ts'),
    server.ssrLoadModule('/src/data/boards.ts'),
    server.ssrLoadModule('/src/lib/lessonProgramIr.ts'),
  ])
  modules = { ...lessons, ...targets, ...parser, ...simulator, ...validation, ...components, ...curriculum, ...boardCapabilities, ...boards, ...programIr }
})

after(async () => {
  await server?.close()
})

test('all curriculum entries have a matching build lesson', () => {
  assert.equal(modules.curriculumLessons.length, 11)
  assert.deepEqual(new Set(modules.curriculumLessons.map((item) => item.id)), new Set(modules.builderLessons.map((item) => item.id)))
})

test('saved project library filters across project name, lesson, and normalized tags', async () => {
  const { filterSavedProjects, normalizeProjectTags, getProjectLessonLabel } = await server.ssrLoadModule('/src/lib/projectLibrary.ts')
  const projects = [
    { id: 'a', name: 'Đèn phòng', bundle: { workspace: { lesson: 'blink' } }, tags: ['LED', 'demo'] },
    { id: 'b', name: 'Cảm biến sáng', bundle: { workspace: { lesson: 'analog-ldr' } }, tags: ['analog', 'IoT'] },
  ]
  assert.deepEqual(filterSavedProjects(projects, '  đèn   led  ').map((item) => item.id), ['a'])
  assert.deepEqual(filterSavedProjects(projects, 'analog').map((item) => item.id), ['b'])
  assert.deepEqual(filterSavedProjects(projects, 'không có').map((item) => item.id), [])
  assert.equal(getProjectLessonLabel('analog-ldr'), 'Quang trở LDR bật/tắt LED')
  assert.equal(getProjectLessonLabel('unknown-old-lesson'), 'Unknown old lesson')
  assert.deepEqual(normalizeProjectTags([' LED ', 'demo', 'led', '', 'IoT']), ['LED', 'demo', 'IoT'])
})

test('NUCLEO simulation input is labelled as a teaching alias, separately from the documented A0 pin', () => {
  const capability = modules.getBoardCapability('stm32-nucleo')
  assert.match(capability.pinMap.input.label, /alias học tập/i)
  assert.equal(capability.pinMap.input.sourceBacked, false)
  assert.equal(capability.pinMap.a0.sourceBacked, true)
})

test('saved project tags migrate old entries and survive edits and duplication', async () => {
  const { SAVED_PROJECTS_KEY, readSavedProjects, updateSavedProjectTags, duplicateSavedProject } = await server.ssrLoadModule('/src/lib/savedProjects.ts')
  const bundle = { format: 'mach-mo-project', version: 1, exportedAt: new Date().toISOString(), workspace: { lesson: 'blink', simBoard: 'arduino-uno-r3', placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [] }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} }
  const values = new Map([[SAVED_PROJECTS_KEY, JSON.stringify([{ id: 'old', name: 'Old project', updatedAt: new Date().toISOString(), bundle }])]])
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  assert.deepEqual(readSavedProjects(storage)[0].tags, [])
  const tagged = updateSavedProjectTags('old', [' beginner ', 'LED', 'led'], storage)
  assert.deepEqual(tagged.tags, ['beginner', 'LED'])
  const copy = duplicateSavedProject('old', storage)
  assert.deepEqual(copy.tags, tagged.tags)
})

test('project import preview accepts only valid Mạch Mở bundles and derives a safe filename', async () => {
  const { parseProjectImport } = await server.ssrLoadModule('/src/lib/projectTransfer.ts')
  const bundle = { format: 'mach-mo-project', version: 1, exportedAt: new Date().toISOString(), workspace: { lesson: 'blink', simBoard: 'arduino-uno-r3', placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [] }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} }
  const preview = parseProjectImport(JSON.stringify(bundle), 'LED demo.machmo.json')
  assert.equal(preview.name, 'LED demo')
  assert.equal(preview.bundle.workspace.lesson, 'blink')
  assert.throws(() => parseProjectImport('{bad json', 'bad.json'), /JSON/i)
  assert.throws(() => parseProjectImport(JSON.stringify({ ...bundle, version: 999 }), 'bad.machmo.json'), /không được hỗ trợ/i)
})

test('project bundle validation preserves an intentional empty wire list and rejects corrupt parts', async () => {
  const { parseProjectBundle } = await server.ssrLoadModule('/src/lib/projectBundle.ts')
  const bundle = { format: 'mach-mo-project', version: 1, exportedAt: new Date().toISOString(), workspace: { lesson: 'blink', simBoard: 'arduino-uno-r3', placed: [{ id: 'board-1', type: 'board', x: 20, y: 30 }], wires: [] }, lessonDrafts: {}, branchSession: {}, branchDrafts: {} }
  assert.deepEqual(parseProjectBundle(bundle).workspace.wires, [])
  assert.throws(() => parseProjectBundle({ ...bundle, workspace: { ...bundle.workspace, placed: [null] } }), /linh kiện|tọa độ/i)
})

test('electronics calculators report safe LED, ADC-divider, I2C, and RC values', async () => {
  const calc = await server.ssrLoadModule('/src/lib/electronicsCalculators.ts')
  const led = calc.calculateLedResistor(3.3, 2, 10)
  assert.equal(led.idealOhms, 130)
  assert.equal(led.standardOhms, 130)
  assert.ok(led.actualCurrentMilliAmps <= 10)
  assert.ok(led.resistorPowerMilliwatts > 0)

  const divider = calc.calculateAdcDivider(12, 3.1, 10)
  assert.ok(divider.standardR1Ohms >= divider.idealR1Ohms)
  assert.ok(divider.outputAtMaxVolts <= 3.1)
  assert.ok(divider.inputCurrentMicroAmps > 0)

  const i2c = calc.calculateI2cPullup(3.3, 100, 'fast')
  assert.ok(i2c.recommendedOhms >= i2c.minimumOhms)
  assert.ok(i2c.recommendedOhms <= i2c.maximumOhms)
  assert.equal(i2c.maximumRiseTimeNs, 300)

  const rc = calc.calculateRc(10, 1)
  assert.equal(rc.timeConstantMs, 10)
  assert.ok(Math.abs(rc.cutoffHz - 15.915494309189533) < 1e-10)
  assert.throws(() => calc.calculateLedResistor(1.8, 2, 10), /V nguồn phải lớn hơn Vf/i)
  assert.throws(() => calc.calculateAdcDivider(3.3, 3.3, 10), /nhỏ hơn Vin/i)
  assert.throws(() => calc.calculateI2cPullup(3.3, 1_000_000, 'fastPlus'), /dải điện trở/)
})

test('lesson simulation board profiles remain distinct from CAD-only reference models', async () => {
  const published = modules.boards.filter((board) => board.availability === 'lesson')
  assert.equal(published.length, 4)
  for (const board of published) {
    const capability = modules.getBoardCapability(board.id)
    assert.equal(capability.modelStatus, 'cad-reference', `${board.id} should have a published reference viewer`)
    assert.ok(capability.revision, `${board.id} should disclose a CAD/reference revision`)
    assert.ok(capability.sourceRefs.length > 0, `${board.id} should cite source material`)
  }
  const aliasOnly = modules.boardCapabilityRegistry.filter((capability) => capability.confidence === 'teaching-alias')
  assert.ok(aliasOnly.length > 0, 'non-source-backed board profiles must remain marked as teaching aliases')
  const modelSources = await server.ssrLoadModule('/src/data/boardModelSources.ts')
  assert.ok(aliasOnly.every((capability) => capability.modelStatus === (modelSources.getBoardModelEvidence(capability.boardId)?.published ? 'cad-reference' : 'preview-only')))
})

test('board model publication is controlled by traceable source evidence', async () => {
  assert.ok(existsSync(fileURLToPath(new URL('../src/data/boardModelSources.ts', import.meta.url))), 'board model evidence registry must exist')
  const modelSources = await server.ssrLoadModule('/src/data/boardModelSources.ts')
  const published = Object.values(modelSources.boardModelSources).filter((record) => record.published)
  assert.equal(published.length, 14)
  for (const record of published) {
    assert.ok(['source-verified-cad', 'educational-reconstruction'].includes(record.status))
    assert.ok(record.revision.trim())
    assert.match(record.sourceUrl, /^https:\/\//)
    assert.ok(record.licenseName.trim())
    assert.ok(record.attribution.trim())
    assert.ok(record.confidenceNote.trim())
  }
  assert.equal(modelSources.getBoardModelEvidence('stm32-nucleo').status, 'preview-only')
  assert.equal(modelSources.getBoardModelEvidence('adafruit-qtpy-esp32-c3-5405').published, true)
  assert.equal(modelSources.getBoardModelEvidence('seeed-xiao-esp32c3').status, 'educational-reconstruction')
  assert.equal(modelSources.getBoardModelEvidence('adafruit-feather-esp32-s3-tft-5483').published, true)
  assert.equal(modelSources.getBoardModelEvidence('esp32-s3-devkitc-1').published, true)
  assert.equal(modelSources.getBoardModelEvidence('esp32-s3-devkitc-1').status, 'educational-reconstruction')
  assert.equal(modelSources.getBoardModelEvidence('stm32-blue-pill-f103').published, false)
  assert.equal(modelSources.getBoardModelEvidence('stm32-bluepill-sinakarvandi'), undefined)
  assert.equal(modelSources.getBoardModelEvidence('not-a-board'), undefined)
  assert.equal(modules.getBoardCapability('stm32-nucleo').modelStatus, 'preview-only')
})

test('the QT Py board model is discoverable from both board and component libraries', async () => {
  const [componentData, componentRefs, componentPage, componentVisual, boardModels] = await Promise.all([
    server.ssrLoadModule('/src/data/components.ts'),
    server.ssrLoadModule('/src/data/componentReferences.ts'),
    import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/ComponentsPage.tsx', import.meta.url)), 'utf8')),
    import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/components/ComponentVisual.tsx', import.meta.url)), 'utf8')),
    server.ssrLoadModule('/src/data/adafruitBoardModels.ts'),
  ])
  const record = componentData.components.find((item) => item.id === 'adafruit-qtpy-esp32-c3-5405')
  assert.ok(record)
  assert.equal(record.boardViewerRoute, '/boards?board=adafruit-qtpy-esp32-c3-5405')
  assert.ok(componentRefs.getComponentReferences(record.id).length >= 3)
  assert.match(componentPage, /boardModelHref=\{current\.boardViewerRoute/)
  assert.match(componentVisual, /Xem mô hình 3D/)
  assert.ok(boardModels.adafruitBoardModels[0].features.some((feature) => feature.designator === 'U2'))
})

test('board evidence panel explains publication status and keeps preview-only boards non-interactive', async () => {
  const panelPath = fileURLToPath(new URL('../src/components/board/BoardModelEvidencePanel.tsx', import.meta.url))
  assert.ok(existsSync(panelPath), 'shared board evidence panel must exist')
  const panel = await import('node:fs/promises').then(({ readFile }) => readFile(panelPath, 'utf8'))
  for (const label of ['Model tham khảo', 'Chỉ thông tin tham khảo', 'Model 3D tương tác chưa được phát hành']) {
    assert.ok(panel.includes(label), `evidence panel should expose ${label}`)
  }
  assert.match(panel, /licenseName/)
  assert.match(panel, /sourceUrl/)
  assert.match(panel, /unresolvedIssues/)
  assert.match(panel, /preview-only/)
  const catalog = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/BoardCatalogPage.tsx', import.meta.url)), 'utf8'))
  const lesson = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/LessonPage.tsx', import.meta.url)), 'utf8'))
  assert.match(catalog, /BoardModelEvidencePanel/)
  assert.match(lesson, /BoardModelEvidencePanel/)
})

test('NUCLEO-F401RE exposes official Arduino header pinout without claiming a 3D viewer', () => {
  const capability = modules.getBoardCapability('stm32-nucleo')
  assert.equal(capability.modelStatus, 'preview-only')
  assert.equal(capability.confidence, 'source-backed')
  assert.equal(capability.pinMap.d13.label, 'PA5 · SPI1_SCK')
  assert.equal(capability.pinMap.a0.label, 'PA0 · ADC1_IN0')
  assert.equal(capability.pinMap.d0.sourceBacked, true)
  assert.ok(capability.sourceRefs.some((source) => source.includes('dm00105823')))
  const target = modules.getSimulationTarget('stm32-nucleo')
  assert.equal(target.codePin, 13)
  assert.equal(target.pinLabel, 'D13 · PA5')
})

test('lesson opens with a detail panel selection that belongs to the selected reference board', async () => {
  const { getDefaultBoardFeatureId } = await server.ssrLoadModule('/src/lib/boardSelection.ts')
  assert.equal(getDefaultBoardFeatureId('esp32-devkit'), 'wroom-module')
  assert.equal(getDefaultBoardFeatureId('arduino-uno-r3'), 'component-ZU4')
  assert.equal(getDefaultBoardFeatureId('arduino-nano-classic'), 'component-IC3')
  assert.equal(getDefaultBoardFeatureId('arduino-mega-2560-r3'), 'component-IC3')
  assert.equal(getDefaultBoardFeatureId('stm32-blue-pill-f103'), 'component-ZU4')
  assert.equal(getDefaultBoardFeatureId('adafruit-qtpy-esp32-c3-5405'), 'cad-u2')
})

test('Blue Pill remains catalog-only until an exact standard board revision is sourced', async () => {
  const community = await server.ssrLoadModule('/src/data/communityBoardModels.ts')
  assert.deepEqual(community.communityBoardModels, [])
  const boards = await server.ssrLoadModule('/src/data/boards.ts')
  const board = boards.boards.find((item) => item.id === 'stm32-blue-pill-f103')
  assert.ok(board)
  assert.match(board.modelNote, /Chưa có model CAD chuẩn/)
  const catalog = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/BoardCatalogPage.tsx', import.meta.url)), 'utf8'))
  const lesson = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/LessonPage.tsx', import.meta.url)), 'utf8'))
  assert.doesNotMatch(catalog, /stm32-bluepill-sinakarvandi/)
  assert.doesNotMatch(lesson, /stm32-bluepill-sinakarvandi/)
})

test('board component picker filters footprint-only CAD entries until requested', async () => {
  const { getBoardFeaturePickerEntries } = await server.ssrLoadModule('/src/lib/boardFeatureFiltering.ts')
  const features = [
    { id: 'mcu', name: 'ATmega328P (U1)', cadFootprint: { has3dBody: true } },
    { id: 'header', name: 'Header pad (J1)', cadFootprint: { has3dBody: false } },
    { id: 'led', name: 'LED (L0)', cadFootprint: { has3dBody: true } },
  ]
  assert.deepEqual(getBoardFeaturePickerEntries(features, new Set(['mcu', 'header', 'led']), false, ''), [features[0], features[2]])
  assert.deepEqual(getBoardFeaturePickerEntries(features, new Set(['mcu', 'header', 'led']), true, 'j1'), [features[1]])
  assert.deepEqual(getBoardFeaturePickerEntries(features, new Set(['mcu', 'led']), true, ''), [features[0], features[2]])
})

test('all lesson sample programs parse for the default ESP32 profile', () => {
  const target = modules.getSimulationTarget('esp32-devkit')
  for (const lesson of modules.builderLessons) {
    const input = modules.getInputAlias(target, lesson.id)
    const parsed = modules.parseEducationalProgram(lesson.code(target, input.pin), lesson.id)
    assert.equal(parsed.ok, true, `${lesson.id}: ${parsed.message ?? 'sample code was rejected'}`)
  }
})

test('the infrared reference lesson treats object detection as active LOW', () => {
  const target = modules.getSimulationTarget('esp32-devkit')
  const inputPin = modules.getInputAlias(target, 'ir-alert').pin
  const sample = modules.getBuilderLesson('ir-alert').code(target, inputPin)
  const parsed = modules.parseEducationalProgram(sample, 'ir-alert')
  assert.equal(parsed.ok, true)
  assert.match(sample, /if \(detected == LOW\)/)
  assert.equal(modules.evaluateProgram(parsed.program, { detected: true }).level, 'HIGH')
  assert.equal(modules.evaluateProgram(parsed.program, { detected: false }).level, 'LOW')
  assert.match(modules.evaluateProgram(parsed.program, { detected: true }).trace[0], /LOW/)
  const contract = modules.curriculumLessons.find((item) => item.id === 'ir-alert')
  assert.match(contract.boardProfile, /101020029.*active LOW/)
  assert.match(contract.supportedBehavior, /LOW khi phát hiện.*HIGH khi không phát hiện/)
  assert.ok(!/active HIGH/i.test(contract.supportedBehavior))
})

test('analog samples normalize raw ADC counts before comparing percentage thresholds', () => {
  for (const id of ['analog-potentiometer', 'analog-ldr']) {
    const target = modules.getSimulationTarget('arduino-uno-r3')
    const source = modules.getBuilderLesson(id).code(target, modules.getInputAlias(target, id).pin)
    assert.match(source, /map\(analogRead\([^)]*\), 0, 1023, 0, 100\)/)
    assert.equal(modules.parseEducationalProgram(source, id).ok, true)
  }
})

test('teaching parser ignores block comments and rejects nested conditions in blink samples', () => {
  const target = modules.getSimulationTarget('esp32-devkit')
  const sample = modules.getBuilderLesson('blink').code(target, 0)
  assert.equal(modules.parseEducationalProgram(`${sample}\n/* if (x) { digitalWrite(ledPin, HIGH); } */`, 'blink').ok, true)
  assert.equal(modules.parseEducationalProgram(sample.replace('  digitalWrite(ledPin, HIGH);', '  if (true) { digitalWrite(ledPin, HIGH); }'), 'blink').ok, false)
  const analog = modules.getBuilderLesson('analog-potentiometer').code(target, modules.getInputAlias(target, 'analog-potentiometer').pin)
  assert.equal(modules.parseEducationalProgram(analog.replace('  delay(50);', '  return;\n  delay(50);'), 'analog-potentiometer').ok, false)
})

test('one blink step advances from HIGH to LOW and Nucleo PA5 aliases stay consistent', () => {
  const target = modules.getSimulationTarget('arduino-uno-r3')
  const program = modules.parseEducationalProgram(modules.getBuilderLesson('blink').code(target, 0), 'blink')
  assert.equal(program.ok, true)
  assert.equal(modules.evaluateProgram(program.program, { elapsedMs: 0 }).level, 'HIGH')
  assert.equal(modules.evaluateProgram(program.program, { elapsedMs: 500 }).level, 'LOW')
  for (const boardId of ['stm32-nucleo','stm32-nucleo-f411re','stm32-nucleo-l476rg','stm32-nucleo-f446re']) assert.equal(modules.getSimulationTarget(boardId).codePin, 13)
})

test('simulation provider registry reports the educational engine and rejects unsupported targets', async () => {
  const { getSimulationProvider, resolveSimulationProvider } = await server.ssrLoadModule('/src/lib/simulationProviders.ts')
  const provider = getSimulationProvider()
  assert.equal(provider.id, 'machmo-educational-interpreter')
  assert.equal(provider.version, '1.0.0')
  assert.equal(provider.execution, 'deterministic-local')
  assert.equal(provider.supports('blink', 'esp32-devkit'), true)
  assert.equal(provider.supports('analog-ldr', 'arduino-uno-r3'), true)
  assert.equal(provider.supports('not-a-lesson', 'esp32-devkit'), false)
  assert.equal(provider.supports('blink', 'not-a-board'), false)
  assert.equal(resolveSimulationProvider('esp32-devkit', 'blink').available, true)
  assert.equal(resolveSimulationProvider('not-a-board', 'blink').available, false)
  const frame = provider.evaluate({ kind: 'blink', pin: 23, onMs: 500, offMs: 500, on: 'HIGH', off: 'LOW' }, { elapsedMs: 0 })
  assert.equal(frame.ledOn, true)
  assert.match(frame.trace[0], /GPIO 23/)
})

test('LDR divider calculation maps light through an explicit resistance model to a voltage', async () => {
  const { calculateLdrDivider } = await server.ssrLoadModule('/src/lib/analogDivider.ts')
  const dark = calculateLdrDivider(0)
  const midpoint = calculateLdrDivider(50)
  const bright = calculateLdrDivider(100)
  assert.equal(dark.ldrResistanceOhms, 100_000)
  assert.equal(midpoint.ldrResistanceOhms, 10_000)
  assert.equal(bright.ldrResistanceOhms, 1_000)
  assert.equal(dark.outputVoltageVolts, 3.3 * 10_000 / 110_000)
  assert.equal(midpoint.outputVoltageVolts, 1.65)
  assert.equal(midpoint.normalizedPercent, 50)
  assert.ok(dark.normalizedPercent < midpoint.normalizedPercent)
  assert.ok(midpoint.normalizedPercent < bright.normalizedPercent)
  const reversed = calculateLdrDivider(50, { ldrPosition: 'low' })
  assert.equal(reversed.outputVoltageVolts, 1.65)
  assert.ok(Math.abs(calculateLdrDivider(0, { ldrPosition: 'low' }).normalizedPercent - 90.9090909090909) < 1e-10)
  assert.throws(() => calculateLdrDivider(50, { supplyVolts: 0 }), /positive finite/i)
  assert.throws(() => calculateLdrDivider(50, { fixedResistorOhms: Number.NaN }), /positive finite/i)
  const target = modules.getSimulationTarget('esp32-devkit')
  const inputPin = modules.getInputAlias(target, 'analog-ldr').pin
  const parsed = modules.parseEducationalProgram(modules.getBuilderLesson('analog-ldr').code(target, inputPin), 'analog-ldr')
  assert.equal(parsed.ok, true)
  if (parsed.ok) {
    const frame = modules.evaluateProgram(parsed.program, { lightPercent: 50 })
    assert.equal(frame.analogPercent, 50)
    assert.equal(frame.divider.outputVoltageVolts, 1.65)
    assert.match(frame.trace[1], /Vout 1\.65 V/)
  }
})

test('Arduino sketch export requires supported code that matches the selected board aliases', async () => {
  const exporter = await server.ssrLoadModule('/src/lib/arduinoSketchExport.ts')
  const target = modules.getSimulationTarget('arduino-uno-r3')
  const code = modules.getBuilderLesson('blink').code(target, modules.getInputAlias(target, 'blink').pin)
  const valid = exporter.prepareArduinoSketchExport({ code, lessonId: 'blink', target })
  assert.equal(valid.ok, true)
  assert.match(valid.fileName, /^mach-mo-blink-arduino-uno-r3\.ino$/)
  assert.match(valid.contents, /Board target: Arduino Uno R3/)
  assert.match(valid.contents, /không biên dịch hay xác nhận firmware/i)
  const unsupportedTarget = modules.getSimulationTarget('esp32-devkit')
  assert.equal(exporter.prepareArduinoSketchExport({ code: modules.getBuilderLesson('blink').code(unsupportedTarget, 0), lessonId: 'blink', target: unsupportedTarget }).ok, false)

  const malformed = exporter.prepareArduinoSketchExport({ code: 'void setup() {} void loop() {}', lessonId: 'blink', target })
  assert.equal(malformed.ok, false)
  assert.match(malformed.message, /Thiếu khai báo|Cần đúng|Chỉ hỗ trợ khai báo/)

  const mismatched = exporter.prepareArduinoSketchExport({ code: code.replace('ledPin = 13', 'ledPin = 12'), lessonId: 'blink', target })
  assert.equal(mismatched.ok, false)
  assert.match(mismatched.message, /profile đang chọn alias 13/)

  const referenceOnly = exporter.prepareArduinoSketchExport({
    code: modules.getBuilderLesson('buck-boost-concept').code(target, 0),
    lessonId: 'buck-boost-concept',
    target,
  })
  assert.equal(referenceOnly.ok, false)
  assert.match(referenceOnly.message, /chỉ dành cho bài có code-subset/)
})

test('Intel HEX inspection validates checksums, EOF, extended addresses, overlaps, and size limits', async () => {
  const { inspectIntelHex } = await server.ssrLoadModule('/src/lib/intelHex.ts')
  const record = (address, type, data = []) => {
    const fields = [data.length, (address >> 8) & 0xff, address & 0xff, type, ...data]
    const checksum = (-fields.reduce((sum, byte) => sum + byte, 0)) & 0xff
    return `:${[...fields, checksum].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
  }
  const valid = [
    record(0, 4, [0, 1]),
    record(0x20, 0, [0xAA, 0x55]),
    record(0, 5, [0, 1, 0, 0x20]),
    record(0, 1),
  ].join('\n')
  const image = inspectIntelHex(valid)
  assert.equal(image.byteLength, 2)
  assert.deepEqual(image.segments, [{ address: 0x10020, data: [0xAA, 0x55] }])
  assert.equal(image.entryAddress, 0x10020)
  const dataRecord = record(0x20, 0, [0xAA, 0x55])
  assert.throws(() => inspectIntelHex(valid.replace(dataRecord, `${dataRecord.slice(0, -2)}00`)), /checksum/i)
  assert.throws(() => inspectIntelHex(record(0, 0, [0x01])), /EOF/i)
  assert.throws(() => inspectIntelHex(`${record(0, 1)}\n${record(0, 0, [1])}`), /sau EOF/i)
  assert.throws(() => inspectIntelHex([record(0, 0, [1, 2]), record(1, 0, [3]), record(0, 1)].join('\n')), /chồng lấn/i)
  assert.throws(() => inspectIntelHex([record(0, 0, [1, 2]), record(0, 1)].join('\n'), { maxBytes: 1 }), /giới hạn/i)
})

test('AVR firmware runner requires an explicit ATmega328P target confirmation', async () => {
  const targetGate = await server.ssrLoadModule('/src/lib/firmwareTarget.ts')
  assert.equal(targetGate.canRunAtmega328pFirmware('arduino-uno-r3', true), true)
  assert.equal(targetGate.canRunAtmega328pFirmware('arduino-uno-r3', false), false)
  assert.equal(targetGate.canRunAtmega328pFirmware('arduino-nano-classic', true), true)
  assert.equal(targetGate.canRunAtmega328pFirmware('arduino-nano-classic', false), false)
  assert.equal(targetGate.canRunAtmega328pFirmware('rp2040', true), false)
  assert.equal(targetGate.canRunAtmega328pFirmware('esp32-devkit', true), false)
  assert.equal(targetGate.canRunAtmega328pFirmware(undefined, true), false)
  assert.equal(targetGate.getAtmega328pFirmwareTarget('arduino-nano-classic')?.clockHz, 16_000_000)
  assert.equal(targetGate.getAtmega328pFirmwareTarget('arduino-uno-r3')?.d13Alias, 'D13')
    assert.match(targetGate.getAtmega328pFirmwareTarget('arduino-uno-r3')?.referenceUrl, /^https:\/\/docs\.arduino\.cc\/hardware\/uno-rev3/)
    assert.match(targetGate.getAtmega328pFirmwareTarget('arduino-nano-classic')?.referenceUrl, /^https:\/\/docs\.arduino\.cc\/hardware\/nano/)
  const page = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/FirmwareHexToolPage.tsx', import.meta.url)), 'utf8'))
  assert.match(page, /Tôi xác nhận.*ATmega328P/i)
  assert.match(page, /Chọn board đích/)
  assert.match(page, /disabled=\{!avrRunning && !canRunAtmega328pFirmware/)
})

test('AVR8js ATmega328P spike executes bounded firmware instructions and traces Uno D13 GPIO', async () => {
  const { createAtmega328pMachine } = await server.ssrLoadModule('/src/lib/avr8jsRunner.ts')
  const { avr8jsD13TestHex } = await server.ssrLoadModule('/src/data/avr8jsDemo.ts')
  const machine = createAtmega328pMachine(avr8jsD13TestHex)
  machine.step(4)
  assert.equal(machine.snapshot().led13, 'on')
  machine.step(2)
  const result = machine.snapshot()
  assert.equal(result.target, 'arduino-uno-r3-atmega328p')
  assert.equal(result.cycles, 7, 'instruction stepping may pass the requested cycle boundary')
  assert.equal(result.led13, 'off')
  assert.deepEqual(result.pinTransitions, [false, true, false])
  const nano = createAtmega328pMachine(avr8jsD13TestHex, 'arduino-nano-classic')
  assert.equal(nano.snapshot().target, 'arduino-nano-classic-atmega328p')
    assert.throws(() => createAtmega328pMachine(avr8jsD13TestHex, 'esp32-devkit'), /chưa được hỗ trợ ATmega328P/i)
  const outOfFlash = ':020000040001F9\n:0100000000FF\n:00000001FF'
  assert.throws(() => createAtmega328pMachine(outOfFlash), /32 KB/i)
})

test('downloadable ATmega328P HEX blink sample is valid and toggles D13 in the AVR worker model', async () => {
  const hexPath = fileURLToPath(new URL('../public/firmware/atmega328p-d13-blink.hex', import.meta.url))
  assert.ok(existsSync(hexPath), 'a user-downloadable compiled HEX sample must be present')
  const [source, parser, runner] = await Promise.all([
    import('node:fs/promises').then(({ readFile }) => readFile(hexPath, 'utf8')),
    server.ssrLoadModule('/src/lib/intelHex.ts'),
    server.ssrLoadModule('/src/lib/avr8jsRunner.ts'),
  ])
  const image = parser.inspectIntelHex(source)
  assert.ok(image.byteLength > 8, 'blink firmware must contain assembled instructions')
  const machine = runner.createAtmega328pMachine(source)
  while (machine.snapshot().pinTransitions.length < 3 && machine.snapshot().cycles < 5_000_000) machine.step(200_000)
  assert.deepEqual(machine.snapshot().pinTransitions.slice(0, 3), [false, true, false])
})

test('Arduino Uno blink sketch remains available beside the assembly HEX with toolchain provenance disclosed', async () => {
  const sketchPath = fileURLToPath(new URL('../public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.ino', import.meta.url))
  assert.ok(existsSync(sketchPath), 'the matching Arduino IDE sketch source should be downloadable')
  const sketch = await import('node:fs/promises').then(({ readFile }) => readFile(sketchPath, 'utf8'))
  assert.match(sketch, /pinMode\(LED_BUILTIN, OUTPUT\)/)
  assert.match(sketch, /digitalWrite\(LED_BUILTIN, HIGH\)/)
  assert.match(sketch, /digitalWrite\(LED_BUILTIN, LOW\)/)
  const page = await import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/FirmwareHexToolPage.tsx', import.meta.url)), 'utf8'))
  assert.match(page, /arduino-uno-d13-blink\.ino/)
  assert.match(page, /arduino-uno-d13-blink\/arduino-uno-d13-blink\.hex/)
  assert.match(page, /Arduino AVR Boards 1\.8\.8/)
  assert.match(page, /Nạp HEX biên dịch từ Arduino IDE/)
})

test('Arduino IDE compiled Uno HEX is valid and executes setup-loop blink transitions in AVR8js', async () => {
  const hexPath = fileURLToPath(new URL('../public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex', import.meta.url))
  assert.ok(existsSync(hexPath), 'the Arduino IDE compiled HEX should be downloadable beside the sketch')
  const [source, parser, runner, page] = await Promise.all([
    import('node:fs/promises').then(({ readFile }) => readFile(hexPath, 'utf8')),
    server.ssrLoadModule('/src/lib/intelHex.ts'),
    server.ssrLoadModule('/src/lib/avr8jsRunner.ts'),
    import('node:fs/promises').then(({ readFile }) => readFile(fileURLToPath(new URL('../src/pages/FirmwareHexToolPage.tsx', import.meta.url)), 'utf8')),
  ])
  const image = parser.inspectIntelHex(source)
  assert.ok(image.byteLength > 500, 'Arduino core firmware should include startup and delay code')
  const machine = runner.createAtmega328pMachine(source)
  while (machine.snapshot().pinTransitions.length < 3 && machine.snapshot().cycles < 16_000_000) machine.step(400_000)
  assert.deepEqual(machine.snapshot().pinTransitions.slice(0, 3), [false, true, false])
  assert.match(page, /arduino-uno-d13-blink\/arduino-uno-d13-blink\.hex/)
  assert.match(page, /Arduino AVR Boards 1\.8\.8/)
})

test('block-generated LED code uses the same named pin syntax accepted by the lesson parser', () => {
  const code = modules.generateLedCpp(modules.starterLedProgram)
  assert.match(code, /pinMode\(ledPin, OUTPUT\)/)
  assert.match(code, /digitalWrite\(ledPin, HIGH\)/)
  assert.equal(modules.parseEducationalProgram(code, 'blink').ok, true)
})

test('LED circuit validator accepts the protected series path and rejects direct GPIO to LED', () => {
  const board = { id: 'board-1', type: 'board' }
  const resistor = { id: 'res-1', type: 'resistor' }
  const led = { id: 'led-1', type: 'led' }
  const wire = (id, a, ap, b, bp) => ({ id, from: { partId: a, pinId: ap }, to: { partId: b, pinId: bp } })
  const safe = { parts: [board, resistor, led], wires: [wire('1', 'board-1', 'ledOut', 'res-1', 'a'), wire('2', 'res-1', 'b', 'led-1', 'anode'), wire('3', 'led-1', 'cathode', 'board-1', 'gnd')] }
  const unsafe = { parts: [board, led], wires: [wire('1', 'board-1', 'ledOut', 'led-1', 'anode'), wire('2', 'led-1', 'cathode', 'board-1', 'gnd')] }
  assert.equal(modules.validateCircuit(safe, 'blink').some((item) => item.severity === 'error'), false)
  assert.ok(modules.validateCircuit(unsafe, 'blink').some((item) => item.code === 'led-no-series-resistor-led-1' || item.code === 'led-direct-gpio-led-1'))
})

test('all lesson presets satisfy their declared circuit topology checks', async () => {
  const page = await server.ssrLoadModule('/src/pages/CircuitBuilderPage.tsx')
  const target = modules.getSimulationTarget('esp32-devkit')
  const capability = modules.getBoardCapability(target.boardId)
  for (const lesson of modules.builderLessons) {
    const preset = page.circuitForLesson(lesson.id)
    const errors = modules.validateCircuit({ parts: preset.placed, wires: preset.wires }, lesson.id, capability)
      .filter((item) => item.severity === 'error')
    assert.deepEqual(errors, [], `${lesson.id}: ${errors.map((item) => item.message).join('; ')}`)
  }
})

test('potentiometer topology rejects a zero-wire circuit and LED path accepts a replacement resistor ID', async () => {
  const page = await server.ssrLoadModule('/src/pages/CircuitBuilderPage.tsx')
  const { validateCircuit } = modules
  const preset = page.circuitForLesson('analog-potentiometer')
  assert.ok(validateCircuit({ parts: preset.placed, wires: [] }, 'analog-potentiometer').some(item => item.severity === 'error'))
  const blink = page.circuitForLesson('blink')
  blink.placed = blink.placed.map(part => part.id === 'res-1' ? { ...part, id: 'resistor-custom-7' } : part)
  blink.wires = blink.wires.map(wire => ({ ...wire, from: wire.from.partId === 'res-1' ? { ...wire.from, partId: 'resistor-custom-7' } : wire.from, to: wire.to.partId === 'res-1' ? { ...wire.to, partId: 'resistor-custom-7' } : wire.to }))
  assert.equal(validateCircuit({ parts: blink.placed, wires: blink.wires }, 'blink').some(item => item.severity === 'error'), false)
})

test('main route modules compile and export their page components', async () => {
  const routes = [
    ['/src/pages/ExplorePage.tsx', 'ExplorePage'],
    ['/src/pages/CircuitBuilderPage.tsx', 'CircuitBuilderPage'],
    ['/src/pages/BoardCatalogPage.tsx', 'BoardCatalogPage'],
    ['/src/pages/ComponentsPage.tsx', 'ComponentsPage'],
    ['/src/pages/TopicsPage.tsx', 'TopicsPage'],
    ['/src/pages/ProjectsPage.tsx', 'ProjectsPage'],
    ['/src/pages/FirmwareHexToolPage.tsx', 'FirmwareHexToolPage'],
    ['/src/pages/ElectronicsCalculatorsPage.tsx', 'ElectronicsCalculatorsPage'],
    ['/src/pages/LessonPage.tsx', 'LessonPage'],
  ]
  for (const [path, exportName] of routes) {
    const page = await server.ssrLoadModule(path)
    assert.equal(typeof page[exportName], 'function', `${path} must export ${exportName}`)
  }
  const [toolbar, picker] = await Promise.all([
    server.ssrLoadModule('/src/components/builder/BuilderToolbar.tsx'),
    server.ssrLoadModule('/src/components/builder/BuilderLessonPicker.tsx'),
  ])
  assert.equal(typeof toolbar.BuilderToolbar, 'function')
  assert.equal(typeof picker.BuilderLessonPicker, 'function')
})
