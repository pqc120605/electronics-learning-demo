import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'
import { parseBoardFootprints, sexprBlockEnd, transformPadToBoard } from './kicadPadCoordinates.mjs'

const approval = '52c865818685bdc6c88ee79c6fed2f5cae3a982ba50d861f011a6ab1cb0e8e1a'
const proposalPath = 'docs/research/2026-11-26-catalog-model-arduino-r1-proposal.json'
const sourceFolder = process.argv[2]
const kicadCli = process.argv[3] ?? 'kicad-cli'
if (!sourceFolder) throw new Error('Pass the directory holding the verified STEP, Altium PCB and license for each SKU')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
async function verified(path, hash) {
  const bytes = await readFile(path)
  if (sha256(bytes) !== hash) throw new Error('Source SHA-256 mismatch: ' + path)
  return bytes
}
const { variants } = JSON.parse(await verified(proposalPath, approval))
const occt = await occtFactory()
const directory = '/models/arduino-catalog-1/'
const assets = []
await mkdir('public' + directory, { recursive: true })

// Pad numbers below follow the imported source footprints. Pin names follow
// the top-view Arduino documents for the exact ABX SKU.
const powerAnalog = [
  'Dành riêng', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4/SDA', 'A5/SCL',
]
const unoDigital = Array.from({ length: 14 }, (_, n) => n === 0 ? 'D0/RX' : n === 1 ? 'D1/TX' : 'D' + n)
const profiles = {
  ABX00080: {
    headers: [['JDIGITAL', [...unoDigital, 'GND', 'AREF', 'D14/SDA', 'D15/SCL']], ['JANALOG', powerAnalog]],
    features: { U1: 'Vi điều khiển Renesas RA4M1', J3: 'Cổng USB-C', J4: 'Cổng nguồn DC', PB1: 'Nút RESET', JDIGITAL: 'Header số', JANALOG: 'Header nguồn và analog' },
    logic: 'Tín hiệu GPIO trên header UNO R4 dùng mức 5 V. Tra giới hạn dòng trong tài liệu Arduino.',
  },
  ABX00087: {
    headers: [['JDIGITAL', [...unoDigital, 'GND', 'AREF', 'D18/SDA', 'D19/SCL']], ['JANALOG', powerAnalog]],
    features: { U1: 'Vi điều khiển Renesas RA4M1', M1: 'Module ESP32-S3-MINI-1-N8', J1: 'Cổng USB-C', J5: 'Cổng nguồn DC', J2: 'Cổng Qwiic', PB1: 'Nút RESET', JDIGITAL: 'Header số', JANALOG: 'Header nguồn và analog' },
    logic: 'Header UNO dùng mức 5 V. Qwiic và header ESP32-S3 dùng tín hiệu 3,3 V.',
  },
  ABX00083: {
    headers: [
      ['JP1', ['D13', '3V3', 'B0', 'A0', 'A1', 'A2', 'A3', 'A4/SDA', 'A5/SCL', 'A6', 'A7', 'VUSB', 'B1', 'GND', 'VIN']],
      ['JP2', ['D1/TX0', 'D0/RX0', 'RESET', 'GND', ...Array.from({ length: 11 }, (_, n) => 'D' + (n + 2))]],
    ],
    features: { M1: 'Module NORA-W106 (ESP32-S3)', J1: 'Cổng USB-C', PB1: 'Nút RESET', JP1: 'Header analog và nguồn', JP2: 'Header số' },
    logic: 'GPIO Nano ESP32 dùng mức 3,3 V. Tra chức năng B0, B1 và RESET trước khi đấu.',
    // The manufacturer assembly shifts one half of each pin strip by 0.127 mm.
    padToleranceMm: 0.15,
  },
}
const collect = node => [...node.meshes, ...node.children.flatMap(collect)]
const rounded = value => +value.toFixed(4)

function bounds(meshes) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const mesh of meshes) mesh.attributes.position.array.forEach((n, index) => {
    const axis = index % 3
    min[axis] = Math.min(min[axis], n)
    max[axis] = Math.max(max[axis], n)
  })
  if (!min.every(Number.isFinite)) throw new Error('Geometry bounds are empty')
  return { min, max }
}

function outlineBounds(pcb) {
  const points = [...pcb.matchAll(/\(gr_(?:line|arc)\s/g)].flatMap(({ index }) => {
    const block = pcb.slice(index, sexprBlockEnd(pcb, index))
    if (!block.includes('(layer "Edge.Cuts")')) return []
    return [...block.matchAll(/\((?:start|mid|end) (-?[\d.]+) (-?[\d.]+)\)/g)].map(([, x, y]) => [+x, +y])
  })
  if (points.length < 4) throw new Error('No source outline')
  return {
    min: [0, 1].map(axis => Math.min(...points.map(p => p[axis]))),
    max: [0, 1].map(axis => Math.max(...points.map(p => p[axis]))),
  }
}

function pinCrossings(meshes) {
  const plane = -2
  const points = []
  for (const mesh of meshes) {
    const coords = mesh.attributes.position.array, indices = mesh.index.array
    for (let index = 0; index < indices.length; index += 3) {
      for (let edge = 0; edge < 3; edge++) {
        const a = indices[index + edge] * 3, b = indices[index + (edge + 1) % 3] * 3
        const z1 = coords[a + 2], z2 = coords[b + 2]
        if ((z1 < plane) === (z2 < plane)) continue
        const t = (plane - z1) / (z2 - z1)
        points.push([coords[a] + t * (coords[b] - coords[a]), coords[a + 1] + t * (coords[b + 1] - coords[a + 1])])
      }
    }
  }
  return points
}

for (const variant of variants) {
  const { boardId, sku, mechanicalSource, pcbLocationEvidence, hardwareLicense } = variant
  const profile = profiles[sku]
  const step = await verified(join(sourceFolder, sku + '.step'), mechanicalSource.sha256)
  const altiumPath = join(sourceFolder, sku + '.PcbDoc')
  const kicadPath = join(sourceFolder, sku + '.kicad_pcb')
  await verified(altiumPath, pcbLocationEvidence.sha256)
  const license = await verified(join(sourceFolder, sku + '.LICENSE.txt'), hardwareLicense.sha256)
  execFileSync(kicadCli, ['pcb', 'import', '--format', 'altium', '--output', kicadPath, altiumPath], { stdio: 'pipe' })
  const pcb = await readFile(kicadPath, 'utf8')
  const footprints = parseBoardFootprints(pcb)
  const result = occt.ReadStepFile(step, {
    linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.001, angularDeflection: 0.32,
  })
  if (!result.success || result.root.children.length !== 1) throw new Error('STEP hierarchy mismatch ' + sku)
  const children = result.root.children[0].children
  const indices = ref => {
    const found = children.filter(node => node.name === ref)
    if (found.length !== 1) throw new Error(`${sku} lacks a unique STEP node ${ref}`)
    return collect(found[0])
  }
  const boardBody = bounds(indices('Board').map(i => result.meshes[i]))
  const outline = outlineBounds(pcb)
  const size = [0, 1].map(axis => boardBody.max[axis] - boardBody.min[axis])
  if (size.some((n, axis) => Math.abs(n - (outline.max[axis] - outline.min[axis])) > 0.01)) {
    throw new Error('STEP and PCB outline dimensions disagree ' + sku)
  }
  const center = [0, 1].map(axis => (boardBody.min[axis] + boardBody.max[axis]) / 2)
  const asStep = ([x, y]) => [x - outline.min[0] + boardBody.min[0], outline.max[1] - y + boardBody.min[1]]
  const groups = [
    ['PCB', indices('Board')],
    ...Object.keys(profile.features).map(ref => {
      if (!footprints.some(footprint => footprint.reference === ref)) throw new Error(`Unknown PCB designator ${sku} ${ref}`)
      return [ref, indices(ref)]
    }),
  ]
  const allocated = new Set(groups.flatMap(([, meshIndices]) => meshIndices))
  groups.push(['CAD_GEOMETRY_UNIDENTIFIED', result.meshes.flatMap((_, i) => allocated.has(i) ? [] : [i])])
  const nodes = groups.filter(([, meshIndices]) => meshIndices.length).map(([name, meshIndices]) => ({
    name, primitives: meshIndices.flatMap(i =>
      primitivesFromStepMesh(result.meshes[i], (x, y, z) => [x, z, -y], undefined, [center[0] / 1000, center[1] / 1000, 0])),
  }))

  let maxPadOffsetMm = 0
  const pins = profile.headers.flatMap(([reference, labels], group) => {
    const footprint = footprints.find(candidate => candidate.reference === reference)
    const meshes = indices(reference).map(index => result.meshes[index])
    const contacts = pinCrossings(meshes)
    const socketTop = bounds(meshes).max[2]
    return labels.map((label, index) => {
      const number = String(index + 1)
      const candidates = footprint.pads.filter(pad => pad.number === number)
      const positions = candidates.map(pad => {
        const [x, y] = asStep(transformPadToBoard(footprint, pad))
        const nearby = contacts.filter(([px, py]) => Math.hypot(px - x, py - y) < 0.7)
        if (!nearby.length) return null
        const middle = axis => (Math.min(...nearby.map(p => p[axis])) + Math.max(...nearby.map(p => p[axis]))) / 2
        const stepX = middle(0), stepY = middle(1)
        return { pad, stepX, stepY, offset: Math.hypot(stepX - x, stepY - y) }
      }).filter(Boolean)
      if (positions.length !== 1 || positions[0].offset > (profile.padToleranceMm ?? 0.1)) {
        throw new Error(`STEP pin contact mismatch ${sku} ${reference}.${number}`)
      }
      const { pad, stepX, stepY, offset } = positions[0]
      maxPadOffsetMm = Math.max(maxPadOffsetMm, offset)
      return {
        id: `${reference.toLowerCase()}-${number}`, side: group === 0 ? 'left' : 'right', position: index + 1,
        label, headerReference: reference, padNumber: number, netName: pad.net ?? undefined,
        anchorMm: [rounded(stepX - center[0]), rounded(socketTop), rounded(center[1] - stepY)],
        plainDescription: `Chân ${label} trên ${reference}, theo pinout Arduino ${sku}.`,
        technicalRole: label.startsWith('GND') ? 'Mass tham chiếu' : label === 'Dành riêng' ? 'Chân dành riêng' : 'Chân trên header Arduino',
        connection: `${reference} · pad ${number}${pad.net ? ' · net ' + pad.net : ''}`,
        safetyNote: label === 'Dành riêng' ? 'Chừa chân này khi nối mạch mẫu.' : profile.logic,
        functions: [label],
      }
    })
  })
  const model = writeGlb(nodes, {
    rootName: sku, generator: 'Mạch Mở Arduino STEP conversion',
    extras: { approval, sourceSha256: mechanicalSource.sha256, pcbSha256: pcbLocationEvidence.sha256,
      sourceUnits: 'mm', outputUnits: 'm', note: 'Proper rotation from Z-up to Y-up with centered PCB; source STEP hierarchy and materials preserved.' },
  })
  const modelHash = sha256(model)
  const version = modelHash.slice(0, 12)
  const file = directory + boardId + '.glb'
  await writeFile('public' + file, model)
  const notice = directory + sku + '.NOTICE.txt'
  await writeFile('public' + notice, [
    'Arduino · ' + sku + ' · ' + variant.documentation,
    'STEP converted to GLB for local study. Source archive: ' + mechanicalSource.url,
    'Exact STEP SHA-256: ' + mechanicalSource.sha256,
    'Pad coordinates checked against the PCB in ' + pcbLocationEvidence.url,
    'Hardware CAD license (from the original ZIP): ' + license.toString().trim(),
    variant.distribution, 'Approved configuration: ' + approval, '',
  ].join('\n'))
  assets.push({
    id: boardId, sku, assetUrl: file + '?v=' + version, assetVersion: version,
    sha256: modelHash, sourceSha256: mechanicalSource.sha256, pcbSha256: pcbLocationEvidence.sha256,
    sourceUrl: variant.documentation, stepSourceUrl: mechanicalSource.url, pcbSourceUrl: pcbLocationEvidence.url,
    pinoutUrl: 'https://docs.arduino.cc/resources/pinouts/' + sku + '-full-pinout.pdf',
    features: profile.features, pins, notice, maxPadOffsetMm: rounded(maxPadOffsetMm),
    pcbSizeMm: size.map(rounded), pcbThicknessMm: rounded(boardBody.max[2] - boardBody.min[2]), meshCount: result.meshes.length,
  })
  console.log(sku, result.meshes.length + ' source meshes', pins.length + ' verified header pads', 'max offset ' + rounded(maxPadOffsetMm) + ' mm')
}
await writeFile('src/data/approved-arduino-assets.json', JSON.stringify(assets, null, 2) + '\n')
