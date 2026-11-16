import {useId}from'react'
import {Link}from'react-router-dom'
import {boards}from'../../data/boards'
import {simulationTargets}from'../../data/simulationTargets'
import {getBuilderLesson,type BuilderLessonId}from'../../data/builderLessons'
import {resolveLessonBoardChoice}from'../../lib/lessonBoardSelection'
import {GuideContextBridge}from'../guide/GuideContext'
import {useProductRoute}from'../../lib/useProductRoute'
import './LessonBoardChooser.css'
export function LessonBoardChooser({lessonId='blink',requestedId,onChoose}:{lessonId?:BuilderLessonId;requestedId?:string|null;onChoose:(id:string)=>void}){
 const id=useId(),choice=resolveLessonBoardChoice(requestedId),lesson=getBuilderLesson(lessonId),route=useProductRoute()
 return <section className="lesson-board-chooser" aria-labelledby={`${id}-title`}>
  <GuideContextBridge snapshot={{owner:'lesson-board-choice',priority:110,lesson:lesson.title,status:'Chưa chọn board tương thích',issues:choice.kind==='unknown'?[`Không tìm thấy board ${choice.requestedId}; không tự đổi sang ESP32.`]:choice.kind==='reference'?[`${choice.board.name} chỉ có hồ sơ tham khảo, chưa có kịch bản tương thích.`]:[],next:'Chọn board của bạn để dựng mạch và code mẫu đúng profile.'}}/>
  <p className="lesson-board-kicker">Bài học theo board của bạn</p><h1 id={`${id}-title`}>{lesson.title}</h1><p>Chọn board bạn muốn dùng. Mạch, cách đánh số chân, code mẫu và mức mô phỏng sẽ theo lựa chọn này.</p>
  <label htmlFor={`${id}-select`}>Board của bạn</label><select id={`${id}-select`} value={requestedId??''} onChange={event=>onChoose(event.target.value)}>
   <option value="">Chọn một board để bắt đầu…</option>
   {boards.map(board=><option key={board.id} value={board.id}>{board.name}{simulationTargets.some(target=>target.boardId===board.id)?'':' · chỉ tham khảo'}</option>)}
  </select>
  {choice.kind==='unselected'&&<p className="lesson-board-note" role="status">Chưa chọn board. Chưa dựng mạch hay nạp code mẫu; bản nháp đang có được giữ nguyên.</p>}
  {choice.kind==='unknown'&&<p className="lesson-board-note" role="alert">Không tìm thấy board “{choice.requestedId}”. Hãy chọn lại; ứng dụng không tự đổi sang ESP32.</p>}
  {choice.kind==='reference'&&<div className="lesson-board-note" role="status"><p>{choice.board.name} hiện có hồ sơ tham khảo nhưng chưa có kịch bản bài học tương thích. Chọn board khác để thực hành.</p><Link to={route(`/boards?board=${encodeURIComponent(choice.board.id)}`)}>Xem hồ sơ và nguồn của board</Link></div>}
  <p className="lesson-board-note">Mỗi board có giới hạn riêng: hình CAD, mô hình bài học, chạy firmware và giải mạch điện là các khả năng khác nhau. Chọn board không tự xác nhận một kit thật.</p>
 </section>
}
