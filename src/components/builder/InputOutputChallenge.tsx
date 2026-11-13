import { useState } from 'react'
import './InputOutputChallenge.css'

type Props = {
  title: string
  instruction: string
  inputLabel: string
  inputReading: string
  rule: string
  ledOn: boolean
  canObserve: boolean
  hasRun: boolean
}

export function InputOutputChallenge({ title, instruction, inputLabel, inputReading, rule, ledOn, canObserve, hasRun }: Props) {
  const [offAt, setOffAt] = useState<string>()
  const [onAt, setOnAt] = useState<string>()
  const complete = offAt !== undefined && onAt !== undefined && offAt !== onAt
  const capturedAt = ledOn ? onAt : offAt

  function capture() {
    if (ledOn) setOnAt(inputReading)
    else setOffAt(inputReading)
  }

  return <section className="input-output-challenge" aria-labelledby="input-output-challenge-title">
    <div className="input-output-challenge-heading">
      <p className="eyebrow">THỬ THÁCH THEO MÔ HÌNH</p>
      <span>{complete ? 'Đạt trong phiên này' : `${Number(offAt !== undefined) + Number(onAt !== undefined)}/2 trạng thái`}</span>
    </div>
    <h3 id="input-output-challenge-title">{title}</h3>
    <p>{instruction}</p>
    <p className="input-output-challenge-rule">Điều kiện trong code: {rule}</p>
    <div className="input-output-challenge-state">
      <span>{inputLabel} <strong>{inputReading}</strong></span>
      <span>LED <strong>{ledOn ? 'Sáng' : 'Tắt'}</strong></span>
    </div>
    <div className="input-output-challenge-observations">
      <div><span>LED tắt khi</span><strong>{offAt ?? 'Chưa ghi nhận'}</strong></div>
      <div><span>LED sáng khi</span><strong>{onAt ?? 'Chưa ghi nhận'}</strong></div>
    </div>
    <button type="button" className="input-output-challenge-capture" disabled={!canObserve || !hasRun} onClick={capture}>
      {capturedAt === undefined ? 'Ghi nhận trạng thái hiện tại' : `Cập nhật quan sát: ${inputReading}`}
    </button>
    {!hasRun && <small>Chạy hoặc chạy từng bước trước khi ghi nhận quan sát.</small>}
    {hasRun && !canObserve && <small>Mạch hoặc code chưa hợp lệ. Sửa lỗi trước khi ghi nhận.</small>}
    {complete && <p className="input-output-challenge-complete" role="status">Bạn đã ghi nhận đầu vào khác nhau dẫn tới hai trạng thái LED. Đây là mục tiêu của bài tập mô hình, không phải xác nhận phần cứng.</p>}
    <small>Quan sát chỉ dùng provider và đầu vào ảo hiện tại; kết quả không được lưu thành điểm hay năng lực đã đạt.</small>
  </section>
}
