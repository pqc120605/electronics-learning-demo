import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL('../' + path, import.meta.url))
const json = async path => JSON.parse(await read(path))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

async function glbPayload(file, expectedHash) {
  const bytes = await read('public' + file.split('?')[0])
  assert.equal(digest(bytes), expectedHash, file)
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  return JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)))
}

test('all four approved ICs use the original KiCad pad identities and verified STEP lead geometry', async () => {
  const approvalPath = 'docs/research/2026-11-26-catalog-model-ic-r1-proposal.json'
  assert.equal(digest(await read(approvalPath)), '29b9b6a39efdbb6735ced894e428f44c1a0147305cd79061c0c8497ac31854d0')
  const { parts } = await json(approvalPath)
  const assets = await json('src/data/approved-catalog-ic-assets.json')
  const topViews = await json('src/data/componentTopViews.json')
  assert.deepEqual(Object.keys(assets).sort(), parts.map(part => part.catalogId).sort())
  for (const part of parts) {
    const asset = assets[part.catalogId]
    const footprint = await read('public/models/components/catalog-ic-1/' + asset.footprint)
    assert.equal(digest(footprint), part.footprint.sha256)
    const numbers = [...footprint.toString().matchAll(/\(pad "(\d+)" thru_hole\b/g)].map(match => Number(match[1]))
    assert.deepEqual(numbers, part.pins.map(pin => pin.pad), part.mpn)
    assert.deepEqual(asset.pads.map(pad => pad.pad), numbers)
    assert.ok(asset.maxOffsetMm <= 0.1, part.mpn)
    for (const pad of asset.pads) {
      assert.equal(pad.x, pad.pad <= numbers.length / 2 ? 0 : 7.62)
      assert.ok(pad.drill > 0 && pad.drill < Math.min(pad.width, pad.height))
    }
    const glb = await glbPayload(asset.file, asset.sha256)
    assert.equal(glb.asset.extras.sourceSha256, part.step.sha256)
    assert.ok(glb.meshes.flatMap(mesh => mesh.primitives).length >= 2)
    const top = topViews[asset.sha256]
    assert.equal(digest(await read('public' + top.image)), top.imageSha256)
    for (const { x, z } of asset.pads) {
      assert.ok(x > top.boundsMm.minX && x < top.boundsMm.maxX, part.mpn)
      assert.ok(z > top.boundsMm.minZ && z < top.boundsMm.maxZ, part.mpn)
    }
  }
})

test('all three approved Arduino SKUs have matching STEP, PCB evidence, top projection and selectable pins', async () => {
  const approvalPath = 'docs/research/2026-11-26-catalog-model-arduino-r1-proposal.json'
  assert.equal(digest(await read(approvalPath)), '52c865818685bdc6c88ee79c6fed2f5cae3a982ba50d861f011a6ab1cb0e8e1a')
  const { variants } = await json(approvalPath)
  const assets = await json('src/data/approved-arduino-assets.json')
  const atlas = await json('src/data/boardTopViews.json')
  assert.deepEqual(assets.map(model => model.id).sort(), variants.map(variant => variant.boardId).sort())
  for (const variant of variants) {
    const asset = assets.find(model => model.id === variant.boardId)
    const top = atlas[variant.boardId]
    assert.equal(asset.sku, variant.sku)
    assert.equal(asset.sourceSha256, variant.mechanicalSource.sha256)
    assert.equal(asset.pcbSha256, variant.pcbLocationEvidence.sha256)
    assert.equal(top.assetSha256, asset.sha256)
    assert.equal(asset.assetVersion, asset.sha256.slice(0, 12))
    assert.equal(digest(await read('public' + top.image)), top.imageSha256)
    const glb = await glbPayload(asset.assetUrl, asset.sha256)
    assert.equal(glb.asset.extras.sourceSha256, asset.sourceSha256)
    assert.ok(glb.nodes.some(node => node.name === 'PCB'))
    assert.ok(Object.keys(asset.features).every(ref => glb.nodes.some(node => node.name === ref)), variant.sku)
    assert.equal(asset.pins.length, variant.sku === 'ABX00083' ? 30 : 32, variant.sku)
    assert.ok(asset.maxPadOffsetMm <= (variant.sku === 'ABX00083' ? 0.15 : 0.1), variant.sku)
    assert.equal(new Set(asset.pins.map(pin => pin.id)).size, asset.pins.length)
    for (const { anchorMm: [x, , z] } of asset.pins) {
      assert.ok(x > top.boundsMm.minX && x < top.boundsMm.maxX, variant.sku)
      assert.ok(z > top.boundsMm.minZ && z < top.boundsMm.maxZ, variant.sku)
    }
  }
})
