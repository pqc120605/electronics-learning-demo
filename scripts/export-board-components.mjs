import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

// Labels follow the numbered pads in the checked Arduino CAD imports.
const sequence = (prefix, start, length, stride = 1) =>
  Array.from({ length }, (_, index) => `${prefix}${start + index * stride}`)
const icsp = ['CIPO', '5V', 'SCK', 'COPI', 'RESET', 'GND']
const shieldPower = ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN']
const analog = length => sequence('A', 0, length)
const primary = (ref, labels) => ({ ref, labels, external: true })
const debug = (ref, labels = icsp) => ({ ref, labels, external: false })
const boards = {
  'esp32-devkit': { manifest: 'esp32-devkit-v1-30pin', asset: 'esp32-devkit-v1-30pin' },
  'arduino-uno-r3': {
    manifest: 'arduino-uno-r3-rev3',
    headers: [
      primary('IOL0', sequence('D', 0, 8)),
      primary('IOH0', [...sequence('D', 8, 6), 'GND', 'AREF', 'SDA', 'SCL']),
      primary('AD0', analog(6)), primary('POWER0', shieldPower), debug('ICSP0'), debug('ICSP1'),
    ],
  },
  'arduino-nano-classic': {
    manifest: 'arduino-nano-classic',
    headers: [
      primary('J1', ['D1', 'D0', 'RESET', 'GND', ...sequence('D', 2, 11)]),
      primary('J2', ['VIN', 'GND', 'RESET', '5V', ...sequence('A', 7, 8, -1), 'AREF', '3V3', 'D13']),
      debug('J4'),
    ],
  },
  'arduino-mega-2560-r3': {
    manifest: 'arduino-mega-2560-r3',
    headers: [
      primary('PWML0', sequence('D', 0, 8)),
      primary('JP6', ['SCL', 'SDA', 'AREF', 'GND', ...sequence('D', 13, 6, -1)]),
      primary('COMMUNICATION0', sequence('D', 21, 8, -1)),
      primary('XIO0', ['5V', '5V', ...sequence('D', 22, 32), 'GND', 'GND']),
      primary('ADCL0', analog(8)), primary('ADCH0', sequence('A', 8, 8)),
      primary('POWER0', shieldPower), debug('ICSP0'), debug('ICSP1'),
    ],
  },
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const readJson = file => JSON.parse(readFileSync(file, 'utf8'))
const midpoint = values => (Math.max(...values) + Math.min(...values)) / 2
const round = value => Number(value.toFixed(6))
const netName = pad => pad.netId && pad.netId !== '0' ? pad.netName : undefined
const license = 'CC BY-SA 4.0'
const maxErrorMm = 0.3
const headerRegistryPath = 'src/data/arduino-header-pins.json'

function padBounds(pads) {
  const bounds = pads.map(pad => {
    const radians = pad.rotation * Math.PI / 180
    const halfWidth = (Math.abs(Math.cos(radians)) * pad.width + Math.abs(Math.sin(radians)) * pad.height) / 2
    const halfHeight = (Math.abs(Math.sin(radians)) * pad.width + Math.abs(Math.cos(radians)) * pad.height) / 2
    return { left: pad.x - halfWidth, right: pad.x + halfWidth, top: pad.y - halfHeight, bottom: pad.y + halfHeight }
  })
  if (!bounds.length) return null
  const left = Math.min(...bounds.map(pad => pad.left))
  const right = Math.max(...bounds.map(pad => pad.right))
  const top = Math.min(...bounds.map(pad => pad.top))
  const bottom = Math.max(...bounds.map(pad => pad.bottom))
  return { x: round((left + right) / 2), y: round((top + bottom) / 2), w: round(right - left), h: round(bottom - top) }
}

function makeLegacyLabels(id) {
  const digitalCount = id === 'arduino-mega-2560-r3' ? 54 : 14
  const analogCount = id === 'arduino-mega-2560-r3' ? 16 : id === 'arduino-nano-classic' ? 8 : 6
  return [...sequence('D', 0, digitalCount), ...analog(analogCount), '5V', '3V3', 'GND', 'VIN', 'RESET']
}

function headerData(cad, nodes, id, definition) {
  const named = new Map(nodes.map(node => [node.nodeName, node]))
  const headerRows = definition.headers.map(header => {
    const component = cad.components.find(row => row.reference === header.ref)
    const pads = component?.pads.filter(pad => /^\d+$/.test(pad.number))
      .sort((a, b) => Number(a.number) - Number(b.number))
    if (pads?.length !== header.labels.length || pads.some((pad, index) => Number(pad.number) !== index + 1)) {
      throw Error(`${id}:${header.ref} — missing or duplicate header pad`)
    }
    const mesh = named.get(header.ref)
    if (!mesh && header.external) throw Error(`${id}:${header.ref} — missing header mesh`)
    const translation = mesh ? {
      x: (mesh.min[0] + mesh.max[0]) * 500 - midpoint(pads.map(pad => pad.x)),
      z: (mesh.min[2] + mesh.max[2]) * 500 - midpoint(pads.map(pad => pad.y)),
    } : null
    return { ...header, pads, mesh, translation }
  })
  const measured = headerRows.filter(row => row.external)
  const offset = {
    x: round(midpoint(measured.map(row => row.translation.x))),
    z: round(midpoint(measured.map(row => row.translation.z))),
  }
  const error = Math.max(...measured.map(row => Math.hypot(row.translation.x - offset.x, row.translation.z - offset.z)))
  if (error > maxErrorMm) throw Error(`${id}: mismatched header centers (${error} mm)`)

  const legacyLabels = makeLegacyLabels(id)
  const useLegacy = new Set()
  const plainPads = new Map()
  for (const [headerIndex, { ref, labels, pads, external, mesh }] of headerRows.entries()) {
    for (const [index, pad] of pads.entries()) {
      const label = labels[index]
      const legacyIndex = legacyLabels.indexOf(label)
      // Explicitly associate the supply pin with the main 5V pad, rather than IOREF.
      const useLegacyId = external && legacyIndex !== -1 && !useLegacy.has(label)
        && (label !== '5V' || ref !== 'XIO0')
      if (useLegacyId) useLegacy.add(label)
      plainPads.set(`${ref}:${pad.number}`, {
        pinId: useLegacyId ? `pin-${legacyIndex + 1}` : `pin-${ref}-${pad.number}`,
        name: label,
        headerPosition: headerIndex * 100 + index + 1,
        anchorYMm: round(mesh ? mesh.max[1] * 1000 : 1.595),
      })
    }
  }
  if (useLegacy.size !== legacyLabels.length) throw Error(`${id}: missing legacy pin mapping`)
  return { offset, error, plainPads }
}

function cloneHeaderData(cad, model) {
  const offsets = []
  const plainPads = new Map()
  for (const pin of model.pins) {
    const ref = pin.headerReference
    const pad = cad.components.find(component => component.reference === ref)
      ?.pads.find(item => item.number === String(pin.position))
    if (!pad || !pin.anchor) throw Error(`ESP32 DevKit clone: no CAD pad for ${pin.id}`)
    offsets.push({ x: pin.anchor[0] * 1000 - pad.x, z: pin.anchor[2] * 1000 - pad.y })
    plainPads.set(`${ref}:${pad.number}`, { pinId: pin.id, name: pin.label })
  }
  const offset = { x: round(midpoint(offsets.map(row => row.x))), z: round(midpoint(offsets.map(row => row.z))) }
  const error = Math.max(...offsets.map(row => Math.hypot(row.x - offset.x, row.z - offset.z)))
  if (plainPads.size !== 30 || error > maxErrorMm) throw Error('ESP32 DevKit clone: pin anchors disagree with matching J2/J3 CAD')
  return { offset, error, plainPads }
}

const selected = process.argv[2]
if (selected && !Object.hasOwn(boards, selected)) throw Error(`Unsupported board: ${selected}`)
const headerRegistry = selected ? readJson(headerRegistryPath) : {}
const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
try {
  const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
  mkdirSync('src/data/board-components', { recursive: true })
  for (const [id, definition] of Object.entries(boards)) {
    if (selected && id !== selected) continue
    const cadFile = `public/boards/${definition.manifest}/manifest.json`
    const cad = readJson(cadFile)
    const [file] = cad.sourceFiles
    const hash = sha256(readFileSync(file))
    const clone = id === 'esp32-devkit'
    const sourceLicense = clone ? 'MIT' : license
    if (hash !== cad.sourceHash || !cad.license.startsWith(sourceLicense)) throw Error(`${id}: unexpected CAD provenance`)
    const bytes = readFileSync(`public/models/${definition.asset ?? id}.glb`)
    const { offset, error, plainPads } = clone
      ? cloneHeaderData(cad, (await server.ssrLoadModule('/src/data/esp32DevkitModel.ts')).esp32DevkitModel)
      : headerData(cad, parseBoardGlb(new Uint8Array(bytes).buffer).nodeBounds, id, definition)
    const source = { file, revision: cad.revision, license: sourceLicense, sha256: hash }
    const components = cad.components.map(component => {
      const bounds = padBounds(component.pads)
      const firstPad = component.pads.find(pad => pad.number === '1')
      return {
        ref: component.reference, value: component.value, description: '', footprint: component.footprint,
        side: component.side, xMm: component.x, yMm: component.y, rotationDeg: component.rotation,
        bboxMm: bounds ? { w: bounds.w, h: bounds.h, x: bounds.x, y: bounds.y } : null,
        ...(firstPad && { pin1: { xMm: firstPad.x, yMm: firstPad.y } }),
        pads: component.pads.map(pad => ({
          padNumber: pad.number, name: netName(pad) ?? pad.number, electricalType: 'unspecified',
          net: netName(pad), xMm: pad.x, yMm: pad.y, side: component.side,
          ...plainPads.get(`${component.reference}:${pad.number}`),
        })),
        source,
      }
    })
    const data = { boardId: id, source, modelSha256: sha256(bytes), modelOffsetMm: offset, maxHeaderCenterErrorMm: round(error), components }
    writeFileSync(`src/data/board-components/${id}.json`, `${JSON.stringify(data, null, 2)}\n`)
    if (!clone) headerRegistry[id] = components.flatMap(component => component.pads.filter(pad => pad.pinId).map(pad => ({
      id: pad.pinId, label: pad.name, headerReference: component.ref, padNumber: pad.padNumber, netName: pad.net, position: pad.headerPosition,
      anchor: [round((pad.xMm + offset.x) / 1000), round(pad.anchorYMm / 1000), round((pad.yMm + offset.z) / 1000)],
    })))
    console.log(`${id}: ${components.length} footprints, ${plainPads.size} header pads, Δ center ≤ ${round(error)} mm`)
  }
  writeFileSync(headerRegistryPath, `${JSON.stringify(headerRegistry, null, 2)}\n`)
} finally {
  await server.close()
}
