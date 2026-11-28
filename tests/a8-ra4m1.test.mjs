import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'

const root = process.cwd()
const proposalPath = 'docs/research/2026-11-27-uno-r4-ra4m1-electrical-firmware-a8-proposal.json'
const bytes = readFileSync(proposalPath)
const proposal = JSON.parse(bytes)
const hash = value => createHash('sha256').update(value).digest('hex')
const expectedSha = 'c49ab23aa1e01d91fa6f7e3b9e9abc63cd98ad42d9b743bd60510a3b0ba5cd2d'
const native = process.env.MACHMO_REQUIRE_A8_ASSETS === '1'
  || proposal.boards.every(board => existsSync(resolve(root, '.tmp/a8-local-assets', board.sku, 'manifest.json')))
let vite
before(async () => {
  vite = await createServer({ envDir: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await vite?.close() })
const load = name => vite.ssrLoadModule('/src/lib/' + name + '.ts')

test('A8 loads the exact approved proposal and maps RA4M1 peripherals without network dependencies', async () => {
  assert.equal(hash(bytes), expectedSha)
  const { readA8Proposal, platformForA8 } = await import('../scripts/a8-ra4m1-profile.mjs')
  assert.deepEqual(await readA8Proposal(root), proposal)
  const repl = platformForA8(proposal)
  assert.match(repl, /systickFrequency: 8000000/)
  assert.match(repl, /port1: GPIOPort\.RenesasRA4_GPIO/)
  assert.match(repl, /sci2: SCI\.RenesasRA6M5_SCI @ sysbus 0x40070040/)
  assert.doesNotMatch(repl, /https?:|Python|ApplySVD/)
})

for (const board of proposal.boards) {
  test(board.sku + ' maps the correct headers in 2D and 3D and restores its fixture', async () => {
    const { buildA8Fixture, validateA8Circuit, getActiveA8Board } = await load('freestyle/a8Ra4m1Fixture')
    const { freestylePresentation } = await load('freestyle/freestylePresentation')
    const { freestyleAssembly } = await load('freestyle/freestyleAssembly')
    const { getBoardHeaderPins } = await load('boardCatalogModels')
    const { getBoardAuxConnectors } = await load('boardAuxConnectors')
    const { projectTopViewPoint } = await load('boardTopView')
    const { parseFreestyleWorkspace } = await load('freestyle/freestyleCircuit')
    const { boardId, doc, pinMap } = buildA8Fixture(board.fixtureId)
    assert.equal(boardId, board.id)
    assert.equal(getActiveA8Board(boardId, doc).sku, board.sku)
    assert.deepEqual(validateA8Circuit(doc, boardId, pinMap), [])
    const draft = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, doc, pinMap, code: '', language: 'cpp' }))
    assert.deepEqual(draft.doc, doc)
    assert.deepEqual(draft.pinMap, pinMap)
    const reject = (invalid, id = boardId, pins = pinMap) => assert.ok(validateA8Circuit(invalid, id, pins).length)
    reject(doc, proposal.boards.find(candidate => candidate.id !== boardId).id)
    reject(doc, boardId, { ...pinMap, input: 6 })
    for (const wire of doc.wires) reject({ ...doc, wires: doc.wires.filter(item => item !== wire) })
    reject({ ...doc, parts: doc.parts.filter(part => part.id !== 'a8-limit') })
    const remap = fn => ({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: fn(wire.from), to: fn(wire.to) })) })
    for (const pinId of ['3v3', 'vin', 'ioref', 'j2-2', 'j6-3']) {
      reject(remap(point => point.partId === 'board' && point.pinId === 'vcc' ? { ...point, pinId } : point))
    }
    reject(remap(point => point.partId === 'a8-led'
      ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point))

    const view = freestylePresentation(boardId, pinMap, doc)
    assert.equal(hash(readFileSync(board.model.path)), board.model.sha256)
    assert.equal(hash(readFileSync(board.topView.path)), board.topView.sha256)
    assert.equal(view.model.assetVersion, board.model.sha256.slice(0, 12))
    assert.equal(view.topView.image, '/' + board.topView.path.replace(/^public\//, ''))
    assert.match(view.pinLabels.input, new RegExp(board.button.gpio))
    assert.match(view.pinLabels.ledOut, new RegExp(board.led.gpio))
    const pins = await getBoardHeaderPins(boardId)
    assert.equal(pins.length, 32)
    const top = view.topView
    const frame = { x: 0, y: 0, width: top.width, height: top.height }
    const locations = pins.map(pin => projectTopViewPoint(top.boundsMm, frame, pin.anchor.map(value => value * 1000)))
    assert.ok(locations.every(Boolean))
    assert.equal(new Set(locations.map(({ x, y }) => x + ':' + y)).size, 32)
    for (const [role, key] of Object.entries({ input: 'button', ledOut: 'led', gnd: 'ground', vcc: 'power', serialTx: 'serialTx' })) {
      const expected = proposal.commonHeader[key]
      const pin = pins.find(item => item.id === expected.pinId)
      assert.equal(pin.headerReference + '.' + pin.padNumber, expected.pad)
      if (role !== 'serialTx') assert.deepEqual(view.pinAnchors[role], pin.anchor.map(value => value * 1000))
    }
    const aux = getBoardAuxConnectors(boardId)
    for (const { id, padCount } of board.auxiliaryLookup) assert.equal(aux.find(group => group.id === id).pins.length, padCount)
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.deepEqual(assembly.diagnostics, [])
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
  })

  test(board.sku + ' runs separate ELF, rejects a 20 ms pulse, latches six edges and solves both DC states', {
    skip: !native && 'Cần chuẩn bị ELF A8 local',
  }, async t => {
    const { openA8Machine } = await import('../scripts/a8-ra4m1-service.mjs')
    const { loadA8Target, assertA8Image } = await import('../scripts/a8-ra4m1-profile.mjs')
    const local = await loadA8Target(root, board.id)
    const other = await loadA8Target(root, proposal.boards.find(candidate => candidate.id !== board.id).id)
    assert.notEqual(hash(local.elf), hash(other.elf))
    assert.throws(() => assertA8Image(other.elf, board, proposal.firmware.memoryMap), /ELF/)
    const corrupted = Buffer.from(local.elf)
    corrupted.writeUInt16LE(0xF3, 18)
    assert.throws(() => assertA8Image(corrupted, board, proposal.firmware.memoryMap), /ELF/)
    const machine = await openA8Machine(root, board.id, new AbortController().signal)
    let frame = machine.initial
    const released = frame.sample
    let driven
    try {
      assert.equal(frame.ticks, frame.sample.timeUs / 1000)
      assert.deepEqual(frame.serial.trim().split(/\r?\n/), [board.readyLine, 'A8_BUTTON=0'])
      assert.equal(released.inputHigh, true)
      assert.equal(released.outputHigh, false)
      const step = async (pressed, ms) => {
        const next = await machine.step(pressed, ms)
        assert.equal(next.ticks, next.sample.timeUs / 1000)
        assert.equal(next.sample.timeUs - frame.sample.timeUs, ms * 1000)
        assert.equal(next.sample.inputHigh, !pressed)
        frame = next
      }
      for (const [pressed, ms] of [[true,10],[true,10], ...Array.from({ length: 6 }, () => [false,10])]) {
        await step(pressed, ms)
        assert.equal(frame.sample.outputHigh, false)
      }
      for (const pressed of [true, false, true, false, true, false]) {
        const start = frame.sample.timeUs
        for (let i = 0; i < 3; i++) {
          await step(pressed, 10)
          assert.equal(frame.sample.outputHigh, !pressed)
        }
        while (frame.sample.timeUs - start < 60_000 && frame.sample.outputHigh !== pressed) await step(pressed, 1)
        assert.equal(frame.sample.outputHigh, pressed)
        const lag = frame.sample.timeUs - start
        assert.ok(lag >= 39_000 && lag <= 60_000, board.led.gpio + ' edge ' + lag + ' µs')
        t.diagnostic('GPIO edge at ' + lag + ' µs')
        if (pressed) driven = frame.sample
        await step(pressed, 3)
      }
      for (let i = 0; i < 3; i++) await step(false, 10)
      assert.deepEqual(frame.serial.match(/A8_BUTTON=[01]/g), ['A8_BUTTON=0', ...Array.from({ length: 3 }, () => ['A8_BUTTON=1', 'A8_BUTTON=0']).flat()])
    } finally { await machine.stop() }

    const { a8DcNetlist } = await load('freestyle/a8Ra4m1Fixture')
    const spice = new Simulation()
    await spice.start()
    const k = proposal.electrical.acceptance
    const inRange = (value, [lo, hi]) => value >= lo && value <= hi
    for (const sample of [released, driven]) {
      spice.setNetList(a8DcNetlist(!sample.inputHigh, sample.outputHigh))
      const result = await spice.runSim()
      const value = name => result.data.find(line => line.name.toLowerCase() === name).values[0]
      const volts = value('v(gpio2)')
      const ma = -1000 * value('i(vout)')
      const kvl = Math.abs(value('v(gpio4)') - value('v(anode)') - ma)
      assert.ok(sample.inputHigh ? inRange(volts, k.inputReleasedVolts) : Math.abs(volts) <= k.inputPressedMaxAbsVolts)
      assert.ok(sample.outputHigh ? inRange(ma, k.ledHighCurrentMilliamps) : Math.abs(ma) <= k.ledLowMaxAbsMilliamps)
      assert.ok(kvl <= k.kvlMaxAbsVolts)
      t.diagnostic(JSON.stringify({ volts, ma, ledVolts: value('v(anode)'), kvl }))
    }
  })
}

test('concurrent A8 Renode instances keep their GPIO and UART state independent', {
  skip: !native && 'Cần chuẩn bị ELF A8 local',
}, async t => {
  const { openA8Machine } = await import('../scripts/a8-ra4m1-service.mjs')
  const outcomes = await Promise.allSettled(proposal.boards.map(board =>
    openA8Machine(root, board.id, new AbortController().signal)))
  const machines = outcomes.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  t.after(() => Promise.all(machines.map(machine => machine.stop())))
  const failed = outcomes.find(result => result.status === 'rejected')
  if (failed) throw failed.reason
  await Promise.all(machines.map(async (machine, index) => {
    assert.ok(machine.initial.serial.includes(proposal.boards[index].readyLine))
    const pressed = index === 0
    let frame
    for (let step = 0; step < 6; step++) frame = await machine.step(pressed)
    assert.equal(frame.sample.inputHigh, !pressed)
    assert.equal(frame.sample.outputHigh, pressed)
    assert.equal(frame.serial.includes('A8_BUTTON=1'), pressed)
  }))
})

test('A8 rejects cross-origin and extra command fields and retires an explicitly stopped session', async t => {
  const { createA8LocalService } = await import('../scripts/a8-ra4m1-service.mjs')
  const service = createA8LocalService(root)
  const server = createHttpServer((req, res) => service.middleware(req, res, () => res.writeHead(404).end()))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { service.close(); return new Promise(resolve => server.close(resolve)) })
  const origin = 'http://127.0.0.1:' + server.address().port
  const request = (route, data, requestOrigin = origin) => fetch(origin + proposal.runtime.transport.route + route, {
    method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify(data),
  })
  const boardId = proposal.boards[0].id
  assert.equal((await request('start', { boardId }, 'http://localhost:12')).status, 403)
  assert.equal((await request('start', { boardId, path: 'firmware.elf' })).status, 400)
  assert.equal((await request('start', { boardId: 'x'.repeat(900) })).status, 400)
  assert.equal((await request('step', { id: 'missing', pressed: 1 })).status, 400)
  assert.equal((await request('command', {})).status, 404)
  if (native) {
    const start = await request('start', { boardId })
    assert.equal(start.status, 200, await start.clone().text())
    const { id, approvalSha256 } = await start.json()
    assert.equal(approvalSha256, expectedSha)
    assert.equal((await request('start', { boardId })).status, 409)
    assert.equal((await request('step', { id, pressed: true })).status, 200)
    assert.equal((await request('stop', { id })).status, 200)
    assert.equal((await request('step', { id, pressed: false })).status, 404)
  }
})
