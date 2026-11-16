// Places a KiCad-built module GLB (scripts/build-module-models.py + kicad-cli export) in the frame
// the builder already uses, then updates src/data/component-models.manifest.json.
//  - breadboard modules: named header pads land on the existing pinsMm (x, z) and the pin tips
//    reach 6 mm below the breadboard surface (y = -6), so legsMm stay valid;
//  - bench modules: the model rests on the bench (min y = 0), centred on x/z, and pinsMm are
//    re-derived from the real pad positions (top of the connector the wire plugs into).
// Usage: node scripts/finalize-module-glb.mjs <id> <work-dir>   (work-dir holds <id>.glb + <id>.pads.json)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const [id, work] = process.argv.slice(2)
const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')

const readGlb = (bytes) => { const length = bytes.readUInt32LE(12); return { json: JSON.parse(bytes.subarray(20, 20 + length).toString('utf8')), rest: bytes.subarray(20 + length) } }
const writeGlb = ({ json, rest }) => {
  const text = Buffer.from(JSON.stringify(json)); const padded = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 0x20)])
  const head = Buffer.alloc(20); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + padded.length + rest.length, 8); head.writeUInt32LE(padded.length, 12); head.write('JSON', 16)
  return Buffer.concat([head, padded, rest])
}
const parse = (bytes) => parseBoardGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
const boundsOf = (nodes) => ({ min: [0, 1, 2].map((i) => Math.min(...nodes.map((n) => n.min[i])) * 1000), max: [0, 1, 2].map((i) => Math.max(...nodes.map((n) => n.max[i])) * 1000) })

const pads = JSON.parse(readFileSync(`${work}/${id}.pads.json`, 'utf8'))
const meta = pads.meta
const glb = readGlb(readFileSync(`${work}/${id}.glb`))
const root = glb.json.scenes[glb.json.scene ?? 0].nodes[0]
const upright = meta.orient === 'upright'
const rotation = upright ? [Math.SQRT1_2, 0, 0, Math.SQRT1_2] : [0, 0, 0, 1]
const rotate = ([x, y, z]) => upright ? [x, -z, y] : [x, y, z]
glb.json.nodes[root] = { ...glb.json.nodes[root], rotation, translation: [0, 0, 0] }
const rotated = parse(writeGlb(glb)).nodeBounds
const all = boundsOf(rotated)
// Light straight headers are drawn as primitives (no node of their own): pins span -8.6..2.6 mm
// under a back-mounted header and -1.4..10.2 mm above a front-mounted one (board bottom = 0).
const lightHeader = (ref) => pads.footprints[ref]?.footprint.includes('PinHeader_1x') && pads.footprints[ref]?.footprint.includes('_Vertical')
  ? (pads.footprints[ref].side === 'back' ? { min: [0, -8.6, 0], max: [0, 2.6, 0] } : { min: [0, -1.4, 0], max: [0, 10.2, 0] }) : undefined
const nodeBounds = (ref) => { const own = rotated.filter((n) => n.nodeName === ref || n.nodeName.startsWith(`${ref}::`)); return own.length ? boundsOf(own) : lightHeader(ref) }

// Named pads in the rotated (untranslated) frame, mm.
const named = []
for (const [ref, names] of Object.entries(meta.pins)) {
  const footprint = pads.footprints[ref]
  if (!footprint) throw new Error(`${id}: no footprint ${ref}`)
  const ordered = [...footprint.pads].filter((pad) => /^\d+$/.test(pad.number)).sort((a, b) => Number(a.number) - Number(b.number))
  names.forEach((name, index) => { if (name) named.push({ name, ref, local: rotate([ordered[index].x, 0, ordered[index].y]) }) })
}

const manifestPath = 'src/data/component-models.manifest.json'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
let entry = manifest.find((item) => item.id === id)
let translation
if (meta.mount === 'breadboard') {
  if (!entry) throw new Error(`${id}: breadboard module needs an existing manifest entry`)
  const [first, second] = named
  const target = entry.pinsMm[first.name]
  const header = nodeBounds(first.ref)
  translation = [target[0] - first.local[0], -6 - header.min[1], target[2] - first.local[2]]
  for (const pin of named) {
    const want = entry.pinsMm[pin.name]
    const got = [pin.local[0] + translation[0], pin.local[2] + translation[2]]
    if (!want || Math.hypot(got[0] - want[0], got[1] - want[2]) > 0.15) throw new Error(`${id}: pin ${pin.name} lands at ${got} not ${want}`)
  }
  void second
} else {
  translation = [-(all.min[0] + all.max[0]) / 2, -all.min[1], -(all.min[2] + all.max[2]) / 2]
}
glb.json.nodes[root].translation = translation.map((v) => v / 1000)
const output = writeGlb(glb)
const placed = parse(output)
const bounds = boundsOf(placed.nodeBounds)
const round = (v) => Math.round(v * 100) / 100
const pinsMm = meta.mount === 'breadboard' ? entry.pinsMm : Object.fromEntries(named.map((pin) => {
  const top = nodeBounds(pin.ref)?.max[1] ?? 1.6
  return [pin.name, [round(pin.local[0] + translation[0]), round(top + translation[1]), round(pin.local[2] + translation[2])]]
}))
const file = `/models/components/${id}.glb`
writeFileSync(`public${file}`, output)
const triangles = placed.batches.reduce((sum, batch) => sum + batch.indices.length / 3, 0)
const next = {
  ...(entry ?? { id, mount: 'bench', legsMm: [] }), file, bytes: output.length, sha256: createHash('sha256').update(output).digest('hex'),
  sizeMm: bounds.max.map((v, i) => round(v - bounds.min[i])), boundsMm: { min: bounds.min.map(round), max: bounds.max.map(round) }, triangles: Math.round(triangles),
  kind: 'kicad-assembly', packageName: meta.package, modelNote: 'PCB, chữ lụa và package lấy từ thư viện KiCad 10.0.7 (CC BY-SA 4.0); vị trí linh kiện theo module phổ biến, không phải CAD của hãng.', pinsMm,
}
delete next.sourceFile; delete next.sourceSha256; delete next.footprint
if (entry) manifest[manifest.indexOf(entry)] = next; else manifest.push(next)
manifest.sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`${id}: ${next.sizeMm.join(' x ')} mm, ${next.triangles} tri, ${(next.bytes / 1024).toFixed(0)} KB, pins ${Object.keys(pinsMm).join(',')}`)
await server.close()
