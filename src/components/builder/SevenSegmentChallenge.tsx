import { useState } from 'react'
import { gradeSegmentPrediction, sevenSegmentIds, type SevenSegmentId } from '../../lib/segmentChallenge'
import './SevenSegmentChallenge.css'

type Props = {
  expectedDigits: readonly (readonly number[])[]
  canPractice: boolean
}

const labels: Record<SevenSegmentId, string> = { a: 'A · trên', b: 'B · phải trên', c: 'C · phải dưới', d: 'D · dưới', e: 'E · trái dưới', f: 'F · trái trên', g: 'G · giữa' }
const segmentNames = (ids: readonly SevenSegmentId[]) => ids.map(id => id.toLocaleUpperCase('vi-VN')).join(', ')

export function SevenSegmentChallenge({ expectedDigits, canPractice }: Props) {
  const [digit, setDigit] = useState(0)
  const [selected, setSelected] = useState<SevenSegmentId[]>([])
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string }>()
  const expected = expectedDigits[digit]

  function changeDigit(value: number) {
    setDigit(value)
    setSelected([])
    setFeedback(undefined)
  }

  function toggleSegment(id: SevenSegmentId) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
    setFeedback(undefined)
  }

  function checkPrediction() {
    if (!expected || !canPractice) return
    const grade = gradeSegmentPrediction(expected, selected)
    if (!grade) {
      setFeedback({ correct: false, message: 'Không thể chấm vì hàng code không có đúng 7 bit A–G hợp lệ.' })
      return
    }
    if (grade.correct) {
      setFeedback({ correct: true, message: `Chính xác theo bảng digits trong code: ${segmentNames(sevenSegmentIds.filter((_id, index) => expected[index] === 1))} sáng.` })
      return
    }
    const details = [grade.missing.length ? `Thiếu ${segmentNames(grade.missing)}.` : '', grade.extra.length ? `Thừa ${segmentNames(grade.extra)}.` : ''].filter(Boolean).join(' ')
    setFeedback({ correct: false, message: `${details} Hãy lần theo thứ tự A–G trong bảng digits rồi thử lại.` })
  }

  return <section className="seven-segment-challenge" aria-labelledby="seven-segment-challenge-title">
    <div className="seven-segment-challenge-heading">
      <p className="eyebrow">THỬ THÁCH THEO CODE SUBSET</p>
      <span>Không lưu điểm</span>
    </div>
    <h3 id="seven-segment-challenge-title">Dự đoán các đoạn sáng</h3>
    <p>Chọn một số, rồi dự đoán các bit 1 trong hàng tương ứng của bảng <code>digits</code>. Thứ tự bit là A → G.</p>
    <label className="seven-segment-challenge-digit">Số cần hiển thị
      <select aria-label="Số cần dự đoán trên LED 7 đoạn" value={digit} onChange={event => changeDigit(Number(event.target.value))}>
        {expectedDigits.map((_row, value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <fieldset className="seven-segment-challenge-options" disabled={!canPractice || !expected}>
      <legend>Đoạn nào sẽ sáng? (chọn tất cả đáp án)</legend>
      {sevenSegmentIds.map(id => <label key={id} className={selected.includes(id) ? 'is-selected' : ''}>
        <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleSegment(id)} />
        <span className="seven-segment-challenge-letter">{id.toLocaleUpperCase('vi-VN')}</span>
        <span>{labels[id].slice(4)}</span>
      </label>)}
    </fieldset>
    <button type="button" className="seven-segment-challenge-check" disabled={!canPractice || !expected} onClick={checkPrediction}>Kiểm tra dự đoán</button>
    {feedback && <p className={`seven-segment-challenge-feedback ${feedback.correct ? 'is-correct' : 'is-incorrect'}`} role="status">{feedback.message}</p>}
    {!canPractice && <small>Sửa lỗi mạch, code hoặc board trước khi làm thử thách.</small>}
    <small>Đáp án được đọc từ code đã phân tích; mô hình cathode chung dùng 1 = sáng, 0 = tắt. Đây không phải chạy firmware hay kiểm chứng phần cứng. Dùng “Chạy từng bước” để quan sát chuỗi số trên mô hình.</small>
  </section>
}
