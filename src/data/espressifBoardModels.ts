import type { BoardFeature, BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'
import inventory from './esp32-s3-devkitc-1.inventory.json'
import pinAnchors from './esp32-s3-devkitc-1.pin-anchors.json'

const id = 'esp32-s3-devkitc-1'
const assetVersion = inventory.modelSha256.slice(0, 12)
const assetUrl = `/models/esp32-s3-devkitc-1-v1.1.glb?v=${assetVersion}`
const revision = 'Espressif ESP32-S3-DevKitC-1 · PCB V1.1 · PADS reference import'
const guideUrl = 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html'
const assignedNets = (component: typeof inventory.components[number]) => component.pads.filter((pad) => pad.net)

const features: BoardFeature[] = inventory.components.map((component) => {
  const nets = assignedNets(component)
  const manufacturerPart = [component.manufacturer, component.manufacturerPartNumber].filter(Boolean).join(' · ')
  const bomDetails = [
    component.value ? `Giá trị BOM: ${component.value}.` : '',
    component.bomDescription,
    manufacturerPart ? `Nhà sản xuất: ${manufacturerPart}.` : component.bomPresent ? 'BOM không ghi mã nhà sản xuất cho designator này.' : 'Không có dòng BOM xác nhận cho designator này.',
  ].filter(Boolean).join(' ')
  const netSummary = nets.length
    ? `${nets.length}/${component.pads.length} pad có nhãn net trong PCB PADS đã nhập. Đây là nhãn CAD nguồn, chưa được kiểm chứng bằng netlist/schematic sau chuyển đổi.`
    : 'Footprint có trong PCB nguồn nhưng không có tên net pad được nhập.'
  const modelDescription = component.has3dBody
    ? `Mesh là model package KiCad dùng chung (${component.packageModel}); chỉ ESP32-S3-WROOM-1 là model module theo đúng họ package. Hình không xác nhận marking, mã mua hàng hoặc board vật lý.`
    : 'Footprint có trong CAD nhưng chưa có mesh package.'
  const displayName = component.evidence === 'unverified'
    ? `${component.reference} · Footprint ${component.footprint || 'CAD'} · chưa định danh BOM`
    : `${component.reference} · ${component.label}`
  return {
    id: `cad-${component.reference.toLowerCase()}`,
    designator: component.reference,
    name: displayName,
    plainDescription: bomDetails || component.description || 'Chưa có mô tả BOM cho designator này.',
    technicalRole: `${component.partType || 'Vai trò chưa xác minh'}${component.footprint ? ` · footprint ${component.footprint}` : ''}${component.dnp ? ' · không lắp theo BOM' : ''}`,
    connection: netSummary,
    safetyNote: `${modelDescription} Dữ liệu PCB nhập có lỗi DRC/chưa nối; không dùng để chế tạo, xác nhận điện hoặc thay datasheet.`,
    relatedLessonPartIds: [],
    placementReason: `Tọa độ ${component.x.toFixed(3)}, ${component.y.toFixed(3)} mm; xoay ${component.rotation}°; mặt ${component.side === 'front' ? 'trên' : 'dưới'} theo PADS→KiCad.`,
    placementEvidence: 'cad',
    cadFootprint: {
      reference: component.reference,
      value: String(component.value || ''),
      footprint: component.footprint,
      x: component.x,
      y: component.y,
      rotation: component.rotation,
      side: component.side as 'front' | 'back',
      has3dBody: component.has3dBody,
      pads: component.pads,
    },
    roleEvidence: component.evidence as BoardFeature['roleEvidence'],
  }
})

const pinFunction = (label: string): { gpio?: number; functions: string[]; description: string; technicalRole: string; safetyNote: string } => {
  const gpioMatch = label.match(/GPIO(\d+)/)
  const gpio = gpioMatch ? Number(gpioMatch[1]) : undefined
  if (label === '3V3') return { functions: ['Nguồn 3,3 V'], description: 'Chân nguồn 3,3 V của board.', technicalRole: 'Rail 3V3 theo pinout Espressif.', safetyNote: 'Không đưa 5 V vào chân này; dòng khả dụng phụ thuộc nguồn, tải và điều kiện nhiệt của board thật.' }
  if (label === '5V') return { functions: ['Nguồn 5 V / USB'], description: 'Chân 5 V của board theo pinout chính hãng.', technicalRole: 'Rail 5V/VBUS; cách cấp nguồn phụ thuộc cấu hình board.', safetyNote: 'Không đưa 5 V vào GPIO. Tránh cấp đồng thời nhiều nguồn nếu chưa đối chiếu hướng dẫn và sơ đồ đúng revision.' }
  if (label === 'GND') return { functions: ['Mass'], description: 'Mass chung của mạch.', technicalRole: 'GND theo pinout/header CAD.', safetyNote: 'Ngắt nguồn trước khi thay dây; nối mass đúng sơ đồ mạch.' }
  if (label === 'EN') return { functions: ['Enable / Reset'], description: 'Chân enable/reset của module.', technicalRole: 'CHIP_PU / EN; thấp giữ chip ở reset.', safetyNote: 'Không kéo xuống thấp nếu muốn chương trình chạy; tránh drive sai mức hoặc tải nặng.' }
  if (label.startsWith('TX/')) return { gpio, functions: ['GPIO', 'UART0 TX'], description: 'Chân UART0 TX theo tên trên hướng dẫn board; có thể dùng GPIO khi UART không chiếm dụng.', technicalRole: 'GPIO43 / U0TXD.', safetyNote: 'Mức I/O 3,3 V; chỉ nối UART logic tương thích 3,3 V.' }
  if (label.startsWith('RX/')) return { gpio, functions: ['GPIO', 'UART0 RX'], description: 'Chân UART0 RX theo tên trên hướng dẫn board; có thể dùng GPIO khi UART không chiếm dụng.', technicalRole: 'GPIO44 / U0RXD.', safetyNote: 'Mức I/O 3,3 V; không chịu logic 5 V trực tiếp.' }
  const strap = gpio === 0 || gpio === 45 || gpio === 46
  const memory = gpio !== undefined && [35, 36, 37].includes(gpio)
  const led = gpio === 38
  return {
    gpio,
    functions: ['GPIO', ...(led ? ['Tín hiệu RGB LED tích hợp'] : [])],
    description: led ? 'GPIO38 đồng thời điều khiển RGB LED tích hợp trên PCB V1.1.' : `GPIO${gpio} được đưa ra header J1/J3 theo pinout chính hãng.`,
    technicalRole: `${label}${strap ? ' · chân cấu hình khởi động/strapping' : ''}${memory ? ' · có thể được module octal-memory sử dụng nội bộ' : ''}${led ? ' · RGB LED V1.1' : ''}`,
    safetyNote: `I/O ESP32-S3 dùng mức 3,3 V, không chịu 5 V trực tiếp.${strap ? ' Tải ngoài có thể ảnh hưởng chế độ khởi động.' : ''}${memory ? ' GPIO35–37 có thể không sẵn dùng tùy biến thể flash/PSRAM của module.' : ''}${led ? ' LED tích hợp tạo tải trên chân; tính đến khi chọn tải ngoài.' : ''}`,
  }
}

const pins: BoardPin[] = pinAnchors.headers.flatMap((header) => header.pins.map((anchor) => {
  const details = pinFunction(anchor.label)
  const padLabel = `${header.headerReference} pad ${anchor.padNumber}`
  return {
    id: anchor.id,
    side: header.side as 'left' | 'right',
    position: anchor.position,
    label: anchor.label,
    headerReference: header.headerReference,
    padNumber: anchor.padNumber,
    netName: anchor.netName ?? undefined,
    gpio: details.gpio,
    anchor: [Number((anchor.xMm / 1000).toFixed(7)), Number((pinAnchors.boardTopMm / 1000).toFixed(7)), Number((anchor.zMm / 1000).toFixed(7))],
    plainDescription: details.description,
    technicalRole: details.technicalRole,
    connection: `${padLabel}; net label ${anchor.netName ?? 'không đặt tên'} lấy từ PADS→KiCad. Mapping/chức năng theo guide Espressif; net nhập chưa được đối chiếu độc lập với schematic.`,
    safetyNote: details.safetyNote,
    functions: details.functions,
  }
}))

const hotspots = features.map((feature) => {
  const component = inventory.components.find((item) => item.reference === feature.designator)
  return {
    id: `hotspot-${feature.id}`,
    featureId: feature.id,
    label: feature.name,
    nodeNames: component?.modelNodeNames ?? [],
  }
})

export const esp32S3DevkitC1Model: BoardModelManifest = {
  id,
  assetUrl,
  assetVersion,
  features,
  hotspots,
  pins,
  signalFlows: [],
  pinPicking: true,
  scenes: [{
    id: 'pcb',
    label: 'PCB 3D · PADS→KiCad',
    assetUrl,
    assetVersion,
    hotspots,
    note: 'Mô hình tham chiếu giáo dục từ PADS ASCII/BOM Espressif V1.1. Mesh package được gắn theo footprint; phần lớn là hình package KiCad chung. Tọa độ đã nhập chưa xác minh trên board thật, DRC lỗi nên không dùng chế tạo. Chọn footprint hoặc pad để xem dữ liệu nguồn.',
  }],
  pinoutEvidence: {
    summary: 'Tọa độ J1/J3 từ pad centers của PCB nguồn sau nhập PADS→KiCad; tên pin theo guide V1.1. Số đo, góc và lưới chưa được xác minh trên board vật lý.',
    sourceLabel: 'Espressif · User Guide v1.1',
    sourceUrl: guideUrl,
  },
  audit: {
    status: 'educational-reconstruction',
    revision,
    sourceRefs: [
      {
        path: inventory.sourceFile,
        sha256: inventory.sourcePcbSha256,
        url: 'https://documentation.espressif.com/ESP32-S3-DevKitC-1_Reference_Design.zip',
        license: 'Điều khoản reference design Espressif; ghi công và giữ thông báo. Điều khoản cho product development kèm yêu cầu verification/testing; không cấp quyền nhãn hiệu và yêu cầu gỡ dấu Espressif nếu thương mại hóa thiết kế đã sửa.',
        role: 'PADS PCB nhập qua KiCad để dựng hình học và vị trí footprint; import có lỗi DRC, không dùng cho sản xuất.',
      },
      {
        path: 'public/models/esp32-s3-devkitc-1-v1.1.glb',
        sha256: inventory.modelSha256,
        license: 'GLB được dựng lại từ source board cùng package KiCad 3D; giữ attribution và share-alike CC BY-SA 4.0 cho model package áp dụng theo giấy phép/ngoại lệ chính thức của KiCad.',
        role: 'Derived educational visualization; không phải model được Espressif phát hành.',
      },
      { url: guideUrl, role: 'Tên pinout, chức năng nút/USB/RGB LED, lưu ý về GPIO38 và biến thể board.' },
    ],
    unverifiedReferences: inventory.components.filter((component) => component.evidence === 'unverified' || !component.manufacturerPartNumber).map((component) => component.reference),
    auditNotes: [
      'BOM định danh linh kiện; một số mesh là package chung, không có marking của nhà sản xuất.',
      'Hình viền chuyển từ PADS ASCII có chiều cao 62.865 mm, lệch 0.125 mm so với PDF kích thước Espressif 62.74 mm; giữ theo outline source đồng bộ với tọa độ PADS và công khai sai lệch.',
      'PADS import có lỗi DRC và mục chưa nối; không dùng GLB hoặc PCB dẫn xuất để chế tạo, xác nhận electrical/netlist, firmware hay simulator.',
      'BOM không khóa duy nhất biến thể module flash/PSRAM; không khẳng định đây là N8R8 hay module cụ thể trên mọi board V1.1.',
    ],
  },
}

export const espressifBoardModels: BoardModelManifest[] = [esp32S3DevkitC1Model]
