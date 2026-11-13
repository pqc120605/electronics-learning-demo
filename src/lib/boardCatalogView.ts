const boardsWithCopperLayerView = new Set([
  'arduino-uno-r3',
  'arduino-nano-classic',
  'arduino-mega-2560-r3',
  'esp32-devkit',
])

export type BoardCatalogView = '3d' | '2d'

export type BoardLink = { boardId: string; status: 'viewer' | 'lookup' | 'unknown'; requestedId?: string }

/** Resolve a shareable board query; a board without a viewer keeps its own profile, an unknown id is reported. */
export function resolveBoardLink(requestedId: string | null, knownIds: ReadonlySet<string>, viewerIds: ReadonlySet<string>, fallbackId: string): BoardLink {
  if (requestedId && !knownIds.has(requestedId)) return { boardId: fallbackId, status: 'unknown', requestedId }
  const boardId = requestedId ?? fallbackId
  return { boardId, status: viewerIds.has(boardId) ? 'viewer' : 'lookup' }
}

/** Never mount the copper viewer for boards that do not have its verified CAD data. */
export function getBoardCatalogView(boardId: string, requestedView: BoardCatalogView): BoardCatalogView {
  return requestedView === '2d' && boardsWithCopperLayerView.has(boardId) ? '2d' : '3d'
}
