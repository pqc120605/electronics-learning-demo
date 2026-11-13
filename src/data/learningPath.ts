import type { BuilderLessonId } from './builderLessons'
import { curriculumLessons } from './curriculumSchema'

export type LearningStage = { id: string; title: string; summary: string; lessonIds: BuilderLessonId[] }

/** Teaching order for the curriculum; lesson content stays in curriculumSchema. */
export const learningStages: LearningStage[] = [
  { id: 'output', title: 'Làm sáng một LED', summary: 'Hiểu nguồn, điện trở và cách GPIO điều khiển đầu ra.', lessonIds: ['blink', 'source-led'] },
  { id: 'input', title: 'Đọc tín hiệu đầu vào', summary: 'Dùng nút, biến trở và cảm biến để quyết định khi nào LED sáng.', lessonIds: ['button-led', 'analog-potentiometer', 'analog-ldr', 'ir-alert', 'ultrasonic-distance'] },
  { id: 'display', title: 'Hiển thị nhiều tín hiệu', summary: 'Điều khiển nhiều chân cùng lúc bằng bảng dữ liệu.', lessonIds: ['seven-segment-counter'] },
  { id: 'power', title: 'Nguồn và tải lớn hơn', summary: 'Tìm hiểu vì sao tải lớn cần nguồn và mạch điều khiển riêng.', lessonIds: ['buck-boost-concept', 'dc-motor-driver', 'mosfet-switch'] },
]

export const learningPathOrder: BuilderLessonId[] = learningStages.flatMap((stage) => stage.lessonIds)

export function getNextLessonId(lessonId: BuilderLessonId): BuilderLessonId | undefined {
  const index = learningPathOrder.indexOf(lessonId)
  return index < 0 ? undefined : learningPathOrder[index + 1]
}

/** Lessons that teach what another lesson assumes. Advisory only: no lesson is ever locked by this. */
export function getLessonPrerequisiteIds(lessonId: BuilderLessonId): BuilderLessonId[] {
  return curriculumLessons.find((lesson) => lesson.id === lessonId)?.prerequisiteLessonIds ?? []
}

export function getUnmetPrerequisiteIds(lessonId: BuilderLessonId, completedLessonIds: readonly string[]): BuilderLessonId[] {
  return getLessonPrerequisiteIds(lessonId).filter((id) => !completedLessonIds.includes(id))
}

/** Every lesson opens a page about its goal and board first; blink has the long-form lesson. */
export function getLessonEntryRoute(lesson: { id: BuilderLessonId }, boardId?: string) {
  if (lesson.id === 'blink') return '/learn/esp32-led'
  return `/learn/${lesson.id}${boardId && boardId !== 'esp32-devkit' ? `?board=${encodeURIComponent(boardId)}` : ''}`
}

/** Progress records the last lesson opened, not lessons completed. */
export function getPathHighlight(lastLessonId: string | undefined, completedLessonIds: readonly string[] = []): { currentId?: BuilderLessonId; nextId?: BuilderLessonId } {
  const completed = new Set(completedLessonIds.filter((id): id is BuilderLessonId => learningPathOrder.includes(id as BuilderLessonId)))
  const lastLesson = learningPathOrder.find((id) => id === lastLessonId)
  const currentId = lastLesson && !completed.has(lastLesson) ? lastLesson : undefined
  const startIndex = lastLesson ? learningPathOrder.indexOf(lastLesson) + 1 : 0
  const nextId = learningPathOrder.slice(startIndex).find((id) => !completed.has(id))
    ?? learningPathOrder.find((id) => !completed.has(id))
  return { currentId, nextId }
}

/** Resume the current unfinished lesson, or recommend the next unfinished lesson in teaching order. */
export function getResumeLessonId(lastLessonId: string | undefined, completedLessonIds: readonly string[]): BuilderLessonId | undefined {
  const completed = new Set(completedLessonIds.filter((id): id is BuilderLessonId => learningPathOrder.includes(id as BuilderLessonId)))
  const lastLesson = learningPathOrder.find((id) => id === lastLessonId)
  if (!lastLesson && !completed.size) return undefined
  if (lastLesson && !completed.has(lastLesson)) return lastLesson

  const startIndex = lastLesson ? learningPathOrder.indexOf(lastLesson) + 1 : 0
  const nextIncomplete = learningPathOrder.slice(startIndex).find((id) => !completed.has(id))
    ?? learningPathOrder.find((id) => !completed.has(id))
  return nextIncomplete
}

export type LearningResume = { state: 'new' | 'in-progress' | 'next' | 'all-complete'; label: string; lessonId?: BuilderLessonId; route: string }

/** One dashboard CTA. Lessons open on their entry page, the only place completion can be recorded. */
export function getLearningResume(lastLessonId: string | undefined, completedLessonIds: readonly string[]): LearningResume {
  const lessonId = getResumeLessonId(lastLessonId, completedLessonIds)
  if (lessonId) return lessonId === lastLessonId
    ? { state: 'in-progress', label: 'Tiếp tục học', lessonId, route: getLessonEntryRoute({ id: lessonId }) }
    : { state: 'next', label: 'Học bài tiếp theo', lessonId, route: getLessonEntryRoute({ id: lessonId }) }
  const hasKnownCompletion = completedLessonIds.some((id) => learningPathOrder.includes(id as BuilderLessonId))
  if (hasKnownCompletion) return { state: 'all-complete', label: 'Xem lại lộ trình', route: '/topics' }
  const first = learningPathOrder[0]
  return { state: 'new', label: 'Bắt đầu bài LED', lessonId: first, route: getLessonEntryRoute({ id: first }) }
}

/** "Start here" is only true for a learner with no progress yet. */
export function getPathMarker(lessonId: BuilderLessonId, lastLessonId: string | undefined, completedLessonIds: readonly string[]) {
  const { currentId, nextId } = getPathHighlight(lastLessonId, completedLessonIds)
  if (lessonId === currentId) return 'Bài vừa mở'
  if (lessonId !== nextId) return undefined
  const hasProgress = learningPathOrder.some((id) => id === lastLessonId || completedLessonIds.includes(id))
  return hasProgress ? 'Bài tiếp theo' : 'Bắt đầu từ đây'
}
