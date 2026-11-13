import type { BuilderStep } from '../components/builder/BuilderStepper'
import type { CircuitDiagnostic } from './circuitValidation'

export type GuidanceAction = 'next-step' | 'toggle-wire' | 'switch-board' | 'restore-code' | 'back-assemble' | 'back-code' | 'run' | 'focus-prediction' | 'next-lesson'

export type BuilderGuidance = {
  tone: 'ready' | 'blocked' | 'running' | 'info'
  title: string
  detail?: string
  fix?: string
  hint?: string
  action?: GuidanceAction
  actionLabel?: string
  secondaryAction?: GuidanceAction
  secondaryLabel?: string
}

export type BuilderGuidanceInput = {
  step: BuilderStep
  lessonTitle: string
  lockReason?: string
  fallbackBoardName?: string
  diagnostics: CircuitDiagnostic[]
  codeIssue?: string
  running: boolean
  hasRun: boolean
  wireMode: boolean
  pendingPin: boolean
  awaitingPrediction: boolean
  nextLessonTitle?: string
}

export type CircuitStatusId = 'unwired' | 'error' | 'ready' | 'running' | 'stopped'

const circuitStatusLabels: Record<CircuitStatusId, string> = { unwired: 'Chưa nối dây', error: 'Mạch có lỗi', ready: 'Sẵn sàng chạy', running: 'Đang chạy', stopped: 'Đã dừng' }

/** Names where the learner is in the build, check, run, fix loop. */
export function getCircuitStatus({ wireCount, errorCount, running, hasRun }: { wireCount: number; errorCount: number; running: boolean; hasRun: boolean }) {
  const id: CircuitStatusId = wireCount === 0 ? 'unwired' : errorCount > 0 ? 'error' : running ? 'running' : hasRun ? 'stopped' : 'ready'
  return { id, label: circuitStatusLabels[id] }
}

/** Picks the single next action for a learner from the state the lab already computes. */
export function getBuilderGuidance(input: BuilderGuidanceInput): BuilderGuidance {
  const { step, lessonTitle, lockReason, fallbackBoardName, diagnostics, codeIssue, running, hasRun, wireMode, pendingPin, awaitingPrediction, nextLessonTitle } = input
  if (lockReason) {
    return { tone: 'blocked', title: 'Bài này chưa chạy được trên board đang chọn', detail: lockReason, action: 'switch-board', actionLabel: `Chuyển sang ${fallbackBoardName ?? 'board tham chiếu'}` }
  }
  const circuitError = diagnostics.find((item) => item.severity === 'error')
  if (step === 'choose') {
    return { tone: 'ready', title: `Đang chọn bài “${lessonTitle}”`, detail: 'Giữ bài này để sang bước lắp mạch, hoặc chọn một thẻ khác bên dưới.', action: 'next-step', actionLabel: 'Bắt đầu lắp mạch →' }
  }
  if (step === 'assemble') {
    const circuitComplete = diagnostics.some((item) => item.code === 'topology-checked')
    if (wireMode && (pendingPin || !circuitComplete)) {
      return pendingPin
        ? { tone: 'info', title: 'Chọn chân thứ hai để tạo dây', detail: 'Chọn lại chân vừa chọn nếu muốn hủy dây này.' }
        : { tone: 'info', title: 'Chọn chân thứ nhất của dây', detail: circuitError?.message, hint: openPinHint(diagnostics) }
    }
    if (circuitError) {
      return { tone: 'blocked', title: 'Mạch cần sửa trước khi chạy', detail: circuitError.message, fix: circuitError.suggestedFix, hint: openPinHint(diagnostics), action: 'toggle-wire', actionLabel: 'Bật chế độ nối dây' }
    }
    return { tone: 'ready', title: 'Mạch đã đủ kết nối cho bài này', detail: 'Kiểm tra này chỉ xét đường nối của bài học, không đo điện áp hay dòng điện.', action: 'next-step', actionLabel: 'Tiếp tục viết code' }
  }
  if (step === 'code') {
    if (codeIssue) return { tone: 'blocked', title: 'Code chưa chạy được', detail: codeIssue, action: 'restore-code', actionLabel: 'Khôi phục code mẫu' }
    return { tone: 'ready', title: 'Code thuộc phạm vi mô phỏng của bài', detail: 'Đọc lại từng dòng, rồi sang bước chạy để so với dự đoán của bạn.', action: 'next-step', actionLabel: 'Chạy và quan sát' }
  }
  if (circuitError) return { tone: 'blocked', title: 'Chưa chạy được vì mạch đang lỗi', detail: circuitError.message, fix: circuitError.suggestedFix, action: 'back-assemble', actionLabel: 'Quay lại sửa mạch' }
  if (codeIssue) return { tone: 'blocked', title: 'Chưa chạy được vì code có vấn đề', detail: codeIssue, action: 'back-code', actionLabel: 'Quay lại sửa code' }
  if (running) return { tone: 'running', title: 'Mô phỏng đang chạy', detail: 'Đổi đầu vào ảo nếu bài có, rồi theo dõi trạng thái và luồng hoạt động.', action: 'run', actionLabel: 'Tạm dừng' }
  if (awaitingPrediction) return { tone: 'info', title: 'Trước khi chạy, hãy dự đoán LED sáng hay tắt', detail: 'Dự đoán giúp bạn biết mình đang hiểu mạch và code đến đâu.', action: 'focus-prediction', actionLabel: 'Đi tới phần dự đoán' }
  if (hasRun) return { tone: 'ready', title: 'Đã có kết quả để đối chiếu', detail: 'Đọc luồng hoạt động, rồi thử thách gỡ lỗi bên dưới.', action: 'run', actionLabel: 'Chạy lại', ...(nextLessonTitle ? { secondaryAction: 'next-lesson' as const, secondaryLabel: `Bài tiếp theo: ${nextLessonTitle}` } : {}) }
  return { tone: 'info', title: 'Sẵn sàng chạy mô phỏng', detail: 'Kết quả là mô phỏng trong phạm vi của bài, chưa phải kết quả trên board thật.', action: 'run', actionLabel: 'Chạy mô phỏng' }
}

function openPinHint(diagnostics: CircuitDiagnostic[]): string | undefined {
  return diagnostics.find((item) => item.code.startsWith('open-part-'))?.message
}

/** Keeps errors and warnings in view; background notes can stay collapsed. */
export function groupDiagnostics(diagnostics: CircuitDiagnostic[]) {
  const rank = { error: 0, warning: 1, info: 2 }
  const isActionable = (item: CircuitDiagnostic) => item.severity !== 'info' || item.code === 'topology-checked'
  return {
    actionable: diagnostics.filter(isActionable).sort((a, b) => rank[a.severity] - rank[b.severity]),
    notes: diagnostics.filter((item) => !isActionable(item)),
  }
}
