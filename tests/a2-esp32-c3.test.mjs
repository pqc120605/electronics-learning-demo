import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const approval = JSON.parse(readFileSync(new URL('../docs/research/2026-11-27-esp32-c3-electrical-firmware-a2-proposal.json', import.meta.url)))
let server
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', envFile: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await server?.close() })

const loadFixture = () => server.ssrLoadModule('/src/lib/freestyle/a2C3Fixture.ts')

test('the approved A2 circuit resolves active-low input and active-high output across the actual nets', async () => {
  const { buildA2C3Fixture, validateA2C3Circuit } = await loadFixture()
  const { doc, pinMap, boardId } = buildA2C3Fixture()
  assert.equal(boardId, approval.board.id)
  assert.equal(pinMap.input, 4)
  assert.equal(pinMap.ledOut, 10)
  assert.deepEqual(validateA2C3Circuit(doc, boardId, pinMap), [])
  assert.ok(validateA2C3Circuit(doc, 'esp32-devkit', pinMap).length)
  assert.ok(validateA2C3Circuit(doc, boardId, { ...pinMap, input: 5 }).length)
  for (const wire of doc.wires) {
    assert.ok(validateA2C3Circuit({ ...doc, wires: doc.wires.filter(candidate => candidate !== wire) }, boardId, pinMap).length, wire.id)
  }
  const reverse = endpoint => endpoint.partId === 'a2-led' ? { ...endpoint, pinId: endpoint.pinId === 'anode' ? 'cathode' : 'anode' } : endpoint
  const reversed = { ...doc, wires: doc.wires.map(wire => ({ ...wire, from: reverse(wire.from), to: reverse(wire.to) })) }
  assert.ok(validateA2C3Circuit(reversed, boardId, pinMap).length)
  assert.ok(validateA2C3Circuit({ ...doc, wires: [...doc.wires, { id: 'short', role: 'signal', from: { kind: 'pin', partId: 'board', pinId: 'vcc' }, to: { kind: 'pin', partId: 'board', pinId: 'gnd' } }] }, boardId, pinMap).length)
})

test('ngspice solves voltages and current for the two approved GPIO states', async (test) => {
  const { a2DcNetlist } = await loadFixture()
  const simulation = new Simulation()
  await simulation.start()
  for (const pressed of [false, true]) {
    simulation.setNetList(a2DcNetlist(pressed, pressed))
    const result = await simulation.runSim()
    const value = name => result.data.find(series => series.name.toLowerCase() === name).values[0]
    const input = value('v(gpio4)')
    const output = value('v(gpio10)')
    const ledVolts = value('v(anode)')
    const ledMilliAmps = -1000 * value('i(vout)')
    if (pressed) {
      assert.ok(input < 0.001)
      assert.ok(ledMilliAmps > 1.1 && ledMilliAmps < 1.5)
    } else {
      assert.ok(Math.abs(input - 3.3) < 0.01)
      assert.ok(Math.abs(ledMilliAmps) < 0.001)
    }
    assert.ok(Math.abs(output - ledVolts - ledMilliAmps) < 0.001)
    test.diagnostic(JSON.stringify({ pressed, inputV: input, outputV: output, ledV: ledVolts, ledMilliAmps }))
  }
})

test('ESP32-C3 bootloader and application headers reject a mismatched chip before execution', async () => {
  const { assertA2C3Image } = await server.ssrLoadModule('/src/lib/freestyle/a2C3Image.ts')
  const image = new Uint8Array(4194304)
  for (const offset of [0, 65536]) {
    image[offset] = 0xe9
    image[offset + 1] = 1
    image[offset + 12] = 5
  }
  assert.doesNotThrow(() => assertA2C3Image(image))
  image[65536 + 12] = 9
  assert.throws(() => assertA2C3Image(image), /ESP32-C3/)
  assert.throws(() => assertA2C3Image(image.subarray(0, 128)), /4 MiB/)
})

test('debug groups cover the A2 revisions without mutating A1 primary headers', async () => {
  const { getAnchoredAuxPins, getBoardAuxConnectors } = await server.ssrLoadModule('/src/lib/boardAuxConnectors.ts')
  const { getBoardHeaderPins } = await server.ssrLoadModule('/src/lib/boardCatalogModels.ts')
  for (const group of approval.connectorAudit.additions) {
    for (const id of group.boards) {
      assert.ok(getBoardAuxConnectors(id).length, id)
    }
  }
  const f401 = getBoardAuxConnectors('stm32-nucleo').find(group => group.id === 'CN4')
  assert.equal(f401.pins.length, 6)
  assert.equal(f401.pins[0].role, 'voltage-reference')
  assert.equal(f401.pins[5].role, 'reserved')
  assert.equal((await getBoardHeaderPins('stm32-nucleo')).length, 108)
  const c3 = await getBoardHeaderPins(approval.board.id)
  assert.equal(c3.length, 30)
  assert.ok(c3.find(pin => pin.headerReference === 'J3' && pin.padNumber === '11').functions.includes('GPIO4 / MTMS'))
  const picoh = getBoardAuxConnectors('raspberry-pi-pico-2-h').find(group => group.id === 'SWD')
  assert.deepEqual(picoh.pins.map(pin => [pin.number, pin.label]), [['1', 'SWCLK'], ['2', 'GND'], ['3', 'SWDIO']])
  const every = getBoardAuxConnectors('arduino-nano-every').find(group => group.id === 'SWD')
  assert.equal(every.pins.find(pin => pin.number === '4').role, 'absent')
  const picoW = getAnchoredAuxPins('raspberry-pi-pico-w', 'Pico W')
  assert.ok(picoW.every(pin => pin.anchor[2] === -0.0198001))
  assert.equal(picoW[2].label, 'SWDIO')
  const minima = getAnchoredAuxPins('arduino-uno-r4-minima', 'ABX00080')
  assert.equal(minima.length, 16)
  assert.equal(minima.find(pin => pin.id === 'aux-j2-6').catalog.status, 'nc')
  const wifi = getAnchoredAuxPins('arduino-uno-r4-wifi', 'ABX00087')
  assert.equal(wifi.length, 19)
  assert.equal(wifi.find(pin => pin.id === 'aux-j6-2').label, 'GPIO41 / MTDI')
  const feather = getAnchoredAuxPins('adafruit-feather-esp32-s3-5323', '#5323')
  assert.equal(feather.length, 4)
  assert.equal(feather.find(pin => pin.id === 'aux-conn1-3').label, 'SDA / GPIO3')
  const featherTft = getBoardAuxConnectors('adafruit-feather-esp32-s3-tft-5483')[0]
  assert.equal(featherTft.pins.find(pin => pin.number === '3').label, 'SDA / GPIO42')
})

const assets = new URL('../.tmp/a2-local-assets/', import.meta.url)
test('the pinned ESP-EMU core boots the staged RISC-V binary and sees three wired GPIO transitions', {
  skip: !existsSync(new URL('manifest.json', assets)) && 'Cần build và stage tài sản A2 local',
}, async () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', assets)))
  const image = readFileSync(new URL('flash.bin', assets))
  const sha256 = createHash('sha256').update(image).digest('hex')
  assert.equal(sha256, manifest.flash.sha256)
  const { default: init, WasmEmulator } = await import(new URL('esp_emu.js', assets).href)
  await init({ module_or_path: readFileSync(new URL('esp_emu_bg.wasm', assets)) })
  const emulator = new WasmEmulator('esp32c3')
  try {
    emulator.load_default_rom()
    emulator.load_firmware(image)
    for (const [index, high] of [true, false, true, false, true, false, true].entries()) {
      emulator.gpio_set_input(4, high)
      const start = emulator.cycles()
      const expected = `A2_BUTTON=${high ? 0 : 1}`
      let serial = ''
      for (let batch = 0; batch < 100 && !serial.includes(expected); batch++) {
        serial += emulator.run_batch(500_000)
        assert.equal(emulator.faulted(), false, emulator.fault_report())
      }
      assert.ok(serial.includes(expected), serial)
      if (index === 0) assert.ok(serial.includes('A2_READY'))
      const [output, , enabled] = emulator.gpio_state()
      assert.ok(enabled & (1 << 10))
      assert.equal(Boolean(output & (1 << 10)), !high)
      assert.equal(Boolean(emulator.read_memory(0x6000403c, 1)[0] & (1 << 4)), high)
      if (index > 0) assert.ok((emulator.cycles() - start) / emulator.cycles_per_us() >= 39_000)
    }
  } finally {
    emulator.free()
  }
})
