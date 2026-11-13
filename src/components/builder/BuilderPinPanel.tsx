import type { ComponentDefinition } from '../../data/componentRegistry'
import type { PartPinConnection } from '../../lib/circuitNets'
import { getVisibleBoardPins } from '../../lib/lessonBoardPins'
import type { CircuitEndpoint, CircuitPart } from '../../types/circuitTopology'

type Props = {
  parts: CircuitPart[]
  part?: CircuitPart
  definition?: ComponentDefinition
  connections: PartPinConnection[]
  wireMode: boolean
  pending: string | null
  tracedPin: string
  lessonBoardPinIds?: readonly string[]
  showAllBoardPins: boolean
  onToggleBoardPins: () => void
  nameFor: (part: CircuitPart) => string
  describe: (endpoint: CircuitEndpoint) => string
  pinLabel: (type: string, index: number, fallback: string) => string
  onSelectPart: (id: string) => void
  onPin: (key: string, connected: boolean) => void
  onToggleWire: () => void
  onRotate: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

/** The full-size way to reach every pin and part action; pins drawn on the canvas are only a pointer shortcut. */
export function BuilderPinPanel({ parts, part, definition, connections, wireMode, pending, tracedPin, lessonBoardPinIds = [], showAllBoardPins, onToggleBoardPins, nameFor, describe, pinLabel, onSelectPart, onPin, onToggleWire, onRotate, onDuplicate, onRemove }: Props) {
  const instruction = !wireMode ? 'Chọn một chân để tô các dây cùng net ở view lắp mạch, sơ đồ và 3D.' : pending ? 'Đã chọn chân thứ nhất. Đổi linh kiện nếu cần, rồi chọn chân thứ hai.' : 'Chọn chân thứ nhất của dây mới.'
  const isBoard = part?.type === 'board'
  const visiblePins = definition ? isBoard ? getVisibleBoardPins(definition.pins, lessonBoardPinIds, showAllBoardPins) : definition.pins : []
  const hasHiddenBoardPins = isBoard && Boolean(definition?.pins.some((pin) => !lessonBoardPinIds.includes(pin.id)))
  return <section className="builder-pin-panel" aria-label="Chân và thao tác của linh kiện">
    <div className="builder-pin-panel-head">
      <label>Linh kiện<select value={part?.id ?? ''} onChange={(event) => onSelectPart(event.target.value)}>{!part && <option value="">Chọn linh kiện</option>}{parts.map((item) => <option key={item.id} value={item.id}>{nameFor(item)}</option>)}</select></label>
      <div role="group" aria-label="Thao tác với linh kiện">
        <button type="button" aria-pressed={wireMode} onClick={onToggleWire}>Nối dây</button>
        {part && <button type="button" onClick={() => onRotate(part.id)}>Xoay 90°</button>}
        {part && part.type !== 'board' && <button type="button" onClick={() => onDuplicate(part.id)}>Sao chép rời</button>}
        {part && part.type !== 'board' && <button type="button" onClick={() => onRemove(part.id)}>Xóa</button>}
      </div>
    </div>
    <p>{instruction}</p>
    {isBoard && <div className="builder-pin-scope"><span>{showAllBoardPins ? 'Đang hiện mọi chân của profile học tập.' : `${visiblePins.length} chân liên quan tới bài và dây hiện tại.`}</span>{hasHiddenBoardPins && <button type="button" aria-expanded={showAllBoardPins} onClick={onToggleBoardPins}>{showAllBoardPins ? 'Chỉ hiện chân dùng trong bài' : 'Hiện tất cả chân'}</button>}</div>}
    {part && definition && visiblePins.length > 0 && <ul>{visiblePins.map((pin) => {
      const index = definition.pins.findIndex((item) => item.id === pin.id)
      const key = `${part.id}:${pin.id}`
      const peers = connections.find((item) => item.pinId === pin.id)?.peers ?? []
      return <li key={pin.id}><button type="button" className={`builder-pin builder-pin-${pin.electricalType}`} aria-pressed={wireMode ? pending === key : tracedPin === key} onClick={() => onPin(key, peers.length > 0)}><b>{pinLabel(part.type, index, pin.label)}</b><small>{peers.length ? peers.map(describe).join(', ') : 'Chưa nối'}</small></button></li>
    })}</ul>}
    {isBoard && visiblePins.length === 0 && <p className="builder-pin-empty">Mạch mẫu này chưa dùng chân GPIO của board. <button type="button" onClick={onToggleBoardPins}>Hiện tất cả chân</button></p>}
    <small className="builder-net-note">Net ở đây chỉ là các điểm được nối bằng dây, không phải dòng điện đã tính, và chưa liên kết với đường đồng PCB.</small>
  </section>
}
