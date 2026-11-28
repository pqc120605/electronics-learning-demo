import type { BoardPin, BoardPinoutEvidence } from './boardSceneTypes'

type BoardPinoutExplorerProps = {
  pins: BoardPin[]
  selectedPinId: string
  onSelectPin: (pinId: string) => void
  evidence?: BoardPinoutEvidence
  coordinatePicking?: boolean
  standalone?: boolean
}

export function BoardPinoutExplorer({ pins, selectedPinId, onSelectPin, evidence, coordinatePicking, standalone = false }: BoardPinoutExplorerProps) {
  const hasCoordinatePicking = coordinatePicking === true
  const canClickModel = hasCoordinatePicking && !standalone
  const selectedPin = pins.find((pin) => pin.id === selectedPinId)
  const groups = new Map<string, { side: BoardPin['side']; header: string; pins: BoardPin[] }>()
  for (const pin of [...pins].sort((a, b) => a.position - b.position)) {
    const header = pin.headerReference ?? (pin.side === 'left' ? 'Header trái' : pin.side === 'right' ? 'Header phải' : 'Theo tên pin hãng')
    const key = `${pin.side}:${header}`
    const existing = groups.get(key)
    if (existing) existing.pins.push(pin)
    else groups.set(key, { side: pin.side, header, pins: [pin] })
  }

  return <section className="board-pinout-explorer" aria-labelledby="board-pinout-heading">
    <div className="board-pinout-explorer-heading">
      <p className="eyebrow">PINOUT THAM CHIẾU · {pins.length} CHÂN</p>
      <h4 id="board-pinout-heading">{canClickModel ? 'Chọn chân header' : 'Tra cứu pinout theo tên'}</h4>
      <p>{standalone ? 'Chọn tên chân trong danh sách để tra chức năng và lưu ý.'
        : canClickModel ? 'Chọn một chân trong danh sách hoặc bấm vào đúng vị trí trên mô hình 3D để xem chức năng và lưu ý.'
        : 'Chọn tên chân trong danh sách để tra chức năng và lưu ý. Vị trí pad chưa được xác nhận để chọn trực tiếp trên mô hình.'}</p>
    </div>
    {selectedPin && <article className="board-selected-pin-details" aria-live="polite">
      <div><span>ĐANG XEM{selectedPin.headerReference ? ` · ${selectedPin.headerReference}` : ''}{selectedPin.padNumber ? ` · PAD ${selectedPin.padNumber}` : ''}</span><h5>{selectedPin.label}{selectedPin.gpio === undefined ? '' : ` · GPIO${selectedPin.gpio}`}</h5></div>
      <p>{selectedPin.plainDescription}</p>
      <dl>
        {selectedPin.catalog && <>
          <dt>Phiên bản đối chiếu</dt><dd>{selectedPin.catalog.revision}</dd>
          {selectedPin.catalog.status !== 'named' && <><dt>Trạng thái</dt><dd>
            {{ nc: 'Không kết nối ở phiên bản này', reserved: 'Chân dành riêng', unresolved: 'Chưa đủ dữ liệu đối chiếu' }[selectedPin.catalog.status]}
          </dd></>}
        </>}
        <dt>{hasCoordinatePicking || selectedPin.netName ? 'Net / tên pad trong CAD' : 'Tên chân tham chiếu'}</dt>
        <dd>{selectedPin.netName ?? (hasCoordinatePicking ? 'Chưa có trong hồ sơ chân này' : selectedPin.label)}</dd>
        <dt>Vai trò</dt><dd>{selectedPin.technicalRole}</dd>
        <dt>{hasCoordinatePicking ? 'Nối trên board' : 'Trạng thái đối chiếu CAD'}</dt><dd>{selectedPin.connection}</dd>
      </dl>
      <p className="board-pin-safety-note" role="note">Lưu ý: {selectedPin.safetyNote}</p>
      <div className="board-pin-functions">{selectedPin.functions.map((name) => <span key={name}>{name}</span>)}</div>
    </article>}
    <div className="board-pinout-header-groups">
      {[...groups.values()].map((group) => <div className={`board-pinout-header-group ${group.side === 'reference' ? 'board-pinout-header-group-reference' : ''}`} key={`${group.header}-${group.side}`} role="group" aria-label={`Chọn nhóm chân ${group.header}`}>
        <h5>{group.header}</h5>
        <div>{group.pins.map((pin) => {
          const secondary = pin.gpio === undefined ? pin.functions[0] : `GPIO${pin.gpio}`
          return <button key={pin.id} type="button" aria-pressed={selectedPinId === pin.id} className={selectedPinId === pin.id ? 'board-pinout-pin-active' : ''} onClick={() => onSelectPin(pin.id)}>
            <strong>{pin.label}</strong>{' '}<small>{secondary}</small>
            {pin.padNumber && <span className="sr-only"> {group.header} chân {pin.padNumber}</span>}
          </button>
        })}</div>
      </div>)}
    </div>
    <p className="board-pinout-explorer-note">{evidence?.summary ?? 'Danh sách chân là dữ liệu tham chiếu của model hiện tại; đối chiếu đúng revision và tài liệu board trước khi đấu thật.'} Chọn chân chỉ cập nhật thông tin; chưa tô đường đồng/net, chạy firmware hoặc mô phỏng điện.</p>
    {evidence?.sourceUrl && <a className="board-pinout-source" href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceLabel ?? 'Mở tài liệu nguồn board'} ↗</a>}
  </section>
}
