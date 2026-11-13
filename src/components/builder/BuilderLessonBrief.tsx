import { Link } from 'react-router-dom'
import type { CurriculumLesson } from '../../data/curriculumSchema'
import { getLessonEntryRoute } from '../../data/learningPath'
import type { SimulationTarget } from '../../data/simulationTargets'
import { getLessonPreflight } from '../../lib/lessonPreflight'
import { useProductRoute } from '../../lib/useProductRoute'
import { CapabilityBadge } from '../CapabilityBadge'

type Props = { lesson: CurriculumLesson; target: SimulationTarget; defaultOpen?: boolean }

/** On a phone the brief starts collapsed so it does not push the canvas down a whole screen. */
const openByDefault = () => globalThis.matchMedia?.('(min-width: 761px)').matches ?? true

export function BuilderLessonBrief({ lesson, target, defaultOpen }: Props) {
  const productRoute = useProductRoute()
  const parts = getLessonPreflight(lesson.id, target.boardId).parts.map((part) => part.count > 1 ? `${part.label} × ${part.count}` : part.label)
  const entryRoute = getLessonEntryRoute(lesson, target.boardId)
  return <details className="builder-lesson-brief" open={defaultOpen ?? openByDefault()}>
    <summary>Mục tiêu bài · {lesson.durationMinutes} phút</summary>
    <div>
      <section aria-label="Sau bài này bạn sẽ"><strong>Sau bài này bạn sẽ</strong><ul>{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section aria-label="Bạn cần"><strong>Bạn cần</strong><ul>{parts.map((item) => <li key={item}>{item}</li>)}</ul><p><Link to={productRoute(entryRoute)}>Xem bảng chân và lưu ý an toàn</Link></p></section>
      <section aria-label="Mức mô phỏng"><strong>Mức mô phỏng</strong><p><CapabilityBadge id={lesson.simulationMode === 'code-subset' ? 'behavior-simulation' : 'concept-illustration'} /></p><p>{lesson.supportedBehavior}</p></section>
    </div>
  </details>
}
