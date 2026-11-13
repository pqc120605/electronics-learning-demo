import { getBoardCapability } from '../data/boardCapabilityRegistry'
import { boards } from '../data/boards'
import { getBoardModelEvidence } from '../data/boardModelSources'
import { getInputAlias, getLessonBoardSupport, type BuilderLessonId } from '../data/builderLessons'
import { getComponentDefinition, type ComponentId } from '../data/componentRegistry'
import { curriculumLessons, type CurriculumLesson } from '../data/curriculumSchema'
import { circuitForLesson } from '../data/lessonCircuits'
import { getCircuitPartDisplayLabel } from './componentDisplayLabel'
import { getSimulationTarget, normalizeSimulationTargetId, simulationTargets, type SimulationTarget } from '../data/simulationTargets'

export type PreflightBoardNotice = { kind: 'reference' | 'unknown'; message: string; boardRoute?: string }
export type PreflightPin = { boardPinId: string; boardLabel: string; partLabel: string; partPinLabel: string; sourceBacked: boolean }
export type PreflightPart = { type: ComponentId; catalogId?: string; catalogRoute?: string; label: string; count: number }
export type LessonPreflight = {
  lesson: CurriculumLesson
  target: SimulationTarget
  support: { supported: boolean; reason?: string }
  revision: string
  confidence: string
  sourceUrl?: string
  licenseName?: string
  hasBoardViewer: boolean
  boardRoute: string
  parts: PreflightPart[]
  pins: PreflightPin[]
  startRoute: string
}

/** Boards whose lesson pins have been reviewed against a named source. */
export const preflightBoardIds = ['esp32-devkit', 'arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3'] as const

const confidenceLabels = { 'source-backed': 'Bảng chân LED có nguồn; chân đầu vào là alias học tập', 'teaching-alias': 'Tất cả chân là alias học tập, chưa xác minh', 'catalog-only': 'Board chỉ có trong danh mục' }
/** Modules whose supply is not the board's logic level; the lesson's safety note gives the reason. */
const partSupplyLabels: Partial<Record<ComponentId, string>> = { ultrasonic: 'Nguồn 5 V của module · xem lưu ý ECHO' }
const nextPinNumber = (label: string) => label.replace(/\d+/, (value) => String(Number(value) + 1))

function boardPinLabel(target: SimulationTarget, lesson: CurriculumLesson, pinId: string): string {
  const input = getInputAlias(target, lesson.id).label
  if (pinId === 'gnd') return 'GND'
  if (pinId === 'vcc') return `Nguồn logic · ${target.logicLevel}`
  if (lesson.simulationMode === 'fixed-scenario') return 'Chân tín hiệu · alias học tập'
  if (pinId === 'ledOut') return target.pinLabel
  if (pinId === 'input' || pinId === 'trig') return input
  if (pinId === 'echo') return nextPinNumber(input)
  const segment = /^seg(\d)$/.exec(pinId)
  const number = segment ? target.sevenSegmentPins?.[Number(segment[1])] : undefined
  return number === undefined ? 'Alias học tập' : `${target.boardId === 'esp32-devkit' ? 'GPIO ' : 'D'}${number}`
}

/** A link may name a board with no lesson data; the page must say which board it shows instead. */
export function getPreflightBoardNotice(requestedId: string | null): PreflightBoardNotice | undefined {
  if (!requestedId || requestedId === 'esp32' || requestedId === 'esp32-devkit' || normalizeSimulationTargetId(requestedId) !== 'esp32-devkit') return undefined
  const fallback = simulationTargets[0].name
  const board = boards.find((item) => item.id === requestedId)
  return board
    ? { kind: 'reference', message: `${board.name} chưa có hồ sơ chân cho bài học. Bảng dưới đây vẫn theo ${fallback}.`, boardRoute: `/boards?board=${encodeURIComponent(board.id)}` }
    : { kind: 'unknown', message: `Không tìm thấy board trong liên kết. Trang đang hiện ${fallback}.` }
}

/** Everything here is read from curriculum, circuit and board data, so a gap stays visible. */
export function getLessonPreflight(lessonId: BuilderLessonId, boardId: string): LessonPreflight {
  const lesson = curriculumLessons.find((item) => item.id === lessonId) ?? curriculumLessons[0]
  const target = getSimulationTarget(boardId)
  const capability = getBoardCapability(target.boardId)
  const evidence = getBoardModelEvidence(target.boardId)
  const support = getLessonBoardSupport(target, lesson.id)
  const boardRoute = `/boards?board=${encodeURIComponent(target.boardId)}`
  const circuit = circuitForLesson(lesson.id)
  const board = circuit.placed.find((part) => part.type === 'board')
  const boardWired = circuit.wires.some((wire) => wire.from.partId === board?.id || wire.to.partId === board?.id)
  const labelOf = (part: { id: string; type: ComponentId; value?: string }) => part.type === 'board' ? target.name : getCircuitPartDisplayLabel(part, getComponentDefinition(part.type)?.label ?? part.type)
  const counts = new Map<string, { type: ComponentId; count: number }>()
  for (const part of circuit.placed) if (part.type !== 'breadboard' && (part.type !== 'board' || boardWired)) counts.set(labelOf(part), { type: part.type, count: (counts.get(labelOf(part))?.count ?? 0) + 1 })
  const pins = !support.supported ? [] : circuit.wires.flatMap((wire): PreflightPin[] => {
    const boardEnd = wire.from.partId === board?.id ? wire.from : wire.to.partId === board?.id ? wire.to : undefined
    if (!boardEnd) return []
    const otherEnd = boardEnd === wire.from ? wire.to : wire.from
    const part = circuit.placed.find((item) => item.id === otherEnd.partId)
    const definition = part && getComponentDefinition(part.type)
    const fixed = lesson.simulationMode === 'fixed-scenario'
    return [{
      boardPinId: boardEnd.pinId,
      boardLabel: (boardEnd.pinId === 'vcc' && part && partSupplyLabels[part.type]) || boardPinLabel(target, lesson, boardEnd.pinId),
      partLabel: part ? labelOf(part) : otherEnd.partId,
      partPinLabel: definition?.pins.find((pin) => pin.id === otherEnd.pinId)?.label ?? otherEnd.pinId,
      sourceBacked: !fixed && boardEnd.pinId === 'ledOut' && capability.pinMap.ledOutput?.sourceBacked === true,
    }]
  })
  return {
    lesson,
    target,
    support,
    revision: evidence?.revision ?? capability.revision,
    confidence: confidenceLabels[capability.confidence],
    sourceUrl: evidence?.sourceUrl ?? capability.sourceRefs[0],
    licenseName: evidence?.licenseName,
    hasBoardViewer: capability.modelStatus === 'cad-reference',
    boardRoute,
    parts: [...counts].map(([label, { type, count }]) => {
      const catalogId = type === 'board' ? undefined : getComponentDefinition(type)?.catalogId
      return { type, catalogId, catalogRoute: type === 'board' ? boardRoute : catalogId ? `/components?component=${encodeURIComponent(catalogId)}` : undefined, count, label }
    }),
    pins,
    startRoute: target.boardId === 'esp32-devkit' ? lesson.route : `${lesson.route}&board=${target.boardId}`,
  }
}

/** Readable part list for lesson cards; board wording stays generic because no board is chosen there. */
export function getLessonPartsSummary(lessonId: BuilderLessonId) {
  return getLessonPreflight(lessonId, 'esp32-devkit').parts
    .map((part) => `${part.type === 'board' ? 'Board vi điều khiển' : part.label}${part.count > 1 ? ` × ${part.count}` : ''}`)
    .join(' · ')
}

/** The LED page is written for ESP32; the lab can still run the same lesson on another supported board. */
export function getBoardPracticeRoute(boardId: string) {
  return simulationTargets.some((target) => target.boardId === boardId) ? `/build?lesson=blink&guided=1&board=${encodeURIComponent(boardId)}` : undefined
}
