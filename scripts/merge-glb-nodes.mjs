// Appends the component nodes of one or more KiCad-exported GLBs (one reference per file,
// exported with `kicad-cli pcb export glb --no-board-body --component-filter REF`) into a
// board GLB. Transforms are kept as exported; every copied node is named after its reference
// so hotspots can select it. Refuses to add a reference that already has a node.
// Usage: node scripts/merge-glb-nodes.mjs target.glb REF=part.glb [REF=part.glb ...]
import { readFileSync, writeFileSync } from 'node:fs'

const readGlb = (bytes) => {
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'))
  const binLength = bytes.readUInt32LE(20 + jsonLength)
  return { json, bin: Buffer.from(bytes.subarray(28 + jsonLength, 28 + jsonLength + binLength)) }
}
const pad4 = (buffer, fill) => Buffer.concat([buffer, Buffer.alloc((4 - buffer.length % 4) % 4, fill)])

const [targetPath, ...entries] = process.argv.slice(2)
const target = readGlb(readFileSync(targetPath))
const root = target.json.scenes[target.json.scene ?? 0].nodes[0]
for (const entry of entries) {
  const [ref, file] = entry.split('=')
  if (target.json.nodes.some((node) => node.name === ref)) throw new Error(`${ref} already exists in ${targetPath}`)
  const part = readGlb(readFileSync(file))
  const binOffset = pad4(target.bin, 0).length
  target.bin = Buffer.concat([pad4(target.bin, 0), part.bin])
  const viewBase = target.json.bufferViews.length, accessorBase = target.json.accessors.length
  const materialBase = target.json.materials.length, meshBase = target.json.meshes.length, nodeBase = target.json.nodes.length
  target.json.bufferViews.push(...part.json.bufferViews.map((view) => ({ ...view, buffer: 0, byteOffset: (view.byteOffset ?? 0) + binOffset })))
  target.json.accessors.push(...part.json.accessors.map((accessor) => ({ ...accessor, bufferView: accessor.bufferView + viewBase })))
  target.json.materials.push(...(part.json.materials ?? []))
  target.json.meshes.push(...part.json.meshes.map((mesh) => ({ ...mesh, name: ref, primitives: mesh.primitives.map((primitive) => ({
    ...primitive,
    attributes: Object.fromEntries(Object.entries(primitive.attributes).map(([key, value]) => [key, value + accessorBase])),
    ...(primitive.indices !== undefined ? { indices: primitive.indices + accessorBase } : {}),
    ...(primitive.material !== undefined ? { material: primitive.material + materialBase } : {}),
  })) })))
  const partRoot = part.json.scenes[part.json.scene ?? 0].nodes[0]
  // Skip the part's scene root (identity) and hang its children under the board root.
  const remap = (index) => index === partRoot ? null : nodeBase + index - (index > partRoot ? 1 : 0)
  part.json.nodes.forEach((node, index) => {
    if (index === partRoot) return
    const copy = { ...node, name: ref }
    if (node.mesh !== undefined) copy.mesh = node.mesh + meshBase
    if (node.children) copy.children = node.children.map(remap)
    target.json.nodes.push(copy)
  })
  if (part.json.nodes[partRoot].matrix || part.json.nodes[partRoot].translation || part.json.nodes[partRoot].rotation) throw new Error(`${file}: scene root has a transform`)
  target.json.nodes[root].children.push(...part.json.nodes[partRoot].children.map(remap))
}
target.json.buffers = [{ byteLength: pad4(target.bin, 0).length }]
const json = pad4(Buffer.from(JSON.stringify(target.json), 'utf8'), 0x20)
const bin = pad4(target.bin, 0)
const header = Buffer.alloc(12); header.write('glTF', 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8)
const chunk = (data, type) => { const head = Buffer.alloc(8); head.writeUInt32LE(data.length, 0); head.write(type, 4); return Buffer.concat([head, data]) }
writeFileSync(targetPath, Buffer.concat([header, chunk(json, 'JSON'), chunk(bin, 'BIN\0')]))
console.log(`merged ${entries.length} part(s) into ${targetPath}`)
