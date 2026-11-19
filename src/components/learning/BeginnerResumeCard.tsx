import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BEGINNER_ACTIVITIES, getBeginnerActivity } from '../../data/beginnerCourse'
import { getBeginnerAssessment } from '../../lib/beginnerCourse'
import { readBeginnerSession, BEGINNER_COURSE_CHANGED_EVENT } from '../../lib/beginnerCourseStorage'
import { beginnerResumeUrl, getBeginnerRepair } from '../../lib/beginnerRepair'
import './BeginnerResumeCard.css'

export function useBeginnerResume() {
  const [saved, setSaved] = useState(() => readBeginnerSession())
  useEffect(() => {
    const refresh = () => setSaved(readBeginnerSession())
    window.addEventListener(BEGINNER_COURSE_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(BEGINNER_COURSE_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return saved
}

export function BeginnerResumeCard() {
  const saved = useBeginnerResume()
  const { pathname } = useLocation()
  const session = saved.session
  const met = session
    ? BEGINNER_ACTIVITIES.filter(activity => getBeginnerAssessment(session, activity.id).status === 'met').length
    : 0
  const app = pathname.startsWith('/app')
  const repair = getBeginnerRepair(session?.repairs?.active ?? null)
  return <section className="beginner-resume" aria-label="Khóa nền tảng điện tử">
    <div>
      <h2>Nền tảng điện tử qua 5 thử nghiệm</h2>
      <p>Dự đoán, thử và giải thích: từ đường về của mạch đến cảm biến.</p>
      {session
        ? <p>{met}/{BEGINNER_ACTIVITIES.length} hoạt động đạt tiêu chí mô hình.</p>
        : <p>Không cần kit hay tài khoản. Tiến độ lưu trong trình duyệt khi được phép.</p>}
      {['invalid', 'unsupported'].includes(saved.kind)
        && <p>Dữ liệu cũ được giữ nguyên. Mở khóa để tải bản sao và khôi phục.</p>}
    </div>
    <div className="beginner-resume-actions">
      <Link className="button-primary" to={beginnerResumeUrl(app ? '/app/learn/basics' : '/learn/basics', session?.repairs)}>
        {session ? `Tiếp tục: ${repair?.title ?? getBeginnerActivity(session.activityId).title}` : 'Học nhanh từ nền tảng'}
      </Link>
      <Link to={app ? '/app/learn/esp32-led' : '/learn/esp32-led'}>Bài LED có hướng dẫn</Link>
      <Link to={app ? '/app/lab/freestyle' : '/build/freestyle'}>Mở bàn trống</Link>
    </div>
  </section>
}
