import { catalogR1Parts } from './catalogR1Parts'
import { catalogR2aParts } from './catalogR2aParts'
import { catalogR2bParts } from './catalogR2bParts'
import { catalogR3Parts } from './catalogR3Parts'
import { catalogR4Parts } from './catalogR4Parts'
import { catalogR5Parts } from './catalogR5Parts'

export const catalogParts = [
  ...catalogR1Parts.map(part => ({ ...part, revision: 'R1' as const })),
  ...catalogR2aParts,
  ...catalogR2bParts,
  ...catalogR3Parts,
  ...catalogR4Parts,
  ...catalogR5Parts,
]

export function getCatalogPart(id: string | undefined) {
  return catalogParts.find(part => part.id === id || part.catalogId === id)
}
