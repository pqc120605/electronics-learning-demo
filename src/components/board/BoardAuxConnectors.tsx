import { auxPinId, type AuxConnector } from '../../lib/boardAuxConnectors'

const roles = {
  signal: 'Tín hiệu', ground: 'GND', 'voltage-reference': 'Tham chiếu điện áp', power: 'Nguồn',
  reserved: 'Dành riêng', nc: 'Không kết nối', absent: 'Vị trí không có pad',
}

export function BoardAuxConnectors({ groups, onPick }: { groups: AuxConnector[]; onPick: (id: string) => void }) {
  if (groups.length === 0) return null
  return <details className="board-catalog-source-details">
    <summary>SWD, debug và đầu cắm phụ</summary>
    {groups.map(group => <section key={group.id} aria-label={group.title}>
      <h3>{group.title}</h3>
      <p>{group.note}</p>
      {group.pins.length > 0 && <ul>{group.pins.map(pin => <li key={pin.number ?? pin.label}>
        {pin.anchor && pin.number ? <button type="button" className="button-secondary" onClick={() => onPick(auxPinId(group.id, pin.number!))}>
          {group.id}.{pin.number} · {pin.label}
        </button> : <span>{pin.number ? `${group.id}.${pin.number} · ` : ''}{pin.label}</span>}
        {' · '}{roles[pin.role]}{pin.anchor ? '' : ' · Tra cứu'}
      </li>)}</ul>}
      {group.source && <a href={group.source} target="_blank" rel="noreferrer">Tài liệu đầu cắm ↗</a>}
    </section>)}
  </details>
}
