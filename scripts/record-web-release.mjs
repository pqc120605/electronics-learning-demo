import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const isCommit = value => /^[a-f0-9]{40}$/.test(value ?? '')
const hosted = process.env.VERCEL === '1'
let commit = process.env.VERCEL_GIT_COMMIT_SHA
if (!hosted) {
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { commit = undefined }
}
if (hosted && !isCommit(commit)) throw new Error('Vercel Git commit SHA is missing or invalid.')
const surface = hosted && ['production', 'preview', 'development'].includes(process.env.VERCEL_ENV)
  ? process.env.VERCEL_ENV
  : 'local'
const digest = async url => createHash('sha256').update(await readFile(url)).digest('hex')
const output = new URL('../dist/', import.meta.url)
const metadata = {
  version: 1,
  commit: isCommit(commit) ? commit : null,
  surface,
  indexSha256: await digest(new URL('index.html', output)),
  spiceSha256: await digest(new URL('vendor/eecircuit-engine/spice.wasm', output)),
}
await writeFile(new URL('release.json', output), JSON.stringify(metadata, null, 2) + '\n')
console.info(`Recorded release.json for ${metadata.commit ?? 'source archive'} (${surface}).`)
