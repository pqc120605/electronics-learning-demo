import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const configBytes = await readFile(new URL('../docs/research/2026-11-27-esp32-s3-electrical-firmware-a4-proposal.json', import.meta.url))
const config = JSON.parse(configBytes)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const lock = '87ecccdc51aea68b8c75b0a8aa07623d146e5bea4b520827e86e77cff8066475'
const assets = new URL('../.tmp/a4-local-assets/', import.meta.url)
const enginePath = new URL('../.tmp/a2-local-assets/', import.meta.url)
let server
let engine
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', envFile: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await server?.close() })
const fixtureModule = () => server.ssrLoadModule('/src/lib/freestyle/a4EspFixture.ts')

for (const board of config.boards) {
  test(`${board.id} binds the approved revision, pads and saved circuit`, async () => {
    const { buildA4Fixture, getActiveA4Board, validateA4Circuit } = await fixtureModule()
    const { getBoardHeaderPins } = await server.ssrLoadModule('/src/lib/boardCatalogModels.ts')
    const { parseFreestyleWorkspace } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
    const { freestylePresentation } = await server.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
    const { freestyleAssembly } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
    assert.equal(sha256(configBytes), lock)
    if (board.source.path) assert.equal(sha256(await readFile(board.source.path)), board.source.sha256)
    const { doc, boardId, pinMap } = buildA4Fixture(board.fixtureId)
    assert.equal(getActiveA4Board(boardId, doc)?.flashMiB, board.flashMiB)
    assert.deepEqual(validateA4Circuit(doc, boardId, pinMap), [])
    const restored = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, pinMap, doc, language: 'cpp', code: '' }))
    assert.deepEqual(restored?.doc, doc)
    for (const wire of doc.wires) {
      assert.ok(validateA4Circuit({ ...doc, wires: doc.wires.filter(candidate => candidate !== wire) }, boardId, pinMap).length)
    }
    const reversed = point => point.partId === 'a4-led' ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point
    assert.ok(validateA4Circuit({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: reversed(wire.from), to: reversed(wire.to) })) }, boardId, pinMap).length)
    assert.ok(validateA4Circuit(doc, boardId, { ...pinMap, ledOut: 7 }).length)
    for (const other of config.boards.filter(candidate => candidate.id !== boardId)) assert.ok(validateA4Circuit(doc, other.id, pinMap).length)
    const short = { id: 'short', from: { kind: 'pin', partId: 'board', pinId: 'vcc' }, to: { kind: 'pin', partId: 'board', pinId: 'gnd' } }
    const wrongRail = { ...doc, wires: doc.wires.map(wire => wire.from.partId === 'board' && wire.from.pinId === 'vcc'
      ? { ...wire, from: { ...wire.from, pinId: 'v5' } } : wire) }
    assert.ok(validateA4Circuit(wrongRail, boardId, pinMap).length)
    assert.ok(validateA4Circuit({ ...doc, wires: [...doc.wires, short] }, boardId, pinMap).length)
    const physical = await getBoardHeaderPins(boardId)
    const view = freestylePresentation(boardId, pinMap, doc)
    assert.equal(physical.length, board.headerLocations)
    for (const [role, expected] of [['input', board.button], ['ledOut', board.led], ['vcc', board.power], ['gnd', board.ground]]) {
      const pad = physical.find(pin => pin.id === expected.pinId)
      assert.equal(pad.label, expected.label)
      assert.equal(pad.headerReference + ':' + pad.padNumber, expected.pad)
      assert.deepEqual(view.pinAnchors[role], pad.anchor.map(value => value * 1000))
    }
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    assert.deepEqual(assembly.diagnostics, [])
  })

  test(`${board.id} solves DC in both GPIO5/GPIO6 states`, async t => {
    const { a4DcNetlist } = await fixtureModule()
    const sim = new Simulation()
    await sim.start()
    for (const pressed of [false, true]) {
      sim.setNetList(a4DcNetlist(pressed, pressed))
      const result = await sim.runSim()
      const value = name => result.data.find(series => series.name.toLowerCase() === name).values[0]
      const inputV = value('v(gpio5)')
      const ledMa = -1000 * value('i(vout)')
      const k = config.electrical.passCriteria
      assert.ok(pressed ? inputV > 0 && inputV < k.maxPressedInputV : inputV >= k.releasedInputV[0] && inputV <= k.releasedInputV[1])
      assert.ok(pressed ? ledMa >= k.ledOnMa[0] && ledMa <= k.ledOnMa[1] : Math.abs(ledMa) < k.maxLedOffAbsoluteMa)
      assert.ok(Math.abs(value('v(gpio6)') - value('v(anode)') - ledMa) < k.maxLedBranchKvlResidualV)
      t.diagnostic(JSON.stringify({ pressed, inputV, ledMa }))
    }
  })

  const folder = new URL(board.flashMiB + 'm/', assets)
  const localReady = ['manifest.json', 'flash.bin'].every(file => existsSync(new URL(file, folder)))
    && existsSync(new URL('esp_emu_bg.wasm', enginePath))
  test(`${board.id} boots ${board.flashMiB} MiB Xtensa firmware and debounces GPIOs`, {
    skip: !localReady && 'Cần chuẩn bị ảnh Xtensa A4 và ESP-EMU local',
  }, async t => {
    const { assertA4Image } = await server.ssrLoadModule('/src/lib/freestyle/a4EspRuntime.ts')
    const manifest = JSON.parse(await readFile(new URL('manifest.json', folder)))
    const image = await readFile(new URL('flash.bin', folder))
    assert.equal(manifest.approvalSha256, lock)
    assert.equal(manifest.flashMiB, board.flashMiB)
    assert.equal(sha256(image), manifest.flash.sha256)
    assertA4Image(image, board.flashMiB)
    if (!engine) {
      engine = await import(new URL('esp_emu.js', enginePath).href)
      await engine.default({ module_or_path: await readFile(new URL('esp_emu_bg.wasm', enginePath)) })
    }
    const emu = new engine.WasmEmulator('esp32s3')
    try {
      emu.load_default_rom()
      emu.load_firmware(image)
      const inputHigh = () => Boolean(emu.read_memory(0x6000403c, 1)[0] & (1 << 5))
      const ledHigh = () => Boolean(emu.gpio_state()[0] & (1 << 6))
      const elapsed = start => (emu.cycles() - start) / emu.cycles_per_us()
      function waitSerial(expected) {
        let serial = ''
        for (let i = 0; i < 350 && !serial.includes(expected); i++) {
          serial += emu.run_batch(250_000)
          assert.equal(emu.faulted(), false, emu.fault_report())
        }
        assert.ok(serial.includes(expected), serial.slice(-1800))
        return serial
      }
      emu.gpio_set_input(5, true)
      assert.match(waitSerial('A4_BUTTON=0'), new RegExp('A4_READY=esp32s3:' + board.flashMiB))
      assert.ok(emu.gpio_state()[2] & (1 << 6))
      assert.equal(inputHigh(), true)
      assert.equal(ledHigh(), false)
      for (const [high, duration] of [[false, 20_000], [true, 55_000]]) {
        emu.gpio_set_input(5, high)
        const start = emu.cycles()
        while (elapsed(start) < duration) {
          assert.doesNotMatch(emu.run_batch(50_000), /A4_BUTTON=1/)
          assert.equal(ledHigh(), false)
        }
      }
      for (const high of [false, true, false, true, false, true]) {
        emu.gpio_set_input(5, high)
        const start = emu.cycles()
        waitSerial(`A4_BUTTON=${high ? 0 : 1}`)
        assert.ok(elapsed(start) >= 39_000 && elapsed(start) < 100_000, `transition: ${elapsed(start)} µs`)
        assert.equal(inputHigh(), high)
        assert.equal(ledHigh(), !high)
        t.diagnostic(`GPIO6 transition after ${Math.round(elapsed(start))} µs`)
      }
    } finally { emu.free() }
  })
}

test('headers reject the wrong S3 size, flash mode or MCU', async () => {
  const { assertA4Image } = await server.ssrLoadModule('/src/lib/freestyle/a4EspRuntime.ts')
  for (const size of [4, 8, 16]) {
    const image = new Uint8Array(size * 1048576)
    for (const address of [0, 0x10000]) image.set([0xe9, 1, 2, (Math.log2(size) << 4), 0, 0, 0, 0, 0, 0, 0, 0, 9], address)
    image.set([0xaa, 0x50], 0x8000)
    assert.doesNotThrow(() => assertA4Image(image, size))
    assert.throws(() => assertA4Image(image, size === 4 ? 8 : 4))
    image[2] = 0
    assert.throws(() => assertA4Image(image, size))
    image[2] = 2
    image[0x1000c] ^= 1
    assert.throws(() => assertA4Image(image, size))
  }
})

test('DevKitC generic code still gets its original GPIO map and no A4 controls', async () => {
  const { buildSampleCircuit } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  const { getActiveA4Board } = await fixtureModule()
  const boardId = 'esp32-s3-devkitc-1'
  const { doc, pinMap } = buildSampleCircuit('blink', boardId)
  assert.equal(pinMap.ledOut, 4)
  assert.equal(getActiveA4Board(boardId, doc), undefined)
})
