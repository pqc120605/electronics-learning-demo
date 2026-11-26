import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let lab
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  lab = await server.ssrLoadModule('/src/simulation/digitalLabModels.ts')
})
after(async () => { await server?.close() })

test('74HC00 implements all four NAND combinations', () => {
  assert.deepEqual([[false, false], [false, true], [true, false], [true, true]].map(pair => lab.nandOutput(...pair)), [true, true, true, false])
})

test('74HC4511 decodes decimal digits and blanks invalid BCD', () => {
  const normal = { hold: false, lampTest: false, blanking: false }
  const patterns = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg', '', '', '', '', '', '']
  for (const [code, segments] of patterns.entries()) assert.deepEqual(lab.bcdDisplay(code, null, normal), { captured: code, segments })
})

test('74HC4511 keeps the latched code, with lamp test priority over blanking', () => {
  const hold = { hold: true, lampTest: false, blanking: false }
  assert.equal(lab.bcdDisplay(2, null, hold).segments, null)
  assert.deepEqual(lab.bcdDisplay(2, 5, hold), { captured: 5, segments: 'acdfg' })
  assert.deepEqual(lab.bcdDisplay(2, 5, { ...hold, blanking: true }), { captured: 5, segments: '' })
  assert.deepEqual(lab.bcdDisplay(2, 5, { ...hold, lampTest: true, blanking: true }), { captured: 5, segments: 'abcdefg' })
})

test('NE555 astable high and low times scale with C, with independent duty control', () => {
  const sample = lab.timer555Astable(10, 10, 10)
  assert.ok(Math.abs(sample.highMs - 138.629436) < 1e-5)
  assert.ok(Math.abs(sample.lowMs - 69.314718) < 1e-5)
  assert.ok(Math.abs(sample.duty - 2 / 3) < 1e-12)
  assert.ok(Math.abs(sample.hz - 4.808984) < 1e-5)
  const lowerC = lab.timer555Astable(10, 10, 1)
  assert.ok(Math.abs(sample.periodMs / lowerC.periodMs - 10) < 1e-12)
  assert.equal(lab.timer555Astable(10, 30, 1).duty < sample.duty, true)
  for (const bad of [0, -1, NaN, Infinity]) assert.equal(lab.timer555Astable(10, bad, 10), undefined)
})

test('LCD latches two port nibbles on falling edges and handles two DDRAM rows', () => {
  const display = lab.createLcd1602(0x27, true)
  const command = value => lab.lcdPortBytes(value, false)
  const letterA = lab.lcdPortBytes(0x41, true)
  assert.deepEqual(letterA, [0x45, 0x41, 0x15, 0x11])
  assert.equal(display.write(0x27, command(0x0c)), true)
  display.write(0x27, letterA.slice(0, 3))
  assert.equal(display.rows()[0].trim(), '')
  display.write(0x27, letterA.slice(3))
  display.write(0x27, [...command(0xc0), ...lab.lcdPortBytes(0x42, true)])
  assert.deepEqual(display.rows().map(row => row.trim()), ['A', 'B'])
  display.write(0x27, command(0x08))
  assert.deepEqual(display.rows().map(row => row.trim()), ['', ''])
  display.write(0x27, command(0x0c))
  assert.deepEqual(display.rows().map(row => row.trim()), ['A', 'B'])
  display.write(0x27, command(1))
  assert.deepEqual(display.rows().map(row => row.trim()), ['', ''])
})

test('LCD rejects a wrong address, an invalid data byte, and writes without power', () => {
  const display = lab.createLcd1602(0x27, true)
  assert.equal(display.write(0x3f, []), false)
  assert.equal(display.write(0x27, [256]), false)
  assert.equal(lab.createLcd1602(0x27, false).write(0x27, []), false)
  assert.deepEqual(display.rows().map(row => row.trim()), ['', ''])
})

test('OLED page addressing respects bit order, column wrapping, and display off retaining its RAM', () => {
  const screen = lab.createOled1306(0x3c, true)
  assert.equal(screen.write(0x3d, [0x00, 0xaf]), false)
  assert.equal(screen.write(0x3c, [0x00, 0xaf, 0xb7, 0x0f, 0x17]), true)
  assert.equal(screen.write(0x3c, [0x40, 0x01, 0x80]), true)
  const lit = Array.from(screen.pixels().entries()).filter(([, bit]) => bit).map(([index]) => index)
  assert.deepEqual(lit, [56 * 128 + 127, 63 * 128])
  screen.write(0x3c, [0x00, 0xae])
  assert.equal(screen.pixels().some(Boolean), false)
  screen.write(0x3c, [0x00, 0xaf])
  assert.equal(screen.pixels().reduce((a, b) => a + b, 0), 2)
  assert.equal(lab.createOled1306(0x3c, false).write(0x3c, []), false)
})

test('MAX7219 gates its digits by scan limit and preserves data through shutdown and display test', () => {
  const matrix = lab.createLedMatrix7219()
  for (const word of [0x0181, 0x02ff, 0x0a09, 0x0c01]) matrix.write(word)
  const count = () => matrix.read().pixels.reduce((a, b) => a + b, 0)
  assert.equal(count(), 2)
  assert.deepEqual(Array.from(matrix.read().pixels.slice(0, 8)), [1, 0, 0, 0, 0, 0, 0, 1])
  matrix.write(0x0b07)
  assert.equal(count(), 10)
  assert.equal(matrix.read().intensity, 9)
  matrix.write(0x0c00)
  assert.equal(count(), 0)
  matrix.write(0x0f01)
  assert.equal(count(), 64)
  matrix.write(0x0f00)
  assert.equal(count(), 0)
  matrix.write(0x0c01)
  assert.equal(count(), 10)
})

test('MQTT lesson distinguishes Wi-Fi, broker, exact topic match and successful delivery', () => {
  const valid = { wifi: 'connected', brokerOnline: true, topic: 'lop/nhiet-do', subscription: 'lop/nhiet-do', payload: '{"nhietDo":25}' }
  assert.deepEqual(lab.simulateTelemetry(valid), { stage: 'delivered', payload: valid.payload })
  for (const [overrides, stage] of [
    [{ wifi: 'wrong-password', brokerOnline: false }, 'wrong-password'],
    [{ wifi: 'no-network' }, 'no-network'],
    [{ brokerOnline: false }, 'broker-unavailable'],
    [{ subscription: 'LOP/nhiet-do' }, 'no-match'],
  ]) assert.deepEqual(lab.simulateTelemetry({ ...valid, ...overrides }), { stage, payload: null })
})
