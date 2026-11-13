import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const modelPath = new URL('public/models/esp32-s3-devkitc-1-v1.1.glb', root)
const inventoryPath = new URL('src/data/esp32-s3-devkitc-1.inventory.json', root)
const anchorsPath = new URL('src/data/esp32-s3-devkitc-1.pin-anchors.json', root)
const buffer = await readFile(modelPath)
if (buffer.toString('ascii', 0, 4) !== 'glTF' || buffer.readUInt32LE(4) !== 2) {
  throw new Error('Expected a binary glTF 2.0 model')
}
const jsonLength = buffer.readUInt32LE(12)
const jsonType = buffer.readUInt32LE(16)
if (jsonType !== 0x4e4f534a) throw new Error('First GLB chunk is not JSON')
const document = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trimEnd())
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const componentByReference = new Map(inventory.components.map((component) => [component.reference, component]))
let namedMeshes = 0

for (const parent of document.nodes ?? []) {
  const component = componentByReference.get(parent.name)
  if (!component || !Array.isArray(parent.children)) continue
  const leaves = parent.children.map((index) => document.nodes[index]).filter((node) => Number.isInteger(node?.mesh))
  component.modelNodeNames = leaves.map((node, index) => {
    const name = leaves.length === 1 ? component.reference : `${component.reference}::part-${index + 1}`
    node.name = name
    namedMeshes += 1
    return name
  })
}

const unnamedExpected = inventory.components.filter((component) => component.has3dBody && component.modelNodeNames.length === 0)
if (unnamedExpected.length) throw new Error(`No GLB mesh node found for: ${unnamedExpected.map((item) => item.reference).join(', ')}`)

const encodedJson = Buffer.from(JSON.stringify(document))
const padding = (4 - (encodedJson.length % 4)) % 4
const paddedJson = Buffer.concat([encodedJson, Buffer.alloc(padding, 0x20)])
const jsonHeader = Buffer.alloc(8)
jsonHeader.writeUInt32LE(paddedJson.length, 0)
jsonHeader.writeUInt32LE(0x4e4f534a, 4)
const binaryChunk = buffer.subarray(20 + jsonLength)
const glb = Buffer.concat([buffer.subarray(0, 12), jsonHeader, paddedJson, binaryChunk])
glb.writeUInt32LE(glb.length, 8)
await writeFile(modelPath, glb)

const modelSha256 = createHash('sha256').update(glb).digest('hex')
inventory.modelSha256 = modelSha256
const anchors = JSON.parse(await readFile(anchorsPath, 'utf8'))
anchors.sourceGlbSha256 = modelSha256
await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8')
await writeFile(anchorsPath, `${JSON.stringify(anchors, null, 2)}\n`, 'utf8')
console.log(`Named ${namedMeshes} board-package meshes. GLB SHA-256 ${modelSha256}.`)
