import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { loadRp2040Bootrom } from '../scripts/arduino-compile-service.mjs'

// MicroPython v1.29.0 chính thức (public/firmware/micropython) chạy trên rp2040js với bootrom B2 của Raspberry Pi.
// Bootrom được tải từ bản phát hành chính thức về .tmp/firmware-cache ở lần chạy đầu (cần mạng một lần).
let server, mp
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  mp = await server.ssrLoadModule('/src/lib/micropythonRunner.ts')
})
after(async () => { await server?.close() })

test('raw REPL parser separates stdout, traceback and the end marker', () => {
  const parser = mp.createRawReplParser()
  assert.deepEqual(parser.push('noise O'), { stdout: '', stderr: '', finished: false })
  assert.deepEqual(parser.push('Khi\r\n'), { stdout: 'hi\r\n', stderr: '', finished: false })
  assert.deepEqual(parser.push('\x04Traceback\x04>'), { stdout: '', stderr: 'Traceback', finished: true })
  parser.reset()
  assert.equal(parser.state, 'await-ok')
})

test('official MicroPython boots, runs user code over raw REPL and drives GPIO from the circuit', { timeout: 300_000 }, async () => {
  const bootrom = new Uint8Array(await loadRp2040Bootrom())
  const firmware = new Uint8Array(await readFile('public/firmware/micropython/RPI_PICO-20260824-v1.29.0.uf2'))
  const machine = mp.createMicroPythonMachine({ bootrom, firmware })
  machine.submit([
    'from machine import Pin, ADC',
    'import time',
    'led = Pin(15, Pin.OUT)',
    'btn = Pin(14, Pin.IN, Pin.PULL_UP)',
    'print("adc", ADC(26).read_u16() >> 4)',
    'for i in range(4):',
    '    led.toggle()',
    '    time.sleep_ms(100)',
    'print("nut", btn.value())',
  ].join('\n'))
  machine.setAnalogInput(26, 0.25)
  machine.setDigitalInput(14, false)
  let output = '', levels = new Set(), error = ''
  for (let i = 0; i < 400 && !(output.includes('nut') && machine.phase === 'idle'); i += 1) {
    const frame = machine.runFor(25)
    output += frame.output
    if (frame.error) error = frame.error
    if (frame.pins[15]) levels.add(frame.pins[15].level)
  }
  assert.equal(error, '')
  assert.match(output, /adc (\d+)/)
  const adc = Number(output.match(/adc (\d+)/)[1])
  assert.ok(adc > 950 && adc < 1100, `ADC ≈ 1023, nhận ${adc}`)
  assert.match(output, /nut 0/)
  assert.deepEqual([...levels].sort(), [false, true])

  // Ngắt chương trình đang chạy vô hạn, rồi lượt sau dùng lại máy (soft reset) và báo traceback.
  machine.submit('while True:\n    pass')
  for (let i = 0; i < 40; i += 1) machine.runFor(25)
  assert.equal(machine.phase, 'running')
  machine.submit('print(1/0)')
  let traceback = ''
  for (let i = 0; i < 200 && !traceback; i += 1) traceback = machine.runFor(25).error ?? ''
  assert.match(traceback, /ZeroDivisionError/)
})
