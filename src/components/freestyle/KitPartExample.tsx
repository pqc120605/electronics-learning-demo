import { useState } from 'react'
import { getKitPartProfile, isDhtPart, keypadContact, keypadKeys } from '../../data/kitPartProfiles'

export function KitPartExample({ type, keypadIndex, onKeypad }: { type: string; keypadIndex?: number; onKeypad: (index: number | undefined) => void }) {
  const [temperature, setTemperature] = useState(24)
  const [humidity, setHumidity] = useState(55)
  const profile = getKitPartProfile(type)
  if (!profile) return null
  const contact = keypadIndex === undefined ? null : keypadContact(keypadIndex)
  return <div className="freestyle-kit-example">
    <h4>{profile.model}</h4>
    <p>{profile.example}</p>
    <p><a href={profile.url} target="_blank" rel="noreferrer">Tài liệu chân · {profile.revision}</a></p>
    <p>{[...profile.pins].sort((a, b) => a.physicalPin - b.physicalPin).map(pin => `${pin.physicalPin} ${pin.name}`).join(' · ')}</p>
    {isDhtPart(type) && <fieldset><legend>Giá trị đặt tay</legend>
      <label>Nhiệt độ · {temperature} °C<input type="range" min="0" max="50" value={temperature} onChange={event => setTemperature(event.target.valueAsNumber)} /></label>
      <label>Độ ẩm · {humidity} %RH<input type="range" min="20" max="90" value={humidity} onChange={event => setHumidity(event.target.valueAsNumber)} /></label>
      <p>Mô hình giáo dục hiển thị giá trị nhập. Sketch và chân DATA chưa đọc dữ liệu từ hai thanh này.</p>
    </fieldset>}
    {type === 'keypad-4x4' && <fieldset><legend>Tiếp điểm bàn phím</legend>
      <label>Phím đóng<select value={keypadIndex ?? ''} onChange={event => onKeypad(event.target.value === '' ? undefined : Number(event.target.value))}>
        <option value="">Thả tất cả</option>{keypadKeys.map((key, index) => <option value={index} key={key}>{key}</option>)}
      </select></label>
      <p role="status">{contact ? `Phím ${contact.key}: đóng ${contact.row.toUpperCase()}–${contact.column.toUpperCase()}.` : 'Tất cả tiếp điểm đang hở.'} Mô hình một phím mỗi lượt.</p>
    </fieldset>}
  </div>
}
