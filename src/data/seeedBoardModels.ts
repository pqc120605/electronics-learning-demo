import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import inventory from './seeed-xiao-esp32-s3.mesh-inventory.json'
import anchorSource from './seeed-xiao-esp32-s3.pin-anchors.json'
import { seeedXiaoEsp32C3BoardModel } from './seeedXiaoEsp32C3BoardModel'
import { seeedXiaoEsp32S3Pins, seeedXiaoEsp32S3PinoutEvidence } from './seeedXiaoEsp32S3Pinout'

const id = 'seeed-xiao-esp32-s3'
const assetVersion = inventory.modelSha256.slice(0, 12)
const boardIdentity = 'Seeed Studio XIAO ESP32-S3 bản thường · STEP v2 của hãng'

function details(nodeName: string, sourceName: string, sourceMeshes: number): Pick<BoardFeature, 'name' | 'plainDescription' | 'technicalRole' | 'connection' | 'roleEvidence'> {
  if (nodeName === 'PCB') return {
    name: 'PCB · nền bo mạch',
    plainDescription: 'Hình học nền board từ model STEP v2 của Seeed Studio.',
    technicalRole: 'Thân bo mạch của XIAO ESP32-S3 phiên bản thường.',
    connection: 'Kích thước mesh nền xấp xỉ 20,955 × 17,78 mm; không xác nhận lỗ/chân điện hoặc các lớp đồng.',
    roleEvidence: 'source-backed',
  }
  if (nodeName === 'RF_SHIELD') return {
    name: 'Shield · vỏ chắn kim loại',
    plainDescription: 'Mesh trong STEP có tên nguồn “Shield”.',
    technicalRole: 'Vỏ shield được gọi tên trong model cơ khí.',
    connection: 'Tên lấy nguyên từ CAD; không suy ra linh kiện hoặc kết nối nằm bên trong shield.',
    roleEvidence: 'source-backed',
  }
  if (nodeName === 'UFL_CONNECTOR') return {
    name: 'Đầu nối U.FL · package theo tên CAD',
    plainDescription: `Mesh nguồn mang tên “${sourceName}”.`,
    technicalRole: 'Hình học đầu nối U.FL theo tên package trong STEP.',
    connection: 'Không có designator, net hoặc mapping antenna trong STEP này.',
    roleEvidence: 'source-backed',
  }
  return {
    name: 'Hình học CAD chưa định danh',
    plainDescription: `${sourceMeshes} mesh/feature STEP chưa được ghép với designator, BOM hoặc sơ đồ của đúng revision.`,
    technicalRole: 'Hình học cơ khí tham chiếu chưa định danh.',
    connection: 'Giữ nguyên hình dạng và màu nguồn; không gán tên linh kiện, chân hoặc net suy đoán.',
    roleEvidence: 'unverified',
  }
}

const features: BoardFeature[] = inventory.nodes.map((node) => ({
  id: `cad-${node.nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  ...details(node.nodeName, node.sourceName, node.sourceMeshes),
  placementReason: 'Giữ nhóm mesh theo tên gốc trong STEP; chỉ mô tả cụ thể các nhóm được nguồn nhận diện rõ.',
  placementEvidence: 'cad',
  safetyNote: `${boardIdentity}. GPIO mức 3,3 V theo hướng dẫn hãng; các anchor header lấy từ PCB Seeed OPL và căn theo outline STEP. Chưa xác nhận board vật lý/revision, netlist, firmware hoặc mô phỏng điện.`,
  relatedLessonPartIds: [],
}))
const hotspots = features.map((feature) => ({
  id: `hotspot-${feature.id}`, featureId: feature.id, label: feature.name,
  nodeNames: [feature.id === 'cad-pcb' ? 'PCB' : feature.id === 'cad-rf-shield' ? 'RF_SHIELD' : feature.id === 'cad-ufl-connector' ? 'UFL_CONNECTOR' : 'CAD_GEOMETRY_UNIDENTIFIED'],
}))
const sceneUrl = `/models/${id}.glb?v=${assetVersion}`

export const seeedBoardModels: BoardModelManifest[] = [seeedXiaoEsp32C3BoardModel, {
  id, assetUrl: sceneUrl, assetVersion, features, hotspots, pins: seeedXiaoEsp32S3Pins, signalFlows: [], pinPicking: true, pinoutEvidence: seeedXiaoEsp32S3PinoutEvidence,
  audit: {
    status: 'cad-reference', revision: inventory.revision,
    sourceRefs: [
      { path: inventory.sourceFile, sha256: inventory.sourceSha256, license: 'Model Seeed Studio CC BY-SA 4.0; giữ ghi công và chia sẻ tương tự', role: 'STEP chính hãng được chuyển thành GLB' },
      { path: anchorSource.sourcePcb, sha256: anchorSource.sourcePcbSha256, url: anchorSource.sourcePcbUrl, license: 'CC BY-SA 4.0', role: 'Pad header J1/J2; tâm pad được ánh xạ vào STEP theo transform ghi trong pin-anchor manifest' },
    ],
    unverifiedReferences: ['CAD_GEOMETRY_UNIDENTIFIED'],
    auditNotes: [
      `STEP nguồn có ${inventory.sourceMeshCount} mesh; chỉ các tên PCB/SOLID, Shield và U.FL được giữ nhãn có căn cứ. ${inventory.nodes.find((node) => node.nodeName === 'CAD_GEOMETRY_UNIDENTIFIED')?.sourceMeshes ?? 0} mesh còn lại chưa định danh.`,
      `Thân PCB trong STEP có kích thước ${inventory.pcbBodySizeMm.join(' × ')} mm. Giữ trục Y-up của nguồn và căn giữa model, không phản chiếu.`,
      `14 anchor J1/J2 được sinh từ PCB Seeed OPL (SHA-256 ${anchorSource.sourcePcbSha256}); căn tâm outline với STEP bản thường, sai số biên đo được tối đa ${anchorSource.outlineMm.maxResidualMm.longAxis} mm dọc và ${anchorSource.outlineMm.maxResidualMm.shortAxis} mm ngang. File OPL không ghi revision PCB.`,
      'GPIO/chức năng lấy từ guide Seeed hiện hành; nhãn net CAD được giữ nguyên như văn bản nguồn và không dùng để khẳng định kết nối MCU của mọi revision. Đây là XIAO ESP32-S3 bản thường, không phải Sense hoặc Plus; chưa kiểm tra trên board vật lý, chưa tạo netlist, chạy firmware hoặc mô phỏng điện.',
    ],
  },
  scenes: [{ id: 'pcb', label: 'PCB · CAD tham chiếu', assetUrl: sceneUrl, assetVersion, hotspots, note: 'Model cơ khí STEP chính hãng chuyển sang GLB. Có thể chọn 14 pad J1/J2 theo tọa độ PCB Seeed OPL đã căn outline; net CAD là nhãn của file nguồn, không khẳng định luồng điện trên mọi revision. Các mesh không có tên designator vẫn để chưa định danh; chưa có netlist, firmware hoặc mô phỏng điện.' }],
}]
