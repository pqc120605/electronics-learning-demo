// Names the mesh nodes of a `kicad-cli pcb export glb` file after their footprint reference
// (kicad-cli names only the parent node). Single-mesh parts get the bare reference,
// multi-mesh parts `REF::part-N`. Unnamed board/copper meshes are left untouched.
// Usage: node scripts/name-kicad-glb-nodes.mjs in.glb [out.glb]
import { readFileSync, writeFileSync } from 'node:fs'

const [input, output = input] = process.argv.slice(2)
const buffer = readFileSync(input)
const jsonLength = buffer.readUInt32LE(12)
const document = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trimEnd())
let named = 0
for (const parent of document.nodes) {
  if (!parent.name || parent.name.startsWith('=>') || !Array.isArray(parent.children)) continue
  const leaves = parent.children.map((index) => document.nodes[index]).filter((node) => Number.isInteger(node?.mesh))
  leaves.forEach((node, index) => { node.name = leaves.length === 1 ? parent.name : `${parent.name}::part-${index + 1}`; named += 1 })
}
const json = Buffer.from(JSON.stringify(document))
const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)])
const header = Buffer.alloc(8); header.writeUInt32LE(padded.length, 0); header.writeUInt32LE(0x4e4f534a, 4)
const glb = Buffer.concat([buffer.subarray(0, 12), header, padded, buffer.subarray(20 + jsonLength)])
glb.writeUInt32LE(glb.length, 8)
writeFileSync(output, glb)
console.log(`named ${named} mesh nodes`)
