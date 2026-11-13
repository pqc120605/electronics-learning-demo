import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import inventory from './adafruit-feather-esp32-s3-tft-5483.mesh-inventory.json'
import { adafruitFeatherEsp32S3TftPins, adafruitFeatherEsp32S3TftPinoutEvidence } from './adafruitFeatherEsp32S3Pinout'

const id = 'adafruit-feather-esp32-s3-tft-5483'
const assetVersion = inventory.modelSha256.slice(0, 12)
const boardIdentity = 'Adafruit Feather ESP32-S3 TFT #5483 · 4 MB flash · 2 MB PSRAM'
const mappedByReference = new Map(inventory.nodes.filter((node) => node.designator).map((node) => [node.designator!, node]))

function describe(reference: string | undefined, value: string, footprint: string, has3dBody: boolean): Pick<BoardFeature, 'name' | 'plainDescription' | 'technicalRole' | 'connection' | 'roleEvidence'> {
  if (!reference) return {
    name: 'Hình học CAD chưa định danh',
    plainDescription: 'Các mesh STEP chưa ghép chắc chắn với designator Eagle nên không suy đoán chức năng.',
    technicalRole: 'Hình học CAD tham khảo chưa nhận dạng.',
    connection: 'Không gán chân, net hay chức năng điện cho nhóm mesh này.',
    roleEvidence: 'unverified',
  }
  const identity = [reference, value || 'chưa ghi trị số', footprint || 'chưa ghi package'].join(' · ')
  if (reference === 'U6') return { name: `ESP32-S3-MINI-1 · ${reference}`, plainDescription: `${identity}; module MCU được định danh theo value trong Eagle CAD.`, technicalRole: 'Module ESP32-S3 theo thiết kế Adafruit Feather ESP32-S3 TFT #5483.', connection: 'Model không hiển thị chân, net, firmware hoặc trạng thái chạy.', roleEvidence: 'source-backed' }
  if (reference === 'DISP1') return { name: `Màn hình TFT 1,14 inch · ${reference}`, plainDescription: `${identity}; CAD ghi panel 240 × 135 px, khớp mô tả board nguồn.`, technicalRole: 'Màn hình màu TFT/SPI của board tham chiếu.', connection: 'Đây là hình học hiển thị; viewer không mô phỏng nội dung, SPI hoặc backlight.', roleEvidence: 'source-backed' }
  if (reference === 'U3') return { name: `IC sạc LiPo MCP73831 · ${reference}`, plainDescription: `${identity}; part number lấy từ Eagle CAD.`, technicalRole: 'Bộ sạc pin theo tên linh kiện trong nguồn CAD.', connection: 'Không mô phỏng quá trình sạc, dòng pin hay điều kiện bảo vệ.', roleEvidence: 'source-backed' }
  if (reference === 'U2' || reference === 'U5') return { name: `Bộ ổn áp 3,3 V · ${reference}`, plainDescription: `${identity}; mã AP2112-3.3 có trong Eagle CAD.`, technicalRole: 'LDO 3,3 V theo value của thiết kế board.', connection: 'Không tô net nguồn và không tính sụt áp/nhiệt trong viewer.', roleEvidence: 'source-backed' }
  if (reference === 'IC1') return { name: `Fuel gauge LC709203F · ${reference}`, plainDescription: `${identity}; part number lấy từ Eagle CAD.`, technicalRole: 'IC giám sát pin theo thiết kế.', connection: 'Không mô phỏng I²C hoặc dung lượng pin.', roleEvidence: 'source-backed' }
  if (reference === 'X3') return { name: `Đầu nối USB-C · ${reference}`, plainDescription: `${identity}; package chính xác có trong CAD.`, technicalRole: 'Đầu nối USB-C trên board tham chiếu.', connection: 'Hình học theo CAD; không xác nhận chất lượng/công năng mọi cáp USB-C.', roleEvidence: 'source-backed' }
  if (reference === 'X1') return { name: `Đầu nối pin JST-PH · ${reference}`, plainDescription: `${identity}; loại đầu nối lấy từ CAD.`, technicalRole: 'Đầu nối pin LiPo theo thiết kế.', connection: 'Kiểm tra cực tính và pinout trước khi dùng pin thật; viewer không mô phỏng nguồn.', roleEvidence: 'source-backed' }
  if (reference === 'CONN1') return { name: `Đầu nối STEMMA QT · ${reference}`, plainDescription: `${identity}; tên/package được lấy từ CAD.`, technicalRole: 'Đầu nối ngoại vi STEMMA QT/I²C của thiết kế.', connection: 'Không hiển thị ánh xạ từng chân hoặc net trong viewer.', roleEvidence: 'source-backed' }
  if (reference === 'LED1') return { name: `NeoPixel SK6805 · ${reference}`, plainDescription: `${identity}; mã LED có trong CAD.`, technicalRole: 'LED RGB địa chỉ hóa theo thiết kế board.', connection: 'Không mô phỏng dữ liệu hoặc màu LED tích hợp.', roleEvidence: 'source-backed' }
  if (reference === 'U4' || reference === 'IC2') return { name: `${value} · ${reference}`, plainDescription: `${identity}; value/package hiện diện trong CAD.`, technicalRole: 'Tên cảm biến được ghi trong thiết kế; chưa suy ra linh kiện nào được lắp đồng thời nếu BOM không xác nhận.', connection: 'Không hiển thị net hoặc đo dữ liệu cảm biến.', roleEvidence: 'source-backed' }
  if (/^SW\d+$/.test(reference)) return { name: `Nút nhấn · ${reference}`, plainDescription: `${identity}; CAD xác nhận footprint nút nhấn, nhưng viewer không gán nhãn BOOT/RESET.`, technicalRole: 'Nút nhấn cơ theo CAD board.', connection: 'Không mô phỏng tác động cơ hoặc trạng thái khởi động.', roleEvidence: 'source-backed' }
  return {
    name: `${reference} · ${value || 'chưa ghi trị số'}${has3dBody ? '' : ' · footprint không có mesh'}`,
    plainDescription: has3dBody ? `Mesh ghép với footprint ${identity} theo tâm tọa độ Eagle.` : `Footprint ${identity} có trong CAD nhưng STEP không có mesh ghép được.`,
    technicalRole: has3dBody ? 'Hình học/package và định danh hiển thị theo CAD; chức năng cần đối chiếu schematic/BOM.' : 'Có footprint CAD nhưng không có khối 3D trong STEP.',
    connection: 'Không suy luận net hoặc chức năng từ vị trí. Xem schematic/BOM đúng revision.',
    roleEvidence: 'unverified',
  }
}

const meshFeatures: BoardFeature[] = inventory.nodes.map((node) => {
  const details = node.nodeName === 'PCB'
    ? { name: 'PCB · nền bo mạch', plainDescription: 'Hình học bo mạch lấy từ STEP nguồn Adafruit.', technicalRole: 'PCB của Feather ESP32-S3 TFT #5483.', connection: 'Eagle CAD/schematic nguồn được liên kết; viewer không tô net.', roleEvidence: 'source-backed' as const }
    : describe(node.designator, node.value ?? '', node.footprint ?? '', true)
  return {
    id: `cad-${(node.designator ?? node.nodeName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...details,
    ...(node.designator ? { designator: node.designator, cadFootprint: { reference: node.designator, value: node.value ?? '', footprint: node.footprint ?? '', x: node.x ?? 0, y: node.y ?? 0, rotation: node.rotation ?? 0, side: (node.side ?? 'front') as 'front' | 'back', has3dBody: true } } : {}),
    placementReason: node.designator ? 'Designator/vị trí từ Eagle; mesh STEP ghép theo tâm CAD trong ngưỡng 0,015 mm hoặc package khớp chính xác.' : 'Mesh STEP không có designator đủ chắc chắn.',
    placementEvidence: 'cad',
    safetyNote: `${boardIdentity}. GPIO mức 3,3 V; xem guide/pinout và xác nhận đúng SKU trước khi đấu thật. Đây là CAD tham khảo, không mô phỏng điện/firmware.`,
    relatedLessonPartIds: [],
  }
})

const mappedReferences = new Set(inventory.nodes.flatMap((node) => node.designator ? [node.designator] : []))
const footprintOnlyFeatures: BoardFeature[] = inventory.elements.filter((element) => !mappedReferences.has(element.reference)).map((element) => {
  const details = describe(element.reference, element.value ?? '', element.footprint ?? '', false)
  return {
    id: `cad-${element.reference.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...details,
    designator: element.reference,
    cadFootprint: { reference: element.reference, value: element.value ?? '', footprint: element.footprint ?? '', x: element.x, y: element.y, rotation: element.rotation, side: element.side as 'front' | 'back', has3dBody: false },
    placementReason: 'Vị trí/góc quay từ Eagle CAD; STEP không có mesh được ghép chắc chắn với footprint này.',
    placementEvidence: 'cad',
    safetyNote: `${boardIdentity}. Chỉ hiển thị footprint CAD, không có khối 3D tương ứng.`,
    relatedLessonPartIds: [],
  }
})
const features = [...meshFeatures, ...footprintOnlyFeatures]
const hotspots = features.map((feature) => ({
  id: `hotspot-${feature.id}`, featureId: feature.id, label: feature.name,
  nodeNames: feature.designator ? mappedByReference.has(feature.designator) ? [feature.designator] : [] : feature.id.endsWith('pcb') ? ['PCB'] : ['CAD_GEOMETRY_UNIDENTIFIED'],
}))
const sceneUrl = `/models/${id}.glb?v=${assetVersion}`

export const adafruitFeatherEsp32S3TftBoardModel: BoardModelManifest = {
  id, assetUrl: sceneUrl, assetVersion, features, hotspots, pins: adafruitFeatherEsp32S3TftPins, signalFlows: [], pinPicking: true, pinoutEvidence: adafruitFeatherEsp32S3TftPinoutEvidence,
  audit: {
    status: 'cad-reference', revision: inventory.revision,
    sourceRefs: [
      { path: inventory.sourceFile, sha256: inventory.sourceSha256, license: 'MIT · Adafruit CAD Parts repository; see bundled license', role: 'Official Adafruit PID #5483 STEP model' },
      { path: inventory.boardCadFile, sha256: inventory.boardCadSha256, license: 'CC BY-SA 3.0 · preserve the complete upstream README and attribution', role: 'Official Feather ESP32-S3 TFT Eagle placement' },
      { url: 'https://learn.adafruit.com/adafruit-esp32-s3-tft-feather/pinouts', role: 'Manufacturer header labels, analog/digital functions, TFT and I²C notes' },
      { url: 'https://raw.githubusercontent.com/espressif/arduino-esp32/master/variants/adafruit_feather_esp32s3_tft/pins_arduino.h', role: 'Official Arduino ESP32 core variant GPIO aliases for PID #5483 TFT' },
    ],
    unverifiedReferences: [...inventory.nodes.filter((node) => !node.designator).map((node) => node.nodeName), ...footprintOnlyFeatures.map((feature) => feature.designator!)],
    auditNotes: [
      `${inventory.mappedComponentCount}/${inventory.cadElementCount} Eagle designators have matched STEP geometry; unmapped footprints remain in the list without invented meshes.`,
      `${inventory.unidentifiedMeshCount} STEP meshes remain grouped as unidentified geometry.`,
      'This is the Adafruit Feather ESP32-S3 TFT PID #5483 (4 MB flash + 2 MB PSRAM); do not treat it as PID #5323, #5477, #5691, or #5885.',
      'Converted from official STEP to GLB; exact package identity is required for asymmetric USB-C/TFT meshes. Rotated Z-up to viewer Y-up and centered without reflection. Twenty-eight JP1/JP3 header pads can be selected for static lookup; this does not expose IC pins, create a netlist, highlight copper, run firmware, or simulate electricity. No physical-board validation is claimed.',
    ],
  },
  scenes: [{ id: 'pcb', label: 'PCB · CAD tham chiếu', assetUrl: sceneUrl, assetVersion, hotspots, note: `Adafruit Feather ESP32-S3 TFT #5483 theo CAD hãng. ${inventory.mappedComponentCount}/${inventory.cadElementCount} designator có mesh ghép được; footprint thiếu mesh vẫn tra được trong danh sách. Chọn 28 pad JP1/JP3 để tra net CAD và alias GPIO theo đúng PID; đây không phải net highlighting, mô phỏng điện hoặc firmware.` }],
}
