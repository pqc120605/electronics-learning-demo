import type { Ref } from 'react'
import type { BuilderGuidance, GuidanceAction } from '../../lib/builderGuidance'

type Props = { guidance: BuilderGuidance; statusLabel: string; onAction: (action: GuidanceAction) => void; ref?: Ref<HTMLElement> }

const toneLabels: Record<BuilderGuidance['tone'], string> = { blocked: 'CẦN SỬA', ready: 'BƯỚC TIẾP THEO', running: 'ĐANG CHẠY', info: 'VIỆC CẦN LÀM' }

export function BuilderGuidancePanel({ guidance, statusLabel, onAction, ref }: Props) {
  const { action, actionLabel, secondaryAction, secondaryLabel } = guidance
  return <section ref={ref} id="builder-guidance" tabIndex={-1} className={`builder-guidance builder-guidance-${guidance.tone}`} aria-label="Việc cần làm tiếp theo" aria-live="polite">
    <div>
      <p className="builder-guidance-label">{toneLabels[guidance.tone]} <span>Mạch: {statusLabel}</span></p>
      <strong>{guidance.title}</strong>
      {guidance.detail && <p>{guidance.detail}</p>}
      {guidance.fix && <p><b>Cách sửa:</b> {guidance.fix}</p>}
      {guidance.hint && guidance.hint !== guidance.detail && <p><b>Bắt đầu từ:</b> {guidance.hint}</p>}
    </div>
    <div className="builder-guidance-actions">
      {action && actionLabel && <button type="button" onClick={() => onAction(action)}>{actionLabel}</button>}
      {secondaryAction && secondaryLabel && <button type="button" className="builder-guidance-secondary" onClick={() => onAction(secondaryAction)}>{secondaryLabel}</button>}
    </div>
  </section>
}
