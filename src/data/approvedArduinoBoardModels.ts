import type { BoardFeature, BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'
import assets from './approved-arduino-assets.json'

export const approvedArduinoBoardModels: BoardModelManifest[] = assets.map(asset => {
  const { sku, assetUrl, assetVersion, pinoutUrl } = asset
  const safetyNote = 'Tra điện áp và dòng cho đúng chân trong pinout Arduino trước khi đấu thật.'
  const boardFeature: BoardFeature = {
    id: 'cad-pcb', name: 'Thân PCB',
    plainDescription: `Đế PCB của Arduino ${sku} từ STEP chính hãng.`,
    technicalRole: 'Đỡ các linh kiện và đầu nối.',
    connection: 'Xem net của từng chân trong nhóm header.',
    safetyNote, relatedLessonPartIds: [],
  }
  const features = [boardFeature, ...Object.entries(asset.features).map(([reference, label]): BoardFeature => ({
    id: 'cad-' + reference.toLowerCase(), name: label!, designator: reference,
    plainDescription: `${label} trên board ${sku}.`,
    technicalRole: label!,
    placementReason: 'Vị trí theo designator trùng giữa STEP và PCB chính hãng.',
    placementEvidence: 'cad', roleEvidence: 'source-backed',
    connection: `Designator ${reference}. Đối chiếu sơ đồ Arduino để xem kết nối.`,
    safetyNote, relatedLessonPartIds: [],
  }))]
  const hotspots = features.map(feature => ({
    id: feature.id, featureId: feature.id, label: feature.name, nodeNames: [feature.designator ?? 'PCB'],
  }))
  const pins = asset.pins.map(({ anchorMm: [x, y, z], ...pin }): BoardPin => ({
    ...pin, side: pin.side === 'left' ? 'left' : 'right',
    anchor: [x / 1000, y / 1000, z / 1000],
  }))
  const revision = sku + ' · STEP và PCB Arduino chính hãng'
  return {
    id: asset.id, assetUrl, assetVersion, features, hotspots, pins, pinPicking: true, signalFlows: [],
    scenes: [{ id: 'pcb', label: 'PCB', assetUrl, assetVersion, hotspots, note: 'Hình học STEP của Arduino.' }],
    pinoutEvidence: {
      summary: `Đã đối chiếu ${pins.length} chân header theo pinout ${sku}, PCB và chân STEP. Điểm chọn theo tâm chân STEP. Sai lệch ngang so với PCB tối đa ${asset.maxPadOffsetMm} mm.`,
      sourceLabel: 'Pinout Arduino ' + sku, sourceUrl: pinoutUrl,
    },
    audit: {
      status: 'cad-reference', revision,
      sourceRefs: [
        { url: asset.stepSourceUrl, sha256: asset.sourceSha256, role: 'Hình học STEP' },
        { url: asset.pcbSourceUrl, sha256: asset.pcbSha256, role: 'Vị trí pad PCB' },
        { url: pinoutUrl, role: 'Tên chân Arduino' },
      ],
      unverifiedReferences: [],
      auditNotes: ['Mặt 2D và 3D dùng cùng hệ tọa độ.', 'Vị trí trên phần cứng thực tế và chạy firmware chưa được kiểm trong đợt này.'],
    },
  }
})
