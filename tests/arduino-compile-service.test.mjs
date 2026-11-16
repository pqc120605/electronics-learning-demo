import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { Readable } from 'node:stream'
import {
  ARDUINO_FQBN, DEFAULT_ARDUINO_CLI, MAX_SKETCH_BYTES, compileArduinoSketch, createLocalToolsMiddleware,
  extractBootromFromElf, isLocalRequest, validateCompileRequest,
} from '../scripts/arduino-compile-service.mjs'

const blink = 'void setup(){ pinMode(13, OUTPUT); }\nvoid loop(){ digitalWrite(13, HIGH); delay(500); digitalWrite(13, LOW); delay(500); }\n'

function fakeRequest({ method = 'GET', url, body, host = '127.0.0.1:5173', remote = '127.0.0.1', headers = {} }) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(body)])
  Object.assign(req, { method, url, headers: { host, ...headers }, socket: { remoteAddress: remote } })
  return req
}
function fakeResponse() {
  let resolve
  const done = new Promise(r => { resolve = r })
  const res = { statusCode: 0, headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value }, end(payload) { this.payload = payload; resolve(this) } }
  return { res, done }
}
async function call(middleware, options) {
  const { res, done } = fakeResponse()
  let passed = false
  await middleware(fakeRequest(options), res, () => { passed = true; res.end() })
  await done
  const json = typeof res.payload === 'string' ? JSON.parse(res.payload) : undefined
  return { status: res.statusCode, json, passed, res }
}

test('compile request accepts only known boards and plain library includes', () => {
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: '#include <Servo.h>\n' + blink }).fqbn, ARDUINO_FQBN['arduino-uno-r3'])
  assert.equal(validateCompileRequest({ board: 'esp32-devkit', source: blink }).status, 400)
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: '   ' }).status, 400)
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: 'x'.repeat(MAX_SKETCH_BYTES + 1) }).status, 413)
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: '#include "C:/Users/a/.env"\n' + blink }).ok, false)
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: '#include "../secret.h"\n' + blink }).ok, false)
  assert.equal(validateCompileRequest({ board: 'arduino-uno-r3', source: '#include </etc/passwd>\n' + blink }).ok, false)
  assert.equal(validateCompileRequest({ board: '--build-property', source: blink }).ok, false)
  assert.equal(validateCompileRequest(['arduino-uno-r3']).ok, false)
})

test('only loopback requests with a localhost Host/Origin reach the tools', () => {
  assert.equal(isLocalRequest(fakeRequest({ url: '/' })), true)
  assert.equal(isLocalRequest(fakeRequest({ url: '/', remote: '192.168.1.5' })), false)
  assert.equal(isLocalRequest(fakeRequest({ url: '/', host: 'evil.example:5173' })), false)
  assert.equal(isLocalRequest(fakeRequest({ url: '/', headers: { origin: 'https://evil.example' } })), false)
  assert.equal(isLocalRequest(fakeRequest({ url: '/', host: 'localhost:4173', headers: { origin: 'http://localhost:4173' } })), true)
})

test('middleware routes health, compile, busy and error cases', async () => {
  let release
  const compile = () => new Promise(resolve => { release = () => resolve({ ok: true, hex: ':00000001FF\n', log: '' }) })
  const middleware = createLocalToolsMiddleware({ cliPath: DEFAULT_ARDUINO_CLI, compile })
  assert.equal((await call(middleware, { url: '/other' })).passed, true)
  const health = await call(middleware, { url: '/api/local-tools/health' })
  assert.equal(health.status, 200)
  assert.deepEqual(health.json.boards, Object.keys(ARDUINO_FQBN))
  assert.equal((await call(middleware, { url: '/api/local-tools/health', remote: '10.0.0.2' })).status, 403)
  assert.equal((await call(middleware, { method: 'POST', url: '/api/local-tools/compile', body: '{}', headers: { 'content-type': 'text/plain' } })).status, 415)
  assert.equal((await call(middleware, { method: 'POST', url: '/api/local-tools/compile', body: '{oops', headers: { 'content-type': 'application/json' } })).status, 400)
  const body = JSON.stringify({ board: 'arduino-uno-r3', source: blink })
  const first = call(middleware, { method: 'POST', url: '/api/local-tools/compile', body, headers: { 'content-type': 'application/json' } })
  await new Promise(resolve => setTimeout(resolve, 20))
  const busy = await call(middleware, { method: 'POST', url: '/api/local-tools/compile', body, headers: { 'content-type': 'application/json' } })
  assert.equal(busy.status, 429)
  release()
  const done = await first
  assert.equal(done.status, 200)
  assert.equal(done.json.fqbn, 'arduino:avr:uno')
})

test('bootrom extraction takes the 16 KB load segment at address 0', () => {
  const elf = Buffer.alloc(0x1000 + 16384)
  elf.writeUInt32BE(0x7f454c46, 0)
  elf.writeUInt32LE(52, 28); elf.writeUInt16LE(32, 42); elf.writeUInt16LE(1, 44)
  elf.writeUInt32LE(1, 52); elf.writeUInt32LE(0x1000, 56); elf.writeUInt32LE(0, 64); elf.writeUInt32LE(16384, 68)
  elf[0x1000] = 0xab
  const rom = extractBootromFromElf(elf)
  assert.equal(rom.length, 16384)
  assert.equal(rom[0], 0xab)
  assert.throws(() => extractBootromFromElf(Buffer.from('not an elf at all, definitely too short for a header')))
})

test('arduino-cli compiles a real Uno blink into Intel HEX and reports compile errors', { timeout: 240_000 }, async () => {
  if (!existsSync(DEFAULT_ARDUINO_CLI)) {
    const missing = await compileArduinoSketch({ source: blink, fqbn: ARDUINO_FQBN['arduino-uno-r3'] })
    assert.equal(missing.unavailable, true)
    return
  }
  const ok = await compileArduinoSketch({ source: blink, fqbn: ARDUINO_FQBN['arduino-uno-r3'] })
  assert.equal(ok.ok, true, ok.log)
  assert.match(ok.hex, /^:[0-9A-F]+/m)
  assert.match(ok.hex, /:00000001FF/)
  assert.doesNotMatch(ok.log, /machmo-sketch-/)
  const broken = await compileArduinoSketch({ source: 'void setup(){ int x = ; }\nvoid loop(){}\n', fqbn: ARDUINO_FQBN['arduino-uno-r3'] })
  assert.equal(broken.ok, false)
  assert.match(broken.log, /error/i)
  assert.match(broken.log, /<sketch>/)
})
