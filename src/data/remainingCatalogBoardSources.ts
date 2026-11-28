import approval from '../../docs/research/2026-11-26-catalog-model-remaining-13-proposal.json'
import type { BoardModelEvidence } from '../components/board/boardSceneTypes'
import assets from './remaining-catalog-board-assets.json'
import nucleoA1 from './a1-nucleo-board-assets.json'

export const remainingCatalogBoardIndex = [...assets, ...nucleoA1]
export const remainingBoardSources = [...approval.boards, {
  catalogId: 'stm32-nucleo',
  reference: 'https://www.st.com/en/evaluation-tools/nucleo-f401re.html',
  sourceIds: ['st-um1724.pdf', 'st-c04-schematic', 'st-mb1136-board-project', 'kicad-lqfp64-step'],
}]
export const remainingBoardSourceLocks: Record<string, { url?: string; licenseUrl?: string; sha256: string; publisher: string; use?: string }> = approval.sourceLocks

const byId = new Map(remainingCatalogBoardIndex.map(asset => [asset.id, asset]))

export function getRemainingBoardAsset(id: string) {
  return byId.get(id)
}

export function getRemainingBoardEvidence(id: string): BoardModelEvidence | undefined {
  const asset = getRemainingBoardAsset(id)
  const board = remainingBoardSources.find(item => item.catalogId === id)
  if (!asset || !board) return undefined
  const stm32 = id.startsWith('stm32-')
  const arduino = id === 'arduino-nano-every'
  return {
    status: 'educational-reconstruction',
    revision: asset.orderCode + ' · ' + asset.revision,
    sourceUrl: board.reference,
    licenseName: stm32 ? 'ST OPLA · phạm vi bản kiểm thử local'
      : arduino ? 'Arduino CC BY-SA 4.0' : 'Tài liệu phần cứng Espressif',
    attribution: stm32 ? 'STMicroelectronics, UM1724 Rev 17 và MB1136C. Package LQFP-64 từ KiCad.'
      : arduino ? 'Arduino Nano Every V4.0 · FAB, MNT, IPC-D-356 và pinout.' : 'Espressif · PCB layout, schematic và Header Block.',
    confidenceNote: asset.sourceGeometry + '. Dùng cùng hệ tọa độ cho mặt 2D và mô hình 3D.',
    unresolvedIssues: [...asset.unresolvedIssues, 'Mẫu thật và firmware chưa được kiểm trong đợt này.'],
    noticeUrl: id === 'stm32-nucleo' ? '/models/board-catalog-a1/NOTICE.txt' : '/models/board-catalog-remaining-1/NOTICE.txt',
    published: !stm32,
  }
}
