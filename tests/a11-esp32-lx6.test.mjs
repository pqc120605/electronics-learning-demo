import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

const bytes = readFileSync('docs/research/2026-11-27-esp32-lx6-electrical-firmware-a11-proposal.json')
const proposal = JSON.parse(bytes)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const path = '.tmp/a11-local-assets'
const staged = process.env.MACHMO_REQUIRE_A11_ASSETS === '1' || existsSync(`${path}/image/manifest.json`)

test('A11 verifies the approved proposal and decodes all 32 bits of GPIO on LX6', async () => {
  const { readA11Proposal } = await import('../scripts/a11-esp32-assets.mjs')
  assert.deepEqual(await readA11Proposal(), proposal)
  const vite = await createServer({ configFile: false, envFile: false, logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
  try {
    const { sampleA11Gpio } = await vite.ssrLoadModule('/src/lib/freestyle/a11EspRuntime.ts')
    const registers = new Map([[0x3ff4403c, 0x02000001], [0x3ff44004, 0x04000000], [0x3ff44020, 0x04000000]])
    const engine = { read_memory(addr, size) {
      assert.equal(size, 4)
      assert.ok(registers.has(addr), addr.toString(16))
      const bytes = new Uint8Array(4)
      new DataView(bytes.buffer).setUint32(0, registers.get(addr), true)
      return bytes
    } }
    assert.deepEqual(sampleA11Gpio(engine), { inputHigh: true, outputHigh: true })
    registers.set(0x3ff4403c, 1)
    assert.deepEqual(sampleA11Gpio(engine), { inputHigh: false, outputHigh: true })
    registers.set(0x3ff44020, 0)
    assert.equal(sampleA11Gpio(engine), undefined)
  } finally { await vite.close() }
})

test('A11 runs native LX6 firmware and ngspice for both board fixtures', { skip: !staged }, async t => {
  const { createA11Machine } = await import('../scripts/probe-a11-esp32.mjs')
  const image = readFileSync(`${path}/image/flash.bin`)
  const manifest = JSON.parse(readFileSync(`${path}/image/manifest.json`))
  const vite = await createServer({ configFile: false, envFile: false, logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
  t.after(() => vite.close())
  const runtime = await vite.ssrLoadModule('/src/lib/freestyle/a11EspRuntime.ts')
  const fixtures = await vite.ssrLoadModule('/src/lib/freestyle/a11EspFixture.ts')
  const { getBoardHeaderPins } = await vite.ssrLoadModule('/src/lib/boardCatalogModels.ts')
  const { freestylePresentation } = await vite.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
  const { freestyleAssembly } = await vite.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
  const { availablePins } = await vite.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  assert.equal(manifest.sourceSha256, hash(readFileSync('firmware/esp32-lx6-a11/main/button_led.c')))
  assert.throws(() => runtime.assertA11Source(image, '0'.repeat(64)), /SHA-256 mã nguồn/)
  for (const [index, item] of proposal.boards.entries()) {
    const board = runtime.getA11Board(item.id)
    const { doc, boardId, pinMap } = fixtures.buildA11Fixture(item.fixtureId)
    assert.deepEqual(fixtures.validateA11Circuit(doc, boardId, pinMap), [])
    assert.equal(manifest.fixtures[boardId].sha256, hash(JSON.stringify(fixtures.buildA11Fixture(item.fixtureId))))
    const pads = await getBoardHeaderPins(boardId)
    assert.equal(pads.length, item.padCount)
    const view = freestylePresentation(boardId, pinMap, doc)
    for (const [role, key] of Object.entries({ input: 'button', ledOut: 'led', vcc: 'power', gnd: 'ground' })) {
      const pin = pads.find(pin => pin.id === item.pins[key].pinId)
      assert.ok(pin)
      assert.equal(pin.gpio, item.pins[key].gpio)
      assert.deepEqual(view.pinAnchors[role], pin.anchor.map(n => n * 1000))
    }
    if (boardId === 'esp32-devkitm-1') {
      assert.deepEqual(availablePins(boardId, 'input'), [25])
      assert.deepEqual(availablePins(boardId, 'ledOut'), [26])
      assert.deepEqual(availablePins(boardId, 'trig'), [])
      for (const gpio of [34, 35, 36, 37, 38, 39]) {
        assert.match(pads.find(pin => pin.gpio === gpio).functions.join(' '), /chỉ nhận input/)
      }
    }
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.deepEqual(assembly.diagnostics, [])
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    for (const wire of doc.wires) {
      assert.ok(fixtures.validateA11Circuit({ ...doc, wires: doc.wires.filter(item => item !== wire) }, boardId, pinMap).length)
    }
    assert.ok(fixtures.validateA11Circuit(doc, proposal.boards[1 - index].id, pinMap).length)
    assert.ok(fixtures.validateA11Circuit(doc, boardId, { ...pinMap, input: 34 }).length)
    const remapPins = (partId, changes) => ({
      ...doc, wires: doc.wires.map(wire => Object.fromEntries(Object.entries(wire).map(([key, value]) => [
        key, value?.partId === partId && changes[value.pinId] ? { ...value, pinId: changes[value.pinId] } : value,
      ]))),
    })
    assert.ok(fixtures.validateA11Circuit(remapPins('board', { vcc: 'v5' }), boardId, pinMap).length)
    assert.ok(fixtures.validateA11Circuit(remapPins('a11-led', { anode: 'cathode', cathode: 'anode' }), boardId, pinMap).length)
    assert.ok(fixtures.validateA11Circuit({ ...doc, parts: doc.parts.map(part => part.id === 'a11-limit'
      ? { ...part, value: { ohm: 220 } } : part) }, boardId, pinMap).length)

    const result = await createA11Machine(runtime, image)
    let serial = result.serial
    const run = (pressed, ms) => {
      const frame = result.step(pressed, ms)
      serial += frame.serial
      assert.equal(frame.inputHigh, !pressed)
      return frame
    }
    try {
      const released = run(false, 80)
      assert.equal(released.outputHigh, false)
      assert.ok(serial.includes('A11_SOURCE_SHA256=' + manifest.sourceSha256))
      assert.match(serial, /^A11_READY=esp32:4\r?$/m)
      assert.equal(run(true, 20).outputHigh, false)
      assert.equal(run(false, 70).outputHigh, false)
      let held
      for (const pressed of [true, false, true, false, true, false]) {
        const start = run(!pressed, 1).timeUs
        let frame = run(pressed, 2)
        while (frame.outputHigh !== pressed && frame.timeUs - start < 65_000) frame = run(pressed, 1)
        assert.equal(frame.outputHigh, pressed)
        const delay = (frame.timeUs - start) / 1000
        assert.ok(delay >= 39 && delay <= 65, `${boardId} edge at ${delay} ms`)
        t.diagnostic(`${boardId} edge at ${delay.toFixed(3)} ms`)
        if (pressed) held = frame
        run(pressed, 20)
      }
      assert.deepEqual(serial.match(/A11_LED=[01]/g), ['A11_LED=1','A11_LED=0','A11_LED=1','A11_LED=0','A11_LED=1','A11_LED=0'])
      const spice = new Simulation()
      await spice.start()
      const limits = proposal.acceptance.dc
      const within = (value, [low, high]) => value >= low && value <= high
      for (const frame of [released, held]) {
        spice.setNetList(fixtures.a11DcNetlist(!frame.inputHigh, frame.outputHigh))
        const dc = await spice.runSim()
        const v = name => dc.data.find(row => row.name.toLowerCase() === name).values[0]
        const input = v('v(gpio25)'), led = v('v(anode)'), currentMa = -1000 * v('i(vout)')
        assert.ok(frame.inputHigh ? within(input, limits.releasedInputVolts) : Math.abs(input) <= limits.pressedInputMaxAbsVolts)
        assert.ok(frame.outputHigh ? within(currentMa, limits.ledOnCurrentMilliAmps) && within(led, limits.ledOnAnodeVolts)
          : Math.abs(currentMa) <= limits.ledOffMaxAbsMilliAmps)
        assert.ok(Math.abs(v('v(gpio26)') - led - currentMa) <= limits.kvlMaxAbsVolts)
        t.diagnostic(JSON.stringify({ boardId, input, led, currentMa }))
      }
    } finally { result.close() }
  }
  const wrongChip = Buffer.from(image)
  wrongChip.writeUInt16LE(9, 0x1000 + 12)
  assert.throws(() => runtime.assertA11Image(wrongChip), /ESP32/)
  assert.throws(() => runtime.assertA11Image(image.subarray(0, 2048)), /4 MiB/)
  const wrongBoot = Buffer.from(image)
  wrongBoot[0x1000] = 0xff
  assert.throws(() => runtime.assertA11Image(wrongBoot), /bootloader/)
})

test('A11 serves assets from the local tools API and blocks direct dev-file access', { skip: !staged }, async t => {
  const vite = await createServer({
    envDir: '.tmp/a11-vendor',
    cacheDir: '.tmp/a11-vendor/vite-cache',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { host: '127.0.0.1', port: 0, strictPort: true, ws: false, watch: null },
  })
  t.after(() => vite.close())
  await vite.listen(0)
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
  const api = origin + '/api/local-tools/a11-esp/'
  const manifest = await fetch(api + 'image/manifest.json').then(response => response.json())
  assert.equal(manifest.approvalSha256, hash(bytes))
  const flash = await fetch(api + 'image/flash.bin')
  assert.equal(flash.status, 200)
  assert.equal(flash.headers.get('cache-control'), 'no-store')
  assert.equal(hash(Buffer.from(await flash.arrayBuffer())), manifest.flash.sha256)
  for (const path of ['engine/manifest.json', 'image/cosim.js', 'image/flash.bin.gz']) {
    assert.equal((await fetch(api + path)).status, 404)
  }
  const files = [
    '.tmp/a11-local-assets/image/flash.bin',
    '.tmp/a11-build/machmo_esp32_lx6_a11.bin',
    '.tmp/a11-vendor/esp-emu-1.3.0-wasm.tar.gz',
  ]
  for (const file of files) {
    for (const route of ['/' + file, '/@fs/' + resolve(file).replaceAll('\\', '/')]) {
      const response = await fetch(origin + route)
      assert.equal(response.status, 403, route)
      await response.body.cancel()
    }
  }
})
