import { getLessonBoardSupport, type BuilderLessonId } from '../data/builderLessons'
import { curriculumLessons } from '../data/curriculumSchema'
import { getSimulationTarget, simulationTargets } from '../data/simulationTargets'
import { evaluateProgram, type EducationalProgram } from './educationalProgram'
import type { SimulationInstrumentId, SimulationProviderDescriptor, SimulationProviderKind } from '../simulation/contracts'

export type SimulationInputs = {
  pressed?: boolean
  detected?: boolean
  distanceCm?: number
  potPercent?: number
  lightPercent?: number
  elapsedMs?: number
  digit?: number
  conceptValue?: number
  converterMode?: 'buck' | 'boost'
  motorCommand?: 'forward' | 'reverse' | 'stop'
}

export type SimulationFrame = ReturnType<typeof evaluateProgram>

export type SimulationProvider = SimulationProviderDescriptor & {
  kind: SimulationProviderKind
  execution: 'deterministic-local'
  supports: (lessonId: string, boardId: string) => boolean
  evaluate: (program: EducationalProgram, inputs: SimulationInputs) => SimulationFrame
}

const targetIds = new Set(simulationTargets.map((target) => target.boardId))
const lessonModes = new Map(curriculumLessons.map((lesson) => [lesson.id, lesson.simulationMode]))

/** Local code-subset interpreter. It accepts only lessons declared as parser-backed. */
const codeSubsetProvider: SimulationProvider = {
  id: 'machmo-educational-interpreter',
  name: 'Mạch Mở · bộ diễn giải code subset',
  version: '1.0.0',
  kind: 'code-subset-interpreter',
  runtime: 'browser',
  execution: 'deterministic-local',
  accuracyLabel: 'Mô phỏng hành vi cơ bản',
  supportedBoards: 'dynamic',
  supportedLessons: 'dynamic',
  capabilities: ['educational-trace', 'virtual-inputs'],
  limitations: [
    'Phân tích cấu trúc C++ thuộc tập lệnh được ghi rõ cho bài; không biên dịch hoặc chạy firmware đã biên dịch.',
    'Biến trở vẫn dùng đầu vào chuẩn hóa; bài LDR dùng một bộ chia áp giáo dục với điện trở giả định để tính Vout, không tính lux, dòng hay đặc tính của linh kiện cụ thể.',
    'Số chân là alias học tập theo board profile; không thay thế pinout của board thật.',
  ],
  supports: (lessonId, boardId) => lessonModes.get(lessonId as BuilderLessonId) === 'code-subset' && targetIds.has(boardId),
  evaluate: (program, inputs) => evaluateProgram(program, inputs),
}

/** Fixed educational scenarios show a predetermined concept model, not executed source. */
const scenarioProvider: SimulationProvider = {
  id: 'machmo-educational-scenario',
  name: 'Mạch Mở · kịch bản khái niệm',
  version: '1.0.0',
  kind: 'educational-scenario',
  runtime: 'browser',
  execution: 'deterministic-local',
  accuracyLabel: 'Minh họa khái niệm',
  supportedBoards: 'dynamic',
  supportedLessons: 'dynamic',
  capabilities: ['educational-trace', 'virtual-inputs'],
  limitations: [
    'Code mẫu được so khớp để bảo vệ kịch bản; không được thực thi hoặc biên dịch.',
    'Trạng thái nguồn, driver, motor và MOSFET là minh họa định trước; không tính điện áp, dòng, RPM, mô-men, nhiệt hoặc xung áp.',
    'Số chân là alias học tập theo board profile; không thay thế pinout của board thật.',
  ],
  supports: (lessonId, boardId) => lessonModes.get(lessonId as BuilderLessonId) === 'fixed-scenario' && targetIds.has(boardId),
  evaluate: (program, inputs) => evaluateProgram(program, inputs),
}

export function getSimulationProvider(lessonId: BuilderLessonId): SimulationProvider {
  return lessonModes.get(lessonId) === 'fixed-scenario' ? scenarioProvider : codeSubsetProvider
}

export function resolveSimulationProvider(boardId: string, lessonId: BuilderLessonId) {
  const provider = getSimulationProvider(lessonId)
  const boardSupport = targetIds.has(boardId) ? getLessonBoardSupport(getSimulationTarget(boardId), lessonId) : undefined
  const available = provider.supports(lessonId, boardId) && boardSupport?.supported === true
  const instruments: readonly SimulationInstrumentId[] = available ? ['digital-trace'] : []
  return {
    provider: available ? provider : undefined,
    available,
    instruments,
    reasonCode: available ? undefined : boardSupport?.supported === false ? 'unsupported-board-lesson' : 'unsupported-provider',
    message: available
      ? `${provider.accuracyLabel} · ${provider.name} ${provider.version}`
      : boardSupport?.reason ?? 'Chưa có provider mô phỏng cho board hoặc bài học này.',
  }
}
