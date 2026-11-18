import { boards } from '../data/boards'
import { builderLessons, getLessonBoardSupport, type BuilderLessonId } from '../data/builderLessons'
import { curriculumLessons } from '../data/curriculumSchema'
import { boardCapabilityRegistry } from '../data/boardCapabilityRegistry'
import { getBoardSupportSummary } from '../data/boardCapabilityRegistry'
import { simulationTargets } from '../data/simulationTargets'
import { getAtmega328pFirmwareTarget } from './firmwareTarget'
import { getLessonPreflight } from './lessonPreflight'
import { lessonBoardPresentation } from './lessonBoardPresentation'

type RequiredPin = { id: string; label: string }
export type LessonBoardCapabilities = {
  boardId: string
  name: string
  revision: string
  sourceUrl?: string
  boardRoute: string
  targetAvailable: boolean
  lessonSupported: boolean
  lessonReason: string
  lessonRuntime: string
  pinConfidence: 'source-backed' | 'teaching-alias' | 'catalog-only'
  pinoutSummary: string
  modelSummary: string
  anchors: {
    status: 'complete' | 'missing' | 'unavailable' | 'not-needed'
    required: RequiredPin[]
    anchored: RequiredPin[]
    missing: RequiredPin[]
  }
  hex: { supported: boolean; description: string }
  solverNote: string
}
export type BoardCapabilityFilter = 'all' | 'lesson' | 'hex' | 'anchors'

/** Exact IDs only: legacy registry getters have fallbacks unsuitable for a finder. */
export function getLessonBoardCapabilities(boardId: string, lessonId: BuilderLessonId): LessonBoardCapabilities | null {
  const board = boards.find(board => board.id === boardId)
  const lesson = curriculumLessons.find(lesson => lesson.id === lessonId)
  const capability = boardCapabilityRegistry.find(profile => profile.boardId === boardId)
  if (!board || !capability || !lesson || !builderLessons.some(item => item.id === lessonId)) return null
  const target = simulationTargets.find(target => target.boardId === boardId)
  const support = target ? getLessonBoardSupport(target, lessonId) : { supported: false, reason: 'Hồ sơ tham khảo; chưa có kịch bản bài này cho board.' }
  const preflight = target && support.supported ? getLessonPreflight(lessonId, target.boardId) : undefined
  const required: RequiredPin[] = []
  for (const pin of preflight?.pins ?? []) {
    if (!required.some(item => item.id === pin.boardPinId)) required.push({ id: pin.boardPinId, label: pin.boardLabel })
  }
  const presentation = target && support.supported ? lessonBoardPresentation(target, lessonId) : undefined
  const anchored = required.filter(pin => {
    const point = presentation?.pinAnchors[pin.id]
    return point?.length === 3 && point.every(Number.isFinite)
  })
  const missing = required.filter(pin => !anchored.some(item => item.id === pin.id))
  const status = !support.supported ? 'unavailable' : !required.length ? 'not-needed' : missing.length ? 'missing' : 'complete'
  const hex = getAtmega328pFirmwareTarget(boardId)
  const summary = getBoardSupportSummary(boardId)
  return {
    boardId, name: board.name, revision: capability.revision,
    sourceUrl: board.sourceEvidenceUrl ?? board.sourceUrl,
    boardRoute: `/boards?board=${encodeURIComponent(boardId)}`,
    targetAvailable: Boolean(target), lessonSupported: support.supported,
    lessonReason: support.supported ? 'Có kịch bản cho bài đang chọn; đọc riêng phạm vi thực thi bên dưới.' : support.reason ?? 'Chưa có kịch bản tương thích cho bài này.',
    lessonRuntime: !support.supported ? 'Chưa chạy được bài này trên profile đã chọn.'
      : lesson.simulationMode === 'fixed-scenario' ? 'Kịch bản minh họa của bài; không thực thi firmware.'
        : 'Trình thông dịch mẫu bài học; không phải biên dịch hoặc firmware MCU đầy đủ.',
    pinConfidence: capability.confidence, pinoutSummary: summary.pinout, modelSummary: summary.model,
    anchors: { status, required, anchored, missing },
    hex: {
      supported: Boolean(hex),
      description: hex
        ? 'Công cụ HEX riêng hỗ trợ ATmega328P: cần tệp đúng target và xác nhận; quan sát D13/PB5 và UART0. Không xác nhận dịch vụ biên dịch đang sẵn sàng.'
        : 'Không có target này trong công cụ HEX ATmega328P. Khả năng của công cụ/runtime khác phải kiểm riêng.',
    },
    solverNote: 'Chọn board không tạo hỗ trợ SPICE cho MCU. Solver chỉ nhận các mạch/model analog tương thích.',
  }
}

export function listLessonBoardCapabilities(lessonId: BuilderLessonId): LessonBoardCapabilities[] {
  return boards.flatMap(board => {
    const row = getLessonBoardCapabilities(board.id, lessonId)
    return row ? [row] : []
  })
}

function normalize(value: string): string {
  return value.slice(0, 120).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim()
}
export function filterLessonBoardCapabilities(rows: readonly LessonBoardCapabilities[], options: { query: string; capability: BoardCapabilityFilter }): LessonBoardCapabilities[] {
  const query = normalize(options.query)
  return rows.filter(row => normalize(`${row.name} ${row.boardId}`).includes(query)
    && (options.capability === 'all'
      || options.capability === 'lesson' && row.lessonSupported
      || options.capability === 'hex' && row.hex.supported
      || options.capability === 'anchors' && row.anchors.status === 'complete'))
}
