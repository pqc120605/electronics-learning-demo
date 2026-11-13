import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import inventory from './adafruit-feather-esp32-s3-5323.mesh-inventory.json'
import { adafruitFeatherEsp32S3Pins, adafruitFeatherEsp32S3PinoutEvidence } from './adafruitFeatherEsp32S3Pinout'

const id = 'adafruit-feather-esp32-s3-5323'
const assetVersion = inventory.modelSha256.slice(0, 12)
const boardIdentity = 'Adafruit Feather ESP32-S3 #5323 · 8 MB flash · không PSRAM'
const mappedByReference = new Map(inventory.nodes.filter((node) => node.designator).map((node) => [node.designator!, node]))

function describe(reference: string | undefined, value: string, footprint: string, has3dBody: boolean): Pick<BoardFeature, 'name' | 'plainDescription' | 'technicalRole' | 'connection' | 'roleEvidence'> {
  if (!reference) return {
    name: 'Hình học CAD chưa định danh',
    plainDescription: 'Các mesh STEP này chưa ghép chắc chắn với designator Eagle; không suy đoán tên hoặc chức năng.',
    technicalRole: 'Hình học CAD tham khảo chưa được nhận dạng.',
    connection: 'Không gán chân, net hay chức năng điện cho mesh này.', roleEvidence: 'unverified',
  }
  const identity = [reference, value || 'chưa ghi trị số', footprint || 'chưa ghi package'].join(' · ')
  if (reference === 'U1') return { name: `ESP32-S3-MINI-1 · ${reference}`, plainDescription: `${identity}; tên module được lấy từ value trong Eagle CAD.`, technicalRole: 'Module vi điều khiển ESP32-S3-MINI-1 theo thiết kế board #5323.', connection: 'Designator, value, footprint và vị trí có trong CAD; viewer không biểu diễn pin/net hoặc firmware.', roleEvidence: 'source-backed' }
  if (reference === 'U2') return { name: `Bộ ổn áp 3,3 V · ${reference}`, plainDescription: `${identity}; CAD ghi mã AP2112/RT9080-3.3.`, technicalRole: 'Khối ổn áp theo tên linh kiện trong CAD; không khẳng định mọi BOM/revision dùng cùng mã thay thế.', connection: 'Mesh ghép theo tọa độ CAD; net nguồn chưa được tô trong viewer này.', roleEvidence: 'source-backed' }
  if (reference === 'U3') return { name: `Bộ sạc LiPo · ${reference}`, plainDescription: `${identity}; CAD ghi MCP73831T-2ACI/OT.`, technicalRole: 'IC sạc pin LiPo theo tên trong CAD.', connection: 'Chức năng được nhận diện theo part value; viewer không mô phỏng quá trình sạc hoặc dòng pin.', roleEvidence: 'source-backed' }
  if (reference === 'U4') return { name: `Footprint BME280 · ${reference}`, plainDescription: `${identity}; Eagle CAD có footprint cảm biến, nhưng guide hãng ghi đây là vị trí dự phòng và board #5323 không lắp sẵn cảm biến BME280.`, technicalRole: 'Footprint dự phòng cho BME280; không phải linh kiện đã lắp trên board tham chiếu.', connection: 'Vị trí theo CAD. Muốn dùng cảm biến cần tự lắp đúng module/linh kiện và kiểm tra schematic, BOM cùng revision.', roleEvidence: 'source-backed' }
  if (reference === 'IC1') return { name: `Fuel gauge LC709203F · ${reference}`, plainDescription: `${identity}; mã IC được lấy từ CAD.`, technicalRole: 'Mạch giám sát pin theo tên linh kiện trong CAD.', connection: 'Không mô phỏng đo pin hoặc giao tiếp I²C.', roleEvidence: 'source-backed' }
  if (reference === 'X3') return { name: `Đầu nối USB-C · ${reference}`, plainDescription: `${identity}; đầu nối nằm cạnh mép board theo CAD.`, technicalRole: 'Đầu nối USB-C trên board tham chiếu.', connection: 'Mesh STEP và vị trí ghép với thiết kế Eagle; không xác nhận khả năng cấp nguồn/dữ liệu cho mọi cáp.', roleEvidence: 'source-backed' }
  if (reference === 'LED1') return { name: `NeoPixel SK6805 · ${reference}`, plainDescription: `${identity}; mã LED được ghi trong CAD.`, technicalRole: 'LED RGB địa chỉ hóa theo thiết kế board.', connection: 'Không mô phỏng tín hiệu hay trạng thái LED trên board.', roleEvidence: 'source-backed' }
  if (/^SW\d+$/.test(reference)) return { name: `Nút nhấn · ${reference}`, plainDescription: `${identity}; CAD xác nhận nút nhấn nhưng viewer không gán chức năng BOOT/RESET nếu chưa đối chiếu net/schematic.`, technicalRole: 'Nút nhấn của board tham chiếu.', connection: 'Mesh/footprint theo CAD; không mô phỏng thao tác hoặc boot sequence.', roleEvidence: 'unverified' }
  if (reference === 'CONN1' || reference === 'U$53') return { name: `Đầu nối ngoại vi · ${reference}`, plainDescription: `${identity}; tên connector lấy từ CAD.`, technicalRole: 'Đầu nối trên board; loại và pinout cần xem schematic/pinout nguồn.', connection: 'Viewer chỉ trình bày vị trí CAD, chưa hiển thị net của từng chân.', roleEvidence: 'source-backed' }
  return {
    name: `${reference} · ${value || 'chưa ghi trị số'}${has3dBody ? '' : ' · footprint không có mesh'}`,
    plainDescription: has3dBody ? `Mesh được ghép với footprint ${identity} theo tọa độ nguồn CAD.` : `Footprint ${identity} có trong Eagle CAD nhưng không có mesh STEP ghép được.`,
    technicalRole: has3dBody ? 'Hình học và danh tính hiển thị đúng theo CAD; chức năng cần đối chiếu schematic/BOM.' : 'Có vị trí footprint trong CAD nhưng chưa có hình khối 3D.',
    connection: 'Không suy luận net hoặc chức năng chỉ từ vị trí; xem schematic và BOM của đúng revision.', roleEvidence: 'unverified',
  }
}

const meshFeatures: BoardFeature[] = inventory.nodes.map((node) => {
  const reference = node.designator
  const details = node.nodeName === 'PCB'
    ? { name: 'PCB · nền bo mạch', plainDescription: 'Hình học bo mạch lấy từ STEP chính hãng của Adafruit.', technicalRole: 'Bề mặt PCB của board #5323.', connection: 'Eagle CAD và schematic đi kèm nguồn; viewer không tô net.', roleEvidence: 'source-backed' as const }
    : describe(reference, node.value ?? '', node.footprint ?? '', true)
  return {
    id: `cad-${(reference ?? node.nodeName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...details,
    ...(reference ? { designator: reference, cadFootprint: { reference, value: node.value ?? '', footprint: node.footprint ?? '', x: node.x ?? 0, y: node.y ?? 0, rotation: node.rotation ?? 0, side: (node.side ?? 'front') as 'front' | 'back', has3dBody: true } } : {}),
    placementReason: reference ? 'Designator và tọa độ lấy từ Eagle CAD; mesh STEP chỉ được gán khi tâm hình học khớp trong ngưỡng 0,015 mm.' : 'Mesh có trong STEP chính hãng nhưng chưa ghép chắc chắn với designator.',
    placementEvidence: 'cad',
    safetyNote: `${boardIdentity}. Logic I/O 3,3 V; đây là CAD tham chiếu, không thay pinout/datasheet và không mô phỏng điện.`,
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
    placementReason: 'Vị trí và góc quay có trong Eagle CAD; model STEP không có mesh được ghép với footprint này.',
    placementEvidence: 'cad',
    safetyNote: `${boardIdentity}. Mục này chỉ có footprint CAD, chưa có model 3D tương ứng.`,
    relatedLessonPartIds: [],
  }
})
const features = [...meshFeatures, ...footprintOnlyFeatures]
const hotspots = features.map((feature) => ({
  id: `hotspot-${feature.id}`, featureId: feature.id, label: feature.name,
  nodeNames: feature.designator ? mappedByReference.has(feature.designator) ? [feature.designator] : [] : feature.id.endsWith('pcb') ? ['PCB'] : ['CAD_GEOMETRY_UNIDENTIFIED'],
}))
const sceneUrl = `/models/${id}.glb?v=${assetVersion}`

export const adafruitFeatherEsp32S3BoardModel: BoardModelManifest = {
  id, assetUrl: sceneUrl, assetVersion, features, hotspots, pins: adafruitFeatherEsp32S3Pins, signalFlows: [], pinPicking: true, pinoutEvidence: adafruitFeatherEsp32S3PinoutEvidence,
  audit: {
    status: 'cad-reference', revision: inventory.revision,
    sourceRefs: [
      { path: inventory.sourceFile, sha256: inventory.sourceSha256, license: 'MIT · Adafruit CAD Parts repository; see bundled license', role: 'Official Adafruit product STEP model' },
      { path: inventory.boardCadFile, sha256: inventory.boardCadSha256, license: 'CC BY-SA 3.0 · preserve README attribution and complete upstream description', role: 'Official Adafruit Eagle board placement' },
      { url: 'https://learn.adafruit.com/adafruit-esp32-s3-feather/pinouts', role: 'Manufacturer header labels, analog/digital functions, I²C and safety notes' },
      { url: 'https://raw.githubusercontent.com/espressif/arduino-esp32/master/variants/adafruit_feather_esp32s3/pins_arduino.h', role: 'Official Arduino ESP32 core variant GPIO aliases for PID #5323' },
    ],
    unverifiedReferences: [...inventory.nodes.filter((node) => !node.designator).map((node) => node.nodeName), ...footprintOnlyFeatures.map((feature) => feature.designator!)],
    auditNotes: [
      `${inventory.mappedComponentCount}/${inventory.cadElementCount} Eagle designators have matched STEP geometry; CAD footprints without a matched mesh remain in the parts list without invented geometry.`,
      `${inventory.unidentifiedMeshCount} STEP source meshes are grouped as unidentified geometry and are not assigned a BOM role, net, or function.`,
      'The official PID #5323 is the 8 MB flash/no-PSRAM variant; related boards with other PSRAM variants are not asserted to be identical products.',
      'Converted from vendor STEP to GLB; the conversion centers and rotates Z-up geometry to viewer Y-up without reflection. Twenty-eight JP1/JP3 header pads can be selected for static lookup; this does not expose IC pins, create a netlist, highlight copper, run firmware, or simulate electricity. No physical sample validation is claimed.',
    ],
  },
  scenes: [{ id: 'pcb', label: 'PCB · CAD tham chiếu', assetUrl: sceneUrl, assetVersion, hotspots, note: `Adafruit Feather ESP32-S3 #5323 theo CAD hãng. ${inventory.mappedComponentCount}/${inventory.cadElementCount} designator có mesh ghép được; footprint thiếu mesh vẫn tra được trong danh sách. Chọn 28 pad JP1/JP3 để tra net CAD và alias GPIO theo đúng PID; đây không phải net highlighting, mô phỏng điện hoặc firmware.` }],
}

