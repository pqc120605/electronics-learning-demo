export type BuilderStep = 'choose' | 'assemble' | 'code' | 'run'

type Props = {
  step: BuilderStep
  onChange: (step: BuilderStep) => void
  completed: Partial<Record<BuilderStep, boolean>>
}

const steps: Array<{ id: BuilderStep; label: string }> = [
  { id: 'choose', label: 'Chọn bài' },
  { id: 'assemble', label: 'Lắp mạch' },
  { id: 'code', label: 'Viết code' },
  { id: 'run', label: 'Dự đoán & chạy' },
]

export function BuilderStepper({ step, onChange, completed }: Props) {
  const currentIndex = steps.findIndex((item) => item.id === step)
  return <nav id="builder-stepper" className="builder-stepper" aria-label="Các bước thực hành">
    <p className="builder-step-count">Bước {currentIndex + 1}/4</p>
    <ol>{steps.map((item, index) => <li key={item.id}>
      <button type="button" className={step === item.id ? 'builder-step-current' : ''} aria-current={step === item.id ? 'step' : undefined} onClick={() => onChange(item.id)}>
        <span className="builder-step-number" aria-hidden="true">{completed[item.id] && step !== item.id ? '✓' : String(index + 1).padStart(2, '0')}</span>
        <span>{item.label}</span>
      </button>
    </li>)}</ol>
  </nav>
}
