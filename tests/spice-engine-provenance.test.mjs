import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { getPublicReleaseBlockers } from '../scripts/public-release-gate.mjs'
import { verifyBuildArtifacts } from '../scripts/ngspice-build/verify-artifacts.mjs'

const manifest = JSON.parse(await readFile(new URL('../public/licenses/spice-engine-provenance.json',import.meta.url),'utf8'))
const pins = JSON.parse(await readFile(new URL('../scripts/ngspice-build/sources.json',import.meta.url),'utf8'))
const wasmBytes = await readFile(new URL(`../public${manifest.redistribution.publicPath}`,import.meta.url))

test('self-built engine pins source commits and verifies every paired runtime artifact', async()=>{
  assert.equal(manifest.runtime.sourceCommit,pins.ngspice.commit)
  assert.equal(manifest.wrapper.sourceCommit,pins.wrapper.commit)
  assert.equal(manifest.wrapper.version,'1.9.0-machmo.1')
  assert.equal(manifest.runtime.version,'45.2')
  assert.equal(createHash('sha256').update(wasmBytes).digest('hex'),manifest.runtime.wasmSha256)
  assert.equal(wasmBytes.length,manifest.runtime.wasmBytes)
  await verifyBuildArtifacts({artifacts:manifest.buildArtifacts},fileURLToPath(new URL('../public/vendor/eecircuit-engine/',import.meta.url)))
})

test('complete source, notices and relink materials match their recorded hashes',async()=>{
  const base=new URL('../public/licenses/ngspice-selfbuild/',import.meta.url)
  const materials=JSON.parse(await readFile(new URL('release-files.json',base),'utf8'))
  for(const name of ['ngspice-source.tar.gz','wrapper-source.tar.gz','source.patch','relink-build.tar.gz','toolchain-notices.tar.gz','toolchain-runtime-source.tar.gz','Containerfile','build.sh','numparam-readme.txt','sparse-notice.txt']) assert.ok(materials[name],`${name} missing`)
  for(const [name,record] of Object.entries(materials)){
    const bytes=await readFile(new URL(name,base))
    assert.equal(bytes.length,record.bytes,name)
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,name)
  }
  const notices=await readFile(new URL('../public/licenses/NGSPICE-NOTICE.txt',import.meta.url),'utf8')
  assert.match(notices,/Numparam.*LGPL/i)
  assert.match(notices,/Sparse.*Kundert/i)
  assert.match(notices,/hisim2.*hisimhv1.*hisimhv2/i)
  assert.match(notices,/Reverse engineering.*not restricted/i)
})

test('release gate rejects missing review even with exact known source and working WASM',()=>{
  const pending=structuredClone(manifest)
  pending.redistribution.status='not-cleared'
  pending.redistribution.distributionReview.status='pending'
  const blockers=getPublicReleaseBlockers(pending,wasmBytes)
  assert.match(blockers.join('\n'),/not cleared/)
  assert.match(blockers.join('\n'),/review.*incomplete/)
})

test('release clearance must bind to exact served bytes and review hash',()=>{
  const cleared=structuredClone(manifest)
  cleared.redistribution.status='cleared'
  cleared.redistribution.distributionReview={status:'approved',reviewer:'fixture reviewer',reviewedAt:'2026-11-17',evidence:'fixture evidence, not production approval',artifactSha256:manifest.runtime.wasmSha256}
  assert.deepEqual(getPublicReleaseBlockers(cleared,wasmBytes),[])
  const mutated=Buffer.from(wasmBytes); mutated[0]^=0xff
  assert.match(getPublicReleaseBlockers(cleared,mutated).join('\n'),/SHA-256.*does not match/i)
  cleared.redistribution.distributionReview.artifactSha256='0'.repeat(64)
  assert.match(getPublicReleaseBlockers(cleared,wasmBytes).join('\n'),/review.*exact artifact hash/i)
})

test('public build gate command agrees with current artifact review state',()=>{
  const r=spawnSync(process.execPath,['scripts/check-public-release-gates.mjs'],{encoding:'utf8'})
  assert.equal(r.status,manifest.redistribution.status==='cleared'?0:1)
  if(r.status!==0) assert.match(r.stderr,/Public release blocked/)
})

test('dependency and lockfile resolve the vendored source-pinned engine',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'))
  const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'))
  assert.equal(pkg.dependencies['eecircuit-engine'],'file:vendor/mach-mo-spice')
  assert.equal(lock.packages[''].dependencies['eecircuit-engine'],pkg.dependencies['eecircuit-engine'])
  assert.equal(lock.packages['node_modules/eecircuit-engine'].link,true)
  assert.equal(lock.packages['vendor/mach-mo-spice'].version,manifest.wrapper.version)
})
