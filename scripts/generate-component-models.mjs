// Builds public/models/components/*.glb and src/data/component-models.manifest.json.
// Packages come from the KiCad 3D library (STEP); modules with no library model are
// parametric educational models built here from the dimensions listed below.
// Run from electronics-learning-demo: node scripts/generate-component-models.mjs
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const outputDir = join(root, 'public/models/components')
const kicadRoot = process.env.KICAD9_3DMODEL_DIR ?? 'C:/Program Files/KiCad/9.0/share/kicad/3dmodels'

// `pads` maps KiCad pad numbers to registry pin ids; pad positions come from the footprint.
const packages = [
  { id: 'led', step: 'LED_THT.3dshapes/LED_D5.0mm.step', footprint: 'LED_THT.pretty/LED_D5.0mm', packageName: 'LED tròn 5 mm', pads: { 1: 'cathode', 2: 'anode' } },
  { id: 'rgb-led', step: 'LED_THT.3dshapes/LED_D5.0mm-4_RGB_Wide_Pins.step', footprint: 'LED_THT.pretty/LED_D5.0mm-4_RGB_Wide_Pins', packageName: 'LED RGB 5 mm 4 chân', pads: { 1: 'red', 2: 'common', 3: 'green', 4: 'blue' } },
  { id: 'resistor', step: 'Resistor_THT.3dshapes/R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal.step', footprint: 'Resistor_THT.pretty/R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal', packageName: 'Điện trở trục DIN 0207', pads: { 1: 'a', 2: 'b' } },
  { id: 'capacitor', step: 'Capacitor_THT.3dshapes/CP_Radial_D8.0mm_P5.00mm.step', footprint: 'Capacitor_THT.pretty/CP_Radial_D8.0mm_P5.00mm', packageName: 'Tụ hóa Ø8 mm, chân 5 mm', pads: { 1: 'plus', 2: 'minus' } },
  { id: 'button', step: 'Button_Switch_THT.3dshapes/SW_PUSH_6mm.step', footprint: 'Button_Switch_THT.pretty/SW_PUSH_6mm', packageName: 'Nút nhấn 6 mm', pads: { 1: 'contactA', 2: 'contactB' } },
  { id: 'diode', step: 'Diode_THT.3dshapes/D_DO-41_SOD81_P10.16mm_Horizontal.step', footprint: 'Diode_THT.pretty/D_DO-41_SOD81_P10.16mm_Horizontal', packageName: 'Diode DO-41', pads: { 1: 'cathode', 2: 'anode' } },
  { id: 'transistor', step: 'Package_TO_SOT_THT.3dshapes/TO-92_Inline_Wide.step', footprint: 'Package_TO_SOT_THT.pretty/TO-92_Inline_Wide', packageName: 'Vỏ TO-92, chân 2,54 mm', pads: { 1: 'collector', 2: 'base', 3: 'emitter' } },
  { id: 'mosfet', step: 'Package_TO_SOT_THT.3dshapes/TO-220-3_Vertical.step', footprint: 'Package_TO_SOT_THT.pretty/TO-220-3_Vertical', packageName: 'Vỏ TO-220-3', pads: { 1: 'gate', 2: 'drain', 3: 'source' } },
  { id: 'ldr', step: 'OptoDevice.3dshapes/R_LDR_4.9x4.2mm_P2.54mm_Vertical.step', footprint: 'OptoDevice.pretty/R_LDR_4.9x4.2mm_P2.54mm_Vertical', packageName: 'LDR 4,9 × 4,2 mm', pads: { 1: 'a', 2: 'b' } },
  { id: 'buzzer', step: 'Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step', footprint: 'Buzzer_Beeper.pretty/Buzzer_12x9.5RM7.6', packageName: 'Buzzer Ø12 mm, chân 7,6 mm', pads: { 1: 'signal', 2: 'gnd' } },
  // Pin order follows the common 0.56 in single-digit package; the part's own datasheet still decides.
  { id: 'seven-segment', step: 'Display_7Segment.3dshapes/7SegmentLED_LTS6760_LTS6780.step', footprint: 'Display_7Segment.pretty/7SegmentLED_LTS6760_LTS6780', packageName: 'LED 7 đoạn 0,56 inch, gói LTS-6760', pads: { 1: 'e', 2: 'd', 3: 'com1', 4: 'c', 5: 'dp', 6: 'b', 7: 'a', 8: 'com2', 9: 'f', 10: 'g' } },
  { id: 'slide-switch', step: 'Button_Switch_THT.3dshapes/SW_Slide_SPDT_Straight_CK_OS102011MS2Q.step', footprint: 'Button_Switch_THT.pretty/SW_Slide_SPDT_Straight_CK_OS102011MS2Q', packageName: 'Công tắc gạt SPDT OS102011MS2Q', pads: { 1: 'a', 2: 'common', 3: 'b' } },
]

const footprintRoot = process.env.KICAD9_FOOTPRINT_DIR ?? 'C:/Program Files/KiCad/9.0/share/kicad/footprints'

/** Through-hole pads as {pinId, x, z}. KiCad footprint Y points the same way as model +Z after our rotation. */
async function footprintLegs(item) {
  const text = await readFile(`${footprintRoot}/${item.footprint}.kicad_mod`, 'utf8')
  const legs = []
  for (const match of text.matchAll(/\(pad "(\d+)" thru_hole [a-z_]+\s*\(at ([-\d.]+) ([-\d.]+)/g)) {
    const pinId = item.pads[match[1]]
    if (pinId) legs.push({ pinId, x: Number(match[2]), z: Number(match[3]) })
  }
  if (!legs.length) throw new Error(`${item.footprint}: không đọc được pad`)
  return legs
}

const pinsFromLegs = (legs) => Object.fromEntries(legs.map((leg) => [leg.pinId, [leg.x, 0, leg.z]]).reverse())
const breadboardMounted = new Set(['led', 'rgb-led', 'resistor', 'capacitor', 'button', 'diode', 'transistor', 'mosfet', 'ldr', 'buzzer', 'seven-segment', 'slide-switch'])

const PITCH = 2.54
const breadboardGrid = {
  pitch: PITCH, columns: 30, topY: 8.5,
  firstColumnX: -14.5 * PITCH,
  // Five rows either side of a 0.3 in centre gap, so a DIP package straddles rows e and f.
  rows: [-13.97, -11.43, -8.89, -6.35, -3.81, 3.81, 6.35, 8.89, 11.43, 13.97],
  rails: [-22.86, -20.32, 20.32, 22.86],
}

/** Where wires and legs meet each parametric model, in the model's own millimetres. */
const parametricPins = {
  ultrasonic: { mount: 'breadboard', pins: { vcc: [-3.81, 0, 0], trig: [-1.27, 0, 0], echo: [1.27, 0, 0], gnd: [3.81, 0, 0] } },
  potentiometer: { mount: 'breadboard', pins: { vcc: [-2.54, 0, 0], wiper: [0, 0, 0], gnd: [2.54, 0, 0] } },
  thermistor: { mount: 'breadboard', pins: { a: [-1.27, 0, 0], b: [1.27, 0, 0] } },
  'limit-switch': { mount: 'bench', pins: { com: [-5, 2, -6], no: [0, 2, -6], nc: [5, 2, -6] } },
  dht22: { mount: 'bench', pins: { vcc: [-2.54, 2, -7.62], data: [0, 2, -7.62], gnd: [2.54, 2, -7.62] } },
  pir: { mount: 'bench', pins: { vcc: [-2.54, 2, -10.16], out: [0, 2, -10.16], gnd: [2.54, 2, -10.16] } },
  'photoresistor-module': { mount: 'bench', pins: { vcc: [-3.81, 2, -7.62], gnd: [-1.27, 2, -7.62], ao: [1.27, 2, -7.62], do: [3.81, 2, -7.62] } },
  soil: { mount: 'bench', pins: { vcc: [-2.54, 2, -7.62], gnd: [0, 2, -7.62], aout: [2.54, 2, -7.62] } },
  mpu6050: { mount: 'bench', pins: { vcc: [-5.08, 2, -7.62], gnd: [-2.54, 2, -7.62], sda: [0, 2, -7.62], scl: [2.54, 2, -7.62], int: [5.08, 2, -7.62] } },
  bmp280: { mount: 'bench', pins: { vcc: [-6.35, 2, -7.62], gnd: [-3.81, 2, -7.62], scl: [-1.27, 2, -7.62], sda: [1.27, 2, -7.62], csb: [3.81, 2, -7.62], sdo: [6.35, 2, -7.62] } },
  'ir-receiver': { mount: 'bench', pins: { out: [-2.54, 2, -7.62], gnd: [0, 2, -7.62], vcc: [2.54, 2, -7.62] } },
  lcd1602: { mount: 'bench', pins: { gnd: [-3.81, 2, -18], vcc: [-1.27, 2, -18], sda: [1.27, 2, -18], scl: [3.81, 2, -18] } },
  'rotary-encoder': { mount: 'bench', pins: { clk: [-5.08, 2, -7.62], dt: [-2.54, 2, -7.62], sw: [0, 2, -7.62], vcc: [2.54, 2, -7.62], gnd: [5.08, 2, -7.62] } },
  rfid: { mount: 'bench', pins: { sda: [-8.89, 2, -15.24], sck: [-6.35, 2, -15.24], mosi: [-3.81, 2, -15.24], miso: [-1.27, 2, -15.24], irq: [1.27, 2, -15.24], gnd: [3.81, 2, -15.24], rst: [6.35, 2, -15.24], vcc: [8.89, 2, -15.24] } },
  oled: { mount: 'breadboard', pins: { vcc: [-3.81, 0, 0], gnd: [-1.27, 0, 0], sda: [1.27, 0, 0], scl: [3.81, 0, 0] } },
  tb6612: { mount: 'breadboard', pins: { vm: [-8.89, 0, -8.89], vcc: [-6.35, 0, -8.89], gnd: [-3.81, 0, -8.89], a01: [-1.27, 0, -8.89], a02: [1.27, 0, -8.89], stby: [-1.27, 0, 8.89], ain1: [1.27, 0, 8.89], ain2: [3.81, 0, 8.89], pwma: [6.35, 0, 8.89] } },
  'ir-sensor': { mount: 'bench', pins: { out: [-23, 3, -2.54], gnd: [-23, 3, 0], vcc: [-23, 3, 2.54] } },
  'buck-converter': { mount: 'bench', pins: { inPlus: [-20, 1.7, -8.5], inMinus: [-20, 1.7, 8.5], outPlus: [20, 1.7, -8.5], outMinus: [20, 1.7, 8.5] } },
  'boost-converter': { mount: 'bench', pins: { inPlus: [-16, 1.7, -6.5], inMinus: [-16, 1.7, 6.5], outPlus: [16, 1.7, -6.5], outMinus: [16, 1.7, 6.5] } },
  relay: { mount: 'bench', pins: { in: [-31, 3, -2.54], vcc: [-31, 3, 0], gnd: [-31, 3, 2.54], com: [15, 9.5, 0], no: [20, 9.5, 0], nc: [25, 9.5, 0] } },
  'h-bridge': { mount: 'bench', pins: { in1: [-9, 8, 8], in2: [-6.46, 8, 8], ena: [-3.92, 8, 8], motorVcc: [-5, 9.5, 18], gnd: [0, 9.5, 18], logicVcc: [5, 9.5, 18], out1: [-21.5, 9.5, -6], out2: [-16.5, 9.5, -6] } },
  servo: { mount: 'bench', pins: { gnd: [21, 3, -1.3], vcc: [21, 3, 0], signal: [21, 3, 1.3] } },
  'dc-motor': { mount: 'bench', pins: { positive: [26.5, 11, -5], negative: [26.5, 11, 5] } },
  battery: { mount: 'bench', pins: { positive: [49, 2, -6], negative: [49, 2, 6] } },
  breadboard: { mount: 'bench', pins: {} },
}

const parametricNotes = {
  thermistor: 'Hạt NTC 2 chân dạng epoxy để minh họa hình dáng. Không gắn mã B, dải nhiệt, đường cong R/T hay kích thước của một nhà sản xuất cụ thể.',
  'limit-switch': 'Microswitch cần gạt minh họa với COM/NO/NC. Kích thước, lực nhấn, hành trình và sơ đồ chân cần đối chiếu đúng mã linh kiện thật.',
  dht22: 'Minh họa module cảm biến nhiệt độ/độ ẩm dạng phổ biến; không phải CAD AM2302 của hãng. Số chân và kích thước breakout thay đổi theo phiên bản.',
  pir: 'Minh họa module PIR phổ biến có chụp cảm biến và biến trở; không đại diện mã HC-SR501 hay pinout cụ thể.',
  'photoresistor-module': 'Minh họa breakout LDR với comparator và chân AO/DO; không đại diện một sơ đồ hoặc kích thước module cụ thể.',
  soil: 'Minh họa đầu dò độ ẩm đất điện dung dạng bảng; hình học, lớp phủ và mạch đầu ra tùy nhà sản xuất.',
  mpu6050: 'Minh họa breakout IMU loại nhỏ; không xác nhận chip, regulator, mức điện áp hoặc pinout của một board MPU-6050 cụ thể.',
  bmp280: 'Minh họa breakout cảm biến áp suất; không phân biệt chính xác BMP280/BME280 hay pinout module cụ thể.',
  'ir-receiver': 'Minh họa bộ thu IR 3 chân dạng package; thứ tự chân phụ thuộc đúng mã và hướng nhìn datasheet.',
  lcd1602: 'Minh họa LCD ký tự 16×2 có backpack I²C; controller, địa chỉ, pinout và điện áp tùy module.',
  'rotary-encoder': 'Minh họa encoder xoay breakout phổ biến; không xác nhận sơ đồ chân hoặc kích thước KY-040 của một nhà sản xuất cụ thể.',
  rfid: 'Minh họa breakout RFID với anten vòng và header; không phải CAD RC522 cụ thể, không xác nhận chip, anten hay pinout.',
}

const color = { pcbBlue: [0.05, 0.2, 0.5], pcbGreen: [0.05, 0.32, 0.2], pcbRed: [0.55, 0.08, 0.08], pcbBlack: [0.07, 0.08, 0.09], gold: [0.82, 0.66, 0.3], silver: [0.72, 0.74, 0.76], steel: [0.5, 0.52, 0.55], black: [0.06, 0.06, 0.07], dark: [0.14, 0.15, 0.17], blue: [0.1, 0.3, 0.75], white: [0.9, 0.9, 0.86], red: [0.75, 0.12, 0.1], orange: [0.9, 0.5, 0.12], brown: [0.32, 0.18, 0.1], copper: [0.72, 0.42, 0.2], clear: [0.72, 0.8, 0.84], yellow: [0.85, 0.72, 0.2] }

function box(cx, cy, cz, w, h, d) {
  const [x0, x1, y0, y1, z0, z1] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2, cz - d / 2, cz + d / 2]
  const faces = [[[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0]], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]]]
  const positions = [], normals = [], indices = []
  for (const [a, b, c, d2, n] of faces) {
    const base = positions.length / 3
    positions.push(...a, ...b, ...c, ...d2)
    normals.push(...n, ...n, ...n, ...n)
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  return { positions, normals, indices }
}

/** Lathe around Y through (radius, height) points; a sharp edge is a repeated point. */
function lathe(cx, cy, cz, profile, { segments = 28, axis = 'y', squash = 1 } = {}) {
  const positions = [], normals = [], indices = []
  const place = (radial, height, angle) => {
    const a = radial * Math.cos(angle), b = radial * Math.sin(angle)
    if (axis === 'y') return [cx + a, cy + height, cz + b]
    if (axis === 'x') return [cx + height, cy + a * squash, cz + b]
    return [cx + a, cy + b * squash, cz + height]
  }
  for (let run = 0; run + 1 < profile.length; run += 1) {
    const [r0, y0] = profile[run], [r1, y1] = profile[run + 1]
    if (r0 === r1 && y0 === y1) continue
    const length = Math.hypot(r1 - r0, y1 - y0), nr = (y1 - y0) / length, ny = (r0 - r1) / length
    const base = positions.length / 3
    for (let step = 0; step <= segments; step += 1) {
      const angle = (step / segments) * Math.PI * 2
      positions.push(...place(r0, y0, angle), ...place(r1, y1, angle))
      const n = place(nr, ny, angle).map((value, index) => value - [cx, cy, cz][index])
      const size = Math.hypot(...n) || 1
      normals.push(...n.map((value) => value / size), ...n.map((value) => value / size))
    }
    for (let step = 0; step < segments; step += 1) {
      const a = base + step * 2
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
    }
  }
  return { positions, normals, indices }
}

const cylinder = (cx, cy, cz, r, h, options) => lathe(cx, cy, cz, [[0, h], [r, h], [r, h], [r, 0], [r, 0], [0, 0]], options)
const pinRow = (x0, z, count, pitch, top, bottom) => Array.from({ length: count }, (_, index) => box(x0 + index * pitch, (top + bottom) / 2, z, 0.64, top - bottom, 0.64))
const screwTerminal = (cx, cz, ways) => [[color.blue, [box(cx, 5.4, cz, ways * 5, 7.6, 7.5)]], [color.silver, Array.from({ length: ways }, (_, index) => cylinder(cx + (index - (ways - 1) / 2) * 5, 9.2, cz, 1.5, 0.3))]]

function merge(items) {
  const positions = [], normals = [], indices = []
  for (const item of items) {
    const base = positions.length / 3
    positions.push(...item.positions)
    normals.push(...item.normals)
    indices.push(...item.indices.map((value) => value + base))
  }
  return { positions: new Float32Array(positions.map((value) => value / 1000)), normals: new Float32Array(normals), indices: new Uint16Array(indices) }
}

const pcb = (w, d, tint) => [tint, [box(0, 0.8, 0, w, 1.6, d)]]
const part = (name, groups, metallic = 0.08) => ({ name, primitives: groups.map(([tint, items, metal]) => ({ ...merge(items), color: tint, metallic: metal ?? metallic })) })

function breadboardHoles() {
  const holes = []
  for (const row of breadboardGrid.rows) for (let column = 0; column < breadboardGrid.columns; column += 1) holes.push(box(breadboardGrid.firstColumnX + column * PITCH, 8.46, row, 1, 0.1, 1))
  for (const row of breadboardGrid.rails) for (let column = 0; column < 25; column += 1) holes.push(box(-30.48 + column * PITCH, 8.46, row, 1, 0.1, 1))
  return holes
}

const parametric = {
  // Stands on its pins like the real module, so the transducers face along +Z.
  ultrasonic: [part('pcb', [[color.pcbBlue, [box(0, 12.5, 0, 45, 20, 1.6)]]]), part('transducers', [[color.silver, [cylinder(-13, 12.5, 0.8, 8, 12, { axis: 'z' }), cylinder(13, 12.5, 0.8, 8, 12, { axis: 'z' })], 0.6], [color.dark, [cylinder(-13, 12.5, 12.8, 6.8, 0.15, { axis: 'z' }), cylinder(13, 12.5, 12.8, 6.8, 0.15, { axis: 'z' })]]]), part('crystal', [[color.silver, [box(0, 19, 1.8, 11, 4.5, 2.4)], 0.6]]), part('pins', [[color.gold, pinRow(-3.81, 0, 4, 2.54, 2.5, -6), 0.5], [color.black, [box(0, 1.25, 0, 10.2, 2.5, 2.5)]]])],
  'ir-sensor': [part('pcb', [pcb(32, 14, color.pcbBlue)]), part('ir-emitter', [[color.clear, [lathe(16, 4.5, -3, [[0, 0], [2.5, 0], [2.5, 0], [2.5, 7], [2.5, 7], [0, 9.5]], { axis: 'x' })]]]), part('ir-receiver', [[color.black, [lathe(16, 4.5, 3, [[0, 0], [2.5, 0], [2.5, 0], [2.5, 7], [2.5, 7], [0, 9.5]], { axis: 'x' })]]]), part('trimmer', [[color.blue, [box(2, 4.1, 0, 7, 5, 7)]], [color.gold, [cylinder(2, 6.6, 0, 1.3, 0.5)], 0.5]]), part('comparator', [[color.black, [box(-6, 2.3, 3.5, 5, 1.4, 4)]]]), part('pins', [[color.gold, [0, 1, 2].map((index) => box(-19, 3, (index - 1) * 2.54, 8, 0.64, 0.64)), 0.5]])],
  potentiometer: [part('body', [[color.blue, [box(0, 3.25, -5, 9.8, 6.5, 11)]]]), part('shaft', [[color.silver, [cylinder(0, 6.5, -5.5, 3.5, 2)], 0.6], [color.steel, [cylinder(0, 8.5, -5.5, 3, 5)], 0.6]]), part('knob', [[color.dark, [lathe(0, 10, -5.5, [[0, 9], [5.5, 9], [5.5, 9], [6.5, 0], [6.5, 0], [0, 0]])]], [color.white, [box(0, 19.05, -8.2, 0.9, 0.1, 5)]]]), part('pins', [[color.gold, [-2.54, 0, 2.54].map((x) => box(x, -1.75, 0, 1, 3.5, 0.5)), 0.5]])],
  thermistor: [part('epoxy-bead', [[color.dark, [lathe(0, 4.2, 0, [[0, 0], [1.8, 0], [1.8, 0], [2.1, 2.4], [1.65, 5.4], [0.8, 6.4], [0, 6.4]])]]]), part('leads', [[color.gold, [box(-1.27, 0, 0, 0.45, 4, 0.45), box(1.27, 0, 0, 0.45, 4, 0.45)], 0.5]])],
  'limit-switch': [part('switch-body', [[color.black, [box(0, 4, 0, 20, 8, 10)]]]), part('plunger', [[color.red, [cylinder(0, 8, 0, 2.1, 2.2)]]]), part('lever', [[color.silver, [box(0, 13.5, 5, 1.2, 1.1, 13), box(0, 15.2, 11, 7, 0.8, 2)]], [color.steel, [cylinder(0, 14, 11, 1.7, 1.2)], 0.55]]), part('terminals', [[color.gold, [-5, 0, 5].map((x) => box(x, 1.5, -6, 1.2, 3, 1.2)), 0.5]])],
  dht22: [part('sensor-case', [[color.white, [box(0, 9, 0, 15, 12, 18)]], [color.dark, [-5, -2, 1, 4].map((z) => box(0, 9, z, 9, 0.3, 0.8))]]), part('pins', [[color.gold, [-2.54, 0, 2.54].map((x) => box(x, 0, -7.62, 0.64, 8, 0.64)), 0.5]])],
  pir: [part('pcb', [pcb(32, 24, color.pcbBlue)]), part('fresnel-dome', [[color.white, [lathe(0, 4, 0, [[0, 0], [8, 0], [10, 1], [10, 3], [8, 5], [0, 6]])]]]), part('trimmers', [[color.blue, [-8, 8].map((x) => box(x, 5, -7, 5, 3, 5))], [color.silver, [-8, 8].map((x) => cylinder(x, 7, -7, 1.2, 0.6))]]), part('header', [[color.gold, pinRow(-2.54, -10.16, 3, 2.54, 3, -4), 0.5]])],
  'photoresistor-module': [part('pcb', [pcb(22, 18, color.pcbBlue)]), part('ldr', [[color.dark, [cylinder(-6, 4, -1, 3, 3)]], [color.silver, [cylinder(-6, 5.6, -1, 2.5, 0.3)], 0.5]]), part('trimmer', [[color.blue, [box(6, 4, 3, 5, 3, 5)]], [color.gold, [cylinder(6, 5.6, 3, 1, 0.5)], 0.5]]), part('comparator', [[color.black, [box(1, 4, -3, 5, 1.2, 4)]]]), part('header', [[color.gold, pinRow(-3.81, -7.62, 4, 2.54, 3, -4), 0.5]])],
  soil: [part('probe-pcb', [[color.pcbGreen, [box(0, 1, 0, 14, 2, 66)]], [color.copper, [-3.5, 3.5].map((x) => box(x, 2.1, 0, 0.55, 0.2, 54)), 0.5]]), part('connector-pcb', [pcb(16, 16, color.pcbBlue)]), part('connector-header', [[color.gold, pinRow(-2.54, -7.62, 3, 2.54, 3, -4), 0.5]])],
  mpu6050: [part('pcb', [pcb(20, 16, color.pcbBlue)]), part('imu-package', [[color.black, [box(0, 4, 0, 6, 2, 6)]], [color.silver, [box(0, 5.1, 0, 3.5, 0.2, 3.5)], 0.45]]), part('header', [[color.gold, pinRow(-5.08, -7.62, 5, 2.54, 3, -4), 0.5]])],
  bmp280: [part('pcb', [pcb(24, 16, color.pcbRed)]), part('sensor-package', [[color.black, [box(0, 4, 1, 5, 2, 5)]]]), part('header', [[color.gold, pinRow(-6.35, -7.62, 6, 2.54, 3, -4), 0.5]])],
  'ir-receiver': [part('receiver-package', [[color.black, [box(0, 4, 0, 5, 8, 4)]], [color.dark, [box(0, 5.4, 2.1, 3.8, 4.8, 0.4)]]]), part('leads', [[color.gold, [-2.54, 0, 2.54].map((x) => box(x, 0, -7.62, 0.6, 8, 0.6)), 0.5]])],
  lcd1602: [part('lcd-pcb', [[color.pcbBlue, [box(0, 2, 0, 80, 3, 36)]]]), part('display-glass', [[color.dark, [box(0, 5, 0, 72, 2, 23)]], [color.pcbGreen, [box(0, 6.1, 0, 66, 0.3, 18)]]]), part('pixel-matrix', [[color.dark, Array.from({ length: 32 }, (_, index) => box(-28 + (index % 16) * 3.7, 6.35, -5.2 + Math.floor(index / 16) * 8, 1.6, 0.2, 4.5))]]), part('backpack', [[color.pcbGreen, [box(0, 1, 19, 28, 2, 8)]], [color.black, [box(0, 2.5, 19, 8, 1.2, 6)]]]), part('header', [[color.gold, pinRow(-3.81, -18, 4, 2.54, 3, -4), 0.5]])],
  'rotary-encoder': [part('pcb', [pcb(24, 18, color.pcbBlue)]), part('encoder-body', [[color.silver, [cylinder(0, 7, 0, 6.5, 6)], 0.55], [color.dark, [cylinder(0, 10, 0, 4.8, 1)]]]), part('shaft', [[color.steel, [cylinder(0, 16, 0, 2.2, 12)], 0.55]]), part('header', [[color.gold, pinRow(-5.08, -7.62, 5, 2.54, 3, -4), 0.5]])],
  rfid: [part('pcb', [pcb(40, 60, color.pcbBlue)]), part('antenna-coil', [[color.copper, [box(0, 3.8, 0, 32, 0.35, 0.6), box(0, 3.8, 0, 0.6, 0.35, 50), box(-15.7, 3.8, 0, 0.6, 0.35, 50), box(0, 3.8, -24.7, 32, 0.35, 0.6), box(0, 3.8, 24.7, 32, 0.35, 0.6)], 0.65]]), part('controller', [[color.black, [box(0, 4.6, -12, 8, 1.6, 8)]]]), part('header', [[color.gold, pinRow(-8.89, -15.24, 8, 2.54, 3, -4), 0.5]])],
  servo: [part('body', [[color.blue, [box(0, 11.35, 0, 22.2, 22.7, 11.8), box(0, 18.5, 0, 32.2, 2.5, 11.8)]]]), part('spindle', [[color.white, [cylinder(-5.4, 22.7, 0, 5.9, 4), cylinder(-5.4, 26.7, 0, 2.4, 4.3)]]]), part('horn', [[color.white, [box(-5.4, 30.1, 0, 18, 1.6, 4.5), cylinder(-5.4, 29.3, 0, 3.4, 1.7)]]]), part('wires', [[color.brown, [box(16, 3, -1.3, 10, 1.2, 1.2)]], [color.red, [box(16, 3, 0, 10, 1.2, 1.2)]], [color.orange, [box(16, 3, 1.3, 10, 1.2, 1.2)]]])],
  'dc-motor': [part('can', [[color.silver, [cylinder(0, 7.6, 0, 10, 25, { axis: 'x', squash: 0.76 })], 0.6]]), part('end-cap', [[color.dark, [cylinder(-3.5 + 25, 7.6, 0, 8, 2, { axis: 'x', squash: 0.76 })]]]), part('shaft', [[color.steel, [cylinder(-8, 7.6, 0, 1, 8, { axis: 'x' })], 0.6]]), part('terminals', [[color.gold, [box(26.5, 11, -5, 3, 0.4, 2), box(26.5, 11, 5, 3, 0.4, 2)], 0.5]])],
  oled: [part('pcb', [[color.pcbBlue, [box(0, 8.3, 12.6, 27.3, 1.6, 27.8)]]]), part('glass', [[color.dark, [box(0, 9.8, 13.6, 26.7, 1.4, 19.3)]], [color.black, [box(0, 10.55, 12.8, 22, 0.1, 11.2)]]]), part('pins', [[color.gold, pinRow(-3.81, 0, 4, 2.54, 9, -6), 0.5], [color.black, [box(0, 6.2, 0, 10.2, 2.5, 2.5)]]])],
  'buck-converter': [part('pcb', [pcb(43, 21, color.pcbBlue)]), part('inductor', [[color.dark, [cylinder(-4, 1.6, 0, 6.5, 6.5)]], [color.copper, [lathe(-4, 8.1, 0, [[3, 0], [5.8, 0], [5.8, 0], [5.8, 0.15]])]]]), part('capacitors', [[color.black, [cylinder(-17, 1.6, 5, 4, 10.5), cylinder(16, 1.6, 5, 4, 10.5)]], [color.silver, [cylinder(-17, 12.1, 5, 3.4, 0.2), cylinder(16, 12.1, 5, 3.4, 0.2)], 0.6]]), part('regulator', [[color.black, [box(10, 3.1, -4, 10, 3, 9)]]]), part('trimmer', [[color.blue, [box(16, 4, -7, 9.5, 4.8, 4.5)]], [color.gold, [cylinder(20, 4, -7, 0.9, 1.5, { axis: 'x' })], 0.5]]), part('pads', [[color.gold, [[-20, -8.5], [-20, 8.5], [20, -8.5], [20, 8.5]].map(([x, z]) => cylinder(x, 1.6, z, 1.5, 0.1)), 0.5]])],
  'boost-converter': [part('pcb', [pcb(36, 17, color.pcbBlue)]), part('inductor', [[color.dark, [box(-5, 3.5, 2, 12, 3.8, 12)]]]), part('regulator', [[color.black, [box(8, 2.1, 4, 3, 1, 3)]]]), part('trimmer', [[color.blue, [box(7, 4, -4, 9.5, 4.8, 4.5)]], [color.gold, [cylinder(11, 4, -4, 0.9, 1.5, { axis: 'x' })], 0.5]]), part('pads', [[color.gold, [[-16, -6.5], [-16, 6.5], [16, -6.5], [16, 6.5]].map(([x, z]) => cylinder(x, 1.6, z, 1.5, 0.1)), 0.5]])],
  relay: [part('pcb', [pcb(50, 26, color.pcbBlue)]), part('relay', [[color.blue, [box(3, 9.35, 0, 19, 15.5, 15.5)]]]), part('terminal', screwTerminal(20, 0, 3).map(([tint, items]) => [tint, items.map((item, index) => item)])), part('driver', [[color.black, [box(-13, 3, 6, 4, 2.8, 3)]], [color.red, [cylinder(-15, 1.6, -7, 1.2, 1.2)]]]), part('pins', [[color.gold, [0, 1, 2].map((index) => box(-27, 3, (index - 1) * 2.54, 8, 0.64, 0.64)), 0.5]])],
  tb6612: [part('pcb', [[color.pcbRed, [box(0, 3.3, 0, 20.3, 1.6, 20.3)]]]), part('driver', [[color.black, [box(0, 4.7, 0, 7.6, 1.2, 5.3)]]]), part('capacitors', [[color.dark, [box(-5, 4.7, 5, 3.2, 1.4, 1.8), box(5, 4.7, 5, 3.2, 1.4, 1.8)]]]), part('pins', [[color.gold, [...pinRow(-8.89, -8.89, 8, 2.54, 4, -6), ...pinRow(-8.89, 8.89, 8, 2.54, 4, -6)], 0.5]])],
  'h-bridge': [part('pcb', [pcb(43, 43, color.pcbRed)]), part('heatsink', [[color.black, [box(0, 13.5, -14, 23, 24, 3), ...[-9, -4.5, 0, 4.5, 9].map((x) => box(x, 13.5, -18, 2.4, 24, 6))]]]), part('driver', [[color.dark, [box(0, 8, -11, 19.6, 13, 4.5)]]]), part('capacitors', [[color.black, [cylinder(-13, 1.6, 8, 4, 11), cylinder(13, 1.6, 8, 4, 11)]]]), part('terminals', [...screwTerminal(-19, -6, 2).map(([tint, items]) => [tint, items.map((item) => item)]), ...screwTerminal(0, 18, 3), ...screwTerminal(19, -6, 2)]), part('pins', [[color.gold, pinRow(-9, 8, 6, 2.54, 8, 1.6), 0.5]])],
  breadboard: [part('body', [[color.white, [box(0, 4.2, 0, 83, 8.4, 55)]], [color.dark, [box(0, 8.45, 0, 80, 0.05, 4.2)]]]), part('rails', [[color.red, [box(0, 8.45, -25, 72, 0.05, 0.6), box(0, 8.45, 18, 72, 0.05, 0.6)]], [color.blue, [box(0, 8.45, -18, 72, 0.05, 0.6), box(0, 8.45, 25, 72, 0.05, 0.6)]]]), part('holes', [[color.dark, breadboardHoles()]])],
  battery: [part('holder', [[color.black, [box(0, 1, 0, 57, 2, 32), box(0, 6.5, -15.2, 57, 13, 1.6), box(0, 6.5, 15.2, 57, 13, 1.6), box(-27.7, 6.5, 0, 1.6, 13, 32), box(27.7, 6.5, 0, 1.6, 13, 32)]]]), part('cells', [[color.pcbGreen, [cylinder(-24.5, 9.5, -7.3, 7.2, 49, { axis: 'x' }), cylinder(-24.5, 9.5, 7.3, 7.2, 49, { axis: 'x' })]], [color.silver, [cylinder(24.5, 9.5, -7.3, 2.6, 1.5, { axis: 'x' })], 0.6]]), part('wires', [[color.red, [box(38, 2, -6, 22, 1.4, 1.4)]], [color.black, [box(38, 2, 6, 22, 1.4, 1.4)]]])],
}

// TB6612 has more header pins than the lesson names; the rest still occupy holes.
const parametricLegs = (id, pins) => {
  const named = Object.entries(pins).map(([pinId, [x, , z]]) => ({ pinId, x, z }))
  if (id !== 'tb6612') return named
  const spare = []
  for (const z of [-8.89, 8.89]) for (let index = 0; index < 8; index += 1) { const x = -8.89 + index * 2.54; if (!named.some((leg) => Math.abs(leg.x - x) < 0.01 && leg.z === z)) spare.push({ pinId: `nc-${z < 0 ? 'a' : 'b'}${index}`, x, z }) }
  return [...named, ...spare]
}

const sizeOf = (parts) => {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  let triangles = 0
  for (const item of parts) for (const primitive of item.primitives) {
    triangles += primitive.indices.length / 3
    for (let index = 0; index < primitive.positions.length; index += 1) {
      const axis = index % 3
      min[axis] = Math.min(min[axis], primitive.positions[index])
      max[axis] = Math.max(max[axis], primitive.positions[index])
    }
  }
  return { sizeMm: max.map((value, axis) => +((value - min[axis]) * 1000).toFixed(2)), boundsMm: { min: min.map((value) => +(value * 1000).toFixed(3)), max: max.map((value) => +(value * 1000).toFixed(3)) }, triangles }
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
await mkdir(outputDir, { recursive: true })
const manifest = []
const emit = async (id, parts, entry) => {
  const glb = writeGlb(parts, { rootName: id, generator: 'Mạch Mở component models', extras: { outputUnits: 'm' } })
  await writeFile(join(outputDir, `${id}.glb`), glb)
  manifest.push({ id, file: `/models/components/${id}.glb`, bytes: glb.length, sha256: sha256(glb), ...sizeOf(parts), ...entry })
}

const previous = existsSync(join(root, 'src/data/component-models.manifest.json')) ? JSON.parse(await readFile(join(root, 'src/data/component-models.manifest.json'), 'utf8')) : []
const occt = await occtFactory()
for (const item of packages) {
  const path = `${kicadRoot}/${item.step}`
  if (!existsSync(path)) {
    const kept = previous.find((entry) => entry.id === item.id)
    if (!kept) throw new Error(`Thiếu ${path}`)
    manifest.push(kept)
    console.log(`${item.id}: giữ GLB đã có vì không có thư viện KiCad trên máy này`)
    continue
  }
  const bytes = await readFile(path)
  const result = occt.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio', linearDeflection: 0.002, angularDeflection: 0.35 })
  if (!result.success || !result.meshes?.length) throw new Error(`Không đọc được ${item.step}`)
  // KiCad models are Z-up on the board plane. Rotate to Y-up; do not swap axes.
  const parts = result.meshes.map((mesh, index) => ({ name: `${item.id}-${index + 1}`, primitives: primitivesFromStepMesh(mesh, (x, y, z) => [x, z, -y]) }))
  const legs = await footprintLegs(item)
  await emit(item.id, parts, { kind: 'source-cad-mesh', packageName: item.packageName, sourceFile: item.step, sourceSha256: sha256(bytes), footprint: `${item.footprint}.kicad_mod`, mount: breadboardMounted.has(item.id) ? 'breadboard' : 'bench', pinsMm: pinsFromLegs(legs), legsMm: legs })
}
for (const [id, parts] of Object.entries(parametric)) {
  const { mount, pins } = parametricPins[id]
  await emit(id, parts, { kind: 'parametric-mesh', mount, pinsMm: pins, legsMm: mount === 'breadboard' ? parametricLegs(id, pins) : [], ...(parametricNotes[id] ? { modelNote: parametricNotes[id] } : {}), ...(id === 'breadboard' ? { gridMm: breadboardGrid } : {}) })
}
manifest.sort((a, b) => a.id.localeCompare(b.id))
await writeFile(join(root, 'src/data/component-models.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(join(outputDir, 'NOTICE.txt'), `Mạch Mở component models

Files listed as "source-cad-mesh" in src/data/component-models.manifest.json are adapted from the KiCad 3D model
library (kicad-packages3D, shipped with KiCad 9.0) by the KiCad Libraries contributors:
https://gitlab.com/kicad/libraries/kicad-packages3D
License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/
Terms: https://www.kicad.org/libraries/license/
Changes: STEP tessellated to GLB, rotated to Y-up, scaled to metres. These adapted files
remain under CC BY-SA 4.0.

Files listed as "parametric-mesh" were generated by scripts/generate-component-models.mjs
as educational approximations. They are not manufacturer CAD.
`)
for (const item of manifest) console.log(`${item.id.padEnd(16)} ${item.kind.padEnd(16)} ${item.sizeMm.join(' x ').padEnd(24)} ${String(item.triangles).padStart(6)} tri ${(item.bytes / 1024).toFixed(0).padStart(5)} KB`)
