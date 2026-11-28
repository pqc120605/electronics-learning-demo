import type { BoardFeature, BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'
import { remainingBoardSources, remainingBoardSourceLocks, remainingCatalogBoardIndex } from './remainingCatalogBoardSources'

import { a12PinDetails } from './a12BoardPinDetails'

const safetyNote = 'Đối chiếu đúng mã board và tài liệu hãng trước khi đấu mạch thật.'

function devKitMPinDetails(label: string): Partial<BoardPin> {
  const match = /\b(?:IO|I)(\d+)\b/.exec(label)
  if (!match) {
    if (label === 'RST') return { functions: ['Reset mức thấp (EN)'], connection: 'Kéo thấp để reset ESP32.' }
    if (label === 'GND') return { functions: ['Mass (0 V)'], connection: 'Nối chung GND giữa board và mạch ngoài.' }
    return {
      functions: [label === '3V3' ? 'Rail 3,3 V' : 'Rail 5 V'],
      safetyNote: 'Chọn cách cấp nguồn theo hướng dẫn của hãng. GPIO chỉ dùng mức logic 3,3 V.',
    }
  }
  const gpio = Number(match[1])
  const functions = [gpio >= 34 ? 'GPIO chỉ nhận input' : 'GPIO digital']
  if (gpio === 1) functions.push('UART0 TX')
  if (gpio === 3) functions.push('UART0 RX')
  if (gpio === 25 || gpio === 26) functions.push('ADC2', 'DAC')
  if ([0, 2, 5, 12, 15].includes(gpio)) functions.push('Chân cấu hình lúc khởi động (strapping)')
  if (gpio === 9 || gpio === 10) functions.push('Tín hiệu liên quan đến flash')
  return {
    gpio,
    functions,
    connection: gpio === 1 || gpio === 3
      ? 'Kết nối UART0 với cầu USB–UART của board.'
      : gpio === 9 || gpio === 10
        ? 'Đối chiếu chức năng flash theo module. Mạch mẫu A11 bỏ qua hai chân này.'
        : label,
    safetyNote: gpio >= 34
      ? 'Chân chỉ đọc tín hiệu và cần điện trở kéo ngoài nếu mạch yêu cầu. GPIO dùng mức logic 3,3 V.'
      : 'GPIO dùng mức logic 3,3 V. Giữ nguyên mức yêu cầu của chân strapping trong lúc reset.',
  }
}

export const remainingCatalogBoardModels: BoardModelManifest[] = remainingCatalogBoardIndex.map(asset => {
  const board = remainingBoardSources.find(source => source.catalogId === asset.id)!
  const features: BoardFeature[] = Object.entries(asset.features).map(([ref, label]) => ({
    id: 'model-' + ref.toLowerCase(), designator: ref, name: label!,
    plainDescription: label! + ' trên ' + asset.orderCode + '.',
    technicalRole: label!,
    placementReason: asset.sourceGeometry,
    placementEvidence: 'cad',
    roleEvidence: 'source-backed',
    connection: 'Xem pad và sơ đồ nguyên lý theo đúng phiên bản.',
    safetyNote, relatedLessonPartIds: [],
  }))
  const hotspots = features.map(feature => ({ id: feature.id, featureId: feature.id, label: feature.name, nodeNames: [feature.designator!] }))
  const pins = asset.pins.map(({ anchorMm: [x,y,z], ...pin }): BoardPin => ({
    ...pin, side: pin.side === 'left' ? 'left' : 'right', anchor: [x / 1000, y / 1000, z / 1000],
    plainDescription: pin.label,
    technicalRole: 'Chân ' + pin.padNumber + ' trên ' + pin.headerReference,
    connection: pin.label,
    safetyNote,
    functions: [pin.label],
    ...(asset.id === 'esp32-devkitm-1' ? devKitMPinDetails(pin.label) : a12PinDetails(asset.id, pin.label)),
  }))
  const sourceRefs = board.sourceIds.map(id => {
    const source = remainingBoardSourceLocks[id]
    return { url: source.url ?? source.licenseUrl, sha256: source.sha256, role: source.use ?? source.publisher }
  })
  return {
    id: asset.id, assetUrl: asset.assetUrl, assetVersion: asset.assetVersion,
    features, hotspots, pins, pinPicking: true, signalFlows: [],
    scenes: [{ id: 'pcb', label: 'PCB', assetUrl: asset.assetUrl, assetVersion: asset.assetVersion, hotspots, note: asset.sourceGeometry }],
    pinoutEvidence: {
      summary: pins.length + ' chân theo tài liệu đúng phiên bản. 2D và 3D dùng cùng vị trí chọn.',
      sourceLabel: asset.orderCode + ' · pinout hãng',
      sourceUrl: asset.id.startsWith('stm32-') ? remainingBoardSourceLocks['st-um1724.pdf'].url
        : asset.id === 'arduino-nano-every' ? remainingBoardSourceLocks['nano-every-pinout.pdf'].url : board.reference,
    },
    audit: {
      status: 'educational-reconstruction', revision: asset.orderCode + ' · ' + asset.revision,
      sourceRefs, unverifiedReferences: asset.unresolvedIssues,
      auditNotes: [asset.sourceGeometry, 'Hình học thân và package dùng để tra cứu và nhận diện. Phần cứng thực tế và firmware chưa được kiểm trong đợt này.'],
    },
  }
})
