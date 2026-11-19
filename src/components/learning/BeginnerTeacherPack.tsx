import { useMemo, useState } from 'react'
import { getBeginnerBoardOptions } from '../../lib/beginnerCourse'
import { createBeginnerTeacherPack, renderBeginnerTeacherPackHtml } from '../../lib/beginnerTeacherPack'
import './BeginnerTeacherPack.css'

export function BeginnerTeacherPack() {
  const [boardId, setBoardId] = useState('')
  const pack = useMemo(() => createBeginnerTeacherPack(boardId), [boardId])
  const html = useMemo(() => renderBeginnerTeacherPackHtml(pack), [pack])

  function download() {
    if (!pack.downloadReady || !pack.boardId) return
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mach-mo-teacher-pack-${pack.boardId.replace(/[^a-z0-9-]/gi, '-')}.html`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <details className="beginner-teacher-pack">
    <summary>Gói thực hành cho giáo viên</summary>
    <div className="teacher-pack-content">
      <h2>Chuẩn bị một buổi học</h2>
      <p>5 hoạt động, 13 trường hợp: hướng dẫn dẫn dắt, phiếu trống và đáp án riêng khi in. Thời lượng là ước lượng; thành phần chỉ thuộc mô hình, không phải BOM kit thật.</p>
      <label htmlFor="teacher-pack-board">Board của gói giáo viên</label>
      <select id="teacher-pack-board" value={boardId} onChange={event => setBoardId(event.target.value)} aria-describedby="teacher-pack-board-note">
        <option value="">Chọn board cho gói</option>
        {getBeginnerBoardOptions().map(board => <option key={board.boardId} value={board.boardId}>{board.name}</option>)}
      </select>
      <p id="teacher-pack-board-note">Lựa chọn riêng cho gói; không đổi board, tiến độ hoặc bản nháp đang học.</p>
      <p role="status">{pack.reason || `Gói sẵn sàng cho ${pack.boardName}. Ngưỡng cảm biến cố định 50%.`}</p>
      <button type="button" disabled={!pack.downloadReady} onClick={download}>Tải gói HTML</button>
      <p>Mở file tải về bằng trình duyệt để đọc offline và in. Phần đáp án bắt đầu trang in mới. Quan sát điền tay không tự tạo bằng chứng hay tiêu chí hoàn thành trong ứng dụng.</p>
      <iframe title="Xem trước gói thực hành giáo viên" tabIndex={0} sandbox="" srcDoc={html} />
    </div>
  </details>
}
