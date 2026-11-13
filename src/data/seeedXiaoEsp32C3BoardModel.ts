import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import inventory from './seeed-xiao-esp32c3.inventory.json'
import pinAnchors from './seeed-xiao-esp32c3.pin-anchors.json'

const id = 'seeed-xiao-esp32c3'
const assetVersion = inventory.modelSha256.slice(0, 12)
const assetUrl = `/models/seeed-xiao-esp32-c3.glb?v=${assetVersion}`
const revision = 'Seeed Studio XIAO ESP32-C3 · KiCad v1.3'
const packageMeshCount = inventory.components.filter((component) => component.has3dBody).length

const pinDetails: Record<string, { gpio?: number; functions: string[]; description: string; technicalRole: string; safetyNote: string }> = {
  D0: { gpio: 2, functions: ['GPIO', 'ADC1_CH2'], description: 'Chân D0 trên silkscreen; dùng làm GPIO hoặc đầu vào ADC1.', technicalRole: 'GPIO2 · ADC1_CH2; chân strapping khi khởi động.', safetyNote: 'Mức logic 3,3 V. GPIO2 là chân strapping; tải ngoài có thể ảnh hưởng chế độ khởi động.' },
  D1: { gpio: 3, functions: ['GPIO', 'ADC1_CH3'], description: 'Chân D1 trên silkscreen; dùng làm GPIO hoặc đầu vào ADC1.', technicalRole: 'GPIO3 · ADC1_CH3.', safetyNote: 'Mức logic 3,3 V; không đưa 5 V vào GPIO.' },
  D2: { gpio: 4, functions: ['GPIO', 'ADC1_CH4', 'JTAG MTMS'], description: 'Chân D2 trên silkscreen; có thể dùng GPIO, ADC hoặc chức năng JTAG.', technicalRole: 'GPIO4 · ADC1_CH4 · MTMS/JTAG.', safetyNote: 'Mức logic 3,3 V; kiểm tra xung đột nếu dùng JTAG.' },
  D3: { gpio: 5, functions: ['GPIO', 'ADC2_CH0', 'JTAG MTDI'], description: 'Chân D3 trên silkscreen; hỗ trợ GPIO và ADC2.', technicalRole: 'GPIO5 · ADC2_CH0 · MTDI/JTAG.', safetyNote: 'Mức logic 3,3 V. Seeed lưu ý ADC2 có thể kém tin cậy; ưu tiên D0–D2/ADC1 cho phép đo analog ổn định.' },
  D4: { gpio: 6, functions: ['GPIO', 'I²C SDA', 'JTAG MTCK'], description: 'Chân D4 trên silkscreen; thường dùng làm SDA trong ví dụ I²C.', technicalRole: 'GPIO6 · SDA mặc định trong pin map Seeed · MTCK/JTAG.', safetyNote: 'Mức logic 3,3 V. Kéo lên I²C phải phù hợp điện áp 3,3 V.' },
  D5: { gpio: 7, functions: ['GPIO', 'I²C SCL', 'JTAG MTDO'], description: 'Chân D5 trên silkscreen; thường dùng làm SCL trong ví dụ I²C.', technicalRole: 'GPIO7 · SCL mặc định trong pin map Seeed · MTDO/JTAG.', safetyNote: 'Mức logic 3,3 V. Kiểm tra xung đột nếu dùng JTAG.' },
  D6: { gpio: 21, functions: ['GPIO', 'UART0 TX'], description: 'Chân D6 trên silkscreen; mặc định là UART0 TX theo tài liệu Seeed.', technicalRole: 'GPIO21 · U0TXD.', safetyNote: 'Mức logic 3,3 V; cần bộ chuyển USB–UART tương thích 3,3 V khi nối UART ngoài.' },
  D7: { gpio: 20, functions: ['GPIO', 'UART0 RX'], description: 'Chân D7 trên silkscreen; mặc định là UART0 RX theo tài liệu Seeed.', technicalRole: 'GPIO20 · U0RXD.', safetyNote: 'Mức logic 3,3 V; không đưa mức 5 V vào GPIO.' },
  D8: { gpio: 8, functions: ['GPIO', 'SPI SCK', 'JTAG MTMS'], description: 'Chân D8 trên silkscreen; thường dùng làm SCK trong ví dụ SPI.', technicalRole: 'GPIO8 · SCK · chân strapping khi khởi động.', safetyNote: 'Mức logic 3,3 V. GPIO8 là chân strapping; ngoại vi giữ mức sai có thể làm board không khởi động đúng.' },
  D9: { gpio: 9, functions: ['GPIO', 'SPI MISO', 'BOOT'], description: 'Chân D9 trên silkscreen; thường dùng làm MISO và nối với mạch nút BOOT trên board.', technicalRole: 'GPIO9 · MISO · chân BOOT/strapping.', safetyNote: 'Mức logic 3,3 V. GPIO9 là chân strapping và liên quan BOOT; tải ngoài có thể ảnh hưởng nạp/chạy chương trình.' },
  D10: { gpio: 10, functions: ['GPIO', 'SPI MOSI'], description: 'Chân D10 trên silkscreen; thường dùng làm MOSI trong ví dụ SPI.', technicalRole: 'GPIO10 · MOSI.', safetyNote: 'Mức logic 3,3 V; không đưa 5 V vào GPIO.' },
  '3V3': { functions: ['Nguồn 3,3 V'], description: 'Đầu ra rail 3,3 V của board.', technicalRole: 'Net VCC_3V3 trong PCB KiCad v1.3.', safetyNote: 'Đây là rail 3,3 V; không đưa 5 V vào chân này. Khả năng tải phụ thuộc thiết kế/điều kiện nhiệt của board thật.' },
  GND: { functions: ['Mass / đường hồi'], description: 'Mốc mass chung cho nguồn và tín hiệu.', technicalRole: 'Net GND trong PCB KiCad v1.3.', safetyNote: 'Tắt nguồn trước khi thay dây; chỉ nối chung mass theo sơ đồ mạch.' },
  '5V': { functions: ['VBUS từ USB'], description: 'Chân VUSB/VBUS 5 V lấy từ đường USB theo thiết kế tham chiếu.', technicalRole: 'Net VUSB trong PCB KiCad v1.3; tài liệu Seeed gọi chân ngoài là 5V/VBUS.', safetyNote: 'Không nối 5 V trực tiếp vào GPIO. Nếu dùng như ngõ vào nguồn ngoài, tuân thủ hướng dẫn diode và sơ đồ nguồn chính hãng.' },
}

const pins = pinAnchors.headers.flatMap((header) => header.pins.map((anchor) => {
  const details = pinDetails[anchor.label]
  if (!details) throw new Error(`Thiếu mô tả nguồn cho pin ${anchor.label}`)
  const padLabel = `${header.headerReference} pad ${anchor.padNumber}`
  return {
    id: anchor.id,
    side: header.side as 'left' | 'right',
    position: anchor.position,
    label: anchor.label,
    headerReference: header.headerReference,
    padNumber: anchor.padNumber,
    netName: anchor.netName,
    gpio: details.gpio,
    anchor: [Number((anchor.xMm / 1000).toFixed(7)), Number((pinAnchors.boardTopMm / 1000).toFixed(7)), Number((anchor.zMm / 1000).toFixed(7))] as [number, number, number],
    plainDescription: details.description,
    technicalRole: details.technicalRole,
    connection: `${padLabel} · net ${anchor.netName} theo PCB KiCad v1.3; mapping ${anchor.label}${details.gpio === undefined ? '' : ` → GPIO${details.gpio}`} theo pin map Seeed.`,
    safetyNote: details.safetyNote,
    functions: details.functions,
  }
}))

function partName(component: typeof inventory.components[number]) {
  if (component.reference === 'U$2') return 'Logo Seeed · mặt sau'
  if (component.dnp) return `${component.reference} · vị trí DNP/chưa lắp`
  return component.label
}

function padNetSummary(component: typeof inventory.components[number]) {
  const assignedPads = component.pads.filter((pad) => pad.net)
  const netCount = new Set(assignedPads.map((pad) => pad.net)).size
  if (assignedPads.length === 0) return 'PCB KiCad v1.3 không ghi net cho các pad của footprint này.'
  return `PCB KiCad v1.3 ghi ${assignedPads.length}/${component.pads.length} pad có tên net (${netCount} net). Bảng chi tiết chép số pad/net từ CAD; 14 chân header J1/J2 chọn được riêng trên mô hình 3D và bộ chọn pinout, nhưng chưa tô đường net tương tác.`
}

const features: BoardFeature[] = inventory.components.map((component) => ({
  id: `cad-${component.reference.toLowerCase()}`,
  designator: component.reference,
  name: partName(component),
  plainDescription: component.description,
  technicalRole: component.role,
  connection: padNetSummary(component),
  placementReason: `Tọa độ ${component.x.toFixed(3)}, ${component.y.toFixed(3)} mm; xoay ${component.rotation}°; mặt ${component.side === 'front' ? 'trên' : 'dưới'} theo PCB KiCad v1.3.`,
  placementEvidence: 'cad',
  cadFootprint: {
    reference: component.reference,
    value: component.value,
    footprint: component.footprint,
    x: component.x,
    y: component.y,
    rotation: component.rotation,
    side: component.side as 'front' | 'back',
    has3dBody: component.has3dBody,
    pads: component.pads,
  },
  roleEvidence: component.evidence as BoardFeature['roleEvidence'],
  safetyNote: component.has3dBody
    ? 'Mesh 3D là hình khối package KiCad phù hợp footprint, không phải mesh có marking/đặc tính riêng của part. Đây là CAD tham chiếu; không chạy điện, firmware hoặc xác nhận board vật lý.'
    : component.dnp
      ? 'CAD có footprint nhưng BOM đánh dấu DNP/chưa lắp; viewer không dựng thân linh kiện.'
      : 'CAD có footprint nhưng chưa có mesh package được xác minh; chọn mục này để xem thông tin CAD, không giả lập hình dáng hoặc kết nối.',
  relatedLessonPartIds: [],
}))

const hotspots = features.map((feature) => ({
  id: `hotspot-${feature.id}`,
  featureId: feature.id,
  label: feature.name,
  nodeNames: feature.cadFootprint?.has3dBody ? [feature.designator!] : [],
}))

export const seeedXiaoEsp32C3BoardModel: BoardModelManifest = {
  id,
  assetUrl,
  assetVersion,
  features,
  hotspots,
  pins,
  signalFlows: [],
  pinPicking: true,
  pinoutEvidence: {
    summary: 'Tọa độ header lấy từ tâm pad J1/J2 trên PCB KiCad XIAO ESP32-C3 v1.3; net theo CAD và chức năng GPIO theo pin map Seeed. Mô hình chưa được đối chiếu với board vật lý.',
    sourceLabel: 'Mở pin map và lưu ý điện của Seeed',
    sourceUrl: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/',
  },
  audit: {
    status: 'educational-reconstruction',
    revision,
    sourceRefs: [
      {
        path: inventory.sourceFile,
        sha256: inventory.sourcePcbSha256,
        license: 'Seeed documents/images state CC BY-SA 4.0; the downloaded KiCad archive has no standalone license file. KiCad package library is CC BY-SA 4.0 with the official design-file exception.',
        role: 'PCB layout and footprint coordinates used as the board source; not a physical-board inspection.',
      },
      {
        path: 'assets/boards/vendor/seeed-xiao-esp32c3/XIAO_ESP32C3_v1.3_KiCad_260116.zip',
        sha256: inventory.sourceArchiveSha256,
        license: 'Seeed Studio source archive; retain this attribution and share-alike notice. Public redistribution of a derived board assembly remains subject to the archive-specific rights note.',
        role: 'Original source archive hash for reproducibility.',
      },
      {
        path: 'Seeed Studio XIAO ESP32-C3 Getting Started',
        url: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/',
        role: 'Official XIAO ESP32-C3 pin map and electrical-use notes for D0–D10, 5V, 3V3, GND and strapping pins.',
      },
    ],
    unverifiedReferences: inventory.components.filter((component) => !component.has3dBody).map((component) => component.reference),
    auditNotes: [
      `Generated with KiCad CLI from the v1.3 PCB; ${inventory.components.length} PCB footprints are selectable, including ${inventory.components.filter((component) => !component.bomPresent).length} back-side logo/graphics item absent from BOM. The schematic BOM contains ${inventory.components.filter((component) => component.bomPresent).length} entries.`,
      `${packageMeshCount} front-side footprints have a named generic KiCad package mesh; package bodies are approximate silhouettes and are not manufacturer-specific markings. Remaining populated footprints are listed without invented meshes; DNP footprints are also listed but not rendered as parts.`,
      'Fourteen header pin anchors are derived from J1/J2 pad centers in PCB KiCad v1.3, with their net names copied from the pads; chip GPIO and peripheral functions are cross-referenced to the official Seeed pin map. Pin selection works in the 3D viewer and the accessible pinout list, but copper/net highlighting, firmware execution, electrical simulation and fit-check against a physical v1.3 sample are not implemented.',
      'Share-alike acceptance applies to assets with an explicit CC BY-SA grant. Seeed’s public license page applies CC BY-SA 4.0 to product documents, tutorials and associated images; the downloaded KiCad archive contains no standalone LICENSE file, so archive-specific redistribution rights remain identified as a limitation.',
    ],
  },
  scenes: [{
    id: 'pcb',
    label: 'PCB · CAD + mesh package tham khảo',
    assetUrl,
    assetVersion,
    hotspots,
    note: `Hình nền, pad, net và tọa độ 14 chân header theo PCB KiCad v1.3 của Seeed; ${packageMeshCount}/${features.length} mục có mesh package KiCad tham khảo. Chọn linh kiện hoặc chân header trên cảnh/danh sách để xem thông tin. Chọn chân chưa tô đường đồng/net, chưa chạy firmware hay mô phỏng điện.`,
  }],
}
