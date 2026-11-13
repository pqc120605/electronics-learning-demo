import { useEffect } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { CapabilityBadge } from '../components/CapabilityBadge'
import { ComponentIllustration } from '../components/ComponentIllustration'
import { LessonProgressToggle } from '../components/LessonProgressToggle'
import { LearningActivity } from '../components/LearningActivity'
import { ButtonLedLessonLab } from '../components/lesson/ButtonLedLessonLab'
import { builderLessons, type BuilderLessonId } from '../data/builderLessons'
import { curriculumLessons } from '../data/curriculumSchema'
import { getLessonEntryRoute, getLessonPrerequisiteIds, getNextLessonId, getUnmetPrerequisiteIds, learningPathOrder, learningStages } from '../data/learningPath'
import { getSimulationTarget, normalizeSimulationTargetId } from '../data/simulationTargets'
import { recordLessonOpened } from '../lib/learningProgress'
import { getLessonPreflight, getPreflightBoardNotice, preflightBoardIds } from '../lib/lessonPreflight'
import { useLearningProgress } from '../lib/useLearningProgress'
import { useProductRoute } from '../lib/useProductRoute'
import './LessonPreflightPage.css'

export function LessonPreflightPage() {
  const productRoute = useProductRoute()
  const progress = useLearningProgress()
  const { lessonId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const validLesson = builderLessons.some((item) => item.id === lessonId) ? lessonId as BuilderLessonId : undefined
  useEffect(() => { if (validLesson) recordLessonOpened(validLesson) }, [validLesson])
  if (lessonId === 'blink') return <Navigate replace to={productRoute('/learn/esp32-led')} />
  if (!validLesson) return <div className="catalog-page"><section className="catalog-page-heading"><h1>Không tìm thấy bài này</h1><p>Liên kết có thể đã cũ. Bạn có thể chọn lại bài trong lộ trình.</p><Link className="button-primary" to={productRoute('/topics')}>Xem lộ trình</Link></section></div>

  const boardId = searchParams.has('board') ? normalizeSimulationTargetId(searchParams.get('board') ?? undefined) : 'esp32-devkit'
  const preflight = getLessonPreflight(validLesson, boardId)
  const { lesson, target, support, revision, confidence, sourceUrl, licenseName, hasBoardViewer, boardRoute, parts, pins, startRoute } = preflight
  const boardNotice = getPreflightBoardNotice(searchParams.get('board'))
  const stageIndex = learningStages.findIndex((stage) => stage.lessonIds.includes(validLesson))
  const previousId = learningPathOrder[learningPathOrder.indexOf(validLesson) - 1]
  const nextId = getNextLessonId(validLesson)
  const neighbour = (id?: BuilderLessonId) => curriculumLessons.find((item) => item.id === id)
  const entry = (id: BuilderLessonId) => productRoute(getLessonEntryRoute({ id }, target.boardId))
  const boardOptions = preflightBoardIds.includes(target.boardId as typeof preflightBoardIds[number]) ? preflightBoardIds : [target.boardId, ...preflightBoardIds]
  const previous = neighbour(previousId), next = neighbour(nextId)
  const unmetPrerequisites = getUnmetPrerequisiteIds(validLesson, progress.selfReportedCompletedLessonIds)
  const requestedBoard = searchParams.get('board')
  const buttonBoardNotice = boardNotice ?? (requestedBoard === '' ? { kind: 'unknown' as const, message: 'Liên kết chưa chỉ định board. Hãy chọn board cho bài học.' } : undefined)

  if (validLesson === 'button-led') return <ButtonLedLessonLab
    preflight={preflight}
    boardId={buttonBoardNotice ? requestedBoard ?? boardId : boardId}
    boardNotice={buttonBoardNotice}
    boardOptions={boardOptions}
    onBoardChange={id => setSearchParams(id === 'esp32-devkit' ? {} : { board: id }, { replace: true })}
    position={learningPathOrder.indexOf(validLesson) + 1}
    total={learningPathOrder.length}
    stage={learningStages[stageIndex]?.title}
    previous={previous && { title: previous.title, to: entry(previous.id) }}
    next={next && { title: next.title, to: entry(next.id) }}
    progress={progress}
    routeFor={productRoute}
  />

  return <div className="lesson-preflight">
    <nav className="lesson-preflight-trail" aria-label="Vị trí trong lộ trình"><Link to={productRoute('/topics')}>Lộ trình</Link><span aria-hidden="true">/</span><span>Chặng {stageIndex + 1} · {learningStages[stageIndex]?.title}</span></nav>
    <header className="lesson-preflight-hero">
      <div>
        <p className="eyebrow">{lesson.level === 'nhập môn' ? 'NHẬP MÔN' : 'CƠ BẢN'} · {lesson.durationMinutes} PHÚT</p>
        <h1>{lesson.title}</h1>
        <ul className="lesson-preflight-goals">{lesson.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <aside aria-label="Bắt đầu bài">
        {boardNotice && <p className="lesson-preflight-locked" role="status">{boardNotice.message}{boardNotice.boardRoute && <> <Link to={productRoute(boardNotice.boardRoute)}>Xem hồ sơ board</Link></>}</p>}
        <label>Board của bạn<select value={target.boardId} onChange={(event) => setSearchParams(event.target.value === 'esp32-devkit' ? {} : { board: event.target.value }, { replace: true })}>{boardOptions.map((id) => <option key={id} value={id}>{getSimulationTarget(id).name}</option>)}</select></label>
        {support.supported ? <Link className="button-primary" to={productRoute(startRoute)}>Bắt đầu thực hành <span aria-hidden="true">↗</span></Link> : <p className="lesson-preflight-locked" role="status">{support.reason}</p>}
        <small>Mở trong phòng thử theo phiên riêng của tab này; workspace chính không bị thay đổi.</small>
      </aside>
    </header>

    <section className="lesson-preflight-progress" aria-label="Tiến độ tự khai báo">
      <LessonProgressToggle lessonId={validLesson} />
      <LearningActivity attempts={progress.simulationAttempts} lessonId={validLesson} routeFor={productRoute} />
    </section>

    <div className="lesson-preflight-grid">
      <section aria-labelledby="preflight-parts"><h2 id="preflight-parts">Bạn cần</h2>
        <ul className="lesson-preflight-parts">{parts.map((part) => <li key={part.label}><ComponentIllustration id={part.type} name={part.label} /><span><strong>{part.label}</strong>{part.count > 1 && <small>× {part.count}</small>}{part.catalogRoute && <Link className="lesson-preflight-part-link" to={productRoute(part.catalogRoute)}>Chi tiết và nguồn ↗</Link>}</span></li>)}</ul>
        <p className="lesson-preflight-note">Danh sách lấy từ mạch mẫu của bài; dây nối và breadboard tùy cách bạn lắp.</p>
      </section>

      <section aria-labelledby="preflight-board"><h2 id="preflight-board">Board và nguồn dữ liệu</h2>
        <dl className="lesson-preflight-facts">
          <div><dt>Board</dt><dd>{target.name}</dd></div>
          <div><dt>Bản tham chiếu</dt><dd>{revision}</dd></div>
          <div><dt>Mức logic</dt><dd>{target.logicLevel}</dd></div>
          <div><dt>Độ tin cậy chân</dt><dd>{confidence}</dd></div>
          {licenseName && <div><dt>Giấy phép mô hình</dt><dd>{licenseName}</dd></div>}
        </dl>
        {sourceUrl && <a className="lesson-preflight-source" href={sourceUrl} target="_blank" rel="noreferrer">Xem nguồn board <span aria-hidden="true">↗</span></a>}
        <p className="lesson-preflight-note">{lesson.boardProfile}</p>
        {hasBoardViewer ? <Link className="lesson-preflight-source" to={productRoute(boardRoute)}>Xem board 3D và nguồn CAD <span aria-hidden="true">→</span></Link> : <p className="lesson-preflight-note">Board này chưa có mô hình 3D tương tác.</p>}
      </section>

      <section className="lesson-preflight-wide" aria-labelledby="preflight-pins"><h2 id="preflight-pins">Nối chân trong mạch mẫu</h2>
        {pins.length ? <div className="lesson-preflight-table"><table>
          <thead><tr><th scope="col">Chân board</th><th scope="col">Nối tới</th><th scope="col">Nguồn dữ liệu</th></tr></thead>
          <tbody>{pins.map((pin) => <tr key={`${pin.boardPinId}-${pin.partLabel}-${pin.partPinLabel}`}><th scope="row">{pin.boardLabel}</th><td>{pin.partLabel} · {pin.partPinLabel}</td><td>{pin.sourceBacked ? 'Có nguồn tài liệu cho board này' : pin.boardPinId === 'gnd' || pin.boardPinId === 'vcc' ? 'Chân nguồn, xem vị trí trên board' : 'Alias học tập, cần đối chiếu'}</td></tr>)}</tbody>
        </table></div> : <p className="lesson-preflight-note">{support.supported ? 'Bài này là mạch khối chức năng, không nối vào chân MCU.' : 'Chưa có bảng chân đã xác minh cho board này, nên bảng được để trống.'}</p>}
      </section>

      <section aria-labelledby="preflight-sim"><h2 id="preflight-sim">Mô phỏng làm được gì</h2>
        <p><CapabilityBadge id={lesson.simulationMode === 'code-subset' ? 'behavior-simulation' : 'concept-illustration'} /></p>
        <p>{lesson.supportedBehavior}</p>
      </section>

      <section aria-labelledby="preflight-steps"><h2 id="preflight-steps">Các bước trong bài</h2><ol className="lesson-preflight-steps">{lesson.guidedSteps.map((item) => <li key={item}>{item}</li>)}</ol>
        <p className="lesson-preflight-note">Trước bài này: {lesson.prerequisites.join(', ')}.</p>
        {getLessonPrerequisiteIds(validLesson).length > 0 && <p className="lesson-preflight-note">Nên học trước: {getLessonPrerequisiteIds(validLesson).map((id, index) => <span key={id}>{index > 0 && ', '}<Link to={entry(id)}>{neighbour(id)?.title}</Link></span>)}. {unmetPrerequisites.length ? 'Bạn chưa đánh dấu xong các bài này, nhưng vẫn có thể học tiếp.' : 'Bạn đã đánh dấu xong các bài này.'}</p>}
      </section>

      <section className="lesson-preflight-safety" aria-labelledby="preflight-safety"><h2 id="preflight-safety">Trước khi lắp thật</h2><ul>{lesson.safetyNotes.map((item) => <li key={item}>{item}</li>)}<li>{lesson.hardwareTransition}</li></ul></section>
    </div>

    <nav className="lesson-preflight-neighbours" aria-label="Bài trước và bài sau">
      {previous ? <Link to={entry(previous.id)}><small>Bài trước</small>{previous.title}</Link> : <span />}
      {next && <Link to={entry(next.id)}><small>Bài sau</small>{next.title}</Link>}
    </nav>
  </div>
}
