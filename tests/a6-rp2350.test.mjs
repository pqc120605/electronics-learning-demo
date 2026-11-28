
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const proposalFile = readFileSync(new URL('../docs/research/2026-11-27-rp2350-electrical-firmware-a6-proposal.json', import.meta.url))
const proposal = JSON.parse(proposalFile)
const hash = data => createHash('sha256').update(data).digest('hex')
const assets = new URL('../.tmp/a6-local-assets/', import.meta.url)
const asset = path => new URL(path, assets)
const staged = existsSync(asset(proposal.boards[0].id + '/manifest.json'))
let server
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', envFile: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await server?.close() })
const load = name => server.ssrLoadModule('/src/lib/' + name + '.ts')

for (const board of proposal.boards) {
  test(board.id + ' uses its approved header layout, SWD lookup and mappable fixture in 2D/3D', async () => {
    const { buildA6Fixture, validateA6Circuit, getActiveA6Board } = await load('freestyle/a6PicoFixture')
    const { a6ApprovalSha256 } = await load('freestyle/a6PicoProfiles')
    const { getBoardHeaderPins } = await load('boardCatalogModels')
    const { getBoardAuxConnectors } = await load('boardAuxConnectors')
    const { projectTopViewPoint } = await load('boardTopView')
    const { freestylePresentation } = await load('freestyle/freestylePresentation')
    const { freestyleAssembly } = await load('freestyle/freestyleAssembly')
    const { parseFreestyleWorkspace } = await load('freestyle/freestyleCircuit')
    assert.equal(hash(proposalFile), a6ApprovalSha256)
    for (const file of [board.step, board.model, board.topView, proposal.boardEvidence.headerLayoutReference]) {
      assert.equal(hash(readFileSync(file.path)), file.sha256)
    }
    const { boardId, doc, pinMap } = buildA6Fixture(board.fixtureId)
    assert.equal(getActiveA6Board(boardId, doc).revision, board.revision)
    assert.deepEqual(validateA6Circuit(doc, boardId, pinMap), [])
    const draft = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, doc, pinMap, code: '', language: 'cpp' }))
    assert.deepEqual(draft.doc, doc)
    assert.deepEqual(draft.pinMap, pinMap)
    const reject = (invalid, id = boardId, pins = pinMap) => assert.ok(validateA6Circuit(invalid, id, pins).length)
    reject(doc, proposal.boards.find(item => item.id !== boardId).id)
    reject(doc, boardId, { ...pinMap, input: 16 })
    for (const wire of doc.wires) reject({ ...doc, wires: doc.wires.filter(item => item !== wire) })
    const prefix = 'a6-'
    reject({ ...doc, parts: doc.parts.filter(part => part.id !== prefix + 'limit') })
    const remap = fn => ({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: fn(wire.from), to: fn(wire.to) })) })
    for (const pinId of ['v5', 'vsys', '3v3-en']) {
      reject(remap(point => point.partId === 'board' && point.pinId === 'vcc' ? { ...point, pinId } : point))
    }
    reject(remap(point => point.partId === prefix + 'led' ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point))
    const pins = await getBoardHeaderPins(boardId)
    assert.equal(pins.length, board.headerLocations)
    const view = freestylePresentation(boardId, pinMap, doc)
    const model = new URL(view.model.assetUrl, 'http://localhost')
    assert.equal(model.pathname, '/' + board.model.path.replace(/^public\//, ''))
    assert.equal(model.searchParams.get('v'), board.model.sha256.slice(0, 12))
    assert.equal(view.topView.image, '/' + board.topView.path.replace(/^public\//, ''))
    const top = view.topView
    const frame = { x: 0, y: 0, width: top.width, height: top.height }
    const points = pins.map(pin => projectTopViewPoint(top.boundsMm, frame, pin.anchor.map(value => value * 1000)))
    assert.ok(points.every(Boolean))
    assert.equal(new Set(points.map(point => String(point.x) + ':' + point.y)).size, board.headerLocations)
    for (const [role, name] of Object.entries({ input: 'button', ledOut: 'led', vcc: 'power', gnd: 'ground', serialTx: 'serialTx' })) {
      const expected = proposal.pins[name]
      const pin = pins.find(pin => pin.id === expected.pinId)
      assert.equal(pin.label, expected.label)
      assert.equal(pin.headerReference + ':' + pin.padNumber, expected.pad)
      if (role !== 'serialTx') assert.deepEqual(view.pinAnchors[role], pin.anchor.map(value => value * 1000))
    }
    assert.match(JSON.stringify(getBoardAuxConnectors(boardId)), /SWCLK.*GND.*SWDIO/)
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    assert.deepEqual(assembly.diagnostics, [])
  })

  test(board.id + ' executes the verified ELF, rejects a 20 ms pulse and measures both observed DC states', {
    skip: !staged && process.env.MACHMO_REQUIRE_A6_ASSETS !== '1' && 'Cần chuẩn bị ELF và pico-emu local',
  }, async t => {
    const { assertA6Elf, assertA6Manifest } = await load('freestyle/a6PicoRuntime')
    const { getA6Board } = await load('freestyle/a6PicoProfiles')
    const { createA6Machine } = await load('freestyle/a6PicoMachine')
    const { a6DcNetlist } = await load('freestyle/a6PicoFixture')
    const manifest = JSON.parse(readFileSync(asset(board.id + '/manifest.json')))
    assertA6Manifest(manifest, getA6Board(board.id))
    for (const patch of [{ boardId: proposal.boards.find(item => item.id !== board.id).id }, { revision: 'incorrect' }, { target: 'rp2040' }]) {
      assert.throws(() => assertA6Manifest({ ...manifest, ...patch }, getA6Board(board.id)), /Manifest/)
    }
    const elf = readFileSync(asset(board.id + '/firmware.elf'))
    assert.equal(hash(elf), manifest.elf.sha256)
    const other = proposal.boards.find(item => item.id !== board.id)
    assert.equal(hash(readFileSync(asset(other.id + '/firmware.elf'))), manifest.elf.sha256)
    const header = Buffer.from(elf)
    header.writeUInt16LE(243, 18)
    assert.throws(() => assertA6Elf(header), /ELF/)
    assert.throws(() => assertA6Elf(elf.subarray(0, 100)), /ELF/)
    for (const file of proposal.runtime.artifact.files) {
      const data = readFileSync(asset('engine/' + file.path.split('/').at(-1)))
      assert.equal(data.length, file.bytes)
      assert.equal(hash(data), file.sha256)
    }
    const { default: factory } = await import(asset('engine/picoemu.wasm.js').href)
    const engine = await factory({ wasmBinary: readFileSync(asset('engine/picoemu.wasm.wasm')), print: () => {}, printErr: () => {} })
    let uart = ''
    const machine = createA6Machine(engine, elf, text => { uart += text })
    machine.setPressed(false)
    for (let step = 0; step < 100 && !uart.includes('A6_BUTTON=0'); step++) machine.step()
    assert.ok(uart.split('\n').includes(proposal.firmware.behavior.readyLine))
    assert.match(uart, /A6_BUTTON=0/)
    const released = machine.sample()
    assert.equal(released.inputHigh, true)
    assert.equal(released.outputHigh, false)
    const start = released.timeUs
    machine.setPressed(true)
    while (machine.sample().timeUs - start < 20_000) {
      machine.step()
      assert.equal(machine.sample().outputHigh, false)
    }
    machine.setPressed(false)
    for (let step = 0; step < 55; step++) {
      machine.step()
      assert.equal(machine.sample().outputHigh, false)
    }
    let driven
    for (const pressed of [true, false, true, false, true, false]) {
      machine.setPressed(pressed)
      const startUs = machine.sample().timeUs
      for (let step = 0; step < 65 && machine.sample().outputHigh !== pressed; step++) machine.step()
      const frame = machine.sample()
      assert.equal(frame.outputHigh, pressed, uart)
      assert.equal(frame.inputHigh, !pressed)
      const us = frame.timeUs - startUs
      assert.ok(us >= 39_000 && us <= 60_000, 'Transition after ' + us + ' µs')
      if (pressed) driven = frame
      t.diagnostic('GP15 edge at ' + us + ' µs')
    }
    assert.deepEqual(uart.match(/A6_BUTTON=[01]/g), ['A6_BUTTON=0', ...Array.from({ length: 3 }, () => ['A6_BUTTON=1', 'A6_BUTTON=0']).flat()])
    const spice = new Simulation()
    await spice.start()
    for (const sample of [released, driven]) {
      spice.setNetList(a6DcNetlist(!sample.inputHigh, sample.outputHigh))
      const result = await spice.runSim()
      const value = name => result.data.find(line => line.name.toLowerCase() === name).values[0]
      const volts = value('v(gpio14)')
      const ma = -1000 * value('i(vout)')
      const k = proposal.electrical.acceptance
      const inRange = (number, [lo, hi]) => number >= lo && number <= hi
      assert.ok(sample.inputHigh ? inRange(volts, k.releasedInputVolts) : Math.abs(volts) <= k.pressedInputAbsoluteMaxVolts)
      assert.ok(sample.outputHigh ? inRange(ma, k.ledHighCurrentMilliAmps) : Math.abs(ma) <= k.ledLowAbsoluteMaxMilliAmps)
      const kvl = Math.abs(value('v(gpio15)') - value('v(anode)') - ma)
      assert.ok(kvl <= k.kvlAbsoluteMaxVolts)
      t.diagnostic(JSON.stringify({ timeUs: sample.timeUs, inputVolts: volts, currentMilliAmps: ma, kvlVolts: kvl }))
    }
  })
}
