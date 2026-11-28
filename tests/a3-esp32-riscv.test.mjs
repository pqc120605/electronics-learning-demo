import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const configBytes = await readFile(new URL('../docs/research/2026-11-27-esp32-riscv-electrical-firmware-a3-proposal.json', import.meta.url))
const config = JSON.parse(configBytes)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const approval = '9518d9f6aad764021e448763534a185c098c37643e56d6f587e6cbf81a542dd5'
let server
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', envFile: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await server?.close() })

for (const board of config.boards) {
  test(`${board.id} matches the approved source digest`, {
    skip: board.source.path.startsWith('docs/research/downloads/') && !existsSync(board.source.path)
      && process.env.MACHMO_REQUIRE_A3_ASSETS !== '1' && 'Manufacturer reference is available in the local research checkout.',
  }, async () => {
    assert.equal(sha256(await readFile(board.source.path)), board.source.sha256)
  })

  test(`${board.id} resolves approved pads and rejects wrong wiring`, async () => {
    const { buildA3Fixture, getA3Board, validateA3Circuit } = await server.ssrLoadModule('/src/lib/freestyle/a3EspFixture.ts')
    const { getBoardHeaderPins } = await server.ssrLoadModule('/src/lib/boardCatalogModels.ts')
    const { freestylePresentation } = await server.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
    const { parseFreestyleWorkspace } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
    const { freestyleAssembly } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
    assert.equal(sha256(configBytes), approval)
    const fixture = buildA3Fixture(board.fixtureId)
    const { doc, pinMap, boardId } = fixture
    assert.equal(boardId, board.id)
    const profile = getA3Board(boardId)
    assert.equal(profile.revision, board.revision)
    assert.equal(pinMap.input, board.button.gpio)
    assert.equal(pinMap.ledOut, 10)
    assert.deepEqual(validateA3Circuit(doc, boardId, pinMap), [])
    const restored = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, pinMap, doc, language: 'cpp', code: '' }))
    assert.deepEqual(restored?.doc, doc)
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    assert.deepEqual(assembly.diagnostics, [])
    for (const wire of doc.wires) {
      assert.ok(validateA3Circuit({ ...doc, wires: doc.wires.filter(candidate => candidate !== wire) }, boardId, pinMap).length, wire.id)
    }
    const reverse = endpoint => endpoint.partId === 'a3-led' ? { ...endpoint, pinId: endpoint.pinId === 'anode' ? 'cathode' : 'anode' } : endpoint
    assert.ok(validateA3Circuit({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: reverse(wire.from), to: reverse(wire.to) })) }, boardId, pinMap).length)
    assert.ok(validateA3Circuit(doc, 'esp32-c3-devkitm-1', pinMap).length)
    for (const other of config.boards.filter(candidate => candidate.id !== boardId)) {
      assert.ok(validateA3Circuit(doc, other.id, pinMap).length)
    }
    const wrongRevision = { ...doc, parts: doc.parts.map(part => part.type === 'board' ? { ...part, value: { label: 'Khác revision' } } : part) }
    assert.ok(validateA3Circuit(wrongRevision, boardId, pinMap).length)
    assert.ok(validateA3Circuit(doc, boardId, { ...pinMap, input: -1 }).length)
    for (const pad of ['j1-16', 'j1-12', 'vcc']) {
      const newWire = { id: 'unapproved', role: 'signal', from: { kind: 'pin', partId: 'board', pinId: 'gnd' }, to: { kind: 'pin', partId: 'board', pinId: pad } }
      assert.ok(validateA3Circuit({ ...doc, wires: [...doc.wires, newWire] }, boardId, pinMap).length)
    }
    const physical = await getBoardHeaderPins(boardId)
    const view = freestylePresentation(boardId, pinMap)
    assert.equal(physical.length, board.headerLocations)
    const pinsById = new Map(physical.map(pin => [pin.id, pin]))
    const ncIds = { esp32c6: ['j1-16', 'j3-16'], esp32h2: ['j1-7', 'j1-8', 'j1-11'] }[board.target] ?? []
    for (const id of ncIds) assert.equal(pinsById.get(id)?.catalog?.status, 'nc')
    if (board.target === 'esp32h2') assert.equal(pinsById.get('j1-12')?.label, 'VBAT')
    if (board.target !== 'esp32c3') {
      const { getBoardAuxConnectors } = await server.ssrLoadModule('/src/lib/boardAuxConnectors.ts')
      const j5 = getBoardAuxConnectors(boardId).find(connector => connector.id === 'J5')
      assert.match(j5?.title, /đo dòng/)
      assert.equal(j5.pins.some(pin => pin.anchor), false)
    }
    for (const [role, expected] of [['input', board.button], ['ledOut', board.led], ['vcc', board.power], ['gnd', board.ground]]) {
      const pad = physical.find(pin => pin.id === expected.pinId)
      assert.equal(pad.label, expected.label)
      assert.deepEqual(view.pinAnchors[role], pad.anchor.map(value => value * 1000))
    }
  })

  test(`${board.id} solves both firmware-driven DC states`, async t => {
    const { a3DcNetlist } = await server.ssrLoadModule('/src/lib/freestyle/a3EspFixture.ts')
    const sim = new Simulation()
    await sim.start()
    for (const pressed of [false, true]) {
      sim.setNetList(a3DcNetlist(board.id, pressed, pressed))
      const result = await sim.runSim()
      const value = name => result.data.find(series => series.name.toLowerCase() === name).values[0]
      const input = value('v(gpio' + board.button.gpio + ')')
      const current = -1000 * value('i(vout)')
      assert.ok(pressed ? input > 0 && input < .001 : Math.abs(input - 3.3) < .01)
      assert.ok(pressed ? current >= 1.1 && current <= 1.5 : Math.abs(current) < .001)
      assert.ok(Math.abs(value('v(gpio10)') - value('v(anode)') - current) < .001)
      t.diagnostic(JSON.stringify({ pressed, input, current }))
    }
  })
}

test('A3 image validation binds size and both chip headers to the target', async () => {
  const { assertA3Image } = await server.ssrLoadModule('/src/lib/freestyle/a3EspRuntime.ts')
  for (const [target, settings] of Object.entries(config.runtime.targets)) {
    const bytes = new Uint8Array(settings.flashBytes)
    for (const address of [0, 0x10000]) {
      bytes[address] = 0xe9
      bytes[address + 1] = 1
      bytes[address + 12] = Number(settings.chipId)
    }
    assert.doesNotThrow(() => assertA3Image(bytes, target))
    assert.throws(() => assertA3Image(bytes.subarray(1), target))
    bytes[0x1000c] ^= 1
    assert.throws(() => assertA3Image(bytes, target))
  }
})

const enginePath = new URL('../.tmp/a2-local-assets/', import.meta.url)
const a3Assets = new URL('../.tmp/a3-local-assets/', import.meta.url)
let engine

for (const board of config.boards) {
  const localReady = ['manifest.json', 'flash.bin'].every(file => existsSync(new URL(board.target + '/' + file, a3Assets)))
    && existsSync(new URL('esp_emu_bg.wasm', enginePath))
  test(`${board.id} executes compiled RISC-V code with GPIO timing and debounce`, {
    skip: !localReady && 'Cần build và chuẩn bị tài sản firmware A3 local',
  }, async t => {
    const { assertA3Image } = await server.ssrLoadModule('/src/lib/freestyle/a3EspRuntime.ts')
    const target = board.target
    const manifest = JSON.parse(await readFile(new URL(target + '/manifest.json', a3Assets)))
    const image = await readFile(new URL(target + '/flash.bin', a3Assets))
    assert.equal(manifest.approvalSha256, approval)
    assert.equal(manifest.target, target)
    assert.equal(sha256(image), manifest.flash.sha256)
    assertA3Image(image, target)
    if (!engine) {
      engine = await import(new URL('esp_emu.js', enginePath).href)
      await engine.default({ module_or_path: await readFile(new URL('esp_emu_bg.wasm', enginePath)) })
    }
    const emulator = new engine.WasmEmulator(target)
    try {
      emulator.load_default_rom()
      emulator.load_firmware(image)
      const input = board.button.gpio
      const inputReg = Number(config.runtime.targets[target].gpioInputRegister)
      const inputHigh = () => Boolean(emulator.read_memory(inputReg, 1)[0] & (1 << input))
      const ledHigh = () => Boolean(emulator.gpio_state()[0] & (1 << board.led.gpio))
      const elapsed = start => (emulator.cycles() - start) / emulator.cycles_per_us()
      function waitSerial(expected) {
        let serial = ''
        for (let i = 0; i < 350 && !serial.includes(expected); i++) {
          serial += emulator.run_batch(250_000)
          assert.equal(emulator.faulted(), false, emulator.fault_report())
        }
        assert.ok(serial.includes(expected), serial.slice(-1500))
        return serial
      }

      emulator.gpio_set_input(input, true)
      const boot = waitSerial('A3_BUTTON=0')
      assert.ok(boot.includes('A3_READY=' + target), boot)
      assert.ok(emulator.gpio_state()[2] & (1 << board.led.gpio))
      assert.equal(inputHigh(), true)
      assert.equal(ledHigh(), false)
      emulator.gpio_set_input(input, false)
      assert.equal(inputHigh(), false)
      const pulseStart = emulator.cycles()
      while (elapsed(pulseStart) < 20_000) {
        assert.doesNotMatch(emulator.run_batch(50_000), /A3_BUTTON=1/)
        assert.equal(ledHigh(), false)
      }
      emulator.gpio_set_input(input, true)
      const settle = emulator.cycles()
      while (elapsed(settle) < 55_000) {
        assert.doesNotMatch(emulator.run_batch(50_000), /A3_BUTTON=1/)
        assert.equal(ledHigh(), false)
      }
      for (const high of [false, true, false, true, false, true]) {
        emulator.gpio_set_input(input, high)
        const start = emulator.cycles()
        waitSerial(`A3_BUTTON=${high ? 0 : 1}`)
        assert.ok(elapsed(start) >= 39_000 && elapsed(start) < 85_000, `transition: ${elapsed(start)} µs`)
        t.diagnostic(`GPIO${input} ${high ? 'nhả' : 'nhấn'} → LED sau ${Math.round(elapsed(start))} µs mô phỏng`)
        assert.equal(inputHigh(), high)
        assert.equal(ledHigh(), !high)
      }
    } finally {
      emulator.free()
    }
  })
}
