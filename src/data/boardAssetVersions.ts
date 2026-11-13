import assetLock from './board-asset-lock.json'

type LockedAsset = { sha256: string; version: string }
const lockedAssets = assetLock as Record<string, LockedAsset>

/** Use the generated lock version so browser caches change with the published model bytes. */
export function getBoardAssetVersion(path: string): string {
  const asset = lockedAssets[path]
  if (!asset) throw new Error(`Board model asset is missing from board-asset-lock.json: ${path}`)
  return asset.version
}
