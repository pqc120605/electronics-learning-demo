import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const sha = data => createHash('sha256').update(data).digest('hex')
const approval = '73833c9605921928a9a37fdedc3721eca4a333b9779f7ccfd561137ab0613dce'
const proposal = await readFile('docs/research/2026-11-26-catalog-fidelity-r5-proposal.md')
if (sha(proposal) !== approval) throw new Error('R5 approval hash mismatch')
const library = process.argv[2]
if (!library) throw new Error('Pass the path to KiCad 10.0.7 share/kicad')

const output = 'public/models/components/catalog-r5'
const bases = [...proposal.toString().matchAll(/^\| ((?:`[a-z0-9]+`(?:, )?)+) \| `(Package_[^/]+)\/([^`]+)` \| `([A-F0-9]{64})` \| (?:`([A-F0-9]{64})`|Dựng)/gm)]
if (bases.length !== 8) throw new Error('Missing KiCad bases')

// Coordinates are top-view KiCad X/Y, reused on the GLB X/Z plane.
// PCB land, mask and 0.125 mm stencil dimensions come from the locked drawings.
const smd = {
  max98357a: { drawing: '21-0136 V / 90-0031 C', body: [3, 3, 0.75], lands: [2.85, 0.8, 0.30], ep: [1.23, 1.23],
    metal: [0.40, 0.25], exposed: [1.10, 1.10], qfn: true },
  tpa2012d2: { drawing: 'RTJ0020D 4219125/A', body: [4, 4, 0.8], lands: [3.8, 0.6, 0.24], ep: [2.7, 2.7],
    metal: [0.40, 0.24], exposed: [2.7, 2.7], qfn: true, windows: 1.19, spacing: 0.69, radius: 0.05 },
  drv8833: { drawing: 'PWP0016C 4224559/B', body: [4.4, 5, 1.2], lands: [5.8, 1.5, 0.45], ep: [3.4, 5],
    mask: [2.46, 2.31], metal: [0.625, 0.245], exposed: [2.105, 2.03], span: 6.4, thickness: 0.15, radius: 0.05 },
  drv8825: { drawing: 'PWP0028V 4230409/A', body: [4.4, 9.7, 1.2], lands: [5.8, 1.5, 0.45], ep: [3.4, 9.7],
    mask: [2.94, 5.62], metal: [0.625, 0.235], exposed: [2.59, 5.27], span: 6.4, thickness: 0.15, radius: 0.05 },
  drv8871: { drawing: 'DDA0008B 4214849/B', body: [3.9, 4.9, 1.7], lands: [5.4, 1.55, 0.6], ep: [2.95, 4.9],
    mask: [2.71, 3.4], metal: [0.835, 0.41], exposed: [2.41, 3.10], span: 6.0, thickness: 0.25, radius: 0.05 },
}

const parsePads = source => [...source.matchAll(/\(pad "(\d+)" (?:thru_hole|smd) (\w+)\s*\(at ([-\d.]+) ([-\d.]+)(?: [-\d.]+)?\)\s*\(size ([\d.]+) ([\d.]+)\)(?:\s*\(drill ([\d.]+)\))?/g)]
  .map(([, pad, shape, x, z, width, height, drill]) => ({ pad: +pad, shape, x: +x, z: +z, width: +width, height: +height, drill: Number(drill ?? 0) }))
  .sort((a, b) => a.pad - b.pad)

function copper(pad, x, z, width, height, layers, radius = 0) {
  const shape = radius ? 'roundrect' : 'rect'
  const ratio = radius ? ' (roundrect_rratio ' + radius / Math.min(width, height) + ')' : ''
  return '  (pad "' + pad + '" smd ' + shape + ' (at ' + x + ' ' + z + ') (size ' + width +
    ' ' + height + ') (layers ' + layers + ')' + ratio + ')'
}

function deriveFootprint(id, config, source) {
  const [width, depth] = config.body
  const pads = parsePads(source)
  const ep = pads.at(-1).pad
  const [span, length, leadWidth] = config.lands
  const geometry = pads.filter(p => p.pad !== ep).map(p => {
    const vertical = config.qfn && Math.abs(p.z) > Math.abs(p.x)
    return {
      pad: p.pad, x: vertical ? p.x : Math.sign(p.x) * span / 2, z: vertical ? Math.sign(p.z) * span / 2 : p.z,
      width: vertical ? leadWidth : length, height: vertical ? length : leadWidth,
    }
  })
  const fpLine = (x, z) => `  (fp_line (start ${x} ${z}) (end ${x + 0.40} ${z}) (stroke (width 0.10) (type default)) (layer "F.SilkS"))`
  const body = `  (fp_rect (start ${-width / 2} ${-depth / 2}) (end ${width / 2} ${depth / 2}) (stroke (width 0.10) (type default)) (fill none) (layer "F.Fab"))`
  const grounds = []
  if (config.mask) {
    grounds.push(copper(ep, 0, 0, ...config.ep, '"F.Cu"'), copper('', 0, 0, ...config.mask, '"F.Mask"'),
      copper('', 0, 0, ...config.mask, '"F.Paste"'))
  } else {
    grounds.push(copper(ep, 0, 0, ...config.ep, config.windows ? '"F.Cu" "F.Mask"' : '"F.Cu" "F.Mask" "F.Paste"'))
    if (config.windows) {
      for (const x of [-config.spacing, config.spacing]) for (const z of [-config.spacing, config.spacing]) {
        grounds.push(copper('', x, z, config.windows, config.windows, '"F.Paste"', config.radius))
      }
    }
  }
  return [
    '(footprint "' + id.toUpperCase() + '-R5" (version 20241229) (generator "machmo") (layer "F.Cu")',
    '  (descr "' + config.drawing + ' top view")', '  (attr smd)', body, fpLine(-width / 2 - 0.2, -depth / 2 - 0.38),
    ...geometry.map(item => copper(item.pad, item.x, item.z, item.width, item.height, '"F.Cu" "F.Mask" "F.Paste"', config.radius)),
    ...grounds, ')', '',
  ].join('\n')
}

const steel = [0.62, 0.63, 0.61]
const mold = [0.066, 0.073, 0.079]
const indexColor = [0.36, 0.38, 0.40]
function mesh(name, faces, color) {
  const positions = [], normals = [], indices = []
  for (const face of faces) {
    const [a, b, c] = face
    const u = b.map((v, i) => v - a[i]), v = c.map((v, i) => v - a[i])
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const size = Math.hypot(...normal)
    const start = positions.length / 3
    for (const point of face) {
      positions.push(...point.map(value => value / 1000))
      normals.push(...normal.map(value => value / size))
    }
    for (let i = 1; i < face.length - 1; i++) indices.push(start, start + i, start + i + 1)
  }
  return { name, primitives: [{ positions: Float32Array.from(positions), normals: Float32Array.from(normals),
    indices: Uint16Array.from(indices), color }] }
}

const rectAt = (x, y, z, w, d) => [
  [x - w / 2, y, z - d / 2], [x - w / 2, y, z + d / 2],
  [x + w / 2, y, z + d / 2], [x + w / 2, y, z - d / 2],
]
function loft(name, layers, color) {
  const faces = [[...layers[0]].reverse(), layers.at(-1)]
  for (let i = 1; i < layers.length; i++) {
    const low = layers[i - 1], high = layers[i]
    for (let j = 0; j < low.length; j++) {
      const k = (j + 1) % low.length
      faces.push([low[j], low[k], high[k], high[j]])
    }
  }
  return mesh(name, faces, color)
}
const box = (name, x, z, w, d, high, color = steel) =>
  loft(name, [rectAt(x, 0, z, w, d), rectAt(x, high, z, w, d)], color)

function molded(config, pads) {
  const [w, d, h] = config.body
  const bodyBottom = config.qfn ? 0.02 : 0.10
  const chamfer = config.qfn ? 0.06 : 0.13
  const nodes = [loft('Molded case', [rectAt(0, bodyBottom, 0, w - chamfer, d - chamfer),
    rectAt(0, h * 0.45, 0, w, d), rectAt(0, h, 0, w - chamfer, d - chamfer)], mold)]
  const [leadLength, leadWidth] = config.metal
  for (const pad of pads.slice(0, -1)) {
    if (config.qfn) {
      const vertical = Math.abs(pad.z) > Math.abs(pad.x)
      const x = vertical ? pad.x : Math.sign(pad.x) * (w - leadLength) / 2
      const z = vertical ? Math.sign(pad.z) * (d - leadLength) / 2 : pad.z
      nodes.push(box('Contact ' + pad.pad, x, z, vertical ? leadWidth : leadLength, vertical ? leadLength : leadWidth, 0.055))
      continue
    }
    const sign = Math.sign(pad.x)
    const toe = config.span / 2, heel = toe - leadLength
    const thickness = config.thickness
    const profile = [[w / 2 - 0.08, 0.36], [heel - 0.18, 0.36], [heel + 0.09, thickness], [toe, thickness],
      [toe, 0], [heel, 0], [heel - 0.25, 0.24], [w / 2 - 0.08, 0.24]]
    const sorted = sign > 0 ? [...profile].reverse() : profile
    const layer = z => sorted.map(([x, y]) => [sign * x, y, z])
    nodes.push(loft('Contact ' + pad.pad, [layer(pad.z + leadWidth / 2), layer(pad.z - leadWidth / 2)], steel))
  }
  const ep = pads.at(-1)
  nodes.push(box('Contact ' + ep.pad, 0, 0, ...config.exposed, bodyBottom + 0.01))
  const dot = Array.from({ length: 24 }, (_, i) => {
    const angle = -i * Math.PI / 12
    return [-w / 2 + 0.48 + 0.15 * Math.cos(angle), h + 0.001, -d / 2 + 0.48 + 0.15 * Math.sin(angle)]
  })
  nodes.push(mesh('Pin 1', [dot], indexColor))
  return nodes
}

function compact(primitive) {
  const lookup = new Map(), positions = [], normals = []
  const indices = Uint16Array.from(primitive.indices, index => {
    if (lookup.has(index)) return lookup.get(index)
    const next = lookup.size
    if (next > 65535) throw new Error('GLB index overflow')
    lookup.set(index, next)
    positions.push(...primitive.positions.subarray(index * 3, index * 3 + 3))
    normals.push(...primitive.normals.subarray(index * 3, index * 3 + 3))
    return next
  })
  return { ...primitive, indices, positions: Float32Array.from(positions), normals: Float32Array.from(normals) }
}

function measure(nodes, pads, config) {
  const lower = [Infinity, Infinity, Infinity], upper = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  for (const { primitives } of nodes) for (const part of primitives) {
    triangles += part.indices.length / 3
    part.positions.forEach((value, i) => {
      const axis = i % 3
      lower[axis] = Math.min(lower[axis], value * 1000)
      upper[axis] = Math.max(upper[axis], value * 1000)
    })
  }
  const overlaps = []
  for (const pad of pads) {
    const section = []
    const plane = config ? 0.012 : -0.2
    const from = config ? nodes.filter(node => node.name === 'Contact ' + pad.pad) : nodes
    for (const { primitives } of from) for (const { positions, indices } of primitives) {
      for (let i = 0; i < indices.length; i += 3) for (let j = 0; j < 3; j++) {
        const a = indices[i + j] * 3, b = indices[i + (j + 1) % 3] * 3
        const ay = positions[a + 1] * 1000, by = positions[b + 1] * 1000
        if ((ay < plane) === (by < plane)) continue
        const t = (plane - ay) / (by - ay)
        const x = 1000 * (positions[a] + t * (positions[b] - positions[a]))
        const z = 1000 * (positions[a + 2] + t * (positions[b + 2] - positions[a + 2]))
        if (config || Math.hypot(x - pad.x, z - pad.z) < 0.65) section.push([x, z])
      }
    }
    if (section.length === 0) throw new Error('Missing model contact at pad ' + pad.pad)
    const min = [0, 1].map(i => Math.min(...section.map(point => point[i])))
    const max = [0, 1].map(i => Math.max(...section.map(point => point[i])))
    const offset = Math.hypot((max[0] + min[0]) / 2 - pad.x, (max[1] + min[1]) / 2 - pad.z)
    const overlap = (Math.min(max[0], pad.x + pad.width / 2) - Math.max(min[0], pad.x - pad.width / 2)) *
      (Math.min(max[1], pad.z + pad.height / 2) - Math.max(min[1], pad.z - pad.height / 2))
    if (config ? !(overlap > 0) || offset > 0.35 : offset > 0.15) throw new Error('Model contact outside land at pad ' + pad.pad)
    overlaps.push(offset)
  }
  const round = x => Number(x.toFixed(4))
  return { sizeMm: upper.map((x, i) => round(x - lower[i])), boundsMm: { min: lower.map(round), max: upper.map(round) },
    triangles, maxOffsetMm: config ? null : round(Math.max(...overlaps)), maxContactOffsetMm: round(Math.max(...overlaps)) }
}

await mkdir(output, { recursive: true })
const occt = await occtFactory()
const manifest = {}
for (const [, ids, group, stem, fpHash, stepHash] of bases) {
  const sourceFootprint = group + '.pretty/' + stem + '.kicad_mod'
  const footprintBytes = await readFile(join(library, 'footprints', sourceFootprint))
  if (sha(footprintBytes) !== fpHash.toLowerCase()) throw new Error('Footprint hash mismatch ' + stem)
  const sourceFile = stepHash ? group + '.3dshapes/' + stem + '.step' : null
  let stepMesh
  if (sourceFile) {
    const bytes = await readFile(join(library, '3dmodels', sourceFile))
    if (sha(bytes) !== stepHash.toLowerCase()) throw new Error('STEP hash mismatch ' + stem)
    const result = occt.ReadStepFile(bytes, { linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio',
      linearDeflection: 0.001, angularDeflection: 0.32 })
    if (!result.success || !result.meshes.length) throw new Error('Invalid STEP ' + stem)
    stepMesh = result.meshes.map((part, index) => ({ name: 'STEP ' + index,
      primitives: primitivesFromStepMesh(part, (x, y, z) => [x, z, -y]).map(compact) }))
  }
  for (const id of ids.replaceAll('`', '').split(', ')) {
    const config = smd[id]
    const land = config ? deriveFootprint(id, config, footprintBytes.toString()) : footprintBytes.toString()
    const footprint = id + '-r5.kicad_mod'
    const pads = parsePads(land)
    const nodes = config ? molded(config, pads) : stepMesh
    const geometry = measure(nodes, pads, config)
    const key = id + 'R5', file = key + '.glb'
    const glb = writeGlb(nodes, { rootName: key, generator: 'Mạch Mở catalog R5',
      extras: { outputUnits: 'm', approval, drawing: config?.drawing ?? stem } })
    await writeFile(join(output, file), glb)
    await writeFile(join(output, footprint), land)
    manifest[key] = { file: '/models/components/catalog-r5/' + file, sha256: sha(glb), bytes: glb.length,
      ...geometry, sourceFile, sourceSha256: stepHash?.toLowerCase() ?? null, sourceFootprint,
      sourceFootprintSha256: fpHash.toLowerCase(), drawing: config?.drawing ?? stem, footprint, footprintSha256: sha(land),
      mount: config ? 'bench' : 'breadboard', pads }
    console.log(id, pads.length, geometry.sizeMm.join('×'), 'max contact offset', geometry.maxContactOffsetMm)
  }
}
if (Object.keys(manifest).length !== 10) throw new Error('Wrong R5 scope')
await writeFile('src/data/catalog-r5-packages.json', JSON.stringify(manifest, null, 2) + '\n')
await writeFile(join(output, 'NOTICE.txt'), 'Mạch Mở R5 reference geometry.\n' +
  'KiCad 10.0.7 Libraries contributors, CC BY-SA 4.0 with library exception: https://www.kicad.org/libraries/license/\n' +
  'SMD derivatives reference Analog Devices and Texas Instruments drawings listed in the R5 approved proposal.\n')
