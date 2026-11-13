import { useState } from 'react'
import { compareScenarioPrediction } from '../../lib/scenarioPrediction'
import './ScenarioPredictionChallenge.css'

type Option = { value: string; label: string }
type Props = {
  title: string
  prompt: string
  label: string
  options: Option[]
  expected: string
  observed: string
  canRun: boolean
  hasRun: boolean
}

export function ScenarioPredictionChallenge({ title, prompt, label, options, expected, observed, canRun, hasRun }: Props) {
  const [prediction, setPrediction] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>()

  function checkPrediction() {
    if (!canRun || !hasRun) return
    const correct = compareScenarioPrediction(expected, prediction)
    if (correct === null) {
      setFeedback({ correct: false, message: 'Chưa thể đối chiếu câu trả lời với kết quả kịch bản.' })
      return
    }
    setFeedback({ correct, message: correct ? `Chính xác theo kịch bản: ${observed}` : `Kết quả kịch bản: ${observed} Hãy so sánh đầu vào với trạng thái đầu ra.` })
  }

  return <section className="scenario-prediction-challenge" aria-labelledby="scenario-prediction-title">
    <div className="scenario-prediction-heading">
      <p className="eyebrow">THỬ THÁCH THEO KỊCH BẢN</p>
      <span>Không lưu điểm</span>
    </div>
    <h3 id="scenario-prediction-title">{title}</h3>
    <p>{prompt}</p>
    <label className="scenario-prediction-answer">Dự đoán của bạn
      <select aria-label={label} value={prediction} onChange={event => { setPrediction(event.target.value); setFeedback(undefined) }}>
        <option value="">Chọn một đáp án</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
    <button type="button" className="scenario-prediction-check" disabled={!canRun || !hasRun || !prediction} onClick={checkPrediction}>Đối chiếu kết quả</button>
    {feedback && <p className={`scenario-prediction-feedback ${feedback.correct ? 'is-correct' : 'is-incorrect'}`} role="status">{feedback.message}</p>}
    {!hasRun && <small>Chọn dự đoán, rồi chạy mô hình bài học trước khi đối chiếu.</small>}
    {hasRun && !canRun && <small>Mạch, board hoặc bài mẫu không hợp lệ. Sửa lỗi trước khi đối chiếu.</small>}
    <small>Kết quả đến từ kịch bản khái niệm có giới hạn; không chạy code/firmware, không tính điện hoặc xác nhận phần cứng.</small>
  </section>
}
