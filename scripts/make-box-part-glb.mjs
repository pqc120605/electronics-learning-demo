// Writes a one-node GLB holding a plain box (parametric placeholder for a part whose STEP model is
// not in the KiCad library, e.g. the USB-B receptacle of Arduino Uno/Mega). Coordinates in mm,
// same frame as `kicad-cli pcb export glb` (x, y up, z); output in metres.
// Usage: node scripts/make-box-part-glb.mjs out.glb NAME minX minY minZ maxX maxY maxZ [r g b]
import { writeFileSync } from 'node:fs'
import { writeGlb } from './glb-writer.mjs'

const [out, name, ...numbers] = process.argv.slice(2)
const [x0, y0, z0, x1, y1, z1, r = 0.78, g = 0.79, b = 0.8] = numbers.map(Number)
const mm = (value) => value / 1000
const faces = [
  [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]],
  [[-1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]]],
  [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]],
  [[0, -1, 0], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]]],
  [[0, 0, 1], [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]]],
  [[0, 0, -1], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]],
]
const positions = [], normals = [], indices = []
faces.forEach(([normal, corners], face) => {
  for (const corner of corners) { positions.push(...corner.map(mm)); normals.push(...normal) }
  const base = face * 4
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
})
const glb = writeGlb([{ name, primitives: [{ positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices), color: [r, g, b], metallic: 0.6, roughness: 0.4 }] }], { rootName: name, generator: 'make-box-part-glb (parametric placeholder)' })
writeFileSync(out, glb)
console.log(`wrote ${out}`)
