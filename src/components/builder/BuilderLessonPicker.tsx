import { getBuilderLesson, getLessonBoardSupport, type BuilderLessonId } from '../../data/builderLessons'
import type { SimulationTarget } from '../../data/simulationTargets'
import type { CurriculumLesson } from '../../data/curriculumSchema'
import { CapabilityBadge } from '../CapabilityBadge'
import { Link } from 'react-router-dom'
import { getLessonEntryRoute } from '../../data/learningPath'
import { useProductRoute } from '../../lib/useProductRoute'
import { useId } from 'react'

type Props = {
  lessons: CurriculumLesson[]
  selectedId: BuilderLessonId
  target: SimulationTarget
  onSelect: (lessonId: BuilderLessonId) => void
}

export function BuilderLessonPicker({ lessons, selectedId, target, onSelect }: Props) {
  const route = useProductRoute()
  const selectId = useId()
  return <section className="builder-lesson-picker" aria-labelledby="builder-lesson-picker-title">
    <div className="builder-lesson-picker-heading"><div><p className="eyebrow">BƯỚC 1 · CHỌN BÀI THỰC HÀNH</p><h2 id="builder-lesson-picker-title">Bạn muốn thử điều gì?</h2><p>Chọn bài để nạp mạch, code và hướng dẫn trên {target.name}.</p></div><span>{lessons.length} bài · không cần tài khoản</span></div>
    <div className="lesson-navigation">
      <div className="lesson-navigation-picker"><label htmlFor={selectId}>Chọn bài thực hành</label><select id={selectId} value={selectedId} onChange={event => {
        const next = lessons.find(lesson => lesson.id === event.target.value)
        if (next) onSelect(next.id)
      }}>{lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}{getLessonBoardSupport(target, lesson.id).supported ? '' : ' · chưa hỗ trợ board này'}</option>)}</select></div>
      <Link to={route(getLessonEntryRoute({ id: selectedId }))}>Chọn lại board</Link>
      <Link to={route('/topics')}>Danh sách bài học</Link>
    </div>
    <div className="builder-lesson-cards">
      {lessons.map((item) => {
        const lessonInfo = getBuilderLesson(item.id)
        const support = getLessonBoardSupport(target, item.id)
        return <button key={item.id} type="button" className={`builder-lesson-card ${selectedId === item.id ? 'builder-lesson-card-selected' : ''}`} aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)}>
          <span className="builder-lesson-card-meta">{item.level} · {item.durationMinutes} phút</span>
          <strong>{item.title}</strong>
          <span className="builder-lesson-card-summary">{lessonInfo.summary}</span>
          <CapabilityBadge className={`project-capability-badge project-capability-${item.simulationMode}`} id={item.simulationMode === 'code-subset' ? 'behavior-simulation' : 'concept-illustration'} />
          {!support.supported && <span className="builder-lesson-card-locked">Chưa chạy được trên {target.name}</span>}
          <span className="builder-lesson-card-action">{selectedId === item.id ? 'Đang chọn ✓' : 'Chọn bài →'}</span>
        </button>
      })}
    </div>
  </section>
}
