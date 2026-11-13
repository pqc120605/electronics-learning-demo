export type GpuBatch = {
  nodeName: string
  materialIndex: number
  color: [number, number, number]
  positions: Float32Array
  normals: Float32Array
  indices: Uint32Array
}

export type NodeBounds = {
  nodeName: string
  center: [number, number, number]
  radius: number
  min: [number, number, number]
  max: [number, number, number]
}

export type ParsedBoardGlb = {
  batches: GpuBatch[]
  nodeBounds: NodeBounds[]
}

type JsonRecord = Record<string, unknown>
type GltfNode = {
  name?: string
  mesh?: number
  children?: number[]
  matrix?: number[]
  translation?: number[]
  rotation?: number[]
  scale?: number[]
}
type Group = {
  nodeName: string
  materialIndex: number
  color: [number, number, number]
  positions: number[]
  normals: number[]
  indices: number[]
}

const JSON_CHUNK = 0x4e4f534a
const BIN_CHUNK = 0x004e4942

function fail(message: string): never {
  throw new Error(`Mô hình PCB không tương thích: ${message}`)
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  const out = new Array<number>(16).fill(0)
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      for (let index = 0; index < 4; index += 1) out[column * 4 + row] += a[index * 4 + row] * b[column * 4 + index]
    }
  }
  return out
}

function nodeMatrix(node: GltfNode): number[] {
  if (node.matrix) {
    if (node.matrix.length !== 16 || node.matrix.some((value) => !Number.isFinite(value))) fail('node matrix sai định dạng.')
    return node.matrix
  }

  const [tx, ty, tz] = node.translation ?? [0, 0, 0]
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1]
  const [sx, sy, sz] = node.scale ?? [1, 1, 1]
  const x2 = qx + qx
  const y2 = qy + qy
  const z2 = qz + qz
  const xx = qx * x2
  const xy = qx * y2
  const xz = qx * z2
  const yy = qy * y2
  const yz = qy * z2
  const zz = qz * z2
  const wx = qw * x2
  const wy = qw * y2
  const wz = qw * z2

  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]
}

function transformPoint(matrix: number[], x: number, y: number, z: number): [number, number, number] {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ]
}

function transformNormal(matrix: number[], x: number, y: number, z: number): [number, number, number] {
  const nx = matrix[0] * x + matrix[4] * y + matrix[8] * z
  const ny = matrix[1] * x + matrix[5] * y + matrix[9] * z
  const nz = matrix[2] * x + matrix[6] * y + matrix[10] * z
  const length = Math.hypot(nx, ny, nz) || 1
  return [nx / length, ny / length, nz / length]
}

export function parseBoardGlb(buffer: ArrayBuffer): ParsedBoardGlb {
  if (buffer.byteLength < 20) fail('tệp quá nhỏ.')
  const view = new DataView(buffer)
  if (view.getUint32(0, true) !== 0x46546c67) fail('không phải tệp GLB.')
  if (view.getUint32(4, true) !== 2) fail('chỉ hỗ trợ GLB phiên bản 2.')
  if (view.getUint32(8, true) !== buffer.byteLength) fail('kích thước header không khớp.')

  let offset = 12
  let json: JsonRecord | undefined
  let binary: DataView | undefined
  while (offset + 8 <= buffer.byteLength) {
    const length = view.getUint32(offset, true)
    const type = view.getUint32(offset + 4, true)
    const chunkStart = offset + 8
    const chunkEnd = chunkStart + length
    if (chunkEnd > buffer.byteLength) fail('chunk vượt khỏi kích thước tệp.')
    if (type === JSON_CHUNK) {
      const text = new TextDecoder().decode(new Uint8Array(buffer, chunkStart, length)).replace(/[\u0000\u0020]+$/g, '')
      try {
        const parsed: unknown = JSON.parse(text)
        if (!isRecord(parsed)) fail('JSON chunk không hợp lệ.')
        json = parsed
      } catch {
        fail('không đọc được JSON chunk.')
      }
    } else if (type === BIN_CHUNK) {
      binary = new DataView(buffer, chunkStart, length)
    }
    offset = chunkEnd
  }
  if (!json || !binary) fail('thiếu JSON hoặc BIN chunk.')

  if (!isRecord(json.asset) || json.asset.version !== '2.0') fail('thiếu thông tin glTF 2.0.')
  if (Array.isArray(json.extensionsUsed) && json.extensionsUsed.length > 0) fail('asset có extension chưa được hỗ trợ.')
  if (Array.isArray(json.textures) && json.textures.length > 0) fail('asset có texture chưa được hỗ trợ.')

  const bufferViews = json.bufferViews as JsonRecord[] | undefined
  const accessors = json.accessors as JsonRecord[] | undefined
  const meshes = json.meshes as JsonRecord[] | undefined
  const nodes = json.nodes as GltfNode[] | undefined
  const materials = json.materials as JsonRecord[] | undefined
  if (!bufferViews || !accessors || !meshes || !nodes) fail('thiếu bufferView, accessor, mesh hoặc node.')
  if (!Array.isArray(json.buffers) || json.buffers.length !== 1 || json.buffers[0] && (json.buffers[0] as JsonRecord).uri) fail('chỉ hỗ trợ buffer nhúng trong GLB.')

  const readVec3 = (accessorIndex: number): Float32Array => {
    const accessor = accessors[accessorIndex]
    if (!accessor || accessor.componentType !== 5126 || accessor.type !== 'VEC3' || accessor.sparse) fail('POSITION/NORMAL phải là FLOAT VEC3 không sparse.')
    const bufferView = bufferViews[accessor.bufferView as number]
    if (!bufferView) fail('bufferView VEC3 không tồn tại.')
    const stride = (bufferView.byteStride as number | undefined) ?? 12
    if (stride < 12 || stride % 4 !== 0) fail('stride VEC3 không được hỗ trợ.')
    const start = (bufferView.byteOffset as number | undefined ?? 0) + (accessor.byteOffset as number | undefined ?? 0)
    const count = accessor.count as number
    if (!Number.isInteger(count) || count < 1 || start < 0 || start + (count - 1) * stride + 12 > binary.byteLength) fail('phạm vi accessor VEC3 không hợp lệ.')
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const source = start + index * stride
      values[index * 3] = binary.getFloat32(source, true)
      values[index * 3 + 1] = binary.getFloat32(source + 4, true)
      values[index * 3 + 2] = binary.getFloat32(source + 8, true)
    }
    return values
  }

  const readIndices = (accessorIndex: number): Uint16Array => {
    const accessor = accessors[accessorIndex]
    if (!accessor || accessor.componentType !== 5123 || accessor.type !== 'SCALAR' || accessor.sparse) fail('index phải là UNSIGNED_SHORT SCALAR không sparse.')
    const bufferView = bufferViews[accessor.bufferView as number]
    if (!bufferView) fail('bufferView index không tồn tại.')
    const start = (bufferView.byteOffset as number | undefined ?? 0) + (accessor.byteOffset as number | undefined ?? 0)
    const count = accessor.count as number
    if (!Number.isInteger(count) || count < 3 || start < 0 || start + count * 2 > binary.byteLength) fail('phạm vi accessor index không hợp lệ.')
    const values = new Uint16Array(count)
    for (let index = 0; index < count; index += 1) values[index] = binary.getUint16(start + index * 2, true)
    return values
  }

  const groups = new Map<string, Group>()
  const bounds = new Map<string, { min: [number, number, number]; max: [number, number, number] }>()
  const visit = (nodeIndex: number, parentMatrix: number[]) => {
    const node = nodes[nodeIndex]
    if (!node) fail('node tham chiếu không tồn tại.')
    const matrix = multiplyMatrices(parentMatrix, nodeMatrix(node))
    if (node.mesh !== undefined) {
      if (!node.name) fail('mesh không có tên node để map hotspot.')
      const mesh = meshes[node.mesh]
      if (!mesh || !Array.isArray(mesh.primitives)) fail('mesh không hợp lệ.')
      for (const primitive of mesh.primitives as JsonRecord[]) {
        if ((primitive.mode ?? 4) !== 4) fail('primitive không phải TRIANGLES.')
        if (!isRecord(primitive.attributes) || Object.keys(primitive.attributes).some((key) => key !== 'POSITION' && key !== 'NORMAL')) fail('primitive có attribute chưa được hỗ trợ.')
        const attributes = primitive.attributes as JsonRecord
        if (typeof attributes.POSITION !== 'number' || typeof attributes.NORMAL !== 'number' || typeof primitive.indices !== 'number') fail('primitive thiếu POSITION, NORMAL hoặc index.')
        const sourcePositions = readVec3(attributes.POSITION)
        const sourceNormals = readVec3(attributes.NORMAL)
        if (sourcePositions.length !== sourceNormals.length) fail('POSITION và NORMAL không cùng số đỉnh.')
        const sourceIndices = readIndices(primitive.indices)
        const materialIndex = typeof primitive.material === 'number' ? primitive.material : -1
        const material = materialIndex >= 0 ? materials?.[materialIndex] : undefined
        const pbr = material && isRecord(material.pbrMetallicRoughness) ? material.pbrMetallicRoughness : undefined
        const factors = pbr && Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor as number[] : [0.72, 0.75, 0.74, 1]
        const color: [number, number, number] = [factors[0] ?? 0.72, factors[1] ?? 0.75, factors[2] ?? 0.74]
        const key = `${node.name}::${materialIndex}`
        let group = groups.get(key)
        if (!group) {
          group = { nodeName: node.name, materialIndex, color, positions: [], normals: [], indices: [] }
          groups.set(key, group)
        }
        const vertexOffset = group.positions.length / 3
        for (let index = 0; index < sourcePositions.length; index += 3) {
          const point = transformPoint(matrix, sourcePositions[index], sourcePositions[index + 1], sourcePositions[index + 2])
          const normal = transformNormal(matrix, sourceNormals[index], sourceNormals[index + 1], sourceNormals[index + 2])
          group.positions.push(...point)
          group.normals.push(...normal)
          let nodeBound = bounds.get(node.name)
          if (!nodeBound) {
            nodeBound = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
            bounds.set(node.name, nodeBound)
          }
          for (let axis = 0; axis < 3; axis += 1) {
            nodeBound.min[axis] = Math.min(nodeBound.min[axis], point[axis])
            nodeBound.max[axis] = Math.max(nodeBound.max[axis], point[axis])
          }
        }
        for (const index of sourceIndices) group.indices.push(vertexOffset + index)
      }
    }
    for (const child of node.children ?? []) visit(child, matrix)
  }

  const scenes = json.scenes as JsonRecord[] | undefined
  const sceneIndex = typeof json.scene === 'number' ? json.scene : 0
  const roots = scenes?.[sceneIndex]?.nodes
  if (!Array.isArray(roots)) fail('không tìm được node gốc của scene.')
  for (const root of roots) {
    if (typeof root !== 'number') fail('scene có node index sai định dạng.')
    visit(root, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  }

  const batches: GpuBatch[] = []
  for (const group of groups.values()) {
    batches.push({
      nodeName: group.nodeName,
      materialIndex: group.materialIndex,
      color: group.color,
      positions: new Float32Array(group.positions),
      normals: new Float32Array(group.normals),
      indices: new Uint32Array(group.indices),
    })
  }
  const nodeBounds: NodeBounds[] = []
  for (const [nodeName, bound] of bounds) {
    const center: [number, number, number] = [
      (bound.min[0] + bound.max[0]) / 2,
      (bound.min[1] + bound.max[1]) / 2,
      (bound.min[2] + bound.max[2]) / 2,
    ]
    const radius = Math.hypot(
      bound.max[0] - center[0],
      bound.max[1] - center[1],
      bound.max[2] - center[2],
    )
    nodeBounds.push({ nodeName, center, radius, min: bound.min, max: bound.max })
  }
  if (batches.length === 0) fail('scene không có mesh hiển thị.')
  return { batches, nodeBounds }
}
