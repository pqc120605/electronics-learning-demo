import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const bytes = await readFile(new URL('../docs/research/2026-11-27-rp2040-electrical-firmware-a5-proposal.json', import.meta.url))
const proposal = JSON.parse(bytes)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const lock = 'ad345e14d3cfa2e2d23b50bc23d0f6539ba944372a76ec5d280939df95687e65'
const assets = new URL('../.tmp/a5-local-assets/', import.meta.url)
let server
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', envFile: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await server?.close() })
const load = path => server.ssrLoadModule('/src/lib/freestyle/' + path + '.ts')

for (const board of proposal.boards) {
  test(`${board.id} resolves the approved pads in 2D and 3D and rejects invalid wiring`, async () => {
    const { buildA5Fixture, getActiveA5Board, validateA5Circuit } = await load('a5PicoFixture')
    const { getBoardHeaderPins } = await server.ssrLoadModule('/src/lib/boardCatalogModels.ts')
    const { projectTopViewPoint } = await server.ssrLoadModule('/src/lib/boardTopView.ts')
    const { parseFreestyleWorkspace } = await load('freestyleCircuit')
    const { freestylePresentation } = await load('freestylePresentation')
    const { freestyleAssembly } = await load('freestyleAssembly')
    assert.equal(sha256(bytes), lock)
    for (const source of [board.pcb, board.step]) assert.equal(sha256(await readFile(source.path)), source.sha256)
    const { boardId, doc, pinMap } = buildA5Fixture(board.fixtureId)
    assert.equal(getActiveA5Board(boardId, doc).sdkBoard, board.sdkBoard)
    assert.deepEqual(validateA5Circuit(doc, boardId, pinMap), [])
    const restored = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, pinMap, doc, language: 'cpp', code: '' }))
    assert.deepEqual(restored?.doc, doc)
    assert.deepEqual(restored?.pinMap, pinMap)
    const rejects = (badDoc, badBoard = boardId, badPins = pinMap) => assert.ok(validateA5Circuit(badDoc, badBoard, badPins).length)
    for (const removed of doc.wires) rejects({ ...doc, wires: doc.wires.filter(wire => wire !== removed) })
    rejects(doc, proposal.boards.find(item => item.id !== boardId).id)
    rejects(doc, boardId, { ...pinMap, input: 16 })
    rejects({ ...doc, parts: doc.parts.map(part => part.id === 'a5-limit' ? { ...part, value: { ohm: 100 } } : part) })
    const changed = pinId => point => point.partId === 'board' && point.pinId === 'vcc' ? { ...point, pinId } : point
    for (const rail of ['v5', 'vsys', '3v3_en']) {
      rejects({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: changed(rail)(wire.from), to: changed(rail)(wire.to) })) })
    }
    const reverse = point => point.partId === 'a5-led' ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point
    rejects({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: reverse(wire.from), to: reverse(wire.to) })) })
    rejects({ ...doc, wires: [...doc.wires, { id: 'short', from: { kind: 'pin', partId: 'board', pinId: 'vcc' }, to: { kind: 'pin', partId: 'board', pinId: 'gnd' } }] })
    const pins = await getBoardHeaderPins(boardId)
    assert.equal(pins.length, board.headerLocations)
    assert.ok(pins.every(pin => pin.anchor.length === 3 && pin.anchor.every(Number.isFinite)))
    const view = freestylePresentation(boardId, pinMap, doc)
    const top = view.topView
    assert.ok(top?.image.includes(boardId))
    const frame = { x: 0, y: 0, width: top.width, height: top.height }
    const positions = pins.map(pin => projectTopViewPoint(top.boundsMm, frame, pin.anchor.map(coordinate => coordinate * 1000)))
    assert.ok(positions.every(Boolean), 'all 40 pads project onto their own board image')
    assert.equal(new Set(positions.map(point => `${point.x}:${point.y}`)).size, board.headerLocations)
    const bindings = { input: 'button', ledOut: 'led', vcc: 'power', gnd: 'ground', serialTx: 'serialTx' }
    for (const [role, key] of Object.entries(bindings)) {
      const expected = proposal.pins[key]
      const pin = pins.find(candidate => candidate.id === expected.pinId)
      assert.equal(pin.label, expected.label)
      assert.equal(`${pin.headerReference}:${pin.padNumber}`, expected.pad)
      if (role !== 'serialTx') assert.deepEqual(view.pinAnchors[role], pin.anchor.map(coordinate => coordinate * 1000))
    }
    const plan = freestyleAssembly(doc, boardId, pinMap)
    assert.equal(Object.keys(plan.wireEnds).length, doc.wires.length)
    assert.deepEqual(plan.diagnostics, [])
  })

  test(`${board.id} solves both measured GPIO states with ngspice`, async t => {
    const { a5DcNetlist } = await load('a5PicoFixture')
    const engine = new Simulation()
    await engine.start()
    for (const pressed of [false, true]) {
      engine.setNetList(a5DcNetlist(pressed, pressed))
      const result = await engine.runSim()
      const value = name => result.data.find(series => series.name.toLowerCase() === name).values[0]
      const inputV = value('v(gpio14)')
      const ledMa = -1000 * value('i(vout)')
      const k = proposal.electrical.passCriteria
      assert.ok(pressed ? inputV > 0 && inputV < k.maxPressedInputV : inputV >= k.releasedInputV[0] && inputV <= k.releasedInputV[1])
      assert.ok(pressed ? ledMa >= k.ledOnMa[0] && ledMa <= k.ledOnMa[1] : Math.abs(ledMa) < k.maxLedOffAbsoluteMa)
      assert.ok(Math.abs(value('v(gpio15)') - value('v(anode)') - ledMa) < k.maxKvlResidualV)
      t.diagnostic(JSON.stringify({ pressed, inputV, ledMa }))
    }
  })

  const dir = new URL(board.sdkBoard + '/', assets)
  const staged = ['manifest.json', 'flash.bin', 'bootrom.bin'].every(name => existsSync(new URL(name, dir)))
  test(`${board.id} boots its compiled image and debounces the external button three times`, {
    skip: !staged && 'Cần chuẩn bị firmware C và RP2040 B2 local',
  }, async t => {
    const { createA5Machine } = await load('a5PicoMachine')
    const { assertA5Flash } = await load('a5PicoRuntime')
    const manifest = JSON.parse(await readFile(new URL('manifest.json', dir)))
    const flash = await readFile(new URL('flash.bin', dir))
    const bootrom = await readFile(new URL('bootrom.bin', dir))
    assert.equal(manifest.approvalSha256, lock)
    assert.equal(manifest.boardId, board.id)
    assert.equal(manifest.sdkBoard, board.sdkBoard)
    assert.equal(sha256(flash), manifest.flash.sha256)
    assert.equal(sha256(bootrom), proposal.runtime.target.bootrom.sha256)
    assertA5Flash(flash)
    let uart = ''
    const machine = createA5Machine(flash, bootrom, text => { uart += text })
    machine.setPressed(false)
    for (let i = 0; i < 1500 && !uart.includes('A5_BUTTON=0'); i++) machine.step()
    assert.match(uart, new RegExp(`A5_READY=${board.sdkBoard}\\r?\\n`))
    assert.match(uart, /A5_BUTTON=0/)
    assert.equal(machine.sample()?.inputHigh, true)
    assert.equal(machine.sample()?.outputHigh, false)
    const start = machine.sample().timeUs
    machine.setPressed(true)
    while (machine.sample().timeUs - start < 20_000) {
      machine.step()
      assert.equal(machine.sample()?.outputHigh, false)
    }
    machine.setPressed(false)
    for (let i = 0; i < 55; i++) {
      machine.step()
      assert.equal(machine.sample()?.outputHigh, false)
      assert.doesNotMatch(uart, /A5_BUTTON=1/)
    }
    for (const pressed of [true, false, true, false, true, false]) {
      machine.setPressed(pressed)
      const start = machine.sample().timeUs
      for (let i = 0; i < 65 && machine.sample().outputHigh !== pressed; i++) machine.step()
      const frame = machine.sample()
      const elapsed = frame.timeUs - start
      assert.equal(frame.inputHigh, !pressed)
      assert.equal(frame.outputHigh, pressed, uart)
      assert.ok(elapsed >= 39_000 && elapsed <= 60_000, `Transition after ${elapsed} µs`)
      t.diagnostic(`GP15 transition after ${elapsed} µs`)
    }
    assert.match(uart, /(A5_BUTTON=1[\s\S]*?A5_BUTTON=0[\s\S]*?){3}/)
  })
}

test('A5 rejects an invalid Thumb reset vector or flash size', async () => {
  const { assertA5Flash } = await load('a5PicoRuntime')
  const flash = new Uint8Array(2 * 1048576).fill(0xff)
  flash[0] = 0x01
  const view = new DataView(flash.buffer)
  view.setUint32(0x100, 0x20042000, true)
  view.setUint32(0x104, 0x10000109, true)
  assert.doesNotThrow(() => assertA5Flash(flash))
  assert.throws(() => assertA5Flash(flash.subarray(0, -1)), /Dung lượng/)
  view.setUint32(0x104, 0x10000108, true)
  assert.throws(() => assertA5Flash(flash), /Thumb/)
})

test('generic Pico stays on its own route and supports its previous MicroPython and Blink defaults', async () => {
  const { buildSampleCircuit, getFreestyleBoard, parseFreestyleWorkspace } = await load('freestyleCircuit')
  const { getActiveA5Board } = await load('a5PicoFixture')
  const boardId = 'raspberry-pi-pico'
  const { doc, pinMap } = buildSampleCircuit('blink', boardId)
  assert.equal(pinMap.ledOut, 15)
  assert.equal(getFreestyleBoard(boardId).realEngine, 'micropython')
  assert.equal(getActiveA5Board(boardId, doc), undefined)
  const restored = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, pinMap, doc, language: 'micropython', code: 'print(5)' }))
  assert.equal(restored.language, 'micropython')
  assert.equal(restored.code, 'print(5)')
})
