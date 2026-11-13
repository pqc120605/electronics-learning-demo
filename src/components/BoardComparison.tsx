import { getBoardSupportSummary } from '../data/boardCapabilityRegistry'
import type { BoardSummary } from '../data/boards'

type Props = {
  boards: BoardSummary[]
  onRemove: (id: string) => void
  onClear: () => void
}

const rows: { label: string; value: (board: BoardSummary) => string | undefined }[] = [
  { label: 'Họ nền tảng', value: (board) => board.platform },
  { label: 'Vi điều khiển', value: (board) => board.mcu },
  { label: 'Phiên bản đối chiếu', value: (board) => board.revision },
  { label: 'Điện áp logic', value: (board) => board.logicLevel },
  { label: 'Ngoại vi và giao tiếp', value: (board) => board.interfaceSummary },
  { label: 'Phù hợp khi', value: (board) => board.bestFor },
  { label: 'Điểm cần cân nhắc', value: (board) => board.tradeoffs ?? board.modelNote },
  { label: 'Mô hình trong web', value: (board) => getBoardSupportSummary(board.id).model },
  { label: 'Pinout trong web', value: (board) => getBoardSupportSummary(board.id).pinout },
  { label: 'Phòng thử', value: (board) => getBoardSupportSummary(board.id).simulation },
]

export function BoardComparison({ boards, onRemove, onClear }: Props) {
  const knownLogicLevels = [...new Set(boards.map((board) => board.logicLevel).filter((level): level is string => Boolean(level))) ]
  const mixedLogic = knownLogicLevels.length > 1
  const sharedMcu = boards.length > 1 && boards.every((board) => board.mcu && board.mcu === boards[0].mcu)

  return (
    <section className="board-comparison" aria-labelledby="comparison-title">
      <div className="comparison-heading">
        <div>
          <p className="eyebrow">ĐỐI CHIẾU NHANH</p>
          <h3 id="comparison-title">Chọn board theo mục tiêu học</h3>
          <p className="comparison-intro">So sánh nền tảng, ngoại vi và những điều cần biết trước khi nối mạch.</p>
        </div>
        <div className="comparison-actions">
          <span aria-live="polite">{boards.length}/3 board</span>
          <button type="button" onClick={onClear} disabled={!boards.length}>Xóa lựa chọn</button>
        </div>
      </div>

      {!boards.length ? (
        <div className="comparison-empty">Chọn “So sánh” ở một đến ba board trong danh sách để xem khác biệt tại đây.</div>
      ) : (
        <>
          <div className="comparison-table-wrap" role="region" aria-label="Bảng so sánh board, có thể cuộn ngang" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Thông tin</th>
                  {boards.map((board) => <th scope="col" key={board.id}>
                    <div className="comparison-board-heading"><span>{board.name}</span><button type="button" onClick={() => onRemove(board.id)} aria-label={`Bỏ ${board.name} khỏi so sánh`}>Bỏ</button></div>
                    {board.sourceUrl && <a href={board.sourceUrl} target="_blank" rel="noreferrer">Thông số nhà sản xuất ↗</a>}
                  </th>)}
                </tr>
              </thead>
              <tbody>{rows.map((row) => <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {boards.map((board) => <td key={board.id}>{row.value(board) || 'Chưa có dữ liệu đã xác minh'}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          <div className={`comparison-insight ${mixedLogic ? 'insight-warning' : ''}`} role="note">
            <strong>{mixedLogic ? 'Lưu ý điện áp khi kết nối' : 'Cách đọc bảng'}</strong>
            <span>{mixedLogic
              ? `Các board đang chọn có mức logic khác nhau (${knownLogicLevels.join(' và ')}). Trước khi nối tín hiệu giữa chúng, cần kiểm tra khả năng chịu áp và dùng mạch chuyển mức khi cần.`
              : sharedMcu
                ? 'Các board dùng cùng mã MCU, nhưng bố trí chân, mạch nguồn và cổng kết nối vẫn có thể khác. Hãy kiểm tra đúng revision trước khi lắp.'
                : 'Thông số dùng để định hướng lựa chọn. Kiểm tra tài liệu của đúng revision/clone trước khi đấu nối; bảng không thay thế datasheet.'}</span>
          </div>
        </>
      )}
    </section>
  )
}
