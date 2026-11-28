import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

const root = process.cwd()
const proposalBytes = readFileSync('docs/research/2026-11-27-stm32-f1-l4-electrical-firmware-a9-proposal.json')
const proposal = JSON.parse(proposalBytes)
const hash = value => createHash('sha256').update(value).digest('hex')
const expectedSha = '954006616229f5045215e90c5b59ce1d313cfa65250670e8aa1fc26198856b99'
const native = process.env.MACHMO_REQUIRE_A9_ASSETS === '1' || proposal.boards.every(board =>
  existsSync(resolve(root, '.tmp/a9-local-assets', board.firmware.target, 'manifest.json')))
let vite
before(async () => {
  vite = await createServer({ envDir: false, logLevel: 'silent', server: { middlewareMode: true } })
})
after(() => vite?.close())
const load = name => vite.ssrLoadModule('/src/lib/' + name + '.ts')

test('A9 locks the proposal and keeps the two STM32 register maps distinct', async () => {
  assert.equal(hash(proposalBytes), expectedSha)
  const { readA9Proposal, platformForA9 } = await import('../scripts/a9-stm32-profile.mjs')
  assert.deepEqual(await readA9Proposal(root), proposal)
  for (const board of proposal.boards) {
    const platform = platformForA9(board)
    const { firmware } = board
    assert.ok(platform.includes('size: ' + firmware.flash.bytes))
    assert.ok(platform.includes('size: ' + firmware.sram.bytes))
    assert.ok(platform.includes(firmware.observation.gpioClass + ' @ sysbus <' + firmware.observation.inputPort.base))
    assert.ok(platform.includes(firmware.uart.class + ' @ sysbus <' + firmware.uart.base))
    assert.ok(platform.includes('systickFrequency: ' + firmware.clock.hz))
    assert.doesNotMatch(platform, /https?:|Python|ApplySVD/)
  }
})

for (const board of proposal.boards) {
  test(board.id + ' uses the approved 2D and 3D pins and preserves its draft endpoints', async () => {
    const { buildA9Fixture, validateA9Circuit, getActiveA9Board } = await load('freestyle/a9Stm32Fixture')
    const { freestylePresentation } = await load('freestyle/freestylePresentation')
    const { freestyleAssembly } = await load('freestyle/freestyleAssembly')
    const { getBoardHeaderPins } = await load('boardCatalogModels')
    const { getBoardAuxConnectors } = await load('boardAuxConnectors')
    const { projectTopViewPoint } = await load('boardTopView')
    const { parseFreestyleWorkspace } = await load('freestyle/freestyleCircuit')
    const { boardId, doc, pinMap } = buildA9Fixture(board.fixtureId)
    assert.equal(boardId, board.id)
    assert.equal(getActiveA9Board(boardId, doc).id, boardId)
    assert.deepEqual(validateA9Circuit(doc, boardId, pinMap), [])
    const draft = parseFreestyleWorkspace(JSON.stringify({ version: 1, boardId, doc, pinMap, code: '', language: 'cpp' }))
    assert.deepEqual(draft.doc, doc)
    assert.deepEqual(draft.pinMap, pinMap)
    const reject = (invalid, id = boardId, pins = pinMap) => assert.ok(validateA9Circuit(invalid, id, pins).length)
    reject(doc, proposal.boards.find(candidate => candidate.id !== boardId).id)
    reject(doc, boardId, { ...pinMap, input: 7 })
    for (const wire of doc.wires) reject({ ...doc, wires: doc.wires.filter(candidate => candidate !== wire) })
    for (const [id, ohm] of [['a9-pullup', 1000], ['a9-limit', 330]]) {
      reject({ ...doc, parts: doc.parts.map(part => part.id === id ? { ...part, value: { ohm } } : part) })
    }
    const replacePins = fn => ({ ...doc, wires: doc.wires.map(wire => ({ ...wire, from: fn(wire.from), to: fn(wire.to) })) })
    reject(replacePins(point => point.partId === 'board' && point.pinId === 'vcc' ? { ...point, pinId: 'v5' } : point))
    reject(replacePins(point => point.partId === 'a9-led'
      ? { ...point, pinId: point.pinId === 'anode' ? 'cathode' : 'anode' } : point))

    const view = freestylePresentation(boardId, pinMap, doc)
    const { boardEvidence, pins: expectedPins } = board
    for (const asset of [boardEvidence.model, boardEvidence.optimizedModel, boardEvidence.topView, boardEvidence.padSource].filter(Boolean)) {
      assert.equal(hash(readFileSync(asset.path)), asset.sha256)
    }
    assert.equal(view.topView.image, '/' + boardEvidence.topView.path.replace(/^public\//, ''))
    const pins = await getBoardHeaderPins(boardId)
    assert.equal(pins.length, boardEvidence.mainPadCount)
    const top = view.topView
    const frame = { x: 0, y: 0, width: top.width, height: top.height }
    const locations = pins.map(pin => projectTopViewPoint(top.boundsMm, frame, pin.anchor.map(value => value * 1000)))
    assert.ok(locations.every(Boolean))
    assert.equal(new Set(locations.map(({ x,y }) => x + ':' + y)).size, pins.length)
    for (const [name, role] of Object.entries({ input: 'input', output: 'ledOut', power: 'vcc', ground: 'gnd', serialTx: undefined })) {
      const expected = expectedPins[name]
      const pin = pins.find(candidate => candidate.id === expected.pinId)
      assert.ok(pin.label.includes(expected.gpio ?? expected.signal), pin.label)
      assert.equal(pin.headerReference + '.' + pin.padNumber, expected.pad.split(' / ')[0])
      if (role) assert.deepEqual(view.pinAnchors[role], pin.anchor.map(value => value * 1000))
    }
    for (const lookup of boardEvidence.auxiliaryLookup) {
      const connector = getBoardAuxConnectors(boardId).find(group => group.id === lookup.id)
      assert.equal(connector.pins.length, lookup.padCount ?? lookup.signals.length)
      if (lookup.signals) assert.deepEqual(connector.pins.map(pin => pin.label), lookup.signals)
    }
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.deepEqual(assembly.diagnostics, [])
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
  })

  test(board.id + ' boots its ELF, times GPIO and solves the measured DC states', {
    skip: !native && 'Cần chuẩn bị ELF A9 local',
  }, async t => {
    const { openA9Machine } = await import('../scripts/a9-stm32-service.mjs')
    const { assertA9Image, loadA9Target } = await import('../scripts/a9-stm32-profile.mjs')
    const target = await loadA9Target(root, board.id)
    const other = await loadA9Target(root, proposal.boards.find(candidate => candidate.id !== board.id).id)
    assert.notEqual(hash(target.elf), hash(other.elf))
    assert.throws(() => assertA9Image(other.elf, board), /ELF/)
    const corrupt = Buffer.from(target.elf)
    corrupt.writeUInt16LE(0xF3, 18)
    assert.throws(() => assertA9Image(corrupt, board), /ELF/)
    const machine = await openA9Machine(root, board.id, new AbortController().signal)
    t.after(() => machine.stop())

    let frame = machine.initial
    assert.deepEqual(frame.serial.trim().split(/\r?\n/), [board.firmware.readyLine, 'A9_BUTTON=0'])
    assert.deepEqual([frame.sample.inputHigh, frame.sample.outputHigh], [true, false])
    const released = frame.sample
    let driven
    const advance = async (pressed, ms) => {
      const sample = await machine.step(pressed, ms)
      assert.equal(sample.sample.timeUs - frame.sample.timeUs, ms * 1000)
      assert.ok(Math.abs(sample.ticks - sample.sample.timeUs / 1000) <= 1)
      assert.equal(sample.sample.inputHigh, !pressed)
      frame = sample
    }
    for (const pressed of [true, true, false, false, false, false, false, false]) {
      await advance(pressed, 10)
      assert.equal(frame.sample.outputHigh, false)
    }
    const [min, max] = proposal.firmwareShared.timing.expectedEdgeDelayMs
    for (const pressed of [true, false, true, false, true, false]) {
      const start = frame.sample.timeUs
      for (let i = 0; i < 3; i++) {
        await advance(pressed, 10)
        assert.equal(frame.sample.outputHigh, !pressed)
      }
      while (frame.sample.timeUs - start < max * 1000 && frame.sample.outputHigh !== pressed) await advance(pressed, 1)
      assert.equal(frame.sample.outputHigh, pressed)
      const lag = (frame.sample.timeUs - start) / 1000
      assert.ok(lag >= min && lag <= max, 'PB5 edge ' + lag + ' ms')
      t.diagnostic('PB5 edge after ' + lag + ' ms')
      if (pressed) driven = frame.sample
      await advance(pressed, 3)
    }
    for (let i = 0; i < 3; i++) await advance(false, 10)
    assert.deepEqual(frame.serial.match(/A9_BUTTON=[01]/g),
      ['A9_BUTTON=0', ...Array.from({ length: 3 }, () => ['A9_BUTTON=1', 'A9_BUTTON=0']).flat()])
    await machine.stop()

    const { a9DcNetlist } = await load('freestyle/a9Stm32Fixture')
    const spice = new Simulation()
    await spice.start()
    const k = proposal.electrical.acceptance
    const within = (value, [lo, hi]) => value >= lo && value <= hi
    for (const state of [released, driven]) {
      spice.setNetList(a9DcNetlist(!state.inputHigh, state.outputHigh))
      const result = await spice.runSim()
      const value = name => result.data.find(record => record.name.toLowerCase() === name).values[0]
      const inputV = value('v(gpio10)')
      const anodeV = value('v(anode)')
      const ledMa = -1000 * value('i(vout)')
      const kvlV = Math.abs(value('v(gpio5)') - anodeV - ledMa)
      assert.ok(state.inputHigh ? within(inputV, k.releasedInputV) : Math.abs(inputV) <= k.heldInputAbsMaxV)
      assert.ok(state.outputHigh ? within(ledMa, k.heldLedCurrentMilliA) : Math.abs(ledMa) <= k.releasedLedCurrentAbsMaxMilliA)
      if (state.outputHigh) assert.ok(within(anodeV, k.heldAnodeV))
      assert.ok(kvlV <= k.kvlAbsMaxV)
      t.diagnostic(JSON.stringify({ inputV, anodeV, ledMa, kvlV }))
    }
  })
}

test('A9 instances can run concurrently with independent GPIO and UART', { skip: !native }, async t => {
  const { openA9Machine } = await import('../scripts/a9-stm32-service.mjs')
  const results = await Promise.allSettled(proposal.boards.map(board =>
    openA9Machine(root, board.id, new AbortController().signal)))
  const machines = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  t.after(() => Promise.all(machines.map(machine => machine.stop())))
  const failed = results.find(result => result.status === 'rejected')
  if (failed) throw failed.reason
  await Promise.all(machines.map(async (machine, index) => {
    assert.ok(machine.initial.serial.includes(proposal.boards[index].firmware.readyLine))
    const pressed = index === 0
    let frame
    for (let i = 0; i < 6; i++) frame = await machine.step(pressed)
    assert.deepEqual([frame.sample.inputHigh, frame.sample.outputHigh], [!pressed, pressed])
    assert.equal(frame.serial.includes('A9_BUTTON=1'), pressed)
  }))
})

test('A9 validates localhost origin and retires sessions on stop', async t => {
  const { createA9LocalService } = await import('../scripts/a9-stm32-service.mjs')
  const service = createA9LocalService(root)
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
