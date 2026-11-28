import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { primitiveParts } from './make-primitive-part-glb.mjs'
import { writeGlb } from './glb-writer.mjs'
import { approval, loadRemainingCatalog, sha256 } from './remaining-catalog-inputs.mjs'

const library = process.argv[2]
if (!library) throw new Error('Pass the KiCad 10.0.7 share/kicad directory')
const config = await loadRemainingCatalog(library)
const directory = '/models/components/catalog-kit-1/'
const silver = [0.7, 0.72, 0.75], dark = [0.065, 0.075, 0.09], pcb = [0.055, 0.36, 0.21], gold = [0.73, 0.53, 0.21]
const round = value => +value.toFixed(4)
const box = (name, center, size, color) => ({ name, center, size, color, type: 'box' })
const cylinder = (name, center, radius, height, color, extra = {}) => ({ name, center, radius, height, color, type: 'cyl', ...extra })

function sensor(part, pads) {
  const { geometry: g } = part
  const hasTab = Boolean(g.tabThicknessMm)
  const width = g.bodyWidthMm, bodyHeight = g.bodyHeightWithoutTabMm ?? g.bodyHeightMm, depth = g.bodyDepthMm
  const centerX = 1.5 * g.leadPitchMm
  const centerZ = hasTab ? 0 : depth / 2 - 2.55
  const front = centerZ + depth / 2
  const color = hasTab ? [0.89, 0.9, 0.87] : [0.055, 0.42, 0.69]
  const depthOfFace = 0.7
  const nodes = [
    box('Vỏ sau', [centerX, bodyHeight / 2, centerZ - depthOfFace / 2], [width, bodyHeight, depth - depthOfFace], color),
    box('Lòng vỏ', [centerX, bodyHeight * 0.51, front - depthOfFace - 0.02], [width * 0.78, bodyHeight * 0.65, 0.08], dark),
  ]
  const horizontal = 0.85, bottom = hasTab ? 3 : 2.25
  const rows = hasTab ? 6 : 5, columns = hasTab ? 5 : 4
  const openingH = (bodyHeight - bottom * 2 - horizontal * (rows - 1)) / rows
  const openingW = (width - columns - 1) / columns
  nodes.push(
    box('Viền và khe gió', [centerX, bottom / 2, front - depthOfFace / 2], [width, bottom, depthOfFace], color),
    box('Viền và khe gió', [centerX, bodyHeight - bottom / 2, front - depthOfFace / 2], [width, bottom, depthOfFace], color),
  )
  for (let row = 1; row < rows; row++) {
    nodes.push(box('Viền và khe gió', [centerX, bottom + row * openingH + (row - 0.5) * horizontal, front - depthOfFace / 2],
      [width, horizontal, depthOfFace], color))
  }
  for (let column = 0; column <= columns; column++) {
    nodes.push(box('Viền và khe gió', [centerX - width / 2 + 0.5 + column * (openingW + 1), bodyHeight / 2, front - depthOfFace / 2],
      [1, bodyHeight - 2 * bottom, depthOfFace], color))
  }
  if (hasTab) {
    const rise = g.bodyHeightWithTabMm - bodyHeight
    nodes.push(box('Tai bắt vít', [centerX, bodyHeight + rise * 0.18, centerZ - depth / 2 + g.tabThicknessMm / 2],
      [width * 0.66, rise * 0.36, g.tabThicknessMm], color))
    nodes.push(cylinder('Tai bắt vít', [centerX, bodyHeight + rise / 2, centerZ - depth / 2 + g.tabThicknessMm / 2],
      rise / 2, g.tabThicknessMm, color, { axis: 'z', innerRadius: 1.3 }))
  }
  for (const pad of pads) nodes.push(box('Chân ' + pad.pad, [pad.x, -g.leadLengthMm / 2, pad.z], [0.5, g.leadLengthMm, 0.3], silver))
  return { nodes, outline: [centerX - width / 2, centerZ - depth / 2, centerX + width / 2, front] }
}

const keyGlyphs = {
  '1': ['010','110','010','010','111'], '2': ['110','001','010','100','111'], '3': ['110','001','110','001','110'],
  '4': ['101','101','111','001','001'], '5': ['111','100','110','001','110'], '6': ['011','100','110','101','010'],
  '7': ['111','001','010','010','010'], '8': ['010','101','010','101','010'], '9': ['010','101','011','001','110'],
  '0': ['010','101','101','101','010'], A: ['010','101','111','101','101'], B: ['110','101','110','101','110'],
  C: ['011','100','100','100','011'], D: ['110','101','101','101','110'],
  '*': ['000','101','010','101','000'], '#': ['101','111','101','111','101'],
}
function keypad(part, pads) {
  const [width, depth, height] = part.geometry.envelopeMm
  const center = 3.5 * part.footprint.pitchMm, frontDepth = depth - 6.6, top = 2
  const nodes = [
    box('PCB keypad', [center, 0.8, -depth / 2 + 2.2], [width, 1.6, depth], pcb),
    box('Khung phím', [center, (top + height - 1.4) / 2, -frontDepth / 2 - 4.4], [width, height - 1.4 - top, frontDepth], dark),
  ]
  const keys = '123A456B789C*0#D'
  for (const [index, key] of [...keys].entries()) {
    const x = center + (index % 4 - 1.5) * 14.65, z = -frontDepth / 2 - 4.4 + (Math.floor(index / 4) - 1.5) * 13.3
    nodes.push(box('Phím ' + key, [x, height - 1.09, z], [12, 2.1, 10.9], [0.12, 0.14, 0.16]))
    keyGlyphs[key].forEach((row, r) => [...row].forEach((pixel, c) => {
      if (pixel === '1') nodes.push(box('Phím ' + key, [x + (c - 1) * 0.87, height - 0.015, z + (r - 2) * 0.87],
        [0.86, 0.03, 0.86], [0.93, 0.94, 0.91]))
    }))
  }
  for (const pad of pads) {
    nodes.push(cylinder('Chân ' + pad.pad, [pad.x, 1.62, pad.z], 0.88, 0.04, gold))
    nodes.push(box('Chân ' + pad.pad, [pad.x, -0.85, pad.z], [0.64, 3.45, 0.64], silver))
  }
  for (const x of [-part.footprint.pitchMm, 8 * part.footprint.pitchMm]) {
    nodes.push(cylinder('Vị trí NC không gắn chân', [x, 1.62, 0], 0.9, 0.04, gold, { innerRadius: 0.48 }))
  }
  return { nodes, outline: [-1.27, -1.27, 7 * part.footprint.pitchMm + 1.27, 1.27] }
}

function display(part, pads) {
  const g = part.geometry, halfW = g.faceWidthMm / 2, halfH = g.faceHeightMm / 2
  const lensY = g.bodyDepthMm - 0.035, scale = g.digitHeightMm / 14.22
  const caseDepth = g.bodyDepthMm - 0.07
  const nodes = [box('Vỏ LED 7 đoạn', [0, caseDepth / 2, 0], [g.faceWidthMm, caseDepth, g.faceHeightMm], [0.28, 0.3, 0.31])]
  for (const [label, x, z, w, h] of [
    ['A', 0.2, -6.45, 6.5, 1.25], ['G', 0, 0, 6.5, 1.25], ['D', -0.2, 6.45, 6.5, 1.25],
    ['F', -3.45, -3.22, 1.22, 5.9], ['B', 3.45, -3.22, 1.22, 5.9],
    ['E', -3.65, 3.22, 1.22, 5.9], ['C', 3.25, 3.22, 1.22, 5.9],
  ]) nodes.push(box('Đoạn ' + label, [x * scale, lensY, z * scale], [w * scale, 0.07, h * scale], [0.94, 0.93, 0.9]))
  nodes.push(cylinder('Dấu thập phân', [5, lensY, 6.0], 0.75, 0.07, [0.94, 0.93, 0.9]))
  for (const pad of pads) nodes.push(cylinder('Chân ' + pad.pad, [pad.x, -g.leadLengthMm / 2, pad.z], 0.25, g.leadLengthMm, silver))
  return { nodes, outline: [-halfW, -halfH, halfW, halfH] }
}

function footprintFile(part, pads, outline) {
  const rect = (coords, layer, width) => `  (fp_rect (start ${coords[0]} ${coords[1]}) (end ${coords[2]} ${coords[3]}) (stroke (width ${width}) (type solid)) (fill none) (layer "${layer}"))`
  const courtyard = outline.map((value, index) => round(value + (index < 2 ? -0.5 : 0.5)))
  return [
    `(footprint "${part.footprint.name}"`, '  (version 20241229)', '  (generator "machmo")', '  (layer "F.Cu")',
    '  (attr through_hole)', rect(outline, 'F.Fab', 0.1), rect(courtyard, 'F.CrtYd', 0.05),
    ...pads.map(p => `  (pad "${p.pad}" thru_hole ${p.shape} (at ${p.x} ${p.z}) (size ${p.width} ${p.height}) (drill ${p.drill}) (layers "*.Cu" "*.Mask"))`),
    ')', '',
  ].join('\n')
}

async function socketPads() {
  const source = config.sourceLocks['kicad-socket-1x8']
  const footprint = await readFile(join(library, source.path), 'utf8')
  const groups = [...footprint.matchAll(/\(pad "(\d+)" thru_hole (\w+)\s*\(at ([-\d.]+) ([-\d.]+)(?: [-\d.]+)?\)\s*\(size ([\d.]+) ([\d.]+)\)\s*\(drill ([\d.]+)\)/g)]
  if (groups.length !== 8) throw new Error('Wrong approved socket pad count')
  // Rotate the native socket row into the keypad front-view orientation.
  return groups.map(([, pad, shape, x, y, width, height, drill]) =>
    ({ pad: +pad, shape, x: +y, z: -Number(x), width: +height, height: +width, drill: +drill }))
}

await mkdir('public' + directory, { recursive: true })
const manifests = {}
for (const part of config.components) {
  const f = part.footprint
  const isKeypad = part.catalogId === 'keypad-4x4'
  const pads = isKeypad ? await socketPads() : part.pins.map(({ pad }) => ({
    pad, shape: pad === 1 ? 'rect' : 'circle',
    x: round(f.rowSpacingMm ? (pad <= 5 ? pad - 3 : 8 - pad) * f.pitchMm : (pad - 1) * f.pitchMm),
    z: f.rowSpacingMm ? pad <= 5 ? f.bottomRowYmm : f.topRowYmm : 0,
    width: f.padDiameterMm ?? f.padSizeMm[0], height: f.padDiameterMm ?? f.padSizeMm[1], drill: f.drillMm,
  }))
  const { nodes, outline } = isKeypad ? keypad(part, pads) : f.rowSpacingMm ? display(part, pads) : sensor(part, pads)
  const output = primitiveParts(nodes)
  const source = config.sourceLocks[part.sourceIds[0]]
  const model = writeGlb(output, { rootName: part.mpn, generator: 'Mạch Mở datasheet reference model',
    extras: { approval, sourceSha256: source.sha256, sourceUnits: 'mm', outputUnits: 'm' } })
  const file = directory + part.catalogId + '.glb'
  const footprint = f.name + '.kicad_mod'
  const footprintBytes = footprintFile(part, pads, outline)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  for (const { primitives } of output) for (const { positions, indices } of primitives) {
    triangles += indices.length / 3
    positions.forEach((value, n) => {
      const axis = n % 3
      min[axis] = Math.min(min[axis], value * 1000)
      max[axis] = Math.max(max[axis], value * 1000)
    })
  }
  for (const { pad, x, z } of pads) {
    if (!nodes.some(node => node.name === 'Chân ' + pad && node.center[0] === x && node.center[2] === z)) {
      throw new Error('The CAD lead and footprint diverge: ' + part.catalogId + '.' + pad)
    }
  }
  await writeFile('public' + file, model)
  await writeFile('public' + directory + footprint, footprintBytes)
  manifests[part.catalogId] = {
    file, bytes: model.length, sha256: sha256(model), boundsMm: { min: min.map(round), max: max.map(round) },
    sizeMm: max.map((value, i) => round(value - min[i])), triangles, sourceFile: source.path, sourceSha256: source.sha256,
    footprint, footprintSha256: sha256(footprintBytes), pads, maxOffsetMm: 0, mount: 'bench', footprintBoxMm: outline,
  }
  console.log(part.mpn, `${pads.length} pads`, manifests[part.catalogId].sizeMm.join(' × '))
}
await writeFile('src/data/remaining-catalog-parts-assets.json', JSON.stringify(manifests, null, 2) + '\n')
await writeFile('public' + directory + 'NOTICE.txt', [
  'Reference geometry for Mạch Mở. ASAIR and Kingbright dimensional drawings and the Adafruit PID 3844 product guide are linked in the proposal.',
  'The socket land pattern follows the KiCad 10.0.7 library, rotated to match the keypad pin view. KiCad Libraries Contributors, CC BY-SA 4.0 with library exception (https://www.kicad.org/libraries/license/).',
  'Assembly, pin pitch on physical samples and manufacturing fit have not been verified.',
  'Approved configuration: ' + approval, '',
].join('\n'))
