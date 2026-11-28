import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitiveParts } from './make-primitive-part-glb.mjs'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'
import { approval, loadRemainingCatalog, sha256 } from './remaining-catalog-inputs.mjs'
import { a1Approval, loadApprovedA1 } from './approved-a1-inputs.mjs'

const [library, layoutFile] = process.argv.slice(2)
if (!library || !layoutFile) throw new Error('Pass the KiCad library and verified-layouts.json from the layout extractor')
const config = await loadRemainingCatalog(library)
const f401Only = process.argv.includes('--a1-f401')
const f401 = f401Only ? (await loadApprovedA1()).catalog.nucleoF401 : undefined
if (f401) {
  for (const source of Object.values(f401.sources)) {
    if (sha256(await readFile(source.path)) !== source.sha256) throw new Error('F401RE source mismatch: ' + source.path)
  }
}
const { nano, nucleo } = JSON.parse(await readFile(layoutFile))
const directory = f401 ? '/models/board-catalog-a1/' : '/models/board-catalog-remaining-1/'
const approvalHash = f401 ? a1Approval : approval
const boardSpecs = f401 ? [{
  catalogId: f401.boardId, orderCode: 'NUCLEO-F401RE', pcbRevision: 'MB1136-F401RE-C04',
  mcu: 'STM32F401RET6', sourceIds: Object.keys(f401.sources), f401Labels: f401.labelsInPadOrder,
}] : config.boards
const round = value => Number(value.toFixed(4))
const pcbTop = 1.6
const black = [0.073, 0.081, 0.09], chip = [0.11, 0.12, 0.13], silver = [0.75, 0.76, 0.76]
const gold = [0.76, 0.55, 0.22], white = [0.83, 0.84, 0.78], red = [0.69, 0.07, 0.04]
const labels = value => value.split('|')

// Left and right as seen from the component side with the antenna at the top.
// Ordinal and GPIO names were checked against the Header Block and first/last
// pad designators of each locked PCB drawing. PDF registration is rounded in mm.
const esp = {
  'esp32-c3-devkitm-1': ['c3', 38.91, 2.063, 13.2, 16.6,
    'GND|3V3|3V3|IO2|IO3|GND|RST|GND|IO0|IO1|IO10|GND|5V|5V|GND',
    'GND|TX / IO21|RX / IO20|GND|IO9|IO8|GND|IO7|IO6|IO5|IO4|GND|IO18|IO19|GND'],
  'esp32-devkitm-1': ['esp32', 43.81, 1.575, 13.2, 19.0,
    'GND|3V3|I36|I37|I38|I39|RST|I34|I35|IO32|IO33|IO25|IO26|IO27|IO14|5V|GND',
    'GND|TXD0 / IO1|RXD0 / IO3|IO21|IO22|IO19|IO23|IO18|IO5|IO10|IO9|IO4|IO0|IO2|IO15|IO13|IO12'],
  'esp32-c6-devkitc-1': ['c6', 51.8, 1.575, 18, 25.5,
    '3V3|RST|IO4|IO5|IO6|IO7|IO0|IO1|IO8|IO10|IO11|IO2|IO3|5V|GND|NC',
    'GND|TX / IO16|RX / IO17|IO15|IO23|IO22|IO21|IO20|IO19|IO18|IO9|GND|IO13|IO12|GND|NC'],
  'esp32-s2-devkitc-1': ['s2', 62.74, 1.575, 18, 25.5,
    '3V3|3V3|RST|IO4|IO5|IO6|IO7|IO15|IO16|IO17|IO18|IO8|IO3|IO46|IO9|IO10|IO11|IO12|IO13|IO14|5V|GND',
    'GND|TX / IO43|RX / IO44|IO1|IO2|IO42|IO41|IO40|IO39|IO38|IO37|IO36|IO35|IO0|IO45|IO34|IO33|IO21|IO20|IO19|GND|GND'],
  'esp32-h2-devkitm-1': ['h2', 48.26, 1.575, 13.2, 16.6,
    '3V3|RST|IO0|IO1|IO2|IO3|NC (XTAL / IO13)|NC (XTAL / IO14)|IO4|IO5|NC|VBAT|GND|5V|GND',
    'GND|TX / IO24|RX / IO23|IO10|IO11|IO25|IO12|IO8|IO22|GND|IO9|GND|IO27|IO26|GND'],
}

// PDF top copper coordinates, recorded separately from the component package dimensions.
// Origin is the left/top outline corner. Designator centroids are for the visual shells.
const marks = {
  c3: { origin: [170.4422,126.3146], scale: 11.4736, usb: [316.2], sw: [[229.0,534.6],[403.4,534.6]], ldo: [306.0,335.3], uart: [291.2,420.1], led: [264.9,473.3], rgb: [394.2,318.2] },
  esp32: { origin: [168.4762,102.4373], scale: 11.4045, usb: [313.3], sw: [[232.2,564.2],[394.4,564.2]], ldo: [319.1,323.2], uart: [305.3,433.5], led: [249.6,501.8] },
  c6: { origin: [160.9272,171.9628], scale: 10.4451, usb: [218.4,368.8], sw: [[345.8,578.6],[241.4,578.6]], ldo: [330.9,410.3], uart: [318.5,520.3], led: [269.6,609.2], rgb: [228.8,524.0] },
  s2: { origin: [168.3117,125.9938], scale: 8.7837, usb: [221,338.7], sw: [[234.4,554.7],[325.6,554.7]], ldo: [287,357], uart: [288.2,499.7], led: [273.2,590.3], rgb: [234.1,421.5] },
  h2: { origin: [156.2902,181.9786], scale: 10.2710, usb: [212.8,360.7], sw: [[345.4,533],[238.5,533]], ldo: [331.7,370.7], uart: [311.2,467.7], led: [265.2,578.6], rgb: [219.6,475.3] },
}

const arduinoHeaders = {
  CN5: 'D8 / PA9|D9 / PC7|D10 / PB6|D11 / PA7|D12 / PA6|D13 / PA5|GND|AREF / AVDD|D14 / PB9|D15 / PB8',
  CN6: 'NC|IOREF|RESET / NRST|3V3|5V|GND|GND|VIN',
  CN8: 'A0 / PA0|A1 / PA1|A2 / PA4|A3 / PB0|A4 / PC1|A5 / PC0',
  CN9: 'D0 / PA3|D1 / PA2|D2 / PA10|D3 / PB3|D4 / PB5|D5 / PB4|D6 / PB10|D7 / PA8',
}
// UM1724 Rev 17, tables 16, 19, 23, 29 and 32. A4/A5 use default C04 solder bridges.
const morpho7 = 'PC10|PC11|PC12|PD2|VDD|E5V|BOOT0|GND|NC|NC|NC|IOREF|PA13|RESET|PA14|3V3|PA15|5V|GND|GND|PB7|GND|PC13|VIN|PC14|NC|PC15|PA0|PH0|PA1|PH1|PA4|VBAT|PB0|PC2|PC1|PC3|PC0'
const morpho10 = 'PC9|PC8|PB8|PC6|PB9|PC5|AVDD|U5V|GND|NC|PA5|PA12|PA6|PA11|PA7|PB12|PB6|NC|PC7|GND|PA9|PB2|PA8|PB1|PB10|PB15|PB4|PB14|PB5|PB13|PB3|AGND|PA10|PC4|PA2|NC|PA3|NC'

const lqfp = config.sourceLocks['kicad-lqfp64-step']
const occt = await occtFactory()
const packageMesh = occt.ReadStepFile(await readFile(join(library, lqfp.path)), {
  linearUnit: 'millimeter', linearDeflectionType: 'absolute_value', linearDeflection: 0.03, angularDeflection: 0.2,
})
if (!packageMesh.success || !packageMesh.meshes.length) throw new Error('Cannot mesh the approved LQFP-64 STEP')

function design(width, length, color) {
  const parts = [], features = {}, pins = []
  const box = (name, x, y, z, w, h, l, color) =>
    parts.push({ name, type: 'box', center: [x,y,z], size: [w,h,l], color })
  const cylinder = (name, x, y, z, radius, height, color, innerRadius) =>
    parts.push({ name, type: 'cyl', center: [x,y,z], radius, height, color, innerRadius, segments: 20 })
  const add = (name, label, make) => {
    features[name] = label
    make(name)
  }
  add('PCB', 'Thân PCB', ref => {
    box(ref, 0, 0.8, 0, width, 1.6, length, color)
    box(ref, 0, 0.07, 0, width, 0.13, length, color.map(c => c * 0.56))
  })

  function header(ref, side, rows, style) {
    add(ref, ref + ' · ' + (style === 'bare' ? 'Pad chưa hàn header' : style === 'female' ? 'Đầu cắm Arduino' : 'Header'), () => {
      rows.forEach(({ pad, label, x, z, drill = 1 }) => {
        const anchorY = { bare: 1.66, male: 5.95, female: 10.9 }[style]
        const position = Number(pad)
        if (Math.abs(x) > width / 2 || Math.abs(z) > length / 2) throw new Error('Pin outside PCB: ' + ref + '/' + pad)
        if (style === 'bare') {
          cylinder(ref, x, 1.615, z, drill * 0.79, 0.035, gold, drill / 2)
          cylinder(ref, x, 1.609, z, drill / 2, 0.016, black)
        } else if (style === 'female') {
          // Sleeve with a visible recess at its centre.
          box(ref, x, 5.9, z, 2.51, 8.6, 2.51, black)
          cylinder(ref, x, 10.55, z, 1.12, .72, black, .57)
          cylinder(ref, x, 10.24, z, .53, .04, gold, .38)
        } else {
          box(ref, x, 2.65, z, 2.50, 2.1, 2.50, black)
          box(ref, x, 4.8, z, .64, 2.2, .64, gold)
          box(ref, x, -.75, z, .64, 1.5, .64, gold)
        }
        pins.push({ id: ref.toLowerCase() + '-' + pad, headerReference: ref, side, padNumber: String(pad), position,
          label, anchorMm: [round(x), anchorY, round(z)] })
      })
    })
  }

  function usb(ref, label, x, z, type) {
    const [w,h,d] = { micro: [7.35,2.75,5.5], c: [8.94,3.25,7.35], mini: [7.75,4.0,9.0] }[type]
    add(ref, label, () => {
      box(ref, x, pcbTop + .2, z, w, .4, d, silver)
      box(ref, x, pcbTop + h - .2, z, w, .4, d, silver)
      for (const side of [-1,1]) {
        box(ref, x + side * (w - .38) / 2, pcbTop + h / 2, z, .38, h - .4, d, silver)
        box(ref, x + side * (w + .55) / 2, pcbTop + .10, z - d * .18, .75, .20, 2, silver)
      }
      box(ref, x, pcbTop + h / 2, z, w - .78, .42, d - 1.0, black)
      for (let i = 0; i < (type === 'c' ? 10 : 5); i++) box(ref, x + (i - (type === 'c' ? 4.5 : 2)) * .44, pcbTop + h / 2 + .23, z + .5, .24, .04, 2.4, gold)
    })
  }

  function button(ref, label, x, z, size = 4.2, cap = black) {
    add(ref, label, () => {
      box(ref, x, pcbTop + .56, z, size, 1.12, size * .84, chip)
      box(ref, x, pcbTop + 1.16, z, size * .94, .11, size * .79, silver)
      cylinder(ref, x, pcbTop + 1.40, z, size * .27, .55, cap)
      for (const a of [-1,1]) for (const b of [-1,1]) box(ref, x + a * size * .51, pcbTop + .17, z + b * size * .27, .75, .25, .50, silver)
    })
  }

  function ic(ref, label, x,z,size, pinsPerSide, pitch) {
    add(ref, label, () => {
      box(ref, x, pcbTop + .52, z, size, 1.03, size, chip)
      cylinder(ref, x - size * .35, pcbTop + 1.05, z - size * .35, .26, .04, black)
      for (const side of [-1,1]) for (let i = 0; i < pinsPerSide; i++) {
        const offset = (i - (pinsPerSide - 1) / 2) * pitch
        box(ref, x + offset, 1.79, z + side * (size / 2 + .26), pitch * .48, .2, .62, silver)
        box(ref, x + side * (size / 2 + .26), 1.79, z + offset, .62, .2, pitch * .48, silver)
      }
    })
  }

  function led(ref, label, x,z,color, size = 1.55) {
    add(ref, label, () => {
      box(ref, x, 1.83, z, size, .46, size * .62, white)
      box(ref, x, 2.13, z, size * .65, .14, size * .44, color)
    })
  }
  return { parts, features, pins, box, cylinder, add, header, usb, button, ic, led }
}

function espLayout(board) {
  const [key,length,offset,moduleWidth,moduleLength,left,right] = esp[board.catalogId]
  const d = design(25.4, length, [0.049,0.083,0.098])
  const m = marks[key]
  const point = ([x,z]) => [(x - m.origin[0]) / m.scale - 12.7, (z - m.origin[1]) / m.scale - length / 2]
  for (const [r, side, x, names] of [['J1','left',-11.43,left], ['J3','right',11.43,right]]) {
    d.header(r, side, labels(names).map((label,i) => ({
      pad: i + 1, label, x, z: offset - length / 2 + i * 2.54,
    })), 'male')
  }
  const antennaAt = ['c6','h2','s2'].includes(key) ? -6.4 : 0
  const moduleZ = -length / 2 + antennaAt + moduleLength / 2
  const antennaLength = ['c6','s2'].includes(key) ? 6.4 : 5.5
  d.add('U4', board.module, ref => {
    d.box(ref, 0, 2.05, moduleZ, moduleWidth, .9, moduleLength, [0.065,0.22,0.17])
    d.box(ref, 0, 3.36, moduleZ + antennaLength / 2, moduleWidth - 1.3, 1.72, moduleLength - antennaLength - .60, silver)
    const az = moduleZ - moduleLength / 2 + .8
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * .85
      d.box(ref, x, 2.52, az + 1.5, .26, .04, 2.5, gold)
      d.box(ref, x + .31, 2.52, az + (i % 2 ? .4 : 2.65), .7, .04, .24, gold)
    }
    for (const side of [-1,1]) for (let i = 0; i < 14; i++) {
      d.box(ref, side * (moduleWidth / 2 - .3), 2.5, moduleZ - moduleLength / 2 + antennaLength + .4 + i * (moduleLength - antennaLength - 1) / 14,
        .58,.05,.42,gold)
    }
  })
  const type = key === 'c6' || key === 'h2' ? 'c' : 'micro'
  const usbLength = type === 'c' ? 7.35 : 5.5
  m.usb.forEach((px,i) => d.usb(i ? 'J4' : 'J2', 'Cổng ' + (type === 'c' ? 'USB-C' : 'micro-USB') + (m.usb.length === 2 ? ' ' + (i + 1) : ''), point([px,0])[0], length / 2 - usbLength / 2 + .45, type))
  const sw1 = key === 's2' ? 'RESET' : 'BOOT'
  const sw2 = key === 's2' ? 'BOOT' : 'RESET'
  d.button('SW1', 'Nút ' + sw1, ...point(m.sw[0]), 3.65)
  d.button('SW2', 'Nút ' + sw2, ...point(m.sw[1]), 3.65)
  d.ic('U2','Ổn áp 3,3 V', ...point(m.ldo), 2.8, 2, .95)
  d.ic('U3','Cầu USB–UART', ...point(m.uart), 4.8, 7, .5)
  d.led('D1','LED nguồn', ...point(m.led), red)
  if (m.rgb) d.led('D6','LED RGB', ...point(m.rgb), [0.82,0.74,0.68], 4.2)
  if (key === 'h2') {
    const [x,z] = point([240.424,324.422])
    d.add('X1','Thạch anh 32,768 kHz · biến thể lô đã duyệt', ref => {
      d.box(ref, x, 1.92, z, 3.2, .64, 1.5, silver)
      for (const direction of [-1,1]) d.box(ref, x + direction * 1.38, 1.71, z, .71, .22, 1.30, gold)
    })
  }
  return { ...d, size: [25.4,length], sourceGeometry: 'PDF layout vector Espressif; bước chân 2,54 mm' }
}

function nucleoLayout(board) {
  const [width,length] = nucleo.size
  const d = design(width,length,[0.78,0.79,0.74])
  const { placement, headers, mounts, auxiliary } = nucleo
  const isL4 = board.catalogId.endsWith('l476rg')
  const m10 = labels(morpho10)
  if (isL4) m10[17] = 'PB11'
  const pinMap = { ...arduinoHeaders, CN7: morpho7, CN10: m10.join('|'),
    ...(board.f401Labels ? { CN7: board.f401Labels.CN7.join('|'), CN10: board.f401Labels.CN10.join('|') } : {}) }
  for (const [ref,pads] of Object.entries(headers)) {
    const isMorpho = ref === 'CN7' || ref === 'CN10'
    const pinLabels = labels(pinMap[ref])
    if (pinLabels.length !== Object.keys(pads).length) throw new Error('Pin labels and CAD pads diverge on ' + ref)
    d.header(ref, ['CN6','CN7','CN8'].includes(ref) ? 'left' : 'right',
      pinLabels.map((label,i) => ({ pad: i + 1, label, x: pads[i+1][0], z: pads[i+1][1] })), isMorpho ? 'male' : 'female')
  }
  for (const [x,z] of mounts) {
    d.cylinder('PCB',x,1.625,z,1.9,.06,gold,1.6)
    d.cylinder('PCB',x,1.62,z,1.6,.035,black)
  }
  d.usb('CN1','USB Mini-B · ST-LINK', placement.CN1[0], -length / 2 + 3.5,'mini')
  d.ic('U2','STM32F103CBT6 · ST-LINK/V2-1', ...placement.U2, 7, 12, .5)
  d.add('U5', board.mcu + ' · LQFP-64', () => {})
  const [x,z] = placement.U5
  const step = packageMesh.meshes.flatMap(mesh => primitivesFromStepMesh(mesh,
    (a,b,c) => [a + x/1000, c + pcbTop/1000, -b + z/1000]))
  d.button('B1','Nút USER · PC13',...placement.B1,7,[0.035,0.21,0.52])
  d.button('B2','Nút RESET',...placement.B2,7)
  d.led('LD1','LED trạng thái ST-LINK',...placement.LD1,[0.64,0.27,0.06])
  d.led('LD2','LED người dùng',...placement.LD2,[0.09,0.71,0.14])
  d.led('LD3','LED nguồn',...placement.LD3,red)
  d.ic('U1','Ổn áp 3,3 V · ST-LINK',...placement.U1,2.8,2,.9)
  for (const [ref,label] of [['CN2','Jumper ST-LINK'],['CN4','Đầu SWD'],['JP1','Jumper nguồn USB'],['JP5','Chọn nguồn'],['JP6','Đo dòng MCU']]) {
    d.add(ref,label,() => {
      for (const [px,pz] of auxiliary[ref]) {
        d.box(ref,px,2.60,pz,2.5,2.0,2.5,black)
        d.box(ref,px,4.7,pz,.64,2.20,.64,gold)
      }
    })
  }
  const perforationZ = placement.B1[1] - 6.35
  for (let x = -31; x <= 31; x += 2.4) d.cylinder('PCB',x,1.615,perforationZ,.31,.036,white)
  return { ...d, extra: [{ name: 'U5', primitives: step }], size: [width,length],
    sourceGeometry: 'Edge.Cuts và pad từ Altium MB1136C nhập qua KiCad 10.0.7',
    unverified: isL4 ? ['Gói nguồn chưa có BOM riêng L476RG-C04. Các linh kiện lắp/DNP phụ chưa được tái dựng.'] : [] }
}

function nanoLayout() {
  const d = design(43.18,17.78,[0.035,0.31,0.36])
  const toModel = ([x,y]) => [x - 21.59,8.89 - y]
  const headerNames = {
    JP2: 'D13 / SCK|3V3|AREF|A0|A1|A2|A3|A4 / SDA|A5 / SCL|A6|A7|5V|RESET|GND|VIN',
    JP3: 'D1 / TX|D0 / RX|RESET|GND|D2|D3|D4|D5|D6|D7|D8|D9|D10|D11 / MOSI|D12 / MISO',
  }
  for (const [ref,pads] of Object.entries(nano.headers)) {
    d.header(ref, ref === 'JP2' ? 'left' : 'right', labels(headerNames[ref]).map((label,i) => {
      const [x,z] = toModel(pads[i+1])
      return { pad: i+1, label, x, z, drill: pads[i+1][2] }
    }), 'bare')
  }
  const at = ref => toModel(nano.placement[ref])
  d.ic('U1','ATmega4809 · TQFP-48',...at('U1'),7,12,.5)
  d.ic('U3','ATSAMD11D14A · USB',...at('U3'),4,6,.5)
  d.ic('U2','AP2112K · Bộ ổn áp',...at('U2'),2.75,2,.95)
  const usb = design(10,10,[0,0,0])
  usb.usb('J1','Micro-USB',0,0,'micro')
  d.add('J1','Cổng micro-USB', ref => {
    const [x,z] = at('J1')
    for (const p of usb.parts.filter(p => p.name === ref)) {
      const [px,py,pz] = p.center, [w,h,l] = p.size
      d.box(ref,x-pz,py,z+px,l,h,w,p.color)
    }
  })
  for (const [ref,center] of Object.entries(nano.placement)) {
    if (/^(R|C|L)\d+$/.test(ref)) {
      const [x,z] = toModel(center), alongX = center[2] % 180 === 0
      d.box('SMT',x,1.81,z,alongX ? 1.05 : .55,.42,alongX ? .55 : 1.05,ref[0] === 'C' ? [0.51,0.40,0.24] : chip)
      for (const sign of [-1,1]) d.box('SMT',x+(alongX?sign*.58:0),1.69,z+(alongX?0:sign*.58),alongX?.27:.56,.16,alongX?.56:.27,silver)
    }
  }
  const ledRefs = Object.keys(nano.placement).filter(ref => /^LED\d+$/.test(ref))
  ledRefs.forEach(ref => d.led(ref,'LED ' + ref,...at(ref),[0.15,0.75,0.20]))
  return { ...d, size: [43.18,17.78], sourceGeometry: 'FAB, MNT và 30 tâm lỗ IPC-D-356 Arduino' }
}

await mkdir('public' + directory, { recursive: true })
const manifests = []
for (const board of boardSpecs) {
  const model = esp[board.catalogId] ? espLayout(board)
    : board.catalogId === 'arduino-nano-every' ? nanoLayout() : nucleoLayout(board)
  const mesh = [...primitiveParts(model.parts), ...(model.extra ?? [])]
  const inscribed = config.sourceLocks[board.sourceIds.find(id => id.includes('layout') || id.includes('board-project') || id.includes('cad.zip'))]
  const bytes = writeGlb(mesh, { rootName: board.orderCode, generator: 'Mạch Mở board catalog',
    extras: { approval: approvalHash, sourceSha256: inscribed.sha256, orderCode: board.orderCode, pcbRevision: board.pcbRevision, sourceUnits: 'mm' } })
  const digest = sha256(bytes), file = directory + board.catalogId + '.glb'
  await writeFile('public' + file, bytes)
  manifests.push({ id: board.catalogId, assetUrl: file + '?v=' + digest.slice(0,12), assetVersion: digest.slice(0,12),
    sha256: digest, sizeMm: model.size, orderCode: board.orderCode, revision: board.pcbRevision,
    features: model.features, pins: model.pins, sourceGeometry: model.sourceGeometry, unresolvedIssues: model.unverified ?? [] })
  console.log(board.catalogId, model.pins.length, 'pins,', mesh.length, 'nodes')
}
await writeFile(f401 ? 'src/data/a1-nucleo-board-assets.json' : 'src/data/remaining-catalog-board-assets.json', JSON.stringify(manifests, null, 2) + '\n')
await writeFile('public' + directory + 'NOTICE.txt', [
  'Mạch Mở board reference geometry. Approval SHA-256: ' + approvalHash,
  'Espressif: reconstructive mesh from board vector drawings; see linked documents and sources in proposal.',
  'Arduino ABX00028: Nano Every V4.0 board files by Arduino, CC BY-SA 4.0. Position and pad data transformed from vendor FAB, MNT and IPC.',
  'STMicroelectronics: MB1136C PCB and UM1724 Rev 17 used under local review scope. Verify distribution rights before publication.',
  'LQFP-64 STEP by KiCad Libraries Contributors, CC BY-SA 4.0 with library exception (https://www.kicad.org/libraries/license/).',
  'Package shells are visual references. Physical hardware fit and circuit/firmware behaviour were not evaluated.', '',
].join('\n'))
