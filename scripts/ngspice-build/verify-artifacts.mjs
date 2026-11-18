import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

export const engineFiles = ['eecircuit-engine.mjs', 'readOutput.mjs', 'spice.mjs', 'spice.wasm']

export async function verifyBuildArtifacts(record, directory) {
  const entries = record?.artifacts
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error('Build artifact records are missing')
  for (const name of Object.keys(entries)) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error('unsafe artifact path')
  }
  for (const name of engineFiles) {
    if (!entries[name]) throw new Error(`${name} record is missing`)
  }
  for (const [name, expected] of Object.entries(entries)) {
    if (!/^[a-f0-9]{64}$/.test(expected?.sha256 ?? '') || !Number.isSafeInteger(expected.bytes) || expected.bytes < 1) throw new Error(`${name} has an invalid record`)
    const bytes = await readFile(join(directory, name))
    if (bytes.length !== expected.bytes || createHash('sha256').update(bytes).digest('hex') !== expected.sha256) throw new Error(`${name} hash or byte count mismatch`)
  }
}
