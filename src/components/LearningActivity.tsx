import { Link } from 'react-router-dom'
import { curriculumLessons } from '../data/curriculumSchema'
import { getLessonEntryRoute } from '../data/learningPath'
import type { BuilderLessonId } from '../data/builderLessons'
import type { LessonSimulationAttempt } from '../lib/learningProgress'
import './LearningActivity.css'

type Props = {
  attempts: readonly LessonSimulationAttempt[]
  lessonId?: BuilderLessonId
  routeFor?: (route: string) => string
  limit?: number
}

const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })

function routeForAttempt(attempt: LessonSimulationAttempt) {
  const route = getLessonEntryRoute({ id: attempt.lessonId }, attempt.boardId)
  // The long-form blink lesson also accepts a board query for its reference viewer.
  if (attempt.lessonId === 'blink' && attempt.boardId !== 'esp32-devkit') {
    return `${route}?board=${encodeURIComponent(attempt.boardId)}`
  }
  return route
}

export function LearningActivity({ attempts, lessonId, routeFor = (route) => route, limit = 5 }: Props) {
  const lessonAttempts = lessonId ? attempts.filter((attempt) => attempt.lessonId === lessonId) : attempts
  const visibleAttempts = lessonAttempts.slice(0, limit)
  const headingId = lessonId ? `learning-activity-${lessonId}` : 'learning-activity-recent'

  return (
    <section className="learning-activity" aria-labelledby={headingId}>
      <div className="learning-activity-heading">
        <div>
          <p className="eyebrow">THỰC HÀNH GẦN ĐÂY</p>
          <h2 id={headingId}>{lessonId ? 'Lịch sử bài này' : 'Lịch sử chạy mô hình'}</h2>
        </div>
        {lessonId && lessonAttempts.length > 0 && <span>{lessonAttempts.length} lượt đã bắt đầu</span>}
      </div>
      {visibleAttempts.length > 0 ? (
        <ol className="learning-activity-list">
          {visibleAttempts.map((attempt, index) => {
            const lesson = curriculumLessons.find((item) => item.id === attempt.lessonId)
            const boardName = attempt.boardLabel || `Board ${attempt.boardId}`
            return (
              <li key={`${attempt.startedAt}-${attempt.lessonId}-${index}`}>
                <Link to={routeFor(routeForAttempt(attempt))}>
                  <strong>{lesson?.title ?? 'Bài học đã lưu'}</strong>
                  <span>{attempt.mode === 'avr8js-firmware' ? 'Firmware AVR8js' : 'Mô hình bài học'} · {boardName}</span>
                </Link>
                <time dateTime={attempt.startedAt}>{timeFormat.format(new Date(attempt.startedAt))}</time>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="learning-activity-empty">
          {lessonId ? 'Bạn chưa bắt đầu lượt mô phỏng nào cho bài này.' : 'Các lượt bắt đầu mô phỏng sẽ xuất hiện ở đây.'}
        </p>
      )}
      <p className="learning-activity-note">Chỉ lưu cục bộ thời điểm bắt đầu và board đã chọn; không lưu code, không chấm điểm và không xác nhận kết quả phần cứng.</p>
    </section>
  )
}
