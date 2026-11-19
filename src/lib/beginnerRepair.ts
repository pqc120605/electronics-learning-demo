import {
  createBeginnerSession, getBeginnerResult, type BeginnerControls, type BeginnerPrediction,
} from './beginnerCourse'
import type { BeginnerActivityId } from '../data/beginnerCourse'

type Repair = {
  id: 'return-wire' | 'breadboard-strip' | 'led-direction'
  activity: BeginnerActivityId
  title: string
  skill: string
  goal: string
  faultyOption: string
  fixedOption: string
  faulty: Partial<BeginnerControls>
  fixed: Partial<BeginnerControls>
  expectedBefore: BeginnerPrediction
  expectedAfter: BeginnerPrediction
  hints: readonly [string, string]
  explanation: string
}

export const BEGINNER_REPAIRS: readonly Repair[] = [
  {
    id: 'return-wire', activity: 'closed-loop', title: 'Tìm đường về bị hở', skill: 'Khôi phục mạch kín',
    goal: 'Nguồn đã nối tới LED. Tìm điểm ngắt làm LED không sáng.',
    faultyOption: 'Để hở đầu dây về nguồn', fixedOption: 'Nối đầu dây về cực âm',
    faulty: { returnConnected: false }, fixed: { returnConnected: true },
    expectedBefore: 'off', expectedAfter: 'on',
    hints: ['Lần từ LED trở về cực âm của nguồn.', 'Đường đi phải khép kín ở cả hai phía của LED.'],
    explanation: 'Nối lại đầu dây về cực âm khép kín đường đi qua điện trở và LED.',
  },
  {
    id: 'breadboard-strip', activity: 'breadboard', title: 'Tìm lỗ cắm sai dải', skill: 'Nhận đúng dải nối breadboard',
    goal: 'Đầu dây chuẩn ở 10e. Chuyển đầu dây còn lại sang một lỗ nối điện với 10e.',
    faultyOption: 'Cắm đầu dây ở 10f', fixedOption: 'Chuyển đầu dây sang 10a',
    faulty: { holePair: 'across-trench' }, fixed: { holePair: 'same-strip' },
    expectedBefore: 'separate', expectedAfter: 'connected',
    hints: ['Hai lỗ gần nhau có thể nằm ở hai phía của rãnh giữa.', 'Tìm một lỗ trong nhóm a–e cùng cột 10.'],
    explanation: '10a và 10e chung dải nối. Rãnh giữa ngăn 10e nối với 10f.',
  },
  {
    id: 'led-direction', activity: 'led-polarity', title: 'Sửa LED đặt ngược', skill: 'Đặt LED đúng cực',
    goal: 'Đường về đã kín và có điện trở nối tiếp. Kiểm tra hai chân của LED.',
    faultyOption: 'Đặt chân K về phía điện trở', fixedOption: 'Đặt chân A về phía điện trở',
    faulty: { returnConnected: true, ledForward: false }, fixed: { returnConnected: true, ledForward: true },
    expectedBefore: 'off', expectedAfter: 'on',
    hints: ['Tìm nhãn A (+) và K (−) trên sơ đồ.', 'Chân A hướng về điện trở phía cực dương, chân K hướng về cực âm.'],
    explanation: 'Đổi chiều LED đưa chân A về phía dương. Điện trở hạn dòng vẫn nằm nối tiếp.',
  },
]

export type BeginnerRepairId = Repair['id']
export type RepairAttempt = { fixed: boolean; before: BeginnerPrediction | null; after: BeginnerPrediction | null; hints: number }
export type RepairProgress = { active: BeginnerRepairId | null; attempts: Partial<Record<BeginnerRepairId, RepairAttempt>> }

export function getBeginnerRepair(id: string | null) {
  return BEGINNER_REPAIRS.find(repair => repair.id === id)
}

export function newRepairAttempt(): RepairAttempt {
  return { fixed: false, before: null, after: null, hints: 0 }
}

export function repairControls(repair: Repair, fixed: boolean): BeginnerControls {
  return { ...createBeginnerSession().controls, ...(fixed ? repair.fixed : repair.faulty) }
}

export function observeRepair(repair: Repair, attempt: RepairAttempt, prediction: BeginnerPrediction) {
  const result = getBeginnerResult({ ...createBeginnerSession(), activityId: repair.activity, controls: repairControls(repair, attempt.fixed) })
  let evidence = attempt
  if (result.status === 'ready' && result.outcome === prediction) {
    if (!attempt.fixed && prediction === repair.expectedBefore) evidence = { ...attempt, before: prediction }
    if (attempt.fixed && attempt.before && prediction === repair.expectedAfter) evidence = { ...attempt, after: prediction }
  }
  return { result, evidence }
}

export function beginnerResumeUrl(path: string, progress?: RepairProgress) {
  return progress?.active ? `${path}?repair=${progress.active}` : path
}
