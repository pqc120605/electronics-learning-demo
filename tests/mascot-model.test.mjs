import assert from 'node:assert/strict'
import {test} from 'node:test'
import {buildMascotParts} from '../scripts/generate-mascot-model.mjs'
import {writeGlb} from '../scripts/glb-writer.mjs'
import {parseBoardGlb} from '../src/components/board/glbParser.ts'

test('the mascot is a real finite 3D mesh with separate head, wave arm, body and breadboard prop',()=>{
  const parts=buildMascotParts()
  assert.ok(parts.length>=30,'needs actual modeled body parts')
  for(const prefix of ['head_','body_','wave_','prop_'])assert.ok(parts.some(p=>p.name.startsWith(prefix)),prefix)
  for(const p of parts)for(const m of p.primitives){
    assert.ok(m.positions.length>=9);assert.equal(m.normals.length,m.positions.length)
    assert.ok([...m.positions,...m.normals].every(Number.isFinite),p.name)
    assert.ok([...m.indices].every(i=>i>=0&&i<m.positions.length/3))
  }
  const glb=writeGlb(parts,{rootName:'Mo',generator:'Mach Mo mascot'})
  assert.ok(glb.byteLength<2_000_000,'keep the optional mascot asset bounded')
  const buffer=glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength)
  const parsed=parseBoardGlb(buffer)
  assert.equal(parsed.nodeBounds.length,parts.length)
  const front=name=>parsed.nodeBounds.find(p=>p.nodeName===name).max[2]
  assert.ok(front('head_eye_-0.21')>front('head_screen'),'eyes must remain in front of the face panel')
  assert.ok(front('body_M')>front('body_chest'),'chest mark must remain visible above its plate')
  assert.ok(parsed.batches.some(b=>b.positions.some((v,i)=>i%3===2&&Math.abs(v)>.1)),'real depth, not a flat sprite')
})
