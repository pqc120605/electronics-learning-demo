import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let rp

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  rp = await server.ssrLoadModule('/src/lib/rp2040Runner.ts')
})

after(async () => { await server?.close() })

test('the built-in Pico demo is real Thumb code that toggles GP25 on the rp2040js core', () => {
  const machine = rp.createRp2040Machine(rp.buildPicoBlinkDemoImage(1_000))
  const frame = machine.step(300_000)
  assert.equal(frame.bootrom, 'absent')
  assert.ok(frame.channels.GP25.length >= 10, 'GP25 changes level many times')
  assert.deepEqual(Object.keys(frame.channels), ['GP25'], 'no other GPIO is driven')
  const levels = frame.channels.GP25.map(event => event.level)
  assert.ok(levels.every((level, index) => index === 0 || level !== levels[index - 1]), 'levels alternate')
  assert.ok(frame.simulatedMilliseconds > 0 && frame.cycles >= 300_000)
})

test('UF2 blocks are placed at their flash addresses and wrong families are rejected', () => {
  const block = (address, payload, family = 0xe48bff56) => {
    const bytes = new Uint8Array(512)
    const view = new DataView(bytes.buffer)
    view.setUint32(0, 0x0a324655, true); view.setUint32(4, 0x9e5d5157, true); view.setUint32(8, 0x2000, true)
    view.setUint32(12, address, true); view.setUint32(16, payload.length, true); view.setUint32(28, family, true)
    bytes.set(payload, 32); view.setUint32(508, 0x0ab16f30, true)
    return bytes
  }
  const flash = rp.parseUf2(block(0x10000100, Uint8Array.of(1, 2, 3)))
  assert.deepEqual([...flash.subarray(0x100, 0x103)], [1, 2, 3])
  assert.equal(flash[0], 0xff)
  assert.throws(() => rp.parseUf2(block(0x10000000, Uint8Array.of(1), 0x12345678)), /RP2040/)
  assert.throws(() => rp.parseUf2(new Uint8Array(100)), /512/)
})
