import { useId } from 'react'
import { Link } from 'react-router-dom'
import { curriculumLessons, type CurriculumLesson } from '../data/curriculumSchema'
import { getLessonEntryRoute, getPathMarker, learningStages } from '../data/learningPath'
import { useProductRoute } from '../lib/useProductRoute'
import { CapabilityBadge } from './CapabilityBadge'
import './LearningPath.css'

type Props = { lastLessonId?: string; startedLessonIds?: string[]; completedLessonIds?: string[]; headingLevel?: 'h2' | 'h3' }

const lessonById = new Map<string, CurriculumLesson>(curriculumLessons.map((lesson) => [lesson.id, lesson]))

export function LearningPath({ lastLessonId, startedLessonIds = [], completedLessonIds = [], headingLevel = 'h2' }: Props) {
  const productRoute = useProductRoute()
  const completed = new Set(completedLessonIds)
  const started = new Set(startedLessonIds)
  const StageHeading = headingLevel
  const pathIds = learningStages.flatMap((stage) => stage.lessonIds)
  const completedCount = pathIds.filter((id) => completed.has(id)).length
  const startedCount = pathIds.filter((id) => started.has(id)).length
  const progressPercent = pathIds.length === 0 ? 0 : Math.round((completedCount / pathIds.length) * 100)
  const progressLabelId = useId()
  return <div className="learning-path-block">
    <div className="learning-path-progress">
      <p id={progressLabelId}>Tiến độ trên thiết bị này</p>
      <div className="learning-path-meter" role="progressbar" aria-labelledby={progressLabelId} aria-valuemin={0} aria-valuemax={pathIds.length} aria-valuenow={completedCount} aria-valuetext={`${completedCount} trên ${pathIds.length} bài tự xác nhận hoàn thành`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <p>{`${completedCount}/${pathIds.length} bài tự xác nhận · ${startedCount}/${pathIds.length} đã mở`}</p>
    </div>
    <ol className="learning-path">
    {learningStages.map((stage, stageIndex) => <li className="learning-path-stage" key={stage.id}>
      <div className="learning-path-stage-copy">
        <span className="learning-path-stage-number">Chặng {stageIndex + 1}</span>
        <StageHeading>{stage.title}</StageHeading>
        <p>{stage.summary}</p>
      </div>
      <ol className="learning-path-lessons">
        {stage.lessonIds.map((id) => {
          const lesson = lessonById.get(id)
          if (!lesson) return null
          const marker = getPathMarker(id, lastLessonId, completedLessonIds)
          return <li key={id} className={[marker ? 'learning-path-lesson-marked' : '', completed.has(id) ? 'learning-path-lesson-completed' : ''].filter(Boolean).join(' ') || undefined}>
            <span className="learning-path-pad" aria-hidden="true" />
            <Link to={productRoute(getLessonEntryRoute(lesson))}>
              <strong>{lesson.title}</strong>
              <small>{lesson.objectives[0]}</small>
              <span className="learning-path-meta">
                <span>{lesson.durationMinutes} phút</span>
                <CapabilityBadge id={lesson.simulationMode === 'code-subset' ? 'behavior-simulation' : 'concept-illustration'} />
                {marker && <b>{marker}</b>}
                {completed.has(id) && <b className="learning-path-self-reported">Tự xác nhận hoàn thành</b>}
                {!completed.has(id) && <span className="learning-path-status">{started.has(id) ? (id === lastLessonId ? 'Đang học' : 'Đã bắt đầu') : 'Chưa bắt đầu'}</span>}
              </span>
            </Link>
          </li>
        })}
      </ol>
    </li>)}
    </ol>
  </div>
}
