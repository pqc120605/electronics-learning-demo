import {lazy, Suspense, useId, useState}from'react'
import {Link, useNavigate}from'react-router-dom'
import {boards}from'../../data/boards'
import {simulationTargets}from'../../data/simulationTargets'
import {getBuilderLesson,type BuilderLessonId}from'../../data/builderLessons'
import {resolveLessonBoardChoice}from'../../lib/lessonBoardSelection'
import {GuideContextBridge}from'../guide/GuideContext'
import {useProductRoute}from'../../lib/useProductRoute'
import './LessonBoardChooser.css'
import './BoardCapabilityFinder.css'
import { curriculumLessons } from '../../data/curriculumSchema'
import { getLessonEntryRoute, learningPathOrder } from '../../data/learningPath'

const BoardCapabilityOptions = lazy(() => import('./BoardCapabilityFinder').then(module => ({ default: module.BoardCapabilityOptions })))

/** Navigation only: selecting a lesson never creates or replaces a workspace draft. */
export function LessonNavigation({ lessonId, boardId }: { lessonId?: BuilderLessonId; boardId?: string | null }) {
 const id = useId(), navigate = useNavigate(), route = useProductRoute()
 return <nav className="lesson-navigation" aria-label="Chọn bài và board">
  <div className="lesson-navigation-picker">
   <label htmlFor={`${id}-lesson`}>Chọn bài học</label>
   <select id={`${id}-lesson`} value={lessonId ?? ''} onChange={event => {
    const next = learningPathOrder.find(item => item === event.target.value)
    if (next) navigate(route(getLessonEntryRoute({ id: next }, boardId || undefined)))
   }}>
    <option value="" disabled>Chọn bất kỳ bài nào…</option>
    {learningPathOrder.map(value => <option key={value} value={value}>{curriculumLessons.find(lesson => lesson.id === value)?.title}</option>)}
   </select>
  </div>
  {lessonId && <Link to={route('/topics')}>Danh sách bài học</Link>}
  {lessonId && boardId && <Link to={route(getLessonEntryRoute({ id: lessonId }))}>Chọn lại board</Link>}
 </nav>
}

export function LessonBoardChooser({lessonId='blink',requestedId,onChoose}:{lessonId?:BuilderLessonId;requestedId?:string|null;onChoose:(id:string)=>void}){
 const id=useId(),choice=resolveLessonBoardChoice(requestedId),lesson=getBuilderLesson(lessonId),route=useProductRoute()
 const [comparisonOpened, setComparisonOpened] = useState(false)
 return <section className="lesson-board-chooser" aria-labelledby={`${id}-title`}>
  <LessonNavigation lessonId={lessonId} boardId={requestedId}/>
  <GuideContextBridge snapshot={{owner:'lesson-board-choice',priority:110,lesson:lesson.title,status:'Chưa chọn board tương thích',issues:choice.kind==='unknown'?[`Không tìm thấy board ${choice.requestedId}; không tự đổi sang ESP32.`]:choice.kind==='reference'?[`${choice.board.name} chỉ có hồ sơ tham khảo, chưa có kịch bản tương thích.`]:[],next:'Chọn board của bạn để dựng mạch và code mẫu đúng profile.'}}/>
  <p className="lesson-board-kicker">Bài học theo board của bạn</p><h1 id={`${id}-title`}>{lesson.title}</h1><p>Chọn board bạn muốn dùng. Mạch, cách đánh số chân, code mẫu và mức mô phỏng sẽ theo lựa chọn này.</p>
  <label htmlFor={`${id}-select`}>Board của bạn</label><select id={`${id}-select`} value={requestedId??''} onChange={event=>onChoose(event.target.value)}>
   <option value="">Chọn một board để bắt đầu…</option>
   {boards.map(board=><option key={board.id} value={board.id}>{board.name}{simulationTargets.some(target=>target.boardId===board.id)?'':' · chỉ tham khảo'}</option>)}
  </select>
  {choice.kind==='unselected'&&<p className="lesson-board-note" role="status">Chưa chọn board. Chưa dựng mạch hay nạp code mẫu; bản nháp đang có được giữ nguyên.</p>}
  {choice.kind==='unknown'&&<p className="lesson-board-note" role="alert">Không tìm thấy board “{choice.requestedId}”. Hãy chọn lại; ứng dụng không tự đổi sang ESP32.</p>}
  {choice.kind==='reference'&&<div className="lesson-board-note" role="status"><p>{choice.board.name} hiện có hồ sơ tham khảo nhưng chưa có kịch bản bài học tương thích. Chọn board khác để thực hành.</p><Link to={route(`/boards?board=${encodeURIComponent(choice.board.id)}`)}>Xem hồ sơ và nguồn của board</Link></div>}
  <details className="board-capability-finder" onToggle={event => {
    if (event.currentTarget.open) setComparisonOpened(true)
  }}>
    <summary>Chưa biết chọn board? So sánh khả năng</summary>
    {comparisonOpened && <Suspense fallback={<p role="status">Đang tải so sánh board…</p>}>
      <BoardCapabilityOptions lessonId={lessonId} onChoose={onChoose} />
    </Suspense>}
  </details>
  <p className="lesson-board-note">Mỗi board có giới hạn riêng: hình CAD, mô hình bài học, chạy firmware và giải mạch điện là các khả năng khác nhau. Chọn board không tự xác nhận một kit thật.</p>
 </section>
}
