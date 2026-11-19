import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { componentRegistry } from '../../data/componentRegistry'
import type { CircuitPartV2 } from '../../lib/circuitDocV2'
import type { BoardDiagramPresentation } from '../../lib/boardTopView'
import type { BoardModelManifest } from '../board/boardSceneTypes'

type Props = {
  part: CircuitPartV2
  presentation?: BoardDiagramPresentation & { model?: BoardModelManifest }
  onSave?: (value: CircuitPartV2['value']) => boolean | void
  onClose: () => void
}

export function CircuitPartInspector({ part, presentation, onSave, onClose }: Props) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const definition = componentRegistry.find(item => item.id === part.type)
  const isCapacitor = part.type === 'capacitor'
  const canEdit = part.type === 'resistor' || isCapacitor
  const existing = isCapacitor ? part.value?.farad : part.value?.ohm
  const [text, setText] = useState(existing === undefined ? '' : String(existing))
  const [unit, setUnit] = useState(isCapacitor ? 'F' : 'Ω')
  const [notice, setNotice] = useState('')
  const multipliers: Record<string, number> = isCapacitor
    ? { 'pF': 1e-12, 'nF': 1e-9, 'µF': 1e-6, 'F': 1 }
    : { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 }
  const title = part.type === 'board' ? presentation?.name
    : part.type === 'resistor' ? 'Điện trở' : isCapacitor ? 'Tụ điện' : definition?.label
  const boardFeatures = part.type === 'board' ? presentation?.model?.features : undefined

  function save(event: FormEvent) {
    event.preventDefault()
    const value = Number(text.trim().replace(',', '.')) * multipliers[unit]
    if (!text.trim() || !Number.isFinite(value) || value <= 0) {
      setNotice('Nhập trị số lớn hơn 0 và chọn đúng đơn vị.')
      return
    }
    const label = `${text.trim()} ${unit}`
    const saved = onSave?.(isCapacitor ? { farad: value, label } : { ohm: value, label })
    if (saved !== false) setNotice(`Đã đổi thành ${label}.`)
  }

  return <aside className="circuit-part-popup" aria-labelledby={id}>
    <header><h3 id={id} ref={heading} tabIndex={-1}>{title ?? part.type} <small>{part.id}</small></h3><button type="button" onClick={onClose} aria-label="Đóng thông tin linh kiện">×</button></header>
    <p>{part.type === 'board' && presentation ? presentation.revision : definition?.explanation}</p>
    {part.type === 'board' && presentation ? <details><summary>Chân trên board</summary>
      <ul>{Object.entries(presentation.pinLabels).map(([pin, label]) => <li key={pin}>{label} <small>({pin})</small></li>)}</ul>
    </details> : definition && <p>Chân: {definition.pins.map(pin => pin.label).join(' · ')}</p>}
    {boardFeatures && boardFeatures.length > 0 && <details>
      <summary>Linh kiện và cổng trên board</summary>
      <ul>{boardFeatures.map(feature => <li key={feature.id}><details>
        <summary>{feature.name}{feature.designator ? ` · ${feature.designator}` : ''}</summary>
        <p>{feature.plainDescription}</p>
        {feature.connection && <p>{feature.connection}</p>}
      </details></li>)}</ul>
    </details>}
    {part.value && <p>Trị số: {part.value.label ?? (isCapacitor ? `${part.value.farad} F` : `${part.value.ohm} Ω`)}</p>}
    {canEdit && onSave && <form onSubmit={save} className="circuit-part-value">
      <label htmlFor={`${id}-value`}>Trị số {isCapacitor ? 'tụ điện' : 'điện trở'}</label>
      <div>
        <input id={`${id}-value`} inputMode="decimal" maxLength={24} value={text} onChange={event => { setText(event.target.value); setNotice('') }} />
        <select aria-label="Đơn vị trị số" value={unit} onChange={event => { setUnit(event.target.value); setNotice('') }}>
          {Object.keys(multipliers).map(value => <option key={value}>{value}</option>)}
        </select>
        <button type="submit">Áp dụng</button>
      </div>
      <small>Mô phỏng logic giữ nguyên. Trị số hiển thị trên mạch và sơ đồ.</small>
      {notice && <p role="status">{notice}</p>}
    </form>}
  </aside>
}
