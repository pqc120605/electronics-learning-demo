import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Simulation } from 'eecircuit-engine'
import { createServer } from 'vite'
import { a12FirmwareApproval, openA12Machine } from '../scripts/a12-local-service.mjs'

const proposalBytes = readFileSync(new URL('../docs/research/2026-11-28-a12-firmware-r2-proposal.json', import.meta.url))
const source = JSON.parse(proposalBytes)
const baseline = JSON.parse(readFileSync(source.baseline.path))
const runnerStaged = existsSync('.tmp/a12-fw-r2/runtime/manifest.json')

test('A12-FW-R2 locks the approved plan and the underlying electrical model', () => {
  const hash = data => createHash('sha256').update(data).digest('hex')
  assert.equal(hash(proposalBytes), a12FirmwareApproval)
  assert.equal(hash(readFileSync(source.baseline.path)), source.baseline.sha256.toLowerCase())
})

for (const [target, config] of Object.entries({
  esp32s2: source.runners.esp32s2,
  atmega4809: source.runners.nanoEvery,
})) {
  test('A12 ' + target + ' executes guest GPIO, timer, UART and coupled DC', {
    skip: !runnerStaged && 'Cần hai runner A12 đã build trong Podman local', timeout: 75_000,
  }, async t => {
    const machine = await openA12Machine(process.cwd(), target, t.signal)
    t.after(machine.stop)
    assert.equal(machine.approvalSha256, a12FirmwareApproval)
    const { initial } = machine
    assert.deepEqual([initial.sample.inputHigh, initial.sample.outputHigh, initial.edges], [true, false, 0])
    assert.equal(initial.serial.trim(), 'A12_READY=' + target)
    let frame = await machine.step(true, 20)
    assert.deepEqual([frame.sample.inputHigh, frame.sample.outputHigh, frame.edges], [false, false, 0])
    frame = await machine.step(false)
    assert.equal(frame.serial.trim(), initial.serial.trim())
    const measurements = { released: frame.sample }
    for (let index = 1; index <= 6; index++) {
      const pressed = index % 2 === 1
      frame = await machine.step(pressed)
      assert.equal(frame.edges, index)
      assert.deepEqual([frame.sample.inputHigh, frame.sample.outputHigh], [!pressed, pressed])
      const delay = (frame.edgeUs - frame.startUs) / 1000
      assert.ok(delay >= 39 && delay <= 65, 'unexpected GPIO delay ' + delay)
      assert.equal(frame.serial.trim().split(/\r?\n/).at(-1), 'A12_LED=' + Number(pressed))
      if (pressed) measurements.held = frame.sample
      assert.ok(frame.uartUs >= frame.edgeUs && frame.uartUs <= frame.sample.timeUs)
      t.diagnostic(JSON.stringify({ index, delay, stimulusUs: frame.startUs, edgeUs: frame.edgeUs, uartUs: frame.uartUs, ...frame.sample }))
    }
    assert.equal(frame.serial.trim().split(/\r?\n/).length, 7)

    const vite = await createServer({ configFile: false, envDir: false, logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
    t.after(() => vite.close())
    const fixture = await vite.ssrLoadModule('/src/lib/freestyle/a12Fixture.ts')
    const board = fixture.getA12Board(config.boardId)
    const { doc, boardId, pinMap } = fixture.buildA12Fixture(board.fixtureId)
    assert.deepEqual(fixture.validateA12Circuit(doc, boardId, pinMap), [])
    const acceptance = baseline.boards.find(item => item.id === boardId).dcAcceptance
    const spice = new Simulation()
    await spice.start()
    for (const sample of Object.values(measurements)) {
      spice.setNetList(fixture.a12DcNetlist(board, !sample.inputHigh, sample.outputHigh))
      const result = await spice.runSim()
      const value = name => result.data.find(row => row.name.toLowerCase() === name).values[0]
      const inputV = value('v(gpio' + pinMap.input + ')')
      const outV = value('v(gpio' + pinMap.ledOut + ')')
      const anodeV = value('v(anode)')
      const ledMa = -1000 * value('i(vout)')
      assert.ok(Math.abs(outV - anodeV - ledMa) <= baseline.electrical.kvlMaxAbsVolts)
      if (sample.outputHigh) {
        assert.ok(Math.abs(inputV) <= acceptance.pressedInputMaxAbsVolts)
        assert.ok(ledMa >= acceptance.ledOnCurrentMilliAmps[0] && ledMa <= acceptance.ledOnCurrentMilliAmps[1])
        assert.ok(anodeV >= acceptance.ledOnAnodeVolts[0] && anodeV <= acceptance.ledOnAnodeVolts[1])
      } else {
        assert.ok(inputV >= acceptance.releasedInputVolts[0] && inputV <= acceptance.releasedInputVolts[1])
        assert.ok(Math.abs(ledMa) <= acceptance.ledOffMaxAbsMilliAmps)
      }
      t.diagnostic(JSON.stringify({ inputV, anodeV, ledMa }))
    }
  })
}
