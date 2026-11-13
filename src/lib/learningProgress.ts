import { curriculumLessons } from '../data/curriculumSchema'
import type { BuilderLessonId } from '../data/builderLessons'

const STORAGE_KEY = 'machmo-learning-progress-v1'
export const LEARNING_PROGRESS_CHANGED_EVENT = 'machmo:learning-progress-changed'
const MAX_SIMULATION_ATTEMPTS = 30

/** Keep resume/deep-link coverage aligned with the full curriculum registry. */
export const learningRoutes = Object.fromEntries(
  curriculumLessons.map((lesson) => [lesson.id, lesson.route]),
) as Record<BuilderLessonId, string>

function isBuilderLessonId(value: string): value is BuilderLessonId {
  return Object.prototype.hasOwnProperty.call(learningRoutes, value)
}

export type LearningProgress = {
  lastLessonId?: string
  lastOpenedAt?: string
  checklists?: Record<string, string[]>
  startedLessonIds: BuilderLessonId[]
  selfReportedCompletedLessonIds: BuilderLessonId[]
  simulationAttempts: LessonSimulationAttempt[]
}

/** A local record that a supported run was started, not a score or verified result. */
export type LessonSimulationAttempt = {
  lessonId: BuilderLessonId
  boardId: string
  boardLabel?: string
  mode: 'lesson-model' | 'avr8js-firmware'
  startedAt: string
}

function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (storage) return storage
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function isSimulationAttempt(value: unknown): value is LessonSimulationAttempt {
  if (!value || typeof value !== 'object') return false
  const attempt = value as Partial<LessonSimulationAttempt>
  return typeof attempt.lessonId === 'string'
    && isBuilderLessonId(attempt.lessonId)
    && typeof attempt.boardId === 'string'
    && /^[a-z0-9][a-z0-9._-]{0,79}$/i.test(attempt.boardId)
    && (attempt.boardLabel === undefined || (typeof attempt.boardLabel === 'string' && attempt.boardLabel.length <= 100))
    && (attempt.mode === 'lesson-model' || attempt.mode === 'avr8js-firmware')
    && typeof attempt.startedAt === 'string'
    && Number.isFinite(Date.parse(attempt.startedAt))
}

function readSimulationAttempts(value: unknown): LessonSimulationAttempt[] {
  return Array.isArray(value)
    ? value.filter(isSimulationAttempt).slice(0, MAX_SIMULATION_ATTEMPTS)
    : []
}

export function readLearningProgress(storage?: Pick<Storage, 'getItem' | 'setItem'>): LearningProgress {
  try {
    const raw = getStorage(storage)?.getItem(STORAGE_KEY)
    if (!raw) return { startedLessonIds: [], selfReportedCompletedLessonIds: [], simulationAttempts: [] }
    const value = JSON.parse(raw) as Partial<LearningProgress>
    const lastLessonId = typeof value.lastLessonId === 'string' && isBuilderLessonId(value.lastLessonId)
      ? value.lastLessonId
      : undefined
    const lessonIds = (ids: unknown): BuilderLessonId[] => Array.isArray(ids)
      ? [...new Set(ids.filter((id): id is BuilderLessonId => typeof id === 'string' && isBuilderLessonId(id)))]
      : []
    const selfReportedCompletedLessonIds = lessonIds(value.selfReportedCompletedLessonIds)
    const startedLessonIds = [...new Set([
      ...lessonIds(value.startedLessonIds),
      ...selfReportedCompletedLessonIds,
      ...(!Array.isArray(value.startedLessonIds) && lastLessonId ? [lastLessonId] : []),
    ])]
    const checklists: Record<string, string[]> = {}
    if (value.checklists && typeof value.checklists === 'object' && !Array.isArray(value.checklists)) {
      for (const [lessonId, entries] of Object.entries(value.checklists)) {
        if (Array.isArray(entries) && entries.every((entry) => typeof entry === 'string')) {
          checklists[lessonId] = entries
        }
      }
    }
    return {
      ...(lastLessonId ? { lastLessonId } : {}),
      ...(typeof value.lastOpenedAt === 'string' ? { lastOpenedAt: value.lastOpenedAt } : {}),
      checklists,
      startedLessonIds,
      selfReportedCompletedLessonIds,
      simulationAttempts: readSimulationAttempts(value.simulationAttempts),
    }
  } catch {
    return { startedLessonIds: [], selfReportedCompletedLessonIds: [], simulationAttempts: [] }
  }
}

function writeLearningProgress(progress: LearningProgress, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    const target = getStorage(storage)
    if (!target) return false
    target.setItem(STORAGE_KEY, JSON.stringify(progress))
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(LEARNING_PROGRESS_CHANGED_EVENT))
    return true
  } catch {
    return false
  }
}

export function recordLessonOpened(lessonId: string, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (!isBuilderLessonId(lessonId)) return false
  const progress = readLearningProgress(storage)
  return writeLearningProgress({
    ...progress,
    lastLessonId: lessonId,
    lastOpenedAt: new Date().toISOString(),
    startedLessonIds: [...new Set([...progress.startedLessonIds, lessonId])],
  }, storage)
}

/** Keep a bounded, local-only history when a validated simulation actually starts. */
export function recordLessonSimulationStarted(
  lessonId: string,
  boardId: string,
  boardLabel: string,
  mode: LessonSimulationAttempt['mode'],
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  if (!isBuilderLessonId(lessonId) || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(boardId) || !boardLabel.trim()) return false
  const progress = readLearningProgress(storage)
  const attempt: LessonSimulationAttempt = { lessonId, boardId, boardLabel: boardLabel.trim().slice(0, 100), mode, startedAt: new Date().toISOString() }
  return writeLearningProgress({
    ...progress,
    lastLessonId: lessonId,
    startedLessonIds: [...new Set([...progress.startedLessonIds, lessonId])],
    simulationAttempts: [attempt, ...progress.simulationAttempts].slice(0, MAX_SIMULATION_ATTEMPTS),
  }, storage)
}

/** The LED page doubles as a board viewer; browsing another board there is not lesson progress. */
export function shouldRecordLessonVisit(boardParam: string | null) {
  return !boardParam || boardParam === 'esp32-devkit'
}

export function isLessonSelfReportedComplete(lessonId: string, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  return isBuilderLessonId(lessonId) && readLearningProgress(storage).selfReportedCompletedLessonIds.includes(lessonId)
}

/** Completion is a learner's own declaration; it does not prove skill or hardware use. */
export function setLessonSelfReportedCompletion(lessonId: string, completed: boolean, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  if (!isBuilderLessonId(lessonId)) return false
  const progress = readLearningProgress(storage)
  const selfReportedCompletedLessonIds = completed
    ? [...new Set([...progress.selfReportedCompletedLessonIds, lessonId])]
    : progress.selfReportedCompletedLessonIds.filter((id) => id !== lessonId)
  return writeLearningProgress({
    ...progress,
    startedLessonIds: [...new Set([...progress.startedLessonIds, lessonId])],
    selfReportedCompletedLessonIds,
  }, storage)
}

/** Checklist wording can change; only entries still in the lesson may count towards its total. */
export function getKnownChecklistItems(saved: readonly string[] | undefined, known: readonly string[]) {
  return (saved ?? []).filter((item) => known.includes(item))
}

export function readLessonChecklist(lessonId: string, storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  return readLearningProgress(storage).checklists?.[lessonId] ?? []
}

export function saveLessonChecklist(lessonId: string, checkedItems: string[], storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const progress = readLearningProgress(storage)
  return writeLearningProgress({
    ...progress,
    checklists: { ...progress.checklists, [lessonId]: [...new Set(checkedItems)] },
  }, storage)
}
