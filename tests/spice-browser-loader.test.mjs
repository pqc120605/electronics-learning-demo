import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('browser engine loads the external WASM URL and solves a DC divider', async () => {
  const wasm = await readFile('public/vendor/eecircuit-engine/spice.wasm')
  const originalProcess = globalThis.process
  const originalFetch = globalThis.fetch
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location')
  let wasmRequests = 0

  try {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new URL('http://127.0.0.1:5173/tools/spice'),
    })
    globalThis.process = undefined
    globalThis.fetch = async (input) => {
      const url = String(input)
      assert.match(url, /\/vendor\/eecircuit-engine\/spice\.wasm$/)
      wasmRequests += 1
      return new Response(wasm, { headers: { 'content-type': 'application/wasm' } })
    }

    const { Simulation } = await import('../public/vendor/eecircuit-engine/eecircuit-engine.mjs')
    const simulation = new Simulation()
    await simulation.start()
    simulation.setNetList(`Voltage Divider
V1 in 0 DC 5
R1 in out 1k
R2 out 0 1k
.op
.end`)
    const result = await simulation.runSim()
    const output = result.data.find((item) => item.name.toLowerCase().includes('out'))

    assert.equal(wasmRequests, 1)
    assert.ok(output, `expected output node in ${result.variableNames.join(', ')}`)
    assert.ok(Math.abs(output.values[0] - 2.5) < 1e-6, `expected 2.5 V, got ${output.values[0]}`)
  } finally {
    globalThis.process = originalProcess
    globalThis.fetch = originalFetch
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation)
    else delete globalThis.location
  }
})
