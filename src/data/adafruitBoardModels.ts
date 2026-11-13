import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import inventory from './adafruit-qtpy-esp32-c3-5405.mesh-inventory.json'
import { adafruitQtPyEsp32C3Pins, adafruitQtPyEsp32C3PinoutEvidence } from './adafruitQtPyEsp32C3Pinout'
import { adafruitFeatherEsp32S3BoardModel } from './adafruitFeatherEsp32S3Models'
import { adafruitFeatherEsp32S3TftBoardModel } from './adafruitFeatherEsp32S3TftModels'

type MeshEntry = (typeof inventory.nodes)[number]
const id = 'adafruit-qtpy-esp32-c3-5405'
// Cache-bust the delivered GLB bytes, not only the unchanged source STEP file.
const assetVersion = inventory.modelSha256.slice(0, 12)

function explanation(part: MeshEntry): Pick<BoardFeature, 'name' | 'plainDescription' | 'technicalRole' | 'connection' | 'roleEvidence'> {
  if (part.nodeName === 'PCB') return { name: 'PCB · nền bo mạch', plainDescription: 'Hình học bo mạch lấy từ CAD Eagle của Adafruit.', technicalRole: 'Nền PCB theo board design Rev B.', connection: 'Các footprint, pad và net được lưu trong file board CAD gốc.', roleEvidence: 'source-backed' }
  if (part.nodeName === 'CAD_GEOMETRY_UNIDENTIFIED') return { name: 'Hình học CAD chưa định danh', plainDescription: `${part.sourceMeshes} mesh trong STEP không ghép chắc chắn được với một designator của Eagle CAD.`, technicalRole: 'Mesh CAD chưa định danh.', connection: 'Không gán chức năng hoặc kết nối điện cho nhóm hình học này.', roleEvidence: 'unverified' }
  const reference = part.designator ?? part.nodeName
  const value = part.value?.trim() || 'chưa ghi trị số'
  const footprint = part.footprint || 'chưa ghi package'
  const identity = `${reference} · ${value} · ${footprint}`
  if (reference === 'U2') return { name: `Vi điều khiển ESP32-C3FH4 · ${reference}`, plainDescription: `MCU ${identity}; định danh theo designator, value và package trong CAD Eagle.`, technicalRole: 'Vi điều khiển ESP32-C3; chạy firmware trên board thật.', connection: 'Package và tọa độ ghép từ CAD Eagle với mesh STEP theo vị trí. Pin anchor đang áp dụng cho 14 pad breakout JP1/JP3; viewer chưa hiển thị pin riêng trên package U2.', roleEvidence: 'source-backed' }
  if (reference === 'X6') return { name: `USB-C · ${reference}`, plainDescription: `Đầu nối USB-C ${identity}; tên model khớp package của STEP.`, technicalRole: 'Đầu nối USB-C trên board.', connection: 'Mesh được nhận diện bằng tên package nguồn và đối chiếu với designator X6 trong CAD Eagle.', roleEvidence: 'source-backed' }
  if (reference === 'CONN1') return { name: `STEMMA QT · ${reference}`, plainDescription: `Đầu nối STEMMA I²C ${identity}; nhận diện từ value/package CAD.`, technicalRole: 'Đầu nối ngoại vi STEMMA QT/Qwiic theo thiết kế board.', connection: 'Vị trí, footprint và designator theo CAD. Pinout SCL/SDA/3.3V/GND được mô tả trong tài liệu hãng; viewer chưa có anchor riêng cho từng tiếp điểm của connector.', roleEvidence: 'source-backed' }
  if (reference === 'U1') return { name: `Bộ ổn áp · ${reference}`, plainDescription: `IC ${identity}; mã linh kiện được ghi trong CAD Eagle.`, technicalRole: 'IC AP2112K-3.3 theo value trên board CAD.', connection: 'Mesh ghép với footprint U1; đường nguồn và net chưa được hiển thị ở viewer này.', roleEvidence: 'source-backed' }
  if (reference === 'LED1') return { name: `LED RGB địa chỉ · ${reference}`, plainDescription: `Linh kiện ${identity}; value CAD ghi mã SK6805.`, technicalRole: 'LED RGB địa chỉ hóa theo design CAD.', connection: 'Designator, package và vị trí lấy từ CAD; không mô phỏng màu/trạng thái LED trên board.', roleEvidence: 'source-backed' }
  if (reference === 'Q1' || reference === 'Q2') return { name: `${reference === 'Q1' ? 'Nút BOOT' : 'Nút RESET'} · ${reference}`, plainDescription: `Nút nhấn ${identity}; vai trò được ghi trong value CAD.`, technicalRole: reference === 'Q1' ? 'Nút BOOT0 theo thiết kế CAD.' : 'Nút reset theo thiết kế CAD.', connection: 'Footprint và mesh có cùng designator theo CAD; chưa mô phỏng thao tác nút hay net trên board.', roleEvidence: 'source-backed' }
  return { name: `${reference} · ${value}`, plainDescription: `Footprint ${identity} được đối chiếu theo designator và tọa độ với CAD Eagle.`, technicalRole: 'Có thể xem đúng tên CAD, value, package và vị trí; chức năng cụ thể chưa được xác minh từ BOM/netlist.', connection: 'Mesh STEP được ghép với designator theo tâm hình học và tọa độ board CAD (ngưỡng ≤0,015 mm), ngoại trừ đầu nối X6 được ghép bằng tên package chính xác.', roleEvidence: 'unverified' }
}

const sourceRefs = [
  { path: inventory.sourceFile, sha256: inventory.sourceSha256, license: 'CC BY-SA 2.5 · derived STEP model; see bundled notice', role: 'Adafruit CAD Parts STEP model' },
  { path: inventory.boardCadFile, sha256: inventory.boardCadSha256, license: 'CC BY-SA 3.0 · board design; preserve upstream README attribution', role: 'Adafruit Eagle board CAD and placement' },
  { url: 'https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board/pinouts', role: 'Manufacturer pin labels, GPIO functions, power notes and STEMMA QT sharing' },
]

const features: BoardFeature[] = inventory.nodes.map((part) => {
  const details = explanation(part)
  return {
    id: `cad-${part.nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...details,
    ...(part.designator ? { designator: part.designator, cadFootprint: { reference: part.designator, value: part.value ?? '', footprint: part.footprint ?? '', x: part.x ?? 0, y: part.y ?? 0, rotation: part.rotation ?? 0, side: (part.side ?? 'front') as 'front' | 'back', has3dBody: true } } : {}),
    placementReason: part.designator ? 'Tâm footprint và vị trí được lấy từ Eagle CAD; mesh STEP được đối chiếu với designator theo tọa độ hoặc tên package.' : 'Mesh nằm trong file STEP chính hãng nhưng không có ánh xạ designator đủ chắc chắn.',
    placementEvidence: 'cad',
    safetyNote: 'QT Py ESP32-C3 Rev B #5405, logic GPIO 3,3 V. Model CAD tham khảo; viewer không chạy firmware, không mô phỏng điện và không thay datasheet.',
    relatedLessonPartIds: [],
  }
})
const hotspots = features.map((feature) => ({ id: `hotspot-${feature.id}`, featureId: feature.id, label: feature.name, nodeNames: [feature.designator ?? (feature.id.endsWith('pcb') ? 'PCB' : 'CAD_GEOMETRY_UNIDENTIFIED')] }))

export const adafruitBoardModels: BoardModelManifest[] = [{
  id,
  assetUrl: `/models/${id}.glb?v=${assetVersion}`,
  assetVersion,
  features,
  hotspots,
  pins: adafruitQtPyEsp32C3Pins,
  signalFlows: [],
  pinPicking: true,
  pinoutEvidence: adafruitQtPyEsp32C3PinoutEvidence,
  audit: {
    status: 'cad-reference',
    revision: inventory.revision,
    sourceRefs,
    unverifiedReferences: inventory.nodes.filter((part) => !part.designator && part.nodeName !== 'PCB').map((part) => part.nodeName),
    auditNotes: [
      `${inventory.mappedComponentCount} STEP mesh groups were mapped to Eagle designators from matching CAD coordinates; the USB-C group X6 was identified by its exact package name.`,
      `${inventory.unidentifiedMeshCount} source meshes could not be confidently assigned to a designator and are shown as unidentified geometry.`,
      'Board geometry and fitted placements come from the named Rev B/#5405 reference CAD. Fourteen JP1/JP3 breakout pad anchors are derived from Eagle package geometry and board placement; functions come separately from Adafruit pinout documentation. This does not map IC pins or create a netlist.',
      'Derived model geometry was converted from STEP to GLB, centered, and rotated from Z-up to viewer Y-up; no reflection or physical-board validation is claimed.',
    ],
  },
  scenes: [{
    id: 'pcb', label: 'PCB · CAD tham chiếu', assetUrl: `/models/${id}.glb?v=${assetVersion}`, assetVersion, hotspots,
    note: `QT Py ESP32-C3 Rev B #5405 từ CAD Adafruit. Chọn ${features.length} nhóm CAD để xem reference, value, package và vị trí; 14 pad breakout JP1/JP3 có thể chọn trong cảnh hoặc danh sách để tra chức năng. Mesh không ghép được designator được gộp thành hình học chưa định danh. Đây là model CAD tham khảo, không phải ảnh quét hoặc mô phỏng điện/firmware.`,
  }],
}, adafruitFeatherEsp32S3BoardModel, adafruitFeatherEsp32S3TftBoardModel]
