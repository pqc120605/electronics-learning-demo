import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { verifyBuildArtifacts } from '../scripts/ngspice-build/verify-artifacts.mjs'
import { Simulation } from 'eecircuit-engine'

test('self-built engine preparation rejects mismatched JS glue and WASM bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machmo-spice-'))
  try {
    const artifacts = {}
    for (const name of ['eecircuit-engine.mjs', 'readOutput.mjs', 'spice.mjs', 'spice.wasm']) {
      const bytes = Buffer.from(`fixture ${name}`)
      await writeFile(join(dir, name), bytes)
      artifacts[name] = { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }
    }
    await verifyBuildArtifacts({ artifacts }, dir)
    await writeFile(join(dir, 'spice.mjs'), 'wrong glue')
    await assert.rejects(verifyBuildArtifacts({ artifacts }, dir), /spice\.mjs.*mismatch/)
    delete artifacts['spice.wasm']
    await assert.rejects(verifyBuildArtifacts({ artifacts }, dir), /spice\.wasm.*missing/)
  } finally { await rm(dir, { recursive:true, force:true }) }
})

test('self-built artifact records cannot escape their package directory', async () => {
  await assert.rejects(verifyBuildArtifacts({ artifacts: { '../secret': { sha256:'0'.repeat(64), bytes:1 } } }, '.'), /unsafe artifact path/)
})

test('self-built engine performs repeat DC, transient and AC solves on one instance', {timeout:15000}, async()=>{
  const simulation=new Simulation()
  await simulation.start()
  const solve=async(netlist)=>{simulation.setNetList(netlist); return simulation.runSim()}
  const divider=await solve('Divider\nV1 in 0 DC 5\nR1 in out 1k\nR2 out 0 1k\n.op\n.end')
  assert.ok(Math.abs(divider.data.find(c=>c.name==='v(out)').values[0]-2.5)<1e-6)
  const transient=await solve('RC\nV1 in 0 DC 5\nR1 in out 1k\nC1 out 0 1u IC=0\n.tran 10u 5m uic\n.end')
  assert.ok(transient.numPoints>100)
  const finalVoltage=transient.data.find(c=>c.name==='v(out)').values.at(-1)
  assert.ok(Math.abs(finalVoltage-5*(1-Math.exp(-5)))<1e-3)
  const ac=await solve('AC\nV1 in 0 DC 0 AC 1\nR1 in out 1k\nC1 out 0 1u\n.ac lin 1 159.154943 159.154943\n.end')
  assert.equal(ac.dataType,'complex')
  const value=ac.data.find(c=>c.name==='v(out)').values[0]
  assert.ok(Math.abs(Math.hypot(value.real,value.img)-Math.SQRT1_2)<1e-5)
})
