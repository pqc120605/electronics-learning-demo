import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createServer } from 'vite'
import { Simulation } from 'eecircuit-engine'

const bytes = readFileSync(new URL('../docs/research/2026-11-28-s2-nano-every-electrical-firmware-a12-proposal.json', import.meta.url))
const proposal = JSON.parse(bytes)
const hash = value => createHash('sha256').update(value).digest('hex')
const bounds = (value, [min, max]) => value >= min && value <= max

test('A12 retains the exact approved proposal and existing layout assets', () => {
  assert.equal(hash(bytes), 'f558c56ab135bd4d4ad5912d7ae48c368b588d54a63f41542d567a3ec7674919')
  for (const asset of [...proposal.boards.flatMap(board => board.assets), proposal.electrical.engine]) {
    assert.equal(hash(readFileSync(asset.path)), asset.sha256, asset.path)
  }
})

for (const board of proposal.boards) {
  test('A12 ' + board.id + ' uses the indexed pads, rejects invalid circuits and solves both DC states', async t => {
    const vite = await createServer({ configFile: false, envDir: false, logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
    t.after(() => vite.close())
    const { buildA12Fixture, validateA12Circuit, a12DcNetlist, getA12Board } = await vite.ssrLoadModule('/src/lib/freestyle/a12Fixture.ts')
    const { getBoardHeaderPins } = await vite.ssrLoadModule('/src/lib/boardCatalogModels.ts')
    const { freestylePresentation } = await vite.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts')
    const { freestyleAssembly } = await vite.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
    const { boardId, doc, pinMap } = buildA12Fixture(board.fixtureId)
    assert.equal(boardId, board.id)
    assert.deepEqual(validateA12Circuit(doc, boardId, pinMap), [])
    const indexed = await getBoardHeaderPins(boardId)
    assert.equal(indexed.length, board.padCount)
    const view = freestylePresentation(boardId, pinMap, doc)
    const assembly = freestyleAssembly(doc, boardId, pinMap)
    assert.deepEqual(assembly.diagnostics, [])
    assert.equal(Object.keys(assembly.wireEnds).length, doc.wires.length)
    for (const [role, key] of Object.entries({ input: 'button', ledOut: 'led', vcc: 'power', gnd: 'ground' })) {
      const pin = indexed.find(item => item.id === board.pins[key].pinId)
      assert.equal(pin.label, board.pins[key].label)
      assert.equal(pin.gpio, board.pins[key].gpio)
      if (board.pins[key].portBit) assert.ok(pin.functions.includes('GPIO ' + board.pins[key].portBit))
      assert.deepEqual(view.pinAnchors[role], pin.anchor.map(n => n * 1000))
    }
    const wrongBoard = proposal.boards.find(item => item.id !== boardId)
    assert.ok(validateA12Circuit(doc, wrongBoard.id, pinMap).length)
    assert.ok(validateA12Circuit(doc, boardId, { ...pinMap, input: 0 }).length)
    for (const wire of doc.wires) {
      assert.ok(validateA12Circuit({ ...doc, wires: doc.wires.filter(item => item !== wire) }, boardId, pinMap).length)
    }
    const remapPins = (partId, changes) => ({
      ...doc, wires: doc.wires.map(wire => {
        const replace = end => end.partId === partId && changes[end.pinId] ? { ...end, pinId: changes[end.pinId] } : end
        return { ...wire, from: replace(wire.from), to: replace(wire.to) }
      }),
    })
    assert.ok(validateA12Circuit(remapPins('board', { vcc: 'v5' }), boardId, pinMap).length)
    assert.ok(validateA12Circuit(remapPins('a12-led', { anode: 'cathode', cathode: 'anode' }), boardId, pinMap).length)
    assert.ok(validateA12Circuit({ ...doc, parts: doc.parts.map(part => part.id === 'a12-limit'
      ? { ...part, value: { ohm: 220 } } : part) }, boardId, pinMap).length)

    const spice = new Simulation()
    await spice.start()
    const profile = getA12Board(boardId)
    const dc = board.dcAcceptance
    for (const pressed of [false, true]) {
      spice.setNetList(a12DcNetlist(profile, pressed, pressed))
      const result = await spice.runSim()
      const v = name => result.data.find(row => row.name.toLowerCase() === name).values[0]
      const input = v('v(gpio' + pinMap.input + ')')
      const out = v('v(gpio' + pinMap.ledOut + ')')
      const led = v('v(anode)')
      const currentMa = -1000 * v('i(vout)')
      if (pressed) {
        assert.ok(Math.abs(input) <= dc.pressedInputMaxAbsVolts)
        assert.ok(bounds(currentMa, dc.ledOnCurrentMilliAmps) && bounds(led, dc.ledOnAnodeVolts))
      } else {
        assert.ok(bounds(input, dc.releasedInputVolts))
        assert.ok(Math.abs(currentMa) <= dc.ledOffMaxAbsMilliAmps)
      }
      assert.ok(Math.abs(out - led - currentMa) <= proposal.electrical.kvlMaxAbsVolts)
      t.diagnostic(JSON.stringify({ boardId, pressed, input, led, currentMa }))
    }
  })
}
