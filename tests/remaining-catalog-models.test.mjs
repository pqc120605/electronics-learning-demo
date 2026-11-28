import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { approval, proposalPath } from '../scripts/remaining-catalog-inputs.mjs'

const read = path => readFileSync(new URL('../' + path, import.meta.url))
const load = path => JSON.parse(read(path))
const sha = value => createHash('sha256').update(value).digest('hex')
const proposal = load(proposalPath)
const boards = load('src/data/remaining-catalog-board-assets.json')
const parts = load('src/data/remaining-catalog-parts-assets.json')
const boardTop = load('src/data/boardTopViews.json')
const partTop = load('src/data/componentTopViews.json')
const count = [30, 34, 32, 44, 30, 108, 108, 108, 30]

function glb(file, hash) {
  const data = read('public' + file.split('?')[0])
  assert.equal(sha(data), hash)
  assert.equal(data.readUInt32LE(0), 0x46546c67)
  assert.equal(data.readUInt32LE(8), data.length)
  const document = JSON.parse(data.toString('utf8', 20, 20 + data.readUInt32LE(12)))
  assert.equal(document.asset.extras.approval, approval)
  return document
}

function verifyTop(top) {
  assert.ok(top.width >= 320 && top.height >= 150)
  assert.equal(sha(read('public' + top.image)), top.imageSha256)
}

test('remaining catalog assets match the approved SHA-256 and exact approved scope', () => {
  assert.equal(sha(read(proposalPath)), approval)
  assert.deepEqual(boards.map(board => board.id), proposal.boards.map(board => board.catalogId))
  assert.deepEqual(Object.keys(parts), proposal.components.map(part => part.catalogId))
  assert.equal(boards.length, 9)
  assert.equal(Object.keys(parts).length, 4)
})

for (const [i, board] of proposal.boards.entries()) {
  test(board.orderCode + ' has a matching 2D/3D view and board-specific header anchors', () => {
    const asset = boards[i]
    assert.equal(board.pcbRevision, asset.revision)
    assert.equal(asset.pins.length, count[i])
    assert.equal(new Set(asset.pins.map(pin => pin.id)).size, count[i])
    const document = glb(asset.assetUrl, asset.sha256)
    const top = boardTop[asset.id]
    verifyTop(top)
    assert.equal(top.assetSha256, asset.sha256)
    assert.equal(document.asset.extras.orderCode, board.orderCode)
    assert.equal(document.asset.extras.pcbRevision, board.pcbRevision)
    for (const ref of Object.keys(asset.features)) assert.ok(document.meshes.some(mesh => mesh.name === ref))
    for (const pin of asset.pins) {
      const [x,y,z] = pin.anchorMm
      assert.ok(pin.label)
      assert.ok(Math.abs(x) <= asset.sizeMm[0] / 2 && Math.abs(z) <= asset.sizeMm[1] / 2)
      assert.ok(y > 1.6)
      const mesh = document.meshes.find(mesh => mesh.name === pin.headerReference)
      assert.ok(mesh.primitives.some(({ attributes }) => {
        const { min,max } = document.accessors[attributes.POSITION]
        return [[x,0],[z,2]].every(([value,n]) => (min[n] * 1000 + max[n] * 1000) / 2 - value < .001
          && Math.abs((min[n] + max[n]) * 500 - value) < .001)
      }), pin.id)
    }
    if (i === 6) assert.equal(asset.pins.find(pin => pin.id === 'cn10-18').label, 'PB11')
  })
}

for (const part of proposal.components) {
  test(part.mpn + ' has numbered leads, aligned KiCad drill centres and matching 2D/3D', () => {
    const asset = parts[part.catalogId]
    const doc = glb(asset.file, asset.sha256)
    verifyTop(partTop[asset.sha256])
    const footprint = read('public/models/components/catalog-kit-1/' + asset.footprint)
    assert.equal(sha(footprint), asset.footprintSha256)
    const pads = [...footprint.toString().matchAll(/\(pad "(\d+)" thru_hole (\w+) \(at ([-.\d]+) ([-.\d]+)\) \(size ([.\d]+) ([.\d]+)\) \(drill ([.\d]+)\)/g)]
      .map(([,pad,shape,x,z,width,height,drill]) => ({ pad:+pad, shape, x:+x, z:+z, width:+width, height:+height, drill:+drill }))
    assert.deepEqual(pads, asset.pads)
    assert.deepEqual(pads.map(pad => pad.pad), part.pins.map(pin => pin.pad))
    for (const pad of pads) {
      const lead = doc.meshes.find(mesh => mesh.name === 'Chân ' + pad.pad)
      assert.ok(lead)
      const { min, max } = doc.accessors[lead.primitives.at(-1).attributes.POSITION]
      assert.ok(Math.abs((min[0] + max[0]) * 500 - pad.x) < .001)
      assert.ok(Math.abs((min[2] + max[2]) * 500 - pad.z) < .001)
      if (part.footprint.drillMm) assert.equal(pad.drill, part.footprint.drillMm)
    }
    if (part.catalogId.startsWith('dht')) assert.equal(part.pins[2].libraryPinId, null)
    if (part.catalogId === 'seven-segment-anode') {
      assert.equal(pads[0].shape, 'rect')
      assert.equal(pads[0].z - pads[9].z, 15.24)
      assert.deepEqual(part.pins.filter(pin => pin.label.startsWith('COM')).map(pin => pin.pad), [3,8])
    }
    if (part.catalogId === 'keypad-4x4') {
      assert.equal(doc.meshes.filter(mesh => mesh.name.startsWith('Phím ')).length, 16)
      assert.equal(doc.meshes.find(mesh => mesh.name === 'Vị trí NC không gắn chân').primitives.length, 2)
      assert.equal(part.pins[0].label, 'C1')
    }
  })
}
