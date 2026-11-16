// Detailed parametric models for parts with no suitable openly licensed 3D model (KiCad has no
// servo, TT gear motor, panel potentiometer with knob, micro switch, jumper, power bank...).
// Geometry is written directly in the builder frame, so existing pinsMm/legsMm stay valid.
// Usage: node scripts/build-detailed-parts.mjs [id ...]   (rewrites public/models/components/<id>.glb + manifest)
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const box = (name, [x, y, z], [w, h, d], color, metallic = 0.05, roughness = 0.6) => ({ name, type: 'box', center: [x, y, z], size: [w, h, d], color, metallic, roughness })
const cyl = (name, [x, y, z], radius, height, axis, color, extra = {}) => ({ name, type: 'cyl', center: [x, y, z], radius, height, axis, color, metallic: 0.05, roughness: 0.6, segments: 32, ...extra })
const TIN = [0.78, 0.79, 0.8], METAL = { metallic: 0.9, roughness: 0.3 }
const leg = (name, x, z, top, bottom = -6, r = 0.3) => cyl(name, [x, (top + bottom) / 2, z], r, top - bottom, 'y', TIN, METAL)

const specs = {
  potentiometer: { note: 'Biến trở xoay 10 kΩ có núm (kiểu RV09).', parts: [
    box('body', [0, 4.2, -5.5], [10, 7, 10.5], [0.12, 0.3, 0.68], 0.1, 0.5),
    box('bracket', [0, 7.9, -5.5], [11, 0.6, 11], TIN, 0.85, 0.35),
    cyl('bushing', [0, 4.2, -12], 3.5, 3.5, 'z', TIN, METAL),
    cyl('shaft', [0, 4.2, -17.5], 3.0, 8, 'z', [0.82, 0.82, 0.84], METAL),
    cyl('knob', [0, 4.2, -18.5], 6.0, 7, 'z', [0.07, 0.07, 0.08], { roughness: 0.45, segments: 24 }),
    box('knob-mark', [0, 9.6, -21.9], [0.8, 1.6, 0.2], [0.95, 0.95, 0.95]),
    ...[-2.54, 0, 2.54].map((x, i) => leg(`leg${i}`, x, 0, 1.2, -3.5, 0.35)),
  ] },
  thermistor: { note: 'Nhiệt điện trở NTC dạng giọt epoxy (kiểu MF52).', modelNote: 'Hình dạng giọt epoxy minh họa. Không gắn mã B, R25 hay đường cong nhiệt độ cụ thể; xem datasheet linh kiện thật.', parts: [
    cyl('bead', [0, 8.6, 0], 1.9, 3.2, 'y', [0.08, 0.08, 0.09], { roughness: 0.35 }),
    cyl('bead-top', [0, 10.3, 0], 1.3, 0.6, 'y', [0.08, 0.08, 0.09], { roughness: 0.35 }),
    leg('leg-a', -1.27, 0, 7.4, -2), leg('leg-b', 1.27, 0, 7.4, -2),
    box('neck', [0, 7.4, 0], [3.0, 0.6, 0.6], [0.08, 0.08, 0.09]),
  ] },
  servo: { note: 'Servo micro 9 g kiểu SG90 (vỏ xanh, tai bắt vít, cánh tay và dây 3 màu).', parts: [
    box('case', [0, 11.3, 0], [22.6, 22.7, 11.8], [0.1, 0.28, 0.72], 0.05, 0.45),
    box('tabs', [0, 18.5, 0], [32.4, 2.4, 11.8], [0.1, 0.28, 0.72], 0.05, 0.45),
    box('label', [0, 11, 5.95], [16, 9, 0.1], [0.92, 0.92, 0.9]),
    cyl('top-boss', [-5.4, 24.2, 0], 5.9, 3, 'y', [0.1, 0.28, 0.72], { roughness: 0.45 }),
    cyl('spline', [-5.4, 27.2, 0], 2.4, 3, 'y', [0.92, 0.92, 0.9]),
    box('horn-arm', [-5.4, 29.3, 0], [20, 1.6, 4.6], [0.95, 0.95, 0.93]),
    cyl('horn-hub', [-5.4, 29.3, 0], 3.4, 2.2, 'y', [0.95, 0.95, 0.93]),
    box('wire-gnd', [16, 3, -1.3], [10, 1.1, 1.1], [0.42, 0.24, 0.12]), box('wire-vcc', [16, 3, 0], [10, 1.1, 1.1], [0.8, 0.12, 0.1]), box('wire-sig', [16, 3, 1.3], [10, 1.1, 1.1], [0.95, 0.6, 0.1]),
    box('plug', [21, 3, 0], [2, 2.6, 4.2], [0.05, 0.05, 0.06]),
  ] },
  'dc-motor': { note: 'Motor DC 130 có vỏ kim loại, nắp nhựa và 2 cực hàn.', parts: [
    cyl('can', [10, 7.6, 0], 10, 25, 'x', [0.78, 0.79, 0.8], { metallic: 0.85, roughness: 0.32, segments: 40 }),
    box('can-flat-top', [10, 15.6, 0], [25, 1.2, 15.2], [0.78, 0.79, 0.8], 0.85, 0.32),
    cyl('end-cap', [24, 7.6, 0], 9.6, 3.2, 'x', [0.88, 0.85, 0.75], { roughness: 0.5 }),
    cyl('shaft', [-6, 7.6, 0], 1, 8, 'x', [0.82, 0.82, 0.84], METAL),
    cyl('bearing', [-2.6, 7.6, 0], 3, 1.4, 'x', [0.7, 0.7, 0.72], METAL),
    box('tab-pos', [26.5, 11, -5], [3, 0.4, 2], [0.85, 0.65, 0.3], 0.85, 0.35), box('tab-neg', [26.5, 11, 5], [3, 0.4, 2], [0.85, 0.65, 0.3], 0.85, 0.35),
    box('red-dot', [25.7, 13.5, -5], [0.4, 1.2, 1.2], [0.8, 0.1, 0.1]),
  ] },
  'limit-switch': { note: 'Công tắc hành trình micro (KW11) có cần gạt và bánh xe.', modelNote: 'Hình dạng micro switch minh họa; vị trí chân COM/NO/NC và định mức thay đổi theo mã sản phẩm, đối chiếu ký hiệu in trên vỏ.', parts: [
    box('body', [0, 5, 3], [20, 10, 6.4], [0.06, 0.06, 0.07], 0.05, 0.45),
    box('plunger', [-4, 10.6, 3], [2, 1.4, 2], [0.85, 0.2, 0.15]),
    box('lever', [1.5, 11.9, 3], [17, 0.5, 4], TIN, 0.85, 0.3),
    cyl('roller', [10, 13.4, 3], 2.4, 3.6, 'z', [0.06, 0.06, 0.07]),
    ...[-5, 0, 5].map((x, i) => box(`tab${i}`, [x, 0.5, -3], [3.2, 1, 0.5], TIN, 0.85, 0.35)),
    ...[-5, 0, 5].map((x, i) => box(`tab-up${i}`, [x, 1.5, -1.5], [3.2, 3, 0.5], TIN, 0.85, 0.35)),
  ] },
  jumper: { note: 'Dây jumper Dupont đực–đực 10 cm (minh họa tham số).', parts: [
    box('housing-a', [-24, 4, 0], [2.5, 2.5, 14], [0.06, 0.06, 0.07]), box('housing-b', [24, 4, 0], [2.5, 2.5, 14], [0.06, 0.06, 0.07]),
    cyl('pin-a', [-24, 4, -9], 0.32, 5, 'z', [0.85, 0.7, 0.3], METAL), cyl('pin-b', [24, 4, -9], 0.32, 5, 'z', [0.85, 0.7, 0.3], METAL),
    cyl('wire-a', [-24, 4, 10], 0.65, 6, 'z', [0.85, 0.15, 0.12]), cyl('wire-mid', [0, 4, 13], 0.65, 48, 'x', [0.85, 0.15, 0.12]), cyl('wire-b', [24, 4, 10], 0.65, 6, 'z', [0.85, 0.15, 0.12]),
  ] },
  'power-bank': { note: 'Pin dự phòng USB 5 V (minh họa tham số).', parts: [
    box('shell', [0, 11, 0], [98, 22, 62], [0.14, 0.15, 0.17], 0.25, 0.35),
    box('face', [0, 22.05, 0], [92, 0.1, 56], [0.2, 0.21, 0.24], 0.4, 0.25),
    box('usb-a', [-49, 11, -12], [1, 4.6, 12.2], TIN, 0.9, 0.3), box('usb-a-tongue', [-49.2, 11, -12], [0.6, 1.8, 10.5], [0.1, 0.25, 0.7]),
    box('usb-c', [-49, 11, 12], [1, 3.2, 8.8], TIN, 0.9, 0.3),
    ...[0, 1, 2, 3].map((i) => box(`led${i}`, [-30 + i * 4, 22.1, 22], [2, 0.2, 1], [0.2, 0.75, 1.0])),
  ] },
  'usb-cable': { note: 'Cáp USB-A sang micro-USB (minh họa tham số).', parts: [
    box('usb-a-shell', [-40, 2.5, 0], [12, 4.5, 12], TIN, 0.9, 0.3), box('usb-a-grip', [-29, 4, 0], [10, 7, 15], [0.06, 0.06, 0.07]),
    cyl('cable', [0, 4, 0], 1.8, 48, 'x', [0.06, 0.06, 0.07], { roughness: 0.5 }),
    box('micro-grip', [29, 4, 0], [10, 6, 11], [0.06, 0.06, 0.07]), box('micro-shell', [37, 4, 0], [6, 1.8, 7], TIN, 0.9, 0.3),
  ] },
  'soil-relay-pump': { note: 'Bơm chìm mini 3–5 V và ống dẫn cho bộ tưới tự động (minh họa tham số).', parts: [
    cyl('pump-body', [0, 12, 0], 12, 24, 'y', [0.9, 0.9, 0.9], { roughness: 0.4 }),
    cyl('pump-base', [0, 1.5, 0], 12.6, 3, 'y', [0.12, 0.12, 0.13]),
    cyl('outlet', [9, 21, 0], 2.6, 14, 'x', [0.9, 0.9, 0.9]),
    cyl('hose', [26, 21, 0], 3.2, 22, 'x', [0.75, 0.88, 0.95], { roughness: 0.2 }),
    box('wire-red', [-14, 22, -1.2], [8, 1, 1], [0.8, 0.12, 0.1]), box('wire-black', [-14, 22, 1.2], [8, 1, 1], [0.06, 0.06, 0.07]),
  ] },
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(specs)
const work = mkdtempSync(join(tmpdir(), 'parts-'))
const server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
const { parseBoardGlb } = await server.ssrLoadModule('/src/components/board/glbParser.ts')
const manifestPath = 'src/data/component-models.manifest.json'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const round = (v) => Math.round(v * 100) / 100
for (const id of ids) {
  const spec = specs[id]
  writeFileSync(join(work, `${id}.json`), JSON.stringify(spec.parts))
  const file = `public/models/components/${id}.glb`
  execFileSync(process.execPath, ['scripts/make-primitive-part-glb.mjs', join(work, `${id}.json`), file])
  const bytes = readFileSync(file)
  const parsed = parseBoardGlb(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  const min = [0, 1, 2].map((i) => Math.min(...parsed.nodeBounds.map((n) => n.min[i])) * 1000), max = [0, 1, 2].map((i) => Math.max(...parsed.nodeBounds.map((n) => n.max[i])) * 1000)
  const entry = manifest.find((item) => item.id === id)
  const next = { ...(entry ?? { id, mount: 'bench', pinsMm: {}, legsMm: [] }), file: `/models/components/${id}.glb`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeMm: max.map((v, i) => round(v - min[i])), boundsMm: { min: min.map(round), max: max.map(round) }, triangles: Math.round(parsed.batches.reduce((s, b) => s + b.indices.length / 3, 0)),
    kind: 'parametric-mesh', packageName: spec.note, modelNote: spec.modelNote ?? 'Mạch Mở dựng chi tiết theo kích thước phổ biến vì không có model 3D nguồn mở phù hợp; module thật khác nhau về bố trí và kích thước.' }
  if (entry) manifest[manifest.indexOf(entry)] = next; else manifest.push(next)
  console.log(`${id}: ${next.sizeMm.join(' x ')} mm, ${next.triangles} tri`)
}
manifest.sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
await server.close()
