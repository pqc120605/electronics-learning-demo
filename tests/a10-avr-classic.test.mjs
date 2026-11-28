import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

const proposalBytes = readFileSync('docs/research/2026-11-27-avr-classic-electrical-firmware-a10-proposal.json')
const proposal = JSON.parse(proposalBytes)
const approvedHash = 'ad4e9498355e8284f1e3d3beb4cb22970312a0d98424102f8d11702e30f4c1cd'
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const directory = board => `.tmp/a10-local-assets/${board.id}`
const requireAssets = process.env.MACHMO_REQUIRE_A10_ASSETS === '1'
let vite, fixture, runtime, machine

before(async () => {
  vite = await createServer({ envDir: false, logLevel: 'silent', server: { middlewareMode: true } })
  ;[fixture, runtime, machine] = await Promise.all([
    '/src/lib/freestyle/a10AvrFixture.ts', '/src/lib/freestyle/a10AvrRuntime.ts', '/src/lib/avrLiveMachine.ts',
  ].map(path => vite.ssrLoadModule(path)))
})
after(() => vite?.close())

test('A10 verifies all approved inputs and pins the local AVR package', async () => {
  assert.equal(digest(proposalBytes), approvedHash)
  const { readA10Proposal } = await import('../scripts/a10-avr-assets.mjs')
  assert.deepEqual(await readA10Proposal(), proposal)
})

for (const board of proposal.boards) {
  test(`${board.sku} preserves draft endpoints and binds the CAD pads and target`, async () => {
    const other = proposal.boards.find(item => item !== board)
    const { boardId, doc, pinMap } = fixture.buildA10Fixture(board.fixtureId)
    assert.equal(boardId, board.runnerId)
    const { parseFreestyleWorkspace } = await vite.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
    const { freestylePresentation } = await vite.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
    const { freestyleAssembly } = await vite.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
    const { getBoardHeaderPins } = await vite.ssrLoadModule('/src/lib/boardCatalogModels.ts')
    const { getBoardAuxConnectors } = await vite.ssrLoadModule('/src/lib/boardAuxConnectors.ts')
    const { describeBoardSimulation } = await vite.ssrLoadModule('/src/data/boardCapabilityRegistry.ts')
    const draft = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, doc, pinMap, code: '', language: 'cpp' }))
    assert.deepEqual(draft.doc, doc)
    assert.deepEqual(draft.pinMap, pinMap)
    const view = freestylePresentation(boardId, pinMap, doc)
    const pins = await getBoardHeaderPins(board.id)
    assert.equal(pins.length, board.padCount)
    assert.equal(new Set(pins.map(pin => pin.id)).size, board.padCount)
    assert.equal(view.topView.assetSha256, board.assets.find(asset => asset.path === `public/models/${board.id}.glb`).sha256)
    for (const [role, key] of Object.entries({ input: 'input', ledOut: 'output', vcc: 'power', gnd: 'ground' })) {
      const pin = pins.find(pin => pin.id === board.pins[key].id)
      assert.equal(`${pin.headerReference}.${pin.padNumber}`, board.pins[key].pad)
      assert.deepEqual(view.pinAnchors[role], pin.anchor.map(coordinate => coordinate * 1000))
    }
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.deepEqual(assembly.diagnostics, [])
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    const connectors = getBoardAuxConnectors(board.id)
    assert.deepEqual(new Set(connectors.map(group => group.id)), new Set(Object.keys(board.auxiliary)))
    const simulation = describeBoardSimulation(board.id)
    assert.match(simulation, /mô hình hành vi bài học/)
    assert.match(simulation, /Bản local.*A10/)
    if (board.id === 'arduino-nano-classic') {
      assert.match(simulation, /D13\/PB5 và UART0/)
      for (const label of ['A6','A7']) assert.deepEqual(pins.find(pin => pin.label === label).functions, ['Chỉ đầu vào ADC'])
    } else {
      assert.equal(connectors.find(group => group.id === 'JP6').pins.find(pin => pin.label === 'AREF').role, 'voltage-reference')
      for (const label of ['A8','A15']) assert.ok(pins.find(pin => pin.label === label).functions.includes('Digital I/O'))
    }
    const compiled = fixture.compileA10Circuit(doc, boardId, pinMap)
    assert.deepEqual(compiled.issues, [])
    assert.equal(compiled.graph.board, board.runnerId)
    assert.deepEqual(compiled.graph.gpios.map(({ pin }) => pin), [board.pins.input.arduino, board.pins.output.arduino])
    for (const wire of doc.wires) {
      assert.ok(fixture.compileA10Circuit({ ...doc, wires: doc.wires.filter(item => item !== wire) }, boardId, pinMap).issues.length)
    }
    assert.ok(fixture.compileA10Circuit(doc, other.runnerId, pinMap).issues.length)
    assert.ok(fixture.compileA10Circuit(doc, boardId, { ...pinMap, ledOut: 13 }).issues.length)
    for (const change of [
      doc.wires.map(wire => wire.from.partId === 'board' && wire.from.pinId === 'vcc' ? { ...wire, from: { ...wire.from, pinId: 'v5' } } : wire),
      doc.wires.map(wire => wire.to.partId === 'a10-led' ? { ...wire, to: { ...wire.to, pinId: wire.to.pinId === 'anode' ? 'cathode' : 'anode' } } : wire),
    ]) assert.ok(fixture.compileA10Circuit({ ...doc, wires: change }, boardId, pinMap).issues.length)
    assert.ok(fixture.compileA10Circuit({ ...doc, parts: doc.parts.map(part => part.id === 'a10-limit'
      ? { ...part, value: { ohm: 220 } } : part) }, boardId, pinMap).issues.length)
  })

  test(`${board.sku} executes the correct AVR HEX and solves both observed states`, {
    skip: !requireAssets && !existsSync(`${directory(board)}/manifest.json`),
  }, async t => {
    const other = proposal.boards.find(item => item !== board)
    const profile = runtime.getA10Board(board.id)
    const asset = JSON.parse(readFileSync(`${directory(board)}/manifest.json`, 'utf8'))
    const builtFixture = fixture.buildA10Fixture(board.fixtureId)
    const fixtureHash = digest(JSON.stringify(builtFixture))
    assert.equal(asset.fixtureSha256, fixtureHash)
    assert.equal(asset.sourceSha256, digest(readFileSync(`${directory(board)}/button_led.ino`)))
    const hex = readFileSync(`${directory(board)}/firmware.hex`, 'utf8')
    const otherHex = readFileSync(`${directory(other)}/firmware.hex`, 'utf8')
    await assert.rejects(runtime.verifyA10Hex(profile, asset, otherHex, fixtureHash), /SHA-256/)
    await assert.rejects(runtime.verifyA10Hex(runtime.getA10Board(other.id), asset, hex, fixtureHash), /target/)
    await assert.rejects(runtime.verifyA10Hex(profile, asset, hex, '0'.repeat(64)), /SHA-256.*mạch/)
    const { boardId, doc, pinMap } = builtFixture
    const { graph } = fixture.compileA10Circuit(doc, boardId, pinMap)
    const avr = machine.createAvrLiveMachine(await runtime.verifyA10Hex(profile, asset, hex, fixtureHash), board.runnerId, { graph, stimuli: { 'a10-button': false } })
    let serial = ''
    let frame
    function advance(ms) {
      frame = avr.runFor(ms)
      serial += frame.serial
      assert.ok(Math.abs(frame.cycles / (proposal.firmware.clockHz / 1000) - frame.simulatedMilliseconds) < 0.00001)
      const input = frame.pins[board.pins.input.arduino]
      const output = frame.pins[board.pins.output.arduino]
      assert.equal(input.mode, 'input')
      assert.equal(output.mode, 'output')
      return { inputHigh: input.level, outputHigh: output.level }
    }
    const released = advance(100)
    assert.deepEqual(released, { inputHigh: true, outputHigh: false })
    assert.equal(serial.trim(), `A10_READY ${board.uartTargetMarker}`)
    avr.setCircuitStimuli({ 'a10-button': true })
    assert.deepEqual(advance(20), { inputHigh: false, outputHigh: false })
    avr.setCircuitStimuli({ 'a10-button': false })
    assert.deepEqual(advance(65), released)

    let driven
    for (const pressed of [true, false, true, false, true, false]) {
      const start = frame.simulatedMilliseconds
      avr.setCircuitStimuli({ 'a10-button': pressed })
      let state = advance(1)
      assert.equal(state.inputHigh, !pressed)
      assert.equal(state.outputHigh, !pressed)
      while (state.outputHigh !== pressed && frame.simulatedMilliseconds - start < 60) state = advance(1)
      assert.equal(state.outputHigh, pressed)
      const lag = frame.simulatedMilliseconds - start
      assert.ok(lag >= 39 && lag <= 60, `GPIO edge at ${lag} ms`)
      t.diagnostic(`GPIO edge after ${lag.toFixed(3)} ms`)
      if (pressed) driven = state
      advance(20)
    }
    assert.deepEqual(serial.trim().split(/\r?\n/), [`A10_READY ${board.uartTargetMarker}`, ...Array.from({ length: 3 }, () => ['A10_LED 1','A10_LED 0']).flat()])
    const simulation = new Simulation()
    await simulation.start()
    const thresholds = proposal.acceptance.dc
    const inRange = (value, [low, high]) => value >= low && value <= high
    for (const state of [released, driven]) {
      simulation.setNetList(fixture.a10DcNetlist(profile, !state.inputHigh, state.outputHigh))
      const result = await simulation.runSim()
      const node = name => result.data.find(record => record.name.toLowerCase() === name)?.values[0]
      const inputV = node(`v(gpio${board.pins.input.arduino})`)
      const outputV = node(`v(gpio${board.pins.output.arduino})`)
      const anodeV = node('v(anode)')
      const ledMa = -1000 * node('i(vout)')
      const kvlV = Math.abs(outputV - anodeV - ledMa * proposal.electrical.ledSeriesOhms / 1000)
      assert.ok(state.inputHigh ? inRange(inputV, thresholds.releasedInputVolts) : Math.abs(inputV) <= thresholds.pressedInputMaxAbsVolts)
      assert.ok(state.outputHigh ? inRange(ledMa, thresholds.litLedCurrentMilliAmps) && inRange(anodeV, thresholds.litLedAnodeVolts)
        : Math.abs(ledMa) <= thresholds.offLedMaxAbsMilliAmps)
      assert.ok(kvlV <= thresholds.kvlMaxAbsVolts)
      t.diagnostic(JSON.stringify({ inputV, anodeV, ledMa, kvlV }))
    }
  })
}

test('A10 serves only the approved manifest and HEX paths from the local tools server', {
  skip: !requireAssets && !proposal.boards.every(board => existsSync(`${directory(board)}/manifest.json`)),
}, async t => {
  const { createA2LocalAssets } = await import('../scripts/a2-local-assets.mjs')
  const middleware = createA2LocalAssets(process.cwd())
  const server = createHttpServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`
  const base = `${origin}/api/local-tools/a10-avr/`
  for (const board of proposal.boards) {
    const response = await fetch(`${base}${board.id}/manifest.json`)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const manifest = await response.json()
    const hex = await fetch(`${base}${board.id}/firmware.hex`)
    assert.equal(hex.status, 200)
    assert.equal(digest(await hex.text()), manifest.hexSha256)
  }
  const path = `${base}${proposal.boards[0].id}/`
  for (const response of [
    await fetch(path + 'button_led.ino'), await fetch(base + 'arduino-uno-r3/firmware.hex'),
    await fetch(path + 'manifest.json', { method: 'POST' }), await fetch(path + 'manifest.json', { headers: { Origin: 'https://example.com' } }),
  ]) {
    assert.equal(response.status, 404)
    await response.arrayBuffer()
  }
})
