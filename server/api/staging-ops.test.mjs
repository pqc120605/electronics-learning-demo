import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const lock = JSON.parse(await readFile(new URL('../community/package-lock.json', import.meta.url), 'utf8'))
const copier = fileURLToPath(new URL('./copy-staging-pg.mjs', import.meta.url))

async function fixture(t, change) {
  const root = await mkdtemp(join(tmpdir(), 'machmo-staging-pg-'))
  t.after(async () => {
    assert.equal(dirname(root), tmpdir())
    assert.match(basename(root), /^machmo-staging-pg-/)
    await rm(root, { recursive: true, force: true })
  })
  const source = join(root, 'live')
  const output = join(root, 'release')
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path || entry.optional) continue
    const name = path.slice('node_modules/'.length)
    const installed = join(source, name)
    await mkdir(installed, { recursive: true })
    const version = name === 'pg' && change ? '0.0.0-fixture' : entry.version
    await writeFile(join(installed, 'package.json'), JSON.stringify({ name, version }))
  }
  return { source, output }
}

test('deployment copies only the locked PostgreSQL driver from an existing installation', async t => {
  const { source, output } = await fixture(t)
  await mkdir(join(source, 'unrelated-package'))
  const result = spawnSync(process.execPath, [copier, source, output], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const installed = JSON.parse(await readFile(join(output, 'pg', 'package.json'), 'utf8'))
  assert.equal(installed.version, lock.packages['node_modules/pg'].version)
  await assert.rejects(stat(join(output, 'unrelated-package')), { code: 'ENOENT' })
})

test('a mismatched installed PostgreSQL driver leaves the release directory untouched', async t => {
  const { source, output } = await fixture(t, true)
  const result = spawnSync(process.execPath, [copier, source, output], { encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /differs from the lockfile: pg/)
  await assert.rejects(stat(output), { code: 'ENOENT' })
})
