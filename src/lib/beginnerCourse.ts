import { BEGINNER_ACTIVITIES, getBeginnerActivity, type BeginnerActivityId } from '../data/beginnerCourse'
import { getBuilderLesson, getInputAlias, getLessonBoardSupport } from '../data/builderLessons'
import { getLessonCircuitDoc } from '../data/lessonCircuitDocs'
import { simulationTargets, type SimulationTarget } from '../data/simulationTargets'
import { holeNet, parseHole } from './breadboardGrid'
import type { CircuitDocV2 } from './circuitDocV2'
import { validateCircuitDoc } from './circuitDocV2'
import { createNetIndexV2 } from './circuitNetsV2'
import { evaluateProgram, parseEducationalProgram } from './educationalProgram'
import type { RepairProgress } from './beginnerRepair'

export type BeginnerControls = {
  returnConnected: boolean
  ledForward: boolean
  resistorPresent: boolean
  holePair: 'same-strip' | 'across-trench'
  pressed: boolean
  inverted: boolean
  inputPercent: number
  threshold: number
}
export type BeginnerPrediction = 'on' | 'off' | 'connected' | 'separate' | 'blocked'
export type BeginnerEvidenceKind = 'topology-check' | 'lesson-model'
export type BeginnerObservation = {
  activityId: BeginnerActivityId
  boardId: string | null
  controls: BeginnerControls
  prediction: BeginnerPrediction
  outcome: BeginnerPrediction
  caseKey: string
  signature: string
  evidenceKind: BeginnerEvidenceKind
}
export type BeginnerSession = {
  schema: 1
  courseVersion: 1
  activityId: BeginnerActivityId
  boardId: string | null
  controls: BeginnerControls
  prediction: BeginnerPrediction | null
  observations: BeginnerObservation[]
  explanations: Partial<Record<BeginnerActivityId, string>>
  hintsUsed: Partial<Record<BeginnerActivityId, number>>
  repairs?: RepairProgress
}
export type BeginnerResult = {
  status: 'ready' | 'ungradable'
  outcome: BeginnerPrediction | null
  message: string
  trace: readonly string[]
  code: string | null
  caseKey: string
  signature: string
  evidenceKind: BeginnerEvidenceKind
  doc: CircuitDocV2 | null
}

export function isBeginnerControls(value: unknown): value is BeginnerControls {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const controls = value as Record<string, unknown>
  return ['returnConnected', 'ledForward', 'resistorPresent', 'pressed', 'inverted']
    .every(key => typeof controls[key] === 'boolean')
    && (controls.holePair === 'same-strip' || controls.holePair === 'across-trench')
    && typeof controls.inputPercent === 'number' && Number.isInteger(controls.inputPercent)
    && controls.inputPercent >= 0 && controls.inputPercent <= 100
    && typeof controls.threshold === 'number' && Number.isInteger(controls.threshold)
    && controls.threshold >= 1 && controls.threshold <= 99
}

export function createBeginnerSession(): BeginnerSession {
  return {
    schema: 1, courseVersion: 1, activityId: 'closed-loop', boardId: null,
    controls: {
      returnConnected: false, ledForward: true, resistorPresent: true,
      holePair: 'same-strip', pressed: false, inverted: false, inputPercent: 49, threshold: 50,
    },
    prediction: null, observations: [], explanations: {}, hintsUsed: {},
  }
}

export function getBeginnerBoardOptions(): SimulationTarget[] {
  return simulationTargets.filter(target =>
    getLessonBoardSupport(target, 'button-led').supported
    && getLessonBoardSupport(target, 'analog-potentiometer').supported)
}

/** This circuit reuses the existing LED footprint and named breadboard endpoints. */
export function getBeginnerFoundationDoc(controls: BeginnerControls): CircuitDocV2 {
  const doc = getLessonCircuitDoc('blink')!
  doc.lessonId = 'beginner-foundation'
  doc.parts = doc.parts.filter(part => part.type !== 'board' && (controls.resistorPresent || part.id !== 'res-1'))
  doc.parts.unshift({ id: 'power-1', type: 'battery', mount: { kind: 'bench', lane: 'left', order: 0 } })
  if (!controls.ledForward) {
    const led = doc.parts.find(part => part.id === 'led-1')!
    led.mount = { kind: 'breadboard', board: 'bb1', col: 14, row: 5, rotation: 0 }
  }
  doc.wires = doc.wires.flatMap(wire => {
    if (wire.id === 'w-rail-to-gnd' && !controls.returnConnected) return []
    return [{
      ...wire,
      from: wire.from.kind === 'pin' && wire.from.partId === 'board-1'
        ? { kind: 'pin' as const, partId: 'power-1', pinId: 'positive' }
        : wire.from,
      to: wire.to.kind === 'pin' && wire.to.partId === 'board-1'
        ? { kind: 'pin' as const, partId: 'power-1', pinId: 'negative' }
        : wire.to,
    }]
  })
  doc.openPins = [
    ...(doc.openPins ?? []).filter(pin => pin.partId !== 'board-1'),
    ...(!controls.returnConnected ? [{ partId: 'power-1', pinId: 'negative', reason: 'Dây hồi đang hở trong thí nghiệm.' }] : []),
  ]
  doc.expect.partCount = doc.parts.length
  doc.expect.wireCount = doc.wires.length
  doc.expect.netCount = createNetIndexV2(doc).netsList().length
  return doc
}

function selectedBoard(session: BeginnerSession): SimulationTarget | undefined {
  return getBeginnerBoardOptions().find(target => target.boardId === session.boardId)
}

export function getBeginnerCode(session: BeginnerSession): string | null {
  const board = selectedBoard(session)
  if (!board) return null
  if (session.activityId === 'button-logic') {
    const code = getBuilderLesson('button-led').code(board, getInputAlias(board, 'button-led').pin)
    return session.controls.inverted ? code.replace('== LOW', '== HIGH') : code
  }
  if (session.activityId === 'sensor-threshold') {
    return getBuilderLesson('analog-potentiometer').code(board, getInputAlias(board, 'analog-potentiometer').pin)
      .replace('potPercent > 50', `potPercent > ${session.controls.threshold}`)
  }
  return null
}

function sameNet(index: ReturnType<typeof createNetIndexV2>, a: string, b: string): boolean {
  const net = index.netOf(a)
  return Boolean(net && net === index.netOf(b))
}

function foundationResult(session: BeginnerSession): BeginnerResult {
  const { controls, activityId } = session
  const doc = getBeginnerFoundationDoc(controls)
  const index = createNetIndexV2(doc)
  const positive = sameNet(index, 'power-1:positive', 'res-1:a')
  const series = sameNet(index, 'res-1:b', 'led-1:anode')
  const returning = sameNet(index, 'led-1:cathode', 'power-1:negative')
  const hasResistor = doc.parts.some(part => part.id === 'res-1' && part.type === 'resistor')
  const outcome = !hasResistor ? 'blocked' : positive && series && returning ? 'on' : 'off'
  const issue = validateCircuitDoc(doc).find(issue => issue.severity === 'error')
  const caseKey = `${controls.returnConnected ? 'closed' : 'open'}:${controls.ledForward ? 'forward' : 'reverse'}:${hasResistor ? 'resistor' : 'no-resistor'}`
  return {
    status: issue ? 'ungradable' : 'ready', outcome: issue ? null : outcome,
    message: issue?.message ?? (!hasResistor
      ? 'Khôi phục điện trở nối tiếp trước khi chạy mạch LED mẫu.'
      : outcome === 'on' ? 'LED sáng theo mô hình đường nối và phân cực của bài.' : 'LED tắt theo mô hình. Kiểm tra đường hồi và chiều LED.'),
    trace: [
      `Nguồn (+) → đầu a điện trở: ${positive ? 'đã nối' : 'chưa có đường qua điện trở'}.`,
      `Đầu b điện trở → anode LED: ${series ? 'đã nối' : 'chưa nối đúng chiều'}.`,
      `Cathode LED → nguồn (−): ${returning ? 'đã nối' : 'đường hồi hở hoặc LED đảo chiều'}.`,
      'Đối chiếu topology của mạch mẫu; chưa tính điện áp hay dòng điện.',
    ],
    code: null, caseKey, signature: JSON.stringify([1, activityId, caseKey]),
    evidenceKind: 'topology-check', doc,
  }
}

export function getBeginnerResult(session: BeginnerSession): BeginnerResult {
  if (!isBeginnerControls(session.controls) || !BEGINNER_ACTIVITIES.some(activity => activity.id === session.activityId)) {
    return { status: 'ungradable', outcome: null, message: 'Tham số hoạt động chưa hợp lệ. Dùng giá trị trong khoảng được hướng dẫn.', trace: [], code: null, doc: null, caseKey: '', signature: '', evidenceKind: 'topology-check' }
  }
  if (session.activityId === 'closed-loop' || session.activityId === 'led-polarity') return foundationResult(session)
  if (session.activityId === 'breadboard') {
    const first = session.controls.holePair === 'same-strip' ? 'bb1:10a' : 'bb1:10e'
    const second = session.controls.holePair === 'same-strip' ? 'bb1:10e' : 'bb1:10f'
    const connected = holeNet(parseHole(first)) === holeNet(parseHole(second))
    return {
      status: 'ready', outcome: connected ? 'connected' : 'separate',
      message: `${first} và ${second} ${connected ? 'cùng dải nối' : 'khác dải nối'} trong mô hình.`,
      trace: [`${first} → ${holeNet(parseHole(first))}`, `${second} → ${holeNet(parseHole(second))}`, 'Cách nối ray và số lỗ thuộc giả định breadboard 400 tie-point, chưa đối chiếu mẫu thật.'],
      code: null, doc: null, caseKey: session.controls.holePair,
      signature: JSON.stringify([1, 'breadboard', session.controls.holePair]), evidenceKind: 'topology-check',
    }
  }

  const code = getBeginnerCode(session)
  const lessonId = session.activityId === 'button-logic' ? 'button-led' : 'analog-potentiometer'
  const caseKey = session.activityId === 'button-logic'
    ? `${session.controls.inverted ? 'inverted' : 'normal'}:${session.controls.pressed ? 'pressed' : 'released'}`
    : `threshold:${session.controls.threshold}:input:${session.controls.inputPercent}`
  const signature = JSON.stringify([1, session.activityId, session.boardId, code, caseKey])
  const base = { code, caseKey, signature, evidenceKind: 'lesson-model' as const, doc: session.activityId === 'button-logic' ? getLessonCircuitDoc('button-led') : null }
  if (!code || !session.boardId) return { ...base, status: 'ungradable', outcome: null, message: 'Chọn board có hỗ trợ bài trước khi quan sát.', trace: [] }
  const parsed = parseEducationalProgram(code, lessonId, session.boardId)
  if (!parsed.ok) return { ...base, status: 'ungradable', outcome: null, message: parsed.message, trace: [] }
  const result = evaluateProgram(parsed.program, { pressed: session.controls.pressed, potPercent: session.controls.inputPercent })
  return { ...base, status: 'ready', outcome: result.ledOn ? 'on' : 'off', message: `LED ${result.ledOn ? 'sáng' : 'tắt'} theo code mẫu của board đã chọn.`, trace: result.trace }
}

export function observeBeginnerSession(session: BeginnerSession): { session: BeginnerSession; result: BeginnerResult } {
  const result = getBeginnerResult(session)
  if (result.status !== 'ready' || !result.outcome || !session.prediction) return { session, result }
  const observation: BeginnerObservation = {
    activityId: session.activityId, boardId: session.boardId, controls: { ...session.controls },
    prediction: session.prediction, outcome: result.outcome,
    caseKey: result.caseKey, signature: result.signature, evidenceKind: result.evidenceKind,
  }
  const prior = session.observations.filter(item => item.signature !== observation.signature)
  return { session: { ...session, observations: [...prior, observation].slice(-80) }, result }
}

export function getBeginnerCaseOptions(session: BeginnerSession): readonly { label: string; controls: Partial<BeginnerControls> }[] {
  switch (session.activityId) {
    case 'closed-loop': return [
      { label: 'Dây hồi đang hở', controls: { returnConnected: false, ledForward: true, resistorPresent: true } },
      { label: 'Nối lại dây hồi', controls: { returnConnected: true, ledForward: true, resistorPresent: true } },
    ]
    case 'breadboard': return [
      { label: '10a và 10e', controls: { holePair: 'same-strip' } },
      { label: '10e và 10f', controls: { holePair: 'across-trench' } },
    ]
    case 'led-polarity': return [
      { label: 'LED đúng chiều', controls: { returnConnected: true, ledForward: true, resistorPresent: true } },
      { label: 'Đảo chiều LED', controls: { returnConnected: true, ledForward: false, resistorPresent: true } },
      { label: 'Thiếu điện trở nối tiếp', controls: { returnConnected: true, ledForward: true, resistorPresent: false } },
    ]
    case 'button-logic': return [
      { label: 'Thả nút, điều kiện LOW', controls: { pressed: false, inverted: false } },
      { label: 'Nhấn nút, điều kiện LOW', controls: { pressed: true, inverted: false } },
      { label: 'Nhấn nút, đảo điều kiện HIGH', controls: { pressed: true, inverted: true } },
    ]
    case 'sensor-threshold': return [-1, 0, 1].map(offset => ({
      label: `${session.controls.threshold + offset}% · ${offset < 0 ? 'dưới ngưỡng' : offset > 0 ? 'trên ngưỡng' : 'bằng ngưỡng'}`,
      controls: { inputPercent: session.controls.threshold + offset },
    }))
  }
}

export function getBeginnerAssessment(session: BeginnerSession, activityId: BeginnerActivityId) {
  const activitySession = { ...session, activityId }
  const options = getBeginnerCaseOptions(activitySession)
  const required = options.map(option => getBeginnerResult({ ...activitySession, controls: { ...session.controls, ...option.controls } }))
  const observed = required.filter(result => session.observations.some(observation =>
    observation.activityId === activityId && observation.signature === result.signature
    && observation.prediction === observation.outcome && result.status === 'ready'
    && observation.outcome === result.outcome)).length
  const explanationCorrect = session.explanations[activityId] === getBeginnerActivity(activityId).correctExplanationId
  const started = observed > 0 || session.observations.some(observation => observation.activityId === activityId) || Boolean(session.explanations[activityId])
  return {
    status: observed === required.length && explanationCorrect ? 'met' as const : started ? 'in-progress' as const : 'not-started' as const,
    observed, required: required.length, explanationCorrect,
    missing: [
      ...options.filter((_, index) => !session.observations.some(observation => observation.signature === required[index].signature && observation.prediction === observation.outcome && required[index].status === 'ready')).map(option => option.label),
      ...(!explanationCorrect ? ['Chọn giải thích đúng cho hoạt động.'] : []),
    ],
  }
}

export const beginnerActivityIds = BEGINNER_ACTIVITIES.map(activity => activity.id)
