import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { writeGlb } from './glb-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const boards = [
  { id: 'raspberry-pi-pico', source: 'public/cad/raspberry-pi-pico-r3.step', topMarker: 'PICO_REF_MICROCONTROLLER' },
  { id: 'raspberry-pi-pico-w', source: 'public/cad/raspberry-pi-pico-w.stp', topMarker: 'RPI_RP2040' },
  { id: 'raspberry-pi-pico-2', source: 'public/cad/raspberry-pi-pico-2.step', topMarker: 'rpi_rp2350a' },
  { id: 'raspberry-pi-pico-2-h', source: 'public/cad/raspberry-pi-pico-2-h-step-source/rpi_pico2h.step', topMarker: 'rpi_rp2350a' },
]
const requestedBoardIndex = process.argv.indexOf('--board')
const requestedBoardId = requestedBoardIndex >= 0 ? process.argv[requestedBoardIndex + 1] : undefined
const selectedBoards = requestedBoardId ? boards.filter(({ id }) => id === requestedBoardId) : boards
if (requestedBoardId && selectedBoards.length === 0) throw new Error(`Unknown Raspberry Pi board id: ${requestedBoardId}`)
const componentNames = new Map([
  ['SOLDERMASK_TOP', 'PCB · mặt trên'],
  ['SOLDERMASK_BOTTOM', 'PCB · mặt dưới'],
  ['Dielectric', 'Lõi PCB'],
  ['RF_SHIELD_PICOW', 'Module vô tuyến · vỏ chắn RF'],
  ['RPI_RP2040', 'Vi điều khiển RP2040'],
  ['RT-WDFN-14AL', 'IC nguồn RT-WDFN-14AL · định danh từ CAD'],
  ['TONEPARTS_TP-1221U-K9K5325', 'Linh kiện TONEPARTS TP-1221U-K9K5325'],
  ['XTAL320X250X100', 'Thạch anh 3,2 × 2,5 × 1,0 mm'],
  ['USB_C', 'Cổng USB-C'],
  ['USB_MICRO_B', 'Cổng USB Micro-B'],
])

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function collectComponents(rootNode, meshes, boardId) {
  const owners = new Map()
  const visit = (node) => {
    for (const meshIndex of node.meshes ?? []) owners.set(meshIndex, node)
    for (const child of node.children ?? []) visit(child)
  }
  visit(rootNode)

  const groups = new Map()
  for (let index = 0; index < meshes.length; index += 1) {
    const mesh = meshes[index]
    const sourceName = mesh.name?.trim()
    const owner = owners.get(index)
    const ownerName = owner?.name?.trim() ?? ''
    const isAssembly = !owner || ['Shapes', 'Symbols', boardId, 'PICO', 'rpi_pico2', 'rpi-picow-r3-2.brd', 'PICO_assm_140121.STEP'].includes(ownerName)
    const raw = isAssembly ? sourceName : ownerName
    const genericOwner = !raw || ['Shapes', 'Symbols', boardId, 'PICO', 'rpi_pico2', 'rpi-picow-r3-2.brd', 'PICO_assm_140121.STEP'].includes(raw)
    const baseName = genericOwner ? `CAD_GEOMETRY_${String(index + 1).padStart(3, '0')}` : raw.replace(/\.STEP$/i, '')
    const key = genericOwner ? `mesh:${index}` : isAssembly ? `name:${baseName}` : `owner:${ownerName}:${owner.children?.length ?? 0}:${index - (owner.meshes?.[0] ?? index)}`
    const stableKey = genericOwner || isAssembly ? key : `owner:${ownerName}:${(owner.meshes ?? []).join(',')}`
    if (!groups.has(stableKey)) groups.set(stableKey, { name: baseName, sourceName: sourceName || (genericOwner ? 'Hình học không có tên trong CAD' : raw), meshIndices: [] })
    groups.get(stableKey).meshIndices.push(index)
  }
  const usedNames = new Map()
  return [...groups.values()].map((group) => {
    const count = (usedNames.get(group.name) ?? 0) + 1
    usedNames.set(group.name, count)
    const name = count === 1 ? group.name : `${group.name}__${String(count).padStart(2, '0')}`
    return { ...group, name, meshes: group.meshIndices.map((index) => meshes[index]) }
  })
}

// The Raspberry Pi STEP files use different up axes, so pick a rotation per file.
// These are rotations, never axis swaps: swapping two axes mirrors the board.
function boardRotation(components, topMarker) {
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
  const extent = (meshes, target) => {
    for (const mesh of meshes) {
      const raw = mesh.attributes.position.array
      for (let index = 0; index < raw.length; index += 1) {
        const axis = index % 3
        target.min[axis] = Math.min(target.min[axis], raw[index])
        target.max[axis] = Math.max(target.max[axis], raw[index])
      }
    }
    return target
  }
  extent(components.flatMap((component) => component.meshes), bounds)
  const size = bounds.max.map((value, axis) => value - bounds.min[axis])
  const zUp = size[2] < size[1]
  const up = zUp ? (x, y, z) => [x, z, -y] : (x, y, z) => [x, y, z]
  const centerOf = (meshes) => { const box = extent(meshes, { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }); return box.min.map((value, axis) => (value + box.max[axis]) / 2) }
  const planeArea = (component) => { const box = extent(component.meshes, { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }); return (box.max[0] - box.min[0]) * (zUp ? box.max[1] - box.min[1] : box.max[2] - box.min[2]) }
  const marker = components.find((component) => component.name === topMarker)
  if (!marker) throw new Error(`Không tìm thấy ${topMarker} để xác định mặt trên.`)
  const pcb = components.reduce((best, component) => planeArea(component) > planeArea(best) ? component : best)
  const flipped = up(...centerOf(marker.meshes))[1] < up(...centerOf(pcb.meshes))[1]
  return flipped ? (x, y, z) => { const [a, b, c] = up(x, y, z); return [-a, -b, c] } : up
}

function toGlb(components, boardId, topMarker) {
  const rotate = boardRotation(components, topMarker)
  const parts = components.map((component) => ({ name: component.name, primitives: component.meshes.map((mesh) => {
    const raw = mesh.attributes.position.array, normal = mesh.attributes.normal?.array
    if (!normal || raw.length % 3 !== 0) throw new Error(`${component.name} thiếu tọa độ/normal.`)
    const positions = new Float32Array(raw.length), normals = new Float32Array(normal.length)
    for (let index = 0; index < raw.length; index += 3) {
      positions.set(rotate(raw[index] / 1000, raw[index + 1] / 1000, raw[index + 2] / 1000), index)
      normals.set(rotate(normal[index], normal[index + 1], normal[index + 2]), index)
    }
    return { positions, normals, indices: Uint16Array.from(mesh.index.array), color: mesh.color ?? [0.46, 0.49, 0.48] }
  }) }))
  return writeGlb(parts, { rootName: `${boardId} assembly`, generator: 'Mạch Mở STEP import · OpenCascade', extras: { sourceFormat: 'STEP', sourceBoard: boardId, sourceUnits: 'mm', outputUnits: 'm' } })
}

const occt = await occtFactory()
await mkdir(join(root, 'public/models'), { recursive: true })
for (const board of selectedBoards) {
  const sourcePath = join(root, board.source)
  const bytes = await readFile(sourcePath)
  const result = occt.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter' })
  if (!result.success || !result.meshes?.length) throw new Error(`Không đọc được CAD ${board.source}`)
  const targetPath = join(root, 'public/models', `${board.id}.glb`)
  const components = collectComponents(result.root, result.meshes, board.id)
  const glb = toGlb(components, board.id, board.topMarker)
  await writeFile(targetPath, glb)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const inventory = {
    boardId: board.id,
    sourceFile: board.source,
    sourceSha256: sha256,
    meshCount: result.meshes.length,
    componentCount: components.length,
    nodes: components.map((component) => ({ nodeName: component.name, sourceMeshes: component.meshIndices.length, sourceName: component.sourceName })),
  }
  await writeFile(join(root, 'src/data', `${board.id}.mesh-inventory.json`), `${JSON.stringify(inventory, null, 2)}\n`)
  console.log(`${basename(targetPath)}: ${components.length} component node / ${result.meshes.length} mesh, ${(glb.length / 1024 / 1024).toFixed(2)} MB · SHA256 STEP ${sha256}`)
}

