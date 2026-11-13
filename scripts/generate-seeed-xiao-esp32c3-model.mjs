// Export the Seeed XIAO ESP32-C3 v1.3 source board as a GLB and emit its BOM-aligned picker data.
// Only add a KiCad package body when the footprint shape is a known package match.
// Run from electronics-learning-demo: node scripts/generate-seeed-xiao-esp32c3-model.mjs
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceDir = join(root, 'assets/boards/vendor/seeed-xiao-esp32c3/202003511_XIAO ESP32C3_v1.3_SCH&PCB_260116')
const pcbSource = join(sourceDir, 'XIAO ESP32C3_v1.3.kicad_pcb')
const schematicSource = join(sourceDir, 'XIAO ESP32C3_v1.3.kicad_sch')
const archiveSource = join(root, 'assets/boards/vendor/seeed-xiao-esp32c3/XIAO_ESP32C3_v1.3_KiCad_260116.zip')
const kicadCli = process.env.KICAD_CLI ?? 'C:/Program Files/KiCad/9.0/bin/kicad-cli.exe'
const modelDir = process.env.KICAD9_3DMODEL_DIR ?? 'C:/Program Files/KiCad/9.0/share/kicad/3dmodels'
const outputGlb = join(root, 'public/models/seeed-xiao-esp32-c3.glb')
const outputInventory = join(root, 'src/data/seeed-xiao-esp32c3.inventory.json')
const tempDir = await mkdtemp(join(root, '.tmp/seeed-xiao-esp32c3-'))

const modelByFootprint = {
  C0201: 'Capacitor_SMD.3dshapes/C_0201_0603Metric.wrl',
  R0201: 'Resistor_SMD.3dshapes/R_0201_0603Metric.wrl',
  'LED-0402': 'LED_SMD.3dshapes/LED_0402_1005Metric.wrl',
  'SOD-523': 'Diode_SMD.3dshapes/D_SOD-523.wrl',
  F0603: 'Fuse.3dshapes/Fuse_0603_1608Metric.wrl',
  L0201: 'Inductor_SMD.3dshapes/L_0201_0603Metric.wrl',
  'SOT-25': 'Package_TO_SOT_SMD.3dshapes/SOT-23-5.wrl',
  'QFN32G-0.5-5X5MM': 'Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.3x3.3mm.wrl',
  'U-FL3P-SMD-2.6X2.6X1.0MM': 'Connector_Coaxial.3dshapes/U.FL_Hirose_U.FL-R-SMT-1_Vertical.wrl',
  'X2-SMD-1.6X1.0X0.5MM': 'Crystal.3dshapes/Crystal_SMD_MicroCrystal_CM9V-T1A-2Pin_1.6x1.0mm.wrl',
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function sexprEnd(text, start) {
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === '(') depth += 1
    else if (char === ')' && --depth === 0) return index + 1
  }
  throw new Error(`KiCad S-expression không đóng ngoặc tại offset ${start}`)
}

function extractFootprints(text) {
  const footprints = []
  const pattern = /\(footprint\s+"([^"]+)"/g
  for (let match; (match = pattern.exec(text));) {
    const end = sexprEnd(text, match.index)
    const block = text.slice(match.index, end)
    const reference = block.match(/\(property\s+"Reference"\s+"([^"]*)"/)?.[1]
    const value = block.match(/\(property\s+"Value"\s+"([^"]*)"/)?.[1]
    const at = block.match(/^\s*\(footprint[^\n]*[\s\S]*?\n\s*\(at\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?/)
    const layer = block.match(/^\s*\(footprint[^\n]*[\s\S]*?\n\s*\(layer\s+"([^"]+)"\)/)?.[1]
    footprints.push({
      start: match.index,
      end,
      block,
      libraryId: match[1],
      footprint: match[1].split(':').at(-1),
      reference,
      value,
      x: Number(at?.[1]),
      y: Number(at?.[2]),
      rotation: Number(at?.[3] ?? 0),
      side: layer === 'B.Cu' ? 'back' : 'front',
    })
    pattern.lastIndex = end
  }
  return footprints
}

function extractPads(footprintBlock) {
  const pads = []
  const pattern = /\(pad\s+"([^"]*)"/g
  for (let match; (match = pattern.exec(footprintBlock));) {
    const end = sexprEnd(footprintBlock, match.index)
    const block = footprintBlock.slice(match.index, end)
    const net = block.match(/\(net\s+\d+\s+"([^"]*)"\)/)?.[1]
    pads.push({ number: match[1], net: net ? net : null })
    pattern.lastIndex = end
  }
  return pads
}

function parseCsvRow(line) {
  const fields = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { fields.push(current); current = '' }
    else current += char
  }
  fields.push(current)
  return fields
}

function parseBom(csv) {
  const lines = csv.trim().split(/\r?\n/)
  const headers = parseCsvRow(lines.shift())
  return lines.map((line) => Object.fromEntries(parseCsvRow(line).map((value, index) => [headers[index], value])))
}

function describePart(component) {
  const { reference, value, footprint } = component
  if (reference === 'U4') return { label: `MCU ESP32-C3FH4 · ${reference}`, description: 'BOM KiCad xác nhận mã ESP32-C3FH4 tại U4; bố trí từ PCB v1.3.', role: 'Vi điều khiển chính ESP32-C3.', evidence: 'source-backed' }
  if (reference === 'U1') return { label: `PMIC XC6802MR · ${reference}`, description: 'Mã linh kiện và vị trí lấy từ BOM KiCad của board.', role: 'Khối quản lý nguồn/sạc theo mã linh kiện; topology cần đối chiếu schematic trước khi suy ra dòng điện.', evidence: 'source-backed' }
  if (reference === 'U2') return { label: `LDO TLV75733PDBVR · ${reference}`, description: 'BOM KiCad ghi mã TLV75733PDBVR tại U2.', role: 'Bộ ổn áp tuyến tính 3,3 V theo mã linh kiện; khả năng tải phụ thuộc thiết kế và tản nhiệt thực.', evidence: 'source-backed' }
  if (reference === 'ANT0') return { label: `Đầu nối U.FL · ${reference}`, description: 'BOM KiCad ghi U.FL-R-SMT-1 tại ANT0.', role: 'Đầu nối RF U.FL; anten và đường RF không mô phỏng trong viewer.', evidence: 'source-backed' }
  if (reference === 'BOOT0' || reference === 'RST0') return { label: `${reference === 'BOOT0' ? 'Nút BOOT' : 'Nút RESET'} · ${reference}`, description: `PCB/BOM v1.3 ghi ${value} tại ${reference}.`, role: reference === 'BOOT0' ? 'Nút chọn chế độ boot.' : 'Nút reset hệ thống.', evidence: 'source-backed' }
  if (reference === 'CHG0') return { label: `LED đỏ báo trạng thái · ${reference}`, description: 'BOM nguồn ghi LED đỏ tại designator CHG0; vị trí và package lấy từ CAD.', role: 'LED báo trạng thái nguồn/sạc theo nhãn schematic; chưa đo trạng thái thực.', evidence: 'source-backed' }
  if (/^R\d+$/.test(reference)) return { label: `Điện trở ${value} Ω · ${reference}`, description: `Giá trị ${value} và footprint ${footprint} lấy từ BOM/PCB v1.3.`, role: 'Điện trở SMD; chức năng riêng của từng vị trí cần xem schematic.', evidence: 'source-backed' }
  if (/^C\d+$/.test(reference)) return { label: `Tụ ${value} · ${reference}`, description: `Giá trị ${value} và footprint ${footprint} lấy từ BOM/PCB v1.3.`, role: 'Tụ SMD; không suy ra điện áp định mức hoặc chức năng từ package.', evidence: 'source-backed' }
  if (reference === 'D1') return { label: `Diode MSK4005 · ${reference}`, description: 'Mã diode lấy từ BOM KiCad; footprint SOD-523 theo PCB.', role: 'Diode bảo vệ/chỉnh lưu theo sơ đồ; không mô phỏng điện áp hay dòng.', evidence: 'source-backed' }
  if (reference === 'F1') return { label: `Cầu chì 6 V / 500 mA · ${reference}`, description: 'BOM KiCad ghi 6V_500mA_Fuse tại F1.', role: 'Phần tử bảo vệ; không dùng viewer để kiểm tra giới hạn dòng của board thật.', evidence: 'source-backed' }
  if (reference === 'Q1') return { label: `MOSFET LP0404N3T5G · ${reference}`, description: 'BOM KiCad ghi mã LP0404N3T5G tại Q1.', role: 'MOSFET theo mã linh kiện; package 3D board-specific chưa có mesh đã xác minh.', evidence: 'source-backed' }
  if (/^L\d+$/.test(reference)) return { label: `Cuộn cảm ${value} · ${reference}`, description: `Giá trị/footprint lấy từ BOM/PCB v1.3.`, role: 'Cuộn cảm SMD trong khối RF/nguồn; chức năng riêng cần đối chiếu schematic.', evidence: 'source-backed' }
  if (reference === 'X2' || reference === 'X4') return { label: `Thạch anh/dao động ${value} · ${reference}`, description: 'Mã và package lấy từ BOM KiCad của board.', role: 'Nguồn xung nhịp theo schematic; không phải signal flow đã mô phỏng.', evidence: 'source-backed' }
  if (reference === 'U$2') return { label: 'Logo Seeed · mặt sau', description: 'Graphic/logo footprint trên lớp mặt sau của PCB; không phải linh kiện lắp ráp và không có BOM.', role: 'Đối tượng silkscreen/fab để tham chiếu vị trí; không có thân linh kiện 3D.', evidence: 'source-backed' }
  if (value === 'DNP' || /^(TP|J1|J2|BAT0|GND0)/.test(reference)) return { label: `${reference} · chưa lắp (DNP)`, description: `Footprint ${footprint} có trong CAD nhưng được đánh dấu DNP/không populated trong BOM.`, role: 'Vị trí CAD chưa lắp; không có thân linh kiện trong model.', evidence: 'source-backed' }
  return { label: `${value} · ${reference}`, description: `Designator, value, footprint và tọa độ từ BOM/PCB KiCad v1.3.`, role: 'Chức năng cần tra schematic hoặc datasheet theo mã chính xác.', evidence: 'source-backed' }
}

try {
  const sourcePcb = await readFile(pcbSource, 'utf8')
  const sourceComponents = extractFootprints(sourcePcb)
  const patched = []
  let cursor = 0
  for (const component of sourceComponents) {
    const block = component.block
    patched.push(sourcePcb.slice(cursor, component.start))
    const modelPath = modelByFootprint[component.footprint]
    const isDnp = component.value === 'DNP' || /\(attr\s+dnp\)/.test(block)
    if (modelPath && !isDnp && component.side === 'front') {
      const ref = component.reference
      const model = `\n\t\t(model "\${KICAD9_3DMODEL_DIR}/${modelPath}"\n\t\t\t(offset (xyz 0 0 0))\n\t\t\t(scale (xyz 1 1 1))\n\t\t\t(rotate (xyz 0 0 0))\n\t\t)`
      patched.push(`${block.slice(0, -1)}${model}\n\t)`)
    } else patched.push(block)
    cursor = component.end
  }
  patched.push(sourcePcb.slice(cursor))
  const tempPcb = join(tempDir, 'xiao-c3.kicad_pcb')
  const bomFile = join(tempDir, 'bom.csv')
  await writeFile(tempPcb, patched.join(''), 'utf8')
  execFileSync(kicadCli, ['sch', 'export', 'bom', '-o', bomFile, '--fields', 'Reference,Value,Footprint,${QUANTITY},${DNP}', schematicSource], { stdio: 'inherit' })
  const bom = parseBom(await readFile(bomFile, 'utf8'))
  const componentByRef = new Map(sourceComponents.map((item) => [item.reference, item]))
  const bomByRef = new Map(bom.map((row) => [row.Reference, row]))
  for (const row of bom) if (!componentByRef.has(row.Reference)) throw new Error(`BOM designator ${row.Reference} không có footprint trên PCB`)
  const inventory = sourceComponents.map((placement) => {
    const row = bomByRef.get(placement.reference)
    const value = row?.Value ?? placement.value ?? ''
    const isDnp = row?.DNP?.toUpperCase() === 'DNP' || value.toUpperCase() === 'DNP' || /\(attr\s+dnp\)/.test(placement.block)
    const packageModel = modelByFootprint[placement.footprint]
    return {
      reference: placement.reference,
      value,
      footprint: placement.footprint,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
      side: placement.side,
      dnp: isDnp,
      bomPresent: Boolean(row),
      packageModel: !isDnp && placement.side === 'front' ? packageModel ?? null : null,
      pads: extractPads(placement.block),
      ...describePart({ reference: placement.reference, value, footprint: placement.footprint }),
    }
  }).sort((a, b) => a.reference.localeCompare(b.reference, undefined, { numeric: true }))

  const outputDir = dirname(outputGlb)
  const modelArgs = ['pcb', 'export', 'glb', '--force', '--subst-models', '--define-var', `KICAD9_3DMODEL_DIR=${modelDir}`, '--include-pads', '--include-tracks', '--include-zones', '--include-silkscreen', '--include-soldermask', '--output', outputGlb, tempPcb]
  execFileSync(kicadCli, modelArgs, { cwd: root, stdio: 'inherit' })
  const modelBytes = await readFile(outputGlb)
  const jsonLength = modelBytes.readUInt32LE(12)
  const gltf = JSON.parse(modelBytes.toString('utf8', 20, 20 + jsonLength))
  const nodeNames = new Set((gltf.nodes ?? []).map((node) => node.name).filter(Boolean))
  for (const component of inventory) component.has3dBody = Boolean(component.packageModel && nodeNames.has(component.reference))
  const sourceArchive = await readFile(archiveSource)
  const sourcePcbBytes = await readFile(pcbSource)
  const schematicBytes = await readFile(schematicSource)
  const modelledDesignators = inventory.filter((component) => component.has3dBody).length
  const output = {
    boardId: 'seeed-xiao-esp32c3',
    revision: 'Seeed Studio XIAO ESP32-C3 · v1.3 KiCad project (source archive dated 2026-01-16)',
    sourceFile: 'assets/boards/vendor/seeed-xiao-esp32c3/202003511_XIAO ESP32C3_v1.3_SCH&PCB_260116/XIAO ESP32C3_v1.3.kicad_pcb',
    sourceArchiveSha256: sha256(sourceArchive),
    sourcePcbSha256: sha256(sourcePcbBytes),
    sourceSchematicSha256: sha256(schematicBytes),
    modelSha256: sha256(modelBytes),
    units: 'mm',
    modelledDesignators,
    unsupportedFootprints: [...new Set(inventory.filter((item) => !item.has3dBody && !item.dnp).map((item) => item.footprint))].sort(),
    components: inventory,
  }
  await writeFile(outputInventory, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${outputGlb} (${modelBytes.byteLength} bytes), ${outputInventory} (${inventory.length} PCB footprints; ${bom.length} BOM entries; ${modelledDesignators} fitted package meshes).`)
} finally {
  await rm(tempDir, { recursive: true, force: true })
}
