import { BEGINNER_ACTIVITIES, type BeginnerActivityId } from '../data/beginnerCourse'
import {
  getBeginnerBoardOptions, getBeginnerResult, isBeginnerControls,
  type BeginnerEvidenceKind, type BeginnerPrediction, type BeginnerResult, type BeginnerSession,
} from './beginnerCourse'
import type { GuideArticle, GuideSnapshot } from './guideKnowledge'

/** Actions only focus these existing course controls; they never execute an experiment. */
export const BEGINNER_GUIDE_TARGET_IDS = Object.freeze({
  'beginner-board': 'beginner-board',
  'beginner-controls': 'beginner-controls',
  'beginner-prediction': 'beginner-prediction',
  'beginner-observe': 'beginner-observe',
  'beginner-explanation': 'beginner-explanation',
  'beginner-hints': 'beginner-hints',
} as const)
export type BeginnerGuideActionId = keyof typeof BEGINNER_GUIDE_TARGET_IDS
export type BeginnerGuideAction = { id: BeginnerGuideActionId; label: string }
export type BeginnerGuideStage = 'choose-board' | 'predict' | 'observe' | 'explain' | 'review'
export type BeginnerGuideContext = {
  activityId: BeginnerActivityId
  title: string
  goal: string
  stage: BeginnerGuideStage
  supported: boolean
  hintsUsed: number
  openedHints: readonly string[]
  unavailable?: true
  prediction?: BeginnerPrediction
  observation?: {
    outcome: BeginnerPrediction
    evidenceKind: BeginnerEvidenceKind
    predictionMatches: boolean
  }
}
export type BeginnerGuideSnapshot = GuideSnapshot & {
  beginner?: BeginnerGuideContext
  actions?: readonly BeginnerGuideAction[]
}

const outcomeLabels: Record<BeginnerPrediction, string> = {
  on: 'LED sáng', off: 'LED tắt', connected: 'có nối điện', separate: 'tách rời',
  blocked: 'cần khôi phục điện trở nối tiếp',
}
const advice: Record<BeginnerGuideStage, string> = {
  'choose-board': 'Chọn board được hỗ trợ cho hoạt động này trước khi dự đoán.',
  predict: 'Chọn dự đoán của bạn trước khi quan sát mô hình.',
  observe: 'Chưa có kết quả cho lựa chọn hiện tại. Bấm Quan sát mô hình để kiểm tra dự đoán.',
  explain: 'So sánh kết quả với dự đoán rồi chọn cách giải thích điều vừa quan sát.',
  review: 'Xem tiêu chí hoạt động và thử các trường hợp còn thiếu. Bạn có thể lặp lại thử nghiệm.',
}
const primaryActions: Record<BeginnerGuideStage, BeginnerGuideAction> = {
  'choose-board': { id: 'beginner-board', label: 'Tới lựa chọn board' },
  predict: { id: 'beginner-prediction', label: 'Tới dự đoán' },
  observe: { id: 'beginner-observe', label: 'Tới nút quan sát' },
  explain: { id: 'beginner-explanation', label: 'Tới phần giải thích' },
  review: { id: 'beginner-controls', label: 'Xem trường hợp cần thử' },
}

function validPrediction(activityId: BeginnerActivityId, prediction: unknown): prediction is BeginnerPrediction {
  const choices = activityId === 'breadboard' ? ['connected', 'separate']
    : activityId === 'led-polarity' ? ['on', 'off', 'blocked'] : ['on', 'off']
  return typeof prediction === 'string' && choices.includes(prediction)
}

function matchingObservation(session: BeginnerSession, result: BeginnerResult | null) {
  // Recalculation is a defensive comparison only. Without an explicit UI result,
  // neither this evaluator nor historical observations can publish an outcome.
  if (!result || result.status !== 'ready' || !result.outcome) return undefined
  const current = getBeginnerResult(session)
  if (current.status !== 'ready' || result.signature !== current.signature
    || result.caseKey !== current.caseKey || result.outcome !== current.outcome
    || result.evidenceKind !== current.evidenceKind || result.code !== current.code) return undefined
  return {
    outcome: result.outcome,
    evidenceKind: result.evidenceKind,
    predictionMatches: session.prediction === result.outcome,
  }
}

export function getBeginnerGuideSnapshot(
  session: BeginnerSession, result: BeginnerResult | null,
): BeginnerGuideSnapshot {
  const activity = BEGINNER_ACTIVITIES.find(item => item.id === session.activityId)
  if (!activity) return {
    owner: 'beginner-course', priority: 60,
    status: 'Hoạt động này chưa được hỗ trợ trong khóa nền tảng.',
    issues: ['Chọn một trong năm hoạt động của khóa để tiếp tục.'], actions: [],
  }
  const boardRequired = activity.id === 'button-logic' || activity.id === 'sensor-threshold'
  const board = boardRequired
    ? getBeginnerBoardOptions().find(item => item.boardId === session.boardId) : undefined
  const controlsValid = isBeginnerControls(session.controls)
  const supported = controlsValid && (!boardRequired || Boolean(board))
  const prediction = validPrediction(activity.id, session.prediction) ? session.prediction : undefined
  const observation = supported && prediction ? matchingObservation(session, result) : undefined
  const current = supported && result?.status === 'ungradable' ? getBeginnerResult(session) : null
  const unavailable = Boolean(current && result && result.signature === current.signature
    && result.caseKey === current.caseKey && result.code === current.code)
  const stage: BeginnerGuideStage = boardRequired && !board ? 'choose-board'
    : !controlsValid || unavailable ? 'review'
    : !prediction ? 'predict'
    : !observation ? 'observe'
    : session.explanations[activity.id] === activity.correctExplanationId ? 'review' : 'explain'
  const used = session.hintsUsed[activity.id]
  const hintsUsed = typeof used === 'number' && Number.isInteger(used)
    ? Math.max(0, Math.min(used, activity.hints.length)) : 0
  const actions: BeginnerGuideAction[] = !supported
    ? [boardRequired && !board ? primaryActions['choose-board'] : primaryActions.review]
    : [primaryActions[stage], { id: 'beginner-hints', label: 'Xem gợi ý đã mở' }]
  const next = unavailable
    ? 'Chưa thể đánh giá thử nghiệm này. Kiểm tra điều khiển và trường hợp được hỗ trợ trước khi tiếp tục.'
    : !controlsValid && (!boardRequired || board)
    ? 'Kiểm tra điều khiển của hoạt động trước khi tiếp tục.' : advice[stage]
  const context: BeginnerGuideContext = {
    activityId: activity.id, title: activity.title, goal: activity.goal, stage, supported,
    hintsUsed, openedHints: activity.hints.slice(0, hintsUsed),
    ...(prediction ? { prediction } : {}), ...(observation ? { observation } : {}),
    ...(unavailable ? { unavailable: true as const } : {}),
  }
  return {
    owner: 'beginner-course', priority: 60, lesson: activity.title,
    ...(board ? { board: { id: board.boardId, name: board.name, sourceUrl: board.sourceUrl } } : {}),
    status: observation
      ? `${outcomeLabels[observation.outcome]}. ${observation.predictionMatches ? 'Dự đoán khớp quan sát.' : 'Quan sát khác dự đoán.'}`
      : next,
    ...(!supported || unavailable ? { issues: [next] } : {}),
    next, beginner: context, actions,
  }
}

/** Called only for a separately matched exact local intent; it is not a search override. */
export function getBeginnerGuideArticle(snapshot: BeginnerGuideSnapshot): GuideArticle | null {
  const context = snapshot.beginner
  if (!context) return null
  const activity = BEGINNER_ACTIVITIES.find(item => item.id === context.activityId)
  if (!activity) return null
  const paragraphs = [activity.goal, snapshot.next ?? advice[context.stage]]
  if (context.observation) {
    const { outcome, evidenceKind, predictionMatches } = context.observation
    paragraphs.push(`Kết quả vừa quan sát: ${outcomeLabels[outcome]}. ${predictionMatches ? 'Dự đoán khớp kết quả.' : 'Kết quả khác dự đoán.'}`)
    paragraphs.push(evidenceKind === 'topology-check'
      ? 'Đây là kiểm tra kết nối của mô hình khái niệm, chưa tính điện áp hay dòng điện.'
      : 'Đây là trace subset của mô hình bài học theo board đã chọn, không phải thực thi firmware hoặc phép đo kit thật.')
  } else {
    paragraphs.push('Chưa có quan sát hiện hành để giải thích kết quả. Lịch sử hoàn thành không thay thế lần quan sát này.')
  }
  const openedHints = context.openedHints.filter(hint => activity.hints.includes(hint))
  paragraphs.push(...openedHints.slice(0, activity.hints.length))
  return {
    id: `beginner-current:${activity.id}`, title: activity.title,
    aliases: ['Tôi nên làm gì tiếp?', 'Giải thích kết quả hiện tại'], paragraphs,
    source: { label: 'Khóa nền tảng điện tử', href: '/learn/basics' },
    evidence: [`src/data/beginnerCourse.ts: ${activity.id}`, 'src/lib/beginnerCourse.ts', 'src/lib/beginnerGuide.ts'],
  }
}
