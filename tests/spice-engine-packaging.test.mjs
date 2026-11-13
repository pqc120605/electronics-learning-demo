import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

test('SPICE WASM stays external and the upstream engine excludes unused bundled PDK model cards', async () => {
  const engine = await readFile('node_modules/eecircuit-engine/dist/eecircuit-engine.mjs', 'utf8')
  const browserEngine = await readFile('public/vendor/eecircuit-engine/eecircuit-engine.mjs', 'utf8')
  const worker = await readFile('src/simulation/spice.worker.ts', 'utf8')
  const wasm = await stat('public/vendor/eecircuit-engine/spice.wasm')

  assert.ok(engine.includes('MACH_MO_SPICE_EXTERNAL_WASM'))
  assert.ok(engine.includes('/vendor/eecircuit-engine/spice.wasm'))
  assert.ok(!/data:application\/wasm;base64,[A-Za-z0-9+/=]{1000,}/.test(engine))
  assert.ok(!engine.includes('r.FS?.writeFile("/modelcard.'))
  assert.ok(!engine.includes('r.FS?.writeFile("/sm141064.ngspice"'))
  assert.equal(browserEngine, engine)
  assert.match(worker, /import\(\/\* @vite-ignore \*\/ engineUrl\)/)
  assert.doesNotMatch(worker, /from ['"]eecircuit-engine['"]/)
  assert.ok(wasm.size > 1_000_000)
})
