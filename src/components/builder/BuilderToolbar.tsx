import type { SimulationTarget } from '../../data/simulationTargets'
import { simulationTargets } from '../../data/simulationTargets'
import type { BuilderLessonId } from '../../data/builderLessons'

type Props = {
  board: string
  onBoardChange: (board: string) => void
  saveStatus: 'saved' | 'error'
  target: SimulationTarget
  outputAlias: number
  inputAlias: string
  onToggleWire: () => void
  wireMode: boolean
  onRun: () => void
  runDisabled?: boolean
  circuitDocV2Active?: boolean
  running: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  lessonId: BuilderLessonId
  onReset: () => void
  onStartWiringPractice: () => void
  canClearWires: boolean
}

export function BuilderToolbar({ board, onBoardChange, saveStatus, target, outputAlias, inputAlias, onToggleWire, wireMode, onRun, runDisabled = false, circuitDocV2Active = false, running, canUndo, canRedo, onUndo, onRedo, lessonId, onReset, onStartWiringPractice, canClearWires }: Props) {
  const isConcept = lessonId === 'buck-boost-concept' || lessonId === 'dc-motor-driver' || lessonId === 'mosfet-switch'
  return <div className="builder-toolbar">
    <div><strong>Workspace học tập</strong><small role="status" aria-live="polite">{saveStatus === 'saved' ? 'Đã lưu trên thiết bị này' : 'Không lưu được bản nháp trên trình duyệt này'}</small></div>
    <label>Board <span className="builder-inline-help">{circuitDocV2Active ? 'Board của mạch v5 được giữ nguyên trong bản nháp này.' : 'Đổi board sẽ nạp lại code mẫu theo pin profile.'}</span><select aria-label="Chọn board mô phỏng" value={board} onChange={(event) => onBoardChange(event.target.value)} disabled={circuitDocV2Active}>{simulationTargets.map((item) => <option key={item.boardId} value={item.boardId}>{item.name} · {item.pinLabel} · {item.logicLevel}</option>)}</select></label>
    <div className="builder-actions">
      <button type="button" className="builder-history-action" onClick={onUndo} disabled={circuitDocV2Active || !canUndo} title={circuitDocV2Active ? 'Mạch v5 chưa dùng lịch sử schema 4.' : 'Hoàn tác thay đổi linh kiện hoặc dây · Ctrl+Z'}>↶ Hoàn tác</button>
      <button type="button" className="builder-history-action" onClick={onRedo} disabled={circuitDocV2Active || !canRedo} title={circuitDocV2Active ? 'Mạch v5 chưa dùng lịch sử schema 4.' : 'Làm lại thay đổi linh kiện hoặc dây · Ctrl+Shift+Z'}>↷ Làm lại</button>
      <button type="button" onClick={onToggleWire} aria-pressed={wireMode} disabled={circuitDocV2Active} title={circuitDocV2Active ? 'Dùng chế độ “Lắp dây · breadboard” để chọn, kéo và sửa endpoint.' : 'Có thể kéo từ chân này sang chân khác trên bàn lắp; chế độ này cho phép chọn lần lượt hai chân.'}>{wireMode ? '✓ Chọn 2 chân' : '⌁ Nối dây'}</button>
      <button type="button" onClick={onRun} className="builder-run" disabled={runDisabled} title={runDisabled ? 'Provider hiện chưa nhận topology CircuitDocV2; không chạy trace của mạch workspace cũ để tránh tô sáng sai.' : undefined}>{running ? 'Tạm dừng' : isConcept ? '▶ Bắt đầu luồng' : '▶ Chạy bài mẫu'}</button>
      <button type="button" className="builder-reset" onClick={onReset} disabled={circuitDocV2Active}>Đặt lại bài</button>
      <button type="button" onClick={onStartWiringPractice} disabled={circuitDocV2Active || !canClearWires}>Tự nối dây từ đầu</button>
    </div>
    <p className="builder-target-note">{target.mcu} · {target.architecture} · {target.logicLevel}. Chân ra {target.pinLabel} ({outputAlias}); chân vào alias {inputAlias}. Đây là mapping dùng cho bài học và không xác nhận code biên dịch cho mọi board/clone cùng tên. {target.sourceUrl && <a href={target.sourceUrl} target="_blank" rel="noreferrer">Tài liệu board ↗</a>}</p>
  </div>
}
