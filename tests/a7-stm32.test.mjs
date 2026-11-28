import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'
import { approvalSha256, assertA7Image, assertA7Manifest, assetDirectory, digest, readA7Proposal, renodeDirectory } from '../scripts/a7-stm32-profile.mjs'
import { createA7LocalService, openA7Machine } from '../scripts/a7-stm32-service.mjs'

const root = process.cwd()
const proposal = await readA7Proposal(root)
const asset = (target, name) => resolve(root, assetDirectory, target, name)
const runner = asset(renodeDirectory, 'Renode.exe')
const skipNative = !existsSync(runner) && process.env.MACHMO_REQUIRE_A7_ASSETS !== '1' && 'Cần chuẩn bị Renode/ELF A7 local'
let vite
before(async () => {
  vite = await createServer({ envDir: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(async () => { await vite?.close() })
const load = name => vite.ssrLoadModule('/src/lib/' + name + '.ts')

for (const board of proposal.boards) {
  test(board.orderCode + ' maps each approved 2D/3D pad and preserves its saved circuit', async () => {
    const { buildA7Fixture, validateA7Circuit, getActiveA7Board } = await load('freestyle/a7Stm32Fixture')
    const { a7ApprovalSha256 } = await load('freestyle/a7Stm32Profiles')
    const { getBoardHeaderPins } = await load('boardCatalogModels')
    const { getBoardAuxConnectors } = await load('boardAuxConnectors')
    const { projectTopViewPoint } = await load('boardTopView')
    const { freestylePresentation } = await load('freestyle/freestylePresentation')
    const { freestyleAssembly } = await load('freestyle/freestyleAssembly')
    const { parseFreestyleWorkspace } = await load('freestyle/freestyleCircuit')
    assert.equal(a7ApprovalSha256, approvalSha256)
    for (const file of [board.model, board.topView, board.headerManifest]) {
      assert.equal(digest(readFileSync(file.path)), file.sha256)
    }
    const { boardId, doc, pinMap } = buildA7Fixture(board.fixtureId)
    assert.equal(boardId, board.id)
    assert.equal(getActiveA7Board(boardId, doc).revision, board.revision)
    assert.deepEqual(validateA7Circuit(doc, boardId, pinMap), [])
    const draft = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, doc, pinMap, code: '', language: 'cpp' }))
    assert.deepEqual(draft.doc, doc)
    assert.deepEqual(draft.pinMap, pinMap)
    const reject = (invalid, id = boardId, pins = pinMap) => assert.ok(validateA7Circuit(invalid, id, pins).length)
    reject(doc, proposal.boards.find(item => item.id !== boardId).id)
    reject(doc, boardId, { ...pinMap, input: 9 })
    for (const wire of doc.wires) reject({ ...doc, wires: doc.wires.filter(item => item !== wire) })
    reject({ ...doc, parts: doc.parts.filter(part => part.id !== 'a7-limit') })
    const remap = fn => ({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: fn(wire.from), to: fn(wire.to) })) })
    for (const pinId of ['v5', 'vin', 'ioref', 'swdio', 'cn4-4']) {
      reject(remap(point => point.partId === 'board' && point.pinId === 'vcc' ? { ...point, pinId } : point))
    }
    reject(remap(point => point.partId === 'a7-led' ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point))

    const pins = await getBoardHeaderPins(boardId)
    assert.equal(pins.length, board.headerLocations)
    assert.equal(new Set(pins.map(pin => pin.id)).size, board.headerLocations)
    const view = freestylePresentation(boardId, pinMap, doc)
    const model = new URL(view.model.assetUrl, 'http://localhost')
    assert.equal(model.pathname, '/' + board.model.path.replace(/^public\//, ''))
    assert.equal(model.searchParams.get('v'), board.model.sha256.slice(0, 12))
    assert.equal(view.topView.image, '/' + board.topView.path.replace(/^public\//, ''))
    const top = view.topView
    const frame = { x: 0, y: 0, width: top.width, height: top.height }
    const points = pins.map(pin => projectTopViewPoint(top.boundsMm, frame, pin.anchor.map(value => value * 1000)))
    assert.ok(points.every(Boolean))
    assert.equal(new Set(points.map(point => point.x + ':' + point.y)).size, board.headerLocations)
    for (const [role, key] of Object.entries({ input: 'button', ledOut: 'led', vcc: 'power', gnd: 'ground', serialTx: 'serialTx' })) {
      const expected = proposal.pins[key]
      const pad = pins.find(pin => pin.id === expected.pinId)
      assert.equal(pad.label, expected.label)
      assert.equal(pad.headerReference + '.' + pad.padNumber, expected.pad)
      if (role !== 'serialTx') assert.deepEqual(view.pinAnchors[role], pad.anchor.map(value => value * 1000))
    }
    assert.match(JSON.stringify(getBoardAuxConnectors(boardId)), /CN4.*SWCLK.*SWDIO/)
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    assert.deepEqual(assembly.diagnostics, [])
    if (boardId === 'stm32-nucleo') {
      const { getFreestyleBoard } = await load('freestyle/freestyleBoards')
      const prior = getFreestyleBoard('stm32-nucleo-f401re')
      assert.equal(prior.defaultPins.ledOut, 13)
      assert.equal(getActiveA7Board(prior.id, doc), undefined)
      assert.notEqual(freestylePresentation(prior.id, prior.defaultPins).model.assetUrl, view.model.assetUrl)
    }
  })

  test(board.orderCode + ' executes Cortex-M4 ELF and yields the measured DC states', { skip: skipNative }, async t => {
    const manifest = JSON.parse(readFileSync(asset(board.target, 'manifest.json')))
    const image = readFileSync(asset(board.target, 'firmware.elf'))
    assertA7Manifest(manifest, board)
    assertA7Image(image, board)
    assert.equal(digest(image), manifest.elfSha256)
    const other = proposal.boards.find(item => item.id !== board.id)
    const otherElf = readFileSync(asset(other.target, 'firmware.elf'))
    assert.notEqual(digest(otherElf), digest(image))
    assert.equal(otherElf.includes(Buffer.from(board.readyLine + '\n')), false)
    for (const patch of [{ boardId: other.id }, { target: other.target }, { revision: 'incorrect' }, { tickAddress: 0 }]) {
      assert.throws(() => assertA7Manifest({ ...manifest, ...patch }, board), /Manifest/)
    }
    assert.throws(() => assertA7Image(image.subarray(0, 100), board), /ELF/)

    const machine = await openA7Machine(root, board.id, new AbortController().signal)
    let frame = machine.initial
    let driven
    const released = frame.sample
    try {
      assert.deepEqual(frame.serial.trim().split('\n'), [board.readyLine, 'A7_BUTTON=0'])
      assert.deepEqual(released, { timeUs: 10_000, inputHigh: true, outputHigh: false })
      const step = async pressed => {
        const next = await machine.step(pressed, 1)
        assert.equal(next.ticks, next.sample.timeUs / 1000)
        assert.equal(next.sample.timeUs - frame.sample.timeUs, 1000)
        assert.equal(next.sample.inputHigh, !pressed)
        frame = next
      }
      for (const [pressed, duration] of [[true, 20], [false, 55]]) {
        for (let ms = 0; ms < duration; ms++) {
          await step(pressed)
          assert.equal(frame.sample.outputHigh, false)
        }
      }
      for (const pressed of [true, false, true, false, true, false]) {
        const startUs = frame.sample.timeUs
        for (let ms = 0; ms < 60 && frame.sample.outputHigh !== pressed; ms++) await step(pressed)
        assert.equal(frame.sample.outputHigh, pressed)
        const lag = frame.sample.timeUs - startUs
        assert.ok(lag >= 39_000 && lag <= 60_000, 'PB5 edge after ' + lag + ' µs')
        if (pressed) driven = frame.sample
        t.diagnostic('PB5 edge after ' + lag + ' µs')
        for (let ms = 0; ms < 3; ms++) await step(pressed)
      }
      assert.deepEqual(frame.serial.match(/A7_BUTTON=[01]/g),
        ['A7_BUTTON=0', ...Array.from({ length: 3 }, () => ['A7_BUTTON=1', 'A7_BUTTON=0']).flat()])
    } finally { await machine.stop() }

    const { a7DcNetlist } = await load('freestyle/a7Stm32Fixture')
    const spice = new Simulation()
    await spice.start()
    const k = proposal.electrical.acceptance
    const inRange = (value, [lo, hi]) => value >= lo && value <= hi
    for (const sample of [released, driven]) {
      spice.setNetList(a7DcNetlist(!sample.inputHigh, sample.outputHigh))
      const result = await spice.runSim()
      const value = name => result.data.find(line => line.name.toLowerCase() === name).values[0]
      const volts = value('v(gpio10)')
      const ma = -1000 * value('i(vout)')
      const kvl = Math.abs(value('v(gpio5)') - value('v(anode)') - ma)
      assert.ok(sample.inputHigh ? inRange(volts, k.releasedInputVolts) : Math.abs(volts) <= k.pressedInputAbsoluteMaxVolts)
      assert.ok(sample.outputHigh ? inRange(ma, k.ledHighCurrentMilliAmps) : Math.abs(ma) <= k.ledLowAbsoluteMaxMilliAmps)
      assert.ok(kvl <= k.kvlAbsoluteMaxVolts)
      t.diagnostic(JSON.stringify({ timeUs: sample.timeUs, inputVolts: volts, currentMilliAmps: ma, kvlVolts: kvl }))
    }
  })
}

test('A7 service enforces loopback origin, shape, session and fixed commands', async t => {
  const handler = createA7LocalService(root)
  const server = createHttpServer((req, res) => handler.middleware(req, res, () => res.writeHead(404).end()))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => { handler.close(); return new Promise(resolve => server.close(resolve)) })
  const origin = 'http://127.0.0.1:' + server.address().port
  const request = (operation, body, source = origin) => fetch(origin + '/api/local-tools/a7-stm32/' + operation,
    { method: 'POST', headers: { origin: source, 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const boardId = proposal.boards[0].id
  assert.equal((await request('start', { boardId }, 'http://localhost:42')).status, 403)
  assert.equal((await request('start', { boardId, path: 'firmware.elf' })).status, 400)
  assert.equal((await request('start', { boardId: 'x'.repeat(900) })).status, 400)
  assert.equal((await request('step', { id: 'invalid', pressed: 1 })).status, 400)
  assert.equal((await request('step', { id: 'invalid', pressed: false })).status, 404)
  assert.equal((await request('command', {})).status, 404)
  if (skipNative) return
  const started = await request('start', { boardId })
  assert.equal(started.status, 200)
  const { id } = await started.json()
  assert.equal((await request('start', { boardId })).status, 409)
  const step = await request('step', { id, pressed: true })
  assert.equal(step.status, 200)
  assert.equal((await step.json()).sample.inputHigh, false)
  assert.equal((await request('stop', { id })).status, 200)
  assert.equal((await request('step', { id, pressed: false })).status, 404)
  const retry = await request('start', { boardId })
  assert.equal(retry.status, 200)
  assert.equal((await request('stop', { id: (await retry.json()).id })).status, 200)
})
