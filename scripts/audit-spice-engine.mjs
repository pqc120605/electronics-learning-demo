import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Simulation } from 'eecircuit-engine'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(root, 'public/licenses/spice-engine-provenance.json'), 'utf8'))
const packageEntry = fileURLToPath(import.meta.resolve('eecircuit-engine'))
const packageRoot = dirname(dirname(packageEntry))
const packageInfo = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const packageWasmPath = join(packageRoot, 'dist/spice.wasm')
const publicWasmPath = join(root, 'public/vendor/eecircuit-engine/spice.wasm')

assert.equal(packageInfo.name, manifest.wrapper.package, 'unexpected SPICE wrapper package')
assert.equal(packageInfo.version, manifest.wrapper.version, 'wrapper version changed; re-audit the runtime')

const packageWasm = await readFile(packageWasmPath)
const publicWasm = await readFile(publicWasmPath)
const wasmSha256 = createHash('sha256').update(packageWasm).digest('hex')
assert.equal(packageWasm.length, manifest.runtime.wasmBytes, 'SPICE WASM byte length changed')
assert.equal(wasmSha256, manifest.runtime.wasmSha256, 'SPICE WASM digest changed')
assert.equal(publicWasm.length, packageWasm.length, 'published WASM copy has a different size')
assert.equal(createHash('sha256').update(publicWasm).digest('hex'), wasmSha256, 'published WASM copy differs from installed package')

const simulation = new Simulation()
await simulation.start()
simulation.setNetList(`Provenance audit divider\nV1 IN 0 DC 5\nR1 IN OUT 1k\nR2 OUT 0 1k\n.op\n.end`)
const result = await simulation.runSim()
const headerMatch = result.header.match(/^Command:\s*ngspice-([^,\s]+), Build ([^\r\n]+)/m)
assert.ok(headerMatch, 'runtime output did not include an ngspice version/build header')
assert.equal(headerMatch[1], manifest.runtime.version, 'ngspice runtime version changed')
assert.equal(headerMatch[2].replace(/\s+/g, ' ').trim(), manifest.runtime.buildHeader, 'ngspice build header changed')
const output = result.data.find((column) => column.name.toLowerCase() === manifest.audit.expectedOutputNode)
assert.ok(output, `runtime did not report ${manifest.audit.expectedOutputNode}`)
const actualVolts = output.values[0]
assert.ok(Number.isFinite(actualVolts), 'runtime produced a non-finite divider result')
assert.ok(Math.abs(actualVolts - manifest.audit.expectedOutputVolts) <= manifest.audit.toleranceVolts, `expected ${manifest.audit.expectedOutputVolts} V, received ${actualVolts} V`)

console.log(`SPICE provenance verified: ${packageInfo.name} ${packageInfo.version}; ngspice ${headerMatch[1]}; ${packageWasm.length} WASM bytes; SHA-256 ${wasmSha256}.`)
console.log(`DC smoke test passed: ${manifest.audit.expectedOutputNode} = ${actualVolts} V.`)
console.warn(`Upstream ngspice source commit is not recorded (${manifest.runtime.sourceCommitStatus})`)
console.warn(`Public redistribution status: ${manifest.redistribution?.status ?? 'not recorded'}; component inventory: ${manifest.redistribution?.componentInventory ?? 'not recorded'}. The runtime artifact is served at ${manifest.redistribution?.publicPath ?? 'unknown path'}.`)

const publicWasmSize = (await stat(publicWasmPath)).size
assert.equal(publicWasmSize, manifest.runtime.wasmBytes)
