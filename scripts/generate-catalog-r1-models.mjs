import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'
import { catalogR1Approval, catalogR1Parts, r1Packages } from '../src/data/catalogR1Parts.ts'
import { catalogR2aApproval, catalogR2aParts, r2aPackages } from '../src/data/catalogR2aParts.ts'
import { catalogR2bApproval, catalogR2bParts, r2bPackages } from '../src/data/catalogR2bParts.ts'
import { catalogR3Approval, catalogR3Parts, r3Packages } from '../src/data/catalogR3Parts.ts'

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const args = process.argv.slice(2)
const configurations = {
  R1: [catalogR1Parts, r1Packages, catalogR1Approval, '2026-11-25'],
  R2A: [catalogR2aParts, r2aPackages, catalogR2aApproval, '2026-11-26'],
  R2B: [catalogR2bParts, r2bPackages, catalogR2bApproval, '2026-11-26'],
  R3: [catalogR3Parts, r3Packages, catalogR3Approval, '2026-11-26'],
}
const selected = args.filter(arg => arg.startsWith('--'))
const revision = selected.length ? selected[0].slice(2).toUpperCase() : 'R1'
if (selected.length > 1 || !Object.hasOwn(configurations, revision)) throw new Error('Select one known configuration')
const [partDefinitions, packageDefinitions, lockedSha, date] = configurations[revision]
const r2a = revision === 'R2A'
const r2b = revision === 'R2B'
const r3 = revision === 'R3'
const proposal = date + '-catalog-fidelity-' + revision.toLowerCase() + '-proposal.md'
const reviewed = await readFile('docs/research/' + proposal)
if (sha(reviewed) !== lockedSha) throw new Error(revision + ' configuration digest changed')

const library = args.find(arg => !arg.startsWith('--')) ?? 'D:/StartupOS/.tools/kicad-10.0.7/share/kicad'
const output = 'public/models/components/catalog-' + revision.toLowerCase()
const occt = await occtFactory()
const packages = {}
const shared = r2a || r2b ? JSON.parse(await readFile('src/data/catalog-r1-packages.json', 'utf8')) : {}
const glbs = new Map()
const footprints = new Map()

// Select the crossing of every lead with a plane immediately below the seating plane.
// KiCad STEP and footprint use opposite signs for Y. GLB uses Y-up, in metres.
function measureLeadOffsets(meshes, pads) {
  const section = -0.2
  const crossings = []
  for (const { attributes, index } of meshes) {
    const xyz = attributes.position.array
    for (let start = 0; start < index.array.length; start += 3) {
      for (let edge = 0; edge < 3; edge++) {
        const a = index.array[start + edge] * 3
        const b = index.array[start + ((edge + 1) % 3)] * 3
        const lo = xyz[a + 2] < section
        if (lo === (xyz[b + 2] < section)) continue
        const t = (section - xyz[a + 2]) / (xyz[b + 2] - xyz[a + 2])
        crossings.push([xyz[a] + (xyz[b] - xyz[a]) * t, -(xyz[a + 1] + (xyz[b + 1] - xyz[a + 1]) * t)])
      }
    }
  }
  return pads.map(({ pad, x, z }) => {
    // A pitch of 1.27 mm is the smallest in this approved set.
    const lead = crossings.filter(([px, pz]) => Math.hypot(px - x, pz - z) < 0.6)
    if (lead.length < 4) throw new Error('No usable lead section for pad ' + pad)
    const centre = [0, 1].map(axis => (Math.min(...lead.map(p => p[axis])) + Math.max(...lead.map(p => p[axis]))) / 2)
    return Number(Math.hypot(centre[0] - x, centre[1] - z).toFixed(5))
  })
}

function verifySurfaceContacts(meshes, pads) {
  const matched = new Set()
  for (const { attributes, index, brep_faces, color } of meshes) {
    const xyz = attributes.position.array
    const faces = brep_faces?.length ? brep_faces : [{ first: 0, last: index.array.length / 3 - 1, color }]
    for (const face of faces) {
      // R3 package sources color the contact metal separately from the mold.
      if (r3 && (face.color ?? color)?.every(channel => channel < 0.19)) continue
      for (let triangle = face.first; triangle <= face.last; triangle++) {
        const vertices = [0, 1, 2].map(j => index.array[triangle * 3 + j] * 3)
        if (!vertices.every(at => Math.abs(xyz[at + 2]) <= 0.06)) continue
        const x = vertices.map(at => xyz[at]), z = vertices.map(at => -xyz[at + 1])
        const left = Math.min(...x), right = Math.max(...x), top = Math.min(...z), bottom = Math.max(...z)
        const overlap = pads.filter(({ x, z, width, height }) =>
          Math.min(right, x + width/2) - Math.max(left, x - width/2) > 0.01 &&
          Math.min(bottom, z + height/2) - Math.max(top, z - height/2) > 0.01)
        if (r3 && new Set(overlap.map(pad => pad.pad)).size > 1) {
          throw new Error('A metal contact overlaps different copper pads: ' + overlap.map(pad => pad.pad).join(', '))
        }
        overlap.forEach(pad => matched.add(pad))
      }
    }
  }
  const missed = pads.find(pad => !matched.has(pad))
  if (missed) throw new Error('STEP contact misses SMD pad ' + missed.pad)
}

for (const [key, pkg] of Object.entries(packageDefinitions)) {
  const [libraryName, stem] = pkg.asset.split('/')
  const step = libraryName + '.3dshapes/' + (pkg.stepFile ?? stem + '.step')
  const footprint = libraryName + '.pretty/' + stem + '.kicad_mod'
  const [stepBytes, footprintBytes] = await Promise.all([
    readFile(join(library, '3dmodels', step)), readFile(join(library, 'footprints', footprint)),
  ])
  if (sha(stepBytes) !== pkg.stepSha || sha(footprintBytes) !== pkg.footprintSha) throw new Error('Source digest mismatch: ' + pkg.asset)
  if (revision !== 'R1') footprints.set(stem + '.kicad_mod', footprintBytes)
  const source = footprintBytes.toString('utf8')
  const padPattern = /\(pad "(\d+)" (?:thru_hole|smd) (\w+)\s*\(at ([-\d.]+) ([-\d.]+)(?: [-\d.]+)?\)\s*\(size ([\d.]+) ([\d.]+)\)(?:\s*\(drill ([\d.]+)\))?/g
  const pads = [...source.matchAll(padPattern)].map(([, pad, shape, x, z, width, height, drill]) =>
    ({ pad: Number(pad), shape, x: Number(x), z: Number(z), width: Number(width), height: Number(height), drill: Number(drill ?? 0) }))
  if ((r2b || r3) && !/\(offset\s*\(xyz 0 0 0\)\s*\)\s*\(scale\s*\(xyz 1 1 1\)\s*\)\s*\(rotate\s*\(xyz 0 0 0\)\s*\)/.test(source)) {
    throw new Error('Unexpected KiCad STEP transform: ' + pkg.asset)
  }
  const partPins = partDefinitions.filter(part => part.packageKey === key).map(part => part.pins.map(pin => pin.pad))
  const padNumbers = new Set(pads.map(pad => pad.pad))
  if (!pads.length || (!r3 && padNumbers.size !== pads.length) ||
      partPins.some(numbers => numbers.length !== padNumbers.size || numbers.some(pad => !padNumbers.has(pad)))) {
    throw new Error('Pad mismatch: ' + pkg.asset)
  }
  // R2A DIP14 and DIP16 use the same locked KiCad package assets as R1.
  const existing = shared[key]
  if (existing) {
    if (existing.sourceSha256 !== pkg.stepSha || existing.footprintSha256 !== pkg.footprintSha ||
        JSON.stringify(existing.pads) !== JSON.stringify(pads) || existing.maxOffsetMm > 0.05 ||
        sha(await readFile('public' + existing.file)) !== existing.sha256) throw new Error('Shared asset mismatch: ' + key)
    console.log(key, pads.length + ' pads', 'reused verified KiCad mesh')
    continue
  }
  const result = occt.ReadStepFile(new Uint8Array(stepBytes), {
    linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.001, angularDeflection: 0.35,
  })
  if (!result.success || !result.meshes.length) throw new Error('Invalid STEP: ' + step)
  // This KiCad STEP ends at the molded underside (z = 0.10 mm). The locked
  // footprint has four rectangles for one DDA pad. Add the exposed plate.
  if (key === 'powerPad8R3') {
    result.meshes.push({
      name: 'DDA exposed pad',
      attributes: {
        position: { array: [-1.205, -1.55, 0, -1.205, 1.55, 0, 1.205, 1.55, 0, 1.205, -1.55, 0] },
        normal: { array: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1] },
      },
      index: { array: [0, 1, 2, 0, 2, 3] },
      color: [0.68, 0.67, 0.63],
    })
  }
  const surfaceMount = pads.every(pad => pad.drill === 0)
  if (surfaceMount) {
    try { verifySurfaceContacts(result.meshes, pads) }
    catch (error) { throw new Error(key + ': ' + error.message, { cause: error }) }
  }
  else if (pads.some(pad => pad.drill === 0)) throw new Error('Mixed footprint technology: ' + pkg.asset)
  const offsets = surfaceMount ? [] : measureLeadOffsets(result.meshes, pads)
  const maxOffsetMm = surfaceMount ? null : Math.max(...offsets)
  if (maxOffsetMm !== null && maxOffsetMm > (r3 ? 0.15 : 0.05)) throw new Error(key + ': STEP lead offset ' + maxOffsetMm + ' mm')
  const nodes = result.meshes.map((mesh, index) => ({
    name: key + '-' + index, primitives: primitivesFromStepMesh(mesh, (x, y, z) => [x, z, -y]),
  }))
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  for (const node of nodes) for (const primitive of node.primitives) {
    triangles += primitive.indices.length / 3
    primitive.positions.forEach((p, index) => {
      const axis = index % 3
      min[axis] = Math.min(min[axis], p * 1000)
      max[axis] = Math.max(max[axis], p * 1000)
    })
  }
  const glb = writeGlb(nodes, { rootName: key, generator: 'Mạch Mở catalog ' + revision, extras: { outputUnits: 'm' } })
  const file = key + '.glb'
  glbs.set(file, glb)
  packages[key] = {
    file: '/' + output.slice('public/'.length) + '/' + file, bytes: glb.length, sha256: sha(glb),
    sizeMm: max.map((p, i) => Number((p - min[i]).toFixed(3))),
    boundsMm: { min: min.map(p => Number(p.toFixed(3))), max: max.map(p => Number(p.toFixed(3))) },
    triangles, kind: 'source-cad-mesh', sourceFile: step, sourceSha256: pkg.stepSha, footprint,
    footprintSha256: pkg.footprintSha, mount: pkg.mount, pads, maxOffsetMm,
  }
}
await mkdir(output, { recursive: true })
for (const [file, bytes] of glbs) await writeFile(join(output, file), bytes)
for (const [file, bytes] of footprints) await writeFile(join(output, file), bytes)
if (r3) await writeFile(join(output, 'NOTICE.txt'), 'Mạch Mở R3 · KiCad 10.0.7 footprints and STEP meshes\nSource: https://gitlab.com/kicad/libraries\nLicense: CC BY-SA 4.0 with KiCad library exception (https://www.kicad.org/libraries/license/)\nFootprints are copied, STEP geometry is tessellated to GLB. DDA includes an added exposed plate matching the locked footprint. See the R3 proposal for source hashes.\n')
await writeFile('src/data/catalog-' + revision.toLowerCase() + '-packages.json', JSON.stringify(packages, null, 2) + '\n')
for (const [key, item] of Object.entries(packages)) {
  console.log(key, item.pads.length + ' pads', item.maxOffsetMm === null ? 'SMD contacts checked' : 'lead offset ' + item.maxOffsetMm + ' mm', item.sizeMm, item.bytes + ' bytes')
}
