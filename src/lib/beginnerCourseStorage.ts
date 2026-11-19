import { BEGINNER_ACTIVITIES, type BeginnerActivityId } from '../data/beginnerCourse'
import {
  getBeginnerResult, isBeginnerControls,
  type BeginnerObservation, type BeginnerPrediction, type BeginnerSession,
} from './beginnerCourse'
import { getBeginnerRepair, type RepairProgress } from './beginnerRepair'

export const BEGINNER_COURSE_KEY = 'machmo-beginner-course-v1'
export const BEGINNER_COURSE_CHANGED_EVENT = 'machmo:beginner-course-changed'
const MAX_RAW_LENGTH = 200_000
const predictions: readonly BeginnerPrediction[] = ['on', 'off', 'connected', 'separate', 'blocked']
const activityIds = BEGINNER_ACTIVITIES.map(activity => activity.id)
type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'getItem' | 'setItem'>
type ReadKind = 'empty' | 'ready' | 'invalid' | 'unsupported' | 'unavailable'
export type BeginnerReadResult = { kind: ReadKind; raw: string | null; session: BeginnerSession | null; message: string }
export type BeginnerSaveResult = { kind: 'saved' | 'conflict' | 'protected' | 'unavailable'; raw: string | null; message: string }

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function activityId(value: unknown): value is BeginnerActivityId {
  return typeof value === 'string' && activityIds.includes(value as BeginnerActivityId)
}
function boardId(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,79}$/i.test(value))
}
function prediction(value: unknown): value is BeginnerPrediction {
  return predictions.includes(value as BeginnerPrediction)
}

function parseRepairs(value: unknown): RepairProgress | null {
  if (!record(value) || !record(value.attempts) || (value.active !== null && typeof value.active !== 'string')) return null
  const active = typeof value.active === 'string' ? getBeginnerRepair(value.active) : undefined
  if (value.active !== null && !active) return null
  const attempts: RepairProgress['attempts'] = {}
  for (const [id, attempt] of Object.entries(value.attempts)) {
    const repair = getBeginnerRepair(id)
    if (!repair || !record(attempt)) return null
    const { fixed, before, after, hints } = attempt
    if (typeof fixed !== 'boolean' || (before !== null && before !== repair.expectedBefore)
      || (after !== null && (after !== repair.expectedAfter || before === null))
      || typeof hints !== 'number' || !Number.isInteger(hints) || hints < 0 || hints > repair.hints.length) return null
    attempts[repair.id] = {
      fixed, hints, before: before === null ? null : repair.expectedBefore,
      after: after === null ? null : repair.expectedAfter,
    }
  }
  return { active: active?.id ?? null, attempts }
}

export function parseBeginnerSession(value: unknown): BeginnerSession | null {
  if (!record(value) || value.schema !== 1 || value.courseVersion !== 1
    || !activityId(value.activityId) || !boardId(value.boardId)
    || !isBeginnerControls(value.controls)
    || (value.prediction !== null && !prediction(value.prediction))
    || !Array.isArray(value.observations) || value.observations.length > 80
    || !record(value.explanations) || !record(value.hintsUsed)) return null

  const explanations: BeginnerSession['explanations'] = {}
  for (const [id, choice] of Object.entries(value.explanations)) {
    const activity = BEGINNER_ACTIVITIES.find(activity => activity.id === id)
    if (!activity || typeof choice !== 'string' || !activity.explanationChoices.some(item => item.id === choice)) return null
    explanations[activity.id] = choice
  }
  const hintsUsed: BeginnerSession['hintsUsed'] = {}
  for (const [id, count] of Object.entries(value.hintsUsed)) {
    if (!activityId(id) || typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > 3) return null
    hintsUsed[id] = count
  }
  const session: BeginnerSession = {
    schema: 1, courseVersion: 1, activityId: value.activityId, boardId: value.boardId,
    controls: { ...value.controls }, prediction: value.prediction,
    observations: [], explanations, hintsUsed,
  }
  if (value.repairs !== undefined) {
    const repairs = parseRepairs(value.repairs)
    if (!repairs) return null
    session.repairs = repairs
  }
  for (const item of value.observations) {
    if (!record(item) || !activityId(item.activityId) || !boardId(item.boardId)
      || !isBeginnerControls(item.controls) || !prediction(item.prediction) || !prediction(item.outcome)) return null
    const result = getBeginnerResult({
      ...session, activityId: item.activityId, boardId: item.boardId, controls: item.controls,
    })
    if (result.status !== 'ready' || result.outcome !== item.outcome
      || result.caseKey !== item.caseKey || result.signature !== item.signature
      || result.evidenceKind !== item.evidenceKind) return null
    const observation: BeginnerObservation = {
      activityId: item.activityId, boardId: item.boardId, controls: { ...item.controls },
      prediction: item.prediction, outcome: item.outcome,
      caseKey: result.caseKey, signature: result.signature, evidenceKind: result.evidenceKind,
    }
    session.observations.push(observation)
  }
  return session
}

function browserStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

export function readBeginnerSession(storage?: Reader): BeginnerReadResult {
  let raw: string | null = null
  try {
    const target = storage ?? browserStorage()
    if (!target) return { kind: 'unavailable', raw, session: null, message: 'Phiên học đang dùng bộ nhớ tạm. Bạn có thể tải bản sao JSON.' }
    raw = target.getItem(BEGINNER_COURSE_KEY)
  } catch {
    return { kind: 'unavailable', raw, session: null, message: 'Trình duyệt chưa cho phép đọc nơi lưu. Phiên học vẫn dùng được trong bộ nhớ.' }
  }
  if (raw === null) return { kind: 'empty', raw, session: null, message: 'Phiên học mới.' }
  if (raw.length > MAX_RAW_LENGTH) return { kind: 'invalid', raw, session: null, message: 'Bản đang lưu vượt giới hạn. Tải bản gốc để giữ dữ liệu.' }
  let value: unknown
  try { value = JSON.parse(raw) } catch {
    return { kind: 'invalid', raw, session: null, message: 'Bản đang lưu không đọc được. Tải bản gốc để giữ dữ liệu.' }
  }
  if (record(value) && ((typeof value.schema === 'number' && value.schema > 1)
    || (typeof value.courseVersion === 'number' && value.courseVersion > 1))) {
    return { kind: 'unsupported', raw, session: null, message: 'Bản đang lưu thuộc phiên bản mới hơn. Tải bản gốc hoặc mở bằng phiên bản hỗ trợ.' }
  }
  const session = parseBeginnerSession(value)
  return session
    ? { kind: 'ready', raw, session, message: 'Đã mở tiến độ trên trình duyệt này.' }
    : { kind: 'invalid', raw, session: null, message: 'Nội dung bản đang lưu chưa hợp lệ. Tải bản gốc để giữ dữ liệu.' }
}

export function formatBeginnerBackup(session: BeginnerSession): string {
  return JSON.stringify(session, null, 2) + '\n'
}

export function saveBeginnerSession(session: BeginnerSession, expectedRaw: string | null, storage?: Writer): BeginnerSaveResult {
  const valid = parseBeginnerSession(session)
  if (!valid) return { kind: 'protected', raw: expectedRaw, message: 'Phiên hiện tại chưa hợp lệ để lưu. Dữ liệu trước vẫn được giữ.' }
  try {
    const target = storage ?? browserStorage()
    if (!target) return { kind: 'unavailable', raw: expectedRaw, message: 'Phiên học chỉ còn trong bộ nhớ. Tải bản sao trước khi đóng tab.' }
    const current = readBeginnerSession(target)
    if (current.kind === 'invalid' || current.kind === 'unsupported') {
      return { kind: 'protected', raw: current.raw, message: current.message }
    }
    if (current.kind === 'unavailable') return { kind: 'unavailable', raw: expectedRaw, message: current.message }
    if (current.raw !== expectedRaw) {
      return { kind: 'conflict', raw: current.raw, message: 'Tiến độ đã đổi ở tab khác. Tải phiên đang học hoặc mở lại bản đang lưu để tiếp tục.' }
    }
    const raw = JSON.stringify(valid)
    if (raw.length > MAX_RAW_LENGTH) return { kind: 'protected', raw: expectedRaw, message: 'Phiên vượt giới hạn lưu. Tải bản sao để giữ dữ liệu.' }
    target.setItem(BEGINNER_COURSE_KEY, raw)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(BEGINNER_COURSE_CHANGED_EVENT))
    return { kind: 'saved', raw, message: 'Đã lưu tiến độ trên trình duyệt này.' }
  } catch {
    return { kind: 'unavailable', raw: expectedRaw, message: 'Chưa lưu được thay đổi. Phiên học vẫn còn trong tab này; tải bản sao trước khi đóng.' }
  }
}
