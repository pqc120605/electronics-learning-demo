import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { boards } from '../data/boards'
import { curriculumLessons, type CurriculumLesson } from '../data/curriculumSchema'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { esp32LedLesson } from '../data/lessons'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { BoardPinoutExplorer } from './board/BoardPinoutExplorer'
import { BoardViewer } from './board/BoardViewer'
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

const studioTabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'pinout', label: 'Pinout' },
  { id: 'example', label: 'Ví dụ' },
  { id: 'specs', label: 'Thông số' },
] as const

type StudioTab = (typeof studioTabs)[number]['id']

export function FirstBoardStudio({ illustration }: { illustration?: ReactNode }) {
  const productRoute = useProductRoute()
  const board = boards.find((item) => item.id === 'esp32-devkit')
  const [sceneId, setSceneId] = useState<'pcb' | 'assembly'>('pcb')
  const [featureId, setFeatureId] = useState(getDefaultBoardFeatureId('esp32-devkit'))
  const [pinId, setPinId] = useState('')
  const [tab, setTab] = useState<StudioTab>('overview')
  const feature = esp32DevkitModel.features.find((item) => item.id === featureId) ?? esp32DevkitModel.features[0]
  const tabIndex = studioTabs.findIndex((item) => item.id === tab)

  function moveTab(nextIndex: number) {
    const next = studioTabs[(nextIndex + studioTabs.length) % studioTabs.length]
    setTab(next.id)
    document.getElementById(`board-studio-tab-${next.id}`)?.focus()
  }

  return <section className="home-studio" aria-labelledby="board-studio-title">
    <div className="home-studio-heading">
      <p className="eyebrow">BOARD BÀI ĐẦU TIÊN</p>
      <h2 id="board-studio-title">Xem board cạnh pinout, ví dụ và thông số</h2>
      <p>{board?.modelNote}</p>
    </div>
    <div className="home-studio-layout">
      <div className="home-studio-view">
        <BoardViewer manifest={esp32DevkitModel} selectedSceneId={sceneId} onSelectScene={setSceneId} selectedFeatureId={feature.id} highlightedFeatureIds={[]} onSelectFeature={setFeatureId} onHoverFeature={() => undefined} selectedPinId={pinId} onSelectPin={setPinId} />
      </div>
      <div className="home-studio-panel">
        <div className="home-studio-tabs" role="tablist" aria-label="Thông tin board">
          {studioTabs.map((item) => <button key={item.id} id={`board-studio-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`board-studio-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(tabIndex + 1) }
            else if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(tabIndex - 1) }
            else if (event.key === 'Home') { event.preventDefault(); moveTab(0) }
            else if (event.key === 'End') { event.preventDefault(); moveTab(studioTabs.length - 1) }
          }}>{item.label}</button>)}
        </div>
        <div id="board-studio-panel-overview" role="tabpanel" aria-labelledby="board-studio-tab-overview" hidden={tab !== 'overview'}>
          <h3>{feature.name}</h3>
          <p>{feature.plainDescription}</p>
          <p>{feature.safetyNote}</p>
          {illustration}
        </div>
        <div id="board-studio-panel-pinout" role="tabpanel" aria-labelledby="board-studio-tab-pinout" hidden={tab !== 'pinout'}>
          {tab === 'pinout' && <BoardPinoutExplorer pins={esp32DevkitModel.pins} selectedPinId={pinId} onSelectPin={setPinId} evidence={esp32DevkitModel.pinoutEvidence} />}
        </div>
        <div id="board-studio-panel-example" role="tabpanel" aria-labelledby="board-studio-tab-example" hidden={tab !== 'example'}>
          <h3>{esp32LedLesson.title}</h3>
          <p>{esp32LedLesson.codeExplanations[0]?.explanation}</p>
          <pre tabIndex={0} aria-label="Code mẫu bài LED"><code>{esp32LedLesson.code}</code></pre>
          <p>{esp32LedLesson.pinMap.map((row) => `${row.from} → ${row.to}`).join(' · ')}</p>
          <Link to={productRoute('/learn/esp32-led')}>Mở bài học nhập môn <span aria-hidden="true">↗</span></Link>
        </div>
        <div id="board-studio-panel-specs" role="tabpanel" aria-labelledby="board-studio-tab-specs" hidden={tab !== 'specs'}>
          <h3>{board?.name}</h3>
          <p>{board?.description}</p>
          <dl>
            <dt>Vi điều khiển</dt><dd>{board?.mcu}</dd>
            <dt>Revision tham chiếu</dt><dd>{board?.revision}</dd>
            <dt>Mức logic</dt><dd>{board?.logicLevel}</dd>
            <dt>Giao tiếp</dt><dd>{board?.interfaceSummary}</dd>
            <dt>Phù hợp khi</dt><dd>{board?.bestFor}</dd>
            <dt>Giới hạn</dt><dd>{board?.tradeoffs}</dd>
          </dl>
          <Link to={productRoute('/boards')}>Mở thư viện board <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </div>
  </section>
}
