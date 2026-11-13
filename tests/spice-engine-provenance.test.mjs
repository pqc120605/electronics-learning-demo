import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { getPublicReleaseBlockers } from '../scripts/public-release-gate.mjs'

const manifest = JSON.parse(await readFile(new URL('../public/licenses/spice-engine-provenance.json', import.meta.url), 'utf8'))
const pkg = JSON.parse(await readFile(new URL('../node_modules/eecircuit-engine/package.json', import.meta.url), 'utf8'))
const licenseIndex = await readFile(new URL('../public/licenses/README.txt', import.meta.url), 'utf8')
const ngspiceNotice = await readFile(new URL('../public/licenses/NGSPICE-NOTICE.txt', import.meta.url), 'utf8')
const wasmBytes = await readFile(new URL(`../public${manifest.redistribution.publicPath}`, import.meta.url))

test('SPICE provenance pins the installed wrapper, runtime, and exact WASM artifact', () => {
  assert.equal(manifest.wrapper.package, 'eecircuit-engine')
  assert.equal(manifest.wrapper.version, pkg.version)
  assert.equal(manifest.wrapper.registryReportedGitHead, 'f4dab6458d3865a1db9766008480690d23410c3a')
  assert.match(manifest.wrapper.gitHeadAssessment, /unverified.*version 1\.7\.0.*1\.8\.0/i)
  assert.match(manifest.runtime.version, /^45\.2$/)
  assert.match(manifest.runtime.wasmSha256, /^[a-f0-9]{64}$/i)
  assert.ok(Number.isInteger(manifest.runtime.wasmBytes) && manifest.runtime.wasmBytes > 1_000_000)
  assert.equal(manifest.runtime.sourceCommit, null)
  assert.match(manifest.runtime.sourceCommitStatus, /gitHead.*inconsistent.*ngspice source commit.*unknown/i)
})

test('public third-party notices distinguish wrapper MIT from embedded ngspice terms', () => {
  assert.match(licenseIndex, /wrapper.*MIT/i)
  assert.match(licenseIndex, /ngspice.*WASM/i)
  assert.match(ngspiceNotice, /không phải kết luận pháp lý/i)
  assert.match(ngspiceNotice, /commit nguồn/i)
  assert.match(ngspiceNotice, /ngspice\/ngspice\/blob\/master\/COPYING/)
  assert.match(ngspiceNotice, /Modified BSD/i)
  assert.match(ngspiceNotice, /LGPLv2/i)
  assert.match(ngspiceNotice, /MPLv2/i)
  assert.match(ngspiceNotice, /không xác nhận quyền.*WASM/i)
})

test('the publicly served ngspice binary is explicitly gated until its exact build is cleared', async () => {
  assert.equal(manifest.redistribution.status, 'not-cleared')
  assert.equal(manifest.redistribution.publicPath, '/vendor/eecircuit-engine/spice.wasm')
  assert.equal(manifest.redistribution.componentInventory, 'unknown')
  assert.equal(manifest.runtime.sourceCommit, null)
  const binaryUrl = new URL(`../public${manifest.redistribution.publicPath}`, import.meta.url)
  const binary = await readFile(binaryUrl)
  assert.equal(binary.length, manifest.runtime.wasmBytes)
  assert.equal(createHash('sha256').update(binary).digest('hex'), manifest.runtime.wasmSha256)
  assert.match(ngspiceNotice, /NOT CLEARED/)
  assert.match(ngspiceNotice, /table\.cm/i)
  assert.match(ngspiceNotice, /không xác nhận binary này có hay không có table\.cm/i)
})

test('the documented SPICE artifact audit is exposed as a package command', async () => {
  const project = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(project.scripts['audit:spice-engine'], 'node scripts/audit-spice-engine.mjs')
  assert.equal(project.scripts['audit:board-models'], 'node scripts/audit-board-models.mjs')
  assert.equal(project.scripts['check:public-release'], 'node scripts/check-public-release-gates.mjs')
  assert.equal(project.scripts['build'], 'npm run check:public-release && npm run build:local')
  assert.equal(project.scripts['build:local'], 'tsc -b && vite build')
  assert.equal(project.scripts['build:public'], 'npm run build')
})

test('the public build gate fails closed while ngspice redistribution evidence is incomplete', () => {
  const result = spawnSync(process.execPath, ['scripts/check-public-release-gates.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Public release blocked/i)
  assert.match(result.stderr, /exact source commit is missing/i)
  assert.match(result.stderr, new RegExp(manifest.runtime.wasmSha256))
})

test('redistribution clearance must match the exact served WASM bytes and review hash', () => {
  const cleared = structuredClone(manifest)
  const sourceCommit = 'a'.repeat(40)
  cleared.runtime.sourceCommit = sourceCommit
  cleared.redistribution.status = 'cleared'
  cleared.redistribution.sourceCommit = sourceCommit
  cleared.redistribution.buildRecipe = 'Reproducible container build with pinned compiler and flags.'
  cleared.redistribution.componentInventory = [{
    name: 'ngspice core',
    version: '45.2',
    license: 'Modified BSD',
    sourceUrl: 'https://example.org/ngspice-source',
    noticePath: 'public/licenses/NGSPICE-NOTICE.txt',
    redistributionBasis: 'Reviewed against the exact pinned source and build recipe.',
  }]
  cleared.redistribution.distributionReview = {
    status: 'approved',
    reviewer: 'Release reviewer',
    reviewedAt: '2026-11-03T00:00:00Z',
    evidence: 'Review record for the exact artifact.',
    artifactSha256: manifest.runtime.wasmSha256,
  }
  assert.deepEqual(getPublicReleaseBlockers(cleared, wasmBytes), [])

  const mutatedBytes = Buffer.from(wasmBytes)
  mutatedBytes[0] ^= 0xff
  assert.match(getPublicReleaseBlockers(cleared, mutatedBytes).join('\n'), /SHA-256.*does not match/i)

  cleared.redistribution.distributionReview.artifactSha256 = '0'.repeat(64)
  assert.match(getPublicReleaseBlockers(cleared, wasmBytes).join('\n'), /review.*exact artifact hash/i)
})

test('the engine dependency and lockfile stay pinned to the audited artifact version', async () => {
  const project = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
  assert.equal(project.dependencies['eecircuit-engine'], manifest.wrapper.version)
  assert.equal(lock.packages[''].dependencies['eecircuit-engine'], manifest.wrapper.version)
  assert.equal(lock.packages['node_modules/eecircuit-engine'].version, manifest.wrapper.version)
})
