import { useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BuilderLessonId } from '../../data/builderLessons'
import {
  filterLessonBoardCapabilities, listLessonBoardCapabilities,
  type BoardCapabilityFilter, type LessonBoardCapabilities,
} from '../../lib/lessonBoardCapabilities'
import { useProductRoute } from '../../lib/useProductRoute'
import './BoardCapabilityFinder.css'

function anchorDescription(row: LessonBoardCapabilities): string {
  if (row.anchors.status === 'unavailable') return 'Bài chưa khả dụng; không đánh giá vị trí điểm cắm.'
  if (row.anchors.status === 'not-needed') return 'Bài này không nối chân MCU.'
  return `${row.anchors.anchored.length}/${row.anchors.required.length} chân cần dùng có tọa độ nguồn trong hình bài học.`
}

type Props = { lessonId: BuilderLessonId; onChoose: (id: string) => void }

export function BoardCapabilityFinder(props: Props) {
  return <details className="board-capability-finder">
    <summary>Chưa biết chọn board? So sánh khả năng</summary>
    <BoardCapabilityOptions {...props} />
  </details>
}

export function BoardCapabilityOptions({ lessonId, onChoose }: Props) {
  const id = useId()
  const route = useProductRoute()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [capability, setCapability] = useState<BoardCapabilityFilter>('all')
  const [limit, setLimit] = useState(6)
  const [compared, setCompared] = useState<string[]>([])
  const rows = useMemo(() => listLessonBoardCapabilities(lessonId), [lessonId])
  const filtered = filterLessonBoardCapabilities(rows, { query, capability })
  const selected = compared.flatMap(boardId => rows.filter(row => row.boardId === boardId))
  const optionId = (boardId: string) => `${id}-${boardId}`

  function changeComparison(boardId: string, checked: boolean) {
    setCompared(current => checked
      ? current.includes(boardId) || current.length >= 2 ? current : [...current, boardId]
      : current.filter(value => value !== boardId))
  }
  function removeComparison(boardId: string) {
    changeComparison(boardId, false)
    requestAnimationFrame(() => {
      const checkbox = document.getElementById(optionId(boardId))
      if (checkbox instanceof HTMLInputElement) checkbox.focus()
      else searchRef.current?.focus()
    })
  }

  return <>
    <p>So sánh tối đa hai board theo bài đang mở. Chỉ nút chọn board mới mở bài; bộ lọc và so sánh không tạo mạch hoặc sửa nháp.</p>
    <div className="board-finder-filters">
      <label htmlFor={`${id}-search`}>Tìm board để so sánh
        <input id={`${id}-search`} ref={searchRef} type="search" maxLength={120} value={query} onChange={event => { setQuery(event.target.value); setLimit(6) }} />
      </label>
      <div>
        <label htmlFor={`${id}-filter`}>Lọc theo khả năng</label>
        <select id={`${id}-filter`} value={capability} onChange={event => { setCapability(event.target.value as BoardCapabilityFilter); setLimit(6) }}>
          <option value="all">Tất cả hồ sơ</option>
          <option value="lesson">Có kịch bản bài này</option>
          <option value="anchors">Đủ điểm cắm có nguồn trong bài</option>
          <option value="hex">Công cụ HEX ATmega328P</option>
        </select>
      </div>
    </div>
    <p className="board-finder-status" role="status" aria-live="polite">{filtered.length} hồ sơ phù hợp · {selected.length}/2 board đang so sánh.</p>
    <ul className="board-finder-options" aria-label="Kết quả tìm board">
      {filtered.slice(0, limit).map(row => <li key={row.boardId} data-board-option={row.boardId}>
        <label htmlFor={optionId(row.boardId)}>
          <input id={optionId(row.boardId)} type="checkbox" checked={compared.includes(row.boardId)}
            disabled={selected.length >= 2 && !compared.includes(row.boardId)}
            onChange={event => changeComparison(row.boardId, event.target.checked)} />
          <span><strong>{row.name}</strong><small>{row.lessonSupported ? 'Có kịch bản bài này' : row.targetAvailable ? 'Bài này đang khóa' : 'Hồ sơ tham khảo'}</small></span>
        </label>
      </li>)}
    </ul>
    {!filtered.length && <p>Không có hồ sơ khớp. Thử bỏ bộ lọc hoặc tìm tên biến thể khác.</p>}
    {filtered.length > limit && <button type="button" onClick={() => setLimit(current => current + 6)}>Xem thêm hồ sơ ({Math.min(6, filtered.length - limit)})</button>}
    <section className="board-capability-comparison" aria-label="Board đang so sánh">
      {!selected.length && <p>Đánh dấu một hoặc hai board để xem phạm vi hỗ trợ và nguồn.</p>}
      {selected.map(row => <article key={row.boardId} data-board-card={row.boardId}>
        <header><h2>{row.name}</h2><button type="button" onClick={() => removeComparison(row.boardId)} aria-label={`Bỏ so sánh ${row.name}`}>Bỏ so sánh</button></header>
        <dl>
          <div><dt>Bài đang mở</dt><dd>{row.lessonReason} {row.lessonRuntime}</dd></div>
          <div><dt>Điểm cắm trong hình bài học</dt><dd>{anchorDescription(row)}
            {!!row.anchors.missing.length && <span className="board-finder-missing">Chưa có tọa độ nguồn: {row.anchors.missing.map(pin => pin.label).join(', ')}.</span>}
          </dd></div>
          <div><dt>Bảng chân và nguồn</dt><dd>{row.pinoutSummary}</dd></div>
          <div><dt>Hình tham chiếu và revision</dt><dd>{row.modelSummary} {row.revision}</dd></div>
          <div><dt>Công cụ HEX riêng</dt><dd>{row.hex.description}</dd></div>
        </dl>
        <p className="board-finder-limit">{row.solverNote} Tọa độ có nguồn không xác nhận chức năng điện của alias hay kit thật.</p>
        <div className="board-finder-actions">
          {row.lessonSupported && <button type="button" onClick={() => onChoose(row.boardId)}>Chọn {row.name} cho bài này</button>}
          <Link to={route(row.boardRoute)}>Hồ sơ board và nguồn</Link>
          {row.hex.supported && <Link to={route('/tools/firmware-hex')}>Mở công cụ HEX riêng</Link>}
        </div>
      </article>)}
    </section>
  </>
}
