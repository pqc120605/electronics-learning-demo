import type { BoardModelManifest } from '../components/board/boardSceneTypes'

/** Static manufacturer pin references can be explored without claiming 3D pad coordinates. */
export function canExploreBoardPinout(manifest: Pick<BoardModelManifest, 'pins' | 'pinPicking'>): boolean {
  return manifest.pins.length > 0
}
