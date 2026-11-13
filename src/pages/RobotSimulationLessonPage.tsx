import { useState } from 'react'
import './RobotSimulationLessonPage.css'

const steps = ['Quan sát hướng', 'Thử một lệnh', 'Gặp chướng ngại vật']

export function RobotSimulationLessonPage() {
  const [motion, setMotion] = useState('Đứng yên')
  const [obstacle, setObstacle] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const move = (direction: string) => {
    setObstacle(false)
    setMotion(direction)
  }
  const tryObstacle = () => {
    setObstacle(true)
    setMotion('Dừng trước chướng ngại vật')
  }
  const toggleStep = (step: string) => setCompleted(current => current.includes(step) ? current.filter(item => item !== step) : [...current, step])

  return <div className="robot-lesson">
    <header className="robot-lesson-header">
      <p className="robot-lesson-eyebrow">BÀI HỌC TƯƠNG TÁC · MÔ PHỎNG KHÁI NIỆM</p>
      <h1 id="robot-lesson-title">Khám phá chuyển động của robot</h1>
      <p>Robot cần nhận lệnh để tiến, lùi, rẽ hoặc dừng. Hãy quan sát cách thay đổi hướng đi trong hoạt cảnh ảo.</p>
      <p className="robot-lesson-limit"><strong>Giới hạn:</strong> Đây là hoạt động khái niệm chạy ngay trong trình duyệt. Hình ảnh và trạng thái là minh họa; chúng không điều khiển, đo đạc hay xác nhận robot hoặc phần cứng thật.</p>
    </header>

    <section className="robot-simulator" aria-labelledby="robot-simulator-title">
      <div className="robot-simulator-heading"><div><p className="robot-lesson-eyebrow">SÂN THỬ ẢO</p><h2 id="robot-simulator-title">Chọn một lệnh chuyển động</h2></div><span className="robot-concept-badge">Mô phỏng khái niệm</span></div>
      <div className="robot-world" aria-label="Hoạt cảnh robot ảo">
        <div className={`robot-avatar ${motion.includes('Rẽ trái') ? 'turn-left' : motion.includes('Rẽ phải') ? 'turn-right' : ''}`} aria-hidden="true">🤖</div>
        {obstacle && <div className="robot-obstacle" aria-hidden="true">▧</div>}
        <span className="robot-world-label">{obstacle ? 'Vật cản ảo' : 'Đường đi ảo'}</span>
      </div>
      <p className="robot-status" role="status" aria-label="Trạng thái robot ảo">Trạng thái ảo: <strong>{motion}</strong></p>
      <div className="robot-controls" aria-label="Lệnh robot ảo">
        <button type="button" onClick={() => move('Đi thẳng')}>Tiến</button>
        <button type="button" onClick={() => move('Lùi lại')}>Lùi</button>
        <button type="button" onClick={() => move('Rẽ trái')}>Rẽ trái</button>
        <button type="button" onClick={() => move('Rẽ phải')}>Rẽ phải</button>
        <button type="button" onClick={() => move('Đứng yên')}>Dừng</button>
      </div>
      <button className="robot-obstacle-button" type="button" onClick={tryObstacle}>Thử tình huống chướng ngại vật</button>
    </section>

    <section className="robot-lesson-steps" aria-labelledby="robot-steps-title">
      <p className="robot-lesson-eyebrow">LÀM THEO TỪNG BƯỚC</p><h2 id="robot-steps-title">Quan sát, thử và suy nghĩ</h2>
      <ol>{steps.map((step, index) => <li key={step}><div><strong>{index + 1}. {step}</strong><p>{index === 0 ? 'Nhấn Tiến hoặc Lùi và quan sát trạng thái ảo.' : index === 1 ? 'Thử rẽ trái, rẽ phải rồi nhấn Dừng.' : 'Chọn tình huống vật cản và quan sát robot dừng lại.'}</p></div><button type="button" aria-pressed={completed.includes(step)} onClick={() => toggleStep(step)}>{completed.includes(step) ? `Đã hoàn thành: ${step}` : `Hoàn thành: ${step}`}</button></li>)}</ol>
      <p className="robot-completion">Đã tự đánh dấu {completed.length}/{steps.length} bước. Đây không phải đánh giá năng lực.</p>
    </section>
  </div>
}
