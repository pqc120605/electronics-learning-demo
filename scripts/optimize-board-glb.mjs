// Merges each mesh's primitives by material without touching vertices, node names or transforms.
// The merged file is rejected unless every node keeps exactly the same triangles.
// Usage: node scripts/optimize-board-glb.mjs public/models/arduino-uno-r3.glb [more.glb]
// The input is copied to assets/boards/unoptimized-glb/ before it is replaced.
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const TRIANGLES = 4
const FLOAT = 5126
const USHORT = 5123
const MAX_VERTICES = 65535

function readGlb(bytes) {
  if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error('Không phải GLB.')
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'))
  const binLength = bytes.readUInt32LE(20 + jsonLength)
  return { json, bin: bytes.subarray(28 + jsonLength, 28 + jsonLength + binLength) }
}

function readAccessor({ json, bin }, index) {
  const accessor = json.accessors[index]
  const view = json.bufferViews[accessor.bufferView]
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  if (accessor.componentType === USHORT) {
    if (accessor.type !== 'SCALAR') throw new Error('Chỉ mục phải là SCALAR.')
    return Array.from({ length: accessor.count }, (_, item) => bin.readUInt16LE(start + item * (view.byteStride ?? 2)))
  }
  if (accessor.componentType !== FLOAT || accessor.type !== 'VEC3') throw new Error('Thuộc tính phải là VEC3 float.')
  const stride = view.byteStride ?? 12
  return Array.from({ length: accessor.count * 3 }, (_, item) => bin.readFloatLE(start + Math.floor(item / 3) * stride + (item % 3) * 4))
}

function primitivesOf(glb, mesh) {
  return mesh.primitives.map((primitive) => {
    if ((primitive.mode ?? TRIANGLES) !== TRIANGLES || primitive.indices === undefined) throw new Error('Chỉ hỗ trợ tam giác có chỉ mục.')
    const extra = Object.keys(primitive.attributes).filter((name) => name !== 'POSITION' && name !== 'NORMAL')
    if (extra.length) throw new Error(`Có thuộc tính chưa hỗ trợ: ${extra.join(', ')}`)
    return { material: primitive.material, positions: readAccessor(glb, primitive.attributes.POSITION), normals: readAccessor(glb, primitive.attributes.NORMAL), indices: readAccessor(glb, primitive.indices) }
  })
}

function mergeByMaterial(primitives) {
  const merged = []
  const open = new Map()
  for (const primitive of primitives) {
    const vertexCount = primitive.positions.length / 3
    let target = open.get(primitive.material)
    if (!target || target.positions.length / 3 + vertexCount > MAX_VERTICES) {
      target = { material: primitive.material, positions: [], normals: [], indices: [] }
      open.set(primitive.material, target)
      merged.push(target)
    }
    const offset = target.positions.length / 3
    for (const value of primitive.positions) target.positions.push(value)
    for (const value of primitive.normals) target.normals.push(value)
    for (const index of primitive.indices) target.indices.push(index + offset)
  }
  return merged
}

function triangleHash(primitive) {
  const key = (index) => `${primitive.positions.slice(index * 3, index * 3 + 3)}|${primitive.normals.slice(index * 3, index * 3 + 3)}`
  const triangles = []
  for (let index = 0; index < primitive.indices.length; index += 3) triangles.push([0, 1, 2].map((corner) => key(primitive.indices[index + corner])).join(' '))
  return triangles
}

/** One digest per node and material: order may change, the triangles may not. */
function geometryDigest(glb) {
  const digest = {}
  for (const node of glb.json.nodes) {
    if (node.mesh === undefined) continue
    const groups = new Map()
    for (const primitive of primitivesOf(glb, glb.json.meshes[node.mesh])) groups.set(primitive.material, [...(groups.get(primitive.material) ?? []), ...triangleHash(primitive)])
    digest[node.name] = [...groups].map(([material, triangles]) => `${material}:${createHash('sha256').update(triangles.sort().join('\n')).digest('hex')}`).sort()
  }
  return JSON.stringify(digest)
}

function writeGlbFile(json, positions, normals, indices) {
  const bin = Buffer.concat([positions, normals, indices, Buffer.alloc((4 - (indices.length % 4)) % 4)])
  json.buffers = [{ byteLength: bin.length }]
  const text = Buffer.from(JSON.stringify(json), 'utf8')
  const pad = Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)
  const jsonChunk = Buffer.concat([text, pad])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + bin.length, 8)
  const chunk = (length, type) => { const buffer = Buffer.alloc(8); buffer.writeUInt32LE(length, 0); buffer.writeUInt32LE(type, 4); return buffer }
  return Buffer.concat([header, chunk(jsonChunk.length, 0x4e4f534a), jsonChunk, chunk(bin.length, 0x004e4942), bin])
}

function optimize(source) {
  const glb = readGlb(source)
  const json = structuredClone(glb.json)
  const positions = [], normals = [], indices = []
  let positionBytes = 0, normalBytes = 0, indexBytes = 0
  json.accessors = []
  const addAccessor = (accessor) => json.accessors.push(accessor) - 1
  json.meshes = glb.json.meshes.map((mesh) => ({ ...mesh, primitives: mergeByMaterial(primitivesOf(glb, mesh)).map((primitive) => {
    const count = primitive.positions.length / 3
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    primitive.positions.forEach((value, index) => { min[index % 3] = Math.min(min[index % 3], value); max[index % 3] = Math.max(max[index % 3], value) })
    const position = Buffer.from(Float32Array.from(primitive.positions).buffer), normal = Buffer.from(Float32Array.from(primitive.normals).buffer), index = Buffer.from(Uint16Array.from(primitive.indices).buffer)
    const accessors = {
      POSITION: addAccessor({ bufferView: 0, byteOffset: positionBytes, componentType: FLOAT, count, type: 'VEC3', min, max }),
      NORMAL: addAccessor({ bufferView: 1, byteOffset: normalBytes, componentType: FLOAT, count, type: 'VEC3' }),
    }
    const indexAccessor = addAccessor({ bufferView: 2, byteOffset: indexBytes, componentType: USHORT, count: primitive.indices.length, type: 'SCALAR' })
    positions.push(position); normals.push(normal); indices.push(index)
    positionBytes += position.length; normalBytes += normal.length; indexBytes += index.length
    return { attributes: accessors, indices: indexAccessor, material: primitive.material, mode: TRIANGLES }
  }) }))
  json.bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: positionBytes, target: 34962 },
    { buffer: 0, byteOffset: positionBytes, byteLength: normalBytes, target: 34962 },
    { buffer: 0, byteOffset: positionBytes + normalBytes, byteLength: indexBytes, target: 34963 },
  ]
  return { output: writeGlbFile(json, Buffer.concat(positions), Buffer.concat(normals), Buffer.concat(indices)), before: glb }
}

const backupDir = 'assets/boards/unoptimized-glb'
await mkdir(backupDir, { recursive: true })
for (const path of process.argv.slice(2)) {
  const source = await readFile(path)
  const { output, before } = optimize(source)
  const after = readGlb(output)
  const names = (glb) => JSON.stringify(glb.json.nodes.map((node) => [node.name, node.translation, node.rotation, node.scale, node.matrix]))
  if (names(before) !== names(after)) throw new Error(`${path}: node đã thay đổi.`)
  if (JSON.stringify(before.json.materials) !== JSON.stringify(after.json.materials)) throw new Error(`${path}: material đã thay đổi.`)
  if (geometryDigest(before) !== geometryDigest(after)) throw new Error(`${path}: hình học đã thay đổi.`)
  await copyFile(path, join(backupDir, basename(path)))
  await writeFile(path, output)
  const count = (glb) => glb.json.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0)
  console.log(`${basename(path)}: ${source.length} -> ${output.length} byte, ${count(before)} -> ${count(after)} primitive, node và tam giác giữ nguyên`)
}
