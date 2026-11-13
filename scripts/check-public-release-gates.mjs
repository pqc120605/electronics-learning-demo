import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPublicReleaseBlockers } from './public-release-gate.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(root, 'public/licenses/spice-engine-provenance.json'), 'utf8'))
const artifactPath = join(root, 'public', manifest.redistribution?.publicPath ?? '')
const artifact = await readFile(artifactPath).catch(() => null)
const blockers = getPublicReleaseBlockers(manifest, artifact)

if (blockers.length) {
  console.error('Public release blocked: the ngspice WASM redistribution gate is not cleared for this exact artifact.')
  for (const blocker of blockers) console.error(`- ${blocker}`)
  console.error(`Artifact: ${manifest.redistribution?.publicPath ?? 'unknown'}; SHA-256: ${manifest.runtime?.wasmSha256 ?? 'unknown'}`)
  process.exitCode = 1
} else {
  console.log(`Public redistribution evidence is recorded for ngspice ${manifest.runtime.version} WASM ${manifest.runtime.wasmSha256}.`)
  console.log('This checks that review evidence was recorded; it is not a legal opinion.')
}
