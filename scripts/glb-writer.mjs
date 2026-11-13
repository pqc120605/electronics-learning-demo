// Writes the GLB profile that src/components/board/glbParser.ts reads:
// POSITION + NORMAL, 16-bit indices, metres, Y up, one node per named part.
function alignTo4(parts, size) {
  while (size % 4) { parts.push(Buffer.from([0])); size += 1 }
  return size
}

export function writeGlb(parts, { rootName, generator, extras = {} }) {
  const binaryParts = [], bufferViews = [], accessors = [], meshes = [], nodes = [], materials = []
  let byteOffset = 0
  const append = (typedArray, target) => {
    byteOffset = alignTo4(binaryParts, byteOffset)
    const data = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)
    bufferViews.push({ buffer: 0, byteOffset, byteLength: data.byteLength, target })
    binaryParts.push(data)
    byteOffset += data.byteLength
    return bufferViews.length - 1
  }
  parts.forEach((part, partIndex) => {
    const primitives = part.primitives.map((primitive, primitiveIndex) => {
      const { positions, normals, indices, color, metallic = 0.08, roughness = 0.72 } = primitive
      if (positions.length / 3 > 65535) throw new Error(`${part.name}: primitive vượt giới hạn chỉ mục 16-bit.`)
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
      for (let index = 0; index < positions.length; index += 1) {
        const axis = index % 3
        min[axis] = Math.min(min[axis], positions[index])
        max[axis] = Math.max(max[axis], positions[index])
      }
      materials.push({ name: `${part.name}-${primitiveIndex + 1}`, pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: metallic, roughnessFactor: roughness }, doubleSided: true })
      const positionView = append(positions, 34962), normalView = append(normals, 34962), indexView = append(indices, 34963)
      accessors.push({ bufferView: positionView, componentType: 5126, count: positions.length / 3, type: 'VEC3', min, max })
      accessors.push({ bufferView: normalView, componentType: 5126, count: normals.length / 3, type: 'VEC3' })
      accessors.push({ bufferView: indexView, componentType: 5123, count: indices.length, type: 'SCALAR' })
      return { attributes: { POSITION: accessors.length - 3, NORMAL: accessors.length - 2 }, indices: accessors.length - 1, material: materials.length - 1, mode: 4 }
    })
    meshes.push({ name: part.name, primitives })
    nodes.push({ name: part.name, mesh: partIndex })
  })
  const bin = Buffer.concat(binaryParts)
  const json = Buffer.from(JSON.stringify({
    asset: { version: '2.0', generator, extras },
    scene: 0,
    scenes: [{ nodes: [nodes.length] }],
    nodes: [...nodes, { name: rootName, children: nodes.map((_, index) => index) }],
    meshes, materials, accessors, bufferViews,
    buffers: [{ byteLength: bin.length }],
  }))
  const jsonLength = (json.length + 3) & ~3, binLength = (bin.length + 3) & ~3
  const output = Buffer.alloc(28 + jsonLength + binLength)
  output.writeUInt32LE(0x46546c67, 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(output.length, 8)
  output.writeUInt32LE(jsonLength, 12)
  output.writeUInt32LE(0x4e4f534a, 16)
  json.copy(output, 20)
  output.fill(0x20, 20 + json.length, 20 + jsonLength)
  output.writeUInt32LE(binLength, 20 + jsonLength)
  output.writeUInt32LE(0x004e4942, 24 + jsonLength)
  bin.copy(output, 28 + jsonLength)
  return output
}

/** Copies one STEP mesh out of occt-import-js in metres, applying a proper rotation. */
export function primitivesFromStepMesh(mesh, rotate, fallbackColor = [0.46, 0.49, 0.48], translate = [0, 0, 0]) {
  const rawPosition = mesh.attributes.position.array, rawNormal = mesh.attributes.normal?.array
  if (!rawNormal) throw new Error('Mesh STEP thiếu normal.')
  const positions = new Float32Array(rawPosition.length), normals = new Float32Array(rawNormal.length)
  for (let index = 0; index < rawPosition.length; index += 3) {
    positions.set(rotate(rawPosition[index] / 1000 - translate[0], rawPosition[index + 1] / 1000 - translate[1], rawPosition[index + 2] / 1000 - translate[2]), index)
    normals.set(rotate(rawNormal[index], rawNormal[index + 1], rawNormal[index + 2]), index)
  }
  const sourceIndices = mesh.index.array
  const faces = mesh.brep_faces?.length ? mesh.brep_faces : [{ first: 0, last: sourceIndices.length / 3 - 1, color: mesh.color }]
  const byColor = new Map()
  for (const face of faces) {
    const color = face.color ?? mesh.color ?? fallbackColor
    const key = color.map((value) => value.toFixed(3)).join()
    if (!byColor.has(key)) byColor.set(key, { color, triangles: [] })
    for (let triangle = face.first; triangle <= face.last; triangle += 1) byColor.get(key).triangles.push(triangle)
  }
  return [...byColor.values()].map(({ color, triangles }) => {
    const indices = new Uint16Array(triangles.length * 3)
    triangles.forEach((triangle, index) => { for (let corner = 0; corner < 3; corner += 1) indices[index * 3 + corner] = sourceIndices[triangle * 3 + corner] })
    return { positions, normals, indices, color: [...color] }
  })
}
