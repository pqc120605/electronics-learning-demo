import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const approval = '29b9b6a39efdbb6735ced894e428f44c1a0147305cd79061c0c8497ac31854d0'
const proposalPath = 'docs/research/2026-11-26-catalog-model-ic-r1-proposal.json'
const library = process.argv[2]
if (!library) throw new Error('Pass the KiCad 10.0.7 share/kicad directory')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
async function verified(path, hash) {
  const bytes = await readFile(path)
  if (sha256(bytes) !== hash) throw new Error('Source SHA-256 mismatch: ' + path)
  return bytes
}
const { parts } = JSON.parse(await verified(proposalPath, approval))
const occt = await occtFactory()
const directory = '/models/components/catalog-ic-1/'
const assets = {}
await mkdir('public' + directory, { recursive: true })

function leadSections(meshes) {
  const plane = -0.2
  const crossings = []
  for (const mesh of meshes) {
    const vertices = mesh.attributes.position.array
    const indices = mesh.index.array
    for (let i = 0; i < indices.length; i += 3) {
      for (let edge = 0; edge < 3; edge++) {
        const a = indices[i + edge] * 3
        const b = indices[i + (edge + 1) % 3] * 3
        const az = vertices[a + 2], bz = vertices[b + 2]
        if ((az < plane) === (bz < plane)) continue
        const ratio = (plane - az) / (bz - az)
        crossings.push([
          vertices[a] + ratio * (vertices[b] - vertices[a]),
          -(vertices[a + 1] + ratio * (vertices[b + 1] - vertices[a + 1])),
        ])
      }
    }
  }
  return crossings
}

for (const part of parts) {
  const step = await verified(join(library, part.step.path), part.step.sha256)
  const footprint = await verified(join(library, part.footprint.path), part.footprint.sha256)
  const padRows = [...footprint.toString().matchAll(/\(pad "(\d+)" thru_hole (\w+)\s*\(at ([-\d.]+) ([-\d.]+)(?: [-\d.]+)?\)\s*\(size ([\d.]+) ([\d.]+)\)\s*\(drill ([\d.]+)\)/g)]
  const pads = padRows.map(([, pad, shape, x, z, width, height, drill]) =>
    ({ pad: +pad, shape, x: +x, z: +z, width: +width, height: +height, drill: +drill }))
  if (pads.length !== part.pins.length || pads.some((pad, index) => pad.pad !== part.pins[index].pad)) {
    throw new Error('Footprint pad identity mismatch: ' + part.mpn)
  }
  const result = occt.ReadStepFile(step, {
    linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.001, angularDeflection: 0.32,
  })
  if (!result.success || !result.meshes.length) throw new Error('STEP import failed: ' + part.mpn)
  const crossings = leadSections(result.meshes)
  const offsets = pads.map(({ pad, x, z }) => {
    const points = crossings.filter(p => Math.hypot(p[0] - x, p[1] - z) < 0.65)
    if (!points.length) throw new Error(`${part.mpn} lacks a lead over pad ${pad}`)
    const middle = axis => (Math.min(...points.map(p => p[axis])) + Math.max(...points.map(p => p[axis]))) / 2
    return Math.hypot(middle(0) - x, middle(1) - z)
  })
  const maxOffsetMm = +Math.max(...offsets).toFixed(4)
  if (maxOffsetMm > 0.1) throw new Error(`${part.mpn} lead offset ${maxOffsetMm} mm`)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  const nodes = result.meshes.map((mesh, index) => {
    const primitives = primitivesFromStepMesh(mesh, (x, y, z) => [x, z, -y])
    for (const { positions, indices } of primitives) {
      triangles += indices.length / 3
      positions.forEach((value, i) => {
        const axis = i % 3
        min[axis] = Math.min(min[axis], value * 1000)
        max[axis] = Math.max(max[axis], value * 1000)
      })
    }
    return { name: `STEP ${index + 1}`, primitives }
  })
  const glb = writeGlb(nodes, {
    rootName: part.mpn, generator: 'Mạch Mở KiCad STEP conversion',
    extras: { approval, sourceSha256: part.step.sha256, sourceUnits: 'mm', outputUnits: 'm' },
  })
  const file = directory + part.catalogId + '.glb'
  const footprintName = basename(part.footprint.path)
  await writeFile('public' + file, glb)
  await writeFile('public' + directory + footprintName, footprint)
  assets[part.catalogId] = {
    file, bytes: glb.length, sha256: sha256(glb), sizeMm: max.map((value, axis) => value - min[axis]),
    boundsMm: { min, max }, triangles, sourceFile: part.step.path, sourceSha256: part.step.sha256,
    footprint: footprintName, footprintSha256: part.footprint.sha256, mount: 'breadboard', pads, maxOffsetMm,
  }
  console.log(part.mpn, pads.length + ' pads', 'maximum lead offset', maxOffsetMm + ' mm')
}
await writeFile('src/data/approved-catalog-ic-assets.json', JSON.stringify(assets, null, 2) + '\n')
await writeFile('public' + directory + 'NOTICE.txt',
  'KiCad Libraries Contributors. KiCad 10.0.7 DIP footprints are unaltered. Reference STEP meshes were tessellated, rotated to Y-up and converted to GLB in metres.\n' +
  'CC BY-SA 4.0 with the KiCad library exception: https://www.kicad.org/libraries/license/\n' +
  'Source file paths, hashes and datasheets: docs/research/2026-11-26-catalog-model-ic-r1-proposal.json\n' +
  'Approved SHA-256: ' + approval + '\n')
