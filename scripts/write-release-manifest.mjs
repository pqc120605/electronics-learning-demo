import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const commit = process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: new URL('../', import.meta.url), encoding: 'utf8' }).trim()
if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error('The public build requires a full commit SHA.')

const html = await readFile(new URL('index.html', dist), 'utf8')
const entry = html.match(/<script\b[^>]*\bsrc="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1]
if (!entry) throw new Error('The public build has no fingerprinted JavaScript entry.')
await readFile(new URL(entry.slice(1), dist))

const wasm = await readFile(new URL('vendor/eecircuit-engine/spice.wasm', dist))
const spiceWasmSha256 = createHash('sha256').update(wasm).digest('hex')
const release = { commit, builtAt: new Date().toISOString(), entry, spiceWasmSha256 }
await writeFile(new URL('release.json', dist), JSON.stringify(release, null, 2) + '\n')
