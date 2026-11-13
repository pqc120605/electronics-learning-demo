import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'

const isUnidentified = (feature: BoardFeature) => /chưa định danh/i.test(feature.name)

/** Separates what the source confirms about a part from what the 3D model actually contains. */
export function getFeatureEvidence(feature: BoardFeature): { labels: string[] } {
  const identity = feature.roleEvidence === 'source-backed' ? 'Có nguồn CAD' : feature.roleEvidence === 'unverified' ? 'Chưa xác minh chức năng' : 'Mô tả giáo dục'
  const cadIdentity = feature.cadFootprint ? 'Designator/value trong CAD' : undefined
  const body = feature.cadFootprint
    ? feature.cadFootprint.has3dBody ? 'Có mesh 3D' : 'Footprint/pad, không có mesh'
    : isUnidentified(feature) ? 'Mesh chưa định danh' : undefined
  return { labels: [identity, cadIdentity, body].filter((label): label is string => Boolean(label)) }
}

export function getBoardModelStats(manifest: Pick<BoardModelManifest, 'features'>) {
  const footprints = manifest.features.filter((feature) => feature.cadFootprint)
  const withMesh = footprints.filter((feature) => feature.cadFootprint?.has3dBody).length
  return { withMesh, withoutMesh: footprints.length - withMesh, otherGroups: manifest.features.length - footprints.length }
}

export function formatBoardModelStats({ withMesh, withoutMesh, otherGroups }: ReturnType<typeof getBoardModelStats>) {
  if (!withMesh && !withoutMesh) return `${otherGroups} nhóm mesh CAD`
  return [`${withMesh} designator có mesh`, `${withoutMesh} footprint không có mesh`, otherGroups ? `${otherGroups} nhóm PCB/mesh riêng` : ''].filter(Boolean).join(' · ')
}
