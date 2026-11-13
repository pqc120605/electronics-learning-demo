import { useEffect, useState } from 'react'
import type { BuilderLessonId } from '../data/builderLessons'
import { isLessonSelfReportedComplete, setLessonSelfReportedCompletion } from '../lib/learningProgress'
import './LessonProgressToggle.css'

export function LessonProgressToggle({ lessonId }: { lessonId: BuilderLessonId }) {
  const [completed, setCompleted] = useState(() => isLessonSelfReportedComplete(lessonId))
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    const refresh = () => setCompleted(isLessonSelfReportedComplete(lessonId))
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [lessonId])

  function toggleCompletion() {
    const next = !completed
    const saved = setLessonSelfReportedCompletion(lessonId, next)
    setSaveFailed(!saved)
    if (saved) setCompleted(next)
  }

  return <div className="lesson-progress-toggle">
    <button type="button" aria-pressed={completed} onClick={toggleCompletion}>
      {completed ? 'Bỏ đánh dấu hoàn thành' : 'Tự đánh dấu đã hoàn thành'}
    </button>
    <p role={saveFailed ? 'alert' : 'status'}>
      {saveFailed
        ? 'Không lưu được tiến độ trên trình duyệt này.'
        : completed
          ? 'Bạn đã tự xác nhận hoàn thành bài. Trạng thái này chỉ lưu trên thiết bị.'
          : 'Bạn có thể tự đánh dấu sau khi hoàn thành; đây không phải điểm đánh giá.'}
    </p>
  </div>
}
