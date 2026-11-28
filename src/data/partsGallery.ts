import { components, type ComponentCategory } from '../data/components'
import { getR2cBreadboard } from './catalogR2cBoards'
import { getCatalogPart } from './catalogParts'
import { getApprovedCatalogIc } from './approvedCatalogIcs'
import { getApprovedRemainingPart } from './approvedRemainingParts'
import { expandedCatalog } from '../data/expandedComponentCatalog'
import { getComponentMeshForCatalog } from '../data/componentModels'
import { getComponentReferences, getComponentSourceLevel } from '../data/componentReferences'
import { getFreestylePartId } from '../lib/catalogPracticeLinks'
import { getLessonsUsingComponent } from '../lib/componentCatalog'
import { freestyleSamples } from '../lib/freestyle/freestyleSampleLibrary'
import { digitalLabLessons } from '../data/digitalLabLessons'
import { spicePractices } from '../simulation/spicePractice'
import { getBoardForComponent } from '../lib/boardCatalogMedia'

export const catalogGroups: readonly ComponentCategory[] = [
  'Nguồn', 'Board & dây nối', 'MCU', 'Linh kiện cơ bản', 'Đầu vào', 'Cảm biến',
  'Hiển thị', 'Âm thanh', 'Đầu ra', 'Cơ điện', 'IC logic', 'Kết nối',
]
export const groupLabel = (group: string) =>
  group === 'MCU' ? 'Vi điều khiển' : group === 'Kết nối' ? 'Giao tiếp, bộ nhớ & đo lường' : group

const overrides: Record<string, ComponentCategory> = {
  breadboard: 'Board & dây nối',
  jumper: 'Board & dây nối',
  'usb-cable': 'Board & dây nối',
  buzzer: 'Âm thanh',
  'logic-74hc00': 'IC logic',
  'logic-74hc4511': 'IC logic',
  'timer-ne555': 'IC logic',
}
const meshAliases: Record<string, string> = {
  'hc-sr04': 'ultrasonic',
  'h-bridge-l298n': 'h-bridge',
  'ir-obstacle': 'ir-sensor',
  ntc: 'thermistor',
}
const expansion = new Map(expandedCatalog.map((item) => [item.part.id, item]))
const sampleParts = new Set<string>(freestyleSamples.flatMap(({ parts }) => [...parts]))
const analogParts = new Set<string>(spicePractices.flatMap(({ parts }) => [...parts]))
const digitalParts = new Set<string>(digitalLabLessons.flatMap(({ parts }) => [...parts]))

export const partsGallery = components.map((part) => {
  const { id } = part
  const meshId = meshAliases[id] ?? getComponentMeshForCatalog(id)?.id
  const photos = getComponentReferences(id).flatMap((reference) => reference.photos ?? [])
  const variant = getCatalogPart(id) ?? getApprovedCatalogIc(id) ?? getApprovedRemainingPart(id)
  const breadboard = getR2cBreadboard(id)
  const board = part.category === 'MCU' ? getBoardForComponent(id) : undefined
  const preview = variant?.simulation === 'reference' ? undefined : breadboard ? '/component-catalog/' + breadboard.catalogId + '.webp' : variant && (variant.revision === 'R5' || variant.revision === 'R4' || variant.revision === 'R3') ? '/component-catalog/' + variant.revision.toLowerCase() + '-' + variant.packageKey + '.webp' : variant ? '/component-catalog/' + (variant.packageKey === 'dip20' ? 'r2a-' : variant.revision === 'R2B' && variant.packageKey !== 'dip16' ? 'r2b-' : 'r1-') + variant.packageKey + '.webp'
    : board ? undefined : meshId && !expansion.has(id) ? '/component-catalog/' + meshId + '.webp' : photos[0]?.src
  return {
    part, variant, breadboard, board,
    group: overrides[id] ?? part.category,
    preview,
    isNewReference: expansion.has(id) && !breadboard && variant?.revision !== 'R4' && variant?.revision !== 'R5' && variant?.revision !== 'IC-1' && variant?.revision !== 'KIT-1',
    productSource: getComponentSourceLevel(id) !== 'general',
    canBuild: Boolean(breadboard || getFreestylePartId(id)),
    hasPractice: Boolean(variant && variant.simulation !== 'reference' || breadboard) || sampleParts.has(id) || analogParts.has(id) || digitalParts.has(id) || getLessonsUsingComponent(id).length > 0,
  }
})
