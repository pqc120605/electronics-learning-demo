// Builds a GLB from simple primitives for parts the KiCad 3D library does not ship (ultrasonic
// transducers, display glass, heatsink fins, sensor housings...). Same frame as
// `kicad-cli pcb export glb`: millimetres in, metres out, x right, y up, z = PCB y (down).
// Usage: node scripts/make-primitive-part-glb.mjs spec.json out.glb
// spec: [{ name, type: 'box'|'cyl', center: [x,y,z], size: [w,h,d] | radius+height+axis, color: [r,g,b], metallic?, roughness?, segments? }]
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { writeGlb } from './glb-writer.mjs'

const mm = (value) => value / 1000

function box({ center: [cx, cy, cz], size: [w, h, d] }) {
  const [x0, x1, y0, y1, z0, z1] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2, cz - d / 2, cz + d / 2]
  const faces = [
    [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]], [[-1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]]],
    [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]], [[0, -1, 0], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]]],
    [[0, 0, 1], [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]]], [[0, 0, -1], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]],
  ]
  const positions = [], normals = [], indices = []
  faces.forEach(([normal, corners], face) => {
    for (const corner of corners) { positions.push(...corner.map(mm)); normals.push(...normal) }
    indices.push(face * 4, face * 4 + 1, face * 4 + 2, face * 4, face * 4 + 2, face * 4 + 3)
  })
  return { positions, normals, indices }
}

function cylinder({ center, radius, height, axis = 'y', segments = 32, innerRadius = 0 }) {
  // Built along +y, then permuted to the requested axis. Optional innerRadius makes a ring/tube.
  const local = []
  const positions = [], normals = [], indices = []
  const push = (p, n) => { local.push([p, n]) }
  const ring = (y, r, n) => Array.from({ length: segments + 1 }, (_, i) => { const a = i / segments * Math.PI * 2; return [[Math.cos(a) * r, y, Math.sin(a) * r], n ?? [Math.cos(a), 0, Math.sin(a)]] })
  const quadStrip = (a, b, flip) => { const base = local.length; a.forEach((v) => push(...v)); b.forEach((v) => push(...v)); for (let i = 0; i < segments; i += 1) { const p = base + i, q = base + segments + 1 + i; if (flip) indices.push(p, q + 1, q, p, p + 1, q + 1); else indices.push(p, q, q + 1, p, q + 1, p + 1) } }
  const h = height / 2
  quadStrip(ring(-h, radius), ring(h, radius), false)
  if (innerRadius > 0) {
    quadStrip(ring(-h, innerRadius).map(([p, n]) => [p, n.map((v) => -v)]), ring(h, innerRadius).map(([p, n]) => [p, n.map((v) => -v)]), true)
    quadStrip(ring(h, innerRadius, [0, 1, 0]), ring(h, radius, [0, 1, 0]), false)
    quadStrip(ring(-h, radius, [0, -1, 0]), ring(-h, innerRadius, [0, -1, 0]), false)
  } else {
    for (const [y, n] of [[h, 1], [-h, -1]]) {
      const base = local.length
      push([0, y, 0], [0, n, 0]); ring(y, radius, [0, n, 0]).forEach((v) => push(...v))
      for (let i = 0; i < segments; i += 1) indices.push(...(n > 0 ? [base, base + 2 + i, base + 1 + i] : [base, base + 1 + i, base + 2 + i]))
    }
  }
  const map = axis === 'x' ? ([x, y, z]) => [y, x, z] : axis === 'z' ? ([x, y, z]) => [x, z, y] : (v) => v
  for (const [p, n] of local) { const q = map(p); positions.push(...[q[0] + center[0], q[1] + center[1], q[2] + center[2]].map(mm)); normals.push(...map(n)) }
  // Swapping two axes mirrors the mesh; reverse winding so faces still point outwards.
  if (axis !== 'y') for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]]
  return { positions, normals, indices }
}

export function primitiveParts(spec) {
  const parts = new Map()
  for (const item of spec) {
    const geometry = item.type === 'cyl' ? cylinder(item) : box(item)
    if (!parts.has(item.name)) parts.set(item.name, { name: item.name, primitives: [] })
    parts.get(item.name).primitives.push({
      positions: new Float32Array(geometry.positions), normals: new Float32Array(geometry.normals),
      indices: new Uint16Array(geometry.indices), color: item.color,
      metallic: item.metallic ?? 0.05, roughness: item.roughness ?? 0.6,
    })
  }
  return [...parts.values()]
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [specPath, out] = process.argv.slice(2)
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  const parts = primitiveParts(spec)
  writeFileSync(out, writeGlb(parts, { rootName: 'primitives', generator: 'make-primitive-part-glb' }))
  console.log(`wrote ${out} (${parts.length} parts)`)
}
