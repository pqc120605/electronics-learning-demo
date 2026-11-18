import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { engineFiles, verifyBuildArtifacts } from './ngspice-build/verify-artifacts.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const packageRoot = dirname(dirname(fileURLToPath(import.meta.resolve('eecircuit-engine'))))
const packageInfo = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const record = JSON.parse(await readFile(join(packageRoot, 'build-record.json'), 'utf8'))
const manifest = JSON.parse(await readFile(join(root, 'public/licenses/spice-engine-provenance.json'), 'utf8'))
if (packageInfo.version !== manifest.wrapper.version || record.sources.wrapper.commit !== manifest.wrapper.sourceCommit || record.sources.ngspice.commit !== manifest.runtime.sourceCommit) throw new Error('Source-pinned engine package does not match the reviewed provenance')
if (JSON.stringify(record.artifacts) !== JSON.stringify(manifest.buildArtifacts)) throw new Error('Engine build records disagree; refusing to replace public assets')
await verifyBuildArtifacts(record, join(packageRoot, 'dist'))
const target = join(root, 'public/vendor/eecircuit-engine')
await mkdir(target, { recursive: true })
for (const name of engineFiles) await copyFile(join(packageRoot, 'dist', name), join(target, name))
await verifyBuildArtifacts(record, target)
console.log(`Prepared source-pinned eecircuit-engine ${packageInfo.version}; matching wrapper, parser, JS glue and WASM verified. Distribution status: ${manifest.redistribution.status}.`)
