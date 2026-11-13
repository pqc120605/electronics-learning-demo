import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, workflow, runner, demo
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  workflow = await server.ssrLoadModule('/src/lib/firmwareWorkflow.ts')
  runner = await server.ssrLoadModule('/src/lib/avr8jsRunner.ts')
  demo = await server.ssrLoadModule('/src/data/avr8jsDemo.ts')
})
after(async () => { await server?.close() })
test('a newer firmware selection or clear invalidates delayed results and aborts fetch', async () => {
  const gate = workflow.createFirmwareLoadGuard()
  const old = gate.start()
  let finish
  let shown = ''
  const pending = new Promise(resolve => { finish = resolve }).then(value => { if (old.isCurrent()) shown = value })
  const current = gate.start()
  assert.equal(old.signal.aborted, true)
  shown = 'new.hex'
  finish('old.hex')
  await pending
  assert.equal(shown, 'new.hex')
  assert.equal(current.isCurrent(), true)
  gate.cancel()
  assert.equal(current.signal.aborted, true)
  assert.equal(current.isCurrent(), false)
})
test('CSV exports captured AVR transitions with source and units, not inferred electrical values', () => {
  const frame = runner.createAtmega328pMachine(demo.avr8jsD13TestHex).step(100)
  const csv = workflow.firmwareTraceCsv(frame)
  const lines = csv.trim().split('\r\n')
  assert.equal(lines.length, frame.pinTransitionEvents.length + 1)
  assert.match(lines[0], /simulated_ms,cycles,level,trace_truncated/)
  assert.match(lines[1], /avr8js,arduino-uno-r3-atmega328p,D13\/PB5/)
  assert.equal(Number(lines[1].split(',')[4]), frame.pinTransitionEvents[0].cycles)
  assert.doesNotMatch(csv, /voltage|current|amperes/)
})
